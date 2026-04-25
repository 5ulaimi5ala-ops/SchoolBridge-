
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Class, Student, Role, Notification, Message, HelpRequest } from './types';
import { MOCK_STUDENTS, OMANI_SUBJECTS } from './constants';
import { auth, db, googleProvider } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  or,
  orderBy, 
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface DataContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  classes: Class[];
  students: Student[];
  users: User[];
  notifications: Notification[];
  messages: Message[];
  helpRequests: HelpRequest[];
  updateStudent: (student: Student) => Promise<void>;
  createClass: (teacherId: string, className: string, subjects: string[], studentData: { email: string, parentEmail?: string }[]) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, text: string) => Promise<void>;
  sendHelpRequest: (studentId: string, subject: string, message: string, isAnonymous: boolean) => Promise<void>;
  resolveHelpRequest: (requestId: string) => Promise<void>;
  isLoggedIn: boolean;
  signInWithGoogle: () => Promise<void>;
  completeProfile: (name: string, role: Role, studentEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  markNotificationRead: (id: string, action?: boolean) => Promise<void>;
  clearNotificationsByType: (type: 'message' | 'help' | 'general' | 'invite') => Promise<void>;
  updateProfile: (avatar?: string, bio?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: fbUser.uid, ...userDoc.data() } as User);
        } else {
          // Authenticated but no profile yet
          setCurrentUser(null);
        }
        setIsLoggedIn(true);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!currentUser) return;

    // Users listener - Teachers see all, others see teachers + themselves
    const usersQuery = currentUser.role === 'teacher' 
      ? collection(db, 'users')
      : query(collection(db, 'users'), or(where('role', '==', 'teacher'), where('id', '==', currentUser.id)));
    
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    // Classes listener - All signed in can read
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'classes'));

    // Students listener - Teacher sees all, parent sees child, student sees themselves
    let studentsQuery;
    if (currentUser.role === 'teacher') {
      studentsQuery = collection(db, 'students');
    } else if (currentUser.role === 'parent' && currentUser.studentEmail) {
      studentsQuery = query(collection(db, 'students'), where('email', '==', currentUser.studentEmail));
    } else {
      studentsQuery = query(collection(db, 'students'), where('id', '==', currentUser.id));
    }

    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'students'));

    // Notifications listener
    const unsubNotis = onSnapshot(
      query(collection(db, 'notifications'), where('to', '==', currentUser.email), orderBy('timestamp', 'desc')),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'notifications')
    );

    // Messages listener - Only see messages you sent or received
    const msgsQuery = query(
      collection(db, 'messages'), 
      or(where('senderId', '==', currentUser.id), where('receiverId', '==', currentUser.id))
    );

    const unsubMsgs = onSnapshot(msgsQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      // Sort manually because combined query with orderBy might need index
      setMessages(msgs.sort((a, b) => {
        const timeA = a.timestamp || '';
        const timeB = b.timestamp || '';
        return timeA.localeCompare(timeB);
      }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'messages'));

    // Help Requests listener - Teacher sees all, student sees their own
    const helpQuery = currentUser.role === 'teacher'
      ? collection(db, 'helpRequests')
      : query(collection(db, 'helpRequests'), where('studentId', '==', currentUser.id));

    const unsubHelp = onSnapshot(helpQuery, (snapshot) => {
      setHelpRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'helpRequests'));

    return () => {
      unsubUsers();
      unsubClasses();
      unsubStudents();
      unsubNotis();
      unsubMsgs();
      unsubHelp();
    };
  }, [currentUser]);

  const sendNotification = async (to: string, title: string, message: string, type: Notification['type'], payload?: any) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        to,
        title,
        message,
        type,
        timestamp: Date.now(),
        read: false,
        payload: payload || null
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      throw err;
    }
  };

  const completeProfile = async (name: string, role: Role, studentEmail?: string) => {
    if (!auth.currentUser) return;
    try {
      const email = auth.currentUser.email || '';
      const user: User = {
        id: auth.currentUser.uid,
        email,
        name,
        role,
        studentEmail,
        onboarded: false
      };
      await setDoc(doc(db, 'users', auth.currentUser.uid), user);
      
      // Initial Student record if student role
      if (role === 'student') {
        const student: Student = {
          id: auth.currentUser.uid,
          email,
          name,
          grade: 'Pending',
          riskLevel: 'low',
          issueSummary: 'Newly registered student.',
          attendance: 100,
          missingTasks: [],
          recentScores: [],
          subjects: [],
          points: 0,
          level: 1,
          badges: [],
          moodHistory: [],
          strengths: [],
          weaknesses: [],
          isPeerMentor: false
        };
        await setDoc(doc(db, 'students', auth.currentUser.uid), student);
      }
      
      setCurrentUser(user);
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const sendMessage = async (senderId: string, receiverId: string, text: string) => {
    const path = 'messages';
    try {
      await addDoc(collection(db, path), {
        senderId,
        receiverId,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      });

      const recipient = users.find(u => u.id === receiverId);
      if (recipient) {
        await sendNotification(
          recipient.email,
          `New Message from ${currentUser?.name}`,
          text,
          'message',
          { screen: 'private_chat' }
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const sendHelpRequest = async (studentId: string, subject: string, message: string, isAnonymous: boolean) => {
    const path = 'helpRequests';
    try {
      await addDoc(collection(db, path), {
        studentId,
        subject,
        message,
        timestamp: new Date().toLocaleString(),
        isAnonymous,
        status: 'pending'
      });

      // Notify teacher
      const studentUser = users.find(u => u.id === studentId);
      if (studentUser?.classId) {
        const classObj = classes.find(c => c.id === studentUser.classId);
        if (classObj) {
          const teacher = users.find(u => u.id === classObj.teacherId);
          if (teacher) {
            await sendNotification(
              teacher.email,
              `Help Request: ${subject}`,
              isAnonymous ? 'An anonymous student needs help.' : `${studentUser.name} needs help.`,
              'help',
              { screen: 'dashboard', data: 'questions' }
            );
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const resolveHelpRequest = async (requestId: string) => {
    const path = `helpRequests/${requestId}`;
    try {
      await updateDoc(doc(db, 'helpRequests', requestId), { status: 'resolved' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    const path = `students/${updatedStudent.id}`;
    try {
      const { id, ...data } = updatedStudent;
      await setDoc(doc(db, 'students', id), data, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateProfile = async (avatar?: string, bio?: string) => {
    if (!currentUser) return;
    const path = `users/${currentUser.id}`;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { avatar, bio });
      setCurrentUser(prev => prev ? { ...prev, avatar, bio } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const markNotificationRead = async (id: string) => {
    const path = `notifications/${id}`;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const clearNotificationsByType = async (type: Notification['type']) => {
    const path = 'notifications';
    try {
      const unread = notifications.filter(n => n.type === type && !n.read);
      const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
      await Promise.all(promises);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const createClass = async (teacherId: string, className: string, subjects: string[], studentData: { email: string, parentEmail?: string }[]) => {
    const path = 'classes';
    try {
      const newClassRef = doc(collection(db, 'classes'));
      const classId = newClassRef.id;
      
      const newClass: Class = {
        id: classId,
        name: className,
        teacherId,
        subjects,
        students: studentData.map(s => ({ email: s.email })),
        parents: studentData.filter(s => s.parentEmail).map(s => ({ email: s.parentEmail!, studentEmail: s.email }))
      };

      await setDoc(newClassRef, newClass);

      // Update teacher profile
      await updateDoc(doc(db, 'users', teacherId), { classId, onboarded: true });
      setCurrentUser(prev => prev ? { ...prev, classId, onboarded: true } : null);

      // We won't auto-create students here, they should sign up themselves
      // But we send them an "invite" notification which will be saved in DB
      for (const s of studentData) {
        await sendNotification(
          s.email,
          'Invite to Class',
          `You've been added to ${className}. Sign up to start!`,
          'invite',
          { screen: 'dashboard' }
        );
        if (s.parentEmail) {
          await sendNotification(
            s.parentEmail,
            'Your Child Added',
            `Your child has been added to ${className}.`,
            'invite',
            { screen: 'dashboard' }
          );
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      classes, 
      students, 
      users,
      notifications,
      messages,
      helpRequests,
      updateStudent, 
      createClass,
      sendMessage,
      sendHelpRequest,
      resolveHelpRequest,
      isLoggedIn,
      signInWithGoogle,
      completeProfile,
      logout,
      markNotificationRead,
      clearNotificationsByType,
      updateProfile
    }}>
      {!loading && children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

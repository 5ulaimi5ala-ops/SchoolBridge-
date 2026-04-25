
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Class, Student, Role, Notification, Message, HelpRequest } from './types';
import { MOCK_STUDENTS, OMANI_SUBJECTS } from './constants';
import { supabase } from './services/supabase';

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
  clearNotificationsByType: (type: Notification['type']) => Promise<void>;
  updateProfile: (avatar?: string, bio?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!session;

  // Auth Listener
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setCurrentUser(data as User);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Listeners and Initial Fetch
  useEffect(() => {
    if (!currentUser || !supabase) return;

    const fetchData = async () => {
      // Users
      const usersQuery = currentUser.role === 'teacher' 
        ? supabase.from('users').select('*')
        : supabase.from('users').select('*').or(`role.eq.teacher,id.eq.${currentUser.id}`);
      const { data: usersData } = await usersQuery;
      if (usersData) setUsers(usersData as User[]);

      // Classes
      const { data: classesData } = await supabase.from('classes').select('*');
      if (classesData) setClasses(classesData as Class[]);

      // Students
      let studentsQuery = supabase.from('students').select('*');
      if (currentUser.role === 'parent' && currentUser.studentEmail) {
        studentsQuery = studentsQuery.eq('email', currentUser.studentEmail);
      } else if (currentUser.role !== 'teacher') {
        studentsQuery = studentsQuery.eq('id', currentUser.id);
      }
      const { data: studentsData } = await studentsQuery;
      if (studentsData) setStudents(studentsData as Student[]);

      // Notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('to', currentUser.email)
        .order('timestamp', { ascending: false });
      if (notificationsData) setNotifications(notificationsData as Notification[]);

      // Messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`senderId.eq.${currentUser.id},receiverId.eq.${currentUser.id}`)
        .order('timestamp', { ascending: true });
      if (messagesData) setMessages(messagesData as Message[]);

      // Help Requests
      let helpQuery = supabase.from('help_requests').select('*');
      if (currentUser.role !== 'teacher') {
        helpQuery = helpQuery.eq('studentId', currentUser.id);
      }
      const { data: helpData } = await helpQuery;
      if (helpData) setHelpRequests(helpData as HelpRequest[]);
    };

    fetchData();

    // Subscribe to all changes
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        if (payload.new && (payload.new as any).to === currentUser.email) fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        if (payload.new && ((payload.new as any).senderId === currentUser.id || (payload.new as any).receiverId === currentUser.id)) fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const completeProfile = async (name: string, role: Role, studentEmail?: string) => {
    if (!supabase) return;
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (!sbUser) return;

    try {
      const email = sbUser.email || '';
      const user: User = {
        id: sbUser.id,
        email,
        name,
        role,
        studentEmail,
        onboarded: true
      };
      
      const { error: userError } = await supabase.from('users').insert(user);
      if (userError) throw userError;
      
      if (role === 'student') {
        const student: Student = {
          id: sbUser.id,
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
        await supabase.from('students').insert(student);
      }
      
      setCurrentUser(user);
    } catch (err) {
      throw err;
    }
  };

  const updateProfile = async (avatar?: string, bio?: string) => {
    if (!currentUser || !supabase) return;
    await supabase.from('users').update({ avatar, bio }).eq('id', currentUser.id);
    setCurrentUser(prev => prev ? { ...prev, avatar, bio } : null);
  };

  const sendNotification = async (to: string, title: string, message: string, type: Notification['type'], payload?: any) => {
    if (!supabase) return;
    await supabase.from('notifications').insert({
      to,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      payload: payload || null
    });
  };

  const sendMessage = async (senderId: string, receiverId: string, text: string) => {
    if (!supabase) return;
    await supabase.from('messages').insert({
      senderId,
      receiverId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    });

    const { data: recipient } = await supabase.from('users').select('email').eq('id', receiverId).single();
    if (recipient) {
      await sendNotification(
        recipient.email,
        `New Message from ${currentUser?.name}`,
        text,
        'message',
        { screen: 'private_chat' }
      );
    }
  };

  const sendHelpRequest = async (studentId: string, subject: string, message: string, isAnonymous: boolean) => {
    if (!supabase) return;
    await supabase.from('help_requests').insert({
      studentId,
      subject,
      message,
      timestamp: new Date().toLocaleString(),
      isAnonymous,
      status: 'pending'
    });

    // Notify teacher
    const { data: studentUser } = await supabase.from('users').select('name, classId').eq('id', studentId).single();
    if (studentUser?.classId) {
      const { data: classObj } = await supabase.from('classes').select('teacherId').eq('id', studentUser.classId).single();
      if (classObj) {
        const { data: teacher } = await supabase.from('users').select('email').eq('id', classObj.teacherId).single();
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
  };

  const resolveHelpRequest = async (requestId: string) => {
    if (!supabase) return;
    await supabase.from('help_requests').update({ status: 'resolved' }).eq('id', requestId);
  };

  const updateStudent = async (updatedStudent: Student) => {
    if (!supabase) return;
    const { id, ...data } = updatedStudent;
    await supabase.from('students').update(data).eq('id', id);
  };

  const markNotificationRead = async (id: string) => {
    if (!supabase) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const clearNotificationsByType = async (type: Notification['type']) => {
    if (!currentUser || !supabase) return;
    await supabase.from('notifications').update({ read: true }).eq('to', currentUser.email).eq('type', type);
  };

  const createClass = async (teacherId: string, className: string, subjects: string[], studentData: { email: string, parentEmail?: string }[]) => {
    if (!supabase) return;
    const classId = crypto.randomUUID();
    const newClass: Class = {
      id: classId,
      name: className,
      teacherId,
      subjects,
      students: studentData.map(s => ({ email: s.email })),
      parents: studentData.filter(s => s.parentEmail).map(s => ({ email: s.parentEmail!, studentEmail: s.email }))
    };

    await supabase.from('classes').insert(newClass);
    await supabase.from('users').update({ classId, onboarded: true }).eq('id', teacherId);
    setCurrentUser(prev => prev ? { ...prev, classId, onboarded: true } : null);

    for (const s of studentData) {
      await sendNotification(s.email, 'Invite to Class', `You've been added to ${className}. Sign up to start!`, 'invite', { screen: 'dashboard' });
      if (s.parentEmail) {
        await sendNotification(s.parentEmail, 'Your Child Added', `Your child has been added to ${className}.`, 'invite', { screen: 'dashboard' });
      }
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

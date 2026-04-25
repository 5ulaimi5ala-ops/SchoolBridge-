
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Class, Student, Role, Notification, Message, HelpRequest } from './types';
import { MOCK_STUDENTS, OMANI_SUBJECTS } from './constants';

const PINS = {
  student: "student123",
  teacher: "teacher123",
  parent:  "parent123"
};

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
  loginWithPin: (role: Role, pin: string) => Promise<void>;
  completeProfile: (name: string, role: Role, studentEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  markNotificationRead: (id: string, action?: boolean) => Promise<void>;
  clearNotificationsByType: (type: Notification['type']) => Promise<void>;
  updateProfile: (avatar?: string, bio?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper for local storage
const STORAGE_KEY = 'schoolbridge_user';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!currentUser;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      // In a real app we'd fetch data here, but since this is mock-only local now,
      // we just prepare the state.
      const mockUsers: User[] = [
        { id: 't1', name: 'Al-Hasan (Teacher)', role: 'teacher', email: 'teacher@sb.local', onboarded: true },
        ...MOCK_STUDENTS.map(s => ({ id: s.id, name: s.name, role: 'student' as Role, email: s.email, onboarded: true })),
        { id: 'p1', name: 'Ahmed\'s Father', role: 'parent', email: 'parent@sb.local', studentEmail: 'ahmed@sb.local', onboarded: true }
      ];
      setUsers(mockUsers);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  const loginWithPin = async (role: Role, pin: string) => {
    if (pin === PINS[role as keyof typeof PINS]) {
      // Create a default user based on role for demo purposes
      let user: User;
      if (role === 'teacher') {
        user = { id: 't1', name: 'Al-Hasan', role: 'teacher', email: 'teacher@sb.local', onboarded: true };
      } else if (role === 'parent') {
        user = { id: 'p1', name: 'Parent Al-Said', role: 'parent', email: 'parent@sb.local', studentEmail: 'ahmed@sb.local', onboarded: true };
      } else {
        user = { id: '1', name: 'Ahmed Al-Said', role: 'student', email: 'ahmed@sb.local', onboarded: true };
      }
      setCurrentUser(user);
    } else {
      throw new Error('Incorrect PIN. Please try again.');
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const completeProfile = async (name: string, role: Role, studentEmail?: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, name, role, studentEmail, onboarded: true };
    setCurrentUser(updatedUser);
  };

  const updateProfile = async (avatar?: string, bio?: string) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, avatar, bio });
  };

  const sendNotification = async (to: string, title: string, message: string, type: Notification['type'], payload?: any) => {
    const newNoti: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      payload: payload || null
    };
    setNotifications(prev => [newNoti, ...prev]);
  };

  const sendMessage = async (senderId: string, receiverId: string, text: string) => {
    const newMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const sendHelpRequest = async (studentId: string, subject: string, message: string, isAnonymous: boolean) => {
    const newRequest: HelpRequest = {
      id: Math.random().toString(36).substr(2, 9),
      studentId,
      subject,
      message,
      timestamp: new Date().toLocaleString(),
      isAnonymous,
      status: 'pending'
    };
    setHelpRequests(prev => [...prev, newRequest]);
  };

  const resolveHelpRequest = async (requestId: string) => {
    setHelpRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'resolved' } : r));
  };

  const updateStudent = async (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotificationsByType = async (type: Notification['type']) => {
    setNotifications(prev => prev.map(n => n.type === type ? { ...n, read: true } : n));
  };

  const createClass = async (teacherId: string, className: string, subjects: string[], studentData: { email: string, parentEmail?: string }[]) => {
    const classId = Math.random().toString(36).substr(2, 9);
    const newClass: Class = {
      id: classId,
      name: className,
      teacherId,
      subjects,
      students: studentData.map(s => ({ email: s.email })),
      parents: studentData.filter(s => s.parentEmail).map(s => ({ email: s.parentEmail!, studentEmail: s.email }))
    };
    setClasses(prev => [...prev, newClass]);
    if (currentUser) {
      setCurrentUser({ ...currentUser, classId, onboarded: true });
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
      loginWithPin,
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

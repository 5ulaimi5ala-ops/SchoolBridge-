
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Class, Student, Role, Subject, RiskLevel } from './types';
import { MOCK_STUDENTS, OMANI_SUBJECTS } from './constants';

interface DataContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  classes: Class[];
  students: Student[];
  users: User[];
  notifications: Notification[];
  updateStudent: (student: Student) => void;
  createClass: (teacherId: string, className: string, subjects: string[], studentData: { email: string, parentEmail?: string }[]) => void;
  isLoggedIn: boolean;
  login: (email: string, role: Role) => boolean;
  logout: () => void;
  markNotificationRead: (id: string) => void;
}

export interface Notification {
  id: string;
  to: string;
  title: string;
  message: string;
  type: 'invite' | 'alert' | 'update';
  timestamp: number;
  read: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sb_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [classes, setClasses] = useState<Class[]>(() => {
    const saved = localStorage.getItem('sb_classes');
    return saved ? JSON.parse(saved) : [];
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('sb_students');
    return saved ? JSON.parse(saved) : MOCK_STUDENTS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('sb_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sb_users');
    if (saved) return JSON.parse(saved);
    
    // Seed some initial users to match MOCK_STUDENTS
    return [
      { id: '1', email: 'ahmed@gmail.com', name: 'Ahmed Al-Said', role: 'student', classId: 'c1' },
      { id: '2', email: 'fatima@gmail.com', name: 'Fatima Al-Balushi', role: 'student', classId: 'c1' },
      { id: '3', email: 'salim@gmail.com', name: 'Salim Al-Harthy', role: 'student', classId: 'c1' },
      { id: 't1', email: 'teacher@gmail.com', name: 'Ms. Henderson', role: 'teacher', classId: 'c1', onboarded: true },
      { id: 'p1', email: 'parent@gmail.com', name: 'Ahmed\'s Parent', role: 'parent', studentEmail: 'ahmed@gmail.com' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sb_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sb_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('sb_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('sb_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sb_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const login = (email: string, role: Role) => {
    const user = users.find(u => u.email === email && u.role === role);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    
    // Auto-create if not found but requested role is correct for a "new" user
    // In a real app we'd need sign up, but here we simulate onboarding
    // For this request, we allow any Gmail to log in
    if (email.toLowerCase().includes('@gmail.com')) {
      const studentId = `u${Date.now()}`;
      const baseName = email.split('@')[0];
      const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      
      const newUser: User = {
        id: studentId,
        email: email.toLowerCase(),
        name: displayName,
        role,
        onboarded: false // This will trigger TeacherSetup if role is teacher
      };
      
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);

      // If it's a student, we also need to create a student object so the dashboard works
      if (role === 'student') {
        const newStudent: Student = {
          id: studentId,
          name: displayName,
          grade: 'Unassigned Grade',
          riskLevel: 'low',
          issueSummary: 'New student added via direct login.',
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
        setStudents(prev => [...prev, newStudent]);
      }
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const createClass = (teacherId: string, className: string, subjects: string[], studentData: { email: string, parentEmail?: string }[]) => {
    const classId = `c${Date.now()}`;
    const newClass: Class = {
      id: classId,
      name: className,
      teacherId,
      subjects,
      students: studentData.map(s => ({ email: s.email })),
      parents: studentData.filter(s => s.parentEmail).map(s => ({ email: s.parentEmail!, studentEmail: s.email }))
    };

    setClasses(prev => [...prev, newClass]);

    // Update teacher
    setUsers(prev => prev.map(u => u.id === teacherId ? { ...u, classId, onboarded: true } : u));
    setCurrentUser(prev => prev?.id === teacherId ? { ...prev, classId, onboarded: true } : prev);

    // Create student and parent users
    const newUsers: User[] = [];
    const newStudents: Student[] = [];

    studentData.forEach(s => {
      const studentId = `s${Math.random().toString(36).substr(2, 9)}`;
      const studentName = s.email.split('@')[0].charAt(0).toUpperCase() + s.email.split('@')[0].slice(1);
      
      newUsers.push({
        id: studentId,
        email: s.email,
        name: studentName,
        role: 'student',
        classId
      });

      newStudents.push({
        id: studentId,
        name: studentName,
        grade: className,
        riskLevel: 'low',
        issueSummary: 'New student onboarded.',
        attendance: 100,
        missingTasks: [],
        recentScores: [],
        subjects: subjects.map(subId => ({
          id: subId,
          name: OMANI_SUBJECTS.find(os => os.id === subId)?.name || subId,
          progress: 0,
          score: 0,
          risk: 'low'
        })),
        points: 0,
        level: 1,
        badges: [],
        moodHistory: [],
        strengths: [],
        weaknesses: [],
        isPeerMentor: false
      });

      if (s.parentEmail) {
        newUsers.push({
          id: `p${Math.random().toString(36).substr(2, 9)}`,
          email: s.parentEmail,
          name: `${studentName}'s Parent`,
          role: 'parent',
          studentEmail: s.email
        });
      }
    });

    setUsers(prev => [...prev, ...newUsers]);
    setStudents(prev => [...prev, ...newStudents]);

    // Simulate sending Gmail notifications
    const inviteNotifications: Notification[] = [];
    studentData.forEach(s => {
      inviteNotifications.push({
        id: `noti_${Date.now()}_${Math.random()}`,
        to: s.email,
        title: 'Join your Classroom on SchoolBridge',
        message: `Your teacher from ${className} has invited you to join the classroom. Login now to see your subjects and progress!`,
        type: 'invite',
        timestamp: Date.now(),
        read: false
      });

      if (s.parentEmail) {
        inviteNotifications.push({
          id: `noti_${Date.now()}_${Math.random()}`,
          to: s.parentEmail,
          title: 'Your child has been added to SchoolBridge',
          message: `Your child ${s.email.split('@')[0]} has been added to the ${className} classroom. Track their performance in real-time.`,
          type: 'invite',
          timestamp: Date.now(),
          read: false
        });
      }
    });

    setNotifications(prev => [...prev, ...inviteNotifications]);
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      classes, 
      students, 
      users,
      notifications,
      updateStudent, 
      createClass,
      isLoggedIn: !!currentUser,
      login,
      logout,
      markNotificationRead
    }}>
      {children}
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

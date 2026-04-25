import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppClass, AppMessage, Role, ClassReply, HelpRequest, AIChatSession, ChatMessage } from './types';

interface DataContextType {
  currentUser: User | null;
  onboardUser: (name: string, role: Role, childId?: string) => void;
  classes: AppClass[];
  createClass: (name: string, subjects: string[]) => void;
  joinClass: (code: string) => void;
  addClassStudent: (classId: string, studentName: string) => void;
  messages: AppMessage[];
  postMessage: (classId: string, text: string, type: 'announcement' | 'discussion') => void;
  postReply: (messageId: string, text: string) => void;
  togglePin: (messageId: string) => void;
  logout: () => void;
  // Advanced features
  helpRequests: HelpRequest[];
  createHelpRequest: (classId: string, text?: string, audioUrl?: string, isAnonymous?: boolean) => void;
  resolveHelpRequest: (requestId: string) => void;
  aiChats: AIChatSession[];
  saveChat: (messages: ChatMessage[], subject?: string) => void;
  updateMood: (emoji: string, text: string) => void;
  awardPoints: (amount: number, badge?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [classes, setClasses] = useState<AppClass[]>(() => {
    const saved = localStorage.getItem('sb_classes');
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<AppMessage[]>(() => {
    const saved = localStorage.getItem('sb_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(() => {
    const saved = localStorage.getItem('sb_help_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [aiChats, setAiChats] = useState<AIChatSession[]>(() => {
    const saved = localStorage.getItem('sb_ai_chats');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sb_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sb_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('sb_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('sb_help_requests', JSON.stringify(helpRequests));
  }, [helpRequests]);

  useEffect(() => {
    localStorage.setItem('sb_ai_chats', JSON.stringify(aiChats));
  }, [aiChats]);

  const onboardUser = (name: string, role: Role, childId?: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      childId,
      points: 0,
      badges: [],
      moods: []
    };
    setCurrentUser(newUser);
  };

  const createClass = (name: string, subjects: string[]) => {
    if (!currentUser) return;
    const newClass: AppClass = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      code: Math.random().toString(36).substr(2, 6).toUpperCase(),
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      studentIds: [],
      studentNames: [],
      subjects
    };
    setClasses([...classes, newClass]);
  };

  const joinClass = (code: string) => {
    if (!currentUser) return;
    setClasses(classes.map(c => {
      if (c.code === code && !c.studentIds.includes(currentUser.id)) {
        return { ...c, studentIds: [...c.studentIds, currentUser.id] };
      }
      return c;
    }));
  };

  const addClassStudent = (classId: string, studentName: string) => {
    setClasses(classes.map(c => {
      if (c.id === classId) {
        return { ...c, studentNames: [...c.studentNames, studentName] };
      }
      return c;
    }));
  };

  const postMessage = (classId: string, text: string, type: 'announcement' | 'discussion') => {
    if (!currentUser) return;
    const newMessage: AppMessage = {
      id: Math.random().toString(36).substr(2, 9),
      classId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      timestamp: Date.now(),
      type,
      isPinned: false,
      replies: []
    };
    setMessages([...messages, newMessage]);
  };

  const postReply = (messageId: string, text: string) => {
    if (!currentUser) return;
    setMessages(messages.map(m => {
      if (m.id === messageId) {
        const reply: ClassReply = {
          id: Math.random().toString(36).substr(2, 9),
          authorId: currentUser.id,
          authorName: currentUser.name,
          text,
          timestamp: Date.now()
        };
        return { ...m, replies: [...m.replies, reply] };
      }
      return m;
    }));
    // Award points for participation
    if (currentUser.role === 'student') {
      awardPoints(5);
    }
  };

  const togglePin = (messageId: string) => {
    setMessages(messages.map(m => {
      if (m.id === messageId) return { ...m, isPinned: !m.isPinned };
      return m;
    }));
  };

  const createHelpRequest = (classId: string, text?: string, audioUrl?: string, isAnonymous: boolean = false) => {
    if (!currentUser) return;
    const request: HelpRequest = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: currentUser.id,
      studentName: currentUser.name,
      classId,
      text,
      audioUrl,
      timestamp: Date.now(),
      isAnonymous,
      status: 'pending'
    };
    setHelpRequests([...helpRequests, request]);
    if (currentUser.role === 'student') {
      awardPoints(10, 'Curiosity Catalyst');
    }
  };

  const resolveHelpRequest = (requestId: string) => {
    setHelpRequests(helpRequests.map(r => r.id === requestId ? { ...r, status: 'resolved' } : r));
  };

  const saveChat = (messages: ChatMessage[], subject?: string) => {
    if (!currentUser) return;
    const newChat: AIChatSession = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: currentUser.id,
      messages,
      subject
    };
    setAiChats([...aiChats, newChat]);
  };

  const updateMood = (emoji: string, text: string) => {
    if (!currentUser) return;
    const newMood = { emoji, text, timestamp: Date.now() };
    setCurrentUser({
      ...currentUser,
      moods: [newMood, ...currentUser.moods].slice(0, 10) // Keep last 10
    });
  };

  const awardPoints = (amount: number, badge?: string) => {
    if (!currentUser) return;
    const newBadges = [...currentUser.badges];
    if (badge && !newBadges.includes(badge)) {
      newBadges.push(badge);
    }
    setCurrentUser({
      ...currentUser,
      points: currentUser.points + amount,
      badges: newBadges
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sb_user');
  };

  return (
    <DataContext.Provider value={{ 
      currentUser, onboardUser, classes, createClass, joinClass, 
      addClassStudent, messages, postMessage, postReply, togglePin, logout,
      helpRequests, createHelpRequest, resolveHelpRequest, aiChats, saveChat,
      updateMood, awardPoints
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

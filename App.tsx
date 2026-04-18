
import React, { useState, useEffect } from 'react';
import { Role, Student, Language, User } from './types';
import { TRANSLATIONS } from './constants';
import { BottomNav, Bridge, SimulatedGmailNotification } from './components/Shared';
import { StudentDashboard, ProgressDetail, HelpRequest, AICompanion, FocusMode, StudyPlanView, PeerMatching, PrivateChat } from './screens/StudentScreens';
import { TeacherDashboard, TeacherStudentDetail } from './screens/TeacherScreens';
import { ParentDashboard } from './screens/ParentScreens';
import { TeacherSetup } from './screens/SetupScreens';
import { useData } from './DataContext';
import { AnimatePresence } from 'motion/react';

import { 
  Home, 
  BarChart2, 
  HelpCircle, 
  MessageCircle, 
  Bell, 
  Users, 
  BookOpen,
  Globe,
  LogOut,
  User as UserIcon,
  Lock
} from 'lucide-react';

const App: React.FC = () => {
  const { currentUser, students, notifications, login, logout, isLoggedIn, markNotificationRead } = useData();
  const [role, setRole] = useState<Role | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('sb_lang') as Language) || 'en';
  });
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  // Sync role from currentUser if logged in
  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role);
    }
  }, [currentUser]);

  // Bottom Navigation Icons
  const navIcons = {
    home: <Home className="w-6 h-6" />,
    progress: <BarChart2 className="w-6 h-6" />,
    help: <HelpCircle className="w-6 h-6" />,
    messages: <MessageCircle className="w-6 h-6" />,
    alerts: <Bell className="w-6 h-6" />,
    students: <Users className="w-6 h-6" />,
    resources: <BookOpen className="w-6 h-6" />
  };

  const navigateTo = (screen: string, data?: any) => {
    setCurrentScreen(screen);
    if (data) setSelectedStudent(data);
    window.scrollTo(0,0);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'home') setCurrentScreen('dashboard');
    if (tabId === 'help') setCurrentScreen('help_request');
    if (tabId === 'progress') setCurrentScreen('progress_detail');
    if (tabId === 'students') setCurrentScreen('dashboard');
    if (tabId === 'messages') setCurrentScreen('private_chat');
  };

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && role) {
      const success = login(loginForm.email, role);
      if (!success) {
        setError(language === 'ar' ? 'المستخدم غير موجود' : 'User not found for this role');
      } else {
        setError('');
      }
    }
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'ar' : 'en';
    setLanguage(next);
    localStorage.setItem('sb_lang', next);
  };

  // Determine which student the dashboard should show
  const getRelevantStudent = (): Student | null => {
    if (!currentUser) return null;
    if (currentUser.role === 'student') return students.find(s => s.id === currentUser.id) || null;
    if (currentUser.role === 'parent') return students.find(s => s.email === currentUser.studentEmail) || null;
    return selectedStudent;
  };

  const currentStudent = getRelevantStudent();

  const pendingNotification = notifications.find(n => n.to === currentUser?.email && !n.read);

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex flex-col items-center justify-center p-8 ${isRTL ? 'font-arabic' : ''}`}>
        <div className="absolute top-6 right-6">
          <button 
            onClick={toggleLanguage}
            className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm hover:bg-white/30 transition-all shadow-lg"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-3xl flex items-center justify-center mb-4 text-3xl font-black text-white shadow-lg rotate-3 overflow-hidden">
              <Bridge className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.welcome}</h1>
            <p className="text-slate-500 text-sm mt-2 text-center">{t.selectRole}</p>
          </div>

          {!role ? (
            <div className="space-y-3">
              {[
                { id: 'student', label: t.student, icon: '🎓', color: 'bg-blue-50 text-blue-600' },
                { id: 'teacher', label: t.teacher, icon: '📝', color: 'bg-emerald-50 text-emerald-600' },
                { id: 'parent', label: t.parent, icon: '🏠', color: 'bg-amber-50 text-amber-600' },
              ].map(r => (
                <button 
                  key={r.id}
                  onClick={() => setRole(r.id as Role)}
                  className="w-full bg-white border border-slate-100 p-5 rounded-3xl text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center gap-4 group shadow-sm"
                >
                  <span className={`text-2xl w-12 h-12 rounded-2xl flex items-center justify-center ${r.color} group-hover:scale-110 transition-transform`}>{r.icon}</span>
                  <span className="font-bold text-slate-700">{r.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={onLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email (Use any @gmail.com to login)</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="e.g. ahmed@gmail.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t.password}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="Optional for prototype"
                  />
                </div>
              </div>
              {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all mt-4"
              >
                {t.login}
              </button>
              <button 
                type="button"
                onClick={() => { setRole(null); setError(''); }}
                className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest py-2"
              >
                ← Back to Roles
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Teacher Setup Flow
  if (role === 'teacher' && !currentUser?.onboarded) {
    return <TeacherSetup language={language} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${isRTL ? 'font-arabic' : ''}`}>
      {/* Top Header Bar */}
      <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
            <Bridge className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-800 tracking-tight block leading-tight">SchoolBridge</span>
            <span className="text-[9px] font-black text-slate-400 tracking-tight uppercase block leading-tight">{t.omanCurriculum}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
            <Globe className="w-4 h-4" />
          </button>
          <button onClick={logout} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {pendingNotification && (
          <SimulatedGmailNotification 
            title={pendingNotification.title}
            message={pendingNotification.message}
            language={language}
            onClose={() => markNotificationRead(pendingNotification.id)}
          />
        )}
      </AnimatePresence>

      <main className="px-5 pt-4 pb-24">
        {role === 'student' && currentStudent && (
          <>
            {currentScreen === 'dashboard' && <StudentDashboard student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'progress_detail' && <ProgressDetail student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'help_request' && <HelpRequest student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'ai_companion' && <AICompanion student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'focus_mode' && <FocusMode student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'study_plan' && <StudyPlanView student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'peer_matching' && <PeerMatching student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'private_chat' && <PrivateChat student={currentStudent} onNavigate={navigateTo} language={language} />}
          </>
        )}

        {role === 'teacher' && (
          <>
            {currentScreen === 'dashboard' && <TeacherDashboard onNavigate={navigateTo} language={language} />}
            {currentScreen === 'student_detail' && selectedStudent && <TeacherStudentDetail student={selectedStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'private_chat' && <PrivateChat student={currentUser as any} onNavigate={navigateTo} language={language} />}
          </>
        )}

        {role === 'parent' && currentStudent && (
          <>
            {currentScreen === 'dashboard' && <ParentDashboard student={currentStudent} onNavigate={navigateTo} language={language} />}
            {currentScreen === 'private_chat' && <PrivateChat student={currentStudent} onNavigate={navigateTo} language={language} />}
          </>
        )}

        {(!currentStudent && role !== 'teacher') && (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Profile Not Found</h2>
            <p className="text-slate-500 text-sm">Please ensure your teacher has added your email to the class setup.</p>
            <button onClick={logout} className="text-blue-600 font-black uppercase text-xs tracking-widest">Logout and Try Again</button>
          </div>
        )}
      </main>

      {/* Role-specific Bottom Navigation */}
      {role === 'student' && (
        <BottomNav 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          items={[
            { id: 'home', label: t.home, icon: navIcons.home },
            { id: 'progress', label: t.progress, icon: navIcons.progress },
            { id: 'help', label: t.help, icon: navIcons.help },
            { id: 'messages', label: t.chat, icon: navIcons.messages },
          ]}
        />
      )}
      {role === 'teacher' && (
        <BottomNav 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          items={[
            { id: 'home', label: t.class, icon: navIcons.home },
            { id: 'students', label: t.students, icon: navIcons.students },
            { id: 'messages', label: t.chat, icon: navIcons.messages },
            { id: 'alerts', label: t.alerts, icon: navIcons.alerts },
          ]}
        />
      )}
      {role === 'parent' && (
        <BottomNav 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          items={[
            { id: 'home', label: t.home, icon: navIcons.home },
            { id: 'progress', label: t.grades, icon: navIcons.progress },
            { id: 'messages', label: t.teacherContact, icon: navIcons.messages },
          ]}
        />
      )}
    </div>
  );
};

export default App;

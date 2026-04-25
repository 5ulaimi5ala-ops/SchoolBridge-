
import React, { useState, useEffect } from 'react';
import { Role, Student, Language, User, Notification } from './types';
import { TRANSLATIONS } from './constants';
import { BottomNav, Bridge, SimulatedGmailNotification } from './components/Shared';
import { StudentDashboard, ProgressDetail, HelpRequest, AICompanion, FocusMode, StudyPlanView, PeerMatching, PrivateChat } from './screens/StudentScreens';
import { TeacherDashboard, TeacherStudentDetail } from './screens/TeacherScreens';
import { ParentDashboard } from './screens/ParentScreens';
import { TeacherSetup } from './screens/SetupScreens';
import { ProfileScreen } from './screens/ProfileScreen';
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

import { supabase } from './services/supabase';

const App: React.FC = () => {
  const { currentUser, students, notifications, logout, isLoggedIn, markNotificationRead, clearNotificationsByType, signInWithGoogle, completeProfile } = useData();
  const [role, setRole] = useState<Role | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('sb_lang') as Language) || 'en';
  });
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [onboardForm, setOnboardForm] = useState({ name: '', studentEmail: '' });
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const isSupabaseConfigured = !!supabase;

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
    window.scrollTo(0, 0);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      setCurrentScreen('dashboard');
      clearNotificationsByType('invite');
      clearNotificationsByType('help');
    }
    if (tabId === 'help') setCurrentScreen('help_request');
    if (tabId === 'progress') setCurrentScreen('progress_detail');
    if (tabId === 'students') setCurrentScreen('dashboard');
    if (tabId === 'messages') {
      setCurrentScreen('private_chat');
      clearNotificationsByType('message');
    }
    if (tabId === 'alerts') {
      setCurrentScreen('dashboard');
      clearNotificationsByType('alert');
    }
  };

  const onLogin = async () => {
    setAuthLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(language === 'ar' ? 'فشل تسجيل الدخول. حاول مرة أخرى.' : 'Login failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const onCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.name || !role) return;
    if (role === 'parent' && !onboardForm.studentEmail) {
      setError(language === 'ar' ? 'يرجى إدخال بريد الطالب الإلكتروني' : "Please enter your child's email");
      return;
    }

    setAuthLoading(true);
    setError('');
    try {
      await completeProfile(onboardForm.name, role, onboardForm.studentEmail);
    } catch (err: any) {
      setError(language === 'ar' ? 'فشل إكمال الملف الشخصي.' : 'Failed to complete profile.');
    } finally {
      setAuthLoading(false);
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
    if (currentUser.role === 'parent') return students.find(s => s.studentEmail === currentUser.studentEmail) || null;
    return selectedStudent;
  };

  const currentStudent = getRelevantStudent();

  const pendingNotification = notifications.find(n => n.to === currentUser?.email && !n.read);
  
  const getUnreadCount = (type?: Notification['type']) => {
    return notifications.filter(n => n.to === currentUser?.email && !n.read && (type ? n.type === type : true)).length;
  };

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
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-3xl flex items-center justify-center mb-6 text-3xl font-black text-white shadow-lg rotate-3 overflow-hidden">
              <Bridge className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">{t.welcome}</h1>
            <p className="text-slate-500 text-sm mt-3 text-center">{language === 'ar' ? 'سجل الدخول للوصول إلى SchoolBridge' : 'Sign in to access SchoolBridge'}</p>
          </div>

          <div className="space-y-4">
            {!isSupabaseConfigured && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <p className="font-bold mb-1">{isRTL ? 'تكوين مفقود' : 'Configuration Missing'}</p>
                    <p>{isRTL 
                      ? 'يرجى تعيين VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في إعدادات التطبيق لتفعيل تسجيل الدخول.' 
                      : 'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the App Settings to enable login.'}</p>
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={onLogin}
              disabled={authLoading || !isSupabaseConfigured}
              className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-md active:scale-95 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.67-2.31 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              {authLoading ? (language === 'ar' ? 'جاري التحميل...' : 'Please wait...') : (language === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google')}
            </button>
            {error && <p className="text-rose-500 text-xs font-bold text-center mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn && !currentUser) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 ${isRTL ? 'font-arabic' : ''}`}>
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'}</h1>
            <p className="text-slate-500 text-xs mt-1 text-center">{!role ? t.selectRole : (language === 'ar' ? 'أخبرنا المزيد عنك' : 'Tell us a bit more about you')}</p>
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
                  className="w-full bg-white border border-slate-100 p-4 rounded-3xl text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center gap-4 group shadow-sm"
                >
                  <span className={`text-xl w-10 h-10 rounded-2xl flex items-center justify-center ${r.color} group-hover:scale-110 transition-transform`}>{r.icon}</span>
                  <span className="font-bold text-slate-700">{r.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={onCompleteProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRTL ? 'الاسم الكامل' : 'Full Name'}</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="text"
                    value={onboardForm.name}
                    onChange={e => setOnboardForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                    placeholder="Ahmed Al-Said"
                  />
                </div>
              </div>

              {role === 'parent' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isRTL ? 'بريد الطالب الإلكتروني' : "Student's Email"}</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required
                      type="email"
                      value={onboardForm.studentEmail}
                      onChange={e => setOnboardForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                      className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                      placeholder="child@gmail.com"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-rose-500 text-xs font-bold text-center mt-2">{error}</p>}

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all mt-4 disabled:opacity-50"
              >
                {authLoading ? (isRTL ? 'جاري التحميل...' : 'Working...') : (isRTL ? 'إكمال الإعداد' : 'Complete Setup')}
              </button>

              <button 
                type="button"
                onClick={() => { setRole(null); setError(''); }}
                className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest py-2"
              >
                ← {isRTL ? 'العودة لاختيار الدور' : 'Back to Roles'}
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
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateTo('profile')}
            className="flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-xl blur-sm opacity-20"></div>
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-xl border border-slate-100 object-cover relative z-10" />
              ) : (
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 relative z-10 border border-slate-100">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-black text-slate-800 tracking-tight block leading-tight">{currentUser?.name}</span>
              <span className="text-[9px] font-black text-slate-400 tracking-tight uppercase block leading-tight">{currentUser?.role}</span>
            </div>
          </button>
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
            onOpen={() => {
              if (pendingNotification.payload) {
                const { screen, data } = pendingNotification.payload;
                navigateTo(screen, data);
                if (screen === 'private_chat') setActiveTab('messages');
                if (screen === 'help_request') setActiveTab('help');
                if (screen === 'dashboard') setActiveTab('home');
              }
              markNotificationRead(pendingNotification.id);
            }}
          />
        )}
      </AnimatePresence>

      <main className="px-5 pt-4 pb-24">
        {currentScreen === 'profile' && currentUser && <ProfileScreen user={currentUser} onNavigate={navigateTo} language={language} />}
        
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
            { id: 'home', label: t.home, icon: navIcons.home, badgeCount: getUnreadCount('invite') + getUnreadCount('alert') },
            { id: 'progress', label: t.progress, icon: navIcons.progress },
            { id: 'help', label: t.help, icon: navIcons.help },
            { id: 'messages', label: t.chat, icon: navIcons.messages, badgeCount: getUnreadCount('message') },
          ]}
        />
      )}
      {role === 'teacher' && (
        <BottomNav 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          items={[
            { id: 'home', label: t.class, icon: navIcons.home, badgeCount: getUnreadCount('help') },
            { id: 'students', label: t.students, icon: navIcons.students },
            { id: 'messages', label: t.chat, icon: navIcons.messages, badgeCount: getUnreadCount('message') },
            { id: 'alerts', label: t.alerts, icon: navIcons.alerts, badgeCount: getUnreadCount('alert') },
          ]}
        />
      )}
      {role === 'parent' && (
        <BottomNav 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          items={[
            { id: 'home', label: t.home, icon: navIcons.home, badgeCount: getUnreadCount('invite') },
            { id: 'progress', label: t.grades, icon: navIcons.progress },
            { id: 'messages', label: t.teacherContact, icon: navIcons.messages, badgeCount: getUnreadCount('message') },
          ]}
        />
      )}
    </div>
  );
};

export default App;

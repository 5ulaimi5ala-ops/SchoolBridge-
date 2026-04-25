
import React, { useState, useEffect, useRef } from 'react';
import { Card, Header, ProgressBar, Badge, useToast } from '../components/Shared';
import { Student, Mood, StudyPlan, Language } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Timer, 
  Target, 
  Users, 
  MessageCircle, 
  Award, 
  Star, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Play, 
  CheckCircle2,
  Send,
  User as UserIcon,
  Sparkles,
  Zap,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  Paperclip,
  MoreVertical,
  Search,
  MessageSquare
} from 'lucide-react';
import { explainLesson, generateSummary, generateQuiz } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { useData } from '../DataContext';

interface Props {
  student: Student;
  onNavigate: (screen: string, data?: any) => void;
  language: Language;
}

export const StudentDashboard: React.FC<Props> = ({ student, onNavigate, language }) => {
  const { showToast, ToastComponent } = useToast();
  const { updateStudent, currentUser } = useData();
  const [showMoodCheck, setShowMoodCheck] = useState(!student.currentMood);
  const t = TRANSLATIONS[language];

  const handleMoodSelect = (mood: Mood) => {
    updateStudent({ ...student, currentMood: mood });
    setShowMoodCheck(false);
    showToast(language === 'ar' ? 'شكراً لمشاركتنا شعورك!' : 'Thanks for sharing how you feel!');
  };

  const moodIcons = {
    happy: { icon: <Smile className="w-8 h-8 text-green-500" />, label: language === 'ar' ? 'ممتاز' : 'Great', color: 'bg-green-50' },
    neutral: { icon: <Meh className="w-8 h-8 text-blue-500" />, label: language === 'ar' ? 'جيد' : 'Okay', color: 'bg-blue-50' },
    sad: { icon: <Frown className="w-8 h-8 text-orange-500" />, label: language === 'ar' ? 'حزين' : 'Sad', color: 'bg-orange-50' },
    stressed: { icon: <AlertTriangle className="w-8 h-8 text-red-500" />, label: language === 'ar' ? 'متوتر' : 'Stressed', color: 'bg-red-50' },
  };

  return (
    <div className="pb-24 space-y-6">
      <Header 
        title={language === 'ar' ? `مرحباً، ${student.name.split(' ')[0]} 👋` : `Hi, ${student.name.split(' ')[0]} 👋`} 
        subtitle={language === 'ar' ? "أنت تبلي بلاءً حسناً. استمر!" : "You're doing great. Keep it up!"}
        avatar={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
      />

      {/* Gamification Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none p-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.level} {student.level}</span>
            </div>
            <div className="text-3xl font-black">{student.points} <span className="text-sm font-normal opacity-80">{t.xp}</span></div>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: '65%' }} />
            </div>
          </div>
          <Star className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
        </Card>
        <Card className="bg-white p-5 flex flex-col justify-center border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.badges}</span>
          </div>
          <div className="flex -space-x-3 mt-1">
            {student.badges.slice(0, 3).map((badge, i) => (
              <div key={i} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-white flex items-center justify-center text-xl shadow-md hover:-translate-y-1 transition-transform" title={badge.name}>
                {badge.icon}
              </div>
            ))}
            {student.badges.length > 3 && (
              <div className="w-10 h-10 rounded-2xl bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-black text-slate-500 shadow-sm">
                +{student.badges.length - 3}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Emotional Check-in */}
      <AnimatePresence>
        {showMoodCheck && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-gradient-to-br from-white to-slate-50 border-2 border-blue-100/50 shadow-xl p-6">
              <h3 className="font-black text-slate-800 mb-5 text-center tracking-tight">{t.moodQuestion}</h3>
              <div className="grid grid-cols-4 gap-3">
                {(Object.entries(moodIcons) as [Mood, typeof moodIcons['happy']][]).map(([mood, data]) => (
                  <button 
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 ${data.color}`}
                  >
                    <div className="transition-transform group-hover:scale-110">{data.icon}</div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{data.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-black text-slate-800 mb-4 tracking-tight">{language === 'ar' ? 'أدوات التعلم' : 'Learning Tools'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('ai_companion')}
            className="flex flex-col items-start p-5 rounded-[2rem] bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100 transition-all text-left group shadow-sm hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-indigo-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Brain className="w-7 h-7 text-indigo-600" />
            </div>
            <span className="font-black text-slate-800 text-sm tracking-tight">{t.studyBuddy}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold leading-tight">{language === 'ar' ? 'مساعد تعلم ذكي' : 'AI-powered learning assistant'}</span>
          </button>
          <button 
            onClick={() => onNavigate('focus_mode')}
            className="flex flex-col items-start p-5 rounded-[2rem] bg-rose-50 border border-rose-100/50 hover:bg-rose-100 transition-all text-left group shadow-sm hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-rose-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Timer className="w-7 h-7 text-rose-600" />
            </div>
            <span className="font-black text-slate-800 text-sm tracking-tight">{t.focusMode}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold leading-tight">{language === 'ar' ? 'مؤقت دراسة بدون تشتيت' : 'Distraction-free study timer'}</span>
          </button>
          <button 
            onClick={() => onNavigate('study_plan')}
            className="flex flex-col items-start p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100/50 hover:bg-emerald-100 transition-all text-left group shadow-sm hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-emerald-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Target className="w-7 h-7 text-emerald-600" />
            </div>
            <span className="font-black text-slate-800 text-sm tracking-tight">{t.studyPlan}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold leading-tight">{language === 'ar' ? 'مهام أسبوعية مخصصة' : 'Personalized weekly tasks'}</span>
          </button>
          <button 
            onClick={() => onNavigate('peer_matching')}
            className="flex flex-col items-start p-5 rounded-[2rem] bg-purple-50 border border-purple-100/50 hover:bg-purple-100 transition-all text-left group shadow-sm hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <span className="font-black text-slate-800 text-sm tracking-tight">{t.peerSupport}</span>
            <span className="text-[10px] text-slate-500 mt-1 font-bold leading-tight">{language === 'ar' ? 'تواصل مع شركاء الدراسة' : 'Connect with study partners'}</span>
          </button>
        </div>
      </section>

      {/* Progress Section with Growth Mindset */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">{t.yourProgress}</h2>
          <button onClick={() => onNavigate('progress_detail')} className="text-xs font-black text-blue-600 uppercase tracking-widest">{language === 'ar' ? 'التفاصيل' : 'Details'}</button>
        </div>
        <div className="space-y-4">
          {student.subjects.map(sub => (
            <Card key={sub.id} className="p-5 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-slate-700 text-sm tracking-tight">{language === 'ar' ? (sub.id === 'math' ? 'الرياضيات' : sub.id === 'islamic' ? 'التربية الإسلامية' : sub.id === 'arabic' ? 'اللغة العربية' : sub.name) : sub.name}</span>
                <Badge level={sub.risk} />
              </div>
              <ProgressBar progress={sub.progress} color={sub.progress < 50 ? 'bg-rose-400' : sub.progress < 75 ? 'bg-amber-400' : 'bg-emerald-400'} />
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{sub.progress}% {language === 'ar' ? 'مكتمل' : 'complete'}</span>
                {sub.lastImprovement && sub.lastImprovement > 0 && (
                  <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    +{sub.lastImprovement}% {language === 'ar' ? 'تحسن!' : 'improvement!'}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Attention Needed */}
      {student.missingTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4 tracking-tight">{t.attentionNeeded}</h2>
          <Card 
            onClick={() => showToast(language === 'ar' ? 'جاري توجيهك للمهام المفقودة...' : 'Redirecting to missing assignments...')}
            className="bg-rose-50 border-rose-100/50 p-6 active:scale-95 transition-all"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-rose-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                <AlertCircle className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-rose-800 tracking-tight">{language === 'ar' ? 'مهام مفقودة' : 'Missing Tasks'}</h3>
                <ul className="mt-2 space-y-2">
                  {student.missingTasks.map((task, i) => (
                    <li key={i} className="text-xs text-rose-700 flex items-center gap-2 font-bold">
                      <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </section>
      )}
      {ToastComponent}
    </div>
  );
};

export const PrivateChat: React.FC<Props> = ({ student, onNavigate, language }) => {
  const { showToast, ToastComponent } = useToast();
  const { users, currentUser, messages, sendMessage } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  // Effect to pre-select user if passed from props
  useEffect(() => {
    if (student) {
      // Find the user object that matches the student prop (either by ID or email)
      const targetUser = users.find(u => u.id === student.id || u.email === student.id || u.email === (student as any).email);
      if (targetUser && targetUser.id !== currentUser?.id) {
        setSelectedUser(targetUser);
      }
    }
  }, [student, users, currentUser]);

  // Filter messages between current user and selected user
  const chatMessages = messages.filter(m => 
    selectedUser && (
      (m.senderId === currentUser?.id && m.receiverId === selectedUser.id) ||
      (m.senderId === selectedUser.id && m.receiverId === currentUser?.id)
    )
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim() || !selectedUser || !currentUser) return;
    sendMessage(currentUser.id, selectedUser.id, input);
    setInput('');
  };

  const filteredUsers = searchQuery.trim() 
    ? users.filter(u => 
        u.id !== currentUser?.id && 
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         u.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="flex flex-col h-[85vh]">
      <Header 
        title={t.privateChat} 
        subtitle={language === 'ar' ? "محادثة آمنة ومباشرة" : "Secure Direct Messaging"} 
        onBack={() => onNavigate('dashboard')} 
      />
      
      {!selectedUser ? (
        <div className="space-y-6 overflow-y-auto pr-1">
          <div className="relative sticky top-0 bg-white/50 backdrop-blur-md pb-2 z-10">
            <Search className="absolute left-4 top-[1.1rem] w-5 h-5 text-slate-400" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? "ابحث عن طالب، معلم، أو ولي أمر..." : "Search students, teachers, parents..."}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              {searchQuery.trim() ? (language === 'ar' ? 'نتائج البحث' : 'Search Results') : (language === 'ar' ? 'اقتراحات التواصل' : 'Suggested Contacts')}
            </h3>
            
            {(searchQuery.trim() ? filteredUsers : users.filter(u => u.id !== currentUser?.id).slice(0, 5)).map(u => (
              <button 
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="w-full bg-white border border-slate-100 p-4 rounded-3xl text-left hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-500 font-black text-xs group-hover:scale-110 transition-transform shadow-inner">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{u.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.role}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>
            ))}

            {searchQuery.trim() && filteredUsers.length === 0 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium">{language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-blue-50/50 rounded-3xl p-4 mb-4 flex items-center justify-between border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xs">
                {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{selectedUser.name}</h4>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">● {language === 'ar' ? 'نشط' : 'Online'}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedUser(null)}
              className="text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white rounded-xl shadow-sm border border-blue-100 active:scale-95 transition-all"
            >
              {language === 'ar' ? 'تغيير' : 'Change'}
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {chatMessages.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
                 <MessageSquare className="w-12 h-12" />
                 <p className="text-sm font-bold">{language === 'ar' ? 'ابدأ المحادثة الآن' : 'Start the conversation now'}</p>
               </div>
            )}
            {chatMessages.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex ${m.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] space-y-1 ${m.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-[1.5rem] text-sm font-medium shadow-sm whitespace-pre-wrap ${
                    m.senderId === currentUser?.id 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 px-2 uppercase">{m.timestamp}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative bg-white rounded-[2rem] shadow-lg border border-slate-100 p-2 flex items-center gap-2">
            <button 
              onClick={() => showToast(language === 'ar' ? 'ميزة إرفاق الملفات ستتوفر قريباً' : 'File attachment feature coming soon')}
              className="p-3 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={language === 'ar' ? "اكتب رسالتك هنا..." : "Type your message..."}
              className="flex-1 bg-transparent py-3 outline-none font-medium text-slate-700"
            />
            <button 
              onClick={handleSend}
              className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-blue-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
      {ToastComponent}
    </div>
  );
};

export const AICompanion: React.FC<Props> = ({ student, onNavigate, language }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: language === 'ar' ? `مرحباً ${student.name.split(' ')[0]}! أنا رفيق دراستك. كيف يمكنني مساعدتك اليوم؟ يمكنني شرح الدروس أو تلخيص الملاحظات أو اختبارك!` : `Hi ${student.name.split(' ')[0]}! I'm your Study Buddy. What can I help you with today? I can explain lessons, summarize notes, or quiz you!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Determine level based on student risk/progress
      const level = student.riskLevel === 'high' ? 'beginner' : student.riskLevel === 'medium' ? 'intermediate' : 'advanced';
      const response = await explainLesson(userMsg, level);
      setMessages(prev => [...prev, { role: 'ai', text: response || (language === 'ar' ? "عذراً، لم أتمكن من معالجة ذلك. لنحاول مرة أخرى!" : "I'm sorry, I couldn't process that. Let's try again!") }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: language === 'ar' ? "عذراً! أواجه مشكلة في الاتصال. يرجى المحاولة لاحقاً." : "Oops! I'm having a bit of trouble connecting. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh]">
      <Header title={t.studyBuddy} subtitle={language === 'ar' ? "مدعوم بالذكاء الاصطناعي" : "AI Learning Companion"} onBack={() => onNavigate('dashboard')} />
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
        {messages.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium whitespace-pre-wrap ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={language === 'ar' ? "اسأل رفيق دراستك..." : "Ask me anything..."}
          className="w-full bg-white border border-slate-200 rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="absolute right-2 top-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 shadow-lg shadow-blue-200"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const FocusMode: React.FC<Props> = ({ onNavigate, language }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [task, setTask] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className="pb-24">
        <Header title={t.focusMode} onBack={() => onNavigate('dashboard')} />
        <Card className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <Timer className="w-10 h-10 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{language === 'ar' ? 'هل أنت مستعد للتركيز؟' : 'Ready to focus?'}</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">{language === 'ar' ? 'سنقوم بضبط مؤقت لمدة 25 دقيقة لتعمل على مهمة واحدة دون تشتيت.' : 'We\'ll set a 25-minute timer for you to work on a single task without distractions.'}</p>
          </div>
          <input 
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder={language === 'ar' ? "ما الذي تعمل عليه؟" : "What are you working on?"}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center font-black text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button 
            onClick={() => setIsStarted(true)}
            disabled={!task}
            className="w-full bg-rose-600 text-white font-black py-4 rounded-3xl shadow-lg shadow-rose-200 active:scale-95 transition-transform disabled:opacity-50"
          >
            {language === 'ar' ? 'ابدأ الجلسة' : 'Start Session'}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-8 text-white">
      <button onClick={() => onNavigate('dashboard')} className="absolute top-8 left-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors">
        <ChevronRight className={`w-6 h-6 ${language === 'ar' ? '' : 'rotate-180'}`} />
      </button>
      
      <div className="text-center space-y-12 w-full max-w-xs">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">{language === 'ar' ? 'المهمة الحالية' : 'Current Task'}</span>
          <h2 className="text-2xl font-black tracking-tight">{task}</h2>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle 
              cx="128" cy="128" r="120" fill="none" stroke="#f43f5e" strokeWidth="8" 
              strokeDasharray={754}
              strokeDashoffset={754 * (1 - timeLeft / (25 * 60))}
              className="transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-6xl font-black tracking-tighter">{formatTime(timeLeft)}</div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`flex-1 py-4 rounded-3xl font-black transition-all active:scale-95 ${
              isActive ? 'bg-white/10 text-white' : 'bg-rose-600 text-white shadow-lg shadow-rose-900/20'
            }`}
          >
            {isActive ? (language === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (language === 'ar' ? 'استئناف' : 'Resume')}
          </button>
          <button 
            onClick={() => { setTimeLeft(25 * 60); setIsActive(false); }}
            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Zap className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const StudyPlanView: React.FC<Props> = ({ student, onNavigate, language }) => {
  const { showToast, ToastComponent } = useToast();
  const { updateStudent } = useData();
  const t = TRANSLATIONS[language];
  const plan = student.studyPlan;

  if (!plan) {
    return (
      <div className="pb-24">
        <Header title={t.studyPlan} onBack={() => onNavigate('dashboard')} />
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-black text-slate-800 tracking-tight">{language === 'ar' ? 'لا توجد خطة نشطة' : 'No active plan'}</h3>
          <p className="text-sm text-slate-500 font-medium">{language === 'ar' ? 'عندما تواجه صعوبة في مادة ما، سيقوم الذكاء الاصطناعي بإنشاء خطة مخصصة لك هنا.' : 'When you struggle with a subject, AI will generate a personalized plan for you here.'}</p>
        </Card>
      </div>
    );
  }

  const toggleTask = async (taskId: string) => {
    if (!plan) return;
    const updatedTasks = plan.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    const updatedPlan = { ...plan, tasks: updatedTasks };
    await updateStudent({ ...student, studyPlan: updatedPlan });
    if (updatedTasks.find(t => t.id === taskId)?.completed) {
      showToast(language === 'ar' ? 'أحسنت! استمر في التقدم.' : 'Great job! Keep going.');
    }
  };

  return (
    <div className="pb-24">
      <Header title={t.studyPlan} subtitle={plan.title} onBack={() => onNavigate('dashboard')} />
      
      <div className="space-y-4">
        {plan.tasks.map((task) => (
          <Card key={task.id} className={`p-5 flex items-center gap-4 group transition-all ${task.completed ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-md'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
              task.type === 'video' ? 'bg-rose-50 text-rose-600' :
              task.type === 'practice' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {task.type === 'video' ? <Play className="w-6 h-6" /> :
               task.type === 'practice' ? <Zap className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 text-sm tracking-tight">{task.title}</h4>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{task.type} • {task.duration}</span>
            </div>
            <button 
              onClick={() => toggleTask(task.id)}
              className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                task.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' : 'border-slate-100 text-transparent hover:border-blue-200'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </button>
          </Card>
        ))}
      </div>

      <button 
        onClick={() => showToast(language === 'ar' ? 'تم تحديث هدف اليوم!' : 'Today\'s goal updated!')}
        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        <TrendingUp className="w-5 h-5" />
        {language === 'ar' ? 'أكمل هدف اليوم' : "Complete Today's Goal"}
      </button>
      {ToastComponent}
    </div>
  );
};

export const PeerMatching: React.FC<Props> = ({ student, onNavigate, language }) => {
  const { showToast, ToastComponent } = useToast();
  const t = TRANSLATIONS[language];
  const matches = [
    { id: 'm1', name: 'Ahmed Al-Said', match: 95, strength: language === 'ar' ? 'الرياضيات' : 'Mathematics', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed' },
    { id: 'm2', name: 'Fatima Al-Balushi', match: 82, strength: language === 'ar' ? 'الأحياء' : 'Biology', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima' },
  ];

  return (
    <div className="pb-24">
      <Header title={t.peerSupport} subtitle={language === 'ar' ? "اعثر على شريك دراسة" : "Find your study partner"} onBack={() => onNavigate('dashboard')} />
      
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 mb-6 border-none shadow-xl shadow-purple-100">
        <h3 className="font-black text-lg mb-1 tracking-tight">{language === 'ar' ? 'مطابقة ذكية' : 'Smart Matching'}</h3>
        <p className="text-xs opacity-80 mb-4 font-medium">{language === 'ar' ? 'يقوم الذكاء الاصطناعي بمطابقتك مع الطلاب بناءً على نقاط القوة وتوافق الشخصية.' : 'AI pairs you with students based on subject strengths and personality compatibility.'}</p>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <div className="px-3 py-1.5 bg-white/20 rounded-xl backdrop-blur-sm">{language === 'ar' ? 'نقطة ضعفك: الرياضيات' : 'Your Weakness: Math'}</div>
          <div className="px-3 py-1.5 bg-white/20 rounded-xl backdrop-blur-sm">{language === 'ar' ? 'نقطة قوتك: العربية' : 'Your Strength: Arabic'}</div>
        </div>
      </Card>

      <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'شركاء مقترحون' : 'Recommended Partners'}</h4>
      <div className="space-y-4">
        {matches.map((match) => (
          <Card key={match.id} className="p-5 flex items-center gap-4 group hover:shadow-md transition-all">
            <img src={match.avatar} alt={match.name} className="w-14 h-14 rounded-2xl border-2 border-white shadow-md object-cover" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-slate-800 tracking-tight">{match.name}</h5>
                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-tighter">{match.match}% {language === 'ar' ? 'تطابق' : 'Match'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{language === 'ar' ? 'يمكنه المساعدة في:' : 'Can help with:'} <span className="text-emerald-600">{match.strength}</span></p>
            </div>
            <button 
              onClick={() => showToast(language === 'ar' ? 'تم إرسال طلب تواصل!' : 'Connection request sent!')}
              className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center shadow-sm"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </Card>
        ))}
      </div>
      {ToastComponent}
    </div>
  );
};

export const ProgressDetail: React.FC<Props> = ({ student, onNavigate, language }) => {
  const { showToast, ToastComponent } = useToast();
  const t = TRANSLATIONS[language];
  const chartData = student.recentScores.map((score, i) => ({
    name: language === 'ar' ? `اختبار ${i + 1}` : `Week ${i + 1}`,
    score: score,
  }));

  return (
    <div className="pb-24">
      <Header title={t.progress} onBack={() => onNavigate('dashboard')} />
      
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-black text-slate-800 mb-6 tracking-tight">{language === 'ar' ? 'اتجاه الأداء' : 'Performance Trend'}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: '900' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, fill: '#2563eb', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <section>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'إحصائيات عقلية النمو' : 'Growth Mindset Stats'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 bg-white border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'متوسط التحسن' : 'Avg Improvement'}</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">+8.5%</div>
            </Card>
            <Card className="p-5 bg-white border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الاستمرارية' : 'Consistency'}</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{language === 'ar' ? 'عالية' : 'High'}</div>
            </Card>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'ملاحظات المعلم' : 'Teacher Feedback'}</h3>
          <div className="space-y-4">
            <Card 
              onClick={() => showToast(language === 'ar' ? 'جاري فتح المحادثة مع المعلمة...' : 'Opening teacher chat...')}
              className="border-l-4 border-l-blue-500 p-6 bg-blue-50/30 active:scale-95 transition-all"
            >
              <p className="text-sm text-slate-600 italic font-medium">"{language === 'ar' ? 'أحمد يظهر فضولاً كبيراً في حصة اللغة العربية. نحتاج للتركيز أكثر على تسليم واجبات الرياضيات.' : 'Ahmed is showing great curiosity in Arabic class. We need to focus more on the late Mathematics submissions.'}"</p>
              <div className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">— Ms. Henderson, Oct 12</div>
            </Card>
          </div>
        </section>
      </div>
      {ToastComponent}
    </div>
  );
};

export const HelpRequest: React.FC<Props> = ({ student, onNavigate, language }) => {
  const { currentUser, sendHelpRequest } = useData();
  const [sent, setSent] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [subject, setSubject] = useState(language === 'ar' ? 'الرياضيات' : 'Mathematics');
  const [message, setMessage] = useState('');
  const t = TRANSLATIONS[language];

  const handleSubmit = async () => {
    if (!message.trim() || !currentUser) return;
    await sendHelpRequest(currentUser.id, subject, message, isAnonymous);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 text-5xl shadow-inner"
        >
          ✅
        </motion.div>
        <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">{language === 'ar' ? 'تم الإرسال!' : 'Request Sent!'}</h2>
        <p className="text-slate-500 mb-10 font-medium">{language === 'ar' ? 'تم إخطار معلمك وسيتواصل معك قريباً. تذكر، من الجيد طلب المساعدة!' : 'Your teacher has been notified and will reach out soon. Remember, it\'s okay to ask for help!'}</p>
        <button 
          onClick={() => onNavigate('dashboard')}
          className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all"
        >
          {language === 'ar' ? 'العودة للرئيسية' : 'Back to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Header title={t.help} onBack={() => onNavigate('dashboard')} />
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">{language === 'ar' ? 'ما هي المادة التي تحتاج مساعدة فيها؟' : 'What subject do you need help with?'}</label>
          <select 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          >
            <option>{language === 'ar' ? 'الرياضيات' : 'Mathematics'}</option>
            <option>{language === 'ar' ? 'الفيزياء' : 'Physics'}</option>
            <option>{language === 'ar' ? 'اللغة العربية' : 'Arabic'}</option>
            <option>{language === 'ar' ? 'الأحياء' : 'Biology'}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">{language === 'ar' ? 'صف ما يدور في ذهنك' : 'Describe what\'s on your mind'}</label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 h-40 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all font-medium resize-none"
            placeholder={language === 'ar' ? "أواجه صعوبة في مفاهيم حساب التفاضل والتكامل الجديدة..." : "I'm struggling with the new Calculus concepts..."}
          />
        </div>

        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isAnonymous ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-slate-800 block tracking-tight">{language === 'ar' ? 'اسأل بدون خوف؟' : 'Ask Without Fear?'}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{language === 'ar' ? 'سيكون سؤالك مجهول الهوية' : 'Your question will be anonymous'}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-14 h-7 rounded-full transition-all relative ${isAnonymous ? 'bg-slate-800' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isAnonymous ? (language === 'ar' ? 'left-1' : 'right-1') : (language === 'ar' ? 'right-1' : 'left-1')}`} />
          </button>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all mt-4"
        >
          {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
};

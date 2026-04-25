
import React, { useState } from 'react';
import { Card, Header, Badge, ProgressBar, useToast } from '../components/Shared';
import { Student, RiskLevel, Mood, Language } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TRANSLATIONS, OMANI_SUBJECTS } from '../constants';
import { 
  AlertTriangle, 
  Search, 
  MessageSquare, 
  UserX, 
  TrendingDown, 
  Smile, 
  Meh, 
  Frown, 
  AlertCircle,
  ChevronRight,
  ShieldAlert,
  BrainCircuit,
  MessageCircle,
  EyeOff,
  Users,
  Star,
  Zap,
  Clock,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../DataContext';

interface Props {
  onNavigate: (screen: string, data?: any) => void;
  language: Language;
}

export const TeacherDashboard: React.FC<Props> = ({ onNavigate, language }) => {
  const { showToast, ToastComponent } = useToast();
  const { students, currentUser, classes, helpRequests, users, resolveHelpRequest } = useData();
  const [activeTab, setActiveTab] = useState<'alerts' | 'struggles' | 'questions'>('alerts');
  const t = TRANSLATIONS[language];

  // Get current class
  const currentClass = classes.find(c => c.id === currentUser?.classId);
  const classStudents = students.filter(s => s.grade === currentClass?.name);

  const stats = [
    { label: language === 'ar' ? 'متوسط الدرجات' : 'Avg. Score', value: classStudents.length > 0 ? `${Math.round(classStudents.reduce((acc, s) => acc + (s.recentScores.length > 0 ? s.recentScores[s.recentScores.length - 1] : 0), 0) / classStudents.length)}%` : '0%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: language === 'ar' ? 'التفاعل' : 'Engagement', value: language === 'ar' ? 'عالي' : 'High', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: language === 'ar' ? 'في خطر' : 'At Risk', value: classStudents.length > 0 ? `${Math.round((classStudents.filter(s => s.riskLevel === 'high').length / classStudents.length) * 100)}%` : '0%', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  // Silent Struggle Detector Logic (Simulated)
  const strugglingStudents = classStudents.filter(s => 
    s.riskLevel === 'high' || 
    s.missingTasks.length > 2
  );

  // Emotional Alerts
  const emotionalAlerts = classStudents.filter(s => s.currentMood === 'stressed' || s.currentMood === 'sad');

  // Get actual help requests for this teacher's class
  const classHelpRequests = helpRequests.filter(req => {
    const studentUser = users.find(u => u.id === req.studentId);
    return studentUser?.classId === currentUser?.classId && req.status === 'pending';
  });

  return (
    <div className="pb-24 space-y-6">
      <Header 
        title={language === 'ar' ? 'نظرة عامة على الفصل' : "Class Overview"} 
        subtitle={currentClass?.name || (language === 'ar' ? 'بناء فصل جديد' : "Building new class")} 
        avatar={currentUser?.avatar || "https://api.dicebear.com/7.x/micah/svg?seed=teacher"} 
      />
      
      <div className="grid grid-cols-3 gap-3">
        {stats.map(stat => (
          <Card key={stat.label} className={`p-4 text-center border-none shadow-sm ${stat.bg}`}>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* AI Insights Bar */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white border-none p-5 flex items-center justify-between overflow-hidden relative shadow-xl shadow-indigo-100">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit className="w-4 h-4 text-indigo-200" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{language === 'ar' ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}</span>
          </div>
          <p className="text-sm font-black tracking-tight">
            {language === 'ar' ? '3 طلاب يظهرون علامات "صراع صامت"' : '3 students show signs of "Silent Struggle"'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-20">
          <BrainCircuit className="w-24 h-24" />
        </div>
      </Card>

      {/* Dashboard Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner">
        {(['alerts', 'struggles', 'questions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {language === 'ar' ? (tab === 'alerts' ? 'تنبيهات' : tab === 'struggles' ? 'صعوبات' : 'أسئلة') : tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Emotional Alerts Section */}
            {emotionalAlerts.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  {language === 'ar' ? 'تنبيهات عاطفية' : 'Emotional Alerts'}
                </h3>
                <div className="space-y-3">
                  {emotionalAlerts.map(student => (
                    <Card key={student.id} className="p-4 border-l-4 border-l-rose-500 flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${student.currentMood === 'stressed' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                          {student.currentMood === 'stressed' ? <AlertCircle className="w-7 h-7 text-rose-600" /> : <Frown className="w-7 h-7 text-amber-600" />}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-sm tracking-tight">{student.name}</h4>
                          <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest mt-1">
                            {language === 'ar' ? 'يشعر بـ ' : 'Feeling '} 
                            {language === 'ar' ? (student.currentMood === 'stressed' ? 'التوتر' : 'الحزن') : student.currentMood}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => onNavigate('student_detail', student)} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all">
                        <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                      </button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* General Risk Alerts */}
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'قائمة الطلاب' : 'Class List'}</h3>
              <div className="space-y-3">
                {classStudents.map(student => (
                  <Card key={student.id} className="p-5 flex items-center justify-between hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigate('student_detail', student)}>
                    <div className="flex items-center gap-4">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover" alt="" />
                      <div>
                        <h4 className="font-black text-slate-800 text-sm tracking-tight">{student.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold line-clamp-1 max-w-[150px] mt-1">{student.issueSummary}</p>
                      </div>
                    </div>
                    <Badge level={student.riskLevel} />
                  </Card>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'struggles' && (
          <motion.div
            key="struggles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'كاشف الصعوبات الصامتة' : 'Silent Struggle Detector'}</h3>
                <div className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[8px] font-black rounded-lg uppercase tracking-widest">AI Powered</div>
              </div>
              <div className="space-y-4">
                {strugglingStudents.map(student => (
                  <Card key={student.id} className="p-5 border-2 border-indigo-50 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover" alt="" />
                        <div>
                          <h4 className="font-black text-slate-800 text-sm tracking-tight">{student.name}</h4>
                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">
                            <TrendingDown className="w-3 h-3" />
                            {language === 'ar' ? 'تراجع في التفاعل' : 'Declining Engagement'}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => onNavigate('student_detail', student)} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        {language === 'ar' ? 'عرض التحليل' : 'View Analysis'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{language === 'ar' ? 'معدل التسليم' : 'Submission Rate'}</span>
                        <span>65%</span>
                      </div>
                      <ProgressBar progress={65} color="bg-indigo-500" />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'لوحة المساعدة والأسئلة' : 'Help & Questions Board'}</h3>
                <EyeOff className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-4">
                {classHelpRequests.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-sm">{language === 'ar' ? 'لا يوجد طلبات مساعدة حالياً' : 'No pending help requests'}</p>
                  </div>
                )}
                {classHelpRequests.map(q => {
                  const studentUser = users.find(u => u.id === q.studentId);
                  return (
                    <Card key={q.id} className="p-5 bg-slate-50 border-dashed border-2 border-slate-200 hover:bg-white hover:border-blue-200 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100">
                          {q.isAnonymous ? <UserX className="w-5 h-5 text-slate-400" /> : <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentUser?.name}`} className="w-8 h-8 rounded-lg" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {q.isAnonymous ? (language === 'ar' ? 'طالب مجهول' : 'Anonymous Student') : studentUser?.name}
                             </span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.timestamp}</span>
                          </div>
                          <div className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black rounded-lg uppercase tracking-widest mb-2">
                            {q.subject}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{q.message}</p>
                          <div className="mt-4 flex gap-2">
                            <button 
                              onClick={() => {
                                if (!q.isAnonymous && studentUser) {
                                   onNavigate('private_chat', studentUser);
                                } else {
                                   showToast(language === 'ar' ? 'تم إرسال الرد العام للفصل' : 'Public response posted to class');
                                   resolveHelpRequest(q.id);
                                }
                              }}
                              className="text-[10px] font-black text-blue-600 bg-white border border-blue-100 px-4 py-2 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                            >
                              {q.isAnonymous ? (language === 'ar' ? 'رد عام' : 'Post Answer') : (language === 'ar' ? 'رد خاص' : 'Answer Privately')}
                            </button>
                            <button 
                              onClick={() => resolveHelpRequest(q.id)}
                              className="text-[10px] font-black text-slate-600 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest"
                            >
                              {language === 'ar' ? 'تحديد كمكتمل' : 'Mark Resolved'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      {ToastComponent}
    </div>
  );
};

export const TeacherStudentDetail: React.FC<{ student: Student; onNavigate: (screen: string, data?: any) => void; language: Language }> = ({ student, onNavigate, language }) => {
  const { showToast, ToastComponent } = useToast();
  const { updateStudent, users } = useData();
  const t = TRANSLATIONS[language];
  const [newGrade, setNewGrade] = useState('');
  const [newAssignment, setNewAssignment] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const studentUser = users.find(u => u.email === student.id || u.id === student.id);
  const parentUser = users.find(u => {
    const sEmail = studentUser?.email || student.id;
    return u.role === 'parent' && u.studentEmail === sEmail;
  });
  
  const handleAddGrade = async () => {
    if (!newGrade) return;
    const score = parseInt(newGrade);
    const updated = { ...student, recentScores: [...(student.recentScores || []), score] };
    await updateStudent(updated);
    setNewGrade('');
    showToast(language === 'ar' ? 'تمت إضافة الدرجة' : 'Grade Added Successfully');
  };

  const handleAddAssignment = async () => {
    if (!newAssignment) return;
    const updated = { ...student, missingTasks: [...(student.missingTasks || []), newAssignment] };
    await updateStudent(updated);
    setNewAssignment('');
    showToast(language === 'ar' ? 'تم إسناد المهمة' : 'Assignment Assigned');
  };

  const handleSaveNote = async () => {
    if (!internalNote) return;
    const note: any = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString(),
      text: internalNote,
      category: 'academic'
    };
    const updated = { 
      ...student, 
      internalNotes: [...(student.internalNotes || []), note] 
    };
    await updateStudent(updated);
    setInternalNote('');
    showToast(language === 'ar' ? 'تم حفظ الملاحظة بنجاح' : 'Note saved successfully');
  };

  return (
    <div className="pb-24">
      <Header 
        title={student.name} 
        subtitle={language === 'ar' ? `الصف ${student.grade}` : `${student.grade} Grade`} 
        onBack={() => onNavigate('dashboard')} 
      />

      <div className="space-y-6">
        {/* Teacher Controls */}
        <Card className="p-6 space-y-6">
           <div>
             <h3 className="text-sm font-black text-slate-800 tracking-tight mb-4 flex items-center gap-2">
               <Star className="w-4 h-4 text-blue-600" />
               {language === 'ar' ? 'إضافة درجة جديدة' : 'Add New Grade'}
             </h3>
             <div className="flex gap-2">
               <input 
                 type="number" 
                 value={newGrade}
                 onChange={e => setNewGrade(e.target.value)}
                 className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 font-black" 
                 placeholder="Score (0-100)"
               />
               <button onClick={handleAddGrade} className="bg-blue-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-all"><Plus /></button>
             </div>
           </div>

           <div className="pt-6 border-t border-slate-100">
             <h3 className="text-sm font-black text-slate-800 tracking-tight mb-4 flex items-center gap-2">
               <Plus className="w-4 h-4 text-emerald-600" />
               {language === 'ar' ? 'إسناد مهمة جديدة' : 'Add New Assignment'}
             </h3>
             <div className="flex gap-2">
               <input 
                 value={newAssignment}
                 onChange={e => setNewAssignment(e.target.value)}
                 className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 font-black" 
                 placeholder="Assignment Title"
               />
               <button onClick={handleAddAssignment} className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-all"><Plus /></button>
             </div>
           </div>
        </Card>
        {/* Emotional Status */}
        {student.currentMood && (
          <Card className={`p-5 border-none shadow-lg ${
            student.currentMood === 'stressed' ? 'bg-rose-50 shadow-rose-100' : 
            student.currentMood === 'sad' ? 'bg-amber-50 shadow-amber-100' : 'bg-emerald-50 shadow-emerald-100'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                student.currentMood === 'stressed' ? 'bg-rose-200' : 
                student.currentMood === 'sad' ? 'bg-amber-200' : 'bg-emerald-200'
              }`}>
                {student.currentMood === 'stressed' ? <AlertTriangle className="w-8 h-8 text-rose-600" /> : 
                 student.currentMood === 'sad' ? <Frown className="w-8 h-8 text-amber-600" /> : <Smile className="w-8 h-8 text-emerald-600" />}
              </div>
              <div>
                <h4 className={`font-black text-sm tracking-tight ${
                  student.currentMood === 'stressed' ? 'text-rose-800' : 
                  student.currentMood === 'sad' ? 'text-amber-800' : 'text-emerald-800'
                }`}>
                  {language === 'ar' ? 'الحالة العاطفية الحالية: ' : 'Current Emotional State: '} 
                  {language === 'ar' ? (student.currentMood === 'stressed' ? 'متوتر' : student.currentMood === 'sad' ? 'حزين' : 'سعيد') : student.currentMood}
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">
                  {language === 'ar' ? 'آخر فحص: اليوم، 8:45 صباحاً' : 'Last check-in: Today, 8:45 AM'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-black text-slate-800 tracking-tight">{language === 'ar' ? 'ملف المخاطر' : 'Risk Profile'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{language === 'ar' ? 'بناءً على بيانات الأداء الأخيرة' : 'Based on recent performance data'}</p>
            </div>
            <Badge level={student.riskLevel} />
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{language === 'ar' ? 'الحضور' : 'Attendance'}</span>
                <span className={student.attendance < 90 ? 'text-rose-600' : 'text-emerald-600'}>{student.attendance}%</span>
              </div>
              <ProgressBar progress={student.attendance} color={student.attendance < 90 ? 'bg-rose-400' : 'bg-emerald-400'} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{language === 'ar' ? 'التفاعل' : 'Engagement'}</span>
                <span className="text-amber-600">{language === 'ar' ? 'متوسط' : 'Medium'}</span>
              </div>
              <ProgressBar progress={65} color="bg-amber-400" />
            </div>
          </div>
        </Card>

        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'المشكلات الأخيرة' : 'Recent Issues'}</h3>
          <Card className="bg-rose-50 border-rose-100/50 p-6">
             <ul className="space-y-3">
               {student.missingTasks.map((task, i) => (
                 <li key={i} className="flex items-center gap-3 text-xs text-rose-700 font-bold">
                   <div className="w-2 h-2 bg-rose-400 rounded-full shadow-sm"></div>
                   {task} ({language === 'ar' ? 'متأخر' : 'Overdue'})
                 </li>
               ))}
             </ul>
          </Card>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                if (studentUser) {
                  onNavigate('private_chat', studentUser);
                } else {
                  showToast(language === 'ar' ? 'المستخدم غير موجود' : 'User profile not found');
                }
              }}
              className="bg-blue-600 text-white py-5 rounded-2xl text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 uppercase tracking-widest"
            >
              <MessageCircle className="w-5 h-5" />
              {language === 'ar' ? 'مراسلة الطالب' : 'Message Student'}
            </button>
            <button 
              onClick={() => showToast(language === 'ar' ? 'تم تعيين معلم لمراجعة الحالة' : 'Tutor assigned for case review')}
              className="bg-indigo-600 text-white py-5 rounded-2xl text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 uppercase tracking-widest"
            >
              <Users className="w-5 h-5" />
              {language === 'ar' ? 'تعيين معلم' : 'Assign Tutor'}
            </button>
            <button 
              onClick={() => showToast(language === 'ar' ? 'جاري تحميل السجل الأكاديمي الشامل...' : 'Loading comprehensive academic history...')}
              className="bg-white text-slate-700 py-5 rounded-2xl text-xs font-black active:scale-95 transition-all border border-slate-100 shadow-sm uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Clock className="w-5 h-5 text-slate-400" />
              {language === 'ar' ? 'عرض السجل' : 'View History'}
            </button>
            <button 
              onClick={() => {
                if (parentUser) {
                   onNavigate('private_chat', parentUser);
                } else {
                   showToast(language === 'ar' ? 'لم يتم العثور على ولي أمر مرتبط' : 'No linked parent profile found');
                }
              }}
              className="bg-white text-slate-700 py-5 rounded-2xl text-xs font-black active:scale-95 transition-all border border-slate-100 shadow-sm uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5 text-slate-400" />
              {language === 'ar' ? 'مراسلة ولي الأمر' : 'Message Parent'}
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'الملاحظات السابقة' : 'Previous Notes'}</h3>
          <div className="space-y-3">
            {student.internalNotes?.map((note) => (
              <Card key={note.id} className="p-4 bg-slate-50 border-none">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{note.date}</span>
                </div>
                <p className="text-xs font-medium text-slate-700">{note.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{language === 'ar' ? 'إضافة ملاحظة داخلية' : 'Add Internal Note'}</h3>
          <Card className="p-2">
            <textarea 
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder={language === 'ar' ? "لوحظ أن أحمد يواجه صعوبة في أساسيات التكامل..." : "Observed Alex struggling with integration basics during lab..."}
              className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 text-sm h-32 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none"
            />
          </Card>
          <button 
            onClick={handleSaveNote}
            className="mt-4 w-full bg-slate-800 text-white py-5 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest"
          >
            {language === 'ar' ? 'حفظ الملاحظة' : 'Save Note'}
          </button>
        </section>
      </div>
      {ToastComponent}
    </div>
  );
};

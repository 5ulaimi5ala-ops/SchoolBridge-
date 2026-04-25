import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, BookOpen, Bell, Search, Filter, ArrowRight, UserCheck, AlertTriangle, Heart, MessageCircle, Send, CheckCircle2, ChevronRight, BrainCircuit, Sparkles, Wand2, LogOut } from 'lucide-react';
import { useData } from '../DataContext';

export const TeacherDashboard: React.FC = () => {
  const { currentUser, classes, messages, helpRequests, resolveHelpRequest, postMessage, logout } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'struggles' | 'wellbeing'>('overview');
  const [selectedClass, setSelectedClass] = useState(classes[0] || null);

  const teacherClasses = classes.filter(c => c.teacherId === currentUser?.id);
  
  // Feature 6: Silent Struggle Detector (AI analysis simulation)
  const struggles = useMemo(() => {
    // In a real app, this would query participation metrics.
    // Here we simulate it based on student names and random metrics.
    return teacherClasses.flatMap(c => 
      c.studentNames.map(name => ({
        name,
        class: c.name,
        metric: Math.floor(Math.random() * 40) + 10, // 10-50% drop
        reason: ['Late submissions', 'Drop in quiz scores', 'Lower participation', 'Frequent stressed checks'][Math.floor(Math.random() * 4)],
        severity: Math.random() > 0.7 ? 'critical' : 'moderate'
      }))
    ).filter(s => Math.random() > 0.6).sort((a, b) => b.metric - a.metric);
  }, [teacherClasses]);

  // Feature 5: Emotional Alerts
  const wellbeingAlerts = useMemo(() => {
    // This is hard to simulate without live student IDs mapping to moods, 
    // but we'll show recent "Stressed" checks.
    return [
      { name: 'Alex Johnson', mood: '😫', note: 'Feeling overwhelmed with exams', time: '10m ago' },
      { name: 'Sarah Miller', mood: '😞', note: 'Family issues at home', time: '1h ago' }
    ];
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Side Rail */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 font-black">
            SB
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tighter">SchoolBridge</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          {[
            { id: 'overview', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
            { id: 'classes', name: 'My Classes', icon: <BookOpen className="w-5 h-5" /> },
            { id: 'struggles', name: 'Struggle Detector', icon: <BrainCircuit className="w-5 h-5" />, badge: struggles.length },
            { id: 'wellbeing', name: 'Student Wellbeing', icon: <Heart className="w-5 h-5" />, badge: wellbeingAlerts.length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-bold text-sm">{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.id === 'struggles' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col gap-6">
           <button 
             onClick={logout}
             className="flex items-center gap-3 p-4 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all w-full"
           >
             <LogOut className="w-5 h-5" />
             <span className="font-bold text-sm">Switch Role</span>
           </button>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                {currentUser?.name[0]}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{currentUser?.name}</p>
                <p className="text-[10px] font-black uppercase text-gray-400">Teacher Account</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="p-8 pb-4 flex justify-between items-center bg-[#FDFDFD]/90 backdrop-blur-md sticky top-0 z-30 font-sans">
          <div>
            <h1 className="text-3xl font-black text-gray-900 capitalize">{activeTab}</h1>
            <p className="text-gray-500 font-medium mt-1">Teaching {teacherClasses.length} active classes</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input placeholder="Search students..." className="pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl text-sm transition-all outline-none w-64" />
             </div>
             <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-600 relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#FDFDFD]" />
             </button>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Active Requests", val: helpRequests.filter(r => r.status === 'pending').length, icon: <MessageCircle />, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Struggles Detected", val: struggles.length, icon: <BrainCircuit />, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Check-ins Today", val: 12, icon: <Heart />, color: "text-rose-600", bg: "bg-rose-50" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                       <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                          {React.cloneElement(stat.icon as any, { className: "w-8 h-8" })}
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{stat.label}</p>
                          <p className="text-3xl font-black text-gray-900">{stat.val}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Help Requests */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                       <div className="flex justify-between items-center mb-8">
                          <h3 className="text-xl font-bold text-gray-900">Current Help Requests</h3>
                          <button className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline">View All Tickets</button>
                       </div>
                       
                       <div className="space-y-4">
                          {helpRequests.filter(r => r.status === 'pending').length === 0 ? (
                            <div className="text-center py-12 text-gray-400 space-y-2">
                               <CheckCircle2 className="w-12 h-12 mx-auto text-green-100" />
                               <p className="font-bold">Inbox is empty!</p>
                               <p className="text-xs">Your students are all set for now.</p>
                            </div>
                          ) : (
                            helpRequests.filter(r => r.status === 'pending').map(req => (
                              <div key={req.id} className="p-6 rounded-3xl bg-gray-50 border border-transparent hover:border-indigo-100 transition-all flex justify-between items-start">
                                 <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl">
                                      {req.isAnonymous ? '👤' : req.studentName[0]}
                                    </div>
                                    <div className="space-y-1">
                                       <div className="flex items-center gap-2">
                                          <h4 className="font-bold text-gray-900 text-sm">{req.isAnonymous ? 'Anonymous Student' : req.studentName}</h4>
                                          <span className="text-[10px] font-black uppercase text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                            {teacherClasses.find(c => c.id === req.classId)?.name}
                                          </span>
                                       </div>
                                       <p className="text-gray-600 text-sm italic">"{req.text}"</p>
                                       <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <button 
                                      onClick={() => resolveHelpRequest(req.id)}
                                      className="p-3 bg-white text-green-500 rounded-xl shadow-sm border border-green-50 hover:bg-green-500 hover:text-white transition-all"
                                    >
                                       <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  </div>

                  {/* Wellbeing Radar */}
                  <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Wellbeing Radar</h3>
                        <Heart className="w-6 h-6 text-rose-500 fill-rose-50" />
                     </div>

                     <div className="space-y-6">
                        {wellbeingAlerts.map((alert, i) => (
                           <div key={i} className="flex gap-4">
                              <div className="text-3xl">{alert.mood}</div>
                              <div>
                                 <p className="font-bold text-gray-900 text-sm">{alert.name}</p>
                                 <p className="text-xs text-gray-500 leading-tight mt-1">{alert.note}</p>
                                 <div className="flex items-center gap-4 mt-3">
                                    <button className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">Encourage</button>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{alert.time}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'struggles' && (
              <motion.div
                key="struggles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="max-w-5xl space-y-8">
                   <div className="bg-gradient-to-tr from-indigo-700 to-indigo-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <BrainCircuit className="w-64 h-64" />
                      </div>
                      <div className="relative z-10 max-w-xl space-y-4">
                         <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200">AI Powered Detection</span>
                         </div>
                         <h2 className="text-4xl font-black">Silent Struggle Detector</h2>
                         <p className="text-indigo-100/80 leading-relaxed">
                            Our AI analyzes hidden patterns like participation gaps and submission delays to identify students needing help <span className="text-white font-bold underline decoration-amber-400 underline-offset-4">before</span> they ask.
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {struggles.map((s, i) => (
                        <div key={i} className={`p-8 rounded-[2.5rem] border ${s.severity === 'critical' ? 'border-amber-100 bg-amber-50/30' : 'border-gray-100 bg-white'} shadow-sm relative overflow-hidden group`}>
                           {s.severity === 'critical' && (
                             <div className="absolute top-0 right-0 p-4 bg-amber-500 text-white rounded-bl-[1.5rem] flex items-center gap-1 text-[10px] font-black uppercase shadow-lg shadow-amber-500/20">
                                <AlertTriangle className="w-3 h-3 fill-amber-500 mb-0.5" /> High Risk
                             </div>
                           )}
                           
                           <div className="flex flex-col h-full space-y-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-3xl">
                                   {s.name[0]}
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-bold text-gray-900">{s.name}</h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                                       <BookOpen className="w-3 h-3" /> {s.class}
                                    </p>
                                 </div>
                              </div>

                              <div className="space-y-4 flex-1">
                                 <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity Drop</span>
                                    <span className="text-2xl font-black text-rose-500">-{s.metric}%</span>
                                 </div>
                                 <div className="h-2 bg-gray-100 rounded-full">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${s.metric}%` }}
                                      className={`h-full rounded-full ${s.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`}
                                    />
                                 </div>
                                 <div className="flex items-start gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                       <span className="text-gray-900 font-bold uppercase tracking-tighter text-[10px]">Likely Cause:</span> {s.reason}
                                    </p>
                                 </div>
                              </div>

                              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2">
                                 <Wand2 className="w-4 h-4" />
                                 Generate Intervention
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'classes' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Manage Classes</h3>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">+ New Class</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherClasses.map(c => (
                      <div key={c.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                         <div className="w-16 h-16 bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl font-black rounded-2xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {c.name[0]}
                         </div>
                         <h4 className="text-xl font-bold text-gray-900 mb-2">{c.name}</h4>
                         <p className="text-xs text-gray-400 font-mono tracking-widest">{c.code} • {c.studentIds.length + c.studentNames.length} Students</p>
                         <div className="flex gap-2 mt-4">
                            {c.subjects.map(s => (
                              <span key={s} className="px-2 py-0.5 bg-gray-50 text-[10px] font-black uppercase text-gray-400 rounded-md tracking-tighter">
                                {s}
                              </span>
                            ))}
                         </div>
                         <button className="w-full mt-8 py-3 border border-gray-100 rounded-xl text-gray-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all">
                            Open Console
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

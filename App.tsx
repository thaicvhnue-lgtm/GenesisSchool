
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, MessageSquare, Download, FileSpreadsheet, FileText, Settings, X, Camera, MessageCircle, Send, Flame } from 'lucide-react';
import OverviewTab from './components/OverviewTab';
import ClassTab from './components/ClassTab';
import CommentsTab from './components/CommentsTab';
import { MOCK_CLASSES, MOCK_STUDENTS, MOCK_TEMPLATES, Student, CommentTemplate, Classroom } from './types';
import { exportToCSV, generateClassReportPDF } from './services/exportService';

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'comments'>('overview');
  const [semester, setSemester] = useState('HK1');
  
  // Navigation State (Deep link from Overview to Class)
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);

  // Teacher Info State
  const [teacherName, setTeacherName] = useState('Nguyễn Thu Hà');
  const [teacherAvatar, setTeacherAvatar] = useState('https://picsum.photos/40/40');
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  // Gamification State
  const [streak, setStreak] = useState(0);

  // Global State
  const [classes, setClasses] = useState<Classroom[]>(MOCK_CLASSES);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [templates, setTemplates] = useState<CommentTemplate[]>(MOCK_TEMPLATES);

  // Initialize Streak Logic
  useEffect(() => {
    const checkStreak = () => {
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = localStorage.getItem('lastVisit');
        const currentStreak = parseInt(localStorage.getItem('streak') || '0');

        if (lastVisit === today) {
            // Already visited today, just set the state
            setStreak(currentStreak);
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toISOString().split('T')[0];

            let newStreak = 1;
            // If visited yesterday, increment. Otherwise, reset to 1.
            if (lastVisit === yesterdayString) {
                newStreak = currentStreak + 1;
            }

            setStreak(newStreak);
            localStorage.setItem('streak', newStreak.toString());
            localStorage.setItem('lastVisit', today);
        }
    };
    checkStreak();
  }, []);

  // Handler to jump to a student from Overview
  const handleSuggestionClick = (studentId: string) => {
      setTargetStudentId(studentId);
      setActiveTab('classes');
  };

  // --- Student Actions ---
  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const addStudent = (newStudent: Student) => {
      setStudents(prev => [...prev, newStudent]);
  };

  const addStudents = (newStudents: Student[]) => {
      setStudents(prev => [...prev, ...newStudents]);
  };

  const deleteStudent = (studentId: string) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này? Dữ liệu điểm và nhận xét sẽ mất vĩnh viễn.')) {
          setStudents(prev => prev.filter(s => s.id !== studentId));
      }
  };

  // --- Class Actions ---
  const addClass = (newClass: Classroom) => {
      setClasses(prev => [...prev, newClass]);
  };

  const updateClass = (updatedClass: Classroom) => {
      setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
  };

  const deleteClass = (classId: string) => {
      const studentsInClass = students.filter(s => s.classId === classId);
      const hasStudents = studentsInClass.length > 0;

      let message = 'Bạn có chắc chắn muốn xóa lớp này?';
      if (hasStudents) {
          message = `Lớp học này đang có ${studentsInClass.length} học sinh. Nếu xóa, các học sinh này sẽ chuyển sang trạng thái "Chưa phân lớp". Bạn có chắc chắn không?`;
      }

      if (window.confirm(message)) {
          setClasses(prev => prev.filter(c => c.id !== classId));
          if (hasStudents) {
              setStudents(prev => prev.map(s => {
                  if (s.classId === classId) {
                      return { ...s, classId: '' }; // Mark as unassigned
                  }
                  return s;
              }));
          }
      }
  };


  const handleExportAll = (type: 'pdf' | 'excel') => {
      if (type === 'excel') {
          const data = students.map(s => ({
              ID: s.id,
              Name: s.name,
              ClassID: s.classId,
              Average: (s.grades.reduce((a,b)=>a+(b.score * b.coefficient),0)/s.grades.reduce((a,b)=>a+b.coefficient,0) || 0).toFixed(2)
          }));
          exportToCSV(data, 'School_Report');
      } else {
          generateClassReportPDF("TOAN TRUONG", students, semester);
      }
  };

  const submitFeedback = () => {
      if(!feedbackText.trim()) return;
      alert("Cảm ơn thầy/cô đã đóng góp ý kiến! Chúng tôi sẽ xem xét để cải thiện EduTrack Pro.");
      setFeedbackText('');
      setIsFeedbackOpen(false);
  }

  // Temporary state for editing form
  const [tempName, setTempName] = useState(teacherName);
  const [tempAvatar, setTempAvatar] = useState(teacherAvatar);

  const saveTeacherInfo = () => {
      setTeacherName(tempName);
      setTeacherAvatar(tempAvatar);
      setIsEditingTeacher(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 transition-all duration-300">
        <div className="h-20 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-100">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_Genesis_School.png/800px-Logo_Genesis_School.png?20211124041743" 
            alt="Genesis School" 
            className="h-12 w-auto object-contain"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
           <span className="hidden md:hidden font-bold text-lg text-green-700 tracking-tight">Genesis School</span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 md:px-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-green-50 text-green-700 shadow-sm font-semibold' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={22} />
            <span className="hidden md:block ml-3">Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 ${
              activeTab === 'classes' 
                ? 'bg-green-50 text-green-700 shadow-sm font-semibold' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Users size={22} />
            <span className="hidden md:block ml-3">Lớp học</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 ${
              activeTab === 'comments' 
                ? 'bg-green-50 text-green-700 shadow-sm font-semibold' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={22} />
            <span className="hidden md:block ml-3">Nhận xét & AI</span>
          </button>

          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full flex items-center justify-center md:justify-start p-3 rounded-xl transition-all duration-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <MessageCircle size={22} />
            <span className="hidden md:block ml-3">Góp ý cải thiện</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 hidden md:block">
            <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Xuất báo cáo chung</label>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleExportAll('pdf')} className="flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-200 rounded-lg transition-colors">
                        <FileText size={18} />
                        <span className="text-[10px] mt-1">PDF Khối</span>
                    </button>
                    <button onClick={() => handleExportAll('excel')} className="flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-green-50 hover:text-green-600 border border-gray-200 rounded-lg transition-colors">
                        <FileSpreadsheet size={18} />
                        <span className="text-[10px] mt-1">Excel Khối</span>
                    </button>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute top-20 right-40 w-72 h-72 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>

        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'overview' && 'Tổng quan lớp học'}
                    {activeTab === 'classes' && 'Quản lý Học sinh'}
                    {activeTab === 'comments' && 'Thư viện & Trợ lý AI'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Hệ thống quản lý giáo dục thông minh Genesis School
                </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                 {/* Streak Display */}
                 <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 mr-2" title="Chuỗi ngày làm việc liên tục">
                    <Flame size={18} className="fill-orange-500 animate-pulse" />
                    <span className="font-bold text-sm">{streak} ngày</span>
                 </div>

                 <div className="flex flex-col px-2 border-l border-gray-100 pl-4">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Học kì</span>
                    <select 
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="text-sm font-bold text-green-700 bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0"
                    >
                        <option value="HK1">Học kì I</option>
                        <option value="HK2">Học kì II</option>
                        <option value="ALL">Cả năm</option>
                    </select>
                 </div>
                 <div className="h-8 w-px bg-gray-200 mx-1"></div>
                 <div 
                    className="flex items-center space-x-2 pr-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors p-1"
                    onClick={() => {
                        setTempName(teacherName);
                        setTempAvatar(teacherAvatar);
                        setIsEditingTeacher(true);
                    }}
                 >
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-gray-700">{teacherName}</p>
                        <p className="text-[10px] text-gray-400">Giáo viên CN</p>
                    </div>
                    <img src={teacherAvatar} alt="Profile" className="w-9 h-9 rounded-full border-2 border-green-100 object-cover" />
                 </div>
            </div>
        </header>

        <div className="relative z-10">
            {activeTab === 'overview' && (
                <OverviewTab 
                    students={students} 
                    classes={classes} 
                    semester={semester} 
                    onSuggestionClick={handleSuggestionClick}
                />
            )}
            
            {activeTab === 'classes' && (
                <ClassTab 
                    classes={classes} 
                    students={students} 
                    onUpdateStudent={updateStudent}
                    onAddStudent={addStudent}
                    onAddStudents={addStudents}
                    onDeleteStudent={deleteStudent}
                    onAddClass={addClass}
                    onUpdateClass={updateClass}
                    onDeleteClass={deleteClass}
                    templates={templates}
                    semester={semester}
                    targetStudentId={targetStudentId}
                    onClearTarget={() => setTargetStudentId(null)}
                />
            )}

            {activeTab === 'comments' && (
                <CommentsTab 
                    templates={templates} 
                    setTemplates={setTemplates} 
                    students={students}
                    classes={classes}
                    semester={semester}
                />
            )}
        </div>

        {/* Edit Teacher Modal */}
        {isEditingTeacher && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-96 relative">
                    <button onClick={() => setIsEditingTeacher(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Thông tin Giáo viên</h3>
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative group cursor-pointer">
                            <img src={tempAvatar} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 mb-2" />
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                        <input type="text" placeholder="URL Ảnh đại diện" value={tempAvatar} onChange={(e) => setTempAvatar(e.target.value)} className="text-xs text-center border-b border-gray-200 outline-none w-full p-1" />
                    </div>
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tên hiển thị</label>
                        <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <button onClick={saveTeacherInfo} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors">Lưu thay đổi</button>
                </div>
             </div>
        )}

        {/* Feedback Modal */}
        {isFeedbackOpen && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] relative">
                    <button onClick={() => setIsFeedbackOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <MessageCircle className="text-indigo-600" /> Đóng góp ý kiến
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Ý kiến của bạn giúp EduTrack Pro ngày càng hoàn thiện hơn.</p>
                    
                    <textarea 
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Hãy chia sẻ suy nghĩ của bạn về tính năng, giao diện hoặc lỗi gặp phải..."
                        className="w-full p-4 border border-gray-300 rounded-xl h-40 focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                    />
                    
                    <button 
                        onClick={submitFeedback}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                    >
                        <Send size={18} /> Gửi Góp ý
                    </button>
                </div>
             </div>
        )}
      </main>
    </div>
  );
}

export default App;

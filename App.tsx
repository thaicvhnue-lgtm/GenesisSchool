import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    LayoutDashboard, Users, MessageSquare, FileSpreadsheet, FileText, X, 
    Camera, MessageCircle, Send, Plus, Trash2, Tag, Search, Wand2, Copy, Check, 
    TrendingUp, Award, BookOpen, AlertCircle, CheckCircle, Save, 
    Pencil, Upload, FileDown, UserX, Calendar, Target, Sparkles, Flame 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MOCK_CLASSES, MOCK_STUDENTS, MOCK_TEMPLATES, SubjectType, ExamType } from './types';

// --- SERVICE UTILS (Hàm hỗ trợ xử lý xuất dữ liệu) ---
const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}

const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push('\uFEFF' + headers.join(','));
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const generateClassReportPDF = (className: string, students: any[], semester: string) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`BANG DIEM TONG HOP - ${removeVietnameseTones(className)}`, 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Hoc ki: ${semester}`, 105, 25, { align: "center" });

    const tableData = students.map((s, index) => {
        const avgScore = s.grades.length 
            ? (s.grades.reduce((a:any, b:any) => a + (b.score * b.coefficient), 0) / s.grades.reduce((a:any,b:any)=>a+b.coefficient,0)).toFixed(1) 
            : "N/A";
        return [
            (index + 1).toString(),
            removeVietnameseTones(s.name),
            avgScore,
            s.grades.length.toString()
        ];
    });

    (doc as any).autoTable({
        startY: 35,
        head: [['STT', 'Ho Ten', 'Diem TB', 'So dau diem']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save(`Class_Report_${className}.pdf`);
};

// --- API SERVICE ---
// Lấy Key từ biến môi trường (được define trong vite.config.ts)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''; 

const generateAIComment = async (studentName: string, gradesSummary: string, teacherNotes: string, gradeLevel: string, semester: string, targetGoal = "Chưa thiết lập", dailyLogSummary = "") => {
    try {
        // Kiểm tra Key TRƯỚC khi khởi tạo để tránh sập app nếu thiếu key
        if (!GEMINI_API_KEY) {
            return "Lỗi: Chưa cài đặt API Key. Vui lòng kiểm tra cấu hình Vercel hoặc file .env";
        }

        // Khởi tạo AI tại đây (Lazy initialization)
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
        Đóng vai một giáo viên chủ nhiệm/bộ môn tâm huyết.
        Hãy viết nhận xét cho học sinh: "${studentName}" (Lớp ${gradeLevel}), Thời điểm: ${semester}.
        Dữ liệu:
        - Mục tiêu: "${targetGoal}"
        - Điểm số: ${gradesSummary}
        - Nhật ký: ${dailyLogSummary}
        - Ghi chú GV: "${teacherNotes}"
        Yêu cầu: Đánh giá Kiến thức, Kỹ năng, Thái độ. Lời khuyên cụ thể 2-3 việc. Giọng văn ân cần. Ngắn gọn dưới 200 chữ.
        `;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Lỗi kết nối AI. Vui lòng kiểm tra lại API Key và mạng internet.";
    }
};

// --- SUB-COMPONENTS (Các tab chức năng) ---

const OverviewTab = ({ students, classes, semester, onSuggestionClick }: any) => {
    const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
    const selectedStudent = useMemo(() => students.find((s:any) => s.id === selectedStudentId), [students, selectedStudentId]);

    const filteredGrades = useMemo(() => {
        if (!selectedStudent) return [];
        return selectedStudent.grades.filter((g:any) => {
            const month = new Date(g.date).getMonth() + 1;
            if (semester === 'HK1') return month >= 9 || month <= 1;
            if (semester === 'HK2') return month >= 2 && month <= 6;
            return true;
        });
    }, [selectedStudent, semester]);

    const comparisonData = useMemo(() => {
        if (!selectedStudent) return [];
        const algebraGrades = filteredGrades.filter((g:any) => g.subject === SubjectType.ALGEBRA);
        const geometryGrades = filteredGrades.filter((g:any) => g.subject === SubjectType.GEOMETRY);
        const avgAlg = algebraGrades.length ? algebraGrades.reduce((sum:number, g:any) => sum + g.score, 0) / algebraGrades.length : 0;
        const avgGeo = geometryGrades.length ? geometryGrades.reduce((sum:number, g:any) => sum + g.score, 0) / geometryGrades.length : 0;
        return [
            { name: 'Đại số', score: parseFloat(avgAlg.toFixed(1)), fill: '#4F46E5' },
            { name: 'Hình học', score: parseFloat(avgGeo.toFixed(1)), fill: '#10B981' },
        ];
    }, [filteredGrades]);

    const lineChartData = useMemo(() => {
        if (!selectedStudent) return [];
        return [...filteredGrades].sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((g:any, idx:number) => ({
                idx: idx + 1,
                date: g.date,
                [g.subject]: g.score,
                name: new Date(g.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            }));
    }, [filteredGrades]);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-red-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertCircle size={20} className="text-red-500" />Gợi ý nhắc việc</h3>
                    <div className="space-y-3">
                         {students.slice(0,3).map((s:any) => (
                             <div key={s.id} onClick={() => onSuggestionClick(s.id)} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100">
                                 <img src={s.avatar} className="w-10 h-10 rounded-full" alt="" />
                                 <div><p className="font-bold text-gray-800 text-sm">{s.name}</p><p className="text-xs text-red-600">Cần kiểm tra tiến độ</p></div>
                             </div>
                         ))}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Biểu đồ tiến độ</h2>
                        <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="p-2 border rounded-lg">
                            {students.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey={SubjectType.GEOMETRY} stroke="#10B981" strokeWidth={3} />
                                <Line type="monotone" dataKey={SubjectType.ALGEBRA} stroke="#4F46E5" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>
        </div>
    );
};

const ClassTab = ({ classes, students, onUpdateStudent, onAddStudent, onDeleteStudent, onAddClass, onUpdateClass, onDeleteClass, semester, targetStudentId, onClearTarget }: any) => {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Tự động chọn học sinh nếu được chuyển hướng từ Overview
    useEffect(() => {
        if (targetStudentId) {
            const student = students.find((s:any) => s.id === targetStudentId);
            if (student) {
                setSelectedClassId(student.classId);
                setSelectedStudent(student);
            }
            onClearTarget();
        }
    }, [targetStudentId, students]);

    const filteredStudents = students.filter((s:any) => {
        const classMatch = selectedClassId === null ? true : selectedClassId === 'unassigned' ? !s.classId : s.classId === selectedClassId;
        return classMatch && s.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSaveGrade = (newGrade: any) => {
        if (!selectedStudent) return;
        const updatedGrades = [...selectedStudent.grades, newGrade];
        onUpdateStudent({ ...selectedStudent, grades: updatedGrades });
        setSelectedStudent({ ...selectedStudent, grades: updatedGrades });
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in">
            <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex-shrink-0 flex flex-col p-2">
                <h3 className="font-semibold text-gray-700 p-2">Danh sách Lớp</h3>
                <button onClick={() => setSelectedClassId(null)} className={`text-left px-4 py-2 rounded ${selectedClassId===null ? 'bg-indigo-100 text-indigo-700' : ''}`}>Tất cả</button>
                {classes.map((cls:any) => (
                    <div key={cls.id} onClick={() => setSelectedClassId(cls.id)} className={`flex justify-between px-4 py-2 rounded cursor-pointer ${selectedClassId===cls.id ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-50'}`}>
                        {cls.name}
                        <button onClick={(e) => {e.stopPropagation(); onDeleteClass(cls.id)}} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                ))}
                <button onClick={() => onAddClass({id:`c${Date.now()}`, name:'Lớp Mới', gradeLevel:'6', year:'2024'})} className="flex items-center gap-2 text-sm text-indigo-600 mt-2 p-2"><Plus size={16}/> Thêm lớp</button>
            </div>
            
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                 <div className="flex justify-between mb-4">
                     <input type="text" placeholder="Tìm học sinh..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="border p-2 rounded w-64" />
                     <button onClick={() => setSelectedStudent({id:'new', name:'', classId: selectedClassId || classes[0]?.id, grades:[], comments:[], dailyLogs:[], avatar:'https://picsum.photos/200'})} className="bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-1"><Plus size={16}/> Thêm HS</button>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                     {filteredStudents.map((s:any) => (
                         <div key={s.id} onClick={() => setSelectedStudent(s)} className="border p-4 rounded-xl hover:shadow-md cursor-pointer flex items-center gap-3">
                             <img src={s.avatar} className="w-12 h-12 rounded-full" alt="" />
                             <div><h4 className="font-bold">{s.name}</h4><p className="text-xs text-gray-500">Điểm TB: {(s.grades.reduce((a:any,b:any)=>a+b.score,0)/s.grades.length || 0).toFixed(1)}</p></div>
                         </div>
                     ))}
                 </div>
            </div>

            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50" onClick={() => setSelectedStudent(null)}>
                    <div className="w-[600px] bg-white h-full shadow-2xl p-6 overflow-y-auto" onClick={e=>e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{selectedStudent.id==='new'?'Thêm Học Sinh':selectedStudent.name}</h2>
                            <button onClick={()=>setSelectedStudent(null)}><X/></button>
                        </div>
                        {selectedStudent.id==='new' ? (
                            <div className="space-y-4">
                                <input className="w-full border p-2 rounded" placeholder="Họ tên" value={selectedStudent.name} onChange={e=>setSelectedStudent({...selectedStudent, name:e.target.value})} />
                                <button onClick={()=>{onAddStudent({...selectedStudent, id:`s${Date.now()}`}); setSelectedStudent(null)}} className="bg-indigo-600 text-white p-2 rounded w-full">Lưu</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold mb-2">Bảng điểm</h3>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50"><tr><th className="p-2 text-left">Môn</th><th className="p-2">Loại</th><th className="p-2 text-right">Điểm</th></tr></thead>
                                        <tbody>
                                            {selectedStudent.grades.map((g:any)=>(<tr key={g.id} className="border-b"><td className="p-2">{g.subject}</td><td className="p-2">{g.examType}</td><td className="p-2 text-right font-bold">{g.score}</td></tr>))}
                                        </tbody>
                                    </table>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={()=>handleSaveGrade({id:Date.now(), subject: SubjectType.ALGEBRA, examType: ExamType.REGULAR, coefficient:1, score: 9, date: new Date().toISOString()})} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">+ Thêm điểm nhanh (Demo)</button>
                                    </div>
                                </div>
                                <button onClick={()=>{onDeleteStudent(selectedStudent.id); setSelectedStudent(null)}} className="text-red-500 text-sm flex items-center gap-1"><Trash2 size={14}/> Xóa học sinh</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const CommentsTab = ({ templates, setTemplates, students, classes, semester }: any) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [generatedComment, setGeneratedComment] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if(!selectedStudentId) return;
        setIsGenerating(true);
        const student = students.find((s:any) => s.id === selectedStudentId);
        const cls = classes.find((c:any) => c.id === student?.classId);
        const comment = await generateAIComment(student.name, "Giỏi Toán", "Học tốt", cls?.gradeLevel || "6", semester, student.targetGoal);
        setGeneratedComment(comment);
        setIsGenerating(false);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-fade-in">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-gray-700 mb-4 flex gap-2"><Sparkles className="text-purple-600"/> Trợ lý AI</h3>
                 <select className="w-full border p-2 rounded mb-4" value={selectedStudentId} onChange={e=>setSelectedStudentId(e.target.value)}>
                     <option value="">Chọn học sinh...</option>
                     {students.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-indigo-600 text-white p-3 rounded-lg disabled:bg-gray-400">
                     {isGenerating ? 'Đang viết...' : 'Tạo nhận xét tự động'}
                 </button>
                 {generatedComment && (
                     <div className="mt-4 p-4 bg-purple-50 rounded-lg text-sm whitespace-pre-line border border-purple-100">
                         {generatedComment}
                     </div>
                 )}
             </div>
        </div>
    )
}

// --- MAIN APP ---
function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'comments'>('overview');
  const [semester, setSemester] = useState('HK1');
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('Nguyễn Thu Hà');
  const [streak, setStreak] = useState(0);

  // Global State
  const [classes, setClasses] = useState<any[]>(MOCK_CLASSES);
  const [students, setStudents] = useState<any[]>(MOCK_STUDENTS);
  const [templates, setTemplates] = useState<any[]>(MOCK_TEMPLATES);

  useEffect(() => {
    // Streak logic simulation
    setStreak(12); 
  }, []);

  const handleSuggestionClick = (studentId: string) => {
      setTargetStudentId(studentId);
      setActiveTab('classes');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex">
      <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="h-20 flex items-center justify-center border-b border-gray-100">
             <span className="font-bold text-green-700 text-xl">Genesis</span>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-2 md:px-4">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex p-3 rounded-xl ${activeTab === 'overview' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-500'}`}>
            <LayoutDashboard size={22} /><span className="hidden md:block ml-3">Tổng quan</span>
          </button>
          <button onClick={() => setActiveTab('classes')} className={`w-full flex p-3 rounded-xl ${activeTab === 'classes' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-500'}`}>
            <Users size={22} /><span className="hidden md:block ml-3">Lớp học</span>
          </button>
          <button onClick={() => setActiveTab('comments')} className={`w-full flex p-3 rounded-xl ${activeTab === 'comments' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-500'}`}>
            <MessageSquare size={22} /><span className="hidden md:block ml-3">Nhận xét & AI</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen relative">
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'overview' && 'Tổng quan lớp học'}
                    {activeTab === 'classes' && 'Quản lý Học sinh'}
                    {activeTab === 'comments' && 'Thư viện & Trợ lý AI'}
                </h1>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm">
                 <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg">
                    <Flame size={18} /> <span className="font-bold">{streak} ngày</span>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-semibold">{teacherName}</p>
                 </div>
                 <img src="https://picsum.photos/40/40" className="w-9 h-9 rounded-full" alt="Profile" />
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
                    onUpdateStudent={(s:any) => setStudents(prev => prev.map(old => old.id===s.id ? s : old))}
                    onAddStudent={(s:any) => setStudents(prev => [...prev, s])}
                    onDeleteStudent={(id:string) => setStudents(prev => prev.filter(s => s.id !== id))}
                    onAddClass={(c:any) => setClasses(prev => [...prev, c])}
                    onUpdateClass={(c:any) => setClasses(prev => prev.map(old => old.id===c.id ? c : old))}
                    onDeleteClass={(id:string) => setClasses(prev => prev.filter(c => c.id !== id))}
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
      </main>
    </div>
  );
}

export default App;

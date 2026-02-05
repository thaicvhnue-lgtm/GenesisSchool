
import React, { useState, useRef, useEffect } from 'react';
import { Classroom, Student, Grade, SubjectType, StudentComment, ExamType, DailyLog } from '../types';
import { User, Plus, Search, ChevronRight, X, Save, Star, FileText, FileSpreadsheet, Download, Pencil, Trash2, Upload, FileDown, Check, MoreVertical, Edit, UserX, Calendar, Target, Clock, History, CloudUpload, RefreshCw } from 'lucide-react';
import { exportToCSV, generateStudentReportPDF, generateClassReportPDF } from '../services/exportService';
import { downloadTemplate, parseStudentImportFile } from '../services/excelService';

interface ClassTabProps {
    classes: Classroom[];
    students: Student[];
    onUpdateStudent: (updatedStudent: Student) => void;
    onAddStudent: (newStudent: Student) => void;
    onAddStudents: (newStudents: Student[]) => void;
    onDeleteStudent: (studentId: string) => void;
    onAddClass: (newClass: Classroom) => void;
    onUpdateClass: (updatedClass: Classroom) => void;
    onDeleteClass: (classId: string) => void;
    templates: { keyword: string; content: string }[];
    semester: string;
    targetStudentId?: string | null;
    onClearTarget?: () => void;
}

const ClassTab: React.FC<ClassTabProps> = ({ 
    classes, students, 
    onUpdateStudent, onAddStudent, onAddStudents, onDeleteStudent,
    onAddClass, onUpdateClass, onDeleteClass,
    templates, semester,
    targetStudentId, onClearTarget
}) => {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Student Modal Internal Tab State
    const [modalTab, setModalTab] = useState<'info' | 'grades' | 'logs' | 'ai'>('info');

    // Grade Form States
    const [newScore, setNewScore] = useState('');
    const [examType, setExamType] = useState<ExamType>(ExamType.REGULAR);
    const [newSubject, setNewSubject] = useState<SubjectType>(SubjectType.ALGEBRA);
    const [editingGradeId, setEditingGradeId] = useState<string | null>(null);

    // Daily Log Form States
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [logCategory, setLogCategory] = useState<'Knowledge'|'Skill'|'Attitude'>('Attitude');
    const [logContent, setLogContent] = useState('');

    // Sync State (Simulated)
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Modal States for Class Management ---
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<Classroom | null>(null);
    const [classNameInput, setClassNameInput] = useState('');
    const [classGradeInput, setClassGradeInput] = useState('6');
    const [classYearInput, setClassYearInput] = useState(new Date().getFullYear().toString());

    // --- Student Edit Mode ---
    const [isEditingStudentInfo, setIsEditingStudentInfo] = useState(false);
    const [editStudentName, setEditStudentName] = useState('');
    const [editStudentClassId, setEditStudentClassId] = useState('');
    const [editStudentAvatar, setEditStudentAvatar] = useState('');
    const [editTargetGoal, setEditTargetGoal] = useState('');
    const [editHistoricalNotes, setEditHistoricalNotes] = useState('');

    // --- Auto-open Modal Logic ---
    useEffect(() => {
        if (targetStudentId) {
            const student = students.find(s => s.id === targetStudentId);
            if (student) {
                // Determine class context
                if (student.classId) {
                    setSelectedClassId(student.classId);
                } else {
                    setSelectedClassId('unassigned');
                }
                
                // Open modal
                setSelectedStudent(student);
                // Default to 'grades' for quick entry as requested
                setModalTab('grades'); 
            }
            // Clear the target so it doesn't reopen if we close it and component updates
            if (onClearTarget) onClearTarget();
        }
    }, [targetStudentId, students, onClearTarget]);

    const filteredStudents = students.filter(s => {
        const classMatch = selectedClassId === null ? true 
                         : selectedClassId === 'unassigned' ? !s.classId
                         : s.classId === selectedClassId;
        const searchMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        return classMatch && searchMatch;
    });

    const unassignedCount = students.filter(s => !s.classId).length;

    // --- Simulated Google Sync Function ---
    const simulateGoogleSync = () => {
        setIsSyncing(true);
        setSyncMessage("Đang đồng bộ dữ liệu lên Google Drive...");
        
        setTimeout(() => {
            setIsSyncing(false);
            setSyncMessage("✅ Đã cập nhật lên file Excel chung (Drive)");
            
            // Clear message after 3 seconds
            setTimeout(() => {
                setSyncMessage("");
            }, 3000);
        }, 1500); // Fake delay
    }

    // --- Class Handlers ---
    const openAddClassModal = () => {
        setEditingClass(null);
        setClassNameInput('');
        setClassGradeInput('6');
        setIsClassModalOpen(true);
    };

    const openEditClassModal = (cls: Classroom, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingClass(cls);
        setClassNameInput(cls.name);
        setClassGradeInput(cls.gradeLevel);
        setClassYearInput(cls.year);
        setIsClassModalOpen(true);
    };

    const handleClassSubmit = () => {
        if (!classNameInput.trim()) {
            alert("Tên lớp không được để trống");
            return;
        }

        if (editingClass) {
            onUpdateClass({
                ...editingClass,
                name: classNameInput,
                gradeLevel: classGradeInput,
                year: classYearInput
            });
        } else {
            onAddClass({
                id: `c${Date.now()}`,
                name: classNameInput,
                gradeLevel: classGradeInput,
                year: classYearInput
            });
        }
        setIsClassModalOpen(false);
    };

    const handleDeleteClassClick = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedClassId === id) setSelectedClassId(null);
        setTimeout(() => {
            onDeleteClass(id);
        }, 50);
    };

    // --- Student Handlers ---
    const handleAddStudentClick = () => {
        const newStudent: Student = {
            id: 'new',
            name: '',
            classId: selectedClassId && selectedClassId !== 'unassigned' ? selectedClassId : (classes[0] ? classes[0].id : ''),
            avatar: 'https://picsum.photos/200/200?random=' + Date.now(),
            grades: [],
            comments: [],
            dailyLogs: []
        };
        setSelectedStudent(newStudent);
        setModalTab('info');
    };

    const handleCreateStudent = () => {
        if (!selectedStudent || !selectedStudent.name) {
            alert("Vui lòng nhập tên học sinh");
            return;
        }
        const studentToCreate = {
            ...selectedStudent,
            id: 's' + Date.now().toString(),
        };
        onAddStudent(studentToCreate);
        setSelectedStudent(studentToCreate);
    };

    // Edit Student Info Logic
    const startEditingStudentInfo = () => {
        if (!selectedStudent) return;
        setEditStudentName(selectedStudent.name);
        setEditStudentClassId(selectedStudent.classId);
        setEditStudentAvatar(selectedStudent.avatar);
        setEditTargetGoal(selectedStudent.targetGoal || '');
        setEditHistoricalNotes(selectedStudent.historicalNotes || '');
        setIsEditingStudentInfo(true);
    };

    const saveStudentInfo = () => {
        if (!selectedStudent) return;
        const updated = {
            ...selectedStudent,
            name: editStudentName,
            classId: editStudentClassId,
            avatar: editStudentAvatar,
            targetGoal: editTargetGoal,
            historicalNotes: editHistoricalNotes
        };
        onUpdateStudent(updated);
        setSelectedStudent(updated);
        setIsEditingStudentInfo(false);
        simulateGoogleSync(); // Trigger sync
    };

    const handleDeleteStudentClick = () => {
        if (!selectedStudent) return;
        onDeleteStudent(selectedStudent.id);
        setSelectedStudent(null);
    };


    // Helper to determine coefficient based on Exam Type
    const getCoefficient = (type: ExamType): number => {
        switch(type) {
            case ExamType.MIDTERM: return 2;
            case ExamType.FINAL: return 3;
            default: return 1;
        }
    };

    const showSubjectSelector = examType === ExamType.REGULAR || examType === ExamType.MONTHLY;

    const handleSaveGrade = () => {
        if (!selectedStudent || !newScore) return;
        const scoreNum = parseFloat(newScore);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
            alert("Điểm số không hợp lệ (0-10)");
            return;
        }

        const finalSubject = showSubjectSelector ? newSubject : SubjectType.GENERAL;

        if (editingGradeId) {
            const updatedGrades = selectedStudent.grades.map(g => {
                if (g.id === editingGradeId) {
                    return {
                        ...g,
                        subject: finalSubject,
                        examType: examType,
                        coefficient: getCoefficient(examType),
                        score: scoreNum,
                        date: new Date().toISOString() 
                    };
                }
                return g;
            });
             const updatedStudent = { ...selectedStudent, grades: updatedGrades };
             onUpdateStudent(updatedStudent);
             setSelectedStudent(updatedStudent);
        } else {
            const newGrade: Grade = {
                id: Date.now().toString(),
                subject: finalSubject,
                examType: examType,
                coefficient: getCoefficient(examType),
                score: scoreNum,
                date: new Date().toISOString(),
            };
            const updatedStudent = {
                ...selectedStudent,
                grades: [...selectedStudent.grades, newGrade]
            };
            onUpdateStudent(updatedStudent);
            setSelectedStudent(updatedStudent);
        }
        setNewScore('');
        setEditingGradeId(null);
        simulateGoogleSync(); // Trigger sync
    };

    const handleEditGrade = (grade: Grade) => {
        setNewScore(grade.score.toString());
        setExamType(grade.examType);
        setNewSubject(grade.subject === SubjectType.GENERAL ? SubjectType.ALGEBRA : grade.subject);
        setEditingGradeId(grade.id);
    };

    const handleDeleteGrade = (gradeId: string) => {
        if(!selectedStudent) return;
        if(confirm("Bạn có chắc chắn muốn xóa điểm này?")) {
            const updatedGrades = selectedStudent.grades.filter(g => g.id !== gradeId);
            const updatedStudent = { ...selectedStudent, grades: updatedGrades };
            onUpdateStudent(updatedStudent);
            setSelectedStudent(updatedStudent);
            simulateGoogleSync(); // Trigger sync
        }
    };

    // --- Daily Log Handlers ---
    const handleSaveLog = () => {
        if (!selectedStudent || !logContent.trim()) return;
        
        const newLog: DailyLog = {
            id: Date.now().toString(),
            date: logDate,
            category: logCategory,
            content: logContent
        };

        const updatedStudent = {
            ...selectedStudent,
            dailyLogs: [...(selectedStudent.dailyLogs || []), newLog]
        };

        onUpdateStudent(updatedStudent);
        setSelectedStudent(updatedStudent);
        setLogContent(''); // Reset content, keep date/category
        simulateGoogleSync(); // Trigger sync
    };

    const handleDeleteLog = (logId: string) => {
         if(!selectedStudent) return;
         const updatedLogs = selectedStudent.dailyLogs.filter(l => l.id !== logId);
         const updatedStudent = { ...selectedStudent, dailyLogs: updatedLogs };
         onUpdateStudent(updatedStudent);
         setSelectedStudent(updatedStudent);
         simulateGoogleSync(); // Trigger sync
    };


    // Export Handlers
    const exportClassPDF = () => {
        const className = selectedClassId ? classes.find(c => c.id === selectedClassId)?.name || 'Danh_sach' : 'Danh_sach';
        generateClassReportPDF(className, filteredStudents, semester);
    };

    const exportClassExcel = () => {
        const data = filteredStudents.map(s => ({
            ID: s.id,
            Name: s.name,
            Class: classes.find(c => c.id === s.classId)?.name,
            Target: s.targetGoal || '',
            Avg: (s.grades.reduce((a,b)=>a+(b.score * b.coefficient),0)/s.grades.reduce((a,b)=>a+b.coefficient,0) || 0).toFixed(2),
            Log_Count: s.dailyLogs?.length || 0
        }));
        exportToCSV(data, `Class_Export_${selectedClassId || 'All'}`);
    };

    const exportStudentPDF = (student: Student) => {
        const className = classes.find(c => c.id === student.classId)?.name || 'Unknown';
        generateStudentReportPDF(student, className, semester);
    };

    // Import Handlers
    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const targetClassId = selectedClassId && selectedClassId !== 'unassigned' ? selectedClassId : (classes.length > 0 ? classes[0].id : 'c1');
        
        try {
            const importedStudents = await parseStudentImportFile(file, targetClassId);
            if (importedStudents.length > 0) {
                let existingCount = 0;
                let newCount = 0;
                const newStudentsList: Student[] = [];

                importedStudents.forEach(imported => {
                    const existing = students.find(s => s.id === imported.id || s.name === imported.name); // Match by ID or Name
                    if (existing) {
                         // Merge grades
                         const mergedGrades = [...existing.grades, ...imported.grades];
                         const mergedComments = [...existing.comments, ...imported.comments];
                         onUpdateStudent({ ...existing, grades: mergedGrades, comments: mergedComments });
                         existingCount++;
                    } else {
                         newStudentsList.push(imported);
                         newCount++;
                    }
                });

                if (newStudentsList.length > 0) {
                    onAddStudents(newStudentsList);
                }

                alert(`Đã hoàn tất nhập dữ liệu!\n- Cập nhật: ${existingCount} học sinh\n- Thêm mới: ${newCount} học sinh`);
            }
        } catch (err) {
            alert(err);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in relative">
            {/* Sync Notification Banner */}
            {(isSyncing || syncMessage) && (
                <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 ${isSyncing ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                    {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                    {syncMessage}
                </div>
            )}

            {/* Sidebar: Class List */}
            <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex-shrink-0 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Danh sách Lớp</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    <button 
                        onClick={() => setSelectedClassId(null)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedClassId === null ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Tất cả học sinh
                    </button>
                    {/* Unassigned Students Category */}
                    <button 
                        onClick={() => setSelectedClassId('unassigned')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${selectedClassId === 'unassigned' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <span className="flex items-center gap-2">
                             <UserX size={16} /> Chưa phân lớp
                        </span>
                        {unassignedCount > 0 && <span className="text-xs bg-white/20 px-1.5 rounded-full">{unassignedCount}</span>}
                    </button>

                    {classes.map(cls => (
                        <div
                            key={cls.id}
                            onClick={() => setSelectedClassId(cls.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex justify-between items-center group cursor-pointer ${selectedClassId === cls.id ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <span>{cls.name}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={(e) => openEditClassModal(cls, e)} className={`p-1.5 rounded hover:bg-white/20 transition-colors ${selectedClassId === cls.id ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                    <Pencil size={14} />
                                </button>
                                <button onClick={(e) => handleDeleteClassClick(cls.id, e)} className={`p-1.5 rounded hover:bg-white/20 transition-colors ${selectedClassId === cls.id ? 'text-white' : 'text-gray-400 hover:text-red-500'}`}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-gray-100">
                    <button 
                        onClick={openAddClassModal}
                        className="w-full flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-indigo-50 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={16} /> Thêm Lớp
                    </button>
                </div>
            </div>

            {/* Main Content: Student List */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50 rounded-t-xl gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-gray-700">
                                {selectedClassId === 'unassigned' ? 'Học sinh chưa phân lớp' : selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : 'Tất cả học sinh'}
                                <span className="ml-2 text-sm font-normal text-gray-500">({filteredStudents.length})</span>
                            </h3>
                             {/* Class Export Buttons */}
                            <div className="flex gap-1 border-l pl-3 ml-1 border-gray-200">
                                 <button onClick={exportClassExcel} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors border border-green-200" title="Xuất dữ liệu Excel Online">
                                    <CloudUpload size={14} /> Excel Online
                                 </button>
                            </div>
                        </div>
                        
                        {/* Import/Template Buttons */}
                        <div className="flex gap-2">
                            <button 
                                onClick={downloadTemplate}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            >
                                <FileDown size={14} /> Tải file mẫu
                            </button>
                            
                            <div className="relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileImport}
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                >
                                    <Upload size={14} /> Nhập từ Excel
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm học sinh..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full sm:w-64 !bg-white !text-gray-900"
                        />
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStudents.map(student => (
                            <div 
                                key={student.id}
                                onClick={() => { setSelectedStudent(student); setModalTab('info'); }}
                                className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 flex flex-col justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 group-hover:border-primary transition-colors" />
                                    <div>
                                        <h4 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">{student.name}</h4>
                                        <p className="text-xs text-gray-500">{classes.find(c => c.id === student.classId)?.name || 'Chưa phân lớp'}</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {student.targetGoal && (
                                        <p className="text-xs text-indigo-600 bg-indigo-50 p-1 rounded mb-2 line-clamp-1">
                                            🎯 {student.targetGoal}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                                    <span>ĐTB: {(student.grades.length ? (student.grades.reduce((a,b) => a+(b.score * b.coefficient),0)/student.grades.reduce((a,b) => a+b.coefficient,0)).toFixed(1) : '--')}</span>
                                    <span>{student.dailyLogs?.length || 0} nhật ký</span>
                                </div>
                            </div>
                        ))}
                         {/* Add Student Card */}
                         <div 
                            onClick={handleAddStudentClick}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary hover:bg-indigo-50 transition-all cursor-pointer min-h-[140px]"
                        >
                            <Plus size={24} />
                            <span className="text-sm font-medium mt-2">Thêm học sinh</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal / Side Panel for Student Details */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50 animate-fade-in" onClick={() => setSelectedStudent(null)}>
                    <div 
                        className="w-full md:w-[700px] bg-white h-full shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                            {selectedStudent.id === 'new' ? (
                                <div className="w-full">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Thêm học sinh mới</h2>
                                    <div className="space-y-4">
                                        <input 
                                            type="text" 
                                            placeholder="Họ và tên"
                                            value={selectedStudent.name}
                                            onChange={e => setSelectedStudent({...selectedStudent, name: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                        <select 
                                            value={selectedStudent.classId}
                                            onChange={e => setSelectedStudent({...selectedStudent, classId: e.target.value})}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">-- Chưa phân lớp --</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button onClick={handleCreateStudent} className="w-full bg-primary text-white py-2 rounded-lg font-medium">Lưu</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex w-full justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <img src={selectedStudent.avatar} className="w-16 h-16 rounded-full border-4 border-white shadow" />
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h2>
                                            <p className="text-sm text-gray-500">{classes.find(c => c.id === selectedStudent.classId)?.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-200 rounded-full">
                                        <X size={24} className="text-gray-500" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedStudent.id !== 'new' && (
                            <>
                                {/* Tabs */}
                                <div className="flex border-b border-gray-200 px-6">
                                    <button onClick={() => setModalTab('info')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${modalTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Thông tin & Mục tiêu</button>
                                    <button onClick={() => setModalTab('grades')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${modalTab === 'grades' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Điểm số</button>
                                    <button onClick={() => setModalTab('logs')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${modalTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Nhật ký hằng ngày</button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                                    {modalTab === 'info' && (
                                        <div className="space-y-6">
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Target size={18} className="text-red-500"/> Mục tiêu & Định hướng</h3>
                                                    {!isEditingStudentInfo && <button onClick={startEditingStudentInfo} className="text-xs text-blue-600 font-medium">Chỉnh sửa</button>}
                                                </div>
                                                
                                                {isEditingStudentInfo ? (
                                                    <div className="space-y-3 animate-fade-in">
                                                        <input value={editStudentName} onChange={(e) => setEditStudentName(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Tên học sinh" />
                                                        <input value={editTargetGoal} onChange={(e) => setEditTargetGoal(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Mục tiêu (VD: Đỗ chuyên Toán)" />
                                                        <textarea value={editHistoricalNotes} onChange={(e) => setEditHistoricalNotes(e.target.value)} className="w-full p-2 border rounded text-sm h-24" placeholder="Ghi chú học bạ tiểu học/năm trước..." />
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => setIsEditingStudentInfo(false)} className="text-gray-500 text-xs">Hủy</button>
                                                            <button onClick={saveStudentInfo} className="bg-primary text-white text-xs px-3 py-1.5 rounded">Lưu thay đổi</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs text-gray-400 font-bold uppercase">Mục tiêu năm học</label>
                                                            <p className="text-gray-800 font-medium">{selectedStudent.targetGoal || 'Chưa thiết lập mục tiêu'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-400 font-bold uppercase">Hồ sơ quá khứ</label>
                                                            <p className="text-gray-600 text-sm">{selectedStudent.historicalNotes || 'Chưa có dữ liệu học bạ.'}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-center mt-8">
                                                 <button onClick={handleDeleteStudentClick} className="text-red-500 text-sm flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded transition-colors">
                                                    <Trash2 size={16} /> Xóa học sinh này
                                                 </button>
                                            </div>
                                        </div>
                                    )}

                                    {modalTab === 'grades' && (
                                        <div className="space-y-4">
                                            {/* Grade Input */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex justify-between items-center">
                                                    <span>{editingGradeId ? 'Sửa điểm' : 'Nhập điểm mới'}</span>
                                                    {editingGradeId && <button onClick={() => { setEditingGradeId(null); setNewScore(''); }} className="text-xs text-red-500 hover:underline">Hủy</button>}
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <select value={examType} onChange={(e) => setExamType(e.target.value as ExamType)} className="p-2 border rounded text-sm">
                                                        <option value={ExamType.REGULAR}>Thường xuyên</option>
                                                        <option value={ExamType.MONTHLY}>Tháng</option>
                                                        <option value={ExamType.MIDTERM}>Giữa kì</option>
                                                        <option value={ExamType.FINAL}>Cuối kì</option>
                                                    </select>
                                                    {showSubjectSelector ? (
                                                        <select value={newSubject} onChange={(e) => setNewSubject(e.target.value as SubjectType)} className="p-2 border rounded text-sm">
                                                            <option value={SubjectType.ALGEBRA}>{SubjectType.ALGEBRA}</option>
                                                            <option value={SubjectType.GEOMETRY}>{SubjectType.GEOMETRY}</option>
                                                        </select>
                                                    ) : (
                                                        <div className="p-2 border bg-gray-100 rounded text-sm text-gray-500 text-center">Toán chung</div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input type="number" step="0.1" max="10" placeholder="Điểm số (0-10)" value={newScore} onChange={(e) => setNewScore(e.target.value)} className="flex-1 p-2 border rounded text-sm" />
                                                    <button onClick={handleSaveGrade} className="bg-primary text-white px-4 rounded hover:bg-indigo-700"><Save size={18} /></button>
                                                </div>
                                            </div>

                                            {/* Grade List */}
                                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 text-gray-500">
                                                        <tr>
                                                            <th className="p-3 text-left">Ngày</th>
                                                            <th className="p-3 text-left">Loại bài</th>
                                                            <th className="p-3 text-left">Môn</th>
                                                            <th className="p-3 text-right">Điểm</th>
                                                            <th className="p-3"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {selectedStudent.grades.slice().reverse().map(g => (
                                                            <tr key={g.id} className="hover:bg-gray-50">
                                                                <td className="p-3 text-gray-600">{new Date(g.date).toLocaleDateString('vi-VN')}</td>
                                                                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${g.examType === ExamType.FINAL ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{g.examType}</span></td>
                                                                <td className="p-3 text-gray-800">{g.subject}</td>
                                                                <td className="p-3 text-right font-bold">{g.score}</td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <button onClick={() => handleEditGrade(g)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil size={14} /></button>
                                                                        <button onClick={() => handleDeleteGrade(g.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {selectedStudent.grades.length === 0 && <p className="text-center p-4 text-gray-400">Chưa có điểm số.</p>}
                                            </div>
                                        </div>
                                    )}

                                    {modalTab === 'logs' && (
                                        <div className="space-y-6">
                                            {/* Daily Log Input */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
                                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                    <Calendar size={18} className="text-green-600" /> 
                                                    Ghi chép hằng ngày
                                                </h3>
                                                <div className="flex gap-2 mb-2">
                                                    <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="p-2 border rounded text-sm" />
                                                    <select value={logCategory} onChange={(e) => setLogCategory(e.target.value as any)} className="p-2 border rounded text-sm flex-1">
                                                        <option value="Attitude">Thái độ/Ý thức</option>
                                                        <option value="Knowledge">Kiến thức</option>
                                                        <option value="Skill">Kỹ năng</option>
                                                    </select>
                                                </div>
                                                <textarea 
                                                    value={logContent} 
                                                    onChange={(e) => setLogContent(e.target.value)}
                                                    placeholder="Ví dụ: Hôm nay con xung phong lên bảng, nhưng tính toán còn chậm..."
                                                    className="w-full p-3 border rounded-lg text-sm h-20 mb-2"
                                                />
                                                <button onClick={handleSaveLog} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 font-medium">Lưu Ghi chép</button>
                                            </div>

                                            {/* Log History */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase">Lịch sử ghi chép</h4>
                                                {(selectedStudent.dailyLogs || []).slice().reverse().map(log => (
                                                    <div key={log.id} className="bg-white p-3 rounded-lg border border-gray-100 hover:shadow-sm group relative">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{new Date(log.date).toLocaleDateString('vi-VN')}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                                    log.category === 'Attitude' ? 'bg-purple-100 text-purple-700' :
                                                                    log.category === 'Knowledge' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                                }`}>{log.category === 'Attitude' ? 'Thái độ' : log.category === 'Knowledge' ? 'Kiến thức' : 'Kỹ năng'}</span>
                                                            </div>
                                                            <button onClick={() => handleDeleteLog(log.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                                                        </div>
                                                        <p className="text-gray-800 text-sm">{log.content}</p>
                                                    </div>
                                                ))}
                                                {(!selectedStudent.dailyLogs || selectedStudent.dailyLogs.length === 0) && (
                                                    <p className="text-gray-400 italic text-center text-sm">Chưa có ghi chép nào.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal for Add/Edit Class */}
            {isClassModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            {editingClass ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp</label>
                                <input 
                                    type="text" 
                                    value={classNameInput}
                                    onChange={(e) => setClassNameInput(e.target.value)}
                                    placeholder="Ví dụ: Lớp 6A1"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khối</label>
                                <select 
                                    value={classGradeInput}
                                    onChange={(e) => setClassGradeInput(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    {[6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Niên khóa</label>
                                <input 
                                    type="text" 
                                    value={classYearInput}
                                    onChange={(e) => setClassYearInput(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button 
                                    onClick={() => setIsClassModalOpen(false)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleClassSubmit}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-indigo-700"
                                >
                                    {editingClass ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassTab;


import React, { useState } from 'react';
import { CommentTemplate, Student, Classroom } from '../types';
import { Sparkles, Plus, Trash2, Tag, Search, Wand2, Copy, Check } from 'lucide-react';
import { generateAIComment } from '../services/geminiService';

interface CommentsTabProps {
    templates: CommentTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<CommentTemplate[]>>;
    students: Student[];
    classes: Classroom[];
    semester: string; // Added semester prop
}

const CommentsTab: React.FC<CommentsTabProps> = ({ templates, setTemplates, students, classes, semester }) => {
    // Template Management State
    const [newKeyword, setNewKeyword] = useState('');
    const [newContent, setNewContent] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // AI Generator State
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [teacherNotes, setTeacherNotes] = useState('');
    const [generatedComment, setGeneratedComment] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleAddTemplate = () => {
        if (!newKeyword || !newContent) return;
        setTemplates([...templates, {
            id: Date.now().toString(),
            keyword: newKeyword,
            content: newContent,
            category: 'Chung' 
        }]);
        setNewKeyword('');
        setNewContent('');
    };

    const handleDeleteTemplate = (id: string) => {
        setTemplates(templates.filter(t => t.id !== id));
    };

    const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sid = e.target.value;
        setSelectedStudentId(sid);
        
        const student = students.find(s => s.id === sid);
        if (student) {
             // Populate notes with historical data if available, plus recent comments
             let initialNote = "";
             if (student.historicalNotes) initialNote += `[Học bạ cũ: ${student.historicalNotes}] `;
             if (student.dailyLogs && student.dailyLogs.length > 0) {
                 const recentLogs = student.dailyLogs.slice(-3).map(l => `${l.date}: ${l.content}`).join('. ');
                 initialNote += `[Ghi chép gần đây: ${recentLogs}]`;
             }
             setTeacherNotes(initialNote);
        } else {
            setTeacherNotes('');
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedStudentId) {
            alert("Vui lòng chọn học sinh");
            return;
        }
        setIsGenerating(true);
        setGeneratedComment('');
        
        const student = students.find(s => s.id === selectedStudentId);
        const studentClass = classes.find(c => c.id === student?.classId);
        const gradeLevel = studentClass?.gradeLevel || 'Khối lớp chưa xác định';

        if (student) {
            // Summarize grades
            const alg = student.grades.filter(g => g.subject.includes('Đại số')).map(g => g.score);
            const geo = student.grades.filter(g => g.subject.includes('Hình học')).map(g => g.score);
            const monthly = student.grades.filter(g => g.examType === 'Tháng').map(g => g.score);

            const summary = `Đại số: ${alg.join(', ') || 'Chưa có'}. Hình học: ${geo.join(', ') || 'Chưa có'}. Kiểm tra Tháng: ${monthly.join(', ') || 'Chưa có'}`;
            
            // Summarize Daily Logs
            const logSummary = student.dailyLogs?.map(l => `[${l.category}] ${l.content}`).join('; ') || "Chưa có ghi chép hằng ngày.";

            const result = await generateAIComment(
                student.name, 
                summary, 
                teacherNotes,
                gradeLevel,
                semester,
                student.targetGoal,
                logSummary
            );
            setGeneratedComment(result);
        }
        
        setIsGenerating(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedComment);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-fade-in">
            {/* Left: Template Library */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Tag size={20} className="text-secondary" />
                        Thư viện Nhận xét
                    </h3>
                </div>
                
                <div className="p-5 border-b border-gray-100 bg-white">
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            placeholder="Từ khóa (ví dụ: tot)" 
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            className="w-1/3 p-2 border border-gray-300 rounded-lg text-sm !bg-white !text-gray-900"
                        />
                        <input 
                            type="text" 
                            placeholder="Nội dung nhận xét..." 
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm !bg-white !text-gray-900"
                        />
                        <button 
                            onClick={handleAddTemplate}
                            className="bg-secondary text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['All', 'Tích cực', 'Cần cố gắng', 'Học tập'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterCategory === cat ? 'bg-secondary text-white border-secondary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-3">
                    {templates.filter(t => filterCategory === 'All' || t.category === filterCategory).map(t => (
                        <div key={t.id} className="group bg-gray-50 p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow relative">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">{t.keyword}</span>
                                <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">{t.category}</span>
                            </div>
                            <p className="text-sm text-gray-700">{t.content}</p>
                            <button 
                                onClick={() => handleDeleteTemplate(t.id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {templates.length === 0 && <p className="text-center text-gray-400 italic">Chưa có mẫu nhận xét nào.</p>}
                </div>
            </div>

            {/* Right: AI Generator */}
            <div className="bg-white rounded-xl shadow-lg border border-indigo-100 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-600" />
                        Trợ lý AI Gemini (GDPT 2018)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Phân tích chuyên sâu: Kiến thức - Kỹ năng - Thái độ & Định hướng mục tiêu.</p>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Học sinh</label>
                            <select 
                                value={selectedStudentId}
                                onChange={handleStudentChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm !bg-white !text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">-- Chọn học sinh --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} - {classes.find(c => c.id === s.classId)?.name || 'Chưa phân lớp'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú & Dữ liệu tổng hợp (Tự động điền)</label>
                            <textarea 
                                value={teacherNotes}
                                onChange={(e) => setTeacherNotes(e.target.value)}
                                placeholder="Hệ thống sẽ tự động điền: Nhật ký hằng ngày, Học bạ cũ, Nhận xét gần đây..."
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm h-24 focus:ring-2 focus:ring-purple-500 outline-none !bg-white !text-gray-900 bg-gray-50"
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700">
                            <strong>AI Logic:</strong> So sánh kết quả thực tế với mục tiêu của học sinh để đưa ra lộ trình phù hợp cho {semester}.
                        </div>

                        <button 
                            onClick={handleGenerateAI}
                            disabled={isGenerating}
                            className={`w-full py-3 rounded-lg text-white font-medium shadow-md flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}
                        >
                            {isGenerating ? (
                                <>Đang suy nghĩ & phân tích...</>
                            ) : (
                                <><Wand2 size={18} /> Phân tích & Tạo nhận xét</>
                            )}
                        </button>
                    </div>

                    {generatedComment && (
                        <div className="mt-8 animate-fade-in">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-bold text-gray-700">Kết quả phân tích:</h4>
                                <button 
                                    onClick={copyToClipboard}
                                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-600"
                                >
                                    {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} />} 
                                    {copied ? 'Đã sao chép' : 'Sao chép'}
                                </button>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 relative shadow-inner">
                                <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line font-medium">{generatedComment}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentsTab;

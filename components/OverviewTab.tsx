
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Student, Grade, SubjectType, Classroom } from '../types';
import { Users, TrendingUp, Award, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

interface OverviewTabProps {
    students: Student[];
    classes: Classroom[];
    semester: string;
    onSuggestionClick?: (studentId: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ students, classes, semester, onSuggestionClick }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

    const selectedStudent = useMemo(() => 
        students.find(s => s.id === selectedStudentId), 
    [students, selectedStudentId]);

    const filteredGrades = useMemo(() => {
        if (!selectedStudent) return [];
        return selectedStudent.grades.filter(g => {
            const month = new Date(g.date).getMonth() + 1; // 1-12
            if (semester === 'HK1') return month >= 9 || month <= 1;
            if (semester === 'HK2') return month >= 2 && month <= 6;
            return true;
        });
    }, [selectedStudent, semester]);

    // Comparison Data (Bar Chart)
    const comparisonData = useMemo(() => {
        if (!selectedStudent) return [];
        
        const algebraGrades = filteredGrades.filter(g => g.subject === SubjectType.ALGEBRA);
        const geometryGrades = filteredGrades.filter(g => g.subject === SubjectType.GEOMETRY);
        const generalGrades = filteredGrades.filter(g => g.subject === SubjectType.GENERAL);
        
        const avgAlg = algebraGrades.length ? algebraGrades.reduce((sum, g) => sum + g.score, 0) / algebraGrades.length : 0;
        const avgGeo = geometryGrades.length ? geometryGrades.reduce((sum, g) => sum + g.score, 0) / geometryGrades.length : 0;
        const avgGen = generalGrades.length ? generalGrades.reduce((sum, g) => sum + g.score, 0) / generalGrades.length : 0;

        const data = [
            { name: 'Đại số', score: parseFloat(avgAlg.toFixed(1)), fill: '#4F46E5' },
            { name: 'Hình học', score: parseFloat(avgGeo.toFixed(1)), fill: '#10B981' },
        ];

        if (generalGrades.length > 0) {
            data.push({ name: 'Tổng hợp', score: parseFloat(avgGen.toFixed(1)), fill: '#F59E0B' });
        }
        return data;
    }, [filteredGrades]);
    
    // Performance Over Time Data (Line Chart)
    const lineChartData = useMemo(() => {
        if (!selectedStudent) return [];
        const sortedGrades = [...filteredGrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return sortedGrades.map((g, idx) => ({
            idx: idx + 1,
            date: g.date,
            [g.subject]: g.score, // Dynamic key based on subject
            name: new Date(g.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            examType: g.examType
        }));
    }, [filteredGrades]);

    // Suggestions for Teachers Logic
    const suggestions = useMemo(() => {
        const today = new Date();
        const urgentStudents = students.filter(s => {
            // Logic 1: No log in last 7 days
            const lastLog = s.dailyLogs && s.dailyLogs.length > 0 
                ? new Date(s.dailyLogs[s.dailyLogs.length - 1].date) 
                : null;
            const daysSinceLog = lastLog ? (today.getTime() - lastLog.getTime()) / (1000 * 3600 * 24) : 999;
            
            // Logic 2: Recent low score (< 5)
            const recentGrade = s.grades.length > 0 ? s.grades[s.grades.length - 1] : null;
            const hasLowScore = recentGrade && recentGrade.score < 5;

            return daysSinceLog > 7 || hasLowScore;
        }).slice(0, 5); // Take top 5
        return urgentStudents;
    }, [students]);

    const handleCardClick = (studentId: string) => {
        if (onSuggestionClick) {
            onSuggestionClick(studentId);
        } else {
            setSelectedStudentId(studentId);
        }
    }


    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tổng Học sinh</p>
                        <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tổng Lớp</p>
                        <p className="text-2xl font-bold text-gray-800">{classes.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Điểm TB Toàn trường</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {(students.reduce((acc, s) => acc + (s.grades.reduce((sum, g) => sum + g.score, 0) / (s.grades.length || 1)), 0) / students.length || 0).toFixed(1)}
                        </p>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Cập nhật gần nhất</p>
                        <p className="text-lg font-bold text-gray-800">Hôm nay</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Suggestions Card */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-red-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-red-500" />
                        Gợi ý nhắc việc hôm nay
                    </h3>
                    {suggestions.length > 0 ? (
                        <div className="space-y-3">
                            {suggestions.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => handleCardClick(s.id)} 
                                    className="flex items-center gap-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors group"
                                    title="Click để nhập liệu ngay"
                                >
                                    <img src={s.avatar} className="w-10 h-10 rounded-full" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-800 text-sm group-hover:text-red-700">{s.name}</p>
                                            <span className="text-xs text-red-400 bg-white px-2 py-0.5 rounded-full border border-red-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Nhập liệu</span>
                                        </div>
                                        <p className="text-xs text-red-600">Cần cập nhật ghi chép/điểm số</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-green-600">
                            <CheckCircle size={40} className="mb-2 opacity-50"/>
                            <p className="text-sm font-medium">Tuyệt vời! Bạn đã theo dõi sát sao tất cả học sinh.</p>
                        </div>
                    )}
                 </div>

                 {/* Chart Controls */}
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">Chi tiết Tiến độ - {semester === 'ALL' ? 'Cả năm' : semester}</h2>
                        <select 
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-w-[200px] !bg-white !text-gray-900"
                        >
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} - {classes.find(c => c.id === s.classId)?.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {selectedStudent && (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickMargin={10} />
                                    <YAxis domain={[0, 10]} stroke="#6b7280" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey={SubjectType.GEOMETRY} name="Hình học" stroke="#10B981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                                    <Line type="monotone" dataKey={SubjectType.ALGEBRA} name="Đại số" stroke="#4F46E5" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                 </div>
            </div>

            {selectedStudent && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Average Comparison Bar Chart */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                            <Award size={20} className="mr-2 text-accent" />
                            Trung bình Môn
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis domain={[0, 10]} hide />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40} label={{ position: 'top', fill: '#374151', fontWeight: 'bold' }}>
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Daily Logs */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-y-auto max-h-[320px]">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">Nhật ký theo dõi gần đây</h3>
                            {selectedStudent.dailyLogs && selectedStudent.dailyLogs.length > 0 ? (
                            <div className="space-y-3">
                                {selectedStudent.dailyLogs.slice().reverse().map(log => (
                                    <div key={log.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-gray-500">{new Date(log.date).toLocaleDateString('vi-VN')}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                log.category === 'Attitude' ? 'bg-purple-100 text-purple-700' :
                                                log.category === 'Knowledge' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {log.category === 'Attitude' ? 'Thái độ' : log.category === 'Knowledge' ? 'Kiến thức' : 'Kỹ năng'}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 text-sm">{log.content}</p>
                                    </div>
                                ))}
                            </div>
                            ) : (
                                <p className="text-gray-400 italic text-center py-4">Chưa có ghi chép nào.</p>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;

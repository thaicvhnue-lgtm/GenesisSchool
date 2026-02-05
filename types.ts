
export enum SubjectType {
    GEOMETRY = 'Hình học',
    ALGEBRA = 'Đại số/Số học',
    GENERAL = 'Toán chung' // For Midterm/Final exams
}

export enum ExamType {
    REGULAR = 'Ddtx', // Hệ số 1 (Thường xuyên)
    MONTHLY = 'Tháng', // Hệ số 1 hoặc 2 tùy trường (Kiểm tra tháng)
    MIDTERM = 'GHK',  // Hệ số 2
    FINAL = 'CK'      // Hệ số 3
}

export interface Grade {
    id: string;
    subject: SubjectType;
    examType: ExamType;
    coefficient: number;
    score: number;
    date: string;
    note?: string;
}

export interface StudentComment {
    id: string;
    content: string;
    date: string;
    source: 'manual' | 'ai' | 'template';
}

export interface DailyLog {
    id: string;
    date: string;
    category: 'Knowledge' | 'Skill' | 'Attitude'; // Kiến thức, Kỹ năng, Thái độ
    content: string;
    score?: number; // Điểm nhanh (nếu có)
}

export interface Student {
    id: string;
    name: string;
    avatar: string;
    classId: string;
    grades: Grade[];
    comments: StudentComment[];
    
    // New fields
    targetGoal?: string; // Đích hướng tới (Ví dụ: Đỗ chuyên Toán, Đạt 8.0 Toán)
    historicalNotes?: string; // Dữ liệu từ tiểu học/năm trước
    dailyLogs: DailyLog[]; // Ghi chép hằng ngày
}

export interface Classroom {
    id: string;
    name: string;
    gradeLevel: string;
    year: string;
}

export interface CommentTemplate {
    id: string;
    keyword: string; // The shortcut key, e.g., "gioitoan"
    content: string; // The full text
    category: string;
}

// Initial Mock Data
export const MOCK_CLASSES: Classroom[] = [
    { id: 'c1', name: 'Lớp 6A', gradeLevel: '6', year: '2023-2024' },
    { id: 'c2', name: 'Lớp 9B', gradeLevel: '9', year: '2023-2024' },
];

export const MOCK_STUDENTS: Student[] = [
    {
        id: 's1',
        name: 'Nguyễn Văn An',
        avatar: 'https://picsum.photos/200/200?random=1',
        classId: 'c1',
        targetGoal: 'Đạt học sinh giỏi môn Toán, cải thiện tính cẩn thận',
        historicalNotes: 'Cấp 1 học tốt, tư duy nhanh nhưng hay ẩu.',
        grades: [
            { id: 'g1', subject: SubjectType.ALGEBRA, examType: ExamType.REGULAR, coefficient: 1, score: 8, date: '2023-09-05' },
            { id: 'g2', subject: SubjectType.GEOMETRY, examType: ExamType.REGULAR, coefficient: 1, score: 7, date: '2023-09-10' },
            { id: 'g3', subject: SubjectType.GENERAL, examType: ExamType.MONTHLY, coefficient: 1, score: 7.5, date: '2023-10-01' },
        ],
        comments: [
            { id: 'cm1', content: 'Em cần tập trung hơn trong giờ Hình học.', date: '2023-10-12', source: 'manual' }
        ],
        dailyLogs: [
            { id: 'd1', date: '2023-09-15', category: 'Attitude', content: 'Hôm nay quên làm bài tập về nhà.' }
        ]
    },
    {
        id: 's2',
        name: 'Trần Thị Bích',
        avatar: 'https://picsum.photos/200/200?random=2',
        classId: 'c1',
        targetGoal: 'Thi đỗ vào trường chuyên Ngữ',
        dailyLogs: [],
        grades: [
            { id: 'g5', subject: SubjectType.ALGEBRA, examType: ExamType.REGULAR, coefficient: 1, score: 9.5, date: '2023-09-05' },
        ],
        comments: []
    },
    {
        id: 's3',
        name: 'Lê Hoàng Nam',
        avatar: 'https://picsum.photos/200/200?random=3',
        classId: 'c2',
        dailyLogs: [],
        grades: [],
        comments: []
    }
];

export const MOCK_TEMPLATES: CommentTemplate[] = [
    { id: 't1', keyword: 'tot', content: 'Em học rất tốt và có thái độ tích cực trong giờ học.', category: 'Tích cực' },
    { id: 't2', keyword: 'canuonnan', content: 'Em cần chú ý nghe giảng và làm bài tập về nhà đầy đủ hơn.', category: 'Cần cố gắng' },
    { id: 't3', keyword: 'hinhhoc', content: 'Tư duy hình học tốt, cần phát huy.', category: 'Học tập' },
];


import * as XLSX from 'xlsx';
import { Student, Grade, SubjectType, ExamType, StudentComment } from '../types';

// Helper to get coefficient
const getCoefficient = (type: ExamType): number => {
    switch(type) {
        case ExamType.MIDTERM: return 2;
        case ExamType.FINAL: return 3;
        default: return 1;
    }
};

export const downloadTemplate = () => {
    // Define the header structure based on the user's image
    // Row 1: Merged headers for ĐĐGtx
    // Row 2: Specific column names
    
    const ws_data = [
        ["", "", "", "", "", "", "ĐĐGtx", "", "", "", "", "", "", ""], // Row 1 (Index 0)
        ["#", "Mã định danh", "Mã HS", "Họ và tên", "Tên tiếng", "Ngày sinh", "01", "02", "03", "04", "05", "ĐĐGgk", "ĐĐGck", "Nhận xét"] // Row 2 (Index 1)
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Merge cells for "ĐĐGtx" (Columns G, H, I, J -> Index 6, 7, 8, 9)
    // s: start, e: end, r: row, c: col
    if(!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 6 }, e: { r: 0, c: 9 } }); // Merge G1:J1

    // Set column widths for better visibility
    ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 15 }, // Mã định danh
        { wch: 15 }, // Mã HS
        { wch: 25 }, // Họ và tên
        { wch: 10 }, // Tên tiếng
        { wch: 12 }, // Ngày sinh
        { wch: 5 },  // 01
        { wch: 5 },  // 02
        { wch: 5 },  // 03
        { wch: 5 },  // 04
        { wch: 5 },  // 05
        { wch: 8 },  // GK
        { wch: 8 },  // CK
        { wch: 30 }  // Nhận xét
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Lieu");
    XLSX.writeFile(wb, "Genesis_Mau_Nhap_Diem.xlsx");
};

export const parseStudentImportFile = async (file: File, classId: string): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // Convert to JSON array of arrays to handle complex headers manually
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Find the header row index (looking for "Mã HS")
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
                    if (jsonData[i] && jsonData[i].includes("Mã HS")) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    reject("Không tìm thấy cột 'Mã HS' trong file. Vui lòng sử dụng file mẫu chuẩn.");
                    return;
                }

                // Map columns based on the header row
                const headers = jsonData[headerRowIndex];
                const colMap: Record<string, number> = {};
                headers.forEach((h: any, idx: number) => {
                    if (typeof h === 'string') {
                        colMap[h.trim()] = idx;
                    }
                });

                const students: Student[] = [];
                
                // Process data rows
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const studentId = row[colMap["Mã HS"]];
                    const name = row[colMap["Họ và tên"]];

                    if (!studentId || !name) continue; // Skip empty rows

                    const grades: Grade[] = [];
                    
                    // Helper to add grade
                    const addGrade = (colName: string, examType: ExamType, subject: SubjectType) => {
                         const scoreVal = row[colMap[colName]];
                         if (scoreVal !== undefined && scoreVal !== null && scoreVal !== "") {
                             const score = parseFloat(scoreVal);
                             if (!isNaN(score)) {
                                 grades.push({
                                     id: Date.now().toString() + Math.random().toString(),
                                     subject: subject,
                                     examType: examType,
                                     coefficient: getCoefficient(examType),
                                     score: score,
                                     date: new Date().toISOString()
                                 });
                             }
                         }
                    };

                    // Regular Grades (01-05) - Defaulting to ALGEBRA as per prompt preference, user can edit
                    // Note: Excel columns might vary, we rely on header names "01", "02", etc.
                    addGrade("01", ExamType.REGULAR, SubjectType.ALGEBRA);
                    addGrade("02", ExamType.REGULAR, SubjectType.ALGEBRA);
                    addGrade("03", ExamType.REGULAR, SubjectType.ALGEBRA);
                    addGrade("04", ExamType.REGULAR, SubjectType.ALGEBRA);
                    addGrade("05", ExamType.REGULAR, SubjectType.ALGEBRA);

                    // Midterm & Final - Default to GENERAL
                    addGrade("ĐĐGgk", ExamType.MIDTERM, SubjectType.GENERAL);
                    addGrade("ĐĐGck", ExamType.FINAL, SubjectType.GENERAL);

                    // Comments
                    const comments: StudentComment[] = [];
                    const commentContent = row[colMap["Nhận xét"]];
                    if (commentContent) {
                        comments.push({
                            id: Date.now().toString() + Math.random().toString(),
                            content: String(commentContent),
                            date: new Date().toISOString(),
                            source: 'manual'
                        });
                    }

                    // Avatar (Random placeholder)
                    const avatar = `https://picsum.photos/200/200?random=${studentId}`;

                    students.push({
                        id: String(studentId),
                        name: String(name),
                        avatar: avatar,
                        classId: classId,
                        grades: grades,
                        comments: comments,
                        dailyLogs: []
                    });
                }

                resolve(students);

            } catch (err) {
                console.error(err);
                reject("Lỗi khi đọc file Excel. Đảm bảo file đúng định dạng.");
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

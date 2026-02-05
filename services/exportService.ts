import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Student, Classroom } from '../types';

export const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    // Get headers
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add BOM for UTF-8 support in Excel
    csvRows.push('\uFEFF' + headers.join(','));

    // Add data rows
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

export const generateStudentReportPDF = (student: Student, className: string, semester: string) => {
    const doc = new jsPDF();

    // Font setup (standard fonts don't support Vietnamese well in basic jsPDF, 
    // strictly speaking we need to add a font, but for this demo we rely on basic latin or standard fallback.
    // In a real app, you must import a .ttf font file with base64)
    
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text("PHIEU KET QUA HOC TAP", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Ho ten: ${removeVietnameseTones(student.name)}`, 20, 40);
    doc.text(`Lop: ${className}`, 20, 50);
    doc.text(`Hoc ki: ${semester}`, 150, 40);
    
    // Grades Table
    const tableData = student.grades.map(g => [
        removeVietnameseTones(g.subject),
        g.score.toString(),
        new Date(g.date).toLocaleDateString('vi-VN')
    ]);

    (doc as any).autoTable({
        startY: 60,
        head: [['Mon Hoc', 'Diem So', 'Ngay']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60;

    // Comments Section
    doc.text("Nhan xet:", 20, finalY + 15);
    student.comments.forEach((c, index) => {
        const yPos = finalY + 25 + (index * 10);
        doc.setFontSize(10);
        doc.text(`- ${removeVietnameseTones(c.content)}`, 20, yPos);
    });

    doc.save(`Report_${removeVietnameseTones(student.name)}.pdf`);
};

export const generateClassReportPDF = (className: string, students: Student[], semester: string) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`BANG DIEM TONG HOP - ${className}`, 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Hoc ki: ${semester}`, 105, 25, { align: "center" });

    const tableData = students.map((s, index) => {
        const avgScore = s.grades.length 
            ? (s.grades.reduce((a, b) => a + b.score, 0) / s.grades.length).toFixed(1) 
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

// Utility to remove tones for basic PDF support (since custom font loading is heavy)
function removeVietnameseTones(str: string) {
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
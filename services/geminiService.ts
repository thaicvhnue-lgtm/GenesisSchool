
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// Note: In a real production app, ensure API_KEY is set in environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIComment = async (
    studentName: string,
    gradesSummary: string,
    teacherNotes: string,
    gradeLevel: string,
    semester: string,
    targetGoal: string = "Chưa thiết lập",
    dailyLogSummary: string = ""
): Promise<string> => {
    try {
        const model = 'gemini-3-flash-preview';
        
        const prompt = `
        Đóng vai một giáo viên chủ nhiệm/bộ môn tâm huyết, có chuyên môn sâu sắc theo chương trình GDPT 2018. 
        Hãy phân tích và viết nhận xét cho học sinh: "${studentName}" (Lớp ${gradeLevel}), Thời điểm: ${semester === 'ALL' ? 'Tổng kết năm' : semester}.

        Dữ liệu đầu vào:
        1. Mục tiêu của học sinh (Target): "${targetGoal}"
        2. Điểm số (Grades): ${gradesSummary}
        3. Nhật ký theo dõi hằng ngày (Daily Logs - Kiến thức/Kỹ năng/Thái độ): ${dailyLogSummary}
        4. Ghi chú thêm của GV: "${teacherNotes}"

        Yêu cầu đầu ra (Cấu trúc trả lời rõ ràng, không dùng markdown heading quá lớn):
        
        *Đánh giá tổng quan:*
        - Phân tích sâu về 3 mặt: Kiến thức (Nắm vững chưa?), Kỹ năng (Vận dụng, tính toán?), Thái độ (Chuyên cần, tích cực?).
        - So sánh với Mục tiêu: Con đã đi được bao nhiêu % quãng đường? Có bám sát mục tiêu không?

        *Lời khuyên & Định hướng (Action Plan):*
        - Chỉ rõ 2-3 việc cụ thể con cần làm ngay để cải thiện hoặc phát huy.
        - Lời nhắn nhủ động viên phong cách "Growth Mindset" (Tư duy phát triển).

        *Lưu ý:* Giọng văn ân cần, sư phạm, khách quan nhưng đầy tình thương. Độ dài khoảng 150-200 chữ.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "Không thể tạo nhận xét lúc này.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.";
    }
};

export const suggestCommentFromKeywords = async (keywords: string): Promise<string> => {
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Mở rộng các từ khóa sau thành một câu nhận xét học sinh hoàn chỉnh, tự nhiên: "${keywords}". Chỉ trả về câu nhận xét.`,
        });
        return response.text || "";
    } catch (e) {
        return "";
    }
}

import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
    name: String,
    professor: String,
    timing: String,
    examDates: [Date],
    topics: [String],
    gradingPolicy: String,
    contactInfo: String,
    textbooks: [String],
    location: String,
    description: { type: String }, // AI-generated description/summary (2-3 sentences) from LangChain/Gemini
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    isPersonal: { type: Boolean, default: false } // Mark personal classes
});

export default mongoose.model('Class', classSchema);


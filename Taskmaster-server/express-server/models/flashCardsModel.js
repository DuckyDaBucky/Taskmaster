import mongoose from 'mongoose';

const flashCardModel = new mongoose.Schema({
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    topic: String,
    question: String,
    answer: String,
    description: { type: String }, // AI-generated additional context/explanation from LangChain/Gemini
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Track flashcard owner
});

export default mongoose.model('FlashCards', flashCardModel);

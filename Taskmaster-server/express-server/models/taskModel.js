import mongoose from 'mongoose';

const taskSchema = mongoose.Schema({
    topic: String,
    title: String,
    description: { type: String }, // AI-generated description/context from LangChain/Gemini
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' },
    points: Number,

    taskType: String, //weekly or daily
    deadline: Date,
    earnedPoints: Number,
    completed: Boolean,

    textbook: String,
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class'}, // Can be null for personal tasks
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Track task owner
});

export default mongoose.model('Task', taskSchema);
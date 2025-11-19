import mongoose from 'mongoose';

const taskSchema = mongoose.Schema({
    topic: String,
    title: String,
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' },
    points: Number,

    taskType: String, //weekly or daily
    deadline: Date,
    earnedPoints: Number,
    completed: Boolean,

    textbook: String,
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class'}
});

export default mongoose.model('Task', taskSchema);
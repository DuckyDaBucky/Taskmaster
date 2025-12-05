import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: [
            'task_created',
            'task_completed',
            'task_updated',
            'class_created',
            'class_updated',
            'resource_added',
            'flashcard_generated',
            'event_created',
            'event_updated',
            'login',
            'streak_achieved'
        ],
        required: true 
    },
    description: { type: String, required: true },
    metadata: {
        taskId: mongoose.Schema.Types.ObjectId,
        classId: mongoose.Schema.Types.ObjectId,
        resourceId: mongoose.Schema.Types.ObjectId,
        eventId: mongoose.Schema.Types.ObjectId,
        streak: Number,
    }
}, { timestamps: true });

// Index for faster queries
activitySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);


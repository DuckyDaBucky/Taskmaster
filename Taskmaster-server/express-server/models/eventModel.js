import mongoose from "mongoose";

const eventModel = mongoose.Schema({
    title: String,
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    repeatWeekly: Boolean,
    start: Date,
    end: Date,
    notes: [{ type: String }],
    color: String,

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model('Event', eventModel);  
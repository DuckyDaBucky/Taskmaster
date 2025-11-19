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
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },

});

export default mongoose.model('Class', classSchema);

import mongoose from 'mongoose';

const flashCardModel = new mongoose.Schema({
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Tasks', required: true },
    topic: String,
    question: String,
    answer: String,
});

export default mongoose.model('FlashCards', flashCardModel);

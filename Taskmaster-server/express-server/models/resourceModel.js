import mongoose from 'mongoose';

const resourceSchema = mongoose.Schema({
    urls: [String],
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: false }
});

export default mongoose.model('Resource', resourceSchema);
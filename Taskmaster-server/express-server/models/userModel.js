import mongoose from 'mongoose';
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pfp: String,

    //For Gameify
    streak: Number,
    lastTaskDate: Date,
    points: Number,
    streak: Number,
    level: Number,
    groupNumber: Number,

    //For friend matchmaking
    preferences: {
        personality: Number,
        time: Number,
        inPerson: Number,
        privateSpace: Number,
    },

    gpa: Number,
    friendsList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    slcSessions: [String]
});

//Generate token to store in localstorage
userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, "secretstring1234");
}

export default mongoose.model('User', userSchema);
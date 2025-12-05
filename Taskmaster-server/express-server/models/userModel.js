import mongoose from 'mongoose';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pfp: String,

    //For Gameify
    streak: { type: Number, default: 0 },
    lastLoginDate: Date,
    loginDates: [Date], // Array of dates user logged in
    lastTaskDate: Date,
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
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
    slcSessions: [String],
    role: { type: String, default: "user" }
}, { timestamps: true });

//Generate token to store in localstorage
userSchema.methods.generateAuthToken = function () {
    // Use JWT_SECRET from environment, fallback to default for backward compatibility
    const jwtSecret = process.env.JWT_SECRET || "secretstring1234";
    return jwt.sign({ _id: this._id }, jwtSecret);
}

export default mongoose.model('User', userSchema);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import User from './express-server/models/userModel.js';
import Task from './express-server/models/taskModel.js';
import Class from './express-server/models/classModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to MongoDB');

        // Wipe existing data
        await User.deleteMany({});
        await Task.deleteMany({});
        await Class.deleteMany({});
        console.log('Data wiped');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create User
        const user = await User.create({
            userName: 'demo_user',
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@taskmaster.com',
            password: hashedPassword,
            streak: 5,
            points: 120,
            level: 2,
            preferences: {
                personality: 1,
                time: 1,
                inPerson: 1,
                privateSpace: 1
            }
        });
        console.log('User created');

        // Create Classes
        const class1 = await Class.create({
            name: 'Introduction to Computer Science',
            professor: 'Dr. Smith',
            timing: 'Mon/Wed 10:00 AM',
            location: 'Room 101',
            user: user._id
        });

        const class2 = await Class.create({
            name: 'Calculus I',
            professor: 'Prof. Johnson',
            timing: 'Tue/Thu 2:00 PM',
            location: 'Room 204',
            user: user._id
        });
        console.log('Classes created');

        // Create Tasks
        await Task.create([
            {
                title: 'CS Lab 1',
                topic: 'Intro to Python',
                status: 'pending',
                points: 10,
                taskType: 'weekly',
                deadline: new Date(Date.now() + 86400000 * 2), // 2 days from now
                class: class1._id
            },
            {
                title: 'Calculus Quiz',
                topic: 'Limits',
                status: 'pending',
                points: 20,
                taskType: 'weekly',
                deadline: new Date(Date.now() + 86400000 * 3),
                class: class2._id
            },
            {
                title: 'Read Chapter 3',
                topic: 'Variables',
                status: 'completed',
                points: 5,
                taskType: 'daily',
                deadline: new Date(Date.now() - 86400000),
                class: class1._id
            },
            {
                title: 'Project Proposal',
                topic: 'Final Project',
                status: 'pending',
                points: 50,
                taskType: 'monthly',
                deadline: new Date(Date.now() + 86400000 * 14),
                class: class1._id
            },
            {
                title: 'Math Problem Set',
                topic: 'Derivatives',
                status: 'overdue',
                points: 15,
                taskType: 'weekly',
                deadline: new Date(Date.now() - 86400000 * 2),
                class: class2._id
            }
        ]);
        console.log('Tasks created');

        console.log('✅ Database Seeded');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();

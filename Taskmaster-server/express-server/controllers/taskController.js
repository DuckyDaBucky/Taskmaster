import Task from '../models/taskModel.js';
import Class from '../models/classModel.js';
import { parseAndSaveSyllabus } from './syllabus_LLM/taskParser.js';

//Get all tasks - ENFORCE USER OWNERSHIP
const getAllTask = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Get all classes for this user
        const userClasses = await Class.find({ user: userId });
        const classIds = userClasses.map(c => c._id);
        
        // Get all tasks that belong to user's classes
        const tasks = await Task.find({ class: { $in: classIds } });
        
        res.status(200).json(tasks || []);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//Get task - ENFORCE USER OWNERSHIP
const getTaskById = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Verify task belongs to user's class
        const classDoc = await Class.findById(task.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This task does not belong to you." });
        }

        res.status(200).json(task);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Update task - ENFORCE USER OWNERSHIP
const updateTask = async(req, res) => {
    console.log("Called patch");
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const classDoc = await Class.findById(task.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This task does not belong to you." });
        }

        const {deadline, topic, title, resources, status, points, textbook} = req.body;
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, {deadline, topic, title, resources, status, points, textbook}, {new: true});
        res.status(200).json(updatedTask);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Delete task - ENFORCE USER OWNERSHIP
const deleteTask = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({message: "Task not found"});
        }

        const classDoc = await Class.findById(task.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This task does not belong to you." });
        }

        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Task deleted successfully"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Get task by class ID - ENFORCE USER OWNERSHIP
const getTaskByClassId = async(req, res) => {
    try {
        const classId = req.params.classid;
        const userId = req.user?._id; // Get from auth middleware if available
        
        // Verify class belongs to user
        if (userId) {
            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({ message: "Class not found" });
            }
            
            // Check if class belongs to user
            if (classDoc.user && classDoc.user.toString() !== userId.toString()) {
                return res.status(403).json({ message: "Access denied. This class does not belong to you." });
            }
        }
        
        const tasks = await Task.find({class: classId});
        
        // Return empty array if no tasks found (not an error)
        res.status(200).json(tasks || []);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

 //Create task by ID
const createTaskByClassId = async(req, res) => {
    try {
        const {deadline, topic, title, resources, status, points, textbook} = req.body;
        const classId = req.params.id;

        if(!classId)
        {
            return res.status(404).json({message: "Class ID is required"});
        }

        const newTask = new Task({deadline, topic, title, resources, status, points, textbook, class: classId});

        const savedTask = await newTask.save();
        res.status(201).json(savedTask);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Create task by Syllabus
const parseSyllabus = async (req, res, next) => {
    console.log("Called TASK TASK controller");
    try {
        const { syllabusFilePath } = req.body;
        if (!syllabusFilePath) {
            return res.status(400).json({ message: "Syllabus file path is required." });
        }
        await parseAndSaveSyllabus(syllabusFilePath);
        console.log("Syllabus parsed and tasks saved successfully.");
        next();
    } catch (error) {
        console.error("Error parsing syllabus:", error);
        next(error);
    }
};


export {
    getAllTask,
    getTaskById,
    updateTask,
    deleteTask,
    getTaskByClassId,
    createTaskByClassId,
    parseSyllabus
};

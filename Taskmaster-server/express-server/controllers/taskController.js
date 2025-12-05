import Task from '../models/taskModel.js';
import Class from '../models/classModel.js';
import { parseAndSaveSyllabus } from './syllabus_LLM/taskParser.js';

//Get all tasks - ENFORCE USER OWNERSHIP (includes personal tasks)
const getAllTask = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Get all classes for this user
        const userClasses = await Class.find({ user: userId });
        const classIds = userClasses.map(c => c._id);
        
        // Get all tasks that belong to user's classes OR are personal (class is null) AND belong to user
        const tasks = await Task.find({ 
            $or: [
                { class: { $in: classIds } },
                { class: null, user: userId } // Personal tasks
            ]
        });
        
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
        const oldTask = await Task.findById(req.params.id);
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, {deadline, topic, title, resources, status, points, textbook}, {new: true});
        
        // Log activity if status changed to completed
        if (oldTask && oldTask.status !== 'completed' && status === 'completed') {
            try {
                const { createActivity } = await import('./activityController.js');
                await createActivity(userId, 'task_completed', `Completed task "${updatedTask.title}"`, { taskId: updatedTask._id });
            } catch (error) {
                console.error("Error logging activity:", error);
            }
        } else if (oldTask && oldTask.status !== status) {
            try {
                const { createActivity } = await import('./activityController.js');
                await createActivity(userId, 'task_updated', `Updated task "${updatedTask.title}"`, { taskId: updatedTask._id });
            } catch (error) {
                console.error("Error logging activity:", error);
            }
        }
        
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

 //Create task by ID - ENFORCE USER OWNERSHIP (supports "personal" tasks)
const createTaskByClassId = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        console.log("CREATE TASK PAYLOAD:", req.body);
        
        const {deadline, topic, title, resources, status, points, textbook} = req.body;
        const classId = req.params.id === "personal" ? null : req.params.id;

        // If classId is provided (not personal), verify it belongs to user
        if (classId) {
            const classDoc = await Class.findById(classId);
            if (!classDoc) {
                return res.status(404).json({ message: "Class not found" });
            }

            if (classDoc.user && classDoc.user.toString() !== userId.toString()) {
                return res.status(403).json({ message: "Access denied. This class does not belong to you." });
            }
        }

        const newTask = new Task({
            deadline, 
            topic, 
            title, 
            resources: resources || [], 
            status: status || 'pending', 
            points, 
            textbook, 
            class: classId || null, // Can be null for personal tasks
            user: userId // Always set user
        });

        const savedTask = await newTask.save();
        console.log("Task created successfully:", savedTask._id);
        
        // Log activity
        try {
            const { createActivity } = await import('./activityController.js');
            await createActivity(userId, 'task_created', `Created task "${savedTask.title}"`, { taskId: savedTask._id, classId: classId || null });
        } catch (error) {
            console.error("Error logging activity:", error);
        }
        
        res.status(201).json(savedTask);

    } catch (error) {
        console.error("Error creating task:", error);
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

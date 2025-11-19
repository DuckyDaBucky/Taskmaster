import Class from '../models/classModel.js';
import { parseAndSaveSyllabus } from './syllabus_LLM/classParser.js';


//Get all classes - ENFORCE USER OWNERSHIP
const getAllClasses = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Only return classes belonging to the authenticated user
        const classes = await Class.find({ user: userId });
        res.status(200).json(classes || []);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Get class by ID - ENFORCE USER OWNERSHIP
const getClassById = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        // Verify class belongs to user
        if (classDoc.user && classDoc.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. This class does not belong to you." });
        }

        res.status(200).json(classDoc);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Create class - ENFORCE USER OWNERSHIP
const createClass = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const {name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location} = req.body;

        // Always set user to authenticated user (ignore any user in body)
        const newClass = new Class({name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location, user: userId});
        const savedClass = await newClass.save();
        res.status(201).json(savedClass);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Update class - ENFORCE USER OWNERSHIP
const updateClass = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        if (classDoc.user && classDoc.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. This class does not belong to you." });
        }

        const {name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location} = req.body;
        const updatedClass = await Class.findByIdAndUpdate(req.params.id, {name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location}, {new: true});

        res.status(200).json(updatedClass);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Delete class - ENFORCE USER OWNERSHIP
const deleteClass = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({message: "Class not found"});
        }

        if (classDoc.user && classDoc.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. This class does not belong to you." });
        }

        const deletedClass = await Class.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Class deleted successfully"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//POST from syllabus
const parseSyllabus = async (req, res, next) => {
    console.log("Called CLASS CLASS controller");
    try {
        const { syllabusFilePath } = req.body;
        const { userId } = req.body;
        if (!syllabusFilePath) {
            return res.status(400).json({ message: "Syllabus file path is required." });
        }
        await parseAndSaveSyllabus(syllabusFilePath, userId);
        console.log("Syllabus parsed and class saved successfully.");
        next();
    } catch (error) {
        console.error("Error parsing syllabus:", error);
        next(error);
    }
};

const getAllClassesbyUserid = async (req, res) => {
    try {
        const requestedUserId = req.params.userid;
        const authenticatedUserId = req.user?._id; // Get from auth middleware
        
        // ENFORCE DATA ISOLATION: Users can only see their own classes
        if (authenticatedUserId && requestedUserId !== authenticatedUserId.toString()) {
            return res.status(403).json({ message: "Access denied. You can only view your own classes." });
        }
        
        const classes = await Class.find({user: requestedUserId});
        
        // Return empty array if no classes found (not an error)
        res.status(200).json(classes || []);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
}


export {
    createClass,
    getAllClasses,
    getClassById,
    getAllClassesbyUserid,
    updateClass,
    deleteClass,
    parseSyllabus
};

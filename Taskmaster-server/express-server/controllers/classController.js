import Class from '../models/classModel.js';
import { parseAndSaveSyllabus } from './syllabus_LLM/classParser.js';


//Get all classes
const getAllClasses = async(req, res) => {
    try {
        const classes = await Class.find();
        res.status(200).json(classes);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Get class by ID
const getClassById = async(req, res) => {
    try {
        const classes = await Class.findById(req.params.id);
        if (!classes)
        {
            return res.status(404).json({ message: "Class not found" });
        }

        res.status(200).json(classes);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Create class
const createClass = async(req, res) => {
    try {
        const {name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location, user} = req.body;

        const newClass = new Class({name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location, user});
        const savedClass = await newClass.save();
        res.status(201).json(savedClass);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Update class
const updateClass = async(req, res) => {
    try {
        const {name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location} = req.body;
        const updatedClass = await Class.findByIdAndUpdate(req.params.id, {name, professor, timing, examDates, topics, gradingPolicy, contactInfo, textbooks, location}, {new: true});

        if (!updatedClass)
        {
            return res.status(404).json({ message: "Class not found" });
        }

        res.status(200).json(updatedClass);

    } catch (error) {

        res.status(500).json({message: error.message});
    }
};

//Delete class
const deleteClass = async(req, res) => {
    try {
        const deletedClass = await Class.findByIdAndDelete(req.params.id);
        if (!deletedClass)
        {
            return res.status(404).json({message: "Class not found"});
        }
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
        const classes = await Class.find({user: req.params.userid});
        if (!classes)
        {
            return res.status(404).json({ message: "Class not found by userId" });
        }
        res.status(200).json(classes);

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

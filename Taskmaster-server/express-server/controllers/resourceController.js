import Resource from '../models/resourceModel.js';
import Class from '../models/classModel.js';
import { parseAndSaveSyllabus } from './syllabus_LLM/resourceParser.js';

//Get all resources - ENFORCE USER OWNERSHIP
const getAllResources = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Get all classes for this user
        const userClasses = await Class.find({ user: userId });
        const classIds = userClasses.map(c => c._id);
        
        // Get all resources that belong to user's classes
        const resources = await Resource.find({ class: { $in: classIds } });
        res.status(200).json(resources || []);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//Get resource by Id - ENFORCE USER OWNERSHIP
const getResourceById = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        // Verify resource belongs to user's class
        const classDoc = await Class.findById(resource.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This resource does not belong to you." });
        }

        res.status(200).json(resource);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Create resource
const createResource = async(req, res) => {
    try {
        const { urls, websites, class: classId } = req.body;

        const newResource = new Resource({
            urls: urls || [], // Handle potential undefined/null
            websites: websites || [], // Handle potential undefined/null
            class: classId,
        });


        const savedResource = await newResource.save();
        res.status(201).json(savedResource);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Update resource - ENFORCE USER OWNERSHIP
const updateResource = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        const classDoc = await Class.findById(resource.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This resource does not belong to you." });
        }

        const {urls} = req.body;
        const updatedResource = await Resource.findByIdAndUpdate(req.params.id, {urls}, {new: true});
        res.status(200).json(updatedResource);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Delete resource - ENFORCE USER OWNERSHIP
const deleteResource = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({message: "Resource not found"});
        }

        const classDoc = await Class.findById(resource.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This resource does not belong to you." });
        }

        const deletedResource = await Resource.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Resource deleted successfully"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Get resource by class ID - ENFORCE USER OWNERSHIP
const getResourcesByClassId = async(req, res) => {
    try {
        const classId = req.params.id;
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
        
        const resources = await Resource.find({class: classId});

        // Return empty array if no resources found (not an error)
        res.status(200).json(resources || []);

  
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

//Create resource by class ID
const createResourceByClassId = async(req, res) => {
    try {
        const {urls} = req.body;
        const {id} = req.params.id;
        
        const newResource = new Resource({urls, class: id});
        const savedResource = await newResource.save();
        res.status(201).json(savedResource);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Create Resource by Syllabus
const parseSyllabus = async (req, res, next) => {
    console.log("Called RESOURCE RESOURCE controller");
    try {
        const { syllabusFilePath } = req.body;
        if (!syllabusFilePath) {
            return res.status(400).json({ message: "Syllabus file path is required." });
        }
        await parseAndSaveSyllabus(syllabusFilePath);
        console.log("Syllabus parsed and resources saved successfully.");
        next();
    } catch (error) {
        console.error("Error parsing syllabus:", error);
        next(error);
    }
};


export {
    getAllResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    getResourcesByClassId,
    createResourceByClassId,
    parseSyllabus
};

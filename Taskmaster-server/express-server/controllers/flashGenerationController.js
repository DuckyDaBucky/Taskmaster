import FlashCards from '../models/flashCardsModel.js';
import Class from '../models/classModel.js';
import flashCardGeneration from './flashcard_LLM/flashCardGenerator.js'

//Get all FlashCards - ENFORCE USER OWNERSHIP
const getAllFlashCards = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Get all classes for this user
        const userClasses = await Class.find({ user: userId });
        const classIds = userClasses.map(c => c._id);
        
        // Get all flashcards that belong to user's classes
        const flashCards = await FlashCards.find({ class: { $in: classIds } });
        res.status(200).json(flashCards || []);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Get FlashCards by ID - ENFORCE USER OWNERSHIP
const getFlashCardsById = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const flashCard = await FlashCards.findById(req.params.id);
        if (!flashCard) {
            return res.status(404).json({ message: "Flash Card not found" });
        }

        // Verify flashcard belongs to user's class
        const classDoc = await Class.findById(flashCard.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This flashcard does not belong to you." });
        }

        res.status(200).json(flashCard);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Update flashcard - ENFORCE USER OWNERSHIP
const updateFlashCards = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const flashCard = await FlashCards.findById(req.params.id);
        if (!flashCard) {
            return res.status(404).json({ message: "Flash Card not found" });
        }

        const classDoc = await Class.findById(flashCard.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This flashcard does not belong to you." });
        }

        const {topic, question, answer} = req.body;
        const updatedFlashCard = await FlashCards.findByIdAndUpdate(req.params.id, {topic, question, answer}, {new: true});
        res.status(200).json(updatedFlashCard);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//Delete flashcard - ENFORCE USER OWNERSHIP
const deleteFlashCards = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const flashCard = await FlashCards.findById(req.params.id);
        if (!flashCard) {
            return res.status(404).json({message: "Flashcard not found"});
        }

        const classDoc = await Class.findById(flashCard.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This flashcard does not belong to you." });
        }

        const deletedFlashCard = await FlashCards.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Flashcard deleted successfully"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//POST flash cards - ENFORCE USER OWNERSHIP
const generateFlashCards = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const classId = req.params.classid;
        
        if (!classId) {
            return res.status(400).json({ message: "Class ID is required" });
        }

        // Verify class belongs to user
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        if (classDoc.user && classDoc.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. This class does not belong to you." });
        }

        console.log("🔥 Generating flashcards for class:", classId);
        await flashCardGeneration(classId);
        console.log("✅ Flashcards generated successfully");
        res.status(200).json({message: "Flash cards successfully created"});

    } catch (error) {
        console.error("❌ Error generating flashcards:", error);
        res.status(500).json({message: error.message});
    }
}

const getAllCardsbyClassId = async (req, res) => {
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
        
        const flashcards = await FlashCards.find({class: classId});
        
        // Return empty array if no flashcards found (not an error)
        res.status(200).json(flashcards || []);

    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

export {
    getAllFlashCards,
    getFlashCardsById,
    updateFlashCards,
    deleteFlashCards,
    generateFlashCards,
    getAllCardsbyClassId
};

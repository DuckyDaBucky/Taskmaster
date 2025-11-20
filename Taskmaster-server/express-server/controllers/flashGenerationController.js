import FlashCards from '../models/flashCardsModel.js';
import Class from '../models/classModel.js';
import flashCardGeneration from './flashcard_LLM/flashCardGenerator.js'

//Get all FlashCards - ENFORCE USER OWNERSHIP
const getAllFlashCards = async (req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Get all classes for this user
        const userClasses = await Class.find({ user: userId });
        const classIds = userClasses.map(c => c._id);

        // Get all flashcards that belong to user's classes AND have user field set
        // Only return flashcards where class exists (not null) and belongs to user
        const flashCards = await FlashCards.find({
            class: { $in: classIds },
            user: userId // Only return flashcards owned by user
        }).populate('class', 'name'); // Populate class name for display

        res.status(200).json(flashCards || []);

    } catch (error) {
        console.error("Error fetching all flashcards:", error);
        res.status(500).json({ message: error.message });
    }
};

//Cleanup hardcoded flashcards (remove flashcards without user field)
const cleanupFlashcards = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Delete all flashcards that don't have a user field (hardcoded artifacts)
        const result = await FlashCards.deleteMany({ user: { $exists: false } });

        res.status(200).json({
            message: `Cleaned up ${result.deletedCount} hardcoded flashcards`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error("Error cleaning up flashcards:", error);
        res.status(500).json({ message: error.message });
    }
};

//Get FlashCards by ID - ENFORCE USER OWNERSHIP
const getFlashCardsById = async (req, res) => {
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
        res.status(500).json({ message: error.message });
    }
};

//Update flashcard - ENFORCE USER OWNERSHIP
const updateFlashCards = async (req, res) => {
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

        const { topic, question, answer } = req.body;
        const updatedFlashCard = await FlashCards.findByIdAndUpdate(req.params.id, { topic, question, answer }, { new: true });
        res.status(200).json(updatedFlashCard);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Delete flashcard - ENFORCE USER OWNERSHIP
const deleteFlashCards = async (req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // First verify ownership
        const flashCard = await FlashCards.findById(req.params.id);
        if (!flashCard) {
            return res.status(404).json({ message: "Flashcard not found" });
        }

        const classDoc = await Class.findById(flashCard.class);
        if (!classDoc || (classDoc.user && classDoc.user.toString() !== userId.toString())) {
            return res.status(403).json({ message: "Access denied. This flashcard does not belong to you." });
        }

        const deletedFlashCard = await FlashCards.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Flashcard deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//POST flash cards - ENFORCE USER OWNERSHIP (Auto mode with optional resource)
const generateFlashCards = async (req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const classId = req.params.classid;
        const { resourceId } = req.body; // Optional resource ID for parsing

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

        console.log("Generating flashcards for class:", classId, "user:", userId);

        // Call Python Service
        let flashcardsData = [];
        try {
            // Determine topic from class name or topics list
            const topic = classDoc.topics && classDoc.topics.length > 0
                ? classDoc.topics[0]
                : classDoc.name;

            const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:6005';
            const response = await fetch(`${pythonServiceUrl}/generate_flashcards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic })
            });

            if (!response.ok) {
                throw new Error(`Python service error: ${response.statusText}`);
            }

            const data = await response.json();
            flashcardsData = data.flashcards || [];

        } catch (pythonError) {
            console.error("Python service failed, falling back to Node generator:", pythonError);
            // Fallback to existing Node generator if Python fails
            if (resourceId) {
                await flashCardGeneration(classId, userId, resourceId);
            } else {
                await flashCardGeneration(classId, userId);
            }

            // Fetch generated cards
            const generatedFlashcards = await FlashCards.find({
                class: classId,
                user: userId
            }).populate('class', 'name');

            return res.status(200).json({
                message: "Flash cards successfully created (Fallback)",
                flashcards: generatedFlashcards,
                count: generatedFlashcards.length
            });
        }

        // Save Python-generated flashcards to MongoDB
        let savedCount = 0;
        for (const card of flashcardsData) {
            const newFlashCard = new FlashCards({
                class: classId,
                topic: card.topic || classDoc.name,
                question: card.question,
                answer: card.answer,
                user: userId
            });
            await newFlashCard.save();
            savedCount++;
        }

        console.log("Flashcards generated successfully. Saved:", savedCount);

        // Return the generated flashcards
        const generatedFlashcards = await FlashCards.find({
            class: classId,
            user: userId
        }).populate('class', 'name');

        // Log activity
        try {
            const { createActivity } = await import('./activityController.js');
            await createActivity(userId, 'flashcard_generated', `Generated flashcards for class "${classDoc.name}"`, { classId: classId });
        } catch (error) {
            console.error("Error logging activity:", error);
        }

        res.status(200).json({
            message: "Flash cards successfully created",
            flashcards: generatedFlashcards,
            count: generatedFlashcards.length
        });

    } catch (error) {
        console.error("Error generating flashcards:", error);
        res.status(500).json({ message: error.message });
    }
}

//POST manual flash cards - ENFORCE USER OWNERSHIP
const createManualFlashCards = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const classId = req.params.classid;
        const { cards } = req.body; // Array of { question, answer, topic? }

        if (!classId) {
            return res.status(400).json({ message: "Class ID is required" });
        }

        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            return res.status(400).json({ message: "At least one flashcard is required" });
        }

        // Verify class belongs to user
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found" });
        }

        if (classDoc.user && classDoc.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. This class does not belong to you." });
        }

        // Create flashcards
        const createdCards = [];
        for (const card of cards) {
            if (!card.question || !card.answer) {
                continue; // Skip invalid cards
            }

            const newFlashCard = new FlashCards({
                class: classId,
                topic: card.topic || classDoc.name,
                question: card.question,
                answer: card.answer,
                user: userId
            });

            await newFlashCard.save();
            createdCards.push(newFlashCard);
        }

        // Log activity
        try {
            const { createActivity } = await import('./activityController.js');
            await createActivity(userId, 'flashcard_generated', `Created ${createdCards.length} manual flashcards for class "${classDoc.name}"`, { classId: classId });
        } catch (error) {
            console.error("Error logging activity:", error);
        }

        res.status(201).json({
            message: "Flashcards created successfully",
            count: createdCards.length
        });

    } catch (error) {
        console.error("Error creating manual flashcards:", error);
        res.status(500).json({ message: error.message });
    }
}

const getAllCardsbyClassId = async (req, res) => {
    try {
        const classId = req.params.id;
        const userId = req.user?._id; // Get from auth middleware if available

        // Don't allow "personal" as a class ID for flashcards (flashcards must belong to a class)
        if (classId === "personal") {
            return res.status(400).json({ message: "Flashcards must belong to a class" });
        }

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

        const flashcards = await FlashCards.find({
            class: classId,
            user: userId // Only return flashcards owned by the user
        }).populate('class', 'name');

        // Return empty array if no flashcards found (not an error)
        res.status(200).json(flashcards || []);

    } catch (error) {
        console.error("Error fetching flashcards by class:", error);
        res.status(500).json({ message: error.message });
    }
}

export {
    getAllFlashCards,
    getFlashCardsById,
    updateFlashCards,
    deleteFlashCards,
    generateFlashCards,
    getAllCardsbyClassId,
    cleanupFlashcards,
    createManualFlashCards
};

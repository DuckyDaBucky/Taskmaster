import { Router } from 'express';
import auth from '../middleware/auth.js';

import { 
    getAllFlashCards,
    getFlashCardsById,
    updateFlashCards,
    deleteFlashCards,
    generateFlashCards,
    getAllCardsbyClassId
} from '../controllers/flashGenerationController.js';

const router = Router();

// GET all cards - REQUIRES AUTH for data isolation
router.get('/', auth, getAllFlashCards);

// GET a single card by ID - REQUIRES AUTH for data isolation
router.get('/single/:id', auth, getFlashCardsById);

// Get all flashcards by class - REQUIRES AUTH for data isolation
router.get('/class/:id', auth, getAllCardsbyClassId);

// DELETE a flashcard by ID - REQUIRES AUTH for data isolation
router.delete('/:id', auth, deleteFlashCards);

// UPDATE a flashcard by ID - REQUIRES AUTH for data isolation
router.patch('/:id', auth, updateFlashCards);

// Generate Flash Cards by classid - REQUIRES AUTH for data isolation
router.post("/:classid", auth, generateFlashCards);



export default router;
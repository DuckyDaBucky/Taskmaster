import { Router } from 'express';

import { 
    getAllFlashCards,
    getFlashCardsById,
    updateFlashCards,
    deleteFlashCards,
    generateFlashCards,
    getAllCardsbyClassId
} from '../controllers/flashGenerationController.js';

const router = Router();

// GET all cards
router.get('/', getAllFlashCards);

// GET a single card by ID
router.get('/single/:id', getFlashCardsById);

router.get('/class/:id', getAllCardsbyClassId);

// DELETE a flashcard by ID
router.delete('/:id', deleteFlashCards,);

// UPDATE a flashcard by ID
router.patch('/:id', updateFlashCards);

// Generate Flash Cards by classid
router.post("/:classid", generateFlashCards);



export default router;
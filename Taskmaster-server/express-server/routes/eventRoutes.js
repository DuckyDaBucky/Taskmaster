import { Router } from 'express';
import auth from '../middleware/auth.js';

import {
    createEvent,
    editEventById,
    getEventsByUserId,
    deleteEventById,
} from '../controllers/eventController.js';

const router = Router();

// All routes require authentication for data isolation
router.post('/', auth, createEvent);
router.post('/editEvent/:eventid', auth, editEventById);
router.get('/getAllEvents/:userid', auth, getEventsByUserId);
router.get('/deleteEvent/:eventid', auth, deleteEventById);

export default router;
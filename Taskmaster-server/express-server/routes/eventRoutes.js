import { Router } from 'express';

import {
    createEvent,
    editEventById,
    getEventsByUserId,
    deleteEventById,
} from '../controllers/eventController.js';

const router = Router();

router.post('/', createEvent);
router.post('/editEvent/:eventid', editEventById);
router.get('/getAllEvents/:userid', getEventsByUserId);
router.get('/deleteEvent/:eventid', deleteEventById);

export default router;
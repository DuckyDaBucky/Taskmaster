import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getUserActivities } from '../controllers/activityController.js';

const router = Router();

router.get('/', auth, getUserActivities);

export default router;


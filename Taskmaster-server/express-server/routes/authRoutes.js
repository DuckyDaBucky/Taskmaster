import express from 'express'
import authUser from '../controllers/authController.js';

const router = express.Router();

//verify user
router.post('/', authUser);

export default router;
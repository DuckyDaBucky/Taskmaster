import { Router } from 'express';
import auth from '../middleware/auth.js';

import {  
    getAllTask, 
    getTaskById, 
    updateTask, 
    deleteTask, 
    getTaskByClassId, 
    createTaskByClassId, 
    parseSyllabus 
} from '../controllers/taskController.js';

const router = Router();

// GET all tasks - REQUIRES AUTH for data isolation
router.get('/', auth, getAllTask);

// GET a single task by ID - REQUIRES AUTH for data isolation
router.get('/single/:id', auth, getTaskById);

//Get all tasks by class - REQUIRES AUTH for data isolation
router.get('/classid/:classid', auth, getTaskByClassId);

// DELETE a task by ID - REQUIRES AUTH for data isolation
router.delete('/:id', auth, deleteTask);

// UPDATE a task by ID - REQUIRES AUTH for data isolation
router.patch('/:id', auth, updateTask);

//Get all tasks by syllabus path (Not using in final proj)
router.post('/syllabus', parseSyllabus);

//Create task by class id - REQUIRES AUTH for data isolation
router.post('/classid/:id', auth, createTaskByClassId);



export default router;
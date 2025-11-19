import { Router } from 'express';

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

// GET all tasks
router.get('/', getAllTask);

// GET a single task by ID
router.get('/single/:id', getTaskById);

//Get all tasks by class
router.get('/classid/:classid', getTaskByClassId);

// DELETE a task by ID
router.delete('/:id', deleteTask);

// UPDATE a task by ID
router.patch('/:id', updateTask);

//Get all tasks by syllabus path (Not using in final proj)
router.post('/syllabus', parseSyllabus);

//Create task by class id
router.post('/classid/:id', createTaskByClassId);



export default router;
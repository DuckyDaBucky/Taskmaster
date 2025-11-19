import { Router } from 'express';

import { 
    createClass, 
    getAllClasses, 
    getClassById,
    getAllClassesbyUserid,
    updateClass, 
    deleteClass,
    parseSyllabus 
} from '../controllers/classController.js';

const router = Router();

// GET all classs (don't use on client side)
router.get('/', getAllClasses);

// GET a single class by ID
router.get('/single/:id', getClassById);

// GET all class by userId
router.get('/user/:userid', getAllClassesbyUserid);

// POST a new class
router.post('/', createClass);

// DELETE a class by ID
router.delete('/:id', deleteClass);

//Get all tasks by syllabus path (Not being used in final)
router.post('/syllabus', parseSyllabus)

// UPDATE a class by ID
router.patch('/:id', updateClass);

export default router;
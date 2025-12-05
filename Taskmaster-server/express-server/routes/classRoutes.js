import { Router } from 'express';
import auth from '../middleware/auth.js';

import { 
    createClass, 
    getAllClasses, 
    getClassById,
    getAllClassesbyUserid,
    updateClass, 
    deleteClass,
    parseSyllabus,
    getPersonalClassId
} from '../controllers/classController.js';

const router = Router();

// GET all classes (excludes Personal) - REQUIRES AUTH for data isolation
router.get('/', auth, getAllClasses);

// GET Personal class ID - REQUIRES AUTH
router.get('/personal', auth, getPersonalClassId);

// GET a single class by ID - REQUIRES AUTH for data isolation
router.get('/single/:id', auth, getClassById);

// GET all class by userId - REQUIRES AUTH for data isolation
router.get('/user/:userid', auth, getAllClassesbyUserid);

// POST a new class - REQUIRES AUTH for data isolation
router.post('/', auth, createClass);

// DELETE a class by ID - REQUIRES AUTH for data isolation
router.delete('/:id', auth, deleteClass);

//Get all tasks by syllabus path (Not being used in final)
router.post('/syllabus', parseSyllabus)

// UPDATE a class by ID - REQUIRES AUTH for data isolation
router.patch('/:id', auth, updateClass);

export default router;
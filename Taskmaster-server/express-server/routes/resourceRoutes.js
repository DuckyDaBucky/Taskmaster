import express from 'express';
import auth from '../middleware/auth.js';

import {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource,
    getResourcesByClassId,
    createResourceByClassId,
    parseSyllabus
} from '../controllers/resourceController.js';

const router = express.Router();

// GET all resources - REQUIRES AUTH for data isolation
router.get('/', auth, getAllResources);

// GET a single resource by ID - REQUIRES AUTH for data isolation
router.get('/single/:id', auth, getResourceById);

// Get all resources for a certain class - REQUIRES AUTH for data isolation
router.get('/class/:id', auth, getResourcesByClassId);

// POST a new resource - REQUIRES AUTH for data isolation
router.post('/', auth, createResource);

// DELETE a resource by ID - REQUIRES AUTH for data isolation
router.delete('/:id', auth, deleteResource);

// UPDATE a resource by ID - REQUIRES AUTH for data isolation
router.patch('/:id', auth, updateResource);

//Get all tasks by syllabus path (Not using in final proj)
router.post('/syllabus', parseSyllabus)

// Create resource by class ID - REQUIRES AUTH for data isolation
router.post('/classid/:id', auth, createResourceByClassId);

export default router;
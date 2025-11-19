import express from 'express';

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

// GET all resources
router.get('/', getAllResources);

// GET a single resource by ID
router.get('/single/:id', getResourceById);

// Get all resources for a certain class
router.get('/class/:id', getResourcesByClassId);

// POST a new resource
router.post('/', createResource);

// DELETE a resource by ID
router.delete('/:id', deleteResource);

// UPDATE a resource by ID
router.patch('/:id', updateResource);

//Get all tasks by syllabus path (Not using in final proj)
router.post('/syllabus', parseSyllabus)

// Create resource by class ID
router.post('/classid/:id', createResourceByClassId);

export default router;
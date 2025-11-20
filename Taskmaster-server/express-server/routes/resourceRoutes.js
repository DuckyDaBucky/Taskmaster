import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    createResource,
    getAllResources,
    getResourceById,
    deleteResource,
    getResourcesByClassId,
    createResourceByClassId,
    parseSyllabus,
    smartUploadResource
} from '../controllers/resourceController.js';

const router = express.Router();

// Get all resources - REQUIRES AUTH
router.get('/', auth, getAllResources);

// Get resource by ID - REQUIRES AUTH
router.get('/:id', auth, getResourceById);

// Delete resource - REQUIRES AUTH
router.delete('/:id', auth, deleteResource);

// Get resources by class ID - REQUIRES AUTH
router.get('/class/:id', auth, getResourcesByClassId);

// Create resource by class ID - REQUIRES AUTH for data isolation
// Uses Multer 'upload.single("file")' to handle file uploads
router.post('/classid/:id', auth, upload.single('file'), createResourceByClassId);

// Smart upload - AI auto-classifies files
router.post('/smart-upload', auth, upload.single('file'), smartUploadResource);

// Parse syllabus (if needed)
router.post('/syllabus', parseSyllabus);

export default router;
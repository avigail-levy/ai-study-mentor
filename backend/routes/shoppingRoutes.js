import express from 'express';
import multer from 'multer';
import * as shopCtrl from '../controllers/shoppingController.js';
import { fileURLToPath } from 'url';


const router = express.Router();
const upload = multer({ dest: 'uploads/' });


// Auth
router.post('/auth/login', shopCtrl.login);

// List Management
router.post('/list/add-item', shopCtrl.addItem);
router.post('/list/add-voice-items', shopCtrl.addVoiceItems);

// Calculation & Files
router.post('/calculate-path', shopCtrl.calculatePath);
router.post('/upload-and-calculate', upload.single('file'), shopCtrl.uploadAndCalculate);

export default router;
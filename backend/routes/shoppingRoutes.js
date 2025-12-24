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
router.post('/list/clear', shopCtrl.clearList);

// Calculation & Files
router.post('/calculate-path', shopCtrl.calculatePath);
router.post('/upload-and-calculate', upload.single('file'), shopCtrl.uploadAndCalculate);
// Get user's shopping list
router.get('/list/:userId', shopCtrl.getShoppingList);
router.delete('/item/:id', shopCtrl.deleteItem);
router.put('/item/:id', shopCtrl.updateItem);

export default router;
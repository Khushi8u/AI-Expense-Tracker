import { Router } from 'express';
import { processReceipt } from '../controllers/ocr.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadReceipt } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadReceipt.single('receipt'), processReceipt);

export default router;

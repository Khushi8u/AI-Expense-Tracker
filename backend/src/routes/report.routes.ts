import { Router } from 'express';
import { getMonthlyReport } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/monthly', getMonthlyReport);

export default router;

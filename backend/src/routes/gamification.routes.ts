import { Router } from 'express';
import { getEcoStatus, getDailyChallenge, completeChallenge, getCarbonOffsetInfo } from '../controllers/gamification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/status',    getEcoStatus);
router.get('/challenge', getDailyChallenge);
router.post('/challenge/complete', completeChallenge);
router.get('/offset',    getCarbonOffsetInfo);

export default router;

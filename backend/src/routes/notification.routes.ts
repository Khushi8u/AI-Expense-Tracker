import { Router } from 'express';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/all/read', markAsRead);   // mark all as read
router.patch('/:id/read', markAsRead);   // mark one as read
router.delete('/:id', deleteNotification);

export default router;

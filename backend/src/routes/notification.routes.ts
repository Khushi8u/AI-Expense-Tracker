import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead, deleteNotification } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/all/read', markAllRead);      // mark ALL as read - must be before /:id
router.patch('/:id/read', markAsRead);       // mark one as read
router.delete('/:id', deleteNotification);

export default router;

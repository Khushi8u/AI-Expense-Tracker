import { Router } from 'express';
import { body } from 'express-validator';
import {
  register, login, getProfile, updateProfile,
  changePassword, forgotPassword, resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadProfileImage } from '../middlewares/upload.middleware';

const router = Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  validate,
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], login);

router.get('/profile', authenticate, getProfile);

router.put('/profile', authenticate, uploadProfileImage.single('profileImage'), updateProfile);

router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
], changePassword);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
  validate,
], forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
], resetPassword);

export default router;

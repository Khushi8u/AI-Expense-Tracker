import { Router } from 'express';
import { getWishlist, addWishlistItem, updateWishlistItem, markAsBought, deleteWishlistItem, getWishlistStats } from '../controllers/wishlist.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/',           getWishlist);
router.get('/stats',      getWishlistStats);
router.post('/',          addWishlistItem);
router.put('/:id',        updateWishlistItem);
router.patch('/:id/buy',  markAsBought);
router.delete('/:id',     deleteWishlistItem);

export default router;

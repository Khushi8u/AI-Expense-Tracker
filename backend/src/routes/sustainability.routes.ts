import { Router } from 'express';
import {
  getSustainabilityScore,
  getCarbonFootprint,
  getSustainableAlternatives,
  getEcoRecommendations,
  getGreenGoals,
  createGreenGoal,
  updateGreenGoalProgress,
  deleteGreenGoal,
  getEcoReport,
} from '../controllers/sustainability.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Sustainability Score
router.get('/score', getSustainabilityScore);

// Carbon Footprint
router.get('/carbon', getCarbonFootprint);

// Sustainable Alternatives
router.get('/alternatives', getSustainableAlternatives);

// Eco Recommendations
router.get('/recommendations', getEcoRecommendations);

// Eco Report
router.get('/report', getEcoReport);

// Green Goals
router.get('/goals', getGreenGoals);
router.post('/goals', createGreenGoal);
router.patch('/goals/:id/progress', updateGreenGoalProgress);
router.delete('/goals/:id', deleteGreenGoal);

export default router;

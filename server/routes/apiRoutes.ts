//handles both auth and protected routes
import express, { Request, Response, NextFunction } from 'express';
import userDatabaseController from '../controllers/userDatabaseController';
import { authenticateUser } from '../middleware/authMiddleware';
import OAuthController from '../controllers/OAuthController';

const router = express.Router();

// Public routes (no authentication needed)
router.post('/auth/github/callback', (req: Request, res: Response) : void => {
  OAuthController.handleCallback(req, res);
});

// Protected routes (require authentication)
router.post(
  '/query-metrics',
  authenticateUser, // Add authentication middleware
  userDatabaseController.connectDB,
  (req: Request, res: Response) : void => {
    res.status(200).json(res.locals.queryMetrics);
  }
);


export default router;

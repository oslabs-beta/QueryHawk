//handles both auth and protected routes
import express, { Request, Response, NextFunction } from 'express';
import userDatabaseController from '../controllers/userDatabaseController';
import monitoringController from '../controllers/monitoringController';
import { authenticateUser } from '../middleware/authMiddleware';
import OAuthController from '../controllers/OAuthController';

const router = express.Router();

// ===== Auth Routes (public) =====
router.post('/auth/github/callback', (req: Request, res: Response): void => {
  OAuthController.handleCallback(req, res);
});

// Get current user
router.get(
  '/auth/me',
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId;
      const user = await OAuthController.getCurrentUser(userId);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
);

// Logout endpoint
router.post(
  '/auth/logout',
  authenticateUser,
  (req: Request, res: Response): void => {
    try {
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }
);

// Add monitoring routes
router.post('/connect', monitoringController.setupMonitoring);

// Add the metrics endpoint
router.get('/metrics', monitoringController.getMetrics);

// ===== Protected API Routes =====
router.post(
  '/query-metrics',
  authenticateUser, // Add authentication middleware
  userDatabaseController.fetchUserMetrics,
  userDatabaseController.saveMetricsToDB
);

// Get user metrics
router.get(
  '/user/metrics',
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId;
      const metrics = await userDatabaseController.getUserMetrics(userId);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Dashboard data
router.get(
  '/dashboard',
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId;
      const dashboardData = await userDatabaseController.getDashboardData(
        userId
      );

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

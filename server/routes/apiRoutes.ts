//handles both auth and protected routes
import express, { Request, Response, NextFunction } from 'express';
import userDatabaseController from '../controllers/userDatabaseController';
import monitoringController from '../controllers/monitoringController';
import { authenticateUser } from '../middleware/authMiddleware';
import OAuthController from '../controllers/OAuthController';
import {
  setDatabaseUriToPostgresExporter,
  cleanupExporter,
} from '../utils/dockerPostgresExporter';
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
router.post('/connect', authenticateUser, monitoringController.setupMonitoring);

// Add the metrics endpoint
router.get('/metrics', monitoringController.getMetrics);

// ===== Protected API Routes =====
router.post(
  '/query-metrics',
  authenticateUser, // Add authentication middleware
  userDatabaseController.connectDB,
  (req: Request, res: Response): void => {
    res.status(200).json(res.locals.queryMetrics);
  }
);

//Docker exporter routes
router.post(
  '/monitoring/start',
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId;
      const { uri_string, port } = req.body;

      if (!uri_string) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: uri_string is required',
        });
        return;
      }

      const result = await setDatabaseUriToPostgresExporter({
        userId: userId.toString(),
        uri_string,
        port,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      next({
        log: 'Error in setupExporter middleware',
        status: 500,
        message: {
          err:
            error instanceof Error
              ? error.message
              : 'Failed to start monitoring',
        },
      });
    }
  }
);

router.post(
  '/monitoring/stop',
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId;

      await cleanupExporter(userId.toString());

      res.status(200).json({
        success: true,
        message: 'Monitoring stopped successfully',
      });
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      next({
        log: 'Error in cleanupExporter middleware',
        status: 500,
        message: {
          err:
            error instanceof Error
              ? error.message
              : 'Failed to stop monitoring',
        },
      });
    }
  }
);

export default router;

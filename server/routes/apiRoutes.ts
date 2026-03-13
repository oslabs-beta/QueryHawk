import express, { Request, Response, NextFunction } from 'express';
import userDatabaseController from '../controllers/userDatabaseController';
import {
  setupMonitoring,
  getMetrics,
} from '../controllers/monitoringController';
import { authenticateUser } from '../middleware/authMiddleware';
import OAuthController from '../controllers/OAuthController';
import {
  setDatabaseUriToPostgresExporter,
  cleanupExporter,
  listActiveTargets,
  getTargetStatus,
} from '../utils/alloyPostgresExporter';

const router = express.Router();

// GitHub OAuth login route
router.get('/auth/github', (req: Request, res: Response) => {
  OAuthController.handleLogin(req, res);
});

// OAuth routes
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
  },
);

router.post(
  '/auth/logout',
  authenticateUser,
  (req: Request, res: Response): void => {
    try {
      // If OAuthController has a logout method, call it here
      res.status(200).json({ message: 'Logged out successfully' });
    } catch {
      res.status(500).json({ error: 'Logout failed' });
    }
  },
);

router.post('/auth/github/callback', (req: Request, res: Response): void => {
  OAuthController.handleCallback(req, res);
});

// Add monitoring routes
router.post('/connect', authenticateUser, setupMonitoring);

// Add the metrics endpoint
router.get('/metrics', getMetrics);

// ===== Protected API Routes =====
router.post(
  '/query-metrics',
  authenticateUser, // Add authentication middleware
  userDatabaseController.fetchUserMetrics,
  userDatabaseController.saveMetricsToDB,
);

// Add the route to get saved queries
router.get(
  '/saved-queries',
  authenticateUser,
  userDatabaseController.getSavedQueries,
);

// Add query analysis endpoints
router.post(
  '/query/analyze',
  authenticateUser,
  userDatabaseController.analyzeQuery,
);

router.post(
  '/query/compare',
  authenticateUser,
  userDatabaseController.compareQueries,
);

router.get(
  '/query/history/:queryHash',
  authenticateUser,
  userDatabaseController.getQueryHistory,
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
  },
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
  },
);

// Add new Alloy monitoring endpoints
router.get(
  '/monitoring/targets',
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targets = await listActiveTargets();
      res.status(200).json({ targets });
    } catch (error) {
      console.error('Error listing monitoring targets:', error);
      next({
        log: 'Error in listActiveTargets middleware',
        status: 500,
        message: {
          err:
            error instanceof Error
              ? error.message
              : 'Failed to list monitoring targets',
        },
      });
    }
  },
);

router.get(
  '/monitoring/targets/:userId',
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const target = await getTargetStatus(userId);

      if (!target) {
        res.status(404).json({ message: 'Monitoring target not found' });
        return;
      }

      res.status(200).json({ target });
    } catch (error) {
      console.error('Error getting monitoring target status:', error);
      next({
        log: 'Error in getTargetStatus middleware',
        status: 500,
        message: {
          err:
            error instanceof Error
              ? error.message
              : 'Failed to get monitoring target status',
        },
      });
    }
  },
);

export default router;

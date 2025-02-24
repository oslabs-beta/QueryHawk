import express, { Request, Response } from 'express';
import userDatabaseController from '../controllers/userDatabaseController';
import monitoringController from '../controllers/monitoringController';

const router = express.Router();

router.post(
  '/query-metrics',
  userDatabaseController.connectDB,
  (req: Request, res: Response) => {
    res.status(200).json(res.locals.queryMetrics);
  }
);

// Add monitoring routes
router.post('/connect', monitoringController.setupMonitoring);

// Add the metrics endpoint
router.get('/metrics', monitoringController.getMetrics);

export default router;

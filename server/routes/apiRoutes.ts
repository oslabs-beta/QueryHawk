import express, { Request, Response } from 'express';
import userDatabaseController from '../controllers/userDatabaseController';

const router = express.Router();

// Route to set URI for Postgres exporter.
router.post('/set-db-uri', userDatabaseController.connectToPostgresExporter);

// route to get query metrics (requires both URI and query)
router.post(
  '/query-metrics',
  userDatabaseController.getQueryMetrics,
  (req: Request, res: Response) => {
    res.status(200).json(res.locals.queryMetrics);
  }
);

export default router;

import { Request, RequestHandler, Response } from 'express';
import { optimizeQuery } from '../services/queryOptimizationService';
import { formatSchemaForGPT } from '../utils/schemaUtils';
import { validateReadOnlyQuery } from '../utils/validateQuery';
import { fetchTableNames, fetchSchemaContext } from '../services/schemaService';

const sendErrorResponse = (
  res: Response,
  status: number,
  message: string,
  details?: string,
): void => {
  res.status(status).json({ error: message, message, details });
};

const sendBadRequest = (res: Response, message: string): void => {
  sendErrorResponse(res, 400, message);
};

const sendServerError = (
  res: Response,
  message: string,
  details?: string,
): void => {
  sendErrorResponse(res, 500, message, details);
};

type AiController = {
  getQueryOptimization: RequestHandler;
};

const aiController: AiController = {
  getQueryOptimization: async (req: Request, res: Response): Promise<void> => {
    const { uri_string, query, metrics } = req.body;

    // Check if uri_string, query and metrics are not in the req
    if (!uri_string || !query || !metrics) {
      console.log('Missing query or metrics.');
      sendBadRequest(
        res,
        'Database URI, query statement and metrics are required.',
      );
      return;
    }
    try {
      // Validate query before we fetch the table
      validateReadOnlyQuery(query);
      // Call fetchTableNames it requires uri_string and query
      const tableNames = await fetchTableNames(uri_string, query);

      // Call fetchSchemaContext it requires uri_string and tableNames
      const schemaContexts = await fetchSchemaContext(uri_string, tableNames);

      const formattedSchema = formatSchemaForGPT(schemaContexts);

      // If formattedSchema is empty run AI optimization based on query structure
      if (!formattedSchema) {
        const optimizedQueryNoSchemaContext = await optimizeQuery(
          query,
          metrics,
          'Schema context unavailable - optimize based on query structure only',
        );
        res.json({
          ...optimizedQueryNoSchemaContext,
          warning:
            'Schema context unavailable - optimized based on query structure only',
        });
        return;
      }
      // Call optimizeQuery
      const optimizedQuery = await optimizeQuery(
        query,
        metrics,
        formattedSchema,
      );
      res.json(optimizedQuery);
    } catch (error) {
      console.error('Optimization for query failed: ', error);
      sendServerError(
        res,
        'Query optimization failed',
        error instanceof Error ? error.message : undefined,
      );
    }
  },
};

export default aiController;

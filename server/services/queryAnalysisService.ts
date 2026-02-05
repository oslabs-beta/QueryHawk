import pg from 'pg';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

export interface QueryAnalysis {
  executionTime: number;
  planningTime: number;
  totalCost: number;
  bufferHits: number;
  bufferReads: number;
  cacheHitRatio: number;
  insights: QueryInsights;
}

export interface QueryInsights {
  isSlowQuery: boolean;
  isBadCache: boolean;
  isExpensive: boolean;
  recommendations: string[];
}

export interface QueryComparison {
  before: QueryAnalysis;
  after: QueryAnalysis;
  improvements: {
    executionTime: string;
    cacheHitRatio: string;
    totalCost: string;
  };
}

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const tracer = trace.getTracer('queryhawk-query-analyzer', '1.0.0');

type AppDbPool = pg.Pool;

const resolveUserDatabaseUri = async (
  appDbPool: AppDbPool,
  userId: number,
): Promise<string> => {
  const userQueryResult = await appDbPool.query(
    'SELECT uri_string FROM user_connections WHERE user_id = $1 LIMIT 1',
    [userId],
  );

  let uriString = process.env.DEFAULT_DATABASE_URL;
  if (userQueryResult.rows.length > 0) {
    uriString = userQueryResult.rows[0].uri_string;
  }

  if (!uriString) {
    throw new ServiceError('No database connection found for user.', 400);
  }

  return uriString;
};

const runExplainAnalyze = async (
  uriString: string,
  sqlQuery: string,
): Promise<{ queryPlan: any; durationMs: number }> => {
  const { Pool } = pg;
  const userDBPool = new Pool({
    connectionString: uriString,
    ssl: { rejectUnauthorized: false },
  });

  const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`;
  const startTime = Date.now();

  try {
    const result = await userDBPool.query(explainQuery);
    const durationMs = Date.now() - startTime;
    const queryPlan = result.rows[0]['QUERY PLAN'][0];

    if (!queryPlan) {
      throw new ServiceError('Could not retrieve plan data', 500);
    }

    return { queryPlan, durationMs };
  } finally {
    await userDBPool.end();
  }
};

export const parseExplainResult = (explainResult: any): QueryAnalysis => {
  const plan = explainResult['Plan'] || explainResult;
  const bufferHits = explainResult['Planning']?.['Shared Hit Blocks'] || 0;
  const bufferReads = explainResult['Planning']?.['Shared Read Blocks'] || 0;
  const cacheHitRatio =
    bufferHits + bufferReads > 0
      ? Math.round((bufferHits / (bufferHits + bufferReads)) * 100)
      : 0;

  return {
    executionTime: explainResult['Execution Time'] || 0,
    planningTime: explainResult['Planning Time'] || 0,
    totalCost: plan['Total Cost'] || 0,
    bufferHits,
    bufferReads,
    cacheHitRatio,
    insights: generateInsights({
      executionTime: explainResult['Execution Time'] || 0,
      totalCost: plan['Total Cost'] || 0,
      cacheHitRatio,
    }),
  };
};

export const generateInsights = (
  analysis: Partial<QueryAnalysis>,
): QueryInsights => {
  const isSlowQuery = (analysis.executionTime || 0) > 100;
  const isBadCache = (analysis.cacheHitRatio || 0) < 80;
  const isExpensive = (analysis.totalCost || 0) > 200;

  const recommendations: string[] = [];

  if (isSlowQuery) {
    recommendations.push(
      'Query execution time is slow - consider adding indexes',
    );
  }
  if (isBadCache) {
    recommendations.push('Low cache hit ratio indicates excessive disk I/O');
  }
  if (isExpensive) {
    recommendations.push('High query cost suggests inefficient execution plan');
  }
  if (!isSlowQuery && !isBadCache && !isExpensive) {
    recommendations.push('Query performance looks good!');
  }

  return {
    isSlowQuery,
    isBadCache,
    isExpensive,
    recommendations,
  };
};

export const storeQueryAnalysis = async (
  appDbPool: AppDbPool,
  userId: number,
  sqlQuery: string,
  analysis: QueryAnalysis,
): Promise<void> => {
  try {
    const queryResult = await appDbPool.query(
      'INSERT INTO queries (query_name, query_text, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [`Analysis_${new Date().toISOString()}`, sqlQuery, userId],
    );

    const queryId = queryResult.rows[0].id;
    await appDbPool.query(
      `INSERT INTO metrics (
          execution_time, planning_time, total_cost, shared_hit_blocks, 
          shared_read_blocks, cache_hit_ratio, query_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        analysis.executionTime,
        analysis.planningTime,
        analysis.totalCost,
        analysis.bufferHits,
        analysis.bufferReads,
        analysis.cacheHitRatio,
        queryId,
      ],
    );
  } catch (error) {
    console.error('Failed to store query analysis:', error);
  }
};

export const analyzeQueryWithTracing = async (
  appDbPool: AppDbPool,
  userId: number,
  sqlQuery: string,
): Promise<{ analysis: QueryAnalysis; insights: QueryInsights }> =>
  tracer.startActiveSpan(
    'query.analyze',
    {
      kind: SpanKind.SERVER,
      attributes: {
        'user.id': userId,
        'query.length': sqlQuery?.length || 0,
        'query.hash': Buffer.from(sqlQuery || '')
          .toString('base64')
          .slice(0, 16),
        'service.name': 'queryhawk-query-analyzer',
      },
    },
    async (span) => {
      try {
        span.addEvent('query.analysis.started', {
          'query.type': sqlQuery.trim().split(' ')[0].toUpperCase(),
        });

        // Resolve database connection
        const connectionSpan = tracer.startSpan('database.connection.resolve', {
          attributes: { 'user.id': userId },
        });

        let uriString: string;

        try {
          uriString = await resolveUserDatabaseUri(appDbPool, userId);

          connectionSpan.setAttributes({
            'database.connection.found': true,
            'database.connection.source': 'user',
          });
          connectionSpan.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
          connectionSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        } finally {
          connectionSpan.end();
        }

        // Execute EXPLAIN ANALYZE
        const explainSpan = tracer.startSpan('query.explain.execute', {
          kind: SpanKind.CLIENT,
          attributes: {
            'db.system': 'postgresql',
            'db.operation': 'EXPLAIN ANALYZE',
            'db.statement': `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery.slice(
              0,
              100,
            )}...`,
          },
        });

        let queryPlan: any;
        let explainDurationMs = 0;

        try {
          const { queryPlan: plan, durationMs } = await runExplainAnalyze(
            uriString,
            sqlQuery,
          );

          queryPlan = plan;
          explainDurationMs = durationMs;

          explainSpan.setAttributes({
            'db.explain.duration_ms': explainDurationMs,
          });

          explainSpan.addEvent('query.plan.retrieved', {
            'plan.execution_time': queryPlan['Execution Time'],
            'plan.planning_time': queryPlan['Planning Time'],
            'plan.total_cost': queryPlan['Plan']?.['Total Cost'],
          });

          explainSpan.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
          explainSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        } finally {
          explainSpan.end();
        }

        // Parse and analyze results
        const analysisSpan = tracer.startSpan('query.analysis.parse', {
          attributes: { 'user.id': userId },
        });

        let analysis: QueryAnalysis;
        let insights: QueryInsights;

        try {
          analysis = parseExplainResult(queryPlan);
          insights = generateInsights(analysis);

          analysisSpan.setAttributes({
            'analysis.execution_time': analysis.executionTime,
            'analysis.cache_hit_ratio': analysis.cacheHitRatio,
            'analysis.total_cost': analysis.totalCost,
            'insights.is_slow': insights.isSlowQuery,
            'insights.is_bad_cache': insights.isBadCache,
            'insights.is_expensive': insights.isExpensive,
            'insights.recommendations_count': insights.recommendations.length,
          });

          analysisSpan.addEvent('analysis.completed', {
            'performance.rating':
              insights.isSlowQuery ||
              insights.isBadCache ||
              insights.isExpensive
                ? 'needs_optimization'
                : 'good',
          });

          analysisSpan.setStatus({ code: SpanStatusCode.OK });
        } finally {
          analysisSpan.end();
        }

        // Store results (best-effort)
        const storageSpan = tracer.startSpan('query.analysis.store', {
          attributes: { 'user.id': userId },
        });

        try {
          await storeQueryAnalysis(appDbPool, userId, sqlQuery, analysis);
          storageSpan.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
          storageSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Storage failed',
          });
          console.warn('Failed to store query analysis:', error);
        } finally {
          storageSpan.end();
        }

        span.setAttributes({
          'query.analysis.execution_time': analysis.executionTime,
          'query.analysis.planning_time': analysis.planningTime,
          'query.analysis.cache_hit_ratio': analysis.cacheHitRatio,
          'query.analysis.total_cost': analysis.totalCost,
          'query.performance.is_slow': insights.isSlowQuery,
          'query.performance.is_bad_cache': insights.isBadCache,
          'query.performance.is_expensive': insights.isExpensive,
        });

        span.addEvent('query.analysis.completed', {
          'recommendations.count': insights.recommendations.length,
          status: 'success',
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return { analysis, insights };
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        span.end();
      }
    },
  );

export const analyzeQueryInternal = async (
  appDbPool: AppDbPool,
  sqlQuery: string,
  userId: number,
): Promise<QueryAnalysis> => {
  const uriString = await resolveUserDatabaseUri(appDbPool, userId);
  const { queryPlan } = await runExplainAnalyze(uriString, sqlQuery);
  return parseExplainResult(queryPlan);
};

export const compareQueries = async (
  appDbPool: AppDbPool,
  userId: number,
  query1: string,
  query2: string,
): Promise<QueryComparison> => {
  const analysis1 = await analyzeQueryInternal(appDbPool, query1, userId);
  const analysis2 = await analyzeQueryInternal(appDbPool, query2, userId);

  return {
    before: analysis1,
    after: analysis2,
    improvements: {
      executionTime: (
        ((analysis1.executionTime - analysis2.executionTime) /
          analysis1.executionTime) *
        100
      ).toFixed(2),
      cacheHitRatio: (
        ((analysis2.cacheHitRatio - analysis1.cacheHitRatio) /
          analysis1.cacheHitRatio) *
        100
      ).toFixed(2),
      totalCost: (
        ((analysis1.totalCost - analysis2.totalCost) / analysis1.totalCost) *
        100
      ).toFixed(2),
    },
  };
};

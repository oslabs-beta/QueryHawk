export interface QueryMetrics {
  executionTime: number;
  planningTime: number;
  rowsReturned: number;
  memoryUsage: number;
  cacheHitRatio: number;
}
# QueryHawk Lean Query Analyzer - Implementation Guide

## 🎯 Overview

The QueryHawk Lean Query Analyzer enhances the existing QueryPerformance components with advanced query analysis capabilities, providing instant performance insights and optimization recommendations.

## ✨ New Features

### 1. Enhanced Query Analysis

- **Instant Performance Insights**: Get immediate feedback on query performance
- **Smart Recommendations**: Actionable optimization suggestions based on PostgreSQL metrics
- **Health Check Cards**: Visual indicators for speed, cache efficiency, and query cost

### 2. Advanced Cache Analysis

- **Buffer Cache Visualization**: Pie chart showing cache hits vs disk reads
- **Cache Hit Ratio**: Percentage-based cache efficiency metrics
- **I/O Performance**: Identify excessive disk I/O patterns

### 3. Query Comparison

- **Before/After Analysis**: Compare query performance before and after optimizations
- **Performance Metrics**: Side-by-side comparison of execution time, cost, and cache usage
- **Improvement Summary**: Percentage improvements in key performance areas

### 4. Enhanced History

- **One-Click Comparison**: Compare historical queries with current analysis
- **Performance Tracking**: Monitor query performance over time

## 🏗️ Architecture

### Backend Enhancements

- **Enhanced `userDatabaseController.ts`**: New methods for query analysis and comparison
- **New API Endpoints**: `/api/query/analyze`, `/api/query/compare`, `/api/query/history/:queryHash`
- **Advanced EXPLAIN Parsing**: Better parsing of PostgreSQL EXPLAIN ANALYZE output
- **Insight Generation**: Automated performance analysis and recommendations

### Frontend Components

- **`LeanQueryAnalyzer.tsx`**: New visualization component for query analysis
- **Enhanced `TestQueryPage.tsx`**: Integrated query analysis workflow
- **Enhanced `QueryComparisonPage.tsx`**: Advanced comparison visualizations
- **Enhanced `QueryHistory.tsx`**: One-click comparison functionality

## 🚀 Getting Started

### 1. Database Setup

Run the migration script to create required tables:

```bash
# Connect to your PostgreSQL database
psql -d your_database -f server/db/migrations.sql
```

### 2. Environment Variables

Ensure these environment variables are set:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/queryhawk
DEFAULT_DATABASE_URL=postgresql://user:password@localhost:5432/default_db
```

### 3. Start the Application

```bash
# Install dependencies
npm install

# Start both server and client
npm start
```

## 📊 Usage Examples

### Single Query Analysis

1. Navigate to Query Performance → Test Query
2. Enter your SQL query and database connection
3. Click "Fetch Metrics"
4. View enhanced analysis with health cards and cache breakdown

### Query Comparison

1. Run a query to get baseline metrics
2. Make optimizations (add indexes, rewrite query)
3. Run the optimized query
4. Use comparison mode to see improvements

### Historical Analysis

1. View Query History
2. Click "Compare" on any historical query
3. Compare with current query performance
4. Analyze performance trends

## 🔧 API Endpoints

### POST /api/query/analyze

Analyze a single query for performance insights.

**Request:**

```json
{
  "sqlQuery": "SELECT * FROM users WHERE email = 'test@example.com'"
}
```

**Response:**

```json
{
  "analysis": {
    "executionTime": 87,
    "planningTime": 6,
    "totalCost": 123.67,
    "bufferHits": 890,
    "bufferReads": 85,
    "cacheHitRatio": 91
  },
  "insights": {
    "isSlowQuery": false,
    "isBadCache": false,
    "isExpensive": false,
    "recommendations": ["Query performance looks good!"]
  }
}
```

### POST /api/query/compare

Compare two queries for performance differences.

**Request:**

```json
{
  "query1": "SELECT * FROM users WHERE email = 'test@example.com'",
  "query2": "SELECT * FROM users WHERE email = 'test@example.com' AND active = true"
}
```

**Response:**

```json
{
  "before": {
    /* analysis of query1 */
  },
  "after": {
    /* analysis of query2 */
  },
  "improvements": {
    "executionTime": "15.2",
    "cacheHitRatio": "8.5",
    "totalCost": "12.3"
  }
}
```

## 📈 Performance Metrics

### Health Thresholds

- **Execution Time**:

  - 🟢 Good: < 100ms
  - 🟡 Warning: 100-500ms
  - 🔴 Poor: > 500ms

- **Cache Hit Ratio**:

  - 🟢 Good: > 90%
  - 🟡 Warning: 80-90%
  - 🔴 Poor: < 80%

- **Query Cost**:
  - 🟢 Good: < 200
  - 🟡 Warning: 200-500
  - 🔴 Poor: > 500

### Key Metrics Explained

- **Execution Time**: Actual time to execute the query
- **Planning Time**: Time spent planning the query execution
- **Total Cost**: PostgreSQL's cost estimation (lower = better)
- **Buffer Hits**: Number of cache hits (good)
- **Buffer Reads**: Number of disk reads (bad)
- **Cache Hit Ratio**: Percentage of data served from cache

## 🎨 UI Components

### Health Check Cards

- **Speed Card**: Shows execution time with color-coded health
- **Cache Efficiency Card**: Displays cache hit ratio and status
- **Query Cost Card**: Shows cost metrics and optimization status

### Cache Analysis Chart

- **Pie Chart**: Visual breakdown of cache hits vs disk reads
- **Performance Insights**: Actionable recommendations
- **Detailed Metrics**: Additional performance indicators

### Comparison View

- **Bar Chart**: Side-by-side comparison of key metrics
- **Improvement Summary**: Percentage improvements in performance
- **Before/After Analysis**: Clear performance progression

## 🔍 Troubleshooting

### Common Issues

#### "No database connection found for user"

- Ensure the `user_connections` table exists
- Check that users have saved database connections
- Verify `DEFAULT_DATABASE_URL` environment variable

#### "Could not retrieve plan data"

- Verify PostgreSQL EXPLAIN ANALYZE permissions
- Check query syntax
- Ensure database connection is valid

#### Charts not rendering

- Verify `recharts` dependency is installed
- Check browser console for JavaScript errors
- Ensure data is properly formatted

### Performance Tips

- Use indexes on frequently queried columns
- Monitor cache hit ratios for optimization opportunities
- Compare query performance before and after changes
- Use the comparison feature to validate optimizations

## 🚀 Future Enhancements

### Planned Features

- **Execution Plan Visualization**: Tree view of query operations
- **Query Pattern Recognition**: Identify similar query patterns
- **Historical Trending**: Performance over time charts
- **Team Benchmarks**: Compare against team averages

### Advanced Analysis

- **Index Recommendation Engine**: Suggest optimal indexes
- **Query Rewriting**: Automated query optimization suggestions
- **Performance Regression Alerts**: Monitor for performance degradation
- **Integration with Monitoring**: Connect with existing dashboards

## 📚 Additional Resources

- [PostgreSQL EXPLAIN Documentation](https://www.postgresql.org/docs/current/sql-explain.html)
- [Query Performance Tuning Guide](https://www.postgresql.org/docs/current/performance-tips.html)
- [Buffer Cache Management](https://www.postgresql.org/docs/current/runtime-config-resource.html)

## 🤝 Contributing

To contribute to the QueryHawk Lean Query Analyzer:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

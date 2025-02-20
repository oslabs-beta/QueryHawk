import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Box,
  Skeleton,
} from '@mui/material';
import { Storage as DatabaseIcon } from '@mui/icons-material';

//this interface defines a health metric item
//unit and formatter are optional. formatter formats ensures the metric is formatted currently with its unit
interface MetricItem {
  name: string;
  query: string;
  unit?: string;
  formatter?: (value: number) => string;
}

interface DatabaseHealthMetricsProps {
  prometheusUrl: string;
  refreshInterval?: number;
}

//Huge function to display database health metrics fetched from prometheus server
//the first curly brace creates a react component that accepts prometheusurl and refreshinterval as props
//React.FC is function component in typescript...so this little section essentially creates component and say what props it takes
//The next section sets 3 states variables (metrics, loading, error)
//metrics state variable wukk stire the fetched metrics.
//The type annotation record means metrics will be an object. Then the same line specifies that the key will be a string and the value can be either a string or number
//Next, metricItems defines an array of four metrics to fetch. query here is a prometheus query string
//fetchMetrics function actually fetches the four metrics. it does so in parallel with promise.all
const DatabaseHealthMetrics: React.FC<DatabaseHealthMetricsProps> = ({
  prometheusUrl = 'http://localhost:9090',
  refreshInterval = 30000,
}) => {
  const [metrics, setMetrics] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define the metrics to fetch
  const metricItems: MetricItem[] = [
    {
      name: 'Active Connections',
      query: 'sum(pg_stat_activity_count{datname!~"template.*|postgres"})',
    },
    {
      name: 'Cache Hit Ratio',
      query:
        'sum(pg_stat_database_blks_hit) / (sum(pg_stat_database_blks_hit) + sum(pg_stat_database_blks_read)) * 100',
      unit: '%',
      formatter: (value) => value.toFixed(2),
    },
    {
      name: 'Number of Deadlocks',
      query: 'sum(increase(pg_stat_database_deadlocks[1h]))',
    },
    {
      name: 'Disk I/O Operations',
      query:
        'sum(rate(pg_stat_database_blks_read[5m]) + rate(pg_stat_database_blks_written[5m]))',
      unit: 'ops/s',
      formatter: (value) => value.toFixed(2),
    },
  ];

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      //creates empty object to put results, w typescript ensuring key is string and value is string/number
      const results: Record<string, string | number> = {};

      // Uses map() to create an array of promises (one for each metric)
      // Promise.all() runs all these requests in parallel
      // await makes the function wait until all requests complete
      await Promise.all(
        metricItems.map(async (metric) => {
          const url = new URL(`${prometheusUrl}/api/v1/query`);
          url.searchParams.append('query', metric.query);

          const response = await fetch(url.toString());

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          //process and format
          if (data.status === 'success' && data.data.result.length > 0) {
            let value = parseFloat(data.data.result[0].value[1]);

            if (metric.formatter) {
              results[metric.name] = metric.formatter(value);
            } else {
              results[metric.name] = Math.round(value);
            }

            if (metric.unit) {
              results[metric.name] = `${results[metric.name]}${metric.unit}`;
            }
          } else {
            results[metric.name] = 'N/A';
          }
        })
      );
      //update component state with fethed metrics
      setMetrics(results);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to fetch metrics from Prometheus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Set up polling for refreshing metrics
    const intervalId = setInterval(fetchMetrics, refreshInterval);

    return () => clearInterval(intervalId);
  }, [prometheusUrl, refreshInterval]);

  //creates a visual card layout for showing database metrics.
  // The outer structure:
  // <Card> creates a container with border
  // <CardHeader> shows a title "Database Health Metrics" and a database icon
  // <CardContent> holds all the metric displays

  // The metrics display loops through each metric,
  //creates a row for each metric with name : value, value being either the mtric result, 'loading, or 'error'

  // The metric name (like "Active Connections") in a subtitle style
  // If loading: Shows a skeleton loading animation
  // If loaded: Shows the actual value in large, bold text
  // If no value: Shows "N/A"
  return (
    <Card className='p-4'>
      <CardHeader className='pb-2'>
        <h2 className='text-xl font-semibold'>Database Health</h2>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {metricItems.map((metric) => (
            <div key={metric.name} className='flex justify-between'>
              <span className='font-medium'>{metric.name}:</span>
              <span>
                {loading ? 'Loading...' : metrics[metric.name] || 'N/A'}
              </span>
            </div>
          ))}
        </div>
        {error && <div className='text-red-500 mt-2'>{error}</div>}
      </CardContent>
    </Card>
  );
};

export default DatabaseHealthMetrics;

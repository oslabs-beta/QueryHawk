// Import core OpenTelemetry packages
import { NodeSDK } from '@opentelemetry/sdk-node'; // Main SDK for Node.js applications
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'; // Automatic instrumentation for Node.js libraries
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'; // Exports traces to a collector (Grafana Alloy)
import { Resource } from '@opentelemetry/resources'; // Adds context/metadata to your traces
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'; // Standard naming for resource attributes
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'; // Processes and exports spans as they are ended

const serviceName = process.env.OTEL_SERVICE_NAME || 'queryhawk-backend';
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
  'http://grafana-alloy:14318/v1/traces';

// Initialize the OpenTelemetry SDK
const sdk = new NodeSDK({
  // Resource: Identifies your application in the traces
  resource: new Resource({
    // SERVICE_NAME: How your app will appear in Jaeger UI
    [ATTR_SERVICE_NAME]: serviceName,
    // SERVICE_VERSION: Helps track which version generated the traces
    [ATTR_SERVICE_VERSION]: serviceVersion,
    // Custom attribute to distinguish development from production
    environment: process.env.NODE_ENV || 'development',
  }),

  // Span Processor: Handles each span (trace segment) as it's completed
  // SimpleSpanProcessor: Exports spans immediately (good for development)
  // For production, consider BatchSpanProcessor instead
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: otlpEndpoint,
    }),
  ),

  // Auto-instrumentations: Automatically traces common Node.js libraries
  instrumentations: [
    getNodeAutoInstrumentations({
      // Express spans capture route + middleware latency for request lifecycles.
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      // HTTP spans capture inbound/outbound calls and propagate context.
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      // PostgreSQL spans capture query timing for DB performance analysis.
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
    }),
  ],
});

// Start the SDK
sdk.start();

// shutdown handler
// ensures all pending traces are exported before app exits
const shutdownTracing = () => {
  sdk
    .shutdown()
    .catch(() => undefined)
    .finally(() => process.exit(0));
};

process.on('SIGTERM', shutdownTracing);
process.on('SIGINT', shutdownTracing);
export default sdk;

//OpenTelemetry collects 3 types of monitoring data:
//1. Traces - following requests through the system
//2. Metrics - numbers about how your system is performing
//3.Logs - detailed records of what happened
//Example:
// const sdk = new NodeSDK({
//     // Who am I? - Identifies your application
//     resource: new Resource({...}),

//     // Where to send traces? - Points to Jaeger
//     traceExporter: new OTLPTraceExporter({...}),

//     // How to process traces? - Handles each piece of trace data
//     spanProcessor: new SimpleSpanProcessor(...),

//     // What to trace automatically? - Sets up automatic tracking
//     instrumentations: [...]
// });

//the flow is:
// Your App (tracing.ts)
//     → OpenTelemetry Collector (otel-config.yml)
//         → Jaeger (for traces)
//         → Prometheus (for metrics)

// Import core OpenTelemetry packages
import { NodeSDK } from '@opentelemetry/sdk-node'; // Main SDK for Node.js applications
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'; // Automatic instrumentation for Node.js libraries
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'; // Exports traces to your collector (Jaeger in our case)
import { Resource } from '@opentelemetry/resources'; // Adds context/metadata to your traces
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'; // Standard naming for resource attributes
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'; // Processes and exports spans as they are ended

// Initialize the OpenTelemetry SDK
const sdk = new NodeSDK({
  // Resource: Identifies your application in the traces
  resource: new Resource({
    // SERVICE_NAME: How your app will appear in Jaeger UI
    [ATTR_SERVICE_NAME]: 'sql-optimizer',
    // SERVICE_VERSION: Helps track which version generated the traces
    [ATTR_SERVICE_VERSION]: '1.0.0',
    // Custom attribute to distinguish development from production
    environment: 'development',
  }),

  // Trace Exporter: Configures where to send the traces
  // In this case, sending to big Docker file, specifically to otel-collector service which represents opentelemetry
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces', // Points to Docker service
  }),

  // Span Processor: Handles each span (trace segment) as it's completed
  // SimpleSpanProcessor: Exports spans immediately (good for development)
  // For production, consider BatchSpanProcessor instead
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),

  // Auto-instrumentations: Automatically traces common Node.js libraries
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable Express instrumentation to track:
      // - Route handling
      // - Middleware execution
      // - Response time
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      // Enable HTTP instrumentation to track:
      // - Incoming requests
      // - Outgoing requests
      // - Response status
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
    }),
  ],
});

// Start the SDK and log status
sdk.start();
console.log('Tracing initialized');

// shutdown handler
// ensures all pending traces are exported before app exits
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
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

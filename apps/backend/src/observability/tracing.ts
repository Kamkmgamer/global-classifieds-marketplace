import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

let sdk: NodeSDK | null = null;

export function initTracing() {
  const enabled = (process.env.OTEL_ENABLED || '').toLowerCase() === 'true';
  if (!enabled) return null;

  if (sdk) return sdk;

  const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  const headers = process.env.OTEL_EXPORTER_OTLP_HEADERS || '';

  const exporter = new OTLPTraceExporter({
    url: `${exporterEndpoint.replace(/\/$/, '')}/v1/traces`,
    headers: headers
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, kv) => {
        const [k, v] = kv.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {}),
  });

  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: getNodeAutoInstrumentations({}),
  });

  // Start without awaiting and without chaining catch to satisfy TS types
  try {
    sdk.start();
  } catch (err: any) {
     
    console.warn('[otel] Failed to start tracing:', err?.message || err);
  }

  return sdk;
}

export async function shutdownTracing() {
  try {
    await sdk?.shutdown();
  } catch (e) {
     
    console.warn('[otel] Failed to shutdown tracing:', (e as Error)?.message || e);
  } finally {
    sdk = null;
  }
}

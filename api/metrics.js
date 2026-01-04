const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Create HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

register.registerMetric(httpRequestDuration);

// Middleware to measure request duration
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    // Use route path if available, otherwise use request path
    const route = req.route ? req.route.path : req.path;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: route || 'unknown',
        status_code: res.statusCode
      },
      duration
    );
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  httpRequestDuration
};


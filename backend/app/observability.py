"""
Observability module for OneRouter API.
Provides structured logging, distributed tracing, and metrics collection.
"""

import logging
import sys
import time
from typing import Optional, Dict, Any
from datetime import datetime
from contextlib import contextmanager
from pythonjsonlogger import jsonlogger
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

from .config import settings


# =============================================================================
# STRUCTURED LOGGING
# =============================================================================

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional context fields."""

    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)

        # Add standard fields
        log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['environment'] = settings.ENVIRONMENT
        log_record['service'] = 'onerouter-api'

        # Add trace context if available
        if hasattr(record, 'trace_id'):
            log_record['trace_id'] = record.trace_id
        if hasattr(record, 'span_id'):
            log_record['span_id'] = record.span_id
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id

        # Add user context if available
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        if hasattr(record, 'api_key_id'):
            log_record['api_key_id'] = record.api_key_id


def setup_structured_logging(log_level: str = "INFO") -> logging.Logger:
    """
    Configure structured JSON logging for the application.

    Returns the root logger configured with JSON formatting.
    """
    # Get log level from settings or parameter
    level = getattr(logging, settings.LOG_LEVEL if hasattr(settings, 'LOG_LEVEL') else log_level)

    # Create JSON formatter
    formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers
    root_logger.handlers = []

    # Add JSON handler for stdout
    json_handler = logging.StreamHandler(sys.stdout)
    json_handler.setFormatter(formatter)
    root_logger.addHandler(json_handler)

    # Reduce noise from third-party libraries
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)

    return root_logger


class LoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that adds request context to all log messages."""

    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        # Add extra context to the log record
        extra = kwargs.get('extra', {})
        extra.update(self.extra)
        kwargs['extra'] = extra
        return msg, kwargs


def get_logger(name: str, **context) -> LoggerAdapter:
    """
    Get a logger with optional context.

    Usage:
        logger = get_logger(__name__, request_id="abc-123", user_id="user-456")
        logger.info("Processing payment", extra={"amount": 100})
    """
    base_logger = logging.getLogger(name)
    return LoggerAdapter(base_logger, context)


# =============================================================================
# PROMETHEUS METRICS
# =============================================================================

# Request metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

REQUESTS_IN_PROGRESS = Gauge(
    'http_requests_in_progress',
    'Number of HTTP requests currently being processed',
    ['method', 'endpoint']
)

# Business metrics
API_CALLS_TOTAL = Counter(
    'onerouter_api_calls_total',
    'Total API calls through OneRouter',
    ['service', 'endpoint', 'environment', 'status']
)

CREDITS_CONSUMED = Counter(
    'onerouter_credits_consumed_total',
    'Total credits consumed',
    ['service', 'action']
)

CREDITS_BALANCE = Gauge(
    'onerouter_credits_balance',
    'Current credit balance by user',
    ['user_id']
)

PAYMENT_AMOUNT = Counter(
    'onerouter_payment_amount_total',
    'Total payment amounts processed',
    ['provider', 'currency', 'status']
)

# Provider metrics
PROVIDER_REQUESTS = Counter(
    'onerouter_provider_requests_total',
    'Total requests to external providers',
    ['provider', 'endpoint', 'status']
)

PROVIDER_LATENCY = Histogram(
    'onerouter_provider_latency_seconds',
    'External provider request latency',
    ['provider', 'endpoint'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

# Error metrics
ERRORS_TOTAL = Counter(
    'onerouter_errors_total',
    'Total errors by type',
    ['error_type', 'service']
)

# Database metrics
DB_QUERY_DURATION = Histogram(
    'onerouter_db_query_duration_seconds',
    'Database query duration',
    ['operation'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

DB_CONNECTIONS_ACTIVE = Gauge(
    'onerouter_db_connections_active',
    'Active database connections'
)

# Redis metrics
REDIS_OPERATIONS = Counter(
    'onerouter_redis_operations_total',
    'Total Redis operations',
    ['operation', 'status']
)

CACHE_HIT_RATE = Gauge(
    'onerouter_cache_hit_rate',
    'Cache hit rate percentage'
)


def get_metrics() -> bytes:
    """Generate Prometheus metrics output."""
    return generate_latest()


def get_metrics_content_type() -> str:
    """Get the content type for Prometheus metrics."""
    return CONTENT_TYPE_LATEST


# =============================================================================
# DISTRIBUTED TRACING (OpenTelemetry)
# =============================================================================

_tracer = None
_meter = None


def setup_opentelemetry():
    """
    Configure OpenTelemetry for distributed tracing.
    Integrates with Sentry if SENTRY_DSN is configured.
    """
    global _tracer, _meter

    from opentelemetry import trace, metrics
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    from opentelemetry.instrumentation.redis import RedisInstrumentor
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

    # Create resource with service info
    resource = Resource.create({
        SERVICE_NAME: "onerouter-api",
        SERVICE_VERSION: "1.0.0",
        "environment": settings.ENVIRONMENT,
    })

    # Set up tracer provider
    tracer_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer_provider)

    # Set up meter provider
    meter_provider = MeterProvider(resource=resource)
    metrics.set_meter_provider(meter_provider)

    # Get tracer and meter
    _tracer = trace.get_tracer("onerouter")
    _meter = metrics.get_meter("onerouter")

    # Auto-instrument libraries
    FastAPIInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument()
    RedisInstrumentor().instrument()
    HTTPXClientInstrumentor().instrument()

    return _tracer


def get_tracer():
    """Get the OpenTelemetry tracer."""
    global _tracer
    if _tracer is None:
        from opentelemetry import trace
        _tracer = trace.get_tracer("onerouter")
    return _tracer


@contextmanager
def trace_span(name: str, attributes: Optional[Dict[str, Any]] = None):
    """
    Context manager for creating a trace span.

    Usage:
        with trace_span("process_payment", {"amount": 100, "provider": "razorpay"}):
            # ... processing code ...
    """
    tracer = get_tracer()
    with tracer.start_as_current_span(name) as span:
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, str(value))
        try:
            yield span
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            raise


# =============================================================================
# TIMING UTILITIES
# =============================================================================

@contextmanager
def timed_operation(histogram: Histogram, labels: Dict[str, str]):
    """
    Context manager for timing operations and recording to Prometheus.

    Usage:
        with timed_operation(PROVIDER_LATENCY, {"provider": "razorpay", "endpoint": "orders"}):
            response = await client.create_order(...)
    """
    start_time = time.perf_counter()
    try:
        yield
    finally:
        duration = time.perf_counter() - start_time
        histogram.labels(**labels).observe(duration)


def record_request_metrics(method: str, endpoint: str, status_code: int, duration: float):
    """Record HTTP request metrics."""
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)


def record_api_call(service: str, endpoint: str, environment: str, status: str):
    """Record an API call through OneRouter."""
    API_CALLS_TOTAL.labels(
        service=service,
        endpoint=endpoint,
        environment=environment,
        status=status
    ).inc()


def record_provider_request(provider: str, endpoint: str, status: str, duration: float):
    """Record a request to an external provider."""
    PROVIDER_REQUESTS.labels(provider=provider, endpoint=endpoint, status=status).inc()
    PROVIDER_LATENCY.labels(provider=provider, endpoint=endpoint).observe(duration)


def record_error(error_type: str, service: str = "unknown"):
    """Record an error occurrence."""
    ERRORS_TOTAL.labels(error_type=error_type, service=service).inc()


def record_credits_consumed(service: str, action: str, amount: int = 1):
    """Record credits consumed."""
    CREDITS_CONSUMED.labels(service=service, action=action).inc(amount)

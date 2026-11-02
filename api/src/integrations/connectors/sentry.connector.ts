const SENTRY_DSN_PATTERN = /^https:\/\/[^@]+@[^/]*\.ingest\.sentry\.io\/.+$/;

export function testSentry(dsn: string): { success: boolean; message: string } {
  if (SENTRY_DSN_PATTERN.test(dsn)) {
    return { success: true, message: 'Sentry DSN format is valid' };
  }

  return {
    success: false,
    message:
      'Invalid Sentry DSN format (expected: https://...@....ingest.sentry.io/...)',
  };
}

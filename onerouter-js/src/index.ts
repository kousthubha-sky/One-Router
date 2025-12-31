import { OneRouter } from './client';

// Re-export types for convenience
export * from './types';

// Create client instance
const client = new OneRouter({ apiKey: 'unf_live_xxx' });

// Re-export everything for convenience
export * from './client';
export * from './types';

export default client;
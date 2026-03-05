
// Centralized Type Exports

// Primitives
export * from './shared';

// Domain Models (Frontend Application Models)
export * from './models/City';
export * from './models/Sponsor';
export * from './models/Media';
export * from './models/Itinerary';
export * from './models/Social';

// Legacy/External Users
export * from './users';

// Database & Domain Types
export * from './database'; // Legacy bridge
export * from './domain/index'; // New clean domain types

export * from './core';

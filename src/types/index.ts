/**
 * @file src/types/index.ts
 * @description Centralized barrel file for exporting all application types.
 * 
 * This file aggregates and re-exports types from various modules,
 * making them easily accessible throughout the application via a single import path.
 */

// Shared primitives & enums
export * from './shared';

// Core application models
export * from './models/City';
export * from './models/Sponsor';
export * from './models/Media';
export * from './models/Itinerary';
export * from './models/Social';

// Marketing & Pricing Configuration
export * from './marketing';

// User-related types
export * from './users';

// Supabase-generated and domain-specific types
export * from './database'; 
export * from './domain/index'; 

// Core system types
export * from './core';
export * from './designSystem';

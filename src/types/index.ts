/**
 * @file src/types/index.ts
 * @description Centralized barrel file for exporting all application types.
 *
 * This file aggregates and re-exports types from various modules,
 * making them easily accessible throughout the application via a single import path.
 */

// Core system types
export * from './core';
// Supabase-generated and domain-specific types
export * from './database';
export * from './designSystem';
export * from './domain/index';
// Marketing & Pricing Configuration
export * from './marketing';
export type { ModalPropsBag } from './modalProps';
// Core application models
export * from './models/City';
export * from './models/DiaryNotes';
export * from './models/Itinerary';
export * from './models/Media';
export * from './models/Social';
export * from './models/Sponsor';
export * from './models/Viaggio';
export type { NavigationGlobalExtra } from './navigationGlobal';
export type { NavigationPreviewCategory, NavigationPreviewState } from './navigationPreview';
export { CLOSED_NAVIGATION_PREVIEW } from './navigationPreview';

// Navigation shell types (routing / preview / global handlers)
export type { NavigationViewMode } from './navigationViewMode';
export * from './partners';
// Shared primitives & enums
export * from './shared';
// User-related types
export * from './users';

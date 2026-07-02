/** API pubblica del motore collaborativo (Fase 2+). */
export * from '@/domain/collaboration';
export * from '@/services/collaboration';
export {
  requestCollaborationAuth,
  isGuestUser,
  COLLABORATION_RETURN_TO,
  type CollaborationIntent,
} from './guestGate';
export { UsernameRequiredGate } from './UsernameRequiredGate';

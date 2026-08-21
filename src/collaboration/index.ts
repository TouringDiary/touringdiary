/** API pubblica del motore collaborativo (Fase 2+). */
export * from '@/domain/collaboration';
export * from '@/services/collaboration';
export {
  COLLABORATION_RETURN_TO,
  type CollaborationIntent,
  isGuestUser,
  requestCollaborationAuth,
} from './guestGate';
export { UsernameRequiredGate } from './UsernameRequiredGate';

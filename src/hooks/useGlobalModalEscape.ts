/**
 * useGlobalModalEscape
 *
 * Registers an ESC close handler in the shared LIFO stack managed by useCloseOnEscape.
 * Only the topmost registered handler fires — nested/stacked modals do not cascade.
 *
 * Previously this hook added an independent window listener per component, causing all
 * open modals to respond to a single ESC press. This is the architectural fix.
 *
 * The `e` parameter on onClose is kept for API compatibility but is never passed;
 * preventDefault/stopPropagation are handled by useCloseOnEscape before the callback fires.
 */
import { useCloseOnEscape } from './useCloseOnEscape';

export function useGlobalModalEscape(isOpen: boolean, onClose: (e?: KeyboardEvent) => void) {
    useCloseOnEscape(() => onClose(), isOpen);
}

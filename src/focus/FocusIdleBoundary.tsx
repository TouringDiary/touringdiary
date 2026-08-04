import React, { Component, type ReactNode } from 'react';
import {
  workspaceUsesCompanionPortal,
  type FocusSurface,
} from './focusModeRegistry';
import { useFocusMode } from './FocusModeContext';

interface FocusIdleBoundaryProps {
  /** Semantic surface from Focus Mode Registry (SoT). */
  surface: FocusSurface;
  children: ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

/**
 * IdleGate — when `idle` is true, skip React updates (keep last committed tree).
 * Visual/pointer blocking for workspace is owned by FocusOverlay (workspaceDim);
 * this gate only stops wasted reconciliation under the dim.
 *
 * Update matrix (identical to `if (nextProps.idle) return false; return true`):
 * - → idle true  (enter or stay): return false — ignore children churn while frozen
 * - → idle false (leave or stay active): return true — accept latest children
 *
 * Intentionally keyed only on `nextProps.idle` (not prev idle / children identity).
 */
class IdleGate extends Component<{ idle: boolean; children: ReactNode }> {
  override shouldComponentUpdate(nextProps: { idle: boolean; children: ReactNode }): boolean {
    return !nextProps.idle;
  }

  override render(): ReactNode {
    return this.props.children;
  }
}

/**
 * FocusIdleBoundary — applies Focus Mode surface policy under workspace focus.
 *
 * - Freezes React updates for non-interactive surfaces (`baseContent` / `dimmedBackground`)
 *   while `mode === 'workspace'`.
 * - Sets `inert` so the frozen tree cannot receive focus/pointer (complements dim click-to-close).
 * - Does **not** freeze the sidebar tree when the active workspace uses companion portal
 *   (Valigia): companion diary must stay live above `workspaceDim`.
 * - Does **not** alter z-index tokens or FocusOverlay.
 */
export function FocusIdleBoundary({
  surface,
  children,
  className,
  id,
  style,
}: FocusIdleBoundaryProps) {
  const { getPolicy, isWorkspace, workspaceId } = useFocusMode();
  const policy = getPolicy(surface);

  const companionMustStayLive =
    surface === 'baseContent' &&
    isWorkspace &&
    workspaceUsesCompanionPortal(workspaceId);

  const idle =
    isWorkspace && !policy.interactive && !companionMustStayLive;

  return (
    <div
      id={id}
      className={className}
      style={style}
      // React 19 / DOM: boolean inert removes the subtree from hit-testing & focus.
      inert={idle ? true : undefined}
      aria-hidden={idle ? true : undefined}
      data-focus-idle={idle ? 'true' : undefined}
    >
      <IdleGate idle={idle}>{children}</IdleGate>
    </div>
  );
}

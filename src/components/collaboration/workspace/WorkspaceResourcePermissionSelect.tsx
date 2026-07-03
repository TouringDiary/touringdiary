import React from 'react';
import type { WorkspaceResourceAccess } from '@/domain/collaboration';
import { isWorkspaceResourceAccess, WORKSPACE_RESOURCE_ACCESS_LEVELS } from '@/domain/collaboration';
import { WORKSPACE_ACCESS_LABELS } from './workspacePresentation';

interface Props {
  value: WorkspaceResourceAccess;
  onChange: (value: WorkspaceResourceAccess) => void;
  disabled?: boolean;
  className?: string;
}

export const WorkspaceResourcePermissionSelect: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(e) => {
      const { value } = e.target;
      if (isWorkspaceResourceAccess(value)) {
        onChange(value);
      }
    }}
    className={`rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white ${className}`}
  >
    {WORKSPACE_RESOURCE_ACCESS_LEVELS.map((level) => (
      <option key={level} value={level}>
        {WORKSPACE_ACCESS_LABELS[level]}
      </option>
    ))}
  </select>
);

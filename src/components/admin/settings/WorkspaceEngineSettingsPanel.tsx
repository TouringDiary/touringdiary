import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import { SETTINGS_KEYS } from '@/services/settingsService';
import type { WorkspaceAdminConfigBundle } from '@/domain/collaboration/workspaceEngineConfig';
import {
  resolveWorkspaceAdminConfigBundle,
  serializeCollaborationLiveConfig,
  serializeStorageLimits,
  serializeWorkspaceEngineConfig,
} from '@/services/collaboration/workspaceEngineConfigService';
import { SHARED_RESOURCE_KINDS } from '@/domain/collaboration';
import { getSharedResourceKindLabel } from '@/domain/collaboration';

interface Props {
  onSaveSuccess: () => void;
}

export const WorkspaceEngineSettingsPanel: React.FC<Props> = ({ onSaveSuccess }) => {
  const { updateMultipleSettings } = useConfig();
  const [form, setForm] = useState<WorkspaceAdminConfigBundle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(resolveWorkspaceAdminConfigBundle());
  }, []);

  if (!form) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-6">
        <Loader2 className="w-5 h-5 animate-spin" />
        Caricamento configurazione Workspace...
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateMultipleSettings([
        {
          key: SETTINGS_KEYS.WORKSPACE_ENGINE_CONFIG,
          value: serializeWorkspaceEngineConfig(form.engine),
        },
        {
          key: SETTINGS_KEYS.COLLABORATION_LIVE_CONFIG,
          value: serializeCollaborationLiveConfig(form.live),
        },
        {
          key: SETTINGS_KEYS.STORAGE_LIMITS,
          value: serializeStorageLimits(form.storage),
        },
      ]);
      onSaveSuccess();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Salvataggio non riuscito.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-8">
      <div>
        <h3 className="text-lg font-bold text-white">Motore Workspace e Collaborazione</h3>
        <p className="text-sm text-slate-400 mt-1">
          Governance globale del sistema collaborativo. Non gestisce permessi sulle singole risorse.
        </p>
      </div>

      <section className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Generale</h4>
        <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-800">
          <div>
            <p className="text-sm font-semibold text-white">Collaborazione attiva</p>
            <p className="text-xs text-slate-500">Disabilita globalmente wizard, inviti e workspace.</p>
          </div>
          <input
            type="checkbox"
            checked={form.engine.collaborationEnabled}
            onChange={(e) =>
              setForm({
                ...form,
                engine: { ...form.engine, collaborationEnabled: e.target.checked },
              })
            }
          />
        </label>
        <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-800">
          <div>
            <p className="text-sm font-semibold text-white">Presenza live</p>
            <p className="text-xs text-slate-500">Indicatori presenza e stato modifica in tempo reale.</p>
          </div>
          <input
            type="checkbox"
            checked={form.engine.livePresenceEnabled}
            onChange={(e) =>
              setForm({
                ...form,
                engine: { ...form.engine, livePresenceEnabled: e.target.checked },
              })
            }
          />
        </label>
      </section>

      <section className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Lock collaborativo</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Timeout lock (minuti)</span>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.live.editLockTimeoutMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  live: { ...form.live, editLockTimeoutMinutes: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Heartbeat lock (secondi)</span>
            <input
              type="number"
              min={5}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.live.editLockHeartbeatSeconds}
              onChange={(e) =>
                setForm({
                  ...form,
                  live: { ...form.live, editLockHeartbeatSeconds: Number(e.target.value) },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Shared Resource Kind abilitati</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SHARED_RESOURCE_KINDS.map((kind) => {
            const enabled = form.engine.enabledSharedResourceKinds.includes(kind);
            return (
              <label
                key={kind}
                className="flex items-center gap-2 p-3 rounded-lg border border-slate-800 text-sm text-white"
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...form.engine.enabledSharedResourceKinds, kind]
                      : form.engine.enabledSharedResourceKinds.filter((k) => k !== kind);
                    setForm({
                      ...form,
                      engine: { ...form.engine, enabledSharedResourceKinds: next },
                    });
                  }}
                />
                {getSharedResourceKindLabel(kind)}
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Categorie notifiche (default globali)</h4>
        {(
          [
            ['invites', 'Inviti'],
            ['resource_updates', 'Aggiornamenti risorse'],
            ['workspace_updates', 'Aggiornamenti workspace'],
            ['friend_requests', 'Richieste di amicizia'],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-800"
          >
            <span className="text-sm text-white">{label}</span>
            <input
              type="checkbox"
              checked={form.engine.notificationCategories[key]}
              onChange={(e) =>
                setForm({
                  ...form,
                  engine: {
                    ...form.engine,
                    notificationCategories: {
                      ...form.engine.notificationCategories,
                      [key]: e.target.checked,
                    },
                  },
                })
              }
            />
          </label>
        ))}
      </section>

      <section className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Limiti storage allegati</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Max file (byte)</span>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.storage.maxAttachmentBytes}
              onChange={(e) =>
                setForm({
                  ...form,
                  storage: { ...form.storage, maxAttachmentBytes: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Max workspace (byte)</span>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.storage.maxWorkspaceBytes}
              onChange={(e) =>
                setForm({
                  ...form,
                  storage: { ...form.storage, maxWorkspaceBytes: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Max account (byte)</span>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.storage.maxAccountBytes}
              onChange={(e) =>
                setForm({
                  ...form,
                  storage: { ...form.storage, maxAccountBytes: Number(e.target.value) },
                })
              }
            />
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salva configurazione Workspace
      </button>
    </div>
  );
};

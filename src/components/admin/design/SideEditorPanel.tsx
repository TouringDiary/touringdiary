import { ArrowLeft, Loader2, Monitor, Save, Smartphone, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Z_ADMIN_MODAL } from '@/constants/zIndex';
import type { StyleRule } from '@/types/designSystem';
import ComponentPreviewHost from './ComponentPreviewHost';
import { getFoundationPreviewMeta } from './foundation/foundationPreviewMeta';
import StyleEditor from './StyleEditor';

export class DesignEditorBoundary extends React.Component<
  { children: React.ReactNode; label: string },
  { error: Error | null }
> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[DesignEditorBoundary "${this.props.label}"] CRASH:`, error.message);
    console.error(`[DesignEditorBoundary "${this.props.label}"] Stack:`, error.stack);
    console.error(
      `[DesignEditorBoundary "${this.props.label}"] Component tree:`,
      info.componentStack,
    );
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="p-4 m-2 bg-red-950 border border-red-500 rounded-lg text-xs font-mono overflow-auto max-h-48">
          <p className="text-red-400 font-bold mb-1">⚠ CRASH [{this.props.label}]</p>
          <p className="text-red-300">{this.state.error.message}</p>
          <pre className="text-red-500 mt-2 text-[10px] whitespace-pre-wrap leading-tight">
            {this.state.error.stack?.split('\n').slice(0, 6).join('\n')}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface SideEditorPanelProps {
  baseKey: string;
  desktopRule: StyleRule;
  mobileRule: StyleRule | null;
  editedRules: Record<string, StyleRule> | null;
  isSaving: boolean;
  onRuleChange: (ruleKey: string, updatedRule: StyleRule) => void;
  onClose: () => void;
  onSave: (rule: StyleRule) => void;
}

export const SideEditorPanel: React.FC<SideEditorPanelProps> = ({
  baseKey,
  desktopRule,
  mobileRule,
  editedRules,
  onRuleChange,
  onClose,
  onSave,
  isSaving,
}) => {
  const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('desktop');

  const activeRuleKey = deviceView === 'mobile' ? `${baseKey}_mobile` : baseKey;

  const resolveRule = useCallback(
    (view: 'mobile' | 'desktop'): StyleRule | null => {
      const key = view === 'mobile' ? `${baseKey}_mobile` : baseKey;
      if (editedRules?.[key]) return editedRules[key];
      return view === 'mobile' ? mobileRule : desktopRule;
    },
    [baseKey, desktopRule, editedRules, mobileRule],
  );

  const [localRule, setLocalRule] = useState<StyleRule | null>(() => resolveRule('desktop'));

  useEffect(() => {
    setLocalRule(resolveRule(deviceView));
  }, [deviceView, resolveRule]);

  const handleSyncAndSave = () => {
    if (localRule) {
      onRuleChange(activeRuleKey, localRule);
      onSave(localRule);
    }
  };

  if (!localRule) {
    return null;
  }

  const isMobile = deviceView === 'mobile';
  const canEditMobile = Boolean(mobileRule || editedRules?.[`${baseKey}_mobile`]);
  const previewMeta =
    (localRule.section?.trim() ?? '') === 'foundation'
      ? getFoundationPreviewMeta(baseKey)
      : undefined;

  return createPortal(
    <>
      {/* Backdrop come controllo esplicito (button), non div statico con onClick */}
      <button
        type="button"
        className="fixed inset-0 bg-black/60 border-0 p-0 cursor-default"
        style={{ zIndex: Z_ADMIN_MODAL - 100 }}
        onClick={onClose}
        aria-label="Chiudi editor design"
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl transform transition-transform ease-in-out duration-300 translate-x-0"
        style={{ zIndex: Z_ADMIN_MODAL }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <button type="button" onClick={onClose} className="text-slate-300 hover:text-white">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {localRule.element_name}
                <span className="ml-2 text-xs font-normal text-slate-400 uppercase tracking-wider">
                  {deviceView}
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => canEditMobile && setDeviceView('mobile')}
                disabled={!canEditMobile}
                title={canEditMobile ? 'Modifica stile mobile' : 'Regola mobile non disponibile'}
                className={`p-2 rounded-md ${deviceView === 'mobile' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <Smartphone size={20} />
              </button>
              <button
                type="button"
                onClick={() => setDeviceView('desktop')}
                className={`p-2 rounded-md ${deviceView === 'desktop' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'}`}
              >
                <Monitor size={20} />
              </button>
            </div>
          </div>

          <div className="p-8 bg-slate-900 flex-grow flex items-center justify-center border-b border-slate-800">
            <div className="border border-slate-700 rounded-lg bg-slate-800">
              <DesignEditorBoundary label={`Preview:${baseKey}`}>
                <ComponentPreviewHost
                  rule={localRule}
                  componentKey={activeRuleKey}
                  isLarge={true}
                  isMobile={isMobile}
                  meta={previewMeta}
                />
              </DesignEditorBoundary>
            </div>
          </div>

          <div
            className="flex-shrink-0 p-6 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 320px)' }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">Editor Proprietà CSS</h3>
            <DesignEditorBoundary label={`StyleEditor:${baseKey}`}>
              <StyleEditor rule={localRule} onChange={setLocalRule} />
            </DesignEditorBoundary>
          </div>

          <div className="mt-auto p-4 bg-slate-900/80 border-t border-slate-800 backdrop-blur-sm flex justify-end items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <X size={18} /> Annulla
            </button>
            <button
              type="button"
              onClick={handleSyncAndSave}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? 'Salvataggio...' : 'Salva e Chiudi'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

import React, { useEffect, useRef } from 'react';
import { Extension } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-list';
import { DiaryNotesTaskItem } from './diaryNotesTaskItem';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import type { DiaryNotesDocument } from '@/types/models/DiaryNotes';
import { isDiaryNotesDocument, normalizeDiaryNotes } from '@/types/models/DiaryNotes';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';
import { DiaryNotesToolbar } from './DiaryNotesToolbar';
import { DiaryNotesLinkBubbleMenu } from './DiaryNotesLinkBubbleMenu';
import {
  createDiaryNotesLinkClickPlugin,
  dismissDiaryNotesLinkUi,
  restoreDiaryNotesEditorInputMode,
} from './diaryNotesLinkUtils';
import './diaryNotesEditor.css';

const DiaryNotesLinkInteraction = Extension.create({
  name: 'diaryNotesLinkInteraction',
  addProseMirrorPlugins() {
    return [createDiaryNotesLinkClickPlugin()];
  },
});

export const DIARY_NOTES_PLACEHOLDER =
  'Scrivi qui appunti, promemoria e tutto ciò che vuoi ricordare del tuo viaggio.';

export interface DiaryNotesEditorProps {
  document: DiaryNotesDocument | null | undefined;
  onDocumentChange: (document: DiaryNotesDocument) => void;
  isActive?: boolean;
}

export const DiaryNotesEditor: React.FC<DiaryNotesEditorProps> = React.memo(({
  document,
  onDocumentChange,
  isActive = true,
}) => {
  const hadEditorFocusRef = useRef(false);
  const hasInitialFocusedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        undoRedo: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        enableClickSelection: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: DIARY_NOTES_PLACEHOLDER,
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList,
      DiaryNotesTaskItem.configure({
        nested: false,
        a11y: {
          checkboxLabel: (node, checked) => {
            const text = node.textContent?.trim();
            const state = checked ? 'completata' : 'da completare';
            return text ? `Attività ${state}: ${text}` : `Attività ${state}`;
          },
        },
      }),
      DiaryNotesLinkInteraction,
    ],
    content: normalizeDiaryNotes(document),
    editorProps: {
      attributes: {
        class: 'diary-notes-prosemirror',
        spellcheck: 'true',
        'aria-label': 'Contenuto note di viaggio',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON();
      if (!isDiaryNotesDocument(json)) return;
      onDocumentChange(json);
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const next = normalizeDiaryNotes(document);
    if (snapshotsEqual(editor.getJSON(), next)) return;

    const hadFocus = editor.isFocused;

    // Cambio tab / sync esterna: emitUpdate: false evita onUpdate ridondanti verso il parent.
    // undoRedo è disabilitato nello StarterKit → nessuna history interna Tiptap da gestire.
    editor.commands.setContent(next, { emitUpdate: false });
    dismissDiaryNotesLinkUi(editor);

    // Cursore e selezione intenzionali: se l'utente stava scrivendo, focus a fine documento;
    // altrimenti il dismiss sopra ha già azzerato selezione e chiuso il BubbleMenu link.
    if (hadFocus && isActive) {
      editor.commands.focus('end', { scrollIntoView: false });
    }

    hasInitialFocusedRef.current = false;
  }, [document, editor, isActive]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (!isActive) {
      hadEditorFocusRef.current = editor.isFocused;
      dismissDiaryNotesLinkUi(editor);
      return;
    }

    const frameId = requestAnimationFrame(() => {
      if (!editor || editor.isDestroyed) return;

      if (hadEditorFocusRef.current) {
        editor.commands.focus(undefined, { scrollIntoView: false });
        return;
      }

      if (!hasInitialFocusedRef.current && editor.isEmpty) {
        editor.commands.focus('end', { scrollIntoView: false });
        hasInitialFocusedRef.current = true;
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isActive, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const syncLinkTitles = () => {
      editor.view.dom.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (href) anchor.setAttribute('title', href);
      });
    };

    const syncLinkUiState = () => {
      syncLinkTitles();
      if (!editor.isActive('link')) {
        restoreDiaryNotesEditorInputMode(editor);
      }
    };

    editor.on('update', syncLinkUiState);
    editor.on('selectionUpdate', syncLinkUiState);
    syncLinkUiState();

    return () => {
      editor.off('update', syncLinkUiState);
      editor.off('selectionUpdate', syncLinkUiState);
    };
  }, [editor]);

  return (
    <div className="diary-notes-editor flex flex-col flex-1 min-h-0" data-diary-notes-editor>
      <DiaryNotesToolbar editor={editor} />
      {editor && !editor.isDestroyed && <DiaryNotesLinkBubbleMenu editor={editor} />}
      <EditorContent editor={editor} className="diary-notes-editor-content flex-1 min-h-0" />
    </div>
  );
});

DiaryNotesEditor.displayName = 'DiaryNotesEditor';

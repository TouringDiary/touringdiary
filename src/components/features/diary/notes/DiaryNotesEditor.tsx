import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import type { DiaryNotesDocument } from '@/types/models/DiaryNotes';
import { isDiaryNotesDocument, normalizeDiaryNotes } from '@/types/models/DiaryNotes';
import { snapshotsEqual } from '@/domain/save/documentSnapshot';
import { DiaryNotesToolbar } from './DiaryNotesToolbar';
import './diaryNotesEditor.css';

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
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: DIARY_NOTES_PLACEHOLDER,
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList,
      TaskItem.configure({
        nested: false,
        a11y: {
          checkboxLabel: (node, checked) => {
            const text = node.textContent?.trim();
            const state = checked ? 'completata' : 'da completare';
            return text ? `Attività ${state}: ${text}` : `Attività ${state}`;
          },
        },
      }),
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

    editor.commands.setContent(next, { emitUpdate: false });
    // Reset dopo sostituzione esterna (clear, load, undo/redo): il documento vuoto
    // deve poter ricevere di nuovo il focus iniziale a fine testo.
    hasInitialFocusedRef.current = false;
  }, [document, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (!isActive) {
      hadEditorFocusRef.current = editor.isFocused;
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

  return (
    <div className="diary-notes-editor flex flex-col min-h-[12rem]" data-diary-notes-editor>
      <DiaryNotesToolbar editor={editor} />
      <EditorContent editor={editor} className="flex-1 min-h-0" />
    </div>
  );
});

DiaryNotesEditor.displayName = 'DiaryNotesEditor';

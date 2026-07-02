import React from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { ExternalLink, Pencil, Unlink } from 'lucide-react';
import { applyDiaryNotesLink, openDiaryNotesLink } from './diaryNotesLinkUtils';

interface DiaryNotesLinkBubbleMenuProps {
  editor: Editor;
}

/** Evita che il mousedown sul menu tolga focus/selezione all'editor prima del click. */
const keepEditorSelection = (e: React.MouseEvent) => {
  e.preventDefault();
};

export const DiaryNotesLinkBubbleMenu: React.FC<DiaryNotesLinkBubbleMenuProps> = ({ editor }) => {
  const { href } = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      href: ed.isActive('link')
        ? (ed.getAttributes('link').href as string | undefined)
        : undefined,
    }),
  });

  const openLink = () => {
    openDiaryNotesLink(editor);
  };

  const editLink = () => {
    const url = window.prompt('Inserisci il link', href ?? 'https://');
    applyDiaryNotesLink(editor, url);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  return (
    <BubbleMenu
      editor={editor}
      appendTo={() => document.body}
      updateDelay={0}
      shouldShow={({ editor: ed }) => ed.isActive('link')}
      className="diary-notes-link-menu z-popover flex flex-col gap-0.5 rounded-lg border border-stone-200 bg-white p-1 shadow-lg"
    >
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={openLink}
        disabled={!href}
        className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-blue-600" />
        Apri link in una nuova scheda
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={editLink}
        className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-stone-100"
      >
        <Pencil className="w-3.5 h-3.5 shrink-0 text-stone-500" />
        Modifica link
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={removeLink}
        className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-stone-700 hover:bg-stone-100"
      >
        <Unlink className="w-3.5 h-3.5 shrink-0 text-stone-500" />
        Rimuovi link
      </button>
    </BubbleMenu>
  );
};

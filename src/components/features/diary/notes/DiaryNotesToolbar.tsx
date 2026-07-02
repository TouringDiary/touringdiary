import React, { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Link2,
  ListTodo,
} from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import { DIARY_NOTES_DEFAULT_TEXT_COLOR, DIARY_NOTES_TEXT_COLORS } from './diaryTextColors';
import { applyDiaryNotesLink } from './diaryNotesLinkUtils';

interface DiaryNotesToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive,
  disabled,
  title,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    aria-pressed={isActive ?? false}
    className={`
      diary-notes-toolbar-btn inline-flex items-center justify-center p-1.5 rounded transition-colors shrink-0
      min-w-[2.25rem] min-h-[2.25rem] sm:min-w-[2.5rem] sm:min-h-[2.5rem]
      ${isActive ? 'bg-amber-100 text-amber-800' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
  >
    {children}
  </button>
);

const INACTIVE_TOOLBAR = {
  isBold: false,
  isItalic: false,
  isStrike: false,
  isUnderline: false,
  isHeading: false,
  isBulletList: false,
  isOrderedList: false,
  isTaskList: false,
  isLink: false,
};

const TextColorButton: React.FC<{ editor: Editor }> = ({ editor }) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const currentColor = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const color = ed.getAttributes('textStyle').color;
      return typeof color === 'string' ? color : '';
    },
  });

  const swatchColor = currentColor || DIARY_NOTES_DEFAULT_TEXT_COLOR;

  const applyColor = (value: string) => {
    if (value) {
      editor.chain().focus().setColor(value).run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
    setOpen(false);
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Colore testo"
        aria-label="Colore testo"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`
          diary-notes-toolbar-btn inline-flex flex-col items-center justify-center p-1 rounded transition-colors shrink-0
          min-w-[2.25rem] min-h-[2.25rem] sm:min-w-[2.5rem] sm:min-h-[2.5rem]
          ${currentColor ? 'bg-amber-100 text-amber-800' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}
        `}
      >
        <span className="text-xs font-bold leading-none" style={{ color: swatchColor }}>A</span>
        <span
          className="mt-0.5 h-0.5 w-3.5 rounded-full"
          style={{ backgroundColor: swatchColor }}
          aria-hidden
        />
      </button>

      <AnchoredPopover
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        align="center"
        className="bg-white border border-stone-200 shadow-2xl rounded-xl p-2 flex flex-wrap gap-1.5 origin-top max-w-[11rem]"
        role="dialog"
      >
        {DIARY_NOTES_TEXT_COLORS.map((entry) => {
          const isSelected = entry.value === currentColor || (!entry.value && !currentColor);
          return (
            <button
              key={entry.label}
              type="button"
              title={entry.label}
              aria-label={entry.label}
              aria-pressed={isSelected}
              onClick={() => applyColor(entry.value)}
              className={`w-7 h-7 rounded-full border shadow-sm hover:scale-110 active:scale-95 transition-all ${
                isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : 'border-stone-200'
              } ${!entry.value ? 'bg-white' : ''}`}
              style={entry.value ? { backgroundColor: entry.value } : undefined}
            >
              {!entry.value && (
                <span className="block w-full h-full rounded-full bg-gradient-to-br from-stone-200 to-stone-400" />
              )}
            </button>
          );
        })}
      </AnchoredPopover>
    </>
  );
};

export const DiaryNotesToolbar: React.FC<DiaryNotesToolbarProps> = ({ editor }) => {
  const activeStates = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return INACTIVE_TOOLBAR;
      return {
        isBold: ed.isActive('bold'),
        isItalic: ed.isActive('italic'),
        isStrike: ed.isActive('strike'),
        isUnderline: ed.isActive('underline'),
        isHeading: ed.isActive('heading', { level: 2 }),
        isBulletList: ed.isActive('bulletList'),
        isOrderedList: ed.isActive('orderedList'),
        isTaskList: ed.isActive('taskList'),
        isLink: ed.isActive('link'),
      };
    },
  });

  if (!editor) return null;

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Inserisci il link', previousUrl ?? 'https://');
    applyDiaryNotesLink(editor, url);
  };

  const iconClass = 'w-3.5 h-3.5 sm:w-[1.125rem] sm:h-[1.125rem]';

  return (
    <div
      className="diary-notes-toolbar flex flex-nowrap sm:flex-wrap items-center gap-0.5 p-0.5 sm:p-1 mb-1 shrink-0 rounded-sm border border-stone-200 bg-stone-50/80 overflow-x-auto [-webkit-overflow-scrolling:touch]"
      role="toolbar"
      aria-label="Formattazione note"
    >
      <ToolbarButton
        title="Grassetto"
        isActive={activeStates.isBold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Corsivo"
        isActive={activeStates.isItalic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Barrato"
        isActive={activeStates.isStrike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Sottolineato"
        isActive={activeStates.isUnderline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className={iconClass} />
      </ToolbarButton>
      <TextColorButton editor={editor} />

      <div className="w-px h-4 bg-stone-200 mx-0.5 shrink-0" aria-hidden />

      <ToolbarButton
        title="Titolo"
        isActive={activeStates.isHeading}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className={iconClass} />
      </ToolbarButton>

      <div className="w-px h-4 bg-stone-200 mx-0.5 shrink-0" aria-hidden />

      <ToolbarButton
        title="Elenco puntato"
        isActive={activeStates.isBulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Elenco numerato"
        isActive={activeStates.isOrderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Checklist"
        isActive={activeStates.isTaskList}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListTodo className={iconClass} />
      </ToolbarButton>

      <div className="w-px h-4 bg-stone-200 mx-0.5 shrink-0" aria-hidden />

      <ToolbarButton
        title="Link"
        isActive={activeStates.isLink}
        onClick={handleLink}
      >
        <Link2 className={iconClass} />
      </ToolbarButton>
    </div>
  );
};

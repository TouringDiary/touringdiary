import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Link2,
  ListTodo,
} from 'lucide-react';

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
      inline-flex items-center justify-center min-w-[2.25rem] min-h-[2.25rem] p-1.5 rounded transition-colors shrink-0
      ${isActive ? 'bg-amber-100 text-amber-800' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
  >
    {children}
  </button>
);

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function normalizeLinkHref(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (!ALLOWED_LINK_PROTOCOLS.has(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export const DiaryNotesToolbar: React.FC<DiaryNotesToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Inserisci il link', previousUrl ?? 'https://');

    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const href = normalizeLinkHref(url);
    if (!href) {
      window.alert('Inserisci un URL valido (es. https://esempio.it, mailto:..., tel:...).');
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  const iconClass = 'w-3.5 h-3.5';

  return (
    <div
      className="flex flex-nowrap sm:flex-wrap items-center gap-0.5 p-1 mb-2 rounded-sm border border-stone-200 bg-stone-50/80 overflow-x-auto [-webkit-overflow-scrolling:touch]"
      role="toolbar"
      aria-label="Formattazione note"
    >
      <ToolbarButton
        title="Grassetto"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Corsivo"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Barrato"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className={iconClass} />
      </ToolbarButton>

      <div className="w-px h-4 bg-stone-200 mx-0.5 shrink-0" aria-hidden />

      <ToolbarButton
        title="Titolo"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className={iconClass} />
      </ToolbarButton>

      <div className="w-px h-4 bg-stone-200 mx-0.5 shrink-0" aria-hidden />

      <ToolbarButton
        title="Elenco puntato"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Elenco numerato"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className={iconClass} />
      </ToolbarButton>
      <ToolbarButton
        title="Checklist"
        isActive={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListTodo className={iconClass} />
      </ToolbarButton>

      <div className="w-px h-4 bg-stone-200 mx-0.5 shrink-0" aria-hidden />

      <ToolbarButton
        title="Link"
        isActive={editor.isActive('link')}
        onClick={handleLink}
      >
        <Link2 className={iconClass} />
      </ToolbarButton>
    </div>
  );
};

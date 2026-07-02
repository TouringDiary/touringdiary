import { getMarkRange } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from 'prosemirror-view';

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function normalizeLinkHref(input: string): string | null {
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

export function applyDiaryNotesLink(editor: Editor, rawUrl: string | null): void {
  restoreDiaryNotesEditorInputMode(editor);

  if (rawUrl === null) {
    editor.commands.focus();
    return;
  }

  if (rawUrl.trim() === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  const href = normalizeLinkHref(rawUrl);
  if (!href) {
    window.alert('Inserisci un URL valido (es. https://esempio.it, mailto:..., tel:...).');
    editor.commands.focus();
    return;
  }

  editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
}

export function resolveDiaryNotesLinkHref(rawHref: string | undefined): string | null {
  if (!rawHref) return null;
  return normalizeLinkHref(rawHref) ?? rawHref;
}

export function openDiaryNotesLink(editor: Editor): void {
  const href = resolveDiaryNotesLinkHref(editor.getAttributes('link').href as string | undefined);
  if (!href) return;
  window.open(href, '_blank', 'noopener,noreferrer');
}

type LinkPointerEvent = MouseEvent | PointerEvent;

function getEventElementTarget(event: LinkPointerEvent): HTMLElement | null {
  const target = event.target;
  if (target instanceof HTMLElement) return target;
  if (target instanceof Text) return target.parentElement;
  return null;
}

function getLinkAnchorFromEvent(view: EditorView, event: LinkPointerEvent): HTMLAnchorElement | null {
  const element = getEventElementTarget(event);
  if (!element) return null;

  const link =
    element instanceof HTMLAnchorElement ? element : element.closest<HTMLAnchorElement>('a');
  if (!link || !view.dom.contains(link)) return null;
  return link;
}

function resolvePositionInsideLink(view: EditorView, link: HTMLAnchorElement): number | null {
  try {
    return view.posAtDOM(link, 0, 1);
  } catch {
    return null;
  }
}

const DIARY_NOTES_LINK_MENU_INPUTMODE = 'none';

/** Ripristina inputmode normale quando si esce dalla UI link (editing testo, dismiss, ecc.). */
export function restoreDiaryNotesEditorInputMode(editor: Editor): void {
  if (editor.isDestroyed) return;
  const dom = editor.view.dom as HTMLElement;
  if (dom.getAttribute('inputmode') === DIARY_NOTES_LINK_MENU_INPUTMODE) {
    dom.removeAttribute('inputmode');
  }
}

function focusEditorForLinkBubbleMenu(view: EditorView): void {
  const dom = view.dom as HTMLElement;
  dom.setAttribute('inputmode', DIARY_NOTES_LINK_MENU_INPUTMODE);

  if (!view.hasFocus()) {
    view.focus();
  }
}

function selectLinkAtViewPosition(view: EditorView, pos: number): boolean {
  const linkType = view.state.schema.marks.link;
  if (!linkType) return false;

  const range = getMarkRange(view.state.doc.resolve(pos), linkType);
  if (!range) return false;

  const tr = view.state.tr
    .setSelection(TextSelection.create(view.state.doc, range.from, range.to))
    .setMeta('pointer', true);

  view.dispatch(tr);
  focusEditorForLinkBubbleMenu(view);
  return true;
}

/**
 * Chiude BubbleMenu e stati UI legati a una selezione link (cambio tab, uscita dal pannello, ecc.).
 */
export function dismissDiaryNotesLinkUi(editor: Editor): void {
  if (editor.isDestroyed) return;
  restoreDiaryNotesEditorInputMode(editor);
  editor.chain().setTextSelection(0).blur().run();
}

function isLinkAlreadySelected(view: EditorView, pos: number): boolean {
  const linkType = view.state.schema.marks.link;
  const range = linkType ? getMarkRange(view.state.doc.resolve(pos), linkType) : null;
  if (!range) return false;

  const { from, to, empty } = view.state.selection;
  return !empty && from === range.from && to === range.to;
}

function shouldOpenLinkInNewTab(event: LinkPointerEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

function consumeLinkPointerEvent(event: LinkPointerEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

export function handleDiaryNotesLinkClick(view: EditorView, event: LinkPointerEvent): boolean {
  if (event.button !== 0 || !view.editable) return false;

  const link = getLinkAnchorFromEvent(view, event);
  if (!link) return false;

  const href = resolveDiaryNotesLinkHref(link.getAttribute('href') ?? undefined) ?? link.href;
  if (!href) return false;

  if (shouldOpenLinkInNewTab(event)) {
    consumeLinkPointerEvent(event);
    window.open(href, '_blank', 'noopener,noreferrer');
    return true;
  }

  const pos = resolvePositionInsideLink(view, link);
  if (pos == null) return false;

  if (isLinkAlreadySelected(view, pos)) {
    consumeLinkPointerEvent(event);
    return true;
  }

  consumeLinkPointerEvent(event);
  selectLinkAtViewPosition(view, pos);
  return true;
}

function handleLinkPointerDown(view: EditorView, event: LinkPointerEvent): boolean {
  if (event.button !== 0 || !view.editable) return false;
  if (shouldOpenLinkInNewTab(event)) return false;

  const link = getLinkAnchorFromEvent(view, event);
  if (!link) return false;

  const href = resolveDiaryNotesLinkHref(link.getAttribute('href') ?? undefined) ?? link.href;
  if (!href) return false;

  // Impedisce a ProseMirror/iOS di piazzare il cursore nel testo prima della selezione link.
  consumeLinkPointerEvent(event);
  return true;
}

/**
 * Gestione tap/click sui link (Pointer Events + fallback ProseMirror):
 * - `pointerdown`: blocca il posizionamento nativo del cursore sul link.
 * - `pointerup`: selezione link affidabile su touch/pen/mouse.
 * - `handleClick` / `click`: fallback desktop e casi in cui pointerup non seleziona.
 */
export function createDiaryNotesLinkClickPlugin(): Plugin {
  const handleLinkPointer = (view: EditorView, event: Event): boolean => {
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      return handleDiaryNotesLinkClick(view, event);
    }
    return false;
  };

  const handleLinkPointerDownEvent = (view: EditorView, event: Event): boolean => {
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      return handleLinkPointerDown(view, event);
    }
    return false;
  };

  return new Plugin({
    props: {
      handleClick: (view, _pos, event) => handleLinkPointer(view, event),
      handleDOMEvents: {
        pointerdown: (view, event) => handleLinkPointerDownEvent(view, event),
        pointerup: (view, event) => handleLinkPointer(view, event),
        click: (view, event) => handleLinkPointer(view, event),
      },
    },
  });
}

/** Colore link nell'editor note — blu standard UI, indipendente dal color picker testo. */
export const DIARY_NOTES_LINK_COLOR = '#2563eb';

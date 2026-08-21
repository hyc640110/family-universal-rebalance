import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { X } from 'lucide-react';

export type HoldingDetailDialogProps = {
  titleId: string;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

/**
 * UR-TODO-072: generic accessible dialog/sheet shell for a holding card's "詳細" content — replaces
 * the old inline expand-in-card-body pattern that pushed every card below it down the page. Same DOM
 * structure renders as a near-full-height mobile sheet and a centered desktop modal purely via CSS
 * media queries (see .holding-detail-backdrop/.holding-detail-dialog in styles.css), so there is only
 * one component and one behavior contract to keep correct across breakpoints.
 *
 * Deliberately holds no holding-specific data or update handlers (DraftInput, updateHolding, dip
 * alert, focused-symbol, archive, etc. all stay in App.tsx and are passed in as `children`) — this
 * keeps the shell a small, independently testable, reusable piece with zero coupling to
 * App.tsx-local helpers, and avoids exporting App.tsx internals just to satisfy this component.
 *
 * Body scroll lock uses `document.body.style.overflow`, not any DOM move/measurement, so the Assets
 * page's own scroll position is never touched by opening or closing this dialog — the page simply
 * can't scroll while it's open, and resumes exactly where it was once the lock is released.
 */
export default function HoldingDetailDialog({ titleId, title, onClose, children }: HoldingDetailDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => { closeButtonRef.current?.focus(); }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Only a direct click on the backdrop itself (not a bubbled click from dialog content) closes —
  // prevents any accidental close while interacting with fields inside the dialog.
  const onBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return <div className="holding-detail-backdrop" onClick={onBackdropClick}>
    <div className="holding-detail-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="holding-detail-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="holding-detail-close" onClick={onClose} ref={closeButtonRef} aria-label="關閉詳細視窗"><X size={18} aria-hidden="true" /></button>
      </header>
      <div className="holding-detail-body">{children}</div>
    </div>
  </div>;
}

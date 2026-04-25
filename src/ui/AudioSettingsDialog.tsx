import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AudioSettingsPanel } from './AudioSettingsPanel';

export function AudioSettingsDialog({
  buttonLabel = 'Ayarlar',
  buttonClassName = '',
  title = 'Ses Ayarlari',
  subtitle = 'Degisiklikler hemen uygulanir.',
}: {
  buttonLabel?: string;
  buttonClassName?: string;
  title?: string;
  subtitle?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (key === 'escape' && !event.repeat) {
        event.preventDefault();
        setIsOpen(false);
      }

      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  const dialog =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/58 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-white/12 bg-slate-950/94 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-lg font-black leading-none text-white sm:text-xl">
                  {title}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/82 transition hover:bg-white/10"
                >
                  Kapat
                </button>
              </div>

              <AudioSettingsPanel
                title={null}
                subtitle={null}
                className="mt-4 border-0 bg-transparent p-0"
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
      >
        {buttonLabel}
      </button>
      {dialog}
    </>
  );
}

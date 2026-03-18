import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { CopilotoPanel } from './CopilotoPanel';

const STORAGE_KEY = 'copiloto-open';

export function CopilotoWidget() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    } catch {
      // localStorage not available
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Open AI Copilot"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Slide-over panel */}
      {isOpen && (
        <>
          {/* Backdrop — visible on all screen sizes */}
          <div
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 h-screen w-full md:w-[400px] z-50 shadow-2xl animate-in slide-in-from-right duration-300">
            <CopilotoPanel onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}

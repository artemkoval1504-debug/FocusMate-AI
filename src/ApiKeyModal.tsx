import { useState } from 'react';
import { getApiKey, saveApiKey, clearApiKey } from './stepGenerator';

interface Props {
  onClose: () => void;
}

export function ApiKeyModal({ onClose }: Props) {
  const existing = getApiKey();
  const [value, setValue] = useState(existing ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      saveApiKey(trimmed);
    } else {
      clearApiKey();
    }
    setSaved(true);
    setTimeout(onClose, 600);
  };

  const handleRemove = () => {
    clearApiKey();
    setValue('');
    setSaved(true);
    setTimeout(onClose, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white">Ключ OpenRouter</h2>
        <p className="mt-2 text-sm text-slate-400">
          Без ключа додаток використовує локальний генератор кроків. З ключем — модель google/gemini-2.0-flash-exp:free.
        </p>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-or-v1-..."
          className="mt-4 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-orange-500/60"
        />

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]"
          >
            {saved ? 'Збережено ✓' : 'Зберегти'}
          </button>
          {existing && (
            <button
              onClick={handleRemove}
              className="rounded-lg border border-white/10 px-4 py-2.5 font-medium text-slate-300 transition hover:bg-white/5"
            >
              Видалити
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2.5 font-medium text-slate-300 transition hover:bg-white/5"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}

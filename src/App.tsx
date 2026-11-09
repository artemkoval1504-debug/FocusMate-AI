import { useState } from 'react';
import type { AppState, FocusDuration, FocusStep } from './types';
import { DEMO_TASK, TOTAL_STEPS } from './types';
import { generateStep, getApiKey } from './stepGenerator';
import { ApiKeyModal } from './ApiKeyModal';
import { PhotoUpload } from './PhotoUpload';
import { downloadSessionReport } from './sessionReport';
import { useCountdown } from './useCountdown';

export default function App() {
  const [state, setState] = useState<AppState>('empty');
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState<FocusDuration>(15);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<FocusStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showApiModal, setShowApiModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!getApiKey());
  const [photos, setPhotos] = useState<string[]>([]);
  const [screenTime, setScreenTime] = useState('');

  const timer = useCountdown(duration);

  const handleStart = async () => {
    if (!task.trim() && photos.length === 0) {
      setError('Встав хоча б одне речення із завданням або завантаж фото, щоб AI міг виділити перший крок.');
      return;
    }
    setError(null);
    setLoading(true);
    setSteps([]);
    setCurrentStepIndex(0);

    try {
      const step = await generateStep({
        task: task.trim() || 'Завдання, описане фото',
        stepIndex: 0,
        previousSteps: [],
        photo: photos[0],
      });
      setSteps([step]);
      setState('focus');
      timer.reset();
      timer.start();
    } catch {
      setError('Не вдалося згенерувати крок. Спробуй ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= TOTAL_STEPS) {
      setState('done');
      timer.pause();
      return;
    }
    setLoading(true);
    try {
      const step = await generateStep({
        task: task.trim() || 'Завдання, описане фото',
        stepIndex: nextIndex,
        previousSteps: steps,
      });
      setSteps((prev) => [...prev, step]);
      setCurrentStepIndex(nextIndex);
      timer.reset();
      timer.start();
    } catch {
      setError('Не вдалося згенерувати наступний крок.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setTask(DEMO_TASK);
    setError(null);
  };

  const handleReset = () => {
    setState('empty');
    setSteps([]);
    setCurrentStepIndex(0);
    setPhotos([]);
    setScreenTime('');
    timer.pause();
    timer.reset();
    setError(null);
  };

  const handleApiSaved = () => {
    setShowApiModal(false);
    setHasApiKey(!!getApiKey());
  };

  const handleDownloadReport = () => {
    downloadSessionReport({ task, steps, duration, screenTime });
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-2xl font-black">⚡</span>
          <span className="font-extrabold tracking-tight text-lg sm:text-xl">
            FocusMate <span className="text-blue-500">AI</span>
          </span>
          <span className="ml-2 hidden rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-slate-400 sm:inline">
            Режим Do Now
          </span>
        </div>
        <button
          onClick={() => setShowApiModal(true)}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
        >
          <span className={`h-2 w-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-slate-500'}`} />
          API Key
        </button>
      </header>

      {showApiModal && <ApiKeyModal onClose={handleApiSaved} />}

      {/* Main */}
      <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl flex-col justify-center px-6 py-8 sm:px-10">
        {state === 'empty' && (
          <EmptyState
            task={task}
            setTask={(v) => {
              setTask(v);
              if (error) setError(null);
            }}
            duration={duration}
            setDuration={setDuration}
            onStart={handleStart}
            onDemo={handleDemo}
            error={error}
            loading={loading}
            photos={photos}
            onPhotosChange={setPhotos}
            screenTime={screenTime}
            onScreenTimeChange={setScreenTime}
          />
        )}

        {state === 'focus' && currentStep && (
          <FocusState
            step={currentStep}
            stepNumber={currentStepIndex + 1}
            totalSteps={TOTAL_STEPS}
            timer={timer}
            onDone={handleDone}
            onReset={handleReset}
            loading={loading}
          />
        )}

        {state === 'done' && (
          <DoneState
            task={task}
            steps={steps}
            duration={duration}
            screenTime={screenTime}
            onReset={handleReset}
            onDownload={handleDownloadReport}
          />
        )}
      </main>
    </div>
  );
}

/* ---------------- Empty State ---------------- */

const SCREEN_TIPS = [
  'Увімкни «режим сірий» на телефоні — він знижує заохочення до прокрутки.',
  'Використай вбудований тайтмер додатків: Screen Time (iOS) або Digital Wellbeing (Android).',
  'Приберіть телефон і комп’ютер із місць сну та їжі — створіть «зони без екрану».',
  'Перед фокус-сеансом вимкни зв’язок або постав «Не турити» для браузера.',
  'Поради: 25 хв фокусу → 5 хв перерви, тоді використовуй телефон на перерві.',
];

interface EmptyProps {
  task: string;
  setTask: (v: string) => void;
  duration: FocusDuration;
  setDuration: (d: FocusDuration) => void;
  onStart: () => void;
  onDemo: () => void;
  error: string | null;
  loading: boolean;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  screenTime: string;
  onScreenTimeChange: (v: string) => void;
}

function EmptyState({
  task,
  setTask,
  duration,
  setDuration,
  onStart,
  onDemo,
  error,
  loading,
  photos,
  onPhotosChange,
  screenTime,
  onScreenTimeChange,
}: EmptyProps) {
  const screenMinutes = parseInt(screenTime, 10);
  const hasHighScreenTime = !Number.isNaN(screenMinutes) && screenMinutes >= 120;

  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
        Синдром чистого аркуша лікується <span className="text-blue-500">однією дією</span> на 15 хвилин.
      </h1>
      <p className="mt-3 text-slate-400">Встав завдання сюди — отримаєш лише перший крок.</p>

      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="Встав складне завдання, довге ТЗ або напиши тему, яка тебе лякає…"
        rows={5}
        className="mt-6 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 text-white placeholder-slate-600 outline-none transition focus:border-blue-500/50"
      />

      <PhotoUpload photos={photos} onChange={onPhotosChange} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Час першого фокусу:</span>
        {([10, 15, 25] as FocusDuration[]).map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              duration === d
                ? 'bg-blue-600 text-white'
                : 'border border-white/10 text-slate-400 hover:bg-white/5'
            }`}
          >
            {d === 25 ? '25 хв (Помодоро)' : `${d} хв`}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <label htmlFor="screen-time" className="text-sm text-slate-400">
          Скільки ти займаєш часу на телефоні або комп’ютері? (у хвилинах на день)
        </label>
        <input
          id="screen-time"
          type="number"
          min={0}
          value={screenTime}
          onChange={(e) => onScreenTimeChange(e.target.value)}
          placeholder="Напр. 150"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-blue-500/50"
        />
      </div>

      {hasHighScreenTime && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-amber-300">
            Твоє екранне час — {screenTime} хвилин на день. Це багато 📵
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200/90">
            {SCREEN_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={onStart}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Генерую крок…' : '⚡ Запустити режим Do Now'}
        </button>
        <button
          onClick={onDemo}
          className="rounded-xl border border-white/10 px-4 py-3.5 text-sm text-slate-400 transition hover:bg-white/5"
        >
          Демо: «{DEMO_TASK}»
        </button>
      </div>
    </div>
  );
}

/* ---------------- Focus State ---------------- */

interface FocusProps {
  step: FocusStep;
  stepNumber: number;
  totalSteps: number;
  timer: ReturnType<typeof useCountdown>;
  onDone: () => void;
  onReset: () => void;
  loading: boolean;
}

function FocusState({ step, stepNumber, totalSteps, timer, onDone, onReset, loading }: FocusProps) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - timer.progress);

  return (
    <div className="animate-fadeIn flex flex-col items-center">
      {/* Progress dots */}
      <div className="mb-8 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i < stepNumber - 1
                ? 'w-6 bg-green-500'
                : i === stepNumber - 1
                  ? 'w-10 bg-blue-600'
                  : 'w-6 bg-white/10'
            }`}
          />
        ))}
      </div>

      <span className="text-xs uppercase tracking-widest text-slate-500">
        Крок {stepNumber} / {totalSteps}
      </span>

      {/* Timer ring */}
      <div className="relative mt-6 flex h-[280px] w-[280px] items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="280" height="280">
          <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="#2563eb"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className={`text-5xl font-black tabular-nums ${timer.finished ? 'text-green-400' : 'text-blue-500'}`}>
            {timer.display}
          </span>
          <button
            onClick={timer.toggle}
            className="mt-3 rounded-lg border border-white/10 px-4 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
          >
            {timer.running ? 'Пауза' : timer.finished ? 'Час вийшов' : 'Старт'}
          </button>
        </div>
      </div>

      {/* Step */}
      <div className="mt-8 max-w-xl text-center">
        <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{step.title}</h2>
        <p className="mt-3 text-slate-400">{step.detail}</p>
      </div>

      {/* Done button */}
      <button
        onClick={onDone}
        disabled={loading}
        className="mt-8 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? 'Генерую…' : stepNumber < totalSteps ? '✅ Зроблено! Наступний крок' : '✅ Завершити'}
      </button>

      <button
        onClick={onReset}
        className="mt-4 text-sm text-slate-500 transition hover:text-slate-300"
      >
        Почати спочатку
      </button>
    </div>
  );
}

/* ---------------- Done State ---------------- */

interface DoneProps {
  task: string;
  steps: FocusStep[];
  duration: FocusDuration;
  screenTime: string;
  onReset: () => void;
  onDownload: () => void;
}

function DoneState({ task, steps, duration, screenTime, onReset, onDownload }: DoneProps) {
  return (
    <div className="animate-fadeIn flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 text-4xl">
        🎉
      </div>
      <h1 className="mt-6 text-3xl font-extrabold">Ти пройшов 3 кроки!</h1>
      <p className="mt-3 max-w-md text-slate-400">
        Синдром чистого аркуша переможено. Ти вже у процесі — далі йде легше.
      </p>

      <div className="mt-6 max-w-lg rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Завдання</h2>
        <p className="mt-2 text-white">{task.trim() || '—'}</p>
        <h2 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-400">Ключові пункти</h2>
        <ol className="mt-2 space-y-1">
          {steps.map((s) => (
            <li key={s.index} className="text-sm text-slate-300">
              <span className="font-semibold text-blue-400">{s.index + 1}.</span> {s.title}
            </li>
          ))}
        </ol>
        <h2 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-400">Тривалість фокусу</h2>
        <p className="mt-2 text-sm text-slate-300">{duration} хвилин</p>
        {screenTime.trim() && (
          <>
            <h2 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-400">Час на екрані</h2>
            <p className="mt-2 text-sm text-slate-300">{screenTime.trim()} хвилин</p>
          </>
        )}
      </div>

      <button
        onClick={onDownload}
        className="mt-8 rounded-xl border border-white/10 px-6 py-3.5 font-bold text-white transition hover:bg-white/5"
      >
        📄 Скачати звіт у файлі
      </button>

      <button
        onClick={onReset}
        className="mt-4 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white transition hover:bg-blue-500 active:scale-[0.98]"
      >
        Нове завдання
      </button>
    </div>
  );
}

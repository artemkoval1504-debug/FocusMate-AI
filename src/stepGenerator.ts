import type { FocusStep } from './types';

const STORAGE_KEY = 'focusmate_openrouter_key';

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // ignore
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface GenerateArgs {
  task: string;
  stepIndex: number; // 0-based
  previousSteps: FocusStep[];
  photo?: string;
}

/**
 * Generate a single physical first-action step from a task description.
 * Tries OpenRouter first; falls back to the local generator on any failure.
 */
export async function generateStep(args: GenerateArgs): Promise<FocusStep> {
  const { task, stepIndex, previousSteps, photo } = args;
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const step = await generateStepWithOpenRouter(apiKey, task, stepIndex, previousSteps, photo);
      if (step) return step;
    } catch {
      // fall through to local generator
    }
  }
  return generateStepLocal(task, stepIndex, previousSteps, photo);
}

async function generateStepWithOpenRouter(
  apiKey: string,
  task: string,
  stepIndex: number,
  previousSteps: FocusStep[],
  photo?: string,
): Promise<FocusStep | null> {
  const model = 'google/gemini-2.0-flash-exp:free';

  const doneList = previousSteps.map((s) => `- ${s.title}`).join('\n');
  const systemPrompt =
    'Ти — productivity coach. Користувач має складне завдання і страждає від синдрому чистого аркуша. ' +
    'Твоя задача: видати ЛИШЕ ОДНУ конкретну фізичну дію на 10-25 хвилин, яку можна виконати ПРЯМО ЗАРАЗ. ' +
    'Не давай список кроків. Тільки одну дію. Формулюй як фізичну, вимірну дію. ' +
    'Відповідай українською. Формат: рядок заголовка дії (до 12 слів), потім новий рядок і коротка деталь (до 20 слів). ' +
    (photo ? 'Користувач надав фото завдання (скріншот, план, фото) — використай його як джерело контексту для дії.' : '');

  const userPrompt =
    `Завдання: ${task}\n` +
    (doneList ? `Вже зроблено:\n${doneList}\n` : '') +
    `Дай дію №${stepIndex + 1} з 3. Тільки одну.`;

  const content: Array<Record<string, unknown>> = [{ type: 'text', text: userPrompt }];
  if (photo) {
    content.push({ type: 'image_url', image_url: { url: photo } });
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) return null;

  const lines = text.trim().split('\n').filter(Boolean);
  const title = (lines[0] ?? '').replace(/^[\d\.\)\-\*]+\s*/, '').trim();
  const detail = (lines.slice(1).join(' ').trim()) || 'Виконай це зараз — без обдумування, дією.';

  if (!title) return null;

  return {
    index: stepIndex,
    title: title.slice(0, 120),
    detail: detail.slice(0, 200),
  };
}

const LOCAL_TEMPLATES: { title: (t: string) => string; detail: string }[] = [
  {
    title: (_t) => `Відкрий браузер і знайди 1 визначення теми «${shorten(_t, 24)}»`,
    detail: 'Знайди одне коротке визначення основного поняття. Запиши його в нотатник. Це і є твоя перша дія.',
  },
  {
    title: (_t) => `Напиши 3 ключові пункти, які вже знаєш про «${shorten(_t, 20)}»`,
    detail: 'Не гугли. Запиши з пам\'яті будь-що, що знаєш. Мета — розблокувати думання, не зробити ідеально.',
  },
  {
    title: (_t) => `Склади простий план на аркуші: 3 розділи для «${shorten(_t, 20)}»`,
    detail: 'Тільки заголовки розділів. Без деталей. Це дасть скелет, поверх якого далі піде контент.',
  },
];

function shorten(s: string, n: number): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  if (clean.length <= n) return clean;
  return clean.slice(0, n).trim() + '…';
}

const PHOTO_STEPS: FocusStep[] = [
  {
    index: 0,
    title: 'Візьми з вашого фото один елемент і зробіть із нього перший крок',
    detail: 'Покажи фото собі: обери один елемент (документ, дата, запис, план) і зроби з нього одну фізичну дію прямо зараз.',
  },
];

function generateStepLocal(task: string, stepIndex: number, _previous: FocusStep[], photo?: string): FocusStep {
  if (photo) {
    const photoStep = PHOTO_STEPS[0];
    return {
      index: photoStep.index,
      title: photoStep.title,
      detail: photoStep.detail,
    };
  }
  const template = LOCAL_TEMPLATES[stepIndex % LOCAL_TEMPLATES.length];
  return {
    index: stepIndex,
    title: template.title(task),
    detail: template.detail,
  };
}

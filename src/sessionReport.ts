import type { FocusDuration, FocusStep } from './types';

export interface SessionReportData {
  task: string;
  steps: FocusStep[];
  duration: FocusDuration;
  screenTime: string;
}

/**
 * Build the final session report text (markdown) in Ukrainian.
 * Contains the task, the focus steps (3 key points) and optional screen time advice.
 */
export function buildSessionReport({ task, steps, duration, screenTime }: SessionReportData): string {
  const date = new Date().toLocaleString('uk-UA');
  const lines: string[] = [
    'ФОКУС-МАТЕ AI — ЗВІТ ПРО ФОКУС-СЕАНС',
    '====================================',
    '',
    `Дата й час: ${date}`,
    `Завдання: ${task.trim() || '—'}`,
    `Тривалість фокусу: ${duration} хвилин`,
  ];

  if (screenTime.trim()) {
    lines.push(`Час на екрані: ${screenTime.trim()} хвилин`, '');
  }

  lines.push('Ключові пункти сесії:', '');

  if (steps.length === 0) {
    lines.push('Крок не згенеровано.');
  }

  steps.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.title}`.trimEnd());
    lines.push(`   ${s.detail}`.trimEnd());
  });

  lines.push('', 'Синдром чистого аркуша подолано. Далі йде легше.');

  return lines.join('\n');
}

/**
 * Generate a downloadable report file (markdown) for the finished session.
 */
export function downloadSessionReport(data: SessionReportData): void {
  const content = buildSessionReport(data);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focusmate-report-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

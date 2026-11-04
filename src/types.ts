export type FocusDuration = 10 | 15 | 25;

export type AppState = 'empty' | 'focus' | 'done';

export interface FocusStep {
  index: number;
  title: string;
  detail: string;
}

export const TOTAL_STEPS = 3;

export const DEMO_TASK = 'Скласти звіт з практики';

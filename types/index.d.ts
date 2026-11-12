export type StepStatus = 'pending' | 'in_progress' | 'completed'
export type Step = { id?: string; content: string; status: StepStatus }
// finishedAt : heure de la dernière étape faite (absent dans un état écrit par la 0.1.0).
export type Plan = { goal: string | null; startedAt: number; finishedAt?: number | null; steps: Step[] }

declare module 'claude-code' {
  interface PluginState {
    'objectif-sprint': { plan: Plan | null; isHidden: boolean }
  }
}

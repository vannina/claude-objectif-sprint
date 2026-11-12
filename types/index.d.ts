export type StepStatus = 'pending' | 'in_progress' | 'completed'
export type Step = { id?: string; content: string; status: StepStatus }
export type Plan = { goal: string | null; startedAt: number; steps: Step[] }

declare module 'claude-code' {
  interface PluginState {
    'objectif-sprint': { plan: Plan | null; isHidden: boolean }
  }
}

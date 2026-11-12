import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Plan, Step, StepStatus } from '../types'

// Barre de progression d'un objectif, au-dessus du prompt.
// Les étapes viennent de la liste de tâches que Claude tient déjà
// (TodoWrite, TaskCreate/TaskUpdate, ou la liste de l'app desktop),
// l'objectif lui-même s'épingle avec /objectif <texte>.

const plan = atom({ plugin: 'objectif-sprint', key: 'plan' } as const, null)
const isHidden = atom({ plugin: 'objectif-sprint', key: 'isHidden' } as const, false)

const DESKTOP_PLAN_TOOL = 'mcp__ccd_turn__update_plan'
const BAR_WIDTH = 20

const asStatus = (value: unknown): StepStatus =>
  value === 'completed' || value === 'in_progress' ? value : 'pending'

const isFinished = (steps: readonly Step[]) =>
  steps.length > 0 && steps.every(step => step.status === 'completed')

// Une nouvelle liste ouvre un nouveau chrono si l'ancienne était finie ou vide.
const withSteps = (current: Plan | null, steps: Step[], now: number): Plan => {
  const isFresh = current === null || current.steps.length === 0 || isFinished(current.steps)
  return {
    goal: current?.goal ?? null,
    startedAt: isFresh && current?.goal == null ? now : (current?.startedAt ?? now),
    steps,
  }
}

const advance = (steps: Step[]): Step[] => {
  const active = steps.findIndex(step => step.status === 'in_progress')
  const done = steps.map((step, i) => (i === active ? { ...step, status: 'completed' as const } : step))
  const next = done.findIndex(step => step.status === 'pending')
  return done.map((step, i) => (i === next ? { ...step, status: 'in_progress' as const } : step))
}

const formatElapsed = (ms: number) => {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${String(minutes % 60).padStart(2, '0')}`
}

const bar = (ratio: number) => {
  const full = Math.round(ratio * BAR_WIDTH)
  return '█'.repeat(full) + '░'.repeat(BAR_WIDTH - full)
}

const trim = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'objectif',
      description: 'Épingle un objectif au-dessus du prompt (/objectif <texte>), ou /objectif fin pour l’effacer',
    })
    return next(e)
  })

  on('command.run', { command: 'objectif' }, async ($, e) => {
    const text = e.args.trim()
    if (text === '' || text.toLowerCase() === 'fin') {
      await update($, plan, () => null)
      return { text: 'Objectif effacé.' }
    }
    const now = await $.clock.now()
    await update($, plan, current => ({
      goal: text,
      startedAt: now,
      steps: current !== null && !isFinished(current.steps) ? current.steps : [],
    }))
    await update($, isHidden, () => false)
    return { text: `Objectif épinglé : ${text}` }
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError === true) return ran

    const now = await $.clock.now()
    const args = e as unknown as Record<string, unknown>

    if (e.tool === 'TodoWrite' && e.agentId === undefined) {
      const steps = e.todos.map(todo => ({ content: todo.content, status: asStatus(todo.status) }))
      await update($, plan, current => withSteps(current, steps, now))
      await update($, isHidden, () => false)
    } else if (e.tool === 'TaskCreate') {
      const id = /#?(\d+)/.exec(typeof ran.text === 'string' ? ran.text : '')?.[1]
      const step: Step = { id, content: e.subject, status: 'pending' }
      await update($, plan, current => withSteps(current, [...(current?.steps ?? []), step], now))
      await update($, isHidden, () => false)
    } else if (e.tool === 'TaskUpdate') {
      await update($, plan, current => {
        if (current === null) return current
        const steps = current.steps
          .filter(step => !(step.id === e.taskId && e.status === 'deleted'))
          .map(step =>
            step.id === e.taskId
              ? { ...step, content: e.subject ?? step.content, status: e.status ? asStatus(e.status) : step.status }
              : step,
          )
        return { ...current, steps }
      })
    } else if (e.tool === DESKTOP_PLAN_TOOL && e.agentId === undefined) {
      const items = args.items
      if (Array.isArray(items)) {
        const steps = items.map(item => {
          const row = (item ?? {}) as Record<string, unknown>
          return { content: String(row.content ?? ''), status: asStatus(row.status) }
        })
        await update($, plan, current => withSteps(current, steps, now))
        await update($, isHidden, () => false)
      } else {
        await update($, plan, current => {
          if (current === null) return current
          let steps = current.steps
          if (args.advance === true) steps = advance(steps)
          if (Array.isArray(args.done)) {
            const done = new Set(args.done.map(Number))
            steps = steps.map((step, i) => (done.has(i + 1) ? { ...step, status: 'completed' as const } : step))
          }
          if (typeof args.start === 'number') {
            const start = args.start
            steps = steps.map((step, i) => (i + 1 === start ? { ...step, status: 'in_progress' as const } : step))
          }
          return { ...current, steps }
        })
      }
    }
    return ran
  }).catch(($, e, next) => next(e)) // un bug de la barre ne bloque jamais l'outil

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, plan)
    if (e.props.hasSurvey || current === null || (await read($, isHidden))) return next(e)
    if (current.goal === null && current.steps.length === 0) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const total = current.steps.length
    const done = current.steps.filter(step => step.status === 'completed').length
    const ratio = total === 0 ? 0 : done / total
    const active = current.steps.find(step => step.status === 'in_progress')
    const elapsed = formatElapsed((await $.clock.now()) - current.startedAt)
    const isDone = isFinished(current.steps)

    return (
      <Box flexDirection="column">
        {current.goal !== null ? <Text bold>🎯 {trim(current.goal, 90)}</Text> : null}
        <Box>
          <Text>
            {bar(ratio)} {Math.round(ratio * 100)} %{' '}
          </Text>
          <Text dimColor>
            · {done}/{total} étapes · {elapsed}{' '}
          </Text>
          <Button key="hide" label="Masquer" onPress={() => update($, isHidden, () => true)} />
        </Box>
        {isDone ? (
          <Text dimColor>Terminé en {elapsed}.</Text>
        ) : active !== undefined ? (
          <Text dimColor>En cours : {trim(active.content, 90)}</Text>
        ) : null}
      </Box>
    )
  })
}

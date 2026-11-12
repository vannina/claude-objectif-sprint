import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

declare const console: { log: (line: string) => void }

// Fait dessiner la barre par le moteur et vérifie ce qu'elle affiche.
// Le second test écrit une ligne `RENDU <json>` par seconde simulée :
// c'est la source du GIF du README (`docs/fabriquer-gif.py`).

const STEPS = [
  'Relever les tarifs actuels',
  'Écrire les trois formules',
  'Maquetter la grille',
  'Intégrer la page',
  'Relire et publier',
]

const ABOVE = {
  plugin: 'objectif-sprint',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  surface: 'terminal',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: true,
    maxRows: 6,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 6 },
    view: {},
  },
} as const

const todos = (done: number) =>
  STEPS.map((content, i) => ({
    content,
    activeForm: content,
    status: i < done ? ('completed' as const) : i === done ? ('in_progress' as const) : ('pending' as const),
  }))

const textOf = (node: unknown): string[] => {
  if (node === null || typeof node !== 'object') return typeof node === 'string' ? [node] : []
  const n = node as { type?: string; props?: { label?: string }; children?: unknown[] }
  if (n.type === 'Button') return [`[${n.props?.label ?? ''}]`]
  return (n.children ?? []).flatMap(textOf)
}

const start = async ($: Parameters<TestBody>[0], on: Parameters<TestBody>[1]) => {
  const clock = mock.clock(on, { now: 0 })
  on('command.register', () => ({ value: { command: 'objectif' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: { text: 'ok' } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.command.run({
    command: 'objectif',
    args: 'Refaire la page tarifs',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  return clock
}

test('la barre suit les étapes, le chrono défile puis se fige', async ($, on) => {
  const clock = await start($, on)
  const ui = await $.ui.mount(ABOVE)
  const shown = async () => textOf(await ui.drawn()).join('')

  await $.tool.call({ tool: 'TodoWrite', todos: todos(2) })
  expect(await shown()).toContain('40 %')
  expect(await shown()).toContain('En cours : Maquetter la grille')
  expect(await shown()).toContain('0 min 00 s')

  // Entre deux étapes, le minuteur du mod redessine la bande chaque seconde.
  await clock.advance(12 * 1000)
  expect(await shown()).toContain('0 min 12 s')

  await $.tool.call({ tool: 'TodoWrite', todos: todos(STEPS.length) })
  expect(await shown()).toContain('100 %')
  expect(await shown()).toContain('Terminé en 0 min 12 s')

  // Une fois tout fait, le temps ne bouge plus.
  await clock.advance(20 * 1000)
  expect(await shown()).toContain('Terminé en 0 min 12 s')
  await ui.unmount()
})

test('démo : une image par seconde', async ($, on) => {
  const clock = await start($, on)
  const ui = await $.ui.mount(ABOVE)
  const STEP_SECONDS = 6

  for (let second = 0; second <= STEPS.length * STEP_SECONDS; second += 1) {
    if (second % STEP_SECONDS === 0) {
      await $.tool.call({ tool: 'TodoWrite', todos: todos(second / STEP_SECONDS) })
    }
    console.log(`RENDU ${JSON.stringify(textOf(await ui.drawn()))}`)
    if (second < STEPS.length * STEP_SECONDS) await clock.advance(1000)
  }
  expect(textOf(await ui.drawn()).join('')).toContain('Terminé en 0 min 30 s')
  await ui.unmount()
})

import { expect, mock, test } from 'claude-code/testing'

// Fait dessiner la barre par le moteur, étape après étape, et vérifie ce qu'elle
// affiche. Chaque image est aussi écrite sur la sortie (ligne `RENDU <json>`) :
// c'est la source du GIF du README (`docs/fabriquer-gif.py`).

const STEPS = [
  'Relever les tarifs actuels',
  'Écrire les trois formules',
  'Maquetter la grille',
  'Intégrer la page',
  'Relire et publier',
]

const ABOVE = (surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'objectif-sprint',
    component: 'AbovePrompt',
    requestId: 'above-prompt',
    surface,
    props: { hasSurvey: false, isCollapsed: false, isWorking: true, maxRows: 6, bodyColumns: 80 },
  }) as const

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

test('la barre suit les étapes et le temps', async ($, on) => {
  const clock = mock.clock(on, { now: 0 })
  on('command.register', () => ({ value: { command: 'objectif' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: { text: 'ok' } }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'objectif', args: 'Refaire la page tarifs' })

  const frames: string[][] = []
  for (let done = 0; done <= STEPS.length; done += 1) {
    await $.tool.call({ tool: 'TodoWrite', todos: todos(done) })
    const ui = await $.ui.mount(ABOVE('terminal'))
    const tree = await ui.drawn()
    frames.push(textOf(tree))
    await ui.unmount()
    await clock.advance(4 * 60 * 1000)
  }

  expect(frames[0]?.join('')).toContain('0 %')
  expect(frames[2]?.join('')).toContain('40 %')
  expect(frames[2]?.join('')).toContain('En cours : Maquetter la grille')
  expect(frames[5]?.join('')).toContain('100 %')
  expect(frames[5]?.join('')).toContain('Terminé en 20 min')

  for (const frame of frames) console.log(`RENDU ${JSON.stringify(frame)}`)
})

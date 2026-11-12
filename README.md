# objectif-sprint

Mod Claude Code : une barre de progression de ton objectif, au-dessus du prompt (Terminal et appli Desktop).

```
🎯 Configurer la TV Listo
██████████░░░░░░░░░░ 50 % · 3/6 étapes · 12 min  [Masquer]
En cours : Activer le mode développeur
```

## Ce qu'il fait

- Reprend la liste de tâches que Claude tient déjà (TodoWrite, TaskCreate/TaskUpdate, ou la liste de l'appli Desktop) : rien à configurer.
- Affiche la barre, le pourcentage fait, les étapes faites sur le total, le temps écoulé et l'étape en cours. Le bouton « Masquer » la cache jusqu'à la prochaine liste.
- `/objectif <texte>` épingle ton objectif et relance le chrono. `/objectif fin` l'efface.
- Lecture seule : le mod ne modifie et ne bloque aucun outil. Un bug de la barre laisse passer l'appel.

## Installer

Dans une session Claude Code, au terminal :

```
/plugin install objectif-sprint --marketplace vannina/claude-objectif-sprint
```

Depuis un shell :

```bash
claude plugin install objectif-sprint --marketplace vannina/claude-objectif-sprint
```

Dans l'appli Desktop, où `/plugin` ne s'exécute pas : bouton + à côté du champ de saisie, puis Plugins, Add marketplace avec `vannina/claude-objectif-sprint`, puis Add plugin.

Il faut Claude Code 2.1.287 ou plus récent (2.1.286 pour l'appli Desktop). Les mods ne s'affichent pas dans l'extension VS Code.

## Licence

MIT, voir `LICENSE`.

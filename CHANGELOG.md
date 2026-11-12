# Historique des versions

## 0.2.0 · 2026-11-12

- Le chrono défile à la seconde entre deux étapes (minuteur du mod, redessin seulement quand l'objectif est en cours et la barre visible).
- Format du temps : « 4 min 07 s » sous l'heure, « 1 h 04 min » au-delà.
- Correction : « Terminé en … » se fige à la dernière étape faite au lieu de continuer à compter.
- Démo animée à une image par seconde, test du chrono.

## 0.1.0 · 2026-11-12

- Première version publique.
- Barre de progression au-dessus du prompt : barre, pourcentage, étapes faites sur total, temps écoulé, étape en cours.
- Étapes lues depuis TodoWrite, TaskCreate et TaskUpdate, et la liste de l'appli Desktop (`update_plan`).
- Commande `/objectif <texte>` et `/objectif fin`.
- Bouton « Masquer ».
- Test de rendu `tests/rendu.test.tsx` et démo animée `docs/demo.gif` générée à partir du rendu du moteur.

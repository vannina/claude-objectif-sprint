# Fonctionnement

[Retour au README](../README.md)

objectif-sprint est un mod de comportement : un module de hooks (`hooks/register.tsx`) que Claude Code charge dans chaque session. Il ne fait que trois choses : écouter les outils de liste de tâches, garder l'état de la session, dessiner une bande au-dessus du prompt.

## D'où viennent les étapes

Le mod lit le résultat des outils que Claude utilise déjà pour planifier. Il ne les modifie jamais.

| Outil | Ce que le mod en fait |
|---|---|
| `TodoWrite` | Remplace la liste par les tâches envoyées, avec leur statut |
| `TaskCreate` | Ajoute une étape « à faire » (numéro repris du résultat de l'outil) |
| `TaskUpdate` | Met à jour le titre ou le statut de l'étape ; `deleted` la retire |
| `mcp__ccd_turn__update_plan` (appli Desktop) | Liste complète (`items`), ou avance d'une étape (`advance`), marque des étapes faites (`done`) ou démarre une étape (`start`) |

Les appels refusés ou en erreur sont ignorés. Les listes `TodoWrite` et `update_plan` d'un sous-agent sont aussi ignorées : elles décrivent son travail à lui, pas ton objectif.

Statuts reconnus : `pending` (à faire), `in_progress` (en cours), `completed` (fait). Le pourcentage est le nombre d'étapes faites divisé par le total.

## Règles du chrono

- `/objectif <texte>` fixe le départ du chrono à l'instant de la commande.
- Sans objectif épinglé, une nouvelle liste relance le chrono quand la précédente était vide ou terminée.
- Avec un objectif épinglé, le chrono continue jusqu'au prochain `/objectif`.
- Le chrono défile à la seconde : un minuteur du mod demande un redessin chaque seconde, seulement quand un objectif est en cours et que la barre est visible. Le reste du temps, il ne redessine rien.
- Quand toutes les étapes sont faites, le temps se fige à l'heure de la dernière étape (« Terminé en … »). Si une étape revient à faire, il repart.
- Format : « 4 min 07 s » sous l'heure, « 1 h 04 min » au-delà.

## Affichage

La bande apparaît dès qu'il y a un objectif ou au moins une étape. Elle montre :

1. le titre de l'objectif, s'il est épinglé (coupé à 90 caractères) ;
2. la barre sur 20 cases, le pourcentage, les étapes faites sur le total, le temps écoulé, le bouton « Masquer » ;
3. l'étape en cours, ou « Terminé en … » quand tout est fait.

« Masquer » la cache jusqu'à la prochaine liste complète, la prochaine étape créée ou le prochain `/objectif`. Elle se retire aussi quand l'appli affiche une enquête au même endroit.

## État

L'objectif, les étapes et le masquage vivent dans l'état de session (`$.state`, contrat dans `types/index.d.ts`). Rien n'est écrit sur le disque ni gardé d'une session à l'autre.

## Ce que le mod ne fait pas

- Aucun appel réseau, aucun accès aux fichiers, aucun processus lancé. Seul un minuteur d'une seconde tourne, pour le chrono.
- Aucun appel au modèle : il ne consomme aucun token.
- Il ne bloque, ne retarde et ne réécrit aucun outil. Son hook d'outil appelle d'abord l'outil, puis lit le résultat ; un `.catch` laisse passer l'appel si le code de la barre échoue.

## Limites connues

- Avec `TaskCreate`, le numéro de l'étape est le premier nombre du texte de résultat. Si un futur format change ce texte, les mises à jour `TaskUpdate` risquent de ne plus retrouver l'étape.
- La bande n'est pas dessinée dans l'extension VS Code.

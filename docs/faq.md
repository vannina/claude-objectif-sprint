# FAQ et dépannage

[Retour au README](../README.md)

### La barre ne s'affiche pas

1. Vérifie que le mod est installé et actif : `claude plugin list` doit montrer `objectif-sprint` activé.
2. Dans une session ouverte avant l'installation, lance `/reload-plugins`, ou ouvre une nouvelle session.
3. Claude n'a peut-être pas encore posé de liste de tâches. Tape `/objectif <texte>` : la barre doit apparaître tout de suite.
4. Tu as peut-être cliqué sur « Masquer ». Une nouvelle liste ou un `/objectif` la fait revenir.
5. Dans l'extension VS Code, les mods ne sont pas dessinés.

### `/objectif` est introuvable

Le mod n'est pas chargé dans cette session : voir le point 2 ci-dessus. Vérifie aussi ta version : `claude --version` doit donner 2.1.287 ou plus.

### La commande apparaît deux fois

Le mod est chargé deux fois, par exemple installé depuis ce dépôt et depuis un dossier de développement. Désinstalle l'une des deux copies (`claude plugin uninstall objectif-sprint@<marketplace>`).

### Est-ce que le mod consomme des tokens ?

Non. Il n'appelle jamais le modèle. La seule trace dans la conversation est la ligne de réponse de `/objectif` (« Objectif épinglé : … »), que Claude lit comme n'importe quel message court.

### Le temps affiché semble figé

Il se recalcule à chaque redessin de la bande, donc à chaque étape ou message, et non chaque seconde.

### Mon objectif a disparu

L'état vaut pour une session. Dans une nouvelle session, épingle-le de nouveau avec `/objectif`.

### Comment le retirer

```bash
claude plugin uninstall objectif-sprint
claude plugin marketplace remove claude-objectif-sprint
```

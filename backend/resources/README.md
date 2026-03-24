# 🎨 Ressources Statiques & Assets

Ce dossier centralise les éléments visuels et statiques de l'application.

## 📁 Contenu

### `styles/`

Contient les feuilles de style CSS.

- L'application utilise principalement des styles injectés dynamiquement via `shared/ui/styles.py`, mais ce dossier peut
  contenir des fichiers CSS bruts si nécessaire.

### `emojis.py`

Une bibliothèque centralisée d'émojis pour garantir la cohérence visuelle.
Au lieu de copier-coller "💰" partout dans le code, on utilise :

```python
from resources.emojis import EMOJI_MONEY
st.write(f"{EMOJI_MONEY} Solde : 100€")
```

Si demain on veut remplacer 💰 par 💶, on le change à un seul endroit !

### `EMOJIS_README.md`

Le catalogue complet des émojis disponibles avec leur variable correspondante.

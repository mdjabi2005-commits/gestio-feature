# Notes — Comportement du terminal (PowerShell) dans JetBrains + GitHub Copilot

## Contexte

- **OS** : Windows
- **Shell** : PowerShell 5.1 (v5.1.26100.7019)
- **IDE** : JetBrains (IntelliJ/PyCharm)
- **Date d'observation** : 2026-03-01

---

## Problème observé

Au **tout premier appel** de `run_in_terminal` dans une nouvelle session Copilot, les commandes s'exécutent mais la **sortie est vide** (aucun output retourné), même pour des commandes triviales :

```powershell
echo "Test terminal OK"   → sortie vide
python --version          → sortie vide
Get-Date                  → sortie vide
```

Dès le **deuxième appel**, tout fonctionne normalement.

---

## Cause identifiée

Ce n'est **pas un délai de temps** (la commande s'exécute en ~2ms).  
C'est un **problème de capture de la sortie stdout** lors de l'initialisation du processus PowerShell persistant.  
Le terminal se lance correctement, mais le premier batch de sorties n'est pas capturé par l'agent.

---

## Comportement confirmé

| Appel | Commande | Résultat |
|---|---|---|
| 1er | `echo "Test terminal OK"` | ❌ Sortie vide |
| 1er | `python --version` | ❌ Sortie vide |
| 1er | `Get-Date` | ❌ Sortie vide |
| 2ème+ | `echo "ping"` | ✅ `ping` |
| 2ème+ | `python --version` | ✅ `Python 3.12.7` |
| 2ème+ | `uv --version` | ✅ `uv 0.10.2` |
| 2ème+ | `git branch --show-current` | ✅ branche active |

---

## Contournement

Si une commande revient avec une sortie vide en début de session → **la relancer une deuxième fois**, elle répondra correctement.

Alternativement, envoyer une commande "warm-up" neutre en début de session :

```powershell
$PSVersionTable.PSVersion
```

Ce premier appel "réveille" le terminal, et tous les suivants fonctionnent normalement.

---

## Infos environnement

| Outil | Version |
|---|---|
| PowerShell | 5.1.26100.7019 |
| Python | 3.12.7 |
| uv | 0.10.2 |
| Git (branche active) | `1-pilier-performance-multiprocessing-concurrence` |
| Répertoire de travail | `C:\Users\djabi\gestion-financiere\v4` |

---

## À surveiller

- Ce comportement se reproduit-il à **chaque nouvelle session** Copilot ?
- Est-il lié à la version de l'IDE ou au plugin GitHub Copilot ?
- Est-il reproductible avec **d'autres agents** dans la même session ?

---

## Historique des sessions

| Date | 1er appel vide ? | Notes |
|---|---|---|
| 2026-03-01 (session 1) | ✅ Oui | `echo`, `python --version`, `Get-Date` → sortie vide |
| 2026-03-01 (session 2) | ❌ Non | `echo`, `python`, `uv`, `Get-Date`, `git` → sorties OK dès le 1er appel |

> **Conclusion provisoire** : le bug est **intermittent**, pas systématique à chaque session.


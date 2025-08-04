# Création de l'exécutable - Configurateur Audio MID Audio

Ce guide vous explique comment transformer le projet web en application desktop exécutable (.exe).

## Prérequis

1. **Node.js** (version 16 ou supérieure)
   - Téléchargez et installez depuis [nodejs.org](https://nodejs.org/)

2. **npm** (généralement installé avec Node.js)

## Étapes pour créer l'exécutable

### 1. Installation des dépendances

Ouvrez un terminal dans le dossier `web-project` et exécutez :

```bash
npm install
```

### 2. Test de l'application

Avant de créer l'exécutable, testez que l'application fonctionne :

```bash
npm start
```

L'application devrait s'ouvrir dans une fenêtre Electron.

### 3. Création de l'exécutable Windows

Pour créer l'exécutable Windows (.exe) :

```bash
npm run build:win
```

L'exécutable sera créé dans le dossier `dist/`.

### 4. Création pour d'autres plateformes (optionnel)

- **macOS** : `npm run build:mac`
- **Linux** : `npm run build:linux`
- **Toutes les plateformes** : `npm run build`

## Structure des fichiers créés

Après la compilation, vous trouverez dans le dossier `dist/` :

- **Windows** : `Configurateur Audio MID Audio Setup.exe` (installateur)
- **macOS** : `Configurateur Audio MID Audio.dmg`
- **Linux** : `Configurateur Audio MID Audio.AppImage`

## Fonctionnalités de l'application desktop

L'application Electron inclut :

- **Menu complet** avec options Fichier, Édition, Affichage, Aide
- **Raccourcis clavier** (Ctrl+N, Ctrl+O, Ctrl+S, etc.)
- **Gestion des liens externes** (ouverts dans le navigateur par défaut)
- **Icône personnalisée** (logo-mid.png)
- **Fenêtre redimensionnable** avec dimensions minimales
- **Sécurité renforcée** (isolation du contexte, pas d'intégration Node.js)

## Dépannage

### Erreur "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

### Erreur de compilation
- Vérifiez que tous les fichiers sont présents (index.html, script.js, styles.css, etc.)
- Assurez-vous que le logo-mid.png existe dans le dossier racine

### L'application ne se lance pas
- Vérifiez les logs dans le terminal
- Testez d'abord avec `npm start` avant de créer l'exécutable

## Distribution

L'exécutable créé peut être distribué directement aux utilisateurs. Il s'installe comme une application Windows normale avec :

- Raccourci sur le bureau
- Raccourci dans le menu Démarrer
- Désinstallation via "Ajouter/Supprimer des programmes"

## Notes techniques

- L'application utilise Electron 28.0.0
- Tous les fichiers web sont inclus dans l'exécutable
- L'application fonctionne hors ligne
- Les datasheets sont incluses dans le package 
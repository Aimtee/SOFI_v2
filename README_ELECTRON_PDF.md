# Support Electron pour les PDF Téléchargeables

## Modifications Apportées

### 1. Installation de @electron/remote

Pour permettre l'accès aux APIs Electron depuis le processus de rendu, nous avons installé `@electron/remote` :

```bash
npm install @electron/remote
```

### 2. Configuration de main.js

Modifications apportées au fichier `main.js` :

```javascript
// Initialisation de @electron/remote
require('@electron/remote/main').initialize();

// Dans la fonction createWindow()
require('@electron/remote/main').enable(mainWindow.webContents);
```

### 3. Modification des fonctions de téléchargement PDF

Les fonctions `downloadCahierDesCharges()` et `downloadCahierDesChargesWithSurvey()` ont été modifiées pour :

- Détecter automatiquement si l'application tourne dans Electron
- Utiliser l'API `dialog.showSaveDialog()` d'Electron pour choisir l'emplacement de sauvegarde
- Convertir le PDF en buffer et l'écrire avec `fs.writeFileSync()`
- Conserver un fallback vers la méthode navigateur si Electron n'est pas disponible

### 4. Fonctionnement

#### Dans Electron :
1. L'utilisateur clique sur "Télécharger le cahier des charges"
2. Une boîte de dialogue native s'ouvre pour choisir l'emplacement
3. Le PDF est généré et sauvegardé à l'emplacement choisi
4. Le fichier est immédiatement accessible sur le système

#### Dans le navigateur :
1. L'utilisateur clique sur "Télécharger le cahier des charges"
2. Le PDF est téléchargé automatiquement dans le dossier de téléchargements par défaut
3. Comportement identique à l'original

## Avantages

### ✅ Compatibilité Totale
- Fonctionne dans Electron ET dans le navigateur
- Aucune perte de fonctionnalité
- Fallback automatique en cas d'erreur

### ✅ Expérience Utilisateur Améliorée
- Boîte de dialogue native dans Electron
- Choix de l'emplacement de sauvegarde
- Intégration parfaite avec le système d'exploitation

### ✅ Robustesse
- Gestion d'erreurs complète
- Fallback automatique
- Logs d'erreur détaillés

## Structure des PDF Générés

### Cahier des Charges Standard
- Réponses du questionnaire principal
- Informations de base (date, heure)
- Pied de page avec mention de l'application

### Cahier des Charges Complet
- Réponses du questionnaire principal
- Réponses du questionnaire rapide (selon le type de devis)
- Informations complémentaires
- Pied de page avec mention de l'application

## Types de Devis Supportés

1. **Sur rails** (surface > 250m² ou plus d'une zone)
2. **Surface > 250m²** (autres parcours)
3. **Plus de 4 zones**

Chaque type génère un questionnaire adapté avec des questions spécifiques.

## Tests Recommandés

### Test dans Electron
1. Lancer l'application avec `npm start`
2. Suivre un parcours menant à un devis sur mesure
3. Remplir le questionnaire rapide
4. Tester le téléchargement du PDF
5. Vérifier que le fichier est sauvegardé correctement

### Test dans le Navigateur
1. Ouvrir `index.html` dans un navigateur
2. Suivre le même parcours
3. Vérifier que le téléchargement fonctionne normalement

## Dépannage

### Erreur "Bibliothèque PDF non chargée"
- Vérifier la connexion internet
- Recharger la page
- Vérifier que jsPDF est accessible

### Erreur avec l'API Electron
- Vérifier que `@electron/remote` est installé
- Redémarrer l'application Electron
- Consulter les logs dans la console

### PDF non généré
- Vérifier que tous les champs requis sont remplis
- Consulter les messages d'erreur
- Tester avec des données minimales

## Maintenance

### Mise à jour des dépendances
```bash
npm update @electron/remote
npm update electron
```

### Vérification de compatibilité
- Tester sur différentes versions d'Electron
- Vérifier la compatibilité avec les nouveaux navigateurs
- Maintenir les fallbacks en cas de problème

## Conclusion

Les modifications apportées permettent une expérience utilisateur optimale dans Electron tout en conservant la compatibilité avec les navigateurs web. Le système de fallback garantit que l'application fonctionne dans tous les environnements. 
# 📋 Organisation des Fiches Techniques

## Structure recommandée

Placez tous vos fichiers PDF de fiches techniques dans le dossier `datasheets/` à la racine du projet :

```
web-project/
├── index.html
├── script.js
├── styles.css
├── logo-mid.png
└── datasheets/
    ├── IC3_datasheet.pdf
    ├── eMOTUS5OD_datasheet.pdf
    ├── UC106_datasheet.pdf
    ├── Wispeak_TUBE_datasheet.pdf
    ├── eHMA120_datasheet.pdf
    ├── eHMA250_datasheet.pdf
    ├── MZ140Q_datasheet.pdf
    ├── eMBASE_datasheet.pdf
    ├── eMCN2_datasheet.pdf
    ├── CNX-CBO_datasheet.pdf
    ├── WPaMIX-T_datasheet.pdf
    ├── WPaVOL_datasheet.pdf
    ├── Core_datasheet.pdf
    └── MZ-C2-EU_datasheet.pdf
```

## Mapping automatique

Le système détecte automatiquement les produits dans la liste des matériels et propose les fiches correspondantes :

| Produit dans la liste | Fiche technique |
|----------------------|-----------------|
| `IC3` | `IC3_datasheet.pdf` |
| `eMOTUS5OD` | `eMOTUS5OD_datasheet.pdf` |
| `UC106` | `UC106_datasheet.pdf` |
| `Wispeak TUBE` | `Wispeak_TUBE_datasheet.pdf` |
| `eHMA120` | `eHMA120_datasheet.pdf` |
| `eHMA250` | `eHMA250_datasheet.pdf` |
| `HH Audio MZ140Q` | `MZ140Q_datasheet.pdf` |
| `eMBASE` | `eMBASE_datasheet.pdf` |
| `eMCN2` | `eMCN2_datasheet.pdf` |
| `CNX-CBO` | `CNX-CBO_datasheet.pdf` |
| `WPaMIX-T` | `WPaMIX-T_datasheet.pdf` |
| `WPaVOL` | `WPaVOL_datasheet.pdf` |
| `Core` | `Core_datasheet.pdf` |
| `HH Audio MZ-C2-EU` | `MZ-C2-EU_datasheet.pdf` |

## Fonctionnalités

✅ **Détection automatique** : Le système analyse la liste des matériels  
✅ **Liens dynamiques** : Génère automatiquement les liens de téléchargement  
✅ **Design responsive** : S'adapte à tous les écrans  
✅ **Ouverture en nouvel onglet** : Les PDF s'ouvrent dans un nouvel onglet  
✅ **Interface moderne** : Design cohérent avec le reste de l'application  

## Ajout de nouveaux produits

Pour ajouter un nouveau produit :

1. **Ajouter le mapping** dans `script.js` :
```javascript
const productDatasheets = {
    // ... produits existants ...
    'Nouveau Produit': 'Nouveau_Produit_datasheet.pdf'
};
```

2. **Placer le PDF** dans le dossier `datasheets/`

3. **Le système détectera automatiquement** le produit dans la liste des matériels

## Test

1. Lancez le serveur : `py -m http.server 8000`
2. Testez le questionnaire
3. Vérifiez que les fiches techniques apparaissent dans les résultats
4. Testez le téléchargement des PDF 
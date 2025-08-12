// Variables globales avec valeurs par défaut sécurisées
let currentStep = 0;
let answers = {};
let materials = [];
let isInitialized = false;
let stepHistory = []; // Historique des étapes pour permettre le retour en arrière

// Gestion du thème
let currentTheme = localStorage.getItem('theme') || 'light';

// Mapping des consommations électriques des produits
const productConsumption = {
    'eHMA120': 26, // W
    'eHMA250': 45, // W
    'HH Audio MZ140Q': 300, // W
    'Core': 12, // W
    'TUBE Wispeak': 15, // W
    'WPaMIX-T': 0.6 // W
};

// Mapping des produits vers leurs fiches techniques
const productDatasheets = {
    // Hauts-parleurs
    'IC3': 'IC3_datasheet.pdf',
    'eMOTUS5OD': 'eMOTUS5OD_datasheet.pdf',
    'UC106': 'UC106_datasheet.pdf',
    'Wispeak TUBE': 'Wispeak_TUBE_datasheet.pdf',
    'TUBE Wispeak': 'Wispeak_TUBE_datasheet.pdf',
    
    // Amplificateurs
    'eHMA120': 'eHMA120_datasheet.pdf',
    'eHMA250': 'eHMA250_datasheet.pdf',
    '1 x HH Audio MZ140Q': 'MZ140Q_datasheet.pdf',
    'eCA120HZ': 'eHMA120_datasheet.pdf',
    'CA120HZ': 'eHMA120_datasheet.pdf',
    'HH Audio MZ140Q': 'MZ140Q_datasheet.pdf',
    
    // Micros et accessoires
    'eMBASE': 'eMBASE_datasheet.pdf',
    'eMCN2': 'eMCN2_datasheet.pdf',
    'CNX-CBO': 'CNX-CBO_datasheet.pdf',
    'WPaMIX-T': 'WPaMIX-T_datasheet.pdf',
    'WPaVOL': 'WPaVOL_datasheet.pdf',
    'WPaBT': 'WPaBT_datasheet.pdf', // Récepteur Bluetooth
    
    // Contrôles
    'Core': 'Core_datasheet.pdf',
    'HH Audio MZ-C2-EU': 'MZ-C2-EU_datasheet.pdf',
    'HH MZ-C2-EU WH': 'MZ-C2-EU_datasheet.pdf',
    'HH MZ-C2-EU BK': 'MZ-C2-EU_datasheet.pdf',
    
    // Câbles
    'Câble Kordz One 14AWG 2C': 'KORDZ_datasheet.pdf'
};

// Fonction pour extraire les noms de produits de la liste des matériels
function extractProductNames(materialsList) {
    const productNames = new Set();
    
    materialsList.forEach(material => {
        if (typeof material === 'string') {
            // Chercher les produits dans le mapping
            Object.keys(productDatasheets).forEach(productName => {
                // Gérer les produits avec préfixes comme "1 x", "2 x", etc.
                if (material.includes(productName)) {
                    // Cas spécial pour les produits avec préfixes de quantité
                    if (productName === 'HH Audio MZ140Q' && material.includes('1 x HH Audio MZ140Q')) {
                        productNames.add('1 x HH Audio MZ140Q');
                    } else if (productName === 'HH Audio MZ140Q' && material.includes('HH Audio MZ140Q')) {
                        productNames.add('HH Audio MZ140Q');
                    } else if (productName === 'HH MZ-C2-EU WH' && material.includes('HH MZ-C2-EU WH')) {
                        productNames.add('HH MZ-C2-EU WH');
                    } else if (productName === 'HH MZ-C2-EU BK' && material.includes('HH MZ-C2-EU BK')) {
                        productNames.add('HH MZ-C2-EU BK');
                    } else if (productName === 'HH Audio MZ-C2-EU' && material.includes('HH Audio MZ-C2-EU')) {
                        productNames.add('HH Audio MZ-C2-EU');
                    } else if (material.includes(productName)) {
                        productNames.add(productName);
                    }
                }
            });
        }
    });
    
    return Array.from(productNames);
}

// Fonction pour générer les liens de téléchargement des fiches techniques
function generateDatasheetLinks(materialsList) {
    const productNames = extractProductNames(materialsList);
    const availableDatasheets = [];
    
    productNames.forEach(productName => {
        const datasheetFile = productDatasheets[productName];
        if (datasheetFile) {
            let displayName;
            
            // Gestion des noms d'affichage selon le type de produit
            if (productName === '1 x HH Audio MZ140Q') {
                displayName = 'HH Audio MZ140Q';
            } else if (productName === 'HH MZ-C2-EU WH') {
                displayName = 'HH MZ-C2-EU WH';
            } else if (productName === 'HH MZ-C2-EU BK') {
                displayName = 'HH MZ-C2-EU BK';
            } else if (productName === 'HH Audio MZ-C2-EU') {
                displayName = 'HH Audio MZ-C2-EU';
            } else if (productName === 'HH Audio MZ140Q') {
                displayName = 'HH Audio MZ140Q';
            } else if (productName.includes('Ecler ') || 
                     productName === 'Câble Kordz One 14AWG 2C') {
                displayName = productName;
            } else {
                // Par défaut : ajouter le préfixe "Ecler"
                displayName = `Ecler ${productName}`;
            }
            
            // Détecter si on est dans Electron ou dans un navigateur
            const isElectron = window && window.process && window.process.type;
            const filePath = isElectron ? 
                `./datasheets/${datasheetFile}` : 
                `datasheets/${datasheetFile}`;
            
            availableDatasheets.push({
                product: productName,
                file: filePath,
                displayName: displayName
            });
        }
    });
    
    return availableDatasheets;
}

// Fonction pour trier les matériaux par marque (Ecler en priorité, puis HH, puis Kordz, puis autres)
function sortMaterialsByBrand(materialsList) {
    const sortedMaterials = [];
    
    // Fonction pour déterminer la priorité de la marque
    function getBrandPriority(material) {
        if (material.includes('Ecler ') || 
            material.includes('IC3') || 
            material.includes('eMOTUS5OD') || 
            material.includes('UC106') || 
            material.includes('Wispeak') || 
            material.includes('eHMA') || 
            material.includes('eMBASE') || 
            material.includes('eMCN2') || 
            material.includes('CNX-CBO') || 
            material.includes('WPaMIX-T') || 
            material.includes('WPaVOL') || 
            material.includes('WPaBT') || 
            material.includes('Core')) {
            return 1; // Ecler en priorité
        } else if (material.includes('HH Audio') || 
                   material.includes('HH MZ') || 
                   material.includes('MZ140Q') || 
                   material.includes('MZ-C2-EU')) {
            return 2; // HH en deuxième
        } else if (material.includes('Kordz') || 
                   material.includes('KORDZ')) {
            return 3; // Kordz en troisième
        } else {
            return 4; // Autres en dernier
        }
    }
    
    // Trier les matériaux par priorité de marque
    const materialsWithPriority = materialsList.map(material => ({
        material: material,
        priority: getBrandPriority(material)
    }));
    
    materialsWithPriority.sort((a, b) => a.priority - b.priority);
    
    // Extraire les matériaux triés
    materialsWithPriority.forEach(item => {
        sortedMaterials.push(item.material);
    });
    
    return sortedMaterials;
}

// Fonction pour calculer la consommation électrique totale
function calculateElectricalConsumption(materialsList) {
    let totalConsumption = 0;
    
    materialsList.forEach(material => {
        if (typeof material === 'string') {
            // Chercher les produits dans le mapping de consommation
            Object.keys(productConsumption).forEach(productName => {
                // Vérifier si le matériel contient le nom du produit (avec ou sans préfixe Ecler)
                // Pour les produits Ecler, chercher "Ecler ProductName" ou "ProductName"
                // Pour les produits non-Ecler comme HH Audio, chercher le nom exact
                let found = false;
                
                if (productName === 'HH Audio MZ140Q') {
                    // Pour HH Audio MZ140Q, chercher le nom exact
                    found = material.includes(productName);
                } else {
                    // Pour les autres produits, chercher avec ou sans préfixe Ecler
                    found = material.includes(`Ecler ${productName}`) || material.includes(productName);
                }
                
                if (found) {
                    let consumption = productConsumption[productName];
                    
                    // Extraire la quantité du matériel (format: "X x Produit" ou "Produit")
                    let quantity = 1;
                    const quantityMatch = material.match(/^(\d+)\s*x\s*/);
                    if (quantityMatch) {
                        quantity = parseInt(quantityMatch[1]);
                    }
                    
                    // Multiplier par la quantité extraite
                    consumption *= quantity;
                    
                    totalConsumption += consumption;
                }
            });
        }
    });
    
    return totalConsumption;
}

// Configuration des étapes du questionnaire
const questions = [
    // ÉTAPES COMMUNES (parcours normal)
    {
        id: 1,
        title: "Choix des hauts-parleurs",
        subtitle: "",
        options: [
            "Plafonniers",
            "Suspendus", 
            "Mural",
            "Sur rails"
        ]
    },
    {
        id: 2,
        title: "Choix de la couleur",
        subtitle: "",
        options: ["Blanc", "Noir"]
    },
    {
        id: 3,
        title: "Surface à sonoriser",
        subtitle: "",
        options: [
            "Jusqu'à 70m²",
            "Jusqu'à 90m²", 
            "Jusqu'à 150m²",
            "Plus de 150m²"
        ]
    },
    {
        id: 4,
        title: "Nombre de zones",
        subtitle: "<em>Le nombre de zones correspond au nombre d'espaces qui pourront avoir une gestion de volume et de source indépendantes</em>",
        options: ["1", "2", "3", "4", "Plus de 4 zones"]
    },
    {
        id: 5,
        title: "Choix du micro d'appel",
        subtitle: "Option n°1 - Micro d'appel général",
                        options: ["0", "1", "2", "3", "4"],
                sub: {
                    title: "<em>Tous les micros diffuseront dans la même zone</em>",
                    options: ["0", "1", "2", "3", "4"],
            sub2: {
                title: "Option n°2 - Micro d'appel indépendant",
                subtitle: "<em>Les micros diffuseront dans des zones séparées</em>",
                options: ["0", "1", "2", "3", "4"]
            }
        }
    },
    {
        id: 6,
        title: "Commande de volume et sélection de sources déportées",
        subtitle: "<em>1 commande par zone</em>",
        options: [
            "1 commande de volume",
            "1 commande de volume + source",
            "2 commandes de volume + source",
            "3 commandes de volume + source",
            "4 commandes de volume + source"
        ]
    },
    
    // ÉTAPES SPÉCIFIQUES AU PARCOURS "SUR RAILS" (dupliquées)
    {
        id: 102, // Étape 2 bis pour Sur rails
        title: "Choix de la couleur",
        subtitle: "",
        options: ["Blanc", "Noir"]
    },
    {
        id: 103, // Étape 3 bis pour Sur rails
        title: "Surface à sonoriser",
        subtitle: "",
        options: [
            "40m²",
            "60m²", 
            "80m²",
            "120m²",
            "au-delà de 250m²"
        ]
    },
    
    // ÉTAPES SPÉCIFIQUES AU PARCOURS "SUR RAILS" (originales)
    {
        id: 7,
        title: "Besoin d'une télécommande de volume déportée ?",
        subtitle: "",
        options: [
            "Oui",
            "Non"
        ]
    },
    {
        id: 8,
        title: "Nombre de zones",
        subtitle: "",
        options: [
            "1",
            "Plus d'une zone"
        ]
    },
    
    // PAGES DE ZONES SPÉCIALISÉES SELON LA SURFACE (parcours classique uniquement)
    {
        id: 104, // Zones pour "Jusqu'à 70m²" (1 ou 2 zones)
        title: "Nombre de zones",
        subtitle: "<em>Le nombre de zones correspond au nombre d'espaces qui pourront avoir une gestion de volume et de source indépendantes</em>",
        options: ["1", "2"]
    },
    {
        id: 105, // Zones pour "Jusqu'à 90m²" (1, 2 ou 3 zones)
        title: "Nombre de zones",
        subtitle: "<em>Le nombre de zones correspond au nombre d'espaces qui pourront avoir une gestion de volume et de source indépendantes</em>",
        options: ["1", "2", "3"]
    },
    {
        id: 106, // Zones pour "Jusqu'à 150m²" (page actuelle - 1, 2, 3, 4, Plus de 4 zones)
        title: "Nombre de zones",
        subtitle: "<em>Le nombre de zones correspond au nombre d'espaces qui pourront avoir une gestion de volume et de source indépendantes</em>",
        options: ["1", "2", "3", "4", "Plus de 4 zones"]
    },
    
    // MICRO D'APPEL SPÉCIAL POUR "JUSQU'À 70M²" (parcours classique uniquement)
    {
        id: 107, // Micro d'appel spécial pour "Jusqu'à 70m²"
        title: "Choix du micro d'appel",
        subtitle: "<em>Les micros diffuseront dans la même zone</em>",
        options: ["0", "1"]
    },
    
    // TÉLÉCOMMANDES SPÉCIALES POUR "JUSQU'À 70M²" (parcours classique uniquement)
    {
        id: 108, // Télécommandes spéciales pour "Jusqu'à 70m²"
        title: "Commande de volume et sélection de sources déportées",
        subtitle: "<em>1 commande par zone</em>",
        options: [
            "0 commande de volume",
            "1 commande de volume"
        ]
    },
    
    // QUESTION BLUETOOTH POUR TOUS LES PARCOURS
    {
        id: 109, // Question Bluetooth pour tous les parcours
        title: "Besoin d'un récepteur Bluetooth ?",
        subtitle: "",
        options: ["Oui", "Non"]
    },
    
    // TÉLÉCOMMANDES SPÉCIALES POUR "JUSQU'À 90M²" AVEC 3 ZONES
    {
        id: 110, // Télécommandes spéciales pour "Jusqu'à 90m²" avec 3 zones
        title: "Commande de volume et sources déportées",
        subtitle: "<em>Vous avez la possibilité d'ajouter une sélection de source sur vos télécommandes déportées. Vous pourrez ainsi changer de source et ajuster le volume depuis les mêmes télécommandes.</em>",
        options: [
            "0 commandes de volume",
            "1 commande de volume + sources",
            "2 commandes de volume + sources",
            "3 commandes de volume + sources"
        ]
    },
    
    // MICRO D'APPEL SPÉCIAL POUR "JUSQU'À 90M²" AVEC 3 ZONES
    {
        id: 111, // Micro d'appel spécial pour "Jusqu'à 90m²" avec 3 zones
        title: "Choix du micro d'appel",
        subtitle: "<em>Les micros diffuseront dans la même zone</em>",
        options: ["0", "1", "2"]
    }
];

// Fonction pour ajouter la marque Ecler aux produits
function addEclerBrand(productName) {
    const eclerProducts = ['IC3', 'eMOTUS5OD', 'UC106', 'Wispeak', 'Wispeak TUBE', 'TUBE Wispeak', 'eHMA120', 'eHMA250', 'WPaMIX-T', 'eMBASE', 'eMCN2', 'WPaVOL', 'WPaBT', 'Core', 'CNX-CBO'];
    
    // Vérifier si le produit est déjà dans la liste des produits Ecler
    for (let product of eclerProducts) {
        if (productName === product) {
            return `Ecler ${productName}`;
        }
    }
    
    // Si le produit n'est pas trouvé exactement, chercher par inclusion
    for (let product of eclerProducts) {
        if (productName.includes(product) && product !== 'Wispeak') { // Éviter les conflits avec "Wispeak" seul
            return `Ecler ${productName}`;
        }
    }
    
    return productName;
}

// Fonction pour calculer le temps d'installation
function calculateInstallationTime() {
    const speaker = answers[1];
    const surface = answers[3];
    
    // Vérifier que les réponses existent
    if (!speaker) {
        return "Temps à calculer";
    }
    
    // Sur rails : 1/2 journée à deux personnes pour n'importe quelle surface
    if (speaker === "Sur rails") {
        return "1/2 journée à deux personnes";
    }
    
    // Plafonniers, mural ou suspendu jusqu'à 150m² : 1 journée à deux personnes
    if (speaker === "Plafonniers" || speaker === "Mural" || speaker === "Suspendus") {
        if (surface === "Jusqu'à 70m²" || surface === "Jusqu'à 90m²" || surface === "Jusqu'à 150m²") {
            return "1 journée à deux personnes";
        }
    }
    
    // Cas par défaut (ne devrait jamais arriver car ces cas débouchent sur un devis)
    return "1 journée à deux personnes";
}

// Fonction de sécurité pour échapper le HTML
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fonction pour échapper le texte pour les attributs HTML (gère les apostrophes)
function escapeHtmlAttribute(text) {
    if (typeof text !== 'string') {
        return '';
    }
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Fonction spécifique pour échapper le texte dans les attributs onclick
function escapeForOnclick(text) {
    if (typeof text !== 'string') {
        return '';
    }
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}

// Fonction de vérification de l'existence des éléments DOM
function getElementSafely(id) {
    if (typeof id !== 'string') {
        console.error('ID invalide:', id);
        return null;
    }
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Élément avec l'ID '${id}' non trouvé`);
        return null;
    }
    return element;
}

// Fonction de vérification de la disponibilité du DOM
function isDOMReady() {
    return document.readyState === 'loading' || document.readyState === 'interactive' || document.readyState === 'complete';
}

// Fonction pour basculer le thème
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    // Mettre à jour l'icône du bouton
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    // Mettre à jour le logo selon le thème
    updateLogoForTheme();
}

// Fonction pour mettre à jour le logo selon le thème
function updateLogoForTheme() {
    // Mettre à jour le logo principal
    const logoImage = document.querySelector('.logo-image');
    if (logoImage) {
        if (currentTheme === 'dark') {
            logoImage.src = 'logo_sofi_white.png';
        } else {
            logoImage.src = 'logo_sofi_black.png';
        }
    }
    
    // Mettre à jour l'image du titre SOFI
    const titleImage = document.querySelector('.title-image');
    if (titleImage) {
        if (currentTheme === 'dark') {
            titleImage.src = 'sofi-white.png';
        } else {
            titleImage.src = 'sofi.png';
        }
    }
    
    // Mettre à jour le logo de chargement s'il existe
    const loadingLogo = document.querySelector('.loading-logo');
    if (loadingLogo) {
        if (currentTheme === 'dark') {
            loadingLogo.src = 'logo_sofi_white.png';
        } else {
            loadingLogo.src = 'logo_sofi_black.png';
        }
    }
    
    // Mettre à jour la couleur du texte de fallback
    const logoFallback = document.querySelector('.logo-fallback');
    if (logoFallback) {
        if (currentTheme === 'dark') {
            logoFallback.style.color = '#ffffff';
        } else {
            logoFallback.style.color = '#2d2d2d';
        }
    }
}

// Initialisation avec gestion d'erreur renforcée
function initializeApp() {
    if (isInitialized) {
        console.warn('Application déjà initialisée');
        return;
    }
    
    try {
        // Vérifier que le DOM est prêt
        if (!isDOMReady()) {
            console.warn('DOM pas encore prêt, nouvelle tentative dans 100ms');
            setTimeout(initializeApp, 100);
            return;
        }
        
        // Vérifier les éléments critiques
        const criticalElements = ['questionContainer', 'progressFill', 'resultsContainer'];
        const missingElements = criticalElements.filter(id => !getElementSafely(id));
        
        if (missingElements.length > 0) {
            console.error('Éléments critiques manquants:', missingElements);
            showErrorMessage('Erreur de structure de l\'application');
            return;
        }
        
        // Initialiser le thème
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateLogoForTheme();
        
        // Ajouter l'écouteur d'événement pour le bouton de thème
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        // Mettre à jour l'icône initiale
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
        }
        
        showQuestion();
        updateProgress();
        isInitialized = true;
        
        // console.log('Application initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showErrorMessage('Erreur lors du chargement de l\'application');
    }
}

// Gestionnaire d'événement DOMContentLoaded avec fallback
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM déjà chargé
    initializeApp();
}

// Fonction pour déterminer si une question est la dernière étape logique
function isLastStep(questionId) {
    // Les étapes qui sont vraiment les dernières étapes logiques
    const lastStepIds = [6, 8]; // Étape 6 (Commande de volume) et étape 8 (Zones Sur rails)
    
    // L'étape 107 n'est pas la dernière étape, elle mène à l'étape 5
    if (questionId === 107) {
        return false;
    }
    
    // L'étape 108 n'est pas la dernière étape, elle mène à l'étape 107
    if (questionId === 108) {
        return false;
    }
    
    return lastStepIds.includes(questionId);
}

// Afficher la question actuelle avec gestion d'erreur renforcée
function showQuestion() {
    try {
        const questionContainer = getElementSafely('questionContainer');
        if (!questionContainer) {
            return;
        }
        
        if (typeof currentStep !== 'number' || currentStep < 0 || currentStep >= questions.length) {
            currentStep = 0;
        }
        
        const question = questions[currentStep];
        
        if (!question || !question.options || !Array.isArray(question.options)) {
            showErrorMessage('Erreur de configuration du questionnaire');
            return;
        }
        // Déterminer le titre et sous-titre à afficher pour la question 108 (télécommandes)
        let displayTitle = question.title;
        let displaySubtitle = question.subtitle;
        if (question.id === 108) {
            // Récupérer les zones selon la surface sélectionnée
            let zones;
            if (answers[3] === "Jusqu'à 70m²") {
                zones = answers[104]; // ID de la question des zones pour "Jusqu'à 70m²"
            } else if (answers[3] === "Jusqu'à 90m²") {
                zones = answers[105]; // ID de la question des zones pour "Jusqu'à 90m²"
            }
            
            if (zones === "1") {
                displayTitle = "Commande de volume et sources déportées";
                displaySubtitle = "<em>Vous avez la possibilité d'ajouter une sélection de source sur votre télécommande déportée. Vous pourrez ainsi changer de source et ajuster le volume depuis la même télécommande.</em>";
            } else if (zones === "2") {
                displayTitle = "Commande de volume et sources déportées";
                displaySubtitle = "<em>Les télécommandes déportées vous permettrons d'agir à distance sur le volume et la source diffusée pour chaque zone.</em>";
            }
        }
        
        // Déterminer le titre et sous-titre à afficher pour la question 110 (télécommandes 90m2 avec 3 zones)
        if (question.id === 110) {
            // Pour la question 110, le titre et sous-titre sont déjà définis dans la définition de la question
            // Pas besoin de modification dynamique
            displayTitle = question.title;
            displaySubtitle = question.subtitle;
        }
        
        let html = `
            <h2 class="question-title">${escapeHtml(displayTitle)}</h2>
            ${displaySubtitle ? `<p class="question-subtitle${question.id === 5 ? ' micro-main-subtitle' : ''}">${displaySubtitle}</p>` : ''}
            <div class="options-container${question.id === 3 ? ' surface-options' : ''}">
        `;
        // Cas spécial pour l'étape 5 (micros)
        if (question.id === 5 && question.sub) {
            // 3.1
            const hasSelection3_1 = answers[5] !== null && answers[5] !== undefined && answers[5] !== "0";
            const hasSelection3_2 = answers['5_sub'] !== null && answers['5_sub'] !== undefined && answers['5_sub'] !== "0";
            const is3_2Disabled = hasSelection3_1;
            const is3_1Disabled = hasSelection3_2;
            
            html += `<div style='margin-bottom:16px;'>
                <div>${question.sub.title}</div>
                <div class="micro-options">`;
            question.sub.options.forEach((option, index) => {
                const escapedOption = escapeHtml(option);
                const escapedOptionForAttribute = escapeHtmlAttribute(option);
                const isSelected = answers[5] === option;
                const disabledClass = is3_1Disabled ? 'disabled' : '';
                const onclickValue = is3_1Disabled ? '' : `selectMicroOption('5','${escapeForOnclick(option)}')`;
                html += `
                    <label class="option ${isSelected ? 'selected' : ''} ${disabledClass}" onclick="${onclickValue}">
                        <input type="radio" name="question5" value="${escapedOption}" ${isSelected ? 'checked' : ''} ${is3_1Disabled ? 'disabled' : ''}>
                        <span class="option-label">${escapedOption}</span>
                    </label>
                `;
            });
            html += `</div></div>`;
            // 3.2
            html += `<div style='margin-bottom:16px;'>
                <div class="question-subtitle micro-main-subtitle">${question.sub.sub2.title}</div>
                ${question.sub.sub2.subtitle ? `<div>${question.sub.sub2.subtitle}</div>` : ''}
                <div class="micro-options">`;
            question.sub.sub2.options.forEach((option, index) => {
                const escapedOption = escapeHtml(option);
                const escapedOptionForAttribute = escapeHtmlAttribute(option);
                const isSelected = answers['5_sub'] === option;
                const disabledClass = is3_2Disabled ? 'disabled' : '';
                const onclickValue2 = is3_2Disabled ? '' : `selectMicroOption('5_sub','${escapeForOnclick(option)}')`;
                html += `
                    <label class="option ${isSelected ? 'selected' : ''} ${disabledClass}" onclick="${onclickValue2}">
                        <input type="radio" name="question5_sub" value="${escapedOption}" ${isSelected ? 'checked' : ''} ${is3_2Disabled ? 'disabled' : ''}>
                        <span class="option-label">${escapedOption}</span>
                    </label>
                `;
            });
            html += `</div></div>`;
            const canProceed = (answers[5] !== null && answers[5] !== undefined || answers['5_sub'] !== null && answers['5_sub'] !== undefined);
            // console.log('Condition bouton Suivant:', canProceed, 'answers[5]:', answers[5], 'answers[5_sub]:', answers['5_sub']);
            html += `
                <div class="button-container">
                    ${currentStep > 0 ? `<button class="btn btn-back" onclick="goBack()">
                        <svg class="back-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Retour
                    </button>` : ''}
                    <button class="btn btn-primary" onclick="nextStep()" ${canProceed ? '' : 'disabled'}>
                        Suivant
                        <svg class="next-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            // Cas normal
            let optionsToShow = question.options;
            
                          // Pour l'étape des télécommandes spéciales (ID 108), générer les options dynamiquement
              if (question.id === 108) {
                  // Récupérer le nombre de zones sélectionné selon la surface
                  let zones;
                  if (answers[3] === "Jusqu'à 70m²") {
                      zones = answers[104]; // ID de la question des zones pour "Jusqu'à 70m²"
                  } else if (answers[3] === "Jusqu'à 90m²") {
                      zones = answers[105]; // ID de la question des zones pour "Jusqu'à 90m²"
                  }
                  
                  if (zones === "1") {
                      // Pour 1 zone : option "volume + source"
                      optionsToShow = [
                          "0 commande de volume",
                          "1 commande de volume",
                          "1 commande de volume + source"
                      ];
                  } else if (zones === "2") {
                      // Pour 2 zones : nouvelles options avec sources
                      optionsToShow = [
                          "0 commande de volume",
                          "1 commande de volume + sources",
                          "2 commandes de volume + sources"
                      ];
                  }
              }
              
              // Pour l'étape des télécommandes spéciales (ID 110), les options sont déjà définies dans la question
              if (question.id === 110) {
                  // Les options sont statiques et déjà définies dans la définition de la question
                  optionsToShow = question.options;
              }
            
            optionsToShow.forEach((option, index) => {
                if (typeof option === 'string' && option.trim()) {
                    const escapedOption = escapeHtml(option);
                    const escapedOptionForAttribute = escapeHtmlAttribute(option);
                    const isSelected = answers[question.id] === option;
                    html += `
                        <label class="option ${isSelected ? 'selected' : ''}" onclick="selectOption('${escapeForOnclick(option)}')">
                            <input type="radio" name="question${question.id}" value="${escapedOption}" ${isSelected ? 'checked' : ''}>
                            <span class="option-label">${escapedOption}</span>
                        </label>
                    `;
                }
            });
            html += `
                </div>
                <div class="button-container">
                    ${currentStep > 0 ? `<button class="btn btn-back" onclick="goBack()">
                        <svg class="back-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Retour
                    </button>` : ''}
                    <button class="btn btn-primary" onclick="nextStep()" ${!answers[question.id] ? 'disabled' : ''}>
                        ${isLastStep(question.id) ? 'Voir les résultats' : 'Suivant'}
                        <svg class="next-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
        }
        questionContainer.innerHTML = html;
    } catch (error) {
        showErrorMessage('Erreur lors de l\'affichage de la question');
    }
}

// Sélectionner une option avec gestion d'erreur renforcée
function selectOption(option) {
    try {
        if (typeof option !== 'string' || !option.trim()) {
            console.error('Option invalide:', option);
            return;
        }
        
        if (typeof currentStep !== 'number' || currentStep < 0 || currentStep >= questions.length) {
            console.error('Étape invalide lors de la sélection:', currentStep);
            return;
        }
        
        const question = questions[currentStep];
        if (!question || !question.id) {
            console.error('Question invalide lors de la sélection');
            return;
        }
        
        answers[question.id] = option;
        
        // Mettre à jour l'affichage avec vérification
        const options = document.querySelectorAll('.option');
        if (options.length > 0) {
            options.forEach(opt => {
                opt.classList.remove('selected');
                const label = opt.querySelector('.option-label');
                if (label && label.textContent === option) {
                    opt.classList.add('selected');
                }
            });
        }
        
        // Activer le bouton suivant
        const nextBtn = document.querySelector('.btn-primary');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
    } catch (error) {
        console.error('Erreur lors de la sélection d\'option:', error);
    }
}

// Ajout de la fonction pour gérer la sélection des micros
function selectMicroOption(key, option) {
    try {
        if (typeof option !== 'string' || !option.trim()) {
            return;
        }
        // Réinitialiser l'autre section seulement si on ne sélectionne pas "0"
        if (option !== "0") {
            if (key === '5') {
                answers['5_sub'] = null;
            } else if (key === '5_sub') {
                answers[5] = null;
            }
        }
        answers[key] = option;
        // console.log('Sélection micro:', key, option, 'Réponses:', answers);
        showQuestion();
        
        // Forcer la mise à jour du bouton Suivant
        setTimeout(() => {
            const nextBtn = document.querySelector('.btn-primary');
            if (nextBtn) {
                const canProceed = (answers[5] !== null && answers[5] !== undefined || answers['5_sub'] !== null && answers['5_sub'] !== undefined);
                nextBtn.disabled = !canProceed;
                // console.log('Bouton mis à jour:', canProceed);
            }
        }, 100);
    } catch (error) {}
}

// Passer à l'étape suivante avec gestion d'erreur renforcée
function nextStep() {
    try {
        if (typeof currentStep !== 'number' || currentStep < 0 || currentStep >= questions.length) {
            console.error('Étape invalide lors du passage suivant:', currentStep);
            currentStep = 0;
            showQuestion();
            return;
        }
        
        const question = questions[currentStep];
        if (!question || !question.id) {
            console.error('Question invalide lors du passage suivant');
            return;
        }
        
        // Vérifier que l'utilisateur a sélectionné une option
        if (question.id === 5) {
            // Cas spécial pour l'étape 5 (micros avec sous-questions)
            if (!answers[5] && !answers['5_sub']) {
                console.warn('Aucune option sélectionnée pour l\'étape 5');
                return;
            }
        } else if (!answers[question.id]) {
            console.warn('Aucune option sélectionnée pour l\'étape:', question.id);
            return;
        }
        
        // Sauvegarder l'étape actuelle dans l'historique avant de passer à la suivante
        stepHistory.push(currentStep);
        
        // Vérifier les conditions spéciales
        if (question.id === 1 && answers[question.id] === "Sur rails") {
            // Si Sur rails est choisi, on passe à l'étape 2 bis (couleur Sur rails)
            currentStep = 6; // Index 6 = étape 102 (couleur Sur rails)
        } else if (question.id === 2) {
            // Étape couleur normale
            currentStep++;
        } else if (question.id === 3) {
            // Étape surface normale
            if (answers[question.id] === "Plus de 150m²") {
                showLoadingAnimation();
                setTimeout(() => {
                    showResults();
                }, 4000);
                return;
            }
            
            // Redirection vers la page de zones appropriée selon la surface
            if (answers[question.id] === "Jusqu'à 70m²") {
                // Rediriger vers la page de zones limitée à 1-2 zones
                currentStep = 10; // Index 10 = étape 104 (zones 1-2)
            } else if (answers[question.id] === "Jusqu'à 90m²") {
                // Rediriger vers la page de zones limitée à 1-3 zones
                currentStep = 11; // Index 11 = étape 105 (zones 1-3)
            } else if (answers[question.id] === "Jusqu'à 150m²") {
                // Rediriger vers la page de zones normale (1-4+ zones)
                currentStep = 12; // Index 12 = étape 106 (zones 1-4+)
            } else {
                currentStep++;
            }
            // console.log('DEBUG: Après étape 3, currentStep =', currentStep, 'question suivante =', questions[currentStep]);
        } else if (question.id === 102) {
            // Étape couleur Sur rails
            currentStep++;
        } else if (question.id === 103) {
            // Étape surface Sur rails
            if (answers[question.id] === "au-delà de 250m²") {
                showLoadingAnimation();
                setTimeout(() => {
                    showResults();
                }, 4000);
                return;
            }
            // Passer à l'étape 7 (télécommande Sur rails)
            currentStep = 8; // Index 8 = étape 7 (télécommande Sur rails)
        } else if (question.id === 4) {
            // Étape nombre de zones (parcours normal uniquement)
            if (answers[question.id] === "Plus de 4 zones") {
                showLoadingAnimation();
                setTimeout(() => {
                    showResults();
                }, 4000);
                return;
            }
            currentStep++;
        } else if (question.id === 104) {
            // Étape zones 1-2 (Jusqu'à 70m²)
            currentStep = 14; // Passer à l'étape 108 (télécommandes spéciales)
        } else if (question.id === 105) {
            // Étape zones 1-3 (Jusqu'à 90m²)
            if (answers[question.id] === "1" || answers[question.id] === "2") {
                // Pour 1 ou 2 zones, utiliser la même logique que le parcours "70m2"
                currentStep = 14; // Passer à l'étape 108 (télécommandes spéciales)
            } else {
                // Pour 3 zones, utiliser la nouvelle page de télécommandes spéciales
                currentStep = 16; // Passer à l'étape 110 (télécommandes spéciales 90m2 avec 3 zones)
            }
        } else if (question.id === 106) {
            // Étape zones 1-4+ (Jusqu'à 150m²)
            if (answers[question.id] === "Plus de 4 zones") {
                showLoadingAnimation();
                setTimeout(() => {
                    showResults();
                }, 4000);
                return;
            }
            currentStep = 4; // Passer à l'étape 5 (micros)

        } else if (question.id === 108) {
            // Étape télécommandes spéciales (Jusqu'à 70m²)
            currentStep = 13; // Passer à l'étape 107 (micro d'appel spécial)
            showQuestion();
            updateProgress();
            return;
        } else if (question.id === 107) {
            // Étape micro d'appel spécial (Jusqu'à 70m²)
            // Passer à la question Bluetooth avant les résultats
            currentStep = 15; // Index 15 = étape 109 (question Bluetooth)
            showQuestion();
            updateProgress();
            return;
        } else if (question.id === 110) {
            // Étape télécommandes spéciales (Jusqu'à 90m² avec 3 zones)
            if (answers[question.id] === "0 commandes de volume") {
                // Si 0 télécommandes, utiliser la même suite de questions que le parcours "70m2" après avoir cliqué sur 2 zones puis 0 ou 1 télécommande de volume
                currentStep = 13; // Passer à l'étape 107 (micro d'appel spécial)
            } else {
                // Si 1, 2 ou 3 télécommandes, afficher la nouvelle page de micro avec 0, 1 ou 2 micros
                currentStep = 17; // Passer à l'étape 111 (micro d'appel spécial 90m2 avec 3 zones)
            }
            showQuestion();
            updateProgress();
            return;
        } else if (question.id === 5) {
            // Étape micros (parcours normal uniquement)
            currentStep++;
        } else if (question.id === 6) {
            // Étape commande de volume (parcours normal uniquement)
            // Passer à la question Bluetooth avant les résultats
            currentStep = 15; // Index 15 = étape 109 (question Bluetooth)
            showQuestion();
            updateProgress();
            return;
        } else if (question.id === 7) {
            // Étape télécommande (uniquement pour "Sur rails")
            currentStep++;
        } else if (question.id === 8) {
            // Étape nombre de zones (uniquement pour "Sur rails")
            if (answers[question.id] === "Plus dune zone") {
                // Passer à la question Bluetooth avant les résultats
                currentStep = 15; // Index 15 = étape 109 (question Bluetooth)
                showQuestion();
                updateProgress();
                return;
            } else {
                currentStep++;
            }
        } else if (question.id === 111) {
            // Étape micro d'appel spécial (Jusqu'à 90m² avec 3 zones)
            // Passer à la question Bluetooth avant les résultats
            currentStep = 15; // Index 15 = étape 109 (question Bluetooth)
            showQuestion();
            updateProgress();
            return;
        } else if (question.id === 109) {
            // Question Bluetooth pour tous les parcours
            // Aller aux résultats après la question Bluetooth
            showLoadingAnimation();
            setTimeout(() => {
                showResults();
            }, 4000);
            return;
        } else {
            currentStep++;
        }
        
        // Vérifier si on a terminé
        if (currentStep >= questions.length) {
            showLoadingAnimation();
            setTimeout(() => {
                showResults();
            }, 4000);
            return;
        }
        
        showQuestion();
        updateProgress();
    } catch (error) {
        console.error('Erreur lors du passage à l\'étape suivante:', error);
        showErrorMessage('Erreur lors du passage à l\'étape suivante');
    }
}

// Mettre à jour la barre de progression avec gestion d'erreur renforcée
function updateProgress() {
    try {
        const progressFill = getElementSafely('progressFill');
        if (!progressFill) {
            console.warn('Élément de progression non trouvé');
            return;
        }
        
        // Vérifier si on est sur la page des résultats
        const resultsContainer = getElementSafely('resultsContainer');
        if (resultsContainer && resultsContainer.style.display === 'block') {
            // Si on est sur la page des résultats, la barre doit être à 100%
            progressFill.style.width = '100%';
            return;
        }
        
        if (typeof currentStep !== 'number' || typeof questions.length !== 'number') {
            console.error('Données de progression invalides');
            return;
        }
        
        const progress = Math.min(Math.max(((currentStep + 1) / questions.length) * 100, 0), 100);
        progressFill.style.width = progress + '%';
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la progression:', error);
    }
}

// Fonction pour afficher l'animation de chargement
function showLoadingAnimation() {
    try {
        const questionContainer = getElementSafely('questionContainer');
        const resultsContainer = getElementSafely('resultsContainer');
        const header = document.querySelector('header');
        const progressBar = document.querySelector('.progress-bar');
        
        if (!questionContainer || !resultsContainer) {
            console.error('Éléments de conteneur manquants pour l\'animation de chargement');
            return;
        }
        
        // Masquer l'en-tête et la barre de progression
        if (header) header.style.display = 'none';
        if (progressBar) progressBar.style.display = 'none';
        
        // Masquer le conteneur de questions
        questionContainer.style.display = 'none';
        
        // Afficher le conteneur de résultats avec l'animation de chargement
        resultsContainer.style.display = 'block';
        
        // Créer le HTML pour l'animation de chargement spécifique
        let html = '<div class="loading-container" style="text-align: center; padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh;">';
        html += '<div class="loading-logo-container">';
        
        // Utiliser le bon logo selon le thème
        const logoSource = currentTheme === 'dark' ? 'logo_sofi_white.png' : 'logo_sofi_black.png';
        html += `<img src="${logoSource}" alt="SOFI" class="loading-logo" style="max-width: 177px; height: auto; animation: logoPulse 2s ease-in-out infinite;">`;
        
        html += '</div>';
        html += '<div class="loading-text-container" style="margin-top: 40px;">';
        
        // Utiliser la bonne couleur de texte selon le thème
        const textColor = currentTheme === 'dark' ? '#ffffff' : '#2d2d2d';
        html += `<div class="loading-text" style="font-size: 2rem; font-weight: 600; color: ${textColor};">`;
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite;">S</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.08s;">O</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.16s;">F</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.24s;">I</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.32s;">&nbsp;</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.4s;">p</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.48s;">a</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.56s;">r</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.64s;">&nbsp;</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.72s;">M</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.8s;">i</span>';
        html += '<span class="loading-char" style="animation: colorWave 2s ease-in-out infinite 0.88s;">D</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        resultsContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage de l\'animation de chargement:', error);
        // En cas d'erreur, afficher directement les résultats
        showResults();
    }
}

// Afficher les résultats avec gestion d'erreur renforcée
function showResults() {
    try {
        calculateMaterials();
        
        const questionContainer = getElementSafely('questionContainer');
        const resultsContainer = getElementSafely('resultsContainer');
        const header = document.querySelector('header');
        const progressBar = document.querySelector('.progress-bar');
        
        if (!questionContainer || !resultsContainer) {
            console.error('Éléments de résultats manquants');
            showErrorMessage('Erreur lors de l\'affichage des résultats');
            return;
        }
        
        // Restaurer l'affichage de l'en-tête et de la barre de progression
        if (header) header.style.display = 'block';
        if (progressBar) progressBar.style.display = 'block';
        
        questionContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        // Mettre à jour la barre de progression à 100% pour la page des résultats
        updateProgress();
        
        let html = '<div class="solution-title-container">';
        html += '<div class="solution-title-tag">';
        html += '<h2>Solution proposée</h2>';
        html += '</div>';
        html += '</div>';
        
        if (!Array.isArray(materials) || materials.length === 0) {
            html += '<div class="material-item">Aucun matériel recommandé pour cette configuration</div>';
        } else {
            // Vérifier si c'est un message de devis
            const isDevisMessage = materials.length === 1 && materials[0].includes("Demander un devis sur mesure");
            
            if (isDevisMessage) {
                // Design avec cadre pour les pages "devis sur mesure"
                html += `<div class="devis-frame">`;
                html += `<div class="devis-frame-content">`;
                html += `<div class="material-item devis-message">${escapeHtml(materials[0])}</div>`;
                
                // Questionnaire rapide adapté selon le chemin de devis
                const devisPath = getDevisPath();
                if (devisPath) {
                    html += `<div class="quick-survey">`;
                    html += `<h3>Questionnaire rapide pour étude détaillée</h3>`;
                    html += `<form id="quickSurveyForm">`;
                    
                    // Questions communes à tous les chemins
                    html += `<div class="survey-question">`;
                    html += `<label for="otherInfo">Autres informations utiles à l'étude du projet ?</label>`;
                    html += `<textarea id="otherInfo" name="otherInfo" rows="4" placeholder="Décrivez vos besoins spécifiques, contraintes techniques, etc."></textarea>`;
                    html += `</div>`;
                    
                    // Questions spécifiques selon le chemin
                    if (devisPath === 'sur_rails_surface' || devisPath === 'sur_rails_zones') {
                        // Questionnaire Sur rails (déjà existant)
                        html += `<div class="survey-question">`;
                        html += `<label for="zonesCount">Question 1 : Nombre de zones</label>`;
                        html += `<input type="number" id="zonesCount" name="zonesCount" min="1" max="20" placeholder="Ex: 3">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="sourcesCount">Question 2 : Nombre de sources</label>`;
                        html += `<input type="number" id="sourcesCount" name="sourcesCount" min="1" max="10" placeholder="Ex: 2">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="volumeControl">Question 3 : Besoin de télécommande de volume ?</label>`;
                        html += `<select id="volumeControl" name="volumeControl" onchange="toggleVolumeCountQuestion()">`;
                        html += `<option value="">Sélectionnez...</option>`;
                        html += `<option value="non">Non</option>`;
                        html += `<option value="oui">Oui</option>`;
                        html += `</select>`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question" id="volumeCountQuestion" style="display: none;">`;
                        html += `<label for="volumeCount">Si oui, combien de télécommandes ?</label>`;
                        html += `<input type="number" id="volumeCount" name="volumeCount" min="1" max="20" placeholder="Ex: 3">`;
                        html += `</div>`;
                    } else if (devisPath === 'surface_250m2') {
                        // Questionnaire pour surface > 250m²
                        html += `<div class="survey-question">`;
                        html += `<label for="zonesCount">Question 1 : Nombre de zones</label>`;
                        html += `<input type="number" id="zonesCount" name="zonesCount" min="1" max="20" placeholder="Ex: 3">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="microSameZone">Question 2 : Nombre de micros d'appel général</label>`;
                        html += `<input type="number" id="microSameZone" name="microSameZone" min="0" max="10" placeholder="Ex: 2">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="microMultiZone">Question 3 : Nombre de micros d'appel indépendant</label>`;
                        html += `<input type="number" id="microMultiZone" name="microMultiZone" min="0" max="10" placeholder="Ex: 1">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="volumeType">Question 4 : Type de commande de volume</label>`;
                        html += `<input type="text" id="volumeType" name="volumeType" placeholder="Ex: Volume uniquement, ou Volume + Source, ou mixte...">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="volumeCount">Question 5 : Nombre de télécommandes</label>`;
                        html += `<input type="number" id="volumeCount" name="volumeCount" min="0" max="50" placeholder="Ex: 3">`;
                        html += `</div>`;
                    } else if (devisPath === 'zones_plus_4') {
                        // Questionnaire pour plus de 4 zones
                        html += `<div class="survey-question">`;
                        html += `<label for="zonesCount">Question 1 : Nombre de zones</label>`;
                        html += `<input type="number" id="zonesCount" name="zonesCount" min="1" max="20" placeholder="Ex: 6">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="volumeCount">Question 2 : Nombre de télécommandes</label>`;
                        html += `<input type="number" id="volumeCount" name="volumeCount" min="0" max="50" placeholder="Ex: 8">`;
                        html += `</div>`;
                        
                        html += `<div class="survey-question">`;
                        html += `<label for="volumeType">Question 3 : Type de télécommandes</label>`;
                        html += `<textarea id="volumeType" name="volumeType" rows="3" placeholder="Ex: Volume uniquement, ou Volume + Source, ou mixte..."></textarea>`;
                        html += `</div>`;
                    }
                    
                    html += `<div class="survey-actions">`;
                    html += `<button type="button" class="btn btn-secondary" onclick="downloadCahierDesChargesWithSurvey()">Télécharger le cahier des charges</button>`;
                    html += `<p class="download-note"><em>Merci de joindre au mail tous les fichiers utiles à l'étude (plans, photos et autres).</em></p>`;
                    html += `</div>`;
                    html += `</form>`;
                    html += `</div>`;
                } else {
                    html += `<div class="devis-actions">`;
                    html += `<button class="btn btn-secondary" onclick="downloadCahierDesCharges()">Télécharger le cahier des charges</button>`;
                    html += `<p class="download-note"><em>Merci de joindre au mail tous les fichiers utiles à l'étude (plans, photos et autres).</em></p>`;
                    html += `</div>`;
                }
                
                // Ajouter le bouton de retour en arrière en bas de page dans le cadre
                html += `<div class="devis-actions">`;
                html += `<button class="btn btn-back" onclick="goBack()">
                    <svg class="back-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Retour en arrière
                </button>`;
                html += `</div>`;
                html += `</div>`;
                html += `</div>`;
            } else {
                // Nouveau design avec étiquettes symétriques et aérées - chaque carte est une étiquette de premier niveau
                // (uniquement pour la page finale avec la liste du matériel)
                
                // Conteneur pour les cartes horizontales
                html += '<div class="results-cards-container">';
                
                // Étiquette 1 : Liste du matériel
                html += '<div class="result-card materials-card">';
                html += '<div class="card-header">';
                html += '<h3>📦 Liste du matériel recommandé</h3>';
                html += '</div>';
                html += '<div class="card-content">';
                
                // Trier les matériaux par marque
                const sortedMaterials = sortMaterialsByBrand(materials);
                
                // Afficher les matériaux triés
                sortedMaterials.forEach(material => {
                    if (typeof material === 'string' && material.trim()) {
                        html += `<div class="material-item">${escapeHtml(material)}</div>`;
                    }
                });
                html += '</div>';
                html += '</div>';
                
                // Étiquette 2 : Fiches produits (si disponibles)
                const availableDatasheets = generateDatasheetLinks(materials);
                if (availableDatasheets.length > 0) {
                    html += '<div class="result-card datasheets-card">';
                    html += '<div class="card-header">';
                    html += '<h3>📋 Fiches produits</h3>';
                    html += '</div>';
                    html += '<div class="card-content">';
                    html += '<div class="datasheets-header" onclick="toggleDatasheets()">';
                    html += '<span>Voir les fiches techniques</span>';
                    html += '<span class="datasheets-toggle">▼</span>';
                    html += '</div>';
                    html += '<div class="datasheets-content" id="datasheetsContent" style="display: none;">';
                    html += '<div class="datasheets-grid">';
                    
                    availableDatasheets.forEach(datasheet => {
                        html += `<div class="datasheet-item">`;
                        // Détecter si on est dans Electron pour ajuster le comportement
                        const isElectron = window && window.process && window.process.type;
                        if (isElectron) {
                            // Dans Electron, utiliser un gestionnaire d'événements personnalisé
                            html += `<a href="#" onclick="openDatasheet('${escapeHtml(datasheet.file)}', '${escapeHtml(datasheet.displayName)}')" class="datasheet-link">`;
                        } else {
                            // Dans le navigateur, utiliser le lien normal
                            html += `<a href="${escapeHtml(datasheet.file)}" target="_blank" class="datasheet-link">`;
                        }
                        html += `<span class="datasheet-icon">📄</span>`;
                        html += `<span class="datasheet-name">${escapeHtml(datasheet.displayName)}</span>`;
                        html += `</a>`;
                        html += `</div>`;
                    });
                    
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                }
                
                // Étiquette 3 : Temps d'installation
                html += '<div class="result-card installation-card">';
                html += '<div class="card-header">';
                html += '<h3>⏱️ Temps d\'installation</h3>';
                html += '</div>';
                html += '<div class="card-content">';
                html += `<p>${escapeHtml(calculateInstallationTime())}</p>`;
                html += '</div>';
                html += '</div>';
                
                // Étiquette 4 : Consommation électrique
                html += '<div class="result-card consumption-card">';
                html += '<div class="card-header">';
                html += '<h3>⚡ Consommation électrique</h3>';
                html += '</div>';
                html += '<div class="card-content">';
                const totalConsumption = calculateElectricalConsumption(materials);
                if (totalConsumption > 0) {
                    html += `<p>Consommation électrique approximative de la solution pour une utilisation d'ambiance : <strong>${totalConsumption}W</strong></p>`;
                } else {
                    html += '<p>Aucune consommation électrique calculable pour cette configuration</p>';
                }
                html += '</div>';
                html += '</div>';
                
                // Étiquette 5 : Documents de garantie
                html += '<div class="result-card warranty-card">';
                html += '<div class="card-header">';
                html += '<h3>🛡️ Documents de garantie</h3>';
                html += '</div>';
                html += '<div class="card-content">';
                html += '<p>Disponibles sur demande</p>';
                html += '</div>';
                html += '</div>';
                
                // Fermer le conteneur des cartes
                html += '</div>';
                
                // Bouton de téléchargement final en bas de page
                html += '<div class="final-download-section">';
                html += '<button class="btn btn-final-download" onclick="downloadListeMateriel()">';
                html += '<span class="btn-text">Télécharger la liste de matériel</span>';
                html += '<span class="btn-shine"></span>';
                html += '</button>';
                html += '</div>';
                
                // Section cas exceptionnels
                html += '<div class="exceptional-cases-section">';
                html += '<div class="exceptional-cases-header">';
                html += '<h3>⚠️ Cas exceptionnels</h3>';
                html += '<p class="exceptional-cases-description">Si les réponses proposées ne correspondent pas à votre structure, renseigner les informations nécessaires à l\'étude dans le champs ci-dessous puis envoyer le pdf par mail à nos techniciens : <strong>mt@mid.audio</strong></p>';
                html += '</div>';
                html += '<div class="exceptional-cases-content" id="exceptionalCasesContent" style="display: none;">';
                                    html += '<textarea id="exceptionalCasesText" placeholder="Décrivez votre configuration spécifique, contraintes techniques, besoins particuliers..."></textarea>';
                    html += '<button class="btn btn-primary" onclick="downloadExceptionalCasesPDF()">Télécharger le PDF</button>';
                    html += '<p class="download-note"><em>Merci de joindre au mail tous les fichiers utiles à l\'étude (plans, photos et autres).</em></p>';
                    html += '</div>';
                html += '<button class="btn btn-secondary" id="exceptionalCasesBtn" onclick="toggleExceptionalCases()">Cas exceptionnels</button>';
                html += '</div>';
            }
        }
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error('Erreur lors de l\'affichage des résultats:', error);
        showErrorMessage('Erreur lors de l\'affichage des résultats');
    }
}

// Calculer la liste du matériel avec gestion d'erreur renforcée
function calculateMaterials() {
    try {
        materials = [];
        if (typeof answers !== 'object' || answers === null) {
            materials.push("Erreur de données");
            return;
        }
        // Récupération des réponses
        const speaker = answers[1];
        const color = answers[2];
        const surface = answers[3];
        
        // Gestion des zones selon la surface sélectionnée
        let zones;
        if (surface === "Jusqu'à 70m²") {
            zones = answers[104]; // Page de zones spécialisée 1-2
        } else if (surface === "Jusqu'à 90m²") {
            zones = answers[105]; // Page de zones spécialisée 1-3
        } else if (surface === "Jusqu'à 150m²") {
            zones = answers[106]; // Page de zones spécialisée 1-4+
        } else {
            zones = answers[4]; // Page de zones normale (fallback)
        }
        
        const microSameZone = answers[5]; // Maintenant à l'étape 5
        const microMultiZone = answers['5_sub']; // Maintenant à l'étape 5
        const volumeControl = answers[6];
        const microSpecial70m2 = answers[107]; // Micro d'appel spécial pour "Jusqu'à 70m²"
        const telecommandesSpeciales = answers[108]; // Télécommandes spéciales pour "Jusqu'à 70m²"
        const telecommandesSpeciales90m2_3zones = answers[110]; // Télécommandes spéciales pour "Jusqu'à 90m²" avec 3 zones
        const remoteVolume = answers[7]; // Nouvelle étape pour Sur rails
        const zonesSurRails = answers[8]; // Nouvelle étape nombre de zones pour Sur rails
        
        // Vérifier le nombre de zones (doit être fait en premier)
        if (zones === "Plus de 4 zones") {
            materials.push("Demander un devis sur mesure : mt@mid.audio");
            return;
        }
        
        // Mapping des choix vers les produits réels
        let speakerProduct = '';
        switch(speaker) {
            case "Plafonniers": speakerProduct = "IC3"; break;
            case "Suspendus": speakerProduct = "UC106"; break;
            case "Mural": speakerProduct = "eMOTUS5OD"; break;
            case "Sur rails": speakerProduct = "Wispeak TUBE"; break;
            default: speakerProduct = "IC3"; // Fallback
        }
        
        // Gestion Wispeak
        if (speaker === "Sur rails") {
            if (surface === "au-delà de 250m²") {
                materials.push("Demander un devis sur mesure : mt@mid.audio");
                return;
            }
            
            // Vérifier le nombre de zones pour Sur rails
            if (zonesSurRails === "Plus d'une zone") {
                materials.push("Demander un devis sur mesure : mt@mid.audio");
                return;
            }
            
            // Vérifier que surface est défini
            if (!surface) {
                materials.push("Erreur : Surface non définie");
                return;
            }
            
            let quantity = 4;
            switch(surface) {
                case "40m²": quantity = 4; break;
                case "60m²": quantity = 6; break;
                case "80m²": quantity = 8; break;
                case "120m²": quantity = 12; break;
                default: quantity = 4; // Fallback
            }
            materials.push(`${quantity} x ${addEclerBrand('TUBE Wispeak')} ${color}`);
            materials.push(`1 x ${addEclerBrand('Core')}`);
            
            // Ajout de la télécommande de volume si demandée
            if (remoteVolume === "Oui") {
                materials.push(`1 x ${addEclerBrand('WPaVOL')}`);
            }
            
            return;
        }
        
        // Gestion surface
        if (surface === "Plus de 150m²") {
            materials.push("Demander un devis sur mesure : mt@mid.audio");
            return;
        }
        
        // Vérifier que surface est défini
        if (!surface) {
            materials.push("Erreur : Surface non définie");
            return;
        }
        
        let quantity = 4;
        switch(surface) {
            case "Jusqu'à 70m²": quantity = 4; break;
            case "Jusqu'à 90m²": quantity = 6; break;
            case "Jusqu'à 150m²": quantity = 8; break;
            default: quantity = 4; // Fallback
        }
        
        materials.push(`${quantity} x ${addEclerBrand(speakerProduct)} ${color}`);
        materials.push("1 x Câble Kordz One 14AWG 2C");
        
        // Gestion micros (3.1 et 3.2)
        let nbMicroSameZone = parseInt(microSameZone) || 0;
        let nbMicroMultiZone = parseInt(microMultiZone) || 0;
        // Consolidation des micros pour éviter les doublons
        let totalMicros = nbMicroSameZone + nbMicroMultiZone;
        if (totalMicros > 0) {
            materials.push(`${totalMicros} x ${addEclerBrand('eMBASE')} + ${addEclerBrand('eMCN2')}`);
        }
        
        // Calcul du nombre de CNX-CBO (total des micros moins les WPaMIX-T)
        let nbCNXCBO = totalMicros;
        // On soustraira les WPaMIX-T plus tard quand on connaîtra leur nombre
        
        // Cas spéciaux pour les amplificateurs et la matrice
        let amplificateur = '';
        let addWPaMIX = 0;
        
        // Gestion des télécommandes pour le parcours "Jusqu'à 70m²" et "Jusqu'à 90m²" (zones 1-2)
        let volumeControlToUse = volumeControl;
        if ((surface === "Jusqu'à 70m²" || surface === "Jusqu'à 90m²") && telecommandesSpeciales) {
            volumeControlToUse = telecommandesSpeciales;
        }
        
        // Gestion des télécommandes pour le parcours "Jusqu'à 90m²" avec 3 zones
        if (surface === "Jusqu'à 90m²" && zones === "3" && telecommandesSpeciales90m2_3zones) {
            volumeControlToUse = telecommandesSpeciales90m2_3zones;
        }
        
        // Vérifier si on a une commande volume + source (force MZ140Q)
        const hasVolumeSource = volumeControlToUse && volumeControlToUse.includes("+ source");
        
        // NOUVELLE LOGIQUE : Sélection d'amplificateur basée sur les zones ET micros pour "Jusqu'à 70m²" et "Jusqu'à 90m²" (zones 1-2)
        if ((surface === "Jusqu'à 70m²" || (surface === "Jusqu'à 90m²" && (zones === "1" || zones === "2"))) && zones && microSpecial70m2) {
            if (zones === "1") {
                switch(microSpecial70m2) {
                    case "0":
                        amplificateur = "1 x eCA120HZ";
                        break;
                    case "1":
                        amplificateur = "1 x CA120HZ";
                        break;
                }
            } else if (zones === "2") {
                // Pour 2 zones, sélectionner HH MZ 140Q
                amplificateur = "1 x HH Audio MZ140Q";
            }
        }
        
        // NOUVELLE LOGIQUE : Sélection d'amplificateur pour "Jusqu'à 90m²" avec 3 zones
        if (surface === "Jusqu'à 90m²" && zones === "3") {
            // Pour 3 zones, l'amplificateur dépend du choix des télécommandes
            if (telecommandesSpeciales90m2_3zones === "0 commandes de volume") {
                // Si 0 télécommandes, utiliser HH MZ 140Q
                amplificateur = "1 x HH Audio MZ140Q";
            } else {
                // Si 1, 2 ou 3 commandes de volume + sources, utiliser HH MZ 140Q
                amplificateur = "1 x HH Audio MZ140Q";
            }
        }
        

        
        // Si aucun amplificateur n'a été défini par la logique spéciale, utiliser la logique standard
        if (!amplificateur) {
            // Gestion zones et amplis (logique standard)
            if ((zones === "1" || zones === "2") && (nbMicroSameZone === 0 && nbMicroMultiZone === 0)) {
                // Zones 1-2 avec 0 micros : selon les commandes de volume
                if (hasVolumeSource) {
                    amplificateur = '1 x HH Audio MZ140Q';
                } else if (volumeControl && volumeControl.includes("commande de volume")) {
                    // Plus d'eHMA250, toujours MZ140Q pour les commandes de volume
                    amplificateur = '1 x HH Audio MZ140Q';
                } else if (!volumeControl) {
                    amplificateur = addEclerBrand('eHMA120');
                }
            } else if ((zones === "1" || zones === "2") && (nbMicroSameZone >= 1 && nbMicroSameZone <= 4)) {
                // Plus d'eHMA250, toujours MZ140Q pour les micros
                amplificateur = '1 x HH Audio MZ140Q';
            } else if ((zones === "1" || zones === "2") && (nbMicroMultiZone >= 1 && nbMicroMultiZone <= 4)) {
                amplificateur = '1 x HH Audio MZ140Q';
            } else if ((zones === "3" || zones === "4") && (nbMicroMultiZone >= 0)) {
                amplificateur = '1 x HH Audio MZ140Q';
            } else if (zones === "Plus de 4 zones") {
                materials.push("Demander un devis sur mesure : mt@mid.audio");
                return;
            }
            
            // Si commande volume + source, forcer MZ140Q
            if (hasVolumeSource && amplificateur !== '1 x HH Audio MZ140Q') {
                if (amplificateur === addEclerBrand('eHMA120')) {
                    amplificateur = '1 x HH Audio MZ140Q';
                }
            }
            
            // Si eHMA120 avec volume simple, forcer MZ140Q (plus d'eHMA250)
            if (amplificateur === addEclerBrand('eHMA120') && volumeControl && volumeControl.includes("commande de volume")) {
                amplificateur = '1 x HH Audio MZ140Q';
            }
            
            // Cas où commande volume + source mais aucun amplificateur sélectionné
            if (hasVolumeSource && !amplificateur) {
                amplificateur = '1 x HH Audio MZ140Q';
            }
        }
        
        // Cas MZ140Q avec plus de 2 micros
        if (amplificateur === '1 x HH Audio MZ140Q') {
            if (nbMicroMultiZone > 2) {
                addWPaMIX = nbMicroMultiZone - 2; // 1 WPaMIX-T par micro supplémentaire
            }
        }
        
        // Ajout de l'amplificateur si défini
        if (amplificateur) {
            if (amplificateur === '1 x HH Audio MZ140Q') {
                materials.push(amplificateur);
            } else {
                // Extraire la quantité et le nom du produit
                const match = amplificateur.match(/^(\d+)\s*x\s*(.+)$/);
                if (match) {
                    const quantity = match[1];
                    const productName = match[2];
                    materials.push(`${quantity} x Amplificateur ${productName}`);
                } else {
                    // Fallback si le format n'est pas reconnu
                    materials.push(amplificateur);
                }
            }
        }
        
        // Ajout WPaMIX-T si besoin
        if (addWPaMIX > 0) {
            materials.push(`${addWPaMIX} x ${addEclerBrand('WPaMIX-T')}`);
        }
        
        // Ajout CNX-CBO (total des micros moins les WPaMIX-T)
        if (totalMicros > 0) {
            let nbCNXCBO = totalMicros - addWPaMIX;
            if (nbCNXCBO > 0) {
                materials.push(`${nbCNXCBO} x ${addEclerBrand('CNX-CBO')}`);
            }
        }
        
        // NOUVELLE LOGIQUE : Affichage des télécommandes dans la liste du matériel
        console.log("=== DÉBOGAGE TÉLÉCOMMANDES ===");
        console.log("Surface:", surface);
        console.log("Télécommandes spéciales:", telecommandesSpeciales);
        console.log("Télécommandes spéciales 90m2 3 zones:", telecommandesSpeciales90m2_3zones);
        console.log("Type de télécommandes spéciales:", typeof telecommandesSpeciales);
        console.log("Amplificateur:", amplificateur);
        console.log("Couleur:", color);
        console.log("Condition surface === 'Jusqu'à 70m²':", surface === "Jusqu'à 70m²");
        console.log("Condition telecommandesSpeciales truthy:", !!telecommandesSpeciales);
        console.log("Condition complète:", surface === "Jusqu'à 70m²" && telecommandesSpeciales);
        
        // Gestion des télécommandes spéciales pour "70m2" et "90m2" zones 1-2
        if ((surface === "Jusqu'à 70m²" || (surface === "Jusqu'à 90m²" && (zones === "1" || zones === "2"))) && telecommandesSpeciales) {
            console.log("Condition surface et télécommandes spéciales OK");
            if (telecommandesSpeciales === "0 commande de volume") {
                console.log("0 commande de volume - rien à afficher");
                // Rien afficher
            } else {
                console.log("Télécommandes spéciales sélectionnées:", telecommandesSpeciales);
                // NOUVELLE LOGIQUE : Si l'amplificateur est "HH Audio MZ140Q", utiliser les télécommandes HH MZ-C2-EU
                console.log("Vérification amplificateur:", amplificateur);
                console.log("Comparaison avec '1 x HH Audio MZ140Q':", amplificateur === "1 x HH Audio MZ140Q");
                if (amplificateur === "1 x HH Audio MZ140Q") {
                    console.log("Amplificateur HH Audio MZ140Q détecté - ajout télécommandes HH MZ-C2-EU");
                    
                    // Extraire le nombre de télécommandes selon l'option sélectionnée
                    let nbCmd = 1;
                    if (telecommandesSpeciales === "1 commande de volume + sources") {
                        nbCmd = 1;
                    } else if (telecommandesSpeciales === "2 commandes de volume + sources") {
                        nbCmd = 2;
                    }
                    console.log("Nombre de télécommandes:", nbCmd);
                    
                    // Ajouter la télécommande selon la couleur
                    if (color === "blanc" || color === "Blanc") {
                        console.log("Ajout télécommande blanche");
                        materials.push(`${nbCmd} x HH MZ-C2-EU WH`);
                    } else if (color === "noir" || color === "Noir") {
                        console.log("Ajout télécommande noire");
                        materials.push(`${nbCmd} x HH MZ-C2-EU BK`);
                    } else {
                        console.log("Couleur non reconnue, utilisation par défaut");
                        materials.push(`${nbCmd} x HH MZ-C2-EU WH`); // Couleur par défaut
                    }
                } else {
                     console.log("Autre amplificateur - logique existante");
                     // Logique existante pour les autres amplificateurs
                     if (telecommandesSpeciales === "1 commande de volume") {
                         materials.push("1 x WPaVOL");
                     } else if (telecommandesSpeciales === "1 commande de volume + source") {
                         // NOUVELLE LOGIQUE : Pour "volume + source", ajouter WPaVOL-SR
                         console.log("Commande volume + source détectée - ajout WPaVOL-SR");
                         materials.push("1 x WPaVOL-SR");
                     }
                 }
            }
        } else {
            console.log("Condition non remplie - surface ou télécommandes spéciales manquantes");
            console.log("Surface attendue: 'Jusqu'à 70m²', reçue:", surface);
            console.log("Télécommandes spéciales attendues: truthy, reçues:", telecommandesSpeciales);
        }
        
        // Gestion des télécommandes spéciales pour "90m2" avec 3 zones
        if (surface === "Jusqu'à 90m²" && zones === "3" && telecommandesSpeciales90m2_3zones) {
            console.log("=== DÉBOGAGE TÉLÉCOMMANDES 90M2 3 ZONES ===");
            console.log("Télécommandes spéciales 90m2 3 zones:", telecommandesSpeciales90m2_3zones);
            console.log("Amplificateur:", amplificateur);
            console.log("Couleur:", color);
            
            if (telecommandesSpeciales90m2_3zones === "0 commandes de volume") {
                console.log("0 commande de volume - rien à afficher");
                // Rien afficher
            } else {
                console.log("Télécommandes spéciales 90m2 3 zones sélectionnées:", telecommandesSpeciales90m2_3zones);
                
                // Extraire le nombre de télécommandes
                let nbCmd = 1;
                if (telecommandesSpeciales90m2_3zones.startsWith("2")) nbCmd = 2;
                if (telecommandesSpeciales90m2_3zones.startsWith("3")) nbCmd = 3;
                console.log("Nombre de télécommandes:", nbCmd);
                
                // Si l'amplificateur est HH Audio MZ140Q, utiliser les télécommandes HH MZ-C2-EU
                if (amplificateur === "1 x HH Audio MZ140Q") {
                    console.log("Amplificateur HH Audio MZ140Q détecté - ajout télécommandes HH");
                    
                    // Ajouter la télécommande selon la couleur
                    if (color === "blanc" || color === "Blanc") {
                        console.log("Ajout télécommande blanche");
                        materials.push(`${nbCmd} x HH MZ-C2-EU WH`);
                    } else if (color === "noir" || color === "Noir") {
                        console.log("Ajout télécommande noire");
                        materials.push(`${nbCmd} x HH MZ-C2-EU BK`);
                    } else {
                        console.log("Couleur non reconnue:", color);
                    }

                } else {
                    console.log("Autre amplificateur - logique par défaut");
                    // Logique par défaut pour les autres amplificateurs
                    materials.push(`${nbCmd} x WPaVOL-SR`);
                }
            }
        }
        
        // Cas où surface > 250m² ou zones > 4 déjà traités plus haut
        // Cas où aucun matériel n'est sélectionné
        if (materials.length === 0) {
            materials.push("Aucun matériel recommandé pour cette configuration");
        }
        
        // NOUVELLE LOGIQUE : Ajout du récepteur Bluetooth si demandé
        const bluetoothReceptor = answers[109]; // Question Bluetooth (ID 109)
        if (bluetoothReceptor === "Oui") {
            materials.push("1 x " + addEclerBrand("WPaBT"));
        }
        
        // NOUVELLE LOGIQUE : Affichage des micros dans la liste du matériel
        if ((surface === "Jusqu'à 70m²" || (surface === "Jusqu'à 90m²" && (zones === "1" || zones === "2"))) && microSpecial70m2) {
            if (microSpecial70m2 === "0") {
                // 0 micro - rien à afficher
                console.log("0 micro sélectionné - rien à afficher");
            } else if (microSpecial70m2 === "1") {
                // 1 micro - afficher eMBASE + eMCN2
                console.log("1 micro sélectionné - ajout eMBASE + eMCN2");
                materials.push(`1 x ${addEclerBrand('eMBASE')}`);
                materials.push(`1 x ${addEclerBrand('eMCN2')}`);
            }
        }
        
        // NOUVELLE LOGIQUE : Affichage des micros pour "Jusqu'à 90m²" avec 3 zones
        if (surface === "Jusqu'à 90m²" && zones === "3") {
            // Récupérer la réponse de la question 111 (micros pour 90m2 avec 3 zones)
            const microSpecial90m2_3zones = answers[111];
            
            if (microSpecial90m2_3zones) {
                if (microSpecial90m2_3zones === "0") {
                    // 0 micro - rien à afficher
                    console.log("0 micro sélectionné pour 90m2 avec 3 zones - rien à afficher");
                } else if (microSpecial90m2_3zones === "1") {
                    // 1 micro - afficher eMBASE + eMCN2
                    console.log("1 micro sélectionné pour 90m2 avec 3 zones - ajout eMBASE + eMCN2");
                    materials.push(`1 x ${addEclerBrand('eMBASE')} + ${addEclerBrand('eMCN2')}`);
                } else if (microSpecial90m2_3zones === "2") {
                    // 2 micros - afficher 2 x eMBASE + 2 x eMCN2
                    console.log("2 micros sélectionnés pour 90m2 avec 3 zones - ajout 2 x eMBASE + 2 x eMCN2");
                    materials.push(`2 x ${addEclerBrand('eMBASE')} + ${addEclerBrand('eMCN2')}`);
                }
            }
        }
        
        // LOG FINAL DU MATÉRIEL
        console.log("=== MATÉRIEL FINAL ===");
        console.log("Tableau materials:", materials);
        console.log("Longueur du tableau:", materials.length);
        
    } catch (error) {
        materials = ["Erreur lors du calcul du matériel"];
    }
}

// Recommencer le questionnaire avec gestion d'erreur renforcée
function restartQuiz() {
    try {
        currentStep = 0;
        answers = {};
        materials = [];
        isInitialized = false;
        stepHistory = []; // Réinitialiser l'historique
        
        const questionContainer = getElementSafely('questionContainer');
        const resultsContainer = getElementSafely('resultsContainer');
        
        if (questionContainer) questionContainer.style.display = 'block';
        if (resultsContainer) resultsContainer.style.display = 'none';
        
        showQuestion();
        updateProgress();
        isInitialized = true;
    } catch (error) {
        console.error('Erreur lors du redémarrage:', error);
        showErrorMessage('Erreur lors du redémarrage');
    }
}

// Fonction pour revenir à l'étape précédente depuis une page de devis
function goBack() {
    try {
        // Vérifier s'il y a un historique
        if (stepHistory.length === 0) {
            console.warn('Aucun historique disponible pour le retour en arrière');
            restartQuiz();
            return;
        }
        
        // Récupérer la dernière étape de l'historique
        const previousStep = stepHistory.pop();
        
        // Vérifier que l'étape est valide
        if (typeof previousStep !== 'number' || previousStep < 0 || previousStep >= questions.length) {
            console.error('Étape précédente invalide:', previousStep);
            restartQuiz();
            return;
        }
        
        // Revenir à l'étape précédente
        currentStep = previousStep;
        
        // Afficher la question et mettre à jour la progression
        const questionContainer = getElementSafely('questionContainer');
        const resultsContainer = getElementSafely('resultsContainer');
        
        if (questionContainer) questionContainer.style.display = 'block';
        if (resultsContainer) resultsContainer.style.display = 'none';
        
        showQuestion();
        updateProgress();
        
    } catch (error) {
        console.error('Erreur lors du retour en arrière:', error);
        showErrorMessage('Erreur lors du retour en arrière');
    }
}

// Fonction pour afficher les messages d'erreur avec fallback
function showErrorMessage(message) {
    try {
        const questionContainer = getElementSafely('questionContainer');
        if (questionContainer) {
            questionContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <h3>Erreur</h3>
                    <p>${escapeHtml(message)}</p>
                    <button class="btn btn-primary" onclick="restartQuiz()">Recommencer</button>
                </div>
            `;
        } else {
            // Fallback si le conteneur n'existe pas
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #2d2d2d; background: #ffffff; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                    <div>
                        <h2>Erreur Critique</h2>
                        <p>${escapeHtml(message)}</p>
                        <button onclick="location.reload()" style="background: #ffd700; color: #2d2d2d; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                            Recharger la page
                        </button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur lors de l\'affichage du message d\'erreur:', error);
        // Dernier recours
        alert('Erreur critique: ' + message);
    }
}

// Gestion des erreurs globales avec récupération
window.addEventListener('error', function(event) {
    console.error('Erreur JavaScript:', event.error);
    if (!isInitialized) {
        showErrorMessage('Erreur lors du chargement de l\'application');
    } else {
        showErrorMessage('Une erreur inattendue s\'est produite');
    }
});

// Gestion des erreurs de promesses non gérées
window.addEventListener('unhandledrejection', function(event) {
    console.error('Promesse rejetée non gérée:', event.reason);
    showErrorMessage('Une erreur inattendue s\'est produite');
});

// Gestion de la perte de connexion
window.addEventListener('offline', function() {
    console.warn('Application hors ligne');
});

window.addEventListener('online', function() {
    // console.log('Application en ligne');
});

// Fonction pour télécharger le cahier des charges
async function downloadCahierDesCharges() {
    try {
        // Vérifier que jsPDF est disponible
        if (typeof window.jspdf === 'undefined') {
            const errorMessage = 'Erreur : Bibliothèque PDF non chargée.\n\n' +
                               'Causes possibles :\n' +
                               '• Problème de connexion internet\n' +
                               '• Pare-feu d\'entreprise\n' +
                               '• CDN temporairement indisponible\n\n' +
                               'Solutions :\n' +
                               '• Recharger la page (F5)\n' +
                               '• Vérifier votre connexion\n' +
                               '• Contacter l\'administrateur réseau';
            alert(errorMessage);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Titre
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('CAHIER DES CHARGES', 20, 25);
        
        // Ligne de séparation
        doc.setLineWidth(0.5);
        doc.line(20, 30, 190, 30);
        
        // Informations de base
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
        doc.text(`Heure : ${new Date().toLocaleTimeString('fr-FR')}`, 20, 55);
        
        let yPosition = 75;
        
        // Fonction pour vérifier si on doit passer à la page suivante
        function checkPageBreak() {
            if (yPosition > 220) {
                doc.addPage();
                yPosition = 25;
            }
        }
        
        // Étape 1 - Choix des hauts-parleurs
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 1 - Choix des hauts-parleurs', 20, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const speaker = answers[1];
        const speakerOptions = ['Plafonniers', 'Suspendus', 'Mural', 'Sur rails'];
        speakerOptions.forEach(option => {
            const isSelected = speaker === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 2 - Choix de la couleur
        yPosition += 8;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 2 - Choix de la couleur', 20, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const color = answers[2];
        const colorOptions = ['Blanc', 'Noir'];
        colorOptions.forEach(option => {
            const isSelected = color === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 3 - Surface
        yPosition += 8;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 3 - Surface à sonoriser', 20, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const surface = answers[3];
        const surfaceOptions = ['Jusqu\'à 70m²', 'Jusqu\'à 90m²', 'Jusqu\'à 150m²', 'Plus de 150m²'];
        surfaceOptions.forEach(option => {
            const isSelected = surface === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 4 - Nombre de zones
        if (answers[4] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 4 - Nombre de zones', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const zones = answers[4];
            const zonesOptions = ['1', '2', '3', '4', 'Plus de 4 zones'];
            zonesOptions.forEach(option => {
                const isSelected = zones === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
        }
        
        // Étape 5 - Micros (si applicable)
        if (answers[5] !== undefined || answers['5_sub'] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 5 - Choix du micro d\'appel', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            
            const microSameZone = answers[5];
            const microMultiZone = answers['5_sub'];
            
            // Option 1 - Micro d'appel général
            const hasMicroSameZone = microSameZone && parseInt(microSameZone) > 0;
            doc.text(`${hasMicroSameZone ? '[X]' : '[ ]'} Option n°1 - Micro d'appel général : ${microSameZone || 0} micros`, 25, yPosition);
            yPosition += 8;
            
            // Option 2 - Micro d'appel indépendant
            const hasMicroMultiZone = microMultiZone && parseInt(microMultiZone) > 0;
            doc.text(`${hasMicroMultiZone ? '[X]' : '[ ]'} Option n°2 - Micro d'appel indépendant : ${microMultiZone || 0} micros`, 25, yPosition);
            yPosition += 8;
        }
        
        // Étape 6 - Commande de volume
        if (answers[6] !== undefined) {
            yPosition += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 6 - Commande de volume et sélection de sources déportées', 20, yPosition);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            const volumeControl = answers[6];
            const volumeOptions = [
                '1 commande de volume',
                '1 commande de volume + source',
                '2 commandes de volume + source',
                '3 commandes de volume + source',
                '4 commandes de volume + source'
            ];
            volumeOptions.forEach(option => {
                const isSelected = volumeControl === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 7;
            });
        }
        
        // Étape 7 - Télécommande (Sur rails uniquement)
        if (answers[7] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 7 - Besoin d\'une télécommande de volume déportée ?', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const remoteVolume = answers[7];
            const remoteOptions = ['Oui', 'Non'];
            remoteOptions.forEach(option => {
                const isSelected = remoteVolume === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
        }
        
        // Étape 8 - Nombre de zones (Sur rails uniquement)
        if (answers[8] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 8 - Nombre de zones (Sur rails uniquement)', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const zonesSurRails = answers[8];
            const zonesOptions = ['1', 'Plus dune zone'];
            zonesOptions.forEach(option => {
                const isSelected = zonesSurRails === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
        }
        
        // Pied de page
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Document généré automatiquement par l\'Assistant Vente Audio MiD', 20, 260);
        
        // Télécharger le PDF
        const fileName = `cahier_des_charges_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Détecter si on est dans Electron pour utiliser l'API appropriée
        const isElectron = window && window.process && window.process.type;
        
        if (isElectron && window.require) {
            try {
                // Dans Electron, utiliser l'API dialog pour choisir l'emplacement
                const { dialog } = require('@electron/remote');
                const fs = require('fs');
                
                const result = await dialog.showSaveDialog({
                    title: 'Sauvegarder le cahier des charges',
                    defaultPath: fileName,
                    filters: [
                        { name: 'Fichiers PDF', extensions: ['pdf'] }
                    ]
                });
                
                if (!result.canceled && result.filePath) {
                    // Convertir le PDF en buffer et l'écrire
                    const pdfOutput = doc.output('arraybuffer');
                    fs.writeFileSync(result.filePath, Buffer.from(pdfOutput));
                }
            } catch (error) {
                console.error('Erreur avec l\'API Electron:', error);
                // Fallback vers la méthode normale
                doc.save(fileName);
            }
        } else {
            // Dans le navigateur, utiliser la méthode normale
            doc.save(fileName);
        }
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}

// Fonction pour télécharger le cahier des charges avec le questionnaire
async function downloadCahierDesChargesWithSurvey() {
    try {
        // Récupérer les réponses du questionnaire
        const zonesCount = document.getElementById('zonesCount')?.value || '';
        const sourcesCount = document.getElementById('sourcesCount')?.value || '';
        const volumeControl = document.getElementById('volumeControl')?.value || '';
        const volumeCount = document.getElementById('volumeCount')?.value || '';
        const volumeType = document.getElementById('volumeType')?.value || '';
        const microSameZone = document.getElementById('microSameZone')?.value || '';
        const microMultiZone = document.getElementById('microMultiZone')?.value || '';
        const otherInfo = document.getElementById('otherInfo')?.value || '';
        
        // Identifier le chemin de devis
        const devisPath = getDevisPath();
        
        // Validation selon le chemin
        if (devisPath === 'sur_rails_surface' || devisPath === 'sur_rails_zones') {
            if (!zonesCount || !sourcesCount || !volumeControl) {
                alert('Veuillez remplir au minimum les 3 premières questions.');
                return;
            }
        } else if (devisPath === 'surface_250m2') {
            if (!zonesCount || !volumeType || !volumeCount) {
                alert('Veuillez remplir au minimum les questions 1, 4 et 5.');
                return;
            }
        } else if (devisPath === 'zones_plus_4') {
            if (!zonesCount || !volumeCount || !volumeType) {
                alert('Veuillez remplir au minimum les 3 questions.');
                return;
            }
        }
        
        // Vérifier que jsPDF est disponible
        if (typeof window.jspdf === 'undefined') {
            const errorMessage = 'Erreur : Bibliothèque PDF non chargée.\n\n' +
                               'Causes possibles :\n' +
                               '• Problème de connexion internet\n' +
                               '• Pare-feu d\'entreprise\n' +
                               '• CDN temporairement indisponible\n\n' +
                               'Solutions :\n' +
                               '• Recharger la page (F5)\n' +
                               '• Vérifier votre connexion\n' +
                               '• Contacter l\'administrateur réseau';
            alert(errorMessage);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Titre
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('CAHIER DES CHARGES', 20, 25);
        
        // Ligne de séparation
        doc.setLineWidth(0.5);
        doc.line(20, 30, 190, 30);
        
        // Informations de base
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
        doc.text(`Heure : ${new Date().toLocaleTimeString('fr-FR')}`, 20, 55);
        
        let yPosition = 75;
        
        // Fonction pour vérifier si on doit passer à la page suivante
        function checkPageBreak() {
            if (yPosition > 220) {
                doc.addPage();
                yPosition = 25;
            }
        }
        
        // Étape 1 - Choix des hauts-parleurs
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 1 - Choix des hauts-parleurs', 20, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const speaker = answers[1];
        const speakerOptions = ['Plafonniers', 'Suspendus', 'Mural', 'Sur rails'];
        speakerOptions.forEach(option => {
            const isSelected = speaker === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 2 - Choix de la couleur
        yPosition += 8;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 2 - Choix de la couleur', 20, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const color = answers[2];
        const colorOptions = ['Blanc', 'Noir'];
        colorOptions.forEach(option => {
            const isSelected = color === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 3 - Surface
        yPosition += 8;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 3 - Surface à sonoriser', 20, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const surface = answers[3];
        const surfaceOptions = ['Jusqu\'à 70m²', 'Jusqu\'à 90m²', 'Jusqu\'à 150m²', 'Plus de 150m²'];
        surfaceOptions.forEach(option => {
            const isSelected = surface === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 4 - Nombre de zones
        if (answers[4] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 4 - Nombre de zones', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const zones = answers[4];
            const zonesOptions = ['1', '2', '3', '4', 'Plus de 4 zones'];
            zonesOptions.forEach(option => {
                const isSelected = zones === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
        }
        
        // Étape 5 - Micros (si applicable)
        if (answers[5] !== undefined || answers['5_sub'] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 5 - Choix du micro d\'appel', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            
            const microSameZone = answers[5];
            const microMultiZone = answers['5_sub'];
            
            // Option 1 - Micro d'appel général
            const hasMicroSameZone = microSameZone && parseInt(microSameZone) > 0;
            doc.text(`${hasMicroSameZone ? '[X]' : '[ ]'} Option n°1 - Micro d'appel général : ${microSameZone || 0} micros`, 25, yPosition);
            yPosition += 8;
            
            // Option 2 - Micro d'appel indépendant
            const hasMicroMultiZone = microMultiZone && parseInt(microMultiZone) > 0;
            doc.text(`${hasMicroMultiZone ? '[X]' : '[ ]'} Option n°2 - Micro d'appel indépendant : ${microMultiZone || 0} micros`, 25, yPosition);
            yPosition += 8;
        }
        
        // Étape 6 - Commande de volume
        if (answers[6] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 6 - Commande de volume et sélection de sources déportées', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const volumeControlStep6 = answers[6];
            const volumeOptions = [
                '1 commande de volume',
                '1 commande de volume + source',
                '2 commandes de volume + source',
                '3 commandes de volume + source',
                '4 commandes de volume + source'
            ];
            volumeOptions.forEach(option => {
                const isSelected = volumeControlStep6 === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
        }
        
        // Étape 7 - Télécommande (Sur rails uniquement)
        if (answers[7] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 7 - Besoin d\'une télécommande de volume déportée ?', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const remoteVolume = answers[7];
            const remoteOptions = ['Oui', 'Non'];
            remoteOptions.forEach(option => {
                const isSelected = remoteVolume === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
        }
        
        // Étape 8 - Nombre de zones (Sur rails uniquement)
        if (answers[8] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 8 - Nombre de zones (Sur rails uniquement)', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const zonesSurRails = answers[8];
            const zonesOptions = ['1', 'Plus dune zone'];
            zonesOptions.forEach(option => {
                const isSelected = zonesSurRails === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
        }
        
        // SECTION QUESTIONNAIRE RAPIDE
        yPosition += 15;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('QUESTIONNAIRE RAPIDE - INFORMATIONS COMPLÉMENTAIRES', 20, yPosition);
        yPosition += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        // Questions selon le chemin de devis
        if (devisPath === 'sur_rails_surface' || devisPath === 'sur_rails_zones') {
            // Questionnaire Sur rails
            doc.setFont('helvetica', 'bold');
            doc.text('Question 1 : Nombre de zones', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${zonesCount} zones`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 2 : Nombre de sources', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${sourcesCount} sources`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 3 : Besoin de télécommande de volume ?', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${volumeControl === 'oui' ? 'Oui' : 'Non'}`, 25, yPosition);
            yPosition += 8;
            
            if (volumeControl === 'oui' && volumeCount) {
                doc.text(`Nombre de télécommandes : ${volumeCount}`, 30, yPosition);
                yPosition += 8;
            }
            yPosition += 8;
        } else if (devisPath === 'surface_250m2') {
            // Questionnaire surface > 250m²
            doc.setFont('helvetica', 'bold');
            doc.text('Question 1 : Nombre de zones', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${zonesCount} zones`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 2 : Nombre de micros d\'appel général', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${microSameZone} micros`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 3 : Nombre de micros d\'appel indépendant', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${microMultiZone} micros`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 4 : Type de commande de volume', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${volumeType}`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 5 : Nombre de télécommandes', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${volumeCount} télécommandes`, 25, yPosition);
            yPosition += 8;
        } else if (devisPath === 'zones_plus_4') {
            // Questionnaire plus de 4 zones
            doc.setFont('helvetica', 'bold');
            doc.text('Question 1 : Nombre de zones', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${zonesCount} zones`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 2 : Nombre de télécommandes', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${volumeCount} télécommandes`, 25, yPosition);
            yPosition += 12;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Question 3 : Type de télécommandes', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse : ${volumeType}`, 25, yPosition);
            yPosition += 8;
        }
        
        // Autres informations
        if (otherInfo && otherInfo.trim()) {
            doc.setFont('helvetica', 'bold');
            doc.text('Autres informations utiles à l\'étude du projet :', 20, yPosition);
            yPosition += 8;
            doc.setFont('helvetica', 'normal');
            
            // Gestion du texte long avec retour à la ligne
            const maxWidth = 160;
            const words = otherInfo.split(' ');
            let line = '';
            let lines = [];
            
            for (let word of words) {
                const testLine = line + word + ' ';
                if (doc.getTextWidth(testLine) < maxWidth) {
                    line = testLine;
                } else {
                    lines.push(line);
                    line = word + ' ';
                }
            }
            lines.push(line);
            
            lines.forEach(lineText => {
                if (yPosition > 220) {
                    doc.addPage();
                    yPosition = 25;
                }
                doc.text(lineText.trim(), 25, yPosition);
                yPosition += 8;
            });
        }
        
        // Pied de page
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Document généré automatiquement par l\'Assistant Vente Audio MiD', 20, 260);
        
        // Télécharger le PDF
        const fileName = `cahier_des_charges_complet_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Détecter si on est dans Electron pour utiliser l'API appropriée
        const isElectron = window && window.process && window.process.type;
        
        if (isElectron && window.require) {
            try {
                // Dans Electron, utiliser l'API dialog pour choisir l'emplacement
                const { dialog } = require('@electron/remote');
                const fs = require('fs');
                
                const result = await dialog.showSaveDialog({
                    title: 'Sauvegarder le cahier des charges complet',
                    defaultPath: fileName,
                    filters: [
                        { name: 'Fichiers PDF', extensions: ['pdf'] }
                    ]
                });
                
                if (!result.canceled && result.filePath) {
                    // Convertir le PDF en buffer et l'écrire
                    const pdfOutput = doc.output('arraybuffer');
                    fs.writeFileSync(result.filePath, Buffer.from(pdfOutput));
                }
            } catch (error) {
                console.error('Erreur avec l\'API Electron:', error);
                // Fallback vers la méthode normale
                doc.save(fileName);
            }
        } else {
            // Dans le navigateur, utiliser la méthode normale
            doc.save(fileName);
        }
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF avec questionnaire:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}

// Fonction pour identifier le chemin de devis
function getDevisPath() {
    const speaker = answers[1];
    const surface = answers[3];
    const zones = answers[4]; // Maintenant à l'étape 4
    const zonesSurRails = answers[8];
    
    // Vérifier que les réponses existent
    if (!speaker) {
        return null;
    }
    
    // Sur rails + surface > 250m² (parcours Sur rails non modifié)
    if (speaker === "Sur rails" && surface === "au-delà de 250m²") {
        return 'sur_rails_surface';
    }
    
    // Sur rails + plus d'une zone
    if (speaker === "Sur rails" && zonesSurRails === "Plus dune zone") {
        return 'sur_rails_zones';
    }
    
    // Surface > 150m² (autres parcours)
    if (speaker !== "Sur rails" && surface === "Plus de 150m²") {
        return 'surface_250m2';
    }
    
    // Plus de 4 zones
    if (zones === "Plus de 4 zones") {
        return 'zones_plus_4';
    }
    
    return null;
}

// Fonction pour convertir les valeurs de commande de volume en texte
function getVolumeControlText(value) {
    switch(value) {
        case 'aucune': return 'Aucune commande';
        case '1_volume': return '1 commande de volume';
        case '1_volume_source': return '1 commande de volume + source';
        case '2_volume_source': return '2 commandes de volume + source';
        case '3_volume_source': return '3 commandes de volume + source';
        case '4_volume_source': return '4 commandes de volume + source';
        case 'oui': return 'Oui';
        case 'non': return 'Non';
        default: return value;
    }
}

// Fonction pour gérer l'affichage de la question sur le nombre de télécommandes
function toggleVolumeCountQuestion() {
    const volumeControl = document.getElementById('volumeControl');
    const volumeCountQuestion = document.getElementById('volumeCountQuestion');
    
    if (volumeControl && volumeCountQuestion) {
        if (volumeControl.value === 'oui') {
            volumeCountQuestion.style.display = 'block';
        } else {
            volumeCountQuestion.style.display = 'none';
        }
    }
}

// Fonction pour ouvrir les datasheets dans Electron
function openDatasheet(filePath, displayName) {
    try {
        // Détecter si on est dans Electron
        const isElectron = window && window.process && window.process.type;
        
        if (isElectron) {
            // Dans Electron, utiliser l'API shell pour ouvrir le fichier
            if (window.require) {
                const { shell } = require('electron');
                const path = require('path');
                
                // Extraire le fichier temporairement et l'ouvrir
                const fs = require('fs');
                const os = require('os');
                
                // Créer un dossier temporaire pour extraire le fichier
                const tempDir = path.join(os.tmpdir(), 'mid-audio-datasheets');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                // Chemin du fichier temporaire
                const tempFilePath = path.join(tempDir, path.basename(filePath));
                
                // Essayer de copier depuis resources/datasheets
                const resourcesPath = path.join(process.resourcesPath, 'datasheets', path.basename(filePath));
                const appPath = path.join(__dirname, 'datasheets', path.basename(filePath));
                
                let sourcePath = null;
                
                if (fs.existsSync(resourcesPath)) {
                    sourcePath = resourcesPath;
                } else if (fs.existsSync(appPath)) {
                    sourcePath = appPath;
                }
                
                if (sourcePath) {
                    // Copier le fichier vers le dossier temporaire
                    fs.copyFileSync(sourcePath, tempFilePath);
                    console.log('Fichier copié vers:', tempFilePath);
                    
                    // Ouvrir le fichier temporaire
                    shell.openPath(tempFilePath);
                    
                    // Nettoyer le fichier temporaire après 30 secondes
                    setTimeout(() => {
                        try {
                            if (fs.existsSync(tempFilePath)) {
                                fs.unlinkSync(tempFilePath);
                            }
                        } catch (cleanupError) {
                            console.warn('Erreur lors du nettoyage:', cleanupError);
                        }
                    }, 30000);
                } else {
                    throw new Error('Fichier datasheet non trouvé');
                }
            } else {
                // Fallback : essayer d'ouvrir avec le lien normal
                window.open(filePath, '_blank');
            }
        } else {
            // Dans le navigateur, ouvrir normalement
            window.open(filePath, '_blank');
        }
    } catch (error) {
        console.error('Erreur lors de l\'ouverture de la datasheet:', error);
        // Fallback : essayer d'ouvrir avec le lien normal
        window.open(filePath, '_blank');
    }
}

// Fonction pour basculer l'affichage des fiches techniques
function toggleDatasheets() {
    const content = document.getElementById('datasheetsContent');
    const toggle = document.querySelector('.datasheets-toggle');
    
    if (content && toggle) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▲';
        } else {
            content.style.display = 'none';
            toggle.textContent = '▼';
        }
    }
}

// Protection contre les erreurs de mémoire
window.addEventListener('beforeunload', function() {
    // Nettoyage des variables globales
    answers = null;
    materials = null;
});

// Fonction pour télécharger la liste de matériel en PDF
async function downloadListeMateriel() {
    try {
        // Vérifier que jsPDF est disponible
        if (typeof window.jspdf === 'undefined') {
            const errorMessage = 'Erreur : Bibliothèque PDF non chargée.\n\n' +
                               'Causes possibles :\n' +
                               '• Problème de connexion internet\n' +
                               '• Pare-feu d\'entreprise\n' +
                               '• CDN temporairement indisponible\n\n' +
                               'Solutions :\n' +
                               '• Recharger la page (F5)\n' +
                               '• Vérifier votre connexion\n' +
                               '• Contacter l\'administrateur réseau';
            alert(errorMessage);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Marges classiques d'un document Word (2.54 cm = 1 pouce)
        const marginLeft = 20;
        const marginRight = 20;
        const marginTop = 25;
        const pageWidth = 210;
        const contentWidth = pageWidth - marginLeft - marginRight;
        
        // Fonction pour créer l'en-tête avec logo, titre et contact
        function createHeader() {
            // Logo temporairement désactivé pour faire fonctionner la fonction
            // TODO: Réactiver le logo une fois que la fonction fonctionne
            
            // Titre centré "Liste du matériel" avec police 25
            const titleText = 'Liste du matériel';
            doc.setFontSize(25);
            doc.setFont('helvetica', 'bold');
            const titleWidth = doc.getTextWidth(titleText);
            const titleX = (pageWidth - titleWidth) / 2;
            doc.text(titleText, titleX, marginTop + 12); // +12 pour aligner avec le centre du logo
            
            // Informations de contact alignées à droite
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const contactInfo = [
                'SOFI par MID',
                '2 rue Magnier-Bédu',
                '95410 GROSLAY',
                'France'
            ];
            
            // Calculer la largeur totale du bloc de contact pour le centrer
            let maxContactWidth = 0;
            contactInfo.forEach(line => {
                const lineWidth = doc.getTextWidth(line);
                if (lineWidth > maxContactWidth) {
                    maxContactWidth = lineWidth;
                }
            });
            
            // Positionner le bloc de contact à droite, aligné horizontalement avec le centre du logo
            const contactX = pageWidth - marginRight - maxContactWidth;
            const contactStartY = marginTop + 2; // Aligné avec le centre du logo
            
            contactInfo.forEach((line, index) => {
                doc.text(line, contactX, contactStartY + (index * 5));
            });
            
            // Ligne de séparation horizontale
            doc.setLineWidth(0.5);
            doc.line(marginLeft, marginTop + 25, pageWidth - marginRight, marginTop + 25);
            
            return marginTop + 35; // Retourner la position Y pour le contenu
        }
        
        // Créer l'en-tête et obtenir la position de départ du contenu
        let yPosition = createHeader();
        
        // Fonction pour vérifier si on doit passer à la page suivante
        function checkPageBreak() {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = createHeader();
            }
        }
        
        // Titre de la liste
        checkPageBreak();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Matériel recommandé :', marginLeft, yPosition);
        yPosition += 15;
        
        // Liste du matériel
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        if (!Array.isArray(materials) || materials.length === 0) {
            doc.text('Aucun matériel recommandé pour cette configuration', marginLeft, yPosition);
        } else {
            materials.forEach((material, index) => {
                if (typeof material === 'string' && material.trim()) {
                    checkPageBreak();
                    doc.text(`${index + 1}. ${material}`, marginLeft, yPosition);
                    yPosition += 8;
                }
            });
        }
        
        // Informations supplémentaires supprimées (consommation électrique et temps d'installation)
        
        // Date de génération
        yPosition += 10;
        checkPageBreak();
        doc.setFontSize(9);
        doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, marginLeft, yPosition);
        
        // Sauvegarder le PDF
        const fileName = `liste_materiel_sofi_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Détecter si on est dans Electron
        const isElectron = window && window.process && window.process.type;
        
        if (isElectron) {
            // Dans Electron, utiliser l'API de dialogue de sauvegarde
            if (window.require) {
                const { dialog } = require('@electron/remote');
                const fs = require('fs');
                
                const result = await dialog.showSaveDialog({
                    title: 'Sauvegarder la liste de matériel',
                    defaultPath: fileName,
                    filters: [
                        { name: 'Documents PDF', extensions: ['pdf'] }
                    ]
                });
                
                if (!result.canceled && result.filePath) {
                    const pdfOutput = doc.output('arraybuffer');
                    fs.writeFileSync(result.filePath, Buffer.from(pdfOutput));
                    
                    // Ouvrir le dossier contenant le fichier
                    const { shell } = require('electron');
                    const path = require('path');
                    shell.showItemInFolder(result.filePath);
                }
            } else {
                // Fallback : téléchargement normal
                doc.save(fileName);
            }
        } else {
            // Dans le navigateur, téléchargement normal
            doc.save(fileName);
        }
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}

// Fonction pour afficher/masquer la section des cas exceptionnels
function toggleExceptionalCases() {
    const content = document.getElementById('exceptionalCasesContent');
    const button = document.getElementById('exceptionalCasesBtn');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        button.textContent = 'Masquer les cas exceptionnels';
        button.classList.remove('btn-secondary');
        button.classList.add('btn-primary');
    } else {
        content.style.display = 'none';
        button.textContent = 'Cas exceptionnels';
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
    }
}

// Fonction pour télécharger le PDF des cas exceptionnels
async function downloadExceptionalCasesPDF() {
    try {
        const exceptionalText = document.getElementById('exceptionalCasesText').value;
        
        if (!exceptionalText.trim()) {
            alert('Veuillez saisir des informations dans le champ des cas exceptionnels avant de télécharger le PDF.');
            return;
        }
        
        // Créer le contenu du PDF avec toutes les questions et réponses
        const pdfContent = await generateExceptionalCasesPDF(exceptionalText);
        
        // Télécharger le PDF
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cas_exceptionnels_sofi.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Erreur lors du téléchargement du PDF des cas exceptionnels:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}

// Fonction pour générer le contenu du PDF des cas exceptionnels
async function generateExceptionalCasesPDF(exceptionalText) {
    try {
        // Utiliser la même logique que le cahier des charges mais avec les cas exceptionnels
        const pdfContent = await generateCahierDesChargesWithExceptionalCases(exceptionalText);
        return pdfContent;
    } catch (error) {
        console.error('Erreur lors de la génération du PDF des cas exceptionnels:', error);
        throw error;
    }
}

// Fonction pour générer le PDF des cas exceptionnels avec toutes les questions et réponses
async function generateCahierDesChargesWithExceptionalCases(exceptionalText) {
    try {
        // Vérifier que jsPDF est disponible
        if (typeof window.jspdf === 'undefined') {
            const errorMessage = 'Erreur : Bibliothèque PDF non chargée.\n\n' +
                               'Causes possibles :\n' +
                               '• Problème de connexion internet\n' +
                               '• Pare-feu d\'entreprise\n' +
                               '• CDN temporairement indisponible\n\n' +
                               'Solutions :\n' +
                               '• Recharger la page (F5)\n' +
                               '• Vérifier votre connexion\n' +
                               '• Contacter l\'administrateur réseau';
            alert(errorMessage);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Marges classiques d'un document Word (2.54 cm = 1 pouce)
        const marginLeft = 20;
        const marginRight = 20;
        const marginTop = 25;
        const pageWidth = 210;
        const contentWidth = pageWidth - marginLeft - marginRight;
        
                 // Fonction pour créer l'en-tête avec texte SOFI à gauche et titre centré
         function createHeader() {
             // En-tête SOFI professionnel avec texte SOFI à gauche et titre centré
             doc.setFontSize(18);
             doc.setFont('helvetica', 'bold');
             const sofiText = 'SOFI';
             doc.text(sofiText, marginLeft, marginTop + 8);
             
             // Titre centré "Cas Exceptionnels" avec police 25
             const titleText = 'Cas Exceptionnels';
             doc.setFontSize(25);
             doc.setFont('helvetica', 'bold');
             const titleWidth = doc.getTextWidth(titleText);
             const titleX = (pageWidth - titleWidth) / 2;
             doc.text(titleText, titleX, marginTop + 8);
             
             // Informations de contact alignées à droite mais centrées verticalement sur l'axe du titre
             doc.setFontSize(10);
             doc.setFont('helvetica', 'normal');
             const contactInfo = [
                 'SOFI par MID',
                 '2 rue Magnier-Bédu',
                 '95410 GROSLAY',
                 'France'
             ];
             
             // Calculer la largeur totale du bloc de contact
             let maxContactWidth = 0;
             contactInfo.forEach(line => {
                 const lineWidth = doc.getTextWidth(line);
                 if (lineWidth > maxContactWidth) {
                     maxContactWidth = lineWidth;
                 }
             });
             
             // Positionner le bloc de contact à droite
             const contactX = pageWidth - marginRight - maxContactWidth;
             
             // Calculer la hauteur totale du bloc de contact pour le centrer verticalement
             const contactBlockHeight = (contactInfo.length - 1) * 5; // 5px entre chaque ligne
             const titleCenterY = marginTop + 8; // Position Y du centre du titre
             const contactStartY = titleCenterY - (contactBlockHeight / 2); // Centré parfaitement sur l'axe du titre
             
             contactInfo.forEach((line, index) => {
                 doc.text(line, contactX, contactStartY + (index * 5));
             });
             
             // Ligne de séparation horizontale
             doc.setLineWidth(0.5);
             doc.line(marginLeft, marginTop + 25, pageWidth - marginRight, marginTop + 25);
             
             return marginTop + 35; // Retourner la position Y pour le contenu
         }
        
        // Créer l'en-tête et obtenir la position de départ du contenu
        let yPosition = createHeader();
        
        // Fonction pour vérifier si on doit passer à la page suivante
        function checkPageBreak() {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = createHeader();
            }
        }
        
        // Informations de base
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, marginLeft, yPosition);
        yPosition += 8;
        doc.text(`Heure : ${new Date().toLocaleTimeString('fr-FR')}`, marginLeft, yPosition);
        yPosition += 8;
        doc.text('Type : Cas exceptionnels nécessitant une étude personnalisée', marginLeft, yPosition);
        yPosition += 16;
        
        // Fonction pour vérifier si on doit passer à la page suivante
        function checkPageBreak() {
            if (yPosition > 220) {
                doc.addPage();
                yPosition = 25;
            }
        }
        
        // Section 1 : Réponses du questionnaire
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('SECTION 1 - RÉPONSES DU QUESTIONNAIRE', marginLeft, yPosition);
        yPosition += 12;
        
        // Étape 1 - Choix des hauts-parleurs
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 1 - Choix des hauts-parleurs', marginLeft, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const speaker = answers[1];
        if (speaker) {
            doc.text(`Réponse sélectionnée : ${speaker}`, marginLeft + 5, yPosition);
            yPosition += 8;
        } else {
            doc.text('Aucune réponse sélectionnée', marginLeft + 5, yPosition);
            yPosition += 8;
        }
        
        // Étape 2 - Choix de la couleur
        yPosition += 8;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 2 - Choix de la couleur', marginLeft, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const color = answers[2];
        if (color) {
            doc.text(`Réponse sélectionnée : ${color}`, marginLeft + 5, yPosition);
            yPosition += 8;
        } else {
            doc.text('Aucune réponse sélectionnée', marginLeft + 5, yPosition);
            yPosition += 8;
        }
        
        // Étape 3 - Surface
        yPosition += 8;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('ÉTAPE 3 - Surface à sonoriser', marginLeft, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const surface = answers[3];
        if (surface) {
            doc.text(`Réponse sélectionnée : ${surface}`, marginLeft + 5, yPosition);
            yPosition += 8;
        } else {
            doc.text('Aucune réponse sélectionnée', marginLeft + 5, yPosition);
            yPosition += 8;
        }
        
        // Étape 4 - Nombre de zones (selon la surface)
        let zones;
        if (surface === "Jusqu'à 70m²") {
            zones = answers[104];
        } else if (surface === "Jusqu'à 90m²") {
            zones = answers[105];
        } else if (surface === "Jusqu'à 150m²") {
            zones = answers[106];
        } else {
            zones = answers[4];
        }
        
        if (zones !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 4 - Nombre de zones', marginLeft, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            doc.text(`Réponse sélectionnée : ${zones}`, marginLeft + 5, yPosition);
            yPosition += 8;
        }
        
        // Étape 5 - Micros (si applicable)
        if (surface === "Jusqu'à 70m²" && answers[107] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 5 - Choix du micro d\'appel', marginLeft, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const microSpecial70m2 = answers[107];
            doc.text(`Réponse sélectionnée : ${microSpecial70m2}`, marginLeft + 5, yPosition);
            yPosition += 8;
        } else if (answers[5] !== undefined || answers['5_sub'] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 5 - Choix du micro d\'appel', marginLeft, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            
            const microSameZone = answers[5];
            const microMultiZone = answers['5_sub'];
            
            if (microSameZone !== undefined) {
                doc.text(`Micro d'appel général : ${microSameZone}`, marginLeft + 5, yPosition);
                yPosition += 8;
            }
            if (microMultiZone !== undefined) {
                doc.text(`Micro d'appel indépendant : ${microMultiZone}`, marginLeft + 5, yPosition);
                yPosition += 8;
            }
        }
        
        // Étape 6 - Télécommandes (si applicable)
        if (surface === "Jusqu'à 70m²" && answers[108] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 6 - Télécommandes', marginLeft, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const telecommandesSpeciales = answers[108];
            doc.text(`Réponse sélectionnée : ${telecommandesSpeciales}`, marginLeft + 5, yPosition);
            yPosition += 8;
        } else if (answers[6] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 6 - Télécommandes', marginLeft, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const volumeControl = answers[6];
            doc.text(`Réponse sélectionnée : ${getVolumeControlText(volumeControl)}`, marginLeft + 5, yPosition);
            yPosition += 8;
        }
        
        // Section 2 : Cas exceptionnels
        yPosition += 16;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('SECTION 2 - CAS EXCEPTIONNELS', marginLeft, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        doc.text('Informations supplémentaires fournies par le client :', marginLeft, yPosition);
        yPosition += 8;
        
        // Diviser le texte des cas exceptionnels en lignes pour éviter les débordements
        const maxWidth = contentWidth - 10; // Largeur maximale du texte avec marge
        const lines = splitTextManually(exceptionalText, maxWidth);
        
        lines.forEach(line => {
            checkPageBreak();
            doc.text(line, marginLeft + 5, yPosition);
            yPosition += 6;
        });
        
        // Section 3 : Instructions
        yPosition += 16;
        checkPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.text('SECTION 3 - INSTRUCTIONS', marginLeft, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        doc.text('Ce document doit être envoyé par email à nos techniciens pour étude :', marginLeft, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Email : mt@mid.audio', marginLeft + 5, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.text('Nos techniciens analyseront votre configuration et vous proposeront', marginLeft, yPosition);
        yPosition += 6;
        doc.text('une solution adaptée à vos besoins spécifiques.', marginLeft, yPosition);
        
        // Pied de page
        yPosition += 20;
        checkPageBreak();
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Document généré automatiquement par le questionnaire SOFI - Mid Audio', marginLeft, yPosition);
        
        // Retourner le PDF
        return doc.output('blob');
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF des cas exceptionnels:', error);
        throw error;
    }
}

// Fonction pour diviser manuellement le texte en lignes selon la largeur
function splitTextManually(text, maxWidth) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        // Estimation de la largeur (approximative)
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const estimatedWidth = testLine.length * 6; // Estimation: ~6px par caractère
        
        if (estimatedWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    });
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [text];
}

// Fonction pour identifier le chemin de devis
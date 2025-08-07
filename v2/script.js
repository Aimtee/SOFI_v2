// Variables globales avec valeurs par défaut sécurisées
let currentStep = 0;
let answers = {};
let materials = [];
let isInitialized = false;
let stepHistory = []; // Historique des étapes pour permettre le retour en arrière

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
    
    // Micros et accessoires
    'eMBASE': 'eMBASE_datasheet.pdf',
    'eMCN2': 'eMCN2_datasheet.pdf',
    'CNX-CBO': 'CNX-CBO_datasheet.pdf',
    'WPaMIX-T': 'WPaMIX-T_datasheet.pdf',
    'WPaVOL': 'WPaVOL_datasheet.pdf',
    
    // Contrôles
    'Core': 'Core_datasheet.pdf',
    'HH Audio MZ-C2-EU': 'MZ-C2-EU_datasheet.pdf',
    
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
                if (material.includes(productName)) {
                    productNames.add(productName);
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
            
            // Exception spéciale pour HH Audio MZ140Q : afficher sans "1 x"
            if (productName === '1 x HH Audio MZ140Q') {
                displayName = 'HH Audio MZ140Q';
            }
            // Autres exceptions : pas de préfixe "Ecler"
            else if (productName.includes('Ecler ') || 
                     productName === 'Câble Kordz One 14AWG 2C' || 
                     productName === 'HH Audio MZ-C2-EU') {
                displayName = productName;
            }
            // Par défaut : ajouter le préfixe "Ecler"
            else {
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
            "40m²",
            "60m²", 
            "80m²",
            "120m²",
            "au-delà de 250m²"
        ]
    },
    {
        id: 4,
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
        id: 5,
        title: "Nombre de zones",
        subtitle: "<em>Le nombre de zones correspond au nombre d'espaces qui pourront avoir une gestion de volume et de source indépendantes</em>",
        options: ["1", "2", "3", "4", "Plus de 4 zones"]
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
            "Plus dune zone"
        ]
    }
];

// Fonction pour ajouter la marque Ecler aux produits
function addEclerBrand(productName) {
    const eclerProducts = ['IC3', 'eMOTUS5OD', 'UC106', 'Wispeak', 'Wispeak TUBE', 'TUBE Wispeak', 'eHMA120', 'eHMA250', 'WPaMIX-T', 'eMBASE', 'eMCN2', 'WPaVOL', 'Core', 'CNX-CBO'];
    
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
    
    // Plafonniers, mural ou suspendu jusqu'à 120m² : 1 journée à deux personnes
    if (speaker === "Plafonniers" || speaker === "Mural" || speaker === "Suspendus") {
        if (surface === "40m²" || surface === "60m²" || surface === "80m²" || surface === "120m²") {
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
        let html = `
            <h2 class="question-title">${escapeHtml(question.title)}</h2>
            ${question.subtitle ? `<p class="question-subtitle${question.id === 4 ? ' micro-main-subtitle' : ''}">${question.subtitle}</p>` : ''}
            <div class="options-container${question.id === 3 ? ' surface-options' : ''}">
        `;
        // Cas spécial pour l'étape 4 (micros)
        if (question.id === 4 && question.sub) {
            // 3.1
            const hasSelection3_1 = answers[4] !== null && answers[4] !== undefined && answers[4] !== "0";
            const hasSelection3_2 = answers['4_sub'] !== null && answers['4_sub'] !== undefined && answers['4_sub'] !== "0";
            const is3_2Disabled = hasSelection3_1;
            const is3_1Disabled = hasSelection3_2;
            
            html += `<div style='margin-bottom:16px;'>
                <div>${question.sub.title}</div>
                <div class="micro-options">`;
            question.sub.options.forEach((option, index) => {
                const escapedOption = escapeHtml(option);
                const isSelected = answers[4] === option;
                const disabledClass = is3_1Disabled ? 'disabled' : '';
                html += `
                    <label class="option ${isSelected ? 'selected' : ''} ${disabledClass}" onclick="${is3_1Disabled ? '' : `selectMicroOption('4','${escapedOption}')`}">
                        <input type="radio" name="question4" value="${escapedOption}" ${isSelected ? 'checked' : ''} ${is3_1Disabled ? 'disabled' : ''}>
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
                const isSelected = answers['4_sub'] === option;
                const disabledClass = is3_2Disabled ? 'disabled' : '';
                html += `
                    <label class="option ${isSelected ? 'selected' : ''} ${disabledClass}" onclick="${is3_2Disabled ? '' : `selectMicroOption('4_sub','${escapedOption}')`}">
                        <input type="radio" name="question4_sub" value="${escapedOption}" ${isSelected ? 'checked' : ''} ${is3_2Disabled ? 'disabled' : ''}>
                        <span class="option-label">${escapedOption}</span>
                    </label>
                `;
            });
            html += `</div></div>`;
            const canProceed = (answers[4] !== null && answers[4] !== undefined || answers['4_sub'] !== null && answers['4_sub'] !== undefined);
            // console.log('Condition bouton Suivant:', canProceed, 'answers[4]:', answers[4], 'answers[4_sub]:', answers['4_sub']);
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
            question.options.forEach((option, index) => {
                if (typeof option === 'string' && option.trim()) {
                    const escapedOption = escapeHtml(option);
                    const isSelected = answers[question.id] === option;
                    html += `
                        <label class="option ${isSelected ? 'selected' : ''}" onclick="selectOption('${escapedOption}')">
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
                        ${currentStep === questions.length - 1 ? 'Voir les résultats' : 'Suivant'}
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
            if (key === '4') {
                answers['4_sub'] = null;
            } else if (key === '4_sub') {
                answers[4] = null;
            }
        }
        answers[key] = option;
        // console.log('Sélection micro:', key, option, 'Réponses:', answers);
        showQuestion();
        
        // Forcer la mise à jour du bouton Suivant
        setTimeout(() => {
            const nextBtn = document.querySelector('.btn-primary');
            if (nextBtn) {
                const canProceed = (answers[4] !== null && answers[4] !== undefined || answers['4_sub'] !== null && answers['4_sub'] !== undefined);
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
        if (question.id === 4) {
            // Cas spécial pour l'étape 4 (micros avec sous-questions)
            if (!answers[4] && !answers['4_sub']) {
                console.warn('Aucune option sélectionnée pour l\'étape 4');
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
            // Si Sur rails est choisi, on passe à l'étape 2 (couleur)
            currentStep++; // Index 1 = étape 2 (couleur)
        } else if (question.id === 3) {
            // Étape surface
            if (answers[question.id] === "au-delà de 250m²") {
                showResults();
                return;
            }
            // Si Sur rails était choisi à l'étape 1, passer à l'étape de télécommande
            if (answers[1] === "Sur rails") {
                currentStep = 6; // Index 6 = étape 7 (télécommande)
            } else {
                // Pour les autres parcours, passer à l'étape 4 (micro d'appel)
                currentStep++;
            }
        } else if (question.id === 5) {
            // Étape nombre de zones
            if (answers[question.id] === "Plus de 4 zones") {
                showResults();
                return;
            }
            currentStep++;
        } else if (question.id === 6) {
            // Étape commande de volume
            // Si on n'est pas dans le parcours "Sur rails", sauter les étapes 7 et 8
            if (answers[1] !== "Sur rails") {
                showResults();
                return;
            } else {
                currentStep++;
            }
        } else if (question.id === 7) {
            // Étape télécommande (uniquement pour "Sur rails")
            currentStep++;
        } else if (question.id === 8) {
            // Étape nombre de zones (uniquement pour "Sur rails")
            if (answers[question.id] === "Plus dune zone") {
                showResults();
                return;
            } else {
                currentStep++;
            }
        } else {
            currentStep++;
        }
        
        // Vérifier si on a terminé
        if (currentStep >= questions.length) {
            showResults();
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

// Afficher les résultats avec gestion d'erreur renforcée
function showResults() {
    try {
        calculateMaterials();
        
        const questionContainer = getElementSafely('questionContainer');
        const resultsContainer = getElementSafely('resultsContainer');
        
        if (!questionContainer || !resultsContainer) {
            console.error('Éléments de résultats manquants');
            showErrorMessage('Erreur lors de l\'affichage des résultats');
            return;
        }
        
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
                    html += `</div>`;
                    html += `</form>`;
                    html += `</div>`;
                } else {
                    html += `<div class="devis-actions">`;
                    html += `<button class="btn btn-secondary" onclick="downloadCahierDesCharges()">Télécharger le cahier des charges</button>`;
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
                materials.forEach(material => {
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
        const microSameZone = answers[4]; // 3.1
        const microMultiZone = answers['4_sub']; // 3.2
        const zones = answers[5];
        const volumeControl = answers[6];
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
            if (zonesSurRails === "Plus dune zone") {
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
        if (surface === "au-delà de 250m²") {
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
        
        // Vérifier si on a une commande volume + source (force MZ140Q)
        const hasVolumeSource = volumeControl && volumeControl.includes("+ source");
        
        // Gestion zones et amplis
        if ((zones === "1" || zones === "2") && (nbMicroSameZone === 0 && nbMicroMultiZone === 0)) {
            // Zones 1-2 avec 0 micros : selon les commandes de volume
            if (hasVolumeSource) {
                amplificateur = '1 x HH Audio MZ140Q';
            } else if (volumeControl && volumeControl.includes("commande de volume")) {
                amplificateur = addEclerBrand('eHMA250');
            } else if (!volumeControl) {
                amplificateur = addEclerBrand('eHMA120');
            }
        } else if ((zones === "1" || zones === "2") && (nbMicroSameZone >= 1 && nbMicroSameZone <= 4) && !hasVolumeSource) {
            amplificateur = addEclerBrand('eHMA250');
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
            if (amplificateur === addEclerBrand('eHMA120') || amplificateur === addEclerBrand('eHMA250')) {
                amplificateur = '1 x HH Audio MZ140Q';
            }
        }
        
        // Si eHMA120 avec volume simple, forcer eHMA250
        if (amplificateur === addEclerBrand('eHMA120') && volumeControl && volumeControl.includes("commande de volume") && !hasVolumeSource) {
            amplificateur = addEclerBrand('eHMA250');
        }
        
        // Cas où commande volume + source mais aucun amplificateur sélectionné
        if (hasVolumeSource && !amplificateur) {
            amplificateur = '1 x HH Audio MZ140Q';
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
                materials.push(`Amplificateur ${amplificateur}`);
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
        
        // Gestion commandes de volume et source
        if (volumeControl) {
            let nbCmd = 1;
            if (volumeControl.startsWith("2")) nbCmd = 2;
            if (volumeControl.startsWith("3")) nbCmd = 3;
            if (volumeControl.startsWith("4")) nbCmd = 4;
            // Si matrice ou eHMA120
            if (amplificateur === '1 x HH Audio MZ140Q') {
                materials.push(`${nbCmd} x HH Audio MZ-C2-EU ${color}`);
            } else if (amplificateur === addEclerBrand('eHMA120')) {
                // eHMA120 ne peut pas gérer les commandes de volume, upgrade vers eHMA250
                if (volumeControl.includes("+ source")) {
                    materials = materials.filter(m => !m.includes('eHMA120'));
                    materials.push('1 x HH Audio MZ140Q');
                    materials.push(`${nbCmd} x HH Audio MZ-C2-EU ${color}`);
                } else {
                    // Volume simple : upgrade vers eHMA250 (déjà fait plus haut)
                    materials = materials.filter(m => !m.includes('eHMA120'));
                    materials.push(`Amplificateur ${addEclerBrand('eHMA250')}`);
                    materials.push(`${nbCmd} x ${addEclerBrand('WPaVOL')}`);
                }
            } else if (amplificateur === addEclerBrand('eHMA250')) {
                // eHMA250 ne peut pas gérer volume + source
                if (volumeControl.includes("+ source")) {
                    materials = materials.filter(m => !m.includes('eHMA250'));
                    materials.push('1 x HH Audio MZ140Q');
                    materials.push(`${nbCmd} x HH Audio MZ-C2-EU ${color}`);
                } else {
                    materials.push(`${nbCmd} x ${addEclerBrand('WPaVOL')}`);
                }
            }
        }
        // Cas où surface > 250m² ou zones > 4 déjà traités plus haut
        // Cas où aucun matériel n'est sélectionné
        if (materials.length === 0) {
            materials.push("Aucun matériel recommandé pour cette configuration");
        }
        
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
        const surfaceOptions = ['40m²', '60m²', '80m²', '120m²', 'au-delà de 250m²'];
        surfaceOptions.forEach(option => {
            const isSelected = surface === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 4 - Micros (si applicable)
        if (answers[4] !== undefined || answers['4_sub'] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 4 - Choix du micro d\'appel', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            
            const microSameZone = answers[4];
            const microMultiZone = answers['4_sub'];
            
            // Option 1 - Micro d'appel général
            const hasMicroSameZone = microSameZone && parseInt(microSameZone) > 0;
            doc.text(`${hasMicroSameZone ? '[X]' : '[ ]'} Option n°1 - Micro d'appel général : ${microSameZone || 0} micros`, 25, yPosition);
            yPosition += 8;
            
            // Option 2 - Micro d'appel indépendant
            const hasMicroMultiZone = microMultiZone && parseInt(microMultiZone) > 0;
            doc.text(`${hasMicroMultiZone ? '[X]' : '[ ]'} Option n°2 - Micro d'appel indépendant : ${microMultiZone || 0} micros`, 25, yPosition);
            yPosition += 8;
        }
        
        // Étape 5 - Nombre de zones
        if (answers[5] !== undefined) {
            yPosition += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 5 - Nombre de zones', 20, yPosition);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            const zones = answers[5];
            const zonesOptions = ['1', '2', '3', '4', 'Plus de 4 zones'];
            zonesOptions.forEach(option => {
                const isSelected = zones === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 7;
            });
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
        const surfaceOptions = ['40m²', '60m²', '80m²', '120m²', 'au-delà de 250m²'];
        surfaceOptions.forEach(option => {
            const isSelected = surface === option;
            doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Étape 4 - Micros (si applicable)
        if (answers[4] !== undefined || answers['4_sub'] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 4 - Choix du micro d\'appel', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            
            const microSameZone = answers[4];
            const microMultiZone = answers['4_sub'];
            
            // Option 1 - Micro d'appel général
            const hasMicroSameZone = microSameZone && parseInt(microSameZone) > 0;
            doc.text(`${hasMicroSameZone ? '[X]' : '[ ]'} Option n°1 - Micro d'appel général : ${microSameZone || 0} micros`, 25, yPosition);
            yPosition += 8;
            
            // Option 2 - Micro d'appel indépendant
            const hasMicroMultiZone = microMultiZone && parseInt(microMultiZone) > 0;
            doc.text(`${hasMicroMultiZone ? '[X]' : '[ ]'} Option n°2 - Micro d'appel indépendant : ${microMultiZone || 0} micros`, 25, yPosition);
            yPosition += 8;
        }
        
        // Étape 5 - Nombre de zones
        if (answers[5] !== undefined) {
            yPosition += 8;
            checkPageBreak();
            doc.setFont('helvetica', 'bold');
            doc.text('ÉTAPE 5 - Nombre de zones', 20, yPosition);
            yPosition += 12;
            doc.setFont('helvetica', 'normal');
            const zones = answers[5];
            const zonesOptions = ['1', '2', '3', '4', 'Plus de 4 zones'];
            zonesOptions.forEach(option => {
                const isSelected = zones === option;
                doc.text(`${isSelected ? '[X]' : '[ ]'} ${option}`, 25, yPosition);
                yPosition += 8;
            });
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
    const zones = answers[5];
    const zonesSurRails = answers[8];
    
    // Vérifier que les réponses existent
    if (!speaker) {
        return null;
    }
    
    // Sur rails + surface > 250m²
    if (speaker === "Sur rails" && surface === "au-delà de 250m²") {
        return 'sur_rails_surface';
    }
    
    // Sur rails + plus d'une zone
    if (speaker === "Sur rails" && zonesSurRails === "Plus dune zone") {
        return 'sur_rails_zones';
    }
    
    // Surface > 250m² (autres parcours)
    if (speaker !== "Sur rails" && surface === "au-delà de 250m²") {
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
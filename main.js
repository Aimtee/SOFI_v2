const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Initialiser @electron/remote pour permettre l'accès aux APIs Electron depuis le processus de rendu
try {
    require('@electron/remote/main').initialize();
} catch (error) {
    console.warn('@electron/remote non disponible:', error.message);
}

// Garder une référence globale de l'objet window
// Si vous ne le faites pas, la fenêtre sera fermée automatiquement
// quand l'objet JavaScript sera collecté par le garbage collector.
let mainWindow;

function createWindow() {
    // Créer la fenêtre du navigateur
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false,
            webSecurity: true
        },
        icon: path.join(__dirname, 'logo-mid.png'),
        title: 'Configurateur Audio MID Audio',
        show: false // Ne pas afficher jusqu'à ce que la page soit prête
    });

    // Charger le fichier index.html de l'app
    mainWindow.loadFile('index.html');

    // Permettre l'accès aux APIs Electron depuis le processus de rendu
    try {
        require('@electron/remote/main').enable(mainWindow.webContents);
    } catch (error) {
        console.warn('@electron/remote non disponible pour le rendu:', error.message);
    }

    // Afficher la fenêtre quand la page est prête
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Ouvrir les outils de développement en mode développement
        if (process.env.NODE_ENV === 'development') {
            mainWindow.webContents.openDevTools();
        }
    });

    // Émettre quand la fenêtre est fermée
    mainWindow.on('closed', () => {
        // Déréférencer l'objet window, normalement vous stockeriez les fenêtres
        // dans un tableau si votre app supporte plusieurs fenêtres, c'est le moment
        // où vous devriez supprimer l'élément correspondant.
        mainWindow = null;
    });

    // Gérer les liens externes
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Ouvrir les liens externes dans le navigateur par défaut
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Cette méthode sera appelée quand Electron aura fini
// l'initialisation et sera prêt à créer des fenêtres de navigateur.
// Certaines APIs peuvent être utilisées seulement après cet événement.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // Sur macOS il est commun de recréer une fenêtre dans l'app quand le
        // dock icon est cliqué et qu'il n'y a pas d'autres fenêtres ouvertes.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS. Là, il est commun
// pour les applications et leur barre de menu de rester actives jusqu'à ce qu'ils soient
// quittés explicitement avec Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Dans ce fichier vous pouvez inclure le reste du code spécifique au processus principal
// de votre app. Vous pouvez aussi les mettre dans des fichiers séparés et les inclure ici.

// Créer le menu de l'application
const template = [
    {
        label: 'Fichier',
        submenu: [
            {
                label: 'Nouveau',
                accelerator: 'CmdOrCtrl+N',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('new-configuration');
                    }
                }
            },
            {
                label: 'Ouvrir...',
                accelerator: 'CmdOrCtrl+O',
                click: async () => {
                    const result = await dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile'],
                        filters: [
                            { name: 'Fichiers JSON', extensions: ['json'] }
                        ]
                    });
                    
                    if (!result.canceled && result.filePaths.length > 0) {
                        const filePath = result.filePaths[0];
                        const data = fs.readFileSync(filePath, 'utf8');
                        mainWindow.webContents.send('load-configuration', data);
                    }
                }
            },
            {
                label: 'Enregistrer sous...',
                accelerator: 'CmdOrCtrl+S',
                click: async () => {
                    const result = await dialog.showSaveDialog(mainWindow, {
                        filters: [
                            { name: 'Fichiers JSON', extensions: ['json'] }
                        ]
                    });
                    
                    if (!result.canceled) {
                        mainWindow.webContents.send('save-configuration', result.filePath);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Quitter',
                accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                click: () => {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Édition',
        submenu: [
            { role: 'undo', label: 'Annuler' },
            { role: 'redo', label: 'Rétablir' },
            { type: 'separator' },
            { role: 'cut', label: 'Couper' },
            { role: 'copy', label: 'Copier' },
            { role: 'paste', label: 'Coller' },
            { role: 'selectall', label: 'Tout sélectionner' }
        ]
    },
    {
        label: 'Affichage',
        submenu: [
            { role: 'reload', label: 'Recharger' },
            { role: 'forceReload', label: 'Forcer le rechargement' },
            { role: 'toggleDevTools', label: 'Outils de développement' },
            { type: 'separator' },
            { role: 'resetZoom', label: 'Zoom normal' },
            { role: 'zoomIn', label: 'Zoom avant' },
            { role: 'zoomOut', label: 'Zoom arrière' },
            { type: 'separator' },
            { role: 'togglefullscreen', label: 'Plein écran' }
        ]
    },
    {
        label: 'Aide',
        submenu: [
            {
                label: 'À propos',
                click: () => {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'À propos',
                        message: 'Configurateur Audio MID Audio',
                        detail: 'Version 1.0.0\n\nApplication de configuration audio professionnelle.\nDéveloppée avec Electron et les technologies web.'
                    });
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu); 
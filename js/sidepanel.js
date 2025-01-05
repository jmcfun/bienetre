import { PERIODS, STORAGE_KEY } from './constants.js';
import { BasicStats } from './basic-stats.js';
import { premiumFeatures } from './premium-features.js';
import { premiumManager } from './premium.js';
import { ExportService } from './services/export-service.js';

const basicStats = new BasicStats();
const exportService = new ExportService();

// Écouter les changements de stockage
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes[STORAGE_KEY]) {
        console.log('Nouvelles données détectées, mise à jour du panneau');
        updatePanelData();
    }
});

// Fonction pour mettre à jour toutes les données du panneau
async function updatePanelData() {
    try {
        const entries = await loadEntries();
        console.log('Mise à jour avec nouvelles entrées:', entries);

        if (!entries || entries.length === 0) {
            console.log('Aucune entrée trouvée');
            document.querySelector('.prediction-value').textContent = 'Pas assez de données';
            return;
        }

        // Mettre à jour les statistiques de base
        await basicStats.updateCharts();

        // Mettre à jour la partie premium
        await premiumFeatures.updatePremiumUI(entries);

        console.log('Panneau mis à jour avec succès');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du panneau:', error);
        showNotification('Erreur lors de la mise à jour des données', true);
    }
}

// Ajouter cette fonction dans votre code
function updatePremiumOverlays() {
    const isPremium = premiumManager.isActiveSubscription();
    const isDevMode = localStorage.getItem('devMode') === 'true';
    const overlays = document.querySelectorAll('.premium-overlay');
    
    overlays.forEach(overlay => {
        if (isPremium || isDevMode) {
            overlay.style.display = 'none';
        } else {
            overlay.style.display = 'flex';
        }
    });
}

// Gestion des onglets et initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser l'UI d'export
    exportService.initializeExportUI();

    try {
        // Initialiser le switch mode dev
        const devModeToggle = document.getElementById('devModeToggle');
        if (devModeToggle) {
            devModeToggle.checked = localStorage.getItem('devMode') === 'true';
            devModeToggle.addEventListener('change', () => {
                premiumManager.toggleDevMode();
            });
        }

        // Gestion des onglets
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        function switchTab(tabId) {
            // Si c'est le bouton accueil, retourner à la popup
            if (tabId === 'home') {
                chrome.action.openPopup();
                return;
            }

            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Activer l'onglet sélectionné
            const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
            const selectedPane = document.getElementById(tabId);

            if (selectedButton && selectedPane) {
                selectedButton.classList.add('active');
                selectedPane.classList.add('active');
            }
        }

        // Écouteurs d'événements pour les boutons d'onglets
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                switchTab(tabId);
            });
        });

        // Mettre à jour l'affichage des overlays
        updatePremiumOverlays();

        // Écouter les changements de mode dev
        document.getElementById('devModeToggle')?.addEventListener('change', () => {
            updatePremiumOverlays();
        });

        // Vérifier si on doit ouvrir l'onglet Premium
        const data = await chrome.storage.local.get('openPremiumSection');
        if (data.openPremiumSection) {
            await chrome.storage.local.remove('openPremiumSection');
            switchTab('premium-features');  // Activer l'onglet Premium
        } else {
            // Par défaut, afficher l'onglet "Statistiques"
            switchTab('basic-stats');
        }

        await premiumFeatures.init();
        await updatePanelData();

    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement des données', true);
    }
});

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function loadEntries() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        console.log('Données chargées:', data[STORAGE_KEY]);
        return data[STORAGE_KEY] || [];
    } catch (error) {
        console.error('Erreur chargement données:', error);
        return [];
    }
} 
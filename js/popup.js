// Constantes pour le stockage des données
const STORAGE_KEY = 'moodJournal';

// État initial
let currentMood = null;

// Sélecteurs DOM
const moodButtons = document.querySelectorAll('.mood-btn');
const energyLevel = document.querySelector('input.energy-level');
const stressLevel = document.querySelector('input.stress-level');
const notesInput = document.querySelector('.notes-section textarea');
const saveButton = document.querySelector('.save-btn');

// Gestionnaires d'événements
moodButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Retire la sélection précédente
        moodButtons.forEach(btn => btn.classList.remove('selected'));
        // Ajoute la sélection au bouton cliqué
        button.classList.add('selected');
        currentMood = button.dataset.mood;
    });
});

saveButton.addEventListener('click', async () => {
    if (!currentMood) {
        showNotification('Veuillez sélectionner une humeur');
        return;
    }

    const entry = {
        timestamp: new Date().toISOString(),
        mood: currentMood,
        energy: energyLevel.value,
        stress: stressLevel.value,
        activity: document.querySelector('.activity-level').value,
        sleep: document.querySelector('.sleep-quality').value,
        social: document.querySelector('.social-level').value,
        notes: notesInput.value.trim(),
    };

    try {
        await saveEntry(entry);
        showNotification('Journal sauvegardé avec succès!');
        resetForm();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', true);
    }
});

// Fonctions utilitaires
async function saveEntry(entry) {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const entries = data[STORAGE_KEY] || [];
    entries.push(entry);
    await chrome.storage.local.set({ [STORAGE_KEY]: entries });
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function resetForm() {
    currentMood = null;
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    energyLevel.value = 3;
    stressLevel.value = 3;
    notesInput.value = '';
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Réinitialise le formulaire
    resetForm();

    // Gestion du bouton statistiques
    const statsButton = document.querySelector('.stats-btn');
    if (statsButton) {
        statsButton.addEventListener('click', async () => {
            try {
                await chrome.storage.local.set({ 'fromPopup': true });
                await chrome.sidePanel.open({
                    tabId: await getCurrentTabId()
                });
                window.close();
            } catch (error) {
                console.error('Erreur lors de l\'ouverture du panneau:', error);
                showNotification('Erreur lors de l\'ouverture des statistiques', true);
            }
        });
    }

    // Gestion du bouton premium
    const premiumButton = document.querySelector('.premium-features-btn');
    if (premiumButton) {
        premiumButton.addEventListener('click', async () => {
            try {
                await chrome.storage.local.set({ 
                    'fromPopup': true,
                    'openPremiumSection': true
                });
                await chrome.sidePanel.open({
                    tabId: await getCurrentTabId()
                });
                window.close();
            } catch (error) {
                console.error('Erreur lors de l\'ouverture du panneau:', error);
                showNotification('Erreur lors de l\'ouverture des analyses avancées', true);
            }
        });
    }
});

// Fonction utilitaire pour obtenir l'ID de l'onglet actuel
async function getCurrentTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.id;
} 
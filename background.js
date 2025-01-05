// Constantes
const ALARM_NAME = 'moodCheckReminder';
const STORAGE_KEY = 'moodJournal';
const NOTIFICATION_ID = 'moodReminder';
const DEFAULT_REMINDER_TIME = '20:00'; // 20h par défaut

// Configuration initiale lors de l'installation
chrome.runtime.onInstalled.addListener(async () => {
    // Initialise les paramètres par défaut
    const settings = {
        reminderEnabled: true,
        reminderTime: DEFAULT_REMINDER_TIME,
        lastNotificationDate: null
    };
    
    await chrome.storage.local.set({ settings });
    setupDailyAlarm(DEFAULT_REMINDER_TIME);
});

// Gestion des alarmes
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        const { settings } = await chrome.storage.local.get('settings');
        
        if (!settings.reminderEnabled) return;
        
        // Vérifie si une entrée a déjà été faite aujourd'hui
        const today = new Date().toLocaleDateString();
        const { lastNotificationDate } = settings;
        
        if (lastNotificationDate === today) return;
        
        // Vérifie si l'utilisateur a déjà fait une entrée aujourd'hui
        const hasEntryToday = await checkTodayEntry();
        if (!hasEntryToday) {
            showMoodReminder();
            // Met à jour la date de dernière notification
            settings.lastNotificationDate = today;
            await chrome.storage.local.set({ settings });
        }
    }
});

// Gestion des clics sur les notifications
chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === NOTIFICATION_ID) {
        // Ouvre la popup de l'extension
        chrome.action.openPopup();
    }
});

// Fonctions utilitaires
async function setupDailyAlarm(timeString) {
    // Supprime l'alarme existante si elle existe
    await chrome.alarms.clear(ALARM_NAME);
    
    // Configure la nouvelle alarme
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date(now);
    
    reminderTime.setHours(hours, minutes, 0);
    
    // Si l'heure est déjà passée, programme pour le lendemain
    if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const delayInMinutes = (reminderTime - now) / 1000 / 60;
    
    chrome.alarms.create(ALARM_NAME, {
        delayInMinutes,
        periodInMinutes: 24 * 60 // Répétition quotidienne
    });
}

async function checkTodayEntry() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const entries = data[STORAGE_KEY] || [];
    
    const today = new Date().toLocaleDateString();
    return entries.some(entry => 
        new Date(entry.timestamp).toLocaleDateString() === today
    );
}

function showMoodReminder() {
    const options = {
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: 'Journal d\'Humeur',
        message: 'Comment vous sentez-vous aujourd\'hui ? Prenez un moment pour noter votre humeur.',
        priority: 2,
        silent: false
    };
    
    chrome.notifications.create(NOTIFICATION_ID, options);
}

// Écoute les messages de la popup ou du panneau latéral
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'updateReminderSettings') {
        const { enabled, time } = request.settings;
        updateReminderSettings(enabled, time);
        sendResponse({ success: true });
    }
    return true; // Indique que nous allons envoyer une réponse de manière asynchrone
});

async function updateReminderSettings(enabled, time) {
    const { settings } = await chrome.storage.local.get('settings');
    settings.reminderEnabled = enabled;
    
    if (time && time !== settings.reminderTime) {
        settings.reminderTime = time;
        await setupDailyAlarm(time);
    }
    
    await chrome.storage.local.set({ settings });
} 
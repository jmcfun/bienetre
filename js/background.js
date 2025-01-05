// Écouter l'installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installé');
});

// Écouter l'activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activé');
});

// Vérifier les rappels périodiquement
async function checkReminders() {
    try {
        const data = await chrome.storage.local.get({ reminders: [] });
        const reminders = data.reminders || [];
        const now = new Date();

        // Filtrer les rappels invalides ou supprimés
        const validReminders = reminders.filter(reminder => 
            reminder && 
            reminder.active && 
            reminder.id && 
            reminder.lastCheck
        );

        for (const reminder of validReminders) {
            if (shouldTriggerReminder(reminder, now)) {
                await triggerNotification(reminder.message);
                reminder.lastCheck = now.toISOString();
                
                // Mettre à jour la liste complète des rappels
                const updatedReminders = reminders.map(r => 
                    r.id === reminder.id ? reminder : r
                );
                await chrome.storage.local.set({ reminders: updatedReminders });
            }
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des rappels:', error);
    }
}

// Créer une alarme pour vérifier les rappels toutes les minutes
chrome.alarms.onInstalled?.addListener(() => {
    chrome.alarms.create('checkReminders', { periodInMinutes: 1 });
});

// Écouter les alarmes
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkReminders') {
        checkReminders();
    }
});

// Écouter les clics sur les notifications
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.sidePanel.open();
});

// Écouter les messages du ReminderService
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_REMINDERS') {
        checkReminders();
    }
    return true;
});

// Fonction utilitaire pour créer une notification
async function triggerNotification(message) {
    const options = {
        type: 'basic',
        title: 'Rappel Journal d\'Humeur',
        message: message || 'N\'oubliez pas de mettre à jour votre journal !',
        iconUrl: '/images/icon48.png',
        priority: 2,
        silent: false,
        requireInteraction: true // La notification reste jusqu'à ce que l'utilisateur interagisse
    };

    try {
        await chrome.notifications.create('reminder_' + Date.now(), options);
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
        // Réessayer sans l'icône si erreur
        delete options.iconUrl;
        await chrome.notifications.create('reminder_' + Date.now(), options);
    }
}

// Fonction pour calculer l'intervalle entre les rappels
function calculateInterval(value, unit) {
    const intervals = {
        minutes: value * 60 * 1000,
        hours: value * 60 * 60 * 1000,
        days: value * 24 * 60 * 60 * 1000,
        months: value * 30 * 24 * 60 * 60 * 1000
    };
    return intervals[unit] || 0;
}

// Fonction pour vérifier si un rappel doit être déclenché
function shouldTriggerReminder(reminder, now) {
    if (!reminder || !reminder.lastCheck) return false;

    const lastCheck = new Date(reminder.lastCheck);
    const createdAt = new Date(reminder.createdAt);

    // Cas 1: Rappel unique à date et heure précises
    if (reminder.date && reminder.time) {
        const targetDateTime = new Date(reminder.date);
        const [hours, minutes] = reminder.time.split(':');
        targetDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return now >= targetDateTime && lastCheck < targetDateTime;
    }

    // Cas 2: Rappel quotidien à heure fixe
    if (reminder.time && !reminder.date && !reminder.frequencyValue) {
        const [hours, minutes] = reminder.time.split(':');
        const todayWithTime = new Date(now);
        todayWithTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const lastCheckDate = new Date(lastCheck);
        const isToday = lastCheckDate.toDateString() === now.toDateString();
        return now >= todayWithTime && (!isToday || lastCheck < todayWithTime);
    }

    // Cas 3: Rappel périodique
    if (reminder.frequencyValue && reminder.frequencyUnit) {
        const interval = calculateInterval(reminder.frequencyValue, reminder.frequencyUnit);
        const nextTrigger = new Date(lastCheck.getTime() + interval);
        return now >= nextTrigger;
    }

    // Cas 4: Rappel immédiat unique
    return now >= createdAt && lastCheck <= createdAt;
} 

// Initialiser le service de paiement
import { PaymentService } from './services/payment-service.js';
const paymentService = new PaymentService();

// Vérifier l'abonnement au démarrage
chrome.runtime.onStartup.addListener(async () => {
    await paymentService.verifySubscription();
});

// Écouter les messages liés aux abonnements
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_SUBSCRIPTION') {
        paymentService.verifySubscription()
            .then(status => sendResponse(status))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Indique que la réponse sera asynchrone
    }
}); 
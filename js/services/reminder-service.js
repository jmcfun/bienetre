import { WeatherService } from './weather-service.js';
import { GoalService } from './goal-service.js';

export class ReminderService {
    constructor() {
        this.STORAGE_KEY = 'reminders';
    }

    async getReminders() {
        try {
            const data = await chrome.storage.local.get(this.STORAGE_KEY);
            return data[this.STORAGE_KEY] || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des rappels:', error);
            return [];
        }
    }

    async addReminder(reminder) {
        try {
            const reminders = await this.getReminders();
            const newReminder = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                lastCheck: new Date().toISOString(),
                active: true,
                ...reminder
            };
            
            await chrome.storage.local.set({
                [this.STORAGE_KEY]: [...reminders, newReminder]
            });

            // Créer une alarme Chrome si nécessaire
            if (reminder.time || reminder.frequencyValue) {
                await this.createAlarm(newReminder);
            }

            return newReminder;
        } catch (error) {
            console.error('Erreur lors de l\'ajout du rappel:', error);
            throw error;
        }
    }

    async editReminder(id, updates) {
        try {
            const reminders = await this.getReminders();
            const index = reminders.findIndex(r => r.id === id);
            
            if (index === -1) throw new Error('Rappel non trouvé');

            const updatedReminder = {
                ...reminders[index],
                ...updates,
                lastCheck: new Date().toISOString()
            };

            reminders[index] = updatedReminder;
            
            await chrome.storage.local.set({
                [this.STORAGE_KEY]: reminders
            });

            // Mettre à jour l'alarme si nécessaire
            await this.updateAlarm(updatedReminder);

            return updatedReminder;
        } catch (error) {
            console.error('Erreur lors de la modification du rappel:', error);
            throw error;
        }
    }

    async deleteReminder(id) {
        try {
            const reminders = await this.getReminders();
            const filteredReminders = reminders.filter(r => r.id !== id);
            
            await chrome.storage.local.set({
                [this.STORAGE_KEY]: filteredReminders
            });

            // Supprimer l'alarme associée
            await chrome.alarms.clear(`reminder_${id}`);

            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du rappel:', error);
            throw error;
        }
    }

    async toggleReminder(id, active) {
        try {
            const reminders = await this.getReminders();
            const reminder = reminders.find(r => r.id === id);
            
            if (!reminder) throw new Error('Rappel non trouvé');

            reminder.active = active;
            reminder.lastCheck = new Date().toISOString();

            await chrome.storage.local.set({
                [this.STORAGE_KEY]: reminders
            });

            // Gérer l'alarme en fonction de l'état
            if (active) {
                await this.createAlarm(reminder);
            } else {
                await chrome.alarms.clear(`reminder_${id}`);
            }

            return reminder;
        } catch (error) {
            console.error('Erreur lors de la modification du statut:', error);
            throw error;
        }
    }

    calculateInterval(value, unit) {
        const intervals = {
            minutes: value * 60 * 1000,
            hours: value * 60 * 60 * 1000,
            days: value * 24 * 60 * 60 * 1000,
            months: value * 30 * 24 * 60 * 60 * 1000
        };
        return intervals[unit] || 0;
    }

    async createAlarm(reminder) {
        const alarmName = `reminder_${reminder.id}`;
        
        if (reminder.time) {
            const [hours, minutes] = reminder.time.split(':');
            const now = new Date();
            const scheduledTime = new Date(now);
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }

            const delayInMinutes = (scheduledTime - now) / 1000 / 60;
            await chrome.alarms.create(alarmName, {
                delayInMinutes,
                periodInMinutes: reminder.frequencyValue ? 
                    this.calculateInterval(reminder.frequencyValue, reminder.frequencyUnit) / (60 * 1000) : 
                    24 * 60 // quotidien par défaut
            });
        } else if (reminder.frequencyValue) {
            await chrome.alarms.create(alarmName, {
                delayInMinutes: 1,
                periodInMinutes: this.calculateInterval(
                    reminder.frequencyValue,
                    reminder.frequencyUnit
                ) / (60 * 1000)
            });
        }
    }

    async updateAlarm(reminder) {
        const alarmName = `reminder_${reminder.id}`;
        await chrome.alarms.clear(alarmName);
        
        if (reminder.active && (reminder.time || reminder.frequencyValue)) {
            await this.createAlarm(reminder);
        }
    }

    shouldTriggerReminder(reminder, now) {
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
        if (reminder.frequencyValue) {
            const interval = this.calculateInterval(reminder.frequencyValue, reminder.frequencyUnit);
            const nextTrigger = new Date(lastCheck.getTime() + interval);
            return now >= nextTrigger;
        }

        // Cas 4: Rappel immédiat unique
        return now >= createdAt && lastCheck <= createdAt;
    }
} 
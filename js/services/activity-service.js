// Service pour gérer les activités
export class ActivityService {
    constructor() {
        this.googleAuth = null; // Configuration de l'authentification Google
    }

    async getActivities(date) {
        try {
            // Récupérer les événements du calendrier
            const events = await this.getGoogleCalendarEvents(date);
            // Récupérer les activités physiques
            const workouts = await this.getStravaActivities(date);

            return {
                events: this.categorizeEvents(events),
                workouts: this.categorizeWorkouts(workouts)
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des activités:', error);
            return null;
        }
    }

    categorizeEvents(events) {
        // Catégoriser les événements par type (travail, loisir, social...)
        return events.map(event => ({
            type: this.detectEventType(event.summary),
            duration: this.calculateDuration(event.start, event.end),
            isPositive: this.isPositiveEvent(event.summary)
        }));
    }

    detectEventType(summary) {
        const keywords = {
            work: ['réunion', 'travail', 'projet'],
            social: ['dîner', 'sortie', 'amis'],
            leisure: ['sport', 'loisir', 'détente'],
            health: ['médecin', 'santé', 'rdv']
        };

        for (const [type, words] of Object.entries(keywords)) {
            if (words.some(word => summary.toLowerCase().includes(word))) {
                return type;
            }
        }
        return 'other';
    }
} 
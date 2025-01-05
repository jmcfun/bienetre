// Service pour gérer les activités
export class ActivityService {
    constructor() {
        this.STORAGE_KEY = 'activityData';
    }

    async getActivities() {
        try {
            // Pour l'instant, retourner des données simulées
            return {
                todayActivities: [
                    {
                        type: 'physical',
                        description: 'Activité physique modérée',
                        intensity: 0.6,
                        icon: '🏃'
                    },
                    {
                        type: 'social',
                        description: 'Interactions sociales',
                        intensity: 0.4,
                        icon: '👥'
                    }
                ],
                weeklyStats: {
                    physicalActivity: 3,
                    socialActivity: 4,
                    restDays: 2
                },
                trends: {
                    increasing: ['physical'],
                    decreasing: [],
                    stable: ['social']
                }
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des activités:', error);
            return {
                todayActivities: [],
                weeklyStats: {
                    physicalActivity: 0,
                    socialActivity: 0,
                    restDays: 0
                },
                trends: {
                    increasing: [],
                    decreasing: [],
                    stable: []
                }
            };
        }
    }

    async saveActivity(activity) {
        try {
            const currentData = await this.getActivities();
            currentData.todayActivities.push(activity);
            await chrome.storage.local.set({
                [this.STORAGE_KEY]: currentData
            });
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
            return false;
        }
    }

    calculateActivityScore(activities) {
        if (!activities || activities.length === 0) return 0;
        
        return activities.reduce((score, activity) => {
            const weights = {
                physical: 0.4,
                social: 0.3,
                leisure: 0.2,
                work: 0.1
            };
            return score + (activity.intensity * (weights[activity.type] || 0.1));
        }, 0) / activities.length;
    }
} 
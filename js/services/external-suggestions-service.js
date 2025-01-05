export class ExternalSuggestionsService {
    constructor() {
        // Suggestions par défaut en français
        this.DEFAULT_SUGGESTIONS = [
            {
                id: 'default-1',
                title: 'Méditation de pleine conscience',
                description: 'Pratiquez 10 minutes de méditation guidée pour réduire le stress et améliorer votre bien-être mental.',
                source: 'INSERM',
                category: 'bien-être',
                duration: '10 minutes',
                url: 'https://www.inserm.fr/dossier/meditation-pleine-conscience/'
            },
            {
                id: 'default-2',
                title: 'Exercice de respiration profonde',
                description: 'La technique 4-7-8 : inspirez sur 4 temps, retenez sur 7 temps, expirez sur 8 temps.',
                source: 'Santé Publique France',
                category: 'stress',
                duration: '5 minutes',
                url: 'https://www.santepubliquefrance.fr'
            },
            {
                id: 'default-3',
                title: 'Marche en pleine conscience',
                description: 'Une marche de 15 minutes en se concentrant sur ses sensations et son environnement.',
                source: 'Ameli',
                category: 'activité physique',
                duration: '15 minutes',
                url: 'https://www.ameli.fr'
            },
            {
                id: 'default-4',
                title: 'Journal de gratitude',
                description: 'Prenez 5 minutes pour noter trois choses positives de votre journée.',
                source: 'HAS',
                category: 'bien-être',
                duration: '5 minutes',
                url: 'https://www.has-sante.fr'
            },
            {
                id: 'default-5',
                title: 'Étirements doux',
                description: 'Série d\'étirements simples pour détendre le corps et l\'esprit.',
                source: 'INSERM',
                category: 'activité physique',
                duration: '10 minutes',
                url: 'https://www.inserm.fr'
            }
        ];
    }

    async fetchSuggestions(userStats = null) {
        console.log('Récupération des suggestions personnalisées...');
        return this.getDefaultSuggestions(userStats);
    }

    getDefaultSuggestions(userStats) {
        // Si pas assez de données utilisateur, renvoyer toutes les suggestions par défaut
        if (!userStats || !this.hasEnoughData(userStats)) {
            return this.DEFAULT_SUGGESTIONS;
        }

        // Filtrer et trier les suggestions selon les besoins de l'utilisateur
        const filteredSuggestions = this.DEFAULT_SUGGESTIONS.filter(suggestion => {
            if (userStats.stressLevel > 3 && suggestion.category === 'stress') return true;
            if (userStats.moodTrend < 3 && suggestion.category === 'bien-être') return true;
            if (userStats.physicalActivity < 3 && suggestion.category === 'activité physique') return true;
            return false;
        });

        // Si aucune suggestion ne correspond aux critères, renvoyer les suggestions par défaut
        return filteredSuggestions.length > 0 ? filteredSuggestions : this.DEFAULT_SUGGESTIONS;
    }

    hasEnoughData(stats) {
        return stats && 
               typeof stats.moodTrend === 'number' && 
               typeof stats.stressLevel === 'number' && 
               typeof stats.physicalActivity === 'number';
    }
} 
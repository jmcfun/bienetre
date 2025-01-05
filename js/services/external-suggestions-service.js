export class ExternalSuggestionsService {
    constructor() {
        this.MAX_SUGGESTIONS = 3; // Constante pour la limite
        
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
            }
        ];
    }

    async fetchSuggestions(userStats = null) {
        console.log('Récupération des suggestions personnalisées...');
        const suggestions = this.getDefaultSuggestions(userStats);
        return suggestions.slice(0, this.MAX_SUGGESTIONS);
    }

    getDefaultSuggestions(userStats) {
        // Si pas assez de données utilisateur, renvoyer les 3 suggestions par défaut
        if (!userStats || !this.hasEnoughData(userStats)) {
            return this.DEFAULT_SUGGESTIONS;
        }

        // Filtrer les suggestions selon les besoins de l'utilisateur
        const filteredSuggestions = this.DEFAULT_SUGGESTIONS.filter(suggestion => {
            if (userStats.stressLevel > 3 && suggestion.category === 'stress') return true;
            if (userStats.moodTrend < 3 && suggestion.category === 'bien-être') return true;
            if (userStats.physicalActivity < 3 && suggestion.category === 'activité physique') return true;
            return false;
        });

        // Si on n'a pas assez de suggestions filtrées, compléter avec les suggestions par défaut
        if (filteredSuggestions.length < this.MAX_SUGGESTIONS) {
            const remainingSuggestions = this.DEFAULT_SUGGESTIONS
                .filter(s => !filteredSuggestions.find(fs => fs.id === s.id))
                .slice(0, this.MAX_SUGGESTIONS - filteredSuggestions.length);
            return [...filteredSuggestions, ...remainingSuggestions];
        }
        
        return filteredSuggestions.slice(0, this.MAX_SUGGESTIONS);
    }

    hasEnoughData(stats) {
        return stats && 
               typeof stats.moodTrend === 'number' && 
               typeof stats.stressLevel === 'number' && 
               typeof stats.physicalActivity === 'number';
    }
} 
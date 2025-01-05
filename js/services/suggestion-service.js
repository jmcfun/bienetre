import { ExternalSuggestionsService } from './external-suggestions-service.js';

export class SuggestionService {
    constructor() {
        this.externalService = new ExternalSuggestionsService();
    }

    async getSuggestions(entries) {
        const stats = this.analyzeEntries(entries);
        return this.externalService.fetchSuggestions(stats);
    }

    analyzeEntries(entries) {
        return {
            moodTrend: this.calculateMoodTrend(entries),
            stressLevel: this.calculateAverageStress(entries),
            sleepQuality: this.calculateAverageSleep(entries),
            socialActivity: this.calculateAverageSocial(entries),
            physicalActivity: this.calculateAverageActivity(entries),
            commonTriggers: this.identifyCommonTriggers(entries),
            successfulStrategies: this.findSuccessfulStrategies(entries)
        };
    }

    calculateAverageStress(entries) {
        if (!entries || entries.length === 0) return 3;
        const sum = entries.reduce((acc, entry) => acc + parseInt(entry.stress || 3), 0);
        return sum / entries.length;
    }

    calculateAverageSleep(entries) {
        if (!entries || entries.length === 0) return 3;
        const sum = entries.reduce((acc, entry) => acc + parseInt(entry.sleep || 3), 0);
        return sum / entries.length;
    }

    calculateAverageSocial(entries) {
        if (!entries || entries.length === 0) return 3;
        const sum = entries.reduce((acc, entry) => acc + parseInt(entry.social || 3), 0);
        return sum / entries.length;
    }

    calculateAverageActivity(entries) {
        if (!entries || entries.length === 0) return 3;
        const sum = entries.reduce((acc, entry) => acc + parseInt(entry.activity || 3), 0);
        return sum / entries.length;
    }

    calculateMoodTrend(entries) {
        if (!entries || entries.length === 0) return 3;
        const moodScores = entries.map(e => this.getMoodScore(e.mood));
        return moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    }

    getMoodScore(mood) {
        const scores = {
            'très-bien': 5,
            'bien': 4,
            'neutre': 3,
            'pas-bien': 2,
            'mal': 1
        };
        return scores[mood] || 3;
    }

    identifyCommonTriggers(entries) {
        const triggers = [];
        if (!entries || entries.length < 2) return triggers;

        // Identifier les motifs dans les notes
        entries.forEach(entry => {
            if (entry.notes && this.getMoodScore(entry.mood) <= 2) {
                const keywords = this.extractKeywords(entry.notes);
                triggers.push(...keywords);
            }
        });

        return this.getTopTriggers(triggers);
    }

    findSuccessfulStrategies(entries) {
        const strategies = [];
        if (!entries || entries.length < 2) return strategies;

        // Identifier les activités associées aux bonnes humeurs
        entries.forEach(entry => {
            if (this.getMoodScore(entry.mood) >= 4) {
                if (parseInt(entry.activity) >= 4) strategies.push('activité physique');
                if (parseInt(entry.social) >= 4) strategies.push('interactions sociales');
                if (parseInt(entry.sleep) >= 4) strategies.push('bon sommeil');
            }
        });

        return Array.from(new Set(strategies));
    }

    extractKeywords(text) {
        const commonTriggers = ['stress', 'travail', 'fatigue', 'conflit', 'sommeil'];
        return commonTriggers.filter(trigger => 
            text.toLowerCase().includes(trigger)
        );
    }

    getTopTriggers(triggers) {
        const counts = triggers.reduce((acc, trigger) => {
            acc[trigger] = (acc[trigger] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([trigger]) => trigger);
    }

    async markSuggestionAsTried(suggestionId) {
        try {
            const triedSuggestions = await this.getTriedSuggestions();
            triedSuggestions.push({
                id: suggestionId,
                timestamp: Date.now()
            });
            await chrome.storage.local.set({ 
                triedSuggestions: triedSuggestions.slice(-50) // Garder les 50 dernières
            });
        } catch (error) {
            console.error('Erreur lors du marquage de la suggestion:', error);
        }
    }

    async getTriedSuggestions() {
        try {
            const data = await chrome.storage.local.get('triedSuggestions');
            return data.triedSuggestions || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des suggestions essayées:', error);
            return [];
        }
    }

    prioritizeSuggestions(suggestions, stats) {
        return suggestions
            .map(suggestion => ({
                ...suggestion,
                priority: this.calculateSuggestionPriority(suggestion, stats)
            }))
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5); // Retourner les 5 meilleures suggestions
    }

    calculateSuggestionPriority(suggestion, stats) {
        let priority = suggestion.expectedImpact;

        // Ajuster la priorité en fonction des statistiques
        if (suggestion.category === 'stress' && stats.stressLevel > 3) {
            priority *= 1.5;
        }
        if (suggestion.category === 'sommeil' && stats.sleepQuality < 3) {
            priority *= 1.3;
        }

        return priority;
    }
} 
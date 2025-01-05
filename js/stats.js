import { MOOD_SCORES } from './premium-features.js';

export class MoodAnalytics {
    constructor(entries) {
        this.entries = entries;
    }

    getWeeklyTrends() {
        const weeklyData = this.groupByWeek();
        return {
            averageMood: this.calculateAverageMoodByPeriod(weeklyData),
            moodVariability: this.calculateMoodVariability(weeklyData),
            bestDays: this.findBestDays(),
            worstDays: this.findWorstDays(),
            improvements: this.findImprovements()
        };
    }

    getMoodCorrelations() {
        return {
            energyCorrelation: this.calculateCorrelation('energy'),
            stressCorrelation: this.calculateCorrelation('stress'),
            timeOfDayEffect: this.analyzeTimeOfDay(),
            weekdayEffect: this.analyzeWeekdayEffect()
        };
    }

    getPredictiveInsights() {
        const recentEntries = this.entries.slice(-7);
        const moodTrend = this.calculateTrend(recentEntries);
        const predictedMood = this.predictNextMood(recentEntries);

        return {
            predictedMood: predictedMood,
            confidence: this.calculatePredictionConfidence(recentEntries),
            factors: this.identifyInfluencingFactors(recentEntries),
            suggestions: this.generateSuggestions(recentEntries)
        };
    }

    // Méthodes d'analyse
    calculateTrend(entries) {
        const moodScores = entries.map(e => MOOD_SCORES[e.mood]);
        const sum = moodScores.reduce((a, b) => a + b, 0);
        return sum / moodScores.length;
    }

    predictNextMood(entries) {
        const recentMoods = entries.map(e => MOOD_SCORES[e.mood]);
        const trend = this.calculateTrend(entries);
        const lastMood = recentMoods[recentMoods.length - 1];
        
        // Prédiction basée sur la tendance et la dernière humeur
        const predictedScore = (trend + lastMood) / 2;
        
        // Convertir le score en humeur
        return this.scoreToMood(predictedScore);
    }

    calculatePredictionConfidence(entries) {
        const moodScores = entries.map(e => MOOD_SCORES[e.mood]);
        const variance = this.calculateVariance(moodScores);
        
        // Plus la variance est faible, plus la confiance est élevée
        const confidence = Math.max(0, 100 - (variance * 20));
        return Math.round(confidence);
    }

    identifyInfluencingFactors(entries) {
        const factors = [];
        
        // Analyser les notes pour identifier les mots-clés positifs/négatifs
        entries.forEach(entry => {
            const notes = entry.notes.toLowerCase();
            const mood = MOOD_SCORES[entry.mood];
            
            if (mood >= 4) {
                if (notes.includes('sport')) factors.push('Activité physique');
                if (notes.includes('ami')) factors.push('Interactions sociales');
                if (notes.includes('nature')) factors.push('Temps en extérieur');
            }
            
            if (mood <= 2) {
                if (notes.includes('stress')) factors.push('Stress');
                if (notes.includes('fatigue')) factors.push('Fatigue');
                if (notes.includes('travail')) factors.push('Charge de travail');
            }
        });
        
        return [...new Set(factors)]; // Éliminer les doublons
    }

    generateSuggestions(entries) {
        const positiveFactors = this.identifyInfluencingFactors(
            entries.filter(e => MOOD_SCORES[e.mood] >= 4)
        );
        
        return positiveFactors.map(factor => {
            switch (factor) {
                case 'Activité physique':
                    return 'Maintenez une routine d\'exercice régulière';
                case 'Interactions sociales':
                    return 'Planifiez plus de moments avec vos amis';
                case 'Temps en extérieur':
                    return 'Essayez de passer plus de temps en nature';
                default:
                    return `Continuez à ${factor.toLowerCase()}`;
            }
        });
    }

    // Méthodes utilitaires
    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b) / numbers.length;
        return numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    }

    scoreToMood(score) {
        if (score >= 4.5) return 'très-bien';
        if (score >= 3.5) return 'bien';
        if (score >= 2.5) return 'neutre';
        if (score >= 1.5) return 'pas-bien';
        return 'mal';
    }

    groupByWeek() {
        const weeklyData = {};
        this.entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const weekNumber = this.getWeekNumber(date);
            if (!weeklyData[weekNumber]) {
                weeklyData[weekNumber] = [];
            }
            weeklyData[weekNumber].push(entry);
        });
        return weeklyData;
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
} 
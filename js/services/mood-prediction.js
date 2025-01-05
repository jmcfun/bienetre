import { MOOD_SCORES, MOOD_LABELS } from '../constants.js';

export class MoodPredictor {
    constructor() {
        // Poids des différents facteurs (à ajuster selon l'apprentissage)
        this.weights = {
            weather: 0.20,
            dayOfWeek: 0.10,
            previousMood: 0.20,
            stress: 0.15,
            energy: 0.10,
            activity: 0.10,
            sleep: 0.10,
            social: 0.05
        };

        // Facteurs positifs/négatifs pour chaque jour
        this.dayFactors = {
            0: -0.1,  // Dimanche
            1: -0.05, // Lundi
            2: 0,     // Mardi
            3: 0.05,  // Mercredi
            4: 0.1,   // Jeudi
            5: 0.15,  // Vendredi
            6: 0.1    // Samedi
        };
    }

    async predictMood(entries, weatherData) {
        if (!entries || entries.length === 0) return null;

        const recentEntries = entries.slice(-7);
        console.log('Entrées récentes:', recentEntries); // Debug

        // Vérifier que les entrées contiennent toutes les données nécessaires
        const hasRequiredData = recentEntries.every(entry => 
            entry.mood && entry.energy && entry.stress && 
            entry.activity && entry.sleep && entry.social
        );

        if (!hasRequiredData) {
            console.warn('Données manquantes dans les entrées');
            return {
                predictedMood: 'neutre',
                confidence: 0.3,
                factors: [{
                    type: 'warning',
                    description: 'Données insuffisantes pour une prédiction précise',
                    impact: 0,
                    icon: '⚠️'
                }]
            };
        }

        const today = new Date();

        // Calcul des différents facteurs
        const weatherScore = this.calculateWeatherScore(weatherData);
        const dayScore = this.dayFactors[today.getDay()];
        const previousMoodScore = this.calculatePreviousMoodTrend(recentEntries);
        const stressScore = this.calculateStressImpact(recentEntries);
        const energyScore = this.calculateEnergyImpact(recentEntries);
        const activityScore = this.calculateActivityImpact(recentEntries);
        const sleepScore = this.calculateSleepImpact(recentEntries);
        const socialScore = this.calculateSocialImpact(recentEntries);

        // Calcul pondéré de la prédiction finale
        const predictionScore = (
            weatherScore * this.weights.weather +
            dayScore * this.weights.dayOfWeek +
            previousMoodScore * this.weights.previousMood +
            stressScore * this.weights.stress +
            energyScore * this.weights.energy +
            activityScore * this.weights.activity +
            sleepScore * this.weights.sleep +
            socialScore * this.weights.social
        );

        // Calcul de la confiance
        const confidence = this.calculateConfidence(recentEntries, weatherData);

        // Identification des facteurs significatifs
        const factors = this.identifySignificantFactors({
            weather: weatherScore,
            previousMood: previousMoodScore,
            stress: stressScore,
            energy: energyScore,
            activity: activityScore,
            sleep: sleepScore,
            social: socialScore
        }, weatherData);

        return {
            predictedMood: this.scoresToMood(predictionScore),
            confidence,
            factors
        };
    }

    calculateWeatherScore(weatherData) {
        if (!weatherData) return 0;

        let score = 0;

        // Impact de la température
        const temp = weatherData.temperature;
        if (temp >= 18 && temp <= 25) score += 0.3;
        else if (temp >= 15 && temp <= 28) score += 0.1;
        else score -= 0.2;

        // Impact des conditions météo
        const conditions = weatherData.conditions.toLowerCase();
        if (conditions.includes('clear')) score += 0.3;
        else if (conditions.includes('rain')) score -= 0.2;
        else if (conditions.includes('cloud')) score -= 0.1;

        return Math.max(-1, Math.min(1, score));
    }

    calculatePreviousMoodTrend(entries) {
        if (entries.length < 2) return 0;

        let trend = 0;
        for (let i = 1; i < entries.length; i++) {
            const diff = MOOD_SCORES[entries[i].mood] - MOOD_SCORES[entries[i-1].mood];
            trend += diff;
        }

        return trend / (entries.length - 1);
    }

    calculateStressImpact(entries) {
        if (!entries.length) return 0;
        const recentStress = entries.map(e => parseInt(e.stress));
        const avgStress = recentStress.reduce((a, b) => a + b, 0) / recentStress.length;
        return -((avgStress - 3) / 2); // Inversé car plus de stress = impact négatif
    }

    calculateEnergyImpact(entries) {
        if (!entries.length) return 0;
        const recentEnergy = entries.map(e => parseInt(e.energy));
        const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length;
        return (avgEnergy - 3) / 2;
    }

    calculateActivityImpact(entries) {
        if (!entries.length) return 0;
        const recentActivity = entries.map(e => parseInt(e.activity));
        const avgActivity = recentActivity.reduce((a, b) => a + b, 0) / recentActivity.length;
        return (avgActivity - 3) / 2;
    }

    calculateSleepImpact(entries) {
        if (!entries.length) return 0;
        const recentSleep = entries.map(e => parseInt(e.sleep));
        const avgSleep = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length;
        return (avgSleep - 3) / 2;
    }

    calculateSocialImpact(entries) {
        if (!entries.length) return 0;
        const recentSocial = entries.map(e => parseInt(e.social));
        const avgSocial = recentSocial.reduce((a, b) => a + b, 0) / recentSocial.length;
        return (avgSocial - 3) / 2;
    }

    calculateMoodVariance(entries) {
        const moodScores = entries.map(e => MOOD_SCORES[e.mood]);
        const avg = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
        const variance = moodScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / moodScores.length;
        return Math.sqrt(variance);
    }

    scoresToMood(score) {
        // Convertir le score (-1 à 1) en humeur
        const normalizedScore = (score + 1) / 2; // Convertir à 0-1
        const moodScore = Math.round(normalizedScore * 4) + 1; // Convertir à 1-5
        return MOOD_LABELS[moodScore] || 'neutre';
    }

    identifySignificantFactors(scores, weatherData) {
        const factors = [];

        // Facteur météo
        if (weatherData) {
            factors.push({
                type: 'weather',
                description: `Météo : ${weatherData.description} (${weatherData.temperature}°C)`,
                impact: scores.weather,
                icon: weatherData.icon
            });
        }

        // Activité physique
        if (Math.abs(scores.activity) > 0.2) {
            factors.push({
                type: 'activity',
                description: scores.activity > 0 
                    ? "Bon niveau d'activité physique"
                    : "Manque d'activité physique",
                impact: scores.activity,
                icon: '🏃'
            });
        }
        
        // Sommeil
        if (Math.abs(scores.sleep) > 0.2) {
            factors.push({
                type: 'sleep',
                description: scores.sleep > 0 
                    ? "Bonne qualité de sommeil"
                    : "Sommeil perturbé",
                impact: scores.sleep,
                icon: '😴'
            });
        }
        
        // Social
        if (Math.abs(scores.social) > 0.2) {
            factors.push({
                type: 'social',
                description: scores.social > 0 
                    ? "Bonnes interactions sociales"
                    : "Peu d'interactions sociales",
                impact: scores.social,
                icon: '👥'
            });
        }

        // Stress
        if (Math.abs(scores.stress) > 0.2) {
            factors.push({
                type: 'stress',
                description: scores.stress < 0 
                    ? "Niveau de stress élevé"
                    : "Niveau de stress bas",
                impact: scores.stress,
                icon: '😰'
            });
        }

        // Énergie
        if (Math.abs(scores.energy) > 0.2) {
            factors.push({
                type: 'energy',
                description: scores.energy > 0 
                    ? "Bon niveau d'énergie"
                    : "Fatigue importante",
                impact: scores.energy,
                icon: '⚡'
            });
        }

        return factors;
    }

    calculateConfidence(entries, weatherData) {
        let confidence = 0.5; // Base de 50%

        // Plus de données = plus de confiance
        confidence += Math.min(0.2, entries.length * 0.02);

        // Données météo disponibles
        if (weatherData) confidence += 0.1;

        // Cohérence des données récentes
        if (entries.length >= 3) {
            const variance = this.calculateMoodVariance(entries.slice(-3));
            confidence -= variance * 0.1; // Moins de confiance si grande variance
        }

        return Math.min(0.95, Math.max(0.3, confidence));
    }
} 
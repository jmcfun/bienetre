import { MOOD_SCORES } from './constants.js';
import { WeatherService } from './services/weather-service.js';
import { ActivityService } from './services/activity-service.js';
import { MoodPredictor } from './services/mood-prediction.js';
import { GoalService } from './services/goal-service.js';
import { ReminderService } from './services/reminder-service.js';
import { SuggestionsView } from './components/suggestions-view.js';
import { SuggestionService } from './services/suggestion-service.js';
import { ExportService } from './services/export-service.js';
import { TrialService } from './services/trial-service.js';
import { MigrationService } from './services/migration-service.js';

export class PremiumFeatures {
    constructor() {
        this.weatherService = new WeatherService();
        this.activityService = new ActivityService();
        this.moodPredictor = new MoodPredictor();
        this.goalService = new GoalService();
        this.reminderService = new ReminderService();
        this.suggestionService = new SuggestionService();
        this.trialService = new TrialService();
        this.suggestionsView = new SuggestionsView(
            document.querySelector('.suggestions-section'),
            this.suggestionService
        );
        this.STORAGE_KEY = 'moodJournal';
        this.themes = {
            light: {
                primary: '#4CAF50',
                secondary: '#81C784',
                background: '#F5F5F5',
                text: '#333333'
            },
            dark: {
                primary: '#81C784',
                secondary: '#4CAF50',
                background: '#2C3E50',
                text: '#FFFFFF'
            },
            nature: {
                primary: '#8BC34A',
                secondary: '#689F38',
                background: '#F1F8E9',
                text: '#33691E'
            }
        };
        this.initialized = false;
    }

    async init() {
        try {
            if (this.initialized) {
                console.log('Premium features already initialized');
                return;
            }

            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }

            await this.initExportListeners();
            await this.initGoalListeners();
            await this.initReminderListeners();
            await this.initializePremiumFeatures();
            await this.updateGoalsUI();
            await this.updateRemindersUI();
            this.initialized = true;
            console.log('Premium features initialized successfully');
        } catch (error) {
            console.error('Error initializing premium features:', error);
        }
    }

    async loadEntries() {
        try {
            const data = await chrome.storage.local.get(this.STORAGE_KEY);
            return data[this.STORAGE_KEY] || [];
        } catch (error) {
            console.error('Erreur chargement données:', error);
            return [];
        }
    }

    initExportListeners() {
        document.getElementById('openExportModal')?.addEventListener('click', () => {
            document.getElementById('exportModal').classList.add('active');
        });
        
        document.getElementById('cancelExport')?.addEventListener('click', () => {
            document.getElementById('exportModal').classList.remove('active');
        });
        
        document.getElementById('confirmExport')?.addEventListener('click', async () => {
            const format = document.getElementById('exportFormat').value;
            const period = document.getElementById('exportPeriod').value;
            await this.exportData(format, period);
            document.getElementById('exportModal').classList.remove('active');
        });
    }
    
    async exportData(format, period) {
        const exportService = new ExportService();
        try {
            const blob = await exportService.exportData(format, period);
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `journal_humeur_${period}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Données exportées avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'exportation:', error);
            this.showNotification('Erreur lors de l\'exportation des données', true);
        }
    }

    formatExportData(entries, format) {
        switch (format) {
            case 'csv':
                return {
                    content: this.formatAsCSV(entries),
                    mimeType: 'text/csv;charset=utf-8',
                    extension: 'csv'
                };
            case 'json':
                return {
                    content: JSON.stringify(entries, null, 2),
                    mimeType: 'application/json',
                    extension: 'json'
                };
            case 'txt':
                return {
                    content: this.formatAsText(entries),
                    mimeType: 'text/plain',
                    extension: 'txt'
                };
        }
    }

    // Analyses avancées
    async getAdvancedAnalytics(entries) {
        const analytics = {
            predictions: await this.getMoodPredictions(entries),
            correlations: this.getCorrelations(entries),
            weeklyReport: this.generateWeeklyReport(entries),
            trends: this.analyzeMoodTrends(entries)
        };

        console.log('Analytics complets:', analytics);
        return analytics;
    }

    async getMoodPredictions(entries) {
        try {
            console.log('Début getMoodPredictions avec entries:', entries);
            const permission = await this.checkGeolocationPermission();
            console.log('Permission géolocalisation:', permission);

            if (!permission) {
                throw new Error('Géolocalisation non autorisée');
            }

            const position = await this.getCurrentPosition();
            console.log('Position obtenue:', position);

            const weatherData = await this.weatherService.getWeatherData(
                position.coords.latitude,
                position.coords.longitude
            );
            console.log('Données météo reçues:', weatherData);

            this.updateWeatherUI(weatherData);
            const prediction = await this.moodPredictor.predictMood(entries, weatherData);
            console.log('Prédiction calculée:', prediction);

            return prediction;
        } catch (error) {
            console.error('Erreur détaillée:', error);
            this.showGeolocationError(error);
            return {
                predictedMood: 'Non disponible',
                confidence: 0,
                factors: [{
                    type: 'error',
                    description: error.message,
                    impact: 0,
                    icon: '⚠️'
                }]
            };
        }
    }

    async checkGeolocationPermission() {
        try {
            // Vérifier si la géolocalisation est supportée
            if (!navigator.geolocation) {
                throw new Error('Géolocalisation non supportée');
            }

            // Demander la permission
            const permission = await new Promise((resolve, reject) => {
                navigator.permissions.query({ name: 'geolocation' })
                    .then(result => {
                        if (result.state === 'granted') {
                            resolve(true);
                        } else if (result.state === 'prompt') {
                            // Tester la géolocalisation pour déclencher la demande
                            navigator.geolocation.getCurrentPosition(
                                () => resolve(true),
                                () => resolve(false)
                            );
                        } else {
                            resolve(false);
                        }
                    })
                    .catch(reject);
            });

            return permission;
        } catch (error) {
            console.error('Erreur permission géolocalisation:', error);
            return false;
        }
    }

    async analyzeWeatherImpact(entries) {
        try {
            const position = await this.getCurrentPosition();
            const weatherData = await this.weatherService.getWeatherData(
                position.coords.latitude,
                position.coords.longitude
            );
            
            // Mise à jour de l'UI avec les données météo
            this.updateWeatherUI(weatherData);
            
            // Calculer l'impact de la météo sur l'humeur
            const impact = this.calculateWeatherImpact(weatherData, entries);
            
            return {
                impact: impact,
                confidence: 0.8,
                recommendation: this.getWeatherBasedRecommendation(weatherData, impact)
            };
        } catch (error) {
            console.error('Erreur analyse météo:', error);
            return { impact: 0, confidence: 0, recommendation: null };
        }
    }

    calculateWeatherImpact(weatherData, entries) {
        if (!weatherData || !entries.length) return 0;

        // Analyser la corrélation entre la météo et l'humeur passée
        const recentEntries = entries.slice(-7);
        let impact = 0;

        if (weatherData.isGoodWeather) {
            impact += 0.3; // Impact positif du beau temps
        }

        // Ajuster en fonction de la température
        if (weatherData.temperature >= 20 && weatherData.temperature <= 25) {
            impact += 0.2; // Température idéale
        }

        return Math.min(Math.max(impact, 0), 1); // Normaliser entre 0 et 1
    }

    getWeatherBasedRecommendation(weatherData, impact) {
        if (!weatherData) return null;

        if (impact > 0.7) {
            return `Le temps est idéal (${weatherData.description}, ${weatherData.temperature}°C). Profitez-en pour sortir !`;
        } else if (impact > 0.3) {
            return `Conditions météo correctes. Pensez à adapter vos activités.`;
        } else {
            return `Temps peu favorable. Privilégiez les activités intérieures.`;
        }
    }

    updateWeatherUI(weatherData) {
        console.log('Mise à jour UI météo avec:', weatherData);
        if (!weatherData) return;
        
        const weatherInfo = document.querySelector('.weather-info');
        if (!weatherInfo) {
            console.error('Élément weather-info non trouvé');
            return;
        }

        weatherInfo.innerHTML = `
            <div class="weather-current">
                <span class="weather-icon">${weatherData.icon}</span>
                <span class="weather-temp">${weatherData.temperature}°C</span>
            </div>
            <div class="weather-desc">${weatherData.description}</div>
        `;
    }

    async analyzeActivityImpact(entries) {
        const activities = await this.activityService.getActivities(new Date());
        
        // Analyser l'impact des différents types d'activités sur l'humeur
        const activityCorrelations = this.calculateActivityCorrelations(entries, activities);
        
        return {
            impact: activityCorrelations.impact,
            confidence: activityCorrelations.confidence,
            recommendations: this.getActivityBasedRecommendations(activityCorrelations)
        };
    }

    calculateWeightedPrediction(factors) {
        // Pondération des différents facteurs
        const weights = {
            weather: 0.2,
            activities: 0.3,
            timePatterns: 0.3,
            social: 0.2
        };
        
        // Calcul de la prédiction pondérée
        let totalScore = 0;
        let totalConfidence = 0;
        const significantFactors = [];
        
        Object.entries(factors).forEach(([factor, data]) => {
            totalScore += data.impact * weights[factor];
            totalConfidence += data.confidence * weights[factor];
            
            if (data.impact > 0.5) {
                significantFactors.push(data.recommendation);
            }
        });
        
        return {
            mood: this.scoresToMood(totalScore),
            confidence: Math.round(totalConfidence * 100),
            factors: significantFactors
        };
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
    }

    getCorrelations(entries) {
        // Calcul basique des corrélations
        const moodScores = entries.map(entry => MOOD_SCORES[entry.mood]);
        const energyLevels = entries.map(entry => parseInt(entry.energy));
        const stressLevels = entries.map(entry => parseInt(entry.stress));

        return {
            energyMoodCorrelation: this.calculateCorrelation(moodScores, energyLevels),
            stressMoodCorrelation: this.calculateCorrelation(moodScores, stressLevels)
        };
    }

    generateWeeklyReport(entries) {
        const lastWeek = entries.slice(-7);
        return {
            averageMood: this.calculateAverageMood(lastWeek),
            moodVariability: this.calculateVariability(lastWeek),
            bestDay: this.findBestDay(lastWeek),
            improvements: this.suggestImprovements(lastWeek)
        };
    }

    // Thèmes personnalisés
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.documentElement.style.setProperty('--background-color', theme.background);
        document.documentElement.style.setProperty('--text-color', theme.text);
    }

    // Statistiques étendues
    getExtendedStats(entries) {
        return {
            longTermTrends: this.analyzeLongTermTrends(entries),
            detailedMetrics: this.calculateDetailedMetrics(entries),
            customCharts: this.generateCustomCharts(entries)
        };
    }

    // Méthodes utilitaires
    calculateCorrelation(array1, array2) {
        // Implémentation de la corrélation de Pearson
        const mean1 = array1.reduce((a, b) => a + b) / array1.length;
        const mean2 = array2.reduce((a, b) => a + b) / array2.length;
        
        const variance1 = array1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
        const variance2 = array2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0);
        
        const covariance = array1.reduce((a, b, i) => 
            a + (b - mean1) * (array2[i] - mean2), 0);
        
        return covariance / Math.sqrt(variance1 * variance2);
    }

    findPatterns(entries) {
        // Analyse des motifs récurrents
        const patterns = [];
        entries.forEach((entry, index) => {
            if (index > 0) {
                const prevEntry = entries[index - 1];
                if (MOOD_SCORES[entry.mood] > MOOD_SCORES[prevEntry.mood]) {
                    patterns.push({
                        date: entry.timestamp,
                        improvement: true,
                        notes: entry.notes
                    });
                }
            }
        });
        return patterns;
    }

    initPremiumFeatures() {
        // Masquer les fonctionnalités premium par défaut
        document.querySelectorAll('.premium-feature').forEach(el => {
            el.classList.add('locked');
        });
    }

    updatePremiumUI(trialStatus) {
        const premiumStatus = document.getElementById('premiumStatus');
        if (!premiumStatus) return;

        const statusText = premiumStatus.querySelector('.status-text');
        const statusIcon = premiumStatus.querySelector('.status-icon');

        // Mettre à jour le statut
        if (trialStatus.isPremium) {
            statusText.textContent = 'Version Premium';
            statusIcon.textContent = '⭐';
            this.unlockFeatures();
        } else if (trialStatus.isActive && trialStatus.isTrialMode) {
            statusText.textContent = `Version d'essai (${trialStatus.daysLeft} jours restants)`;
            statusIcon.textContent = '✨';
            this.unlockFeatures();
        } else {
            statusText.textContent = 'Version gratuite';
            statusIcon.textContent = '🔒';
            this.lockFeatures();
        }
    }

    unlockFeatures() {
        document.querySelectorAll('.premium-feature').forEach(feature => {
            feature.classList.remove('locked');
        });
    }

    lockFeatures() {
        document.querySelectorAll('.premium-feature').forEach(feature => {
            feature.classList.add('locked');
        });
    }

    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showGeolocationError(error) {
        let message = 'Erreur de géolocalisation: ';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'Accès refusé. Veuillez autoriser la géolocalisation.';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Position non disponible.';
                break;
            case error.TIMEOUT:
                message += 'Délai d\'attente dépassé.';
                break;
            default:
                message += error.message;
        }
        this.showNotification(message, true);
    }

    updatePredictionUI(prediction) {
        console.log('Mise à jour UI avec prédiction:', prediction);
        const predictionValue = document.querySelector('.prediction-value');
        const confidenceBar = document.querySelector('.confidence-fill');
        const factorsList = document.querySelector('.factors-list');
        
        if (!predictionValue || !confidenceBar || !factorsList) {
            console.error('Éléments UI manquants:', {
                predictionValue: !!predictionValue,
                confidenceBar: !!confidenceBar,
                factorsList: !!factorsList
            });
            return;
        }

        predictionValue.textContent = prediction.predictedMood;
        confidenceBar.style.width = `${prediction.confidence * 100}%`;
        
        factorsList.innerHTML = prediction.factors.map(factor => `
            <li class="factor-item">
                <span class="factor-icon">${factor.icon || '📊'}</span>
                <div class="factor-details">
                    <span class="factor-description">${factor.description}</span>
                    <div class="factor-impact-bar">
                        <div class="impact-fill" style="width: ${Math.abs(factor.impact) * 100}%;
                            background-color: ${factor.impact > 0 ? '#4CAF50' : '#FF5252'}">
                        </div>
                    </div>
                </div>
            </li>
        `).join('');
        console.log('UI mise à jour avec succès');
    }

    calculateAverageMood(entries) {
        if (!entries || entries.length === 0) return 0;
        const moodScores = entries.map(entry => MOOD_SCORES[entry.mood]);
        return moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    }

    calculateVariability(entries) {
        if (!entries || entries.length === 0) return 0;
        const moodScores = entries.map(entry => MOOD_SCORES[entry.mood]);
        const average = this.calculateAverageMood(entries);
        const squaredDiffs = moodScores.map(score => Math.pow(score - average, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / moodScores.length);
    }

    findBestDay(entries) {
        if (!entries || entries.length === 0) return null;
        return entries.reduce((best, current) => {
            if (!best || MOOD_SCORES[current.mood] > MOOD_SCORES[best.mood]) {
                return current;
            }
            return best;
        }, null);
    }

    suggestImprovements(entries) {
        if (!entries || entries.length === 0) return [];
        const suggestions = [];
        const averageMood = this.calculateAverageMood(entries);

        // Suggestions basées sur l'humeur moyenne
        if (averageMood < 3) {
            suggestions.push("Essayez d'augmenter votre activité physique");
            suggestions.push("Considérez des techniques de gestion du stress");
        }

        // Suggestions basées sur les tendances
        const moodTrend = this.calculateMoodTrend(entries);
        if (moodTrend < 0) {
            suggestions.push("Votre humeur tend à baisser. Pensez à planifier des activités agréables");
        }

        return suggestions;
    }

    calculateMoodTrend(entries) {
        if (!entries || entries.length < 2) return 0;
        const moodScores = entries.map(entry => MOOD_SCORES[entry.mood]);
        let trend = 0;
        
        for (let i = 1; i < moodScores.length; i++) {
            trend += moodScores[i] - moodScores[i-1];
        }
        
        return trend / (moodScores.length - 1);
    }

    analyzeLongTermTrends(entries) {
        if (!entries || entries.length === 0) return {};

        const monthlyAverages = {};
        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyAverages[monthKey]) {
                monthlyAverages[monthKey] = { sum: 0, count: 0 };
            }
            monthlyAverages[monthKey].sum += MOOD_SCORES[entry.mood];
            monthlyAverages[monthKey].count++;
        });

        return Object.entries(monthlyAverages).map(([month, data]) => ({
            month,
            average: data.sum / data.count
        }));
    }

    calculateDetailedMetrics(entries) {
        if (!entries || entries.length === 0) return {};

        return {
            averageMood: this.calculateAverageMood(entries),
            variability: this.calculateVariability(entries),
            trend: this.calculateMoodTrend(entries),
            bestDay: this.findBestDay(entries),
            suggestions: this.suggestImprovements(entries)
        };
    }

    analyzeMoodTrends(entries) {
        if (!entries || entries.length === 0) return {};

        const weeklyTrends = this.calculateWeeklyTrends(entries);
        const dailyPatterns = this.analyzeDailyPatterns(entries);
        const seasonalEffects = this.analyzeSeasonalEffects(entries);

        return {
            weekly: weeklyTrends,
            daily: dailyPatterns,
            seasonal: seasonalEffects
        };
    }

    calculateWeeklyTrends(entries) {
        const weeklyAverages = new Array(7).fill(0);
        const weekdayCounts = new Array(7).fill(0);

        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dayOfWeek = date.getDay();
            weeklyAverages[dayOfWeek] += MOOD_SCORES[entry.mood];
            weekdayCounts[dayOfWeek]++;
        });

        return weeklyAverages.map((sum, index) => ({
            day: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][index],
            average: weekdayCounts[index] ? sum / weekdayCounts[index] : 0
        }));
    }

    analyzeDailyPatterns(entries) {
        const morningMoods = [];
        const eveningMoods = [];

        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const hour = date.getHours();

            if (hour < 12) {
                morningMoods.push(MOOD_SCORES[entry.mood]);
            } else {
                eveningMoods.push(MOOD_SCORES[entry.mood]);
            }
        });

        return {
            morningAverage: morningMoods.length ? 
                morningMoods.reduce((a, b) => a + b, 0) / morningMoods.length : 0,
            eveningAverage: eveningMoods.length ? 
                eveningMoods.reduce((a, b) => a + b, 0) / eveningMoods.length : 0
        };
    }

    analyzeSeasonalEffects(entries) {
        const seasonalAverages = {
            spring: { sum: 0, count: 0 },
            summer: { sum: 0, count: 0 },
            autumn: { sum: 0, count: 0 },
            winter: { sum: 0, count: 0 }
        };

        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const month = date.getMonth();
            const season = 
                month <= 1 || month === 11 ? 'winter' :
                month <= 4 ? 'spring' :
                month <= 7 ? 'summer' : 'autumn';

            seasonalAverages[season].sum += MOOD_SCORES[entry.mood];
            seasonalAverages[season].count++;
        });

        return Object.entries(seasonalAverages).reduce((acc, [season, data]) => {
            acc[season] = data.count ? data.sum / data.count : 0;
            return acc;
        }, {});
    }

    initGoalListeners() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const addGoalBtn = document.querySelector('.add-goal-btn');
                const goalModal = document.getElementById('goalModal');
                const goalForm = document.getElementById('goalForm');
                const cancelBtn = document.getElementById('cancelGoal');
                const goalType = document.getElementById('goalType');
                const goalTarget = document.getElementById('goalTarget');
                const goalDescription = document.querySelector('.goal-explanation');
                const targetDescription = document.querySelector('.goal-target-description');

                if (!addGoalBtn || !goalModal || !goalForm || !cancelBtn || 
                    !goalType || !goalTarget || !goalDescription || !targetDescription) {
                    console.warn('Certains éléments du formulaire d\'objectif sont manquants');
                    console.log('Éléments manquants:', {
                        addGoalBtn: !!addGoalBtn,
                        goalModal: !!goalModal,
                        goalForm: !!goalForm,
                        cancelBtn: !!cancelBtn,
                        goalType: !!goalType,
                        goalTarget: !!goalTarget,
                        goalDescription: !!goalDescription,
                        targetDescription: !!targetDescription
                    });
                    resolve();
                    return;
                }

                addGoalBtn.addEventListener('click', () => {
                    goalModal.classList.add('active');
                });

                cancelBtn.addEventListener('click', () => {
                    goalModal.classList.remove('active');
                });

                goalForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const type = goalType.value;
                    const target = goalTarget.value;
                    const deadline = document.getElementById('goalDeadline').value;

                    try {
                        await this.goalService.setGoal(type, target, deadline);
                        this.updateGoalsUI();
                        goalModal.classList.remove('active');
                        this.showNotification('Objectif créé avec succès');
                    } catch (error) {
                        console.error('Erreur création objectif:', error);
                        this.showNotification('Erreur lors de la création de l\'objectif', true);
                    }
                });

                const descriptions = {
                    mood: {
                        explanation: "Définissez un objectif d'amélioration de votre humeur générale. L'application vous aidera à suivre votre progression et à identifier les facteurs qui influencent positivement votre humeur.",
                        levels: {
                            1: "Très mal - Journées difficiles",
                            2: "Mal - Peu d'enthousiasme",
                            3: "Neutre - État stable",
                            4: "Bien - Journées agréables",
                            5: "Très bien - Pleine forme"
                        }
                    },
                    activity: {
                        explanation: "L'activité physique régulière améliore l'humeur et réduit le stress. Fixez un objectif réaliste en fonction de votre mode de vie actuel.",
                        levels: {
                            1: "Sédentaire - Peu ou pas d'activité",
                            2: "Léger - Marche occasionnelle",
                            3: "Modéré - Activité régulière",
                            4: "Actif - Exercice fréquent",
                            5: "Très actif - Sport quotidien"
                        }
                    },
                    sleep: {
                        explanation: "La qualité du sommeil est essentielle pour le bien-être mental. Visez une amélioration progressive de vos habitudes de sommeil.",
                        levels: {
                            1: "Très mauvais sommeil",
                            2: "Sommeil perturbé",
                            3: "Sommeil correct",
                            4: "Bon sommeil",
                            5: "Sommeil optimal"
                        }
                    },
                    social: {
                        explanation: "Les interactions sociales positives contribuent significativement au bien-être. Fixez un objectif qui correspond à votre personnalité.",
                        levels: {
                            1: "Très isolé",
                            2: "Peu de contacts",
                            3: "Contacts réguliers",
                            4: "Socialement actif",
                            5: "Très sociable"
                        }
                    },
                    stress: {
                        explanation: "Gérer son stress est crucial pour maintenir une bonne santé mentale. Définissez un objectif réaliste de réduction du stress.",
                        levels: {
                            1: "Très stressé",
                            2: "Stress élevé",
                            3: "Stress modéré",
                            4: "Peu stressé",
                            5: "Détendu"
                        }
                    }
                };

                const updateDescriptions = () => {
                    const type = goalType.value;
                    const level = goalTarget.value;
                    goalDescription.textContent = descriptions[type].explanation;
                    targetDescription.textContent = descriptions[type].levels[level];
                };

                goalType.addEventListener('change', updateDescriptions);
                goalTarget.addEventListener('input', updateDescriptions);

                // Initialiser les descriptions
                updateDescriptions();
                resolve();
            }, 100);
        });
    }

    async updateGoalsUI() {
        const goalsList = document.querySelector('.goals-list');
        if (!goalsList) return;

        const goals = await this.goalService.getGoals();
        const entries = await this.loadEntries();
        const updatedGoals = await this.goalService.updateProgress(entries);

        const getStatusStyle = (status) => {
            switch(status) {
                case 'completed':
                    return 'background: linear-gradient(90deg, #4CAF50, #81C784); color: white;';
                case 'failed':
                    return 'background: linear-gradient(90deg, #f44336, #e57373); color: white;';
                case 'archived':
                    return 'background: linear-gradient(90deg, #9e9e9e, #bdbdbd); color: white;';
                default:
                    return '';
            }
        };

        const getStatusIcon = (status) => {
            switch(status) {
                case 'completed': return '🎉';
                case 'failed': return '❌';
                case 'archived': return '📦';
                default: return '🎯';
            }
        };

        goalsList.innerHTML = updatedGoals.map(goal => `
            <div class="goal-item ${goal.status}" data-goal-id="${goal.id}">
                <span class="goal-icon">${this.goalService.goalTypes[goal.type].icon}</span>
                <div class="goal-details">
                    <div class="goal-title">
                        ${this.goalService.goalTypes[goal.type].name}
                        <span class="goal-status" style="${getStatusStyle(goal.status)}">
                            ${getStatusIcon(goal.status)}
                            ${goal.status === 'completed' ? 'Objectif atteint!' : 
                              goal.status === 'failed' ? 'Objectif non atteint' : 
                              goal.status === 'archived' ? 'Archivé' : 'En cours'}
                        </span>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                    <div class="goal-deadline">
                        Objectif : ${goal.target}/5 - 
                        Échéance : ${new Date(goal.deadline).toLocaleDateString()}
                        ${goal.achievementDate ? 
                            `<br>Atteint le : ${new Date(goal.achievementDate).toLocaleDateString()}` : ''}
                    </div>
                </div>
                <div class="goal-actions">
                    ${goal.status !== 'archived' ? `
                        <button class="edit-goal" title="Modifier">
                            <span class="icon">✏️</span>
                        </button>
                        <button class="archive-goal" title="Archiver">
                            <span class="icon">📦</span>
                        </button>
                    ` : ''}
                    <button class="delete-goal" title="Supprimer">
                        <span class="icon">🗑️</span>
                    </button>
                </div>
            </div>
        `).join('') || '<p class="no-goals">Aucun objectif défini</p>';

        // Ajouter les écouteurs d'événements
        goalsList.querySelectorAll('.goal-item').forEach(goalItem => {
            const goalId = parseInt(goalItem.dataset.goalId);

            // Écouteur pour l'archivage
            goalItem.querySelector('.archive-goal')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.goalService.archiveGoal(goalId);
                await this.updateGoalsUI();
                this.showNotification('Objectif archivé');
            });

            // Écouteur pour la suppression
            goalItem.querySelector('.delete-goal')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
                    await this.goalService.deleteGoal(goalId);
                    await this.updateGoalsUI();
                    this.showNotification('Objectif supprimé');
                }
            });

            // Écouteur pour la modification
            goalItem.querySelector('.edit-goal')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const goal = updatedGoals.find(g => g.id === goalId);
                if (goal) {
                    this.openEditGoalModal(goal);
                }
            });
        });
    }

    openEditGoalModal(goal) {
        const modal = document.getElementById('goalModal');
        const form = document.getElementById('goalForm');
        const typeSelect = document.getElementById('goalType');
        const targetInput = document.getElementById('goalTarget');
        const deadlineInput = document.getElementById('goalDeadline');

        // Pré-remplir le formulaire
        typeSelect.value = goal.type;
        targetInput.value = goal.target;
        deadlineInput.value = new Date(goal.deadline).toISOString().split('T')[0];

        // Modifier le comportement du formulaire pour l'édition
        form.onsubmit = async (e) => {
            e.preventDefault();
            const updates = {
                type: typeSelect.value,
                target: parseFloat(targetInput.value),
                deadline: new Date(deadlineInput.value).toISOString()
            };

            await this.goalService.editGoal(goal.id, updates);
            await this.updateGoalsUI();
            modal.classList.remove('active');
            this.showNotification('Objectif modifié avec succès');
        };

        modal.classList.add('active');
    }

    async initReminderListeners() {
        const addReminderBtn = document.querySelector('.add-reminder-btn');
        const reminderModal = document.getElementById('reminderModal');
        const reminderForm = document.getElementById('reminderForm');
        const cancelBtn = document.getElementById('cancelReminder');

        if (!addReminderBtn || !reminderModal || !reminderForm || !cancelBtn) {
            console.warn('Éléments de rappel manquants');
            return;
        }

        addReminderBtn.addEventListener('click', () => {
            reminderModal.classList.add('active');
        });

        cancelBtn.addEventListener('click', () => {
            reminderModal.classList.remove('active');
        });

        reminderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const time = document.getElementById('reminderTime').value;
            const date = document.getElementById('reminderDate').value || null;
            const frequencyValue = document.getElementById('frequencyValue').value;
            const frequencyUnit = document.getElementById('frequencyUnit').value;
            const message = document.getElementById('reminderMessage').value || 'Nouveau rappel';

            try {
                await this.reminderService.addReminder({
                    time,
                    date,
                    frequencyValue: frequencyValue ? parseInt(frequencyValue) : null,
                    frequencyUnit: frequencyValue ? frequencyUnit : null,
                    message,
                    active: true
                });

                await this.updateRemindersUI();
                reminderModal.classList.remove('active');
                this.showNotification('Rappel créé avec succès');
            } catch (error) {
                console.error('Erreur création rappel:', error);
                this.showNotification('Erreur lors de la création du rappel', true);
            }
        });
    }

    async updateRemindersUI() {
        const remindersList = document.querySelector('.reminders-list');
        if (!remindersList) return;

        const reminders = await this.reminderService.getReminders();

        remindersList.innerHTML = reminders.map(reminder => `
            <div class="reminder-item ${reminder.active ? 'active' : ''}" data-id="${reminder.id}">
                <span class="reminder-icon">⏰</span>
                <div class="reminder-details">
                    <div class="reminder-info">
                        <div class="reminder-type">
                            ${this.getReminderTypeDescription(reminder)}
                        </div>
                        <div class="reminder-schedule">
                            ${this.formatReminderSchedule(reminder)}
                        </div>
                        <div class="reminder-message">${reminder.message}</div>
                        <div class="reminder-next">
                            Prochain rappel : ${this.getNextReminderTime(reminder)}
                        </div>
                    </div>
                </div>
                <label class="switch">
                    <input type="checkbox" ${reminder.active ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
                <div class="reminder-actions">
                    <button class="edit-reminder" title="Modifier">
                        <span class="icon">✏️</span>
                    </button>
                    <button class="delete-reminder" title="Supprimer">
                        <span class="icon">🗑️</span>
                    </button>
                </div>
            </div>
        `).join('') || '<p class="no-reminders">Aucun rappel configuré</p>';

        this.addReminderListeners(remindersList);
    }

    addReminderListeners(remindersList) {
        remindersList.querySelectorAll('.reminder-item').forEach(item => {
            const reminderId = item.dataset.id;
            const toggleSwitch = item.querySelector('input[type="checkbox"]');
            const deleteBtn = item.querySelector('.delete-reminder');
            const editBtn = item.querySelector('.edit-reminder');

            toggleSwitch?.addEventListener('change', async (e) => {
                await this.reminderService.toggleReminder(reminderId, e.target.checked);
                this.showNotification(
                    e.target.checked ? 'Rappel activé' : 'Rappel désactivé'
                );
            });

            deleteBtn?.addEventListener('click', async () => {
                if (confirm('Voulez-vous supprimer ce rappel ?')) {
                    await this.reminderService.deleteReminder(reminderId);
                    await this.updateRemindersUI();
                    this.showNotification('Rappel supprimé');
                }
            });

            editBtn?.addEventListener('click', async () => {
                const reminder = await this.getReminderById(reminderId);
                if (reminder) {
                    this.openEditReminderModal(reminder);
                }
            });
        });
    }

    async getReminderById(reminderId) {
        const reminders = await this.reminderService.getReminders();
        return reminders.find(r => r.id === reminderId);
    }

    openEditReminderModal(reminder) {
        const modal = document.getElementById('reminderModal');
        const form = document.getElementById('reminderForm');
        const timeInput = document.getElementById('reminderTime');
        const dateInput = document.getElementById('reminderDate');
        const frequencyValue = document.getElementById('frequencyValue');
        const frequencyUnit = document.getElementById('frequencyUnit');
        const messageInput = document.getElementById('reminderMessage');

        // Changer le titre du modal
        modal.querySelector('h3').textContent = 'Modifier le Rappel';

        // Pré-remplir le formulaire
        timeInput.value = reminder.time;
        dateInput.value = reminder.date || '';
        frequencyValue.value = reminder.frequencyValue || '';
        frequencyUnit.value = reminder.frequencyUnit || 'minutes';
        messageInput.value = reminder.message;

        // Modifier le comportement du formulaire pour l'édition
        const originalSubmit = form.onsubmit;
        form.onsubmit = async (e) => {
            e.preventDefault();
            const updates = {
                time: timeInput.value,
                date: dateInput.value || null,
                frequencyValue: frequencyValue.value ? parseInt(frequencyValue.value) : null,
                frequencyUnit: frequencyValue.value ? frequencyUnit.value : null,
                message: messageInput.value || 'Nouveau rappel'
            };

            try {
                await this.reminderService.editReminder(reminder.id, updates);
                await this.updateRemindersUI();
                modal.classList.remove('active');
                this.showNotification('Rappel modifié avec succès');
            } catch (error) {
                console.error('Erreur modification rappel:', error);
                this.showNotification('Erreur lors de la modification du rappel', true);
            } finally {
                // Restaurer le comportement original du formulaire
                form.onsubmit = originalSubmit;
                modal.querySelector('h3').textContent = 'Configurer un Rappel';
            }
        };

        modal.classList.add('active');
    }

    getReminderIcon(type) {
        const icons = {
            daily: '⏰',
            contextual: '🎯',
            goal: '🎉'
        };
        return icons[type] || '📅';
    }

    formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatHour(hour) {
        return `${hour.toString().padStart(2, '0')}:00`;
    }

    getReminderTypeDescription(reminder) {
        if (reminder.date && reminder.time) return "Rappel unique précis";
        if (reminder.date) return "Rappel pour la journée";
        if (reminder.time && !reminder.frequencyValue) return "Rappel quotidien";
        if (reminder.frequencyValue) return "Rappel périodique";
        return "Rappel immédiat";
    }

    formatReminderSchedule(reminder) {
        const parts = [];
        if (reminder.date) {
            parts.push(`Date: ${new Date(reminder.date).toLocaleDateString()}`);
        }
        if (reminder.time) {
            parts.push(`Heure: ${this.formatTime(reminder.time)}`);
        }
        if (reminder.frequencyValue) {
            parts.push(`Répétition: Tous les ${reminder.frequencyValue} ${reminder.frequencyUnit}`);
        }
        return parts.join(' | ') || 'Une seule fois';
    }

    getNextReminderTime(reminder) {
        const now = new Date();
        const lastCheck = new Date(reminder.lastCheck);
        
        if (reminder.date && new Date(reminder.date) < now) {
            return 'Terminé';
        }
        
        if (reminder.frequencyValue) {
            const interval = this.reminderService.calculateInterval(
                reminder.frequencyValue, 
                reminder.frequencyUnit
            );
            const nextTime = new Date(lastCheck.getTime() + interval);
            return nextTime.toLocaleString();
        }
        
        if (reminder.time) {
            const [hours, minutes] = reminder.time.split(':');
            const nextTime = new Date();
            nextTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            if (nextTime < now) {
                nextTime.setDate(nextTime.getDate() + 1);
            }
            return nextTime.toLocaleString();
        }
        
        return 'Non planifié';
    }

    async initializePremiumFeatures() {
        try {
            const devModeToggle = document.getElementById('devModeToggle');
            const premiumModeToggle = document.getElementById('premiumModeToggle');
            const resetTrialBtn = document.getElementById('resetTrialBtn');

            if (devModeToggle) {
                devModeToggle.checked = await this.trialService.isDevMode();
                devModeToggle.addEventListener('change', async (e) => {
                    await this.trialService.toggleDevMode(e.target.checked);
                    if (e.target.checked) {
                        premiumModeToggle.checked = false;
                        await this.trialService.togglePremiumEmulation(false);
                    }
                    await this.refreshPremiumStatus();
                });
            }

            if (premiumModeToggle) {
                premiumModeToggle.checked = await this.trialService.isPremiumEmulated();
                premiumModeToggle.addEventListener('change', async (e) => {
                    await this.trialService.togglePremiumEmulation(e.target.checked);
                    if (e.target.checked) {
                        devModeToggle.checked = false;
                        await this.trialService.toggleDevMode(false);
                    }
                    await this.refreshPremiumStatus();
                });
            }

            if (resetTrialBtn) {
                resetTrialBtn.addEventListener('click', async () => {
                    await this.trialService.resetTrial();
                    await this.refreshPremiumStatus();
                    this.showNotification('Période d\'essai réinitialisée');
                });
            }

            await this.refreshPremiumStatus();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des fonctionnalités premium:', error);
            throw error;
        }
    }

    async refreshPremiumStatus() {
        const trialStatus = await this.trialService.checkTrialStatus();
        this.updatePremiumUI(trialStatus);
        
        // Recharger les fonctionnalités premium si actif
        if (trialStatus.isActive) {
            const entries = await this.loadEntries();
            if (entries.length > 0) {
                const analytics = await this.getAdvancedAnalytics(entries);
                this.updateAnalyticsUI(analytics);
            }
        }
    }

    updateAnalyticsUI(analytics) {
        console.log('Mise à jour UI avec analytics:', analytics);
        
        // Mise à jour des prédictions
        const predictionValue = document.querySelector('.prediction-value');
        if (predictionValue) {
            predictionValue.textContent = analytics.predictions.predictedMood;
        }

        // Mise à jour de la barre de confiance
        const confidenceBar = document.querySelector('.confidence-fill');
        if (confidenceBar) {
            confidenceBar.style.width = `${analytics.predictions.confidence * 100}%`;
        }

        // Mise à jour des facteurs d'influence
        const factorsList = document.querySelector('.factors-list');
        if (factorsList && analytics.predictions.factors) {
            factorsList.innerHTML = analytics.predictions.factors
                .map(factor => `
                    <li class="factor-item">
                        <span class="factor-icon">${factor.icon || '📊'}</span>
                        <div class="factor-details">
                            <span class="factor-description">${factor.description}</span>
                            <div class="factor-impact-bar">
                                <div class="impact-fill" style="width: ${Math.abs(factor.impact) * 100}%;
                                    background-color: ${factor.impact > 0 ? '#4CAF50' : '#FF5252'}">
                                </div>
                            </div>
                        </div>
                    </li>
                `).join('');
        }

        // Mise à jour des suggestions
        this.suggestionsView.update(analytics.predictions.factors);
    }
}

const premiumFeatures = new PremiumFeatures();

export { premiumFeatures }; 
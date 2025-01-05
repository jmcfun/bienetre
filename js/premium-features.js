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
        this.exportService = new ExportService();
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

        // Vérifier immédiatement le statut premium
        setTimeout(() => {
            this.refreshPremiumStatus();
        }, 0);
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

    async initGoalListeners() {
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
            await this.refreshPremiumStatus();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des fonctionnalités premium:', error);
            throw error;
        }
    }

    async refreshPremiumStatus() {
        try {
            const trialStatus = await this.trialService.checkTrialStatus();
            console.log('État actuel du statut premium:', trialStatus);
            
            // Mettre à jour les overlays en fonction du statut
            this.updatePremiumOverlays(trialStatus);
            
            this.updatePremiumUI(trialStatus);
            
            if (trialStatus.isActive || trialStatus.isPremium) {
                const entries = await this.loadEntries();
                if (entries.length > 0) {
                    const analytics = await this.getAdvancedAnalytics(entries);
                    this.updateAnalyticsUI(analytics);
                }
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement du statut premium:', error);
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

    async initExportListeners() {
        const openExportBtn = document.getElementById('openExportModal');
        if (openExportBtn) {
            openExportBtn.addEventListener('click', () => {
                const modal = document.getElementById('exportModal');
                if (modal) {
                    modal.classList.add('active');
                    this.exportService.initializeExportUI();
                }
            });
        }
    }

    async updatePremiumUI(entries) {
        try {
            const trialStatus = await this.trialService.getTrialStatus();
            const premiumStatus = document.getElementById('premiumStatus');
            
            if (!premiumStatus) return;

            const statusText = premiumStatus.querySelector('.status-text');
            const statusIcon = premiumStatus.querySelector('.status-icon');

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
        } catch (error) {
            console.error('Erreur mise à jour statut premium:', error);
        }
    }

    async getAdvancedAnalytics(entries) {
        try {
            const analytics = {
                predictions: await this.getMoodPredictions(entries),
                correlations: this.getCorrelations(entries),
                weeklyReport: this.generateWeeklyReport(entries),
                trends: this.analyzeMoodTrends(entries)
            };

            console.log('Analytics complets:', analytics);
            return analytics;
        } catch (error) {
            console.error('Erreur lors de l\'analyse avancée:', error);
            return {
                predictions: {
                    predictedMood: 'Non disponible',
                    confidence: 0,
                    factors: []
                },
                correlations: {},
                weeklyReport: {},
                trends: {}
            };
        }
    }

    async getMoodPredictions(entries) {
        try {
            const weatherData = await this.weatherService.getCurrentWeather();
            const activityData = await this.activityService.getActivities();
            
            return {
                predictedMood: 'Neutre',
                confidence: 0.7,
                factors: [
                    {
                        type: 'weather',
                        description: `Météo : ${weatherData.description}`,
                        impact: 0.3,
                        icon: '🌤️'
                    },
                    {
                        type: 'activity',
                        description: 'Niveau d\'activité stable',
                        impact: 0.2,
                        icon: '🏃'
                    }
                ]
            };
        } catch (error) {
            console.error('Erreur prédiction humeur:', error);
            return {
                predictedMood: 'Non disponible',
                confidence: 0,
                factors: []
            };
        }
    }

    getCorrelations(entries) {
        return {
            energyMoodCorrelation: 0.7,
            stressMoodCorrelation: -0.5
        };
    }

    generateWeeklyReport(entries) {
        return {
            averageMood: this.calculateAverageMood(entries),
            moodVariability: this.calculateVariability(entries),
            bestDay: this.findBestDay(entries),
            improvements: this.suggestImprovements(entries)
        };
    }

    analyzeMoodTrends(entries) {
        return {
            weekly: this.calculateWeeklyTrends(entries),
            daily: this.analyzeDailyPatterns(entries),
            seasonal: this.analyzeSeasonalEffects(entries)
        };
    }

    calculateAverageMood(entries) {
        if (!entries || entries.length === 0) return 0;
        const moodScores = entries.map(entry => MOOD_SCORES[entry.mood] || 3);
        return moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    }

    calculateVariability(entries) {
        if (!entries || entries.length === 0) return 0;
        const average = this.calculateAverageMood(entries);
        const moodScores = entries.map(entry => MOOD_SCORES[entry.mood] || 3);
        const squaredDiffs = moodScores.map(score => Math.pow(score - average, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / moodScores.length);
    }

    findBestDay(entries) {
        if (!entries || entries.length === 0) return null;
        return entries.reduce((best, current) => {
            const currentScore = MOOD_SCORES[current.mood] || 3;
            const bestScore = best ? MOOD_SCORES[best.mood] || 3 : 0;
            return currentScore > bestScore ? current : best;
        }, null);
    }

    suggestImprovements(entries) {
        if (!entries || entries.length === 0) return [];
        const suggestions = [];
        const averageMood = this.calculateAverageMood(entries);

        if (averageMood < 3) {
            suggestions.push("Essayez d'augmenter votre activité physique");
            suggestions.push("Considérez des techniques de gestion du stress");
        }

        return suggestions;
    }

    calculateWeeklyTrends(entries) {
        const weeklyAverages = new Array(7).fill(0);
        const weekdayCounts = new Array(7).fill(0);

        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dayOfWeek = date.getDay();
            weeklyAverages[dayOfWeek] += MOOD_SCORES[entry.mood] || 3;
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
            const score = MOOD_SCORES[entry.mood] || 3;

            if (hour < 12) {
                morningMoods.push(score);
            } else {
                eveningMoods.push(score);
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

            seasonalAverages[season].sum += MOOD_SCORES[entry.mood] || 3;
            seasonalAverages[season].count++;
        });

        return Object.entries(seasonalAverages).reduce((acc, [season, data]) => {
            acc[season] = data.count ? data.sum / data.count : 0;
            return acc;
        }, {});
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

    updatePremiumOverlays(status) {
        console.log('Mise à jour des overlays avec le statut:', status);
        
        const premiumFeatures = document.querySelectorAll('.premium-feature');
        console.log('Nombre de fonctionnalités premium trouvées:', premiumFeatures.length);
        
        const isPremiumActive = status.isPremium || 
                              (status.isTrialMode && !status.isExpired);

        console.log('Premium actif?', isPremiumActive);

        premiumFeatures.forEach((feature, index) => {
            // Nettoyer complètement l'élément
            feature.classList.remove('locked');
            const existingOverlay = feature.querySelector('.premium-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            if (!isPremiumActive) {
                console.log(`Ajout overlay à la fonctionnalité ${index}`);
                const overlay = this.createPremiumOverlay();
                feature.appendChild(overlay);
                feature.classList.add('locked');
                
                // S'assurer que l'overlay est visible
                requestAnimationFrame(() => {
                    overlay.style.opacity = '1';
                });
            }
        });
    }

    createPremiumOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'premium-overlay';
        
        // Définir les styles directement
        const styles = {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            borderRadius: 'inherit'
        };

        Object.assign(overlay.style, styles);

        overlay.innerHTML = `
            <div class="premium-overlay-content" style="text-align: center; color: white; padding: 20px;">
                <span style="font-size: 2em; margin-bottom: 10px; display: block;">🔒</span>
                <h3 style="margin-bottom: 10px;">Fonctionnalité Premium</h3>
                <p style="margin-bottom: 15px;">Accédez à toutes les fonctionnalités avec la version premium</p>
                <button class="upgrade-btn" style="
                    background: var(--primary-color, #4CAF50);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">Passer à la version Premium</button>
            </div>
        `;

        overlay.querySelector('.upgrade-btn').addEventListener('click', () => {
            document.querySelector('[data-tab="premium-features"]')?.click();
        });

        return overlay;
    }

    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        
        // Styles pour la notification
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: 'var(--border-radius, 8px)',
            backgroundColor: isError ? '#f44336' : 'var(--primary-color, #4CAF50)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            zIndex: '1000',
            animation: 'slideIn 0.3s ease'
        });

        document.body.appendChild(notification);

        // Créer l'animation si elle n'existe pas déjà
        if (!document.querySelector('#notification-keyframes')) {
            const keyframes = document.createElement('style');
            keyframes.id = 'notification-keyframes';
            keyframes.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(keyframes);
        }

        // Supprimer la notification après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

const premiumFeatures = new PremiumFeatures();

export { premiumFeatures }; 
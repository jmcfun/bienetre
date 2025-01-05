import { STORAGE_KEY, CHART_CONFIG, MOOD_LABELS, PERIODS, MOOD_SCORES } from './constants.js';

export class BasicStats {
    constructor() {
        this.moodChartInstance = null;
        this.energyStressChartInstance = null;
        this.period = PERIODS.WEEK;
    }

    async updateCharts() {
        const entries = await this.loadEntries();
        const filteredEntries = this.getLastSevenDays(entries);
        
        this.createMoodChart(filteredEntries);
        this.createEnergyStressChart(filteredEntries);
        this.createLifestyleChart(filteredEntries);
        this.updateRecentNotes(filteredEntries);
    }

    async loadEntries() {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        return data[STORAGE_KEY] || [];
    }

    getLastSevenDays(entries) {
        const now = new Date();
        const periodStart = new Date();
        
        periodStart.setDate(now.getDate() - 7);
        
        return entries.filter(entry => new Date(entry.timestamp) >= periodStart);
    }

    createMoodChart(entries) {
        const ctx = document.getElementById('moodChart').getContext('2d');
        if (this.moodChartInstance) {
            this.moodChartInstance.destroy();
        }

        const data = this.prepareChartData(entries);
        
        this.moodChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Humeur',
                    data: data.moodScores,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    spanGaps: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: value => MOOD_LABELS[value]
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.raw === null) return 'Pas de données';
                                return `Humeur: ${MOOD_LABELS[context.raw]}`;
                            }
                        }
                    }
                }
            }
        });
    }

    createEnergyStressChart(entries) {
        const ctx = document.getElementById('energyStressChart').getContext('2d');
        if (this.energyStressChartInstance) {
            this.energyStressChartInstance.destroy();
        }

        const data = this.prepareChartData(entries);
        
        this.energyStressChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Énergie',
                        data: data.energyLevels,
                        borderColor: '#98BA40',
                        spanGaps: true,
                        tension: 0.3
                    },
                    {
                        label: 'Stress',
                        data: data.stressLevels,
                        borderColor: '#FF6B6B',
                        spanGaps: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.raw === null) return 'Pas de données';
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }

    prepareChartData(entries) {
        // Assurer que nous avons exactement 7 points de données
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date;
        });
        
        // Créer un mapping des entrées par date
        const entriesByDate = entries.reduce((acc, entry) => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            acc[dateStr] = entry;
            return acc;
        }, {});
        
        // Préparer les données pour chaque jour
        const data = last7Days.map(date => {
            const dateStr = date.toLocaleDateString();
            const entry = entriesByDate[dateStr];
            
            return {
                label: date.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                }),
                moodScore: entry ? MOOD_SCORES[entry.mood] : null,
                energyLevel: entry ? parseInt(entry.energy) : null,
                stressLevel: entry ? parseInt(entry.stress) : null,
                activityLevel: entry ? parseInt(entry.activity) : null,
                sleepLevel: entry ? parseInt(entry.sleep) : null,
                socialLevel: entry ? parseInt(entry.social) : null
            };
        });
        
        return {
            labels: data.map(d => d.label),
            moodScores: data.map(d => d.moodScore),
            energyLevels: data.map(d => d.energyLevel),
            stressLevels: data.map(d => d.stressLevel),
            activityLevels: data.map(d => d.activityLevel),
            sleepLevels: data.map(d => d.sleepLevel),
            socialLevels: data.map(d => d.socialLevel)
        };
    }

    updateRecentNotes(entries) {
        const notesList = document.querySelector('.notes-list');
        if (!notesList) return;

        // Prendre les 5 dernières entrées avec des notes
        const recentNotes = entries
            .filter(entry => entry.notes && entry.notes.trim())
            .slice(-5)
            .reverse();

        if (recentNotes.length === 0) {
            notesList.innerHTML = '<p class="no-notes">Aucune note récente</p>';
            return;
        }

        notesList.innerHTML = recentNotes.map(entry => `
            <div class="note-item">
                <div class="note-date">${new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</div>
                <span class="note-mood">${entry.mood}</span>
                <div class="note-text">${entry.notes}</div>
            </div>
        `).join('');
    }

    createLifestyleChart(entries) {
        const ctx = document.getElementById('lifestyleChart').getContext('2d');
        if (this.lifestyleChartInstance) {
            this.lifestyleChartInstance.destroy();
        }

        const data = this.prepareChartData(entries);
        
        this.lifestyleChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Activité',
                        data: data.activityLevels,
                        borderColor: '#4CAF50'
                    },
                    {
                        label: 'Sommeil',
                        data: data.sleepLevels,
                        borderColor: '#9C27B0'
                    },
                    {
                        label: 'Social',
                        data: data.socialLevels,
                        borderColor: '#2196F3'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }
} 
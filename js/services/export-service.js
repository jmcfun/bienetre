export class ExportService {
    constructor() {
        this.STORAGE_KEY = 'moodJournal';
    }

    async exportData(format, period, customRange = null) {
        try {
            const entries = await this.loadEntries();
            let filteredEntries;

            if (customRange) {
                filteredEntries = this.filterEntriesByCustomRange(entries, customRange);
            } else {
                filteredEntries = this.filterEntriesByPeriod(entries, period);
            }
            
            switch (format) {
                case 'csv':
                    return this.exportToCSV(filteredEntries);
                case 'json':
                    return this.exportToJSON(filteredEntries);
                case 'txt':
                    return this.exportToTXT(filteredEntries);
                default:
                    throw new Error('Format non supporté');
            }
        } catch (error) {
            console.error('Erreur lors de l\'exportation:', error);
            throw error;
        }
    }

    filterEntriesByPeriod(entries, period) {
        if (!entries || !period || period === 'all') return entries;

        const now = new Date();
        const periods = {
            'week': 7,
            'month': 30,
            'year': 365
        };

        const daysToSubtract = periods[period];
        if (!daysToSubtract) return entries;

        const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));

        return entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= cutoffDate;
        });
    }

    async loadEntries() {
        const data = await chrome.storage.local.get(this.STORAGE_KEY);
        return data[this.STORAGE_KEY] || [];
    }

    exportToCSV(entries) {
        const headers = ['Date', 'Humeur', 'Énergie', 'Stress', 'Activité', 'Sommeil', 'Social', 'Notes'];
        const rows = entries.map(entry => [
            new Date(entry.timestamp).toLocaleString(),
            entry.mood,
            entry.energy,
            entry.stress,
            entry.activity,
            entry.sleep,
            entry.social,
            entry.notes
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    }

    exportToJSON(entries) {
        return new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    }

    exportToTXT(entries) {
        const content = entries.map(entry => {
            return `Date: ${new Date(entry.timestamp).toLocaleString()}
Humeur: ${entry.mood}
Énergie: ${entry.energy}
Stress: ${entry.stress}
Activité: ${entry.activity}
Sommeil: ${entry.sleep}
Social: ${entry.social}
Notes: ${entry.notes}
-------------------`;
        }).join('\n\n');

        return new Blob([content], { type: 'text/plain;charset=utf-8' });
    }

    initializeExportUI() {
        // Gestion des formats
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Gestion des périodes
        document.querySelectorAll('.period-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.period-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Afficher/masquer les dates personnalisées
                const customDates = document.querySelector('.custom-dates');
                if (customDates) {
                    customDates.style.display = option.dataset.period === 'custom' ? 'block' : 'none';
                }
            });
        });

        // Initialiser les dates
        this.initializeDateInputs();

        // Gestion des boutons d'export
        this.initializeExportButtons();
    }

    initializeDateInputs() {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const startDateInput = document.querySelector('#startDate');
        const endDateInput = document.querySelector('#endDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = lastMonth.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        }
    }

    initializeExportButtons() {
        const modal = document.getElementById('exportModal');
        const cancelBtn = document.getElementById('cancelExport');
        const confirmBtn = document.getElementById('confirmExport');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                try {
                    const format = document.querySelector('.format-option.active').dataset.format;
                    const periodOption = document.querySelector('.period-option.active');
                    let period = periodOption.dataset.period;

                    // Gérer la période personnalisée
                    let customRange = null;
                    if (period === 'custom') {
                        const startDate = document.getElementById('startDate').value;
                        const endDate = document.getElementById('endDate').value;
                        if (startDate && endDate) {
                            customRange = { startDate, endDate };
                        }
                    }

                    const blob = await this.exportData(format, period, customRange);
                    const fileName = `journal_humeur_${new Date().toISOString().split('T')[0]}.${format}`;
                    
                    // Créer et cliquer sur le lien de téléchargement
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    // Fermer la modale
                    modal.classList.remove('active');
                } catch (error) {
                    console.error('Erreur lors de l\'export:', error);
                    // Afficher une notification d'erreur
                    const notification = document.createElement('div');
                    notification.className = 'notification error';
                    notification.textContent = 'Erreur lors de l\'exportation des données';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                }
            });
        }
    }

    filterEntriesByCustomRange(entries, { startDate, endDate }) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Inclure toute la journée de fin

        return entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= start && entryDate <= end;
        });
    }
} 
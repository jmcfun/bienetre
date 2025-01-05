export class ExportService {
    constructor() {
        this.STORAGE_KEY = 'moodJournal';
    }

    async exportData(format, period) {
        try {
            const entries = await this.loadEntries();
            const filteredEntries = this.filterEntriesByPeriod(entries, period);
            
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
} 
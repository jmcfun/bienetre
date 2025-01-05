export const sampleData = {
    moodJournal: Array.from({ length: 7 }, (_, index) => {
        const moodPatterns = [
            { mood: 'très-bien', energy: '5', stress: '1', notes: 'Excellente journée, pleine d\'énergie' },
            { mood: 'bien', energy: '4', stress: '2', notes: 'Bonne journée productive' },
            { mood: 'neutre', energy: '3', stress: '3', notes: 'Journée normale' },
            { mood: 'bien', energy: '4', stress: '2', notes: 'Belle promenade en nature' },
            { mood: 'très-bien', energy: '5', stress: '1', notes: 'Super séance de sport' },
            { mood: 'neutre', energy: '3', stress: '3', notes: 'Journée tranquille' },
            { mood: 'bien', energy: '4', stress: '2', notes: 'Soirée agréable avec des amis' }
        ];

        return {
            timestamp: new Date(Date.now() - (7 - index) * 24 * 60 * 60 * 1000).toISOString(),
            ...moodPatterns[index]
        };
    })
}; 
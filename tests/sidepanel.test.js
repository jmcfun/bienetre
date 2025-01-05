import '../js/sidepanel.js';

describe('Sidepanel Component', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="period-selector">
                <button data-period="week">Semaine</button>
                <button data-period="month">Mois</button>
                <button data-period="year">Année</button>
            </div>
            <canvas id="moodChart"></canvas>
            <canvas id="energyStressChart"></canvas>
            <div id="bestMoments"></div>
            <div id="stressFactors"></div>
        `;

        // Mock des données de test
        chrome.storage.local.get.mockImplementation(() => ({
            moodJournal: [
                {
                    timestamp: new Date().toISOString(),
                    mood: 'très-bien',
                    energy: '4',
                    stress: '2',
                    notes: 'Test entry'
                }
            ]
        }));
    });

    test('change de période correctement', () => {
        const monthBtn = document.querySelector('[data-period="month"]');
        monthBtn.click();
        expect(monthBtn.classList.contains('active')).toBe(true);
    });

    test('charge les données correctement', async () => {
        await initCharts();
        expect(chrome.storage.local.get).toHaveBeenCalledWith('moodJournal');
    });
}); 
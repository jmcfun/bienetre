import '../js/popup.js';

describe('Popup Component', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="mood-selector">
                <button class="mood-btn" data-mood="très-bien">😊</button>
                <button class="mood-btn" data-mood="bien">🙂</button>
            </div>
            <input type="range" class="energy-level" value="3">
            <input type="range" class="stress-level" value="3">
            <textarea class="notes-section"></textarea>
            <button class="save-btn">Enregistrer</button>
        `;
    });

    test('sélection d\'humeur fonctionne correctement', () => {
        const moodBtn = document.querySelector('[data-mood="très-bien"]');
        moodBtn.click();
        expect(moodBtn.classList.contains('selected')).toBe(true);
    });

    test('sauvegarde une entrée correctement', async () => {
        // Simuler la sélection d'une humeur
        const moodBtn = document.querySelector('[data-mood="très-bien"]');
        moodBtn.click();

        // Simuler la saisie des données
        const energyLevel = document.querySelector('.energy-level');
        const stressLevel = document.querySelector('.stress-level');
        const notes = document.querySelector('.notes-section');
        
        energyLevel.value = '4';
        stressLevel.value = '2';
        notes.value = 'Test notes';

        // Simuler le clic sur le bouton de sauvegarde
        const saveBtn = document.querySelector('.save-btn');
        await saveBtn.click();

        // Vérifier que chrome.storage.local.set a été appelé avec les bonnes données
        expect(chrome.storage.local.set).toHaveBeenCalled();
    });
}); 
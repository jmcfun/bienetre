export class SuggestionsView {
    constructor(container, suggestionService) {
        this.container = container;
        this.suggestionService = suggestionService;
        this.initialize();
    }

    initialize() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="suggestions-header">
                <h3>Suggestions Personnalisées</h3>
                <button class="refresh-suggestions-btn primary-btn">
                    <span class="icon">🔄</span>
                    Actualiser
                </button>
            </div>
            <div class="suggestions-content"></div>
        `;

        this.refreshBtn = this.container.querySelector('.refresh-suggestions-btn');
        this.contentContainer = this.container.querySelector('.suggestions-content');
        this.addRefreshListener();
    }

    addRefreshListener() {
        this.refreshBtn?.addEventListener('click', () => this.refreshSuggestions());
    }

    async loadEntries() {
        try {
            const data = await chrome.storage.local.get('moodJournal');
            return data.moodJournal || [];
        } catch (error) {
            console.error('Erreur lors du chargement des entrées:', error);
            return [];
        }
    }

    async refreshSuggestions() {
        const entries = await this.loadEntries();
        await this.update(entries);
    }

    async update(entries) {
        if (!this.contentContainer) return;
        
        try {
            const suggestions = await this.suggestionService.getSuggestions(entries);
            
            if (suggestions.length === 0) {
                this.contentContainer.innerHTML = `
                    <div class="no-suggestions">
                        <p>Aucune suggestion disponible pour le moment.</p>
                    </div>
                `;
                return;
            }

            this.renderSuggestions(suggestions);
        } catch (error) {
            console.error('Erreur lors de la mise à jour des suggestions:', error);
            this.contentContainer.innerHTML = `
                <div class="suggestions-error">
                    <p>Une erreur est survenue lors du chargement des suggestions.</p>
                </div>
            `;
        }
    }

    renderSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.contentContainer.innerHTML = `
                <div class="no-suggestions">
                    <p>Aucune suggestion disponible pour le moment.</p>
                </div>
            `;
            return;
        }

        this.contentContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-card">
                <div class="suggestion-header">
                    <h4>${suggestion.title}</h4>
                    <span class="duration">${suggestion.duration}</span>
                </div>
                <p class="description">${suggestion.description}</p>
                <div class="suggestion-footer">
                    <a href="${suggestion.url}" target="_blank" class="source-link">
                        Source: ${suggestion.source}
                    </a>
                </div>
            </div>
        `).join('');
    }
} 
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
        if (!this.contentContainer) return;

        this.contentContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-header">
                    <h4>${suggestion.title}</h4>
                    <div class="suggestion-meta">
                        <span class="duration">${suggestion.duration}</span>
                        <span class="source">${suggestion.source}</span>
                    </div>
                </div>
                <p class="suggestion-description">${suggestion.description}</p>
                <div class="suggestion-footer">
                    <span class="category">${suggestion.category}</span>
                    <a href="${suggestion.url}" target="_blank" class="source-link">En savoir plus</a>
                    <button class="try-suggestion-btn primary-btn" data-id="${suggestion.id}">
                        <span class="icon">✨</span> Essayer
                    </button>
                </div>
            </div>
        `).join('');

        this.addSuggestionListeners();
    }

    addSuggestionListeners() {
        this.contentContainer?.querySelectorAll('.try-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const suggestionId = btn.dataset.id;
                await this.suggestionService.markSuggestionAsTried(suggestionId);
                btn.classList.add('tried');
                btn.innerHTML = '<span class="icon">✓</span> Essayé';
            });
        });
    }
} 
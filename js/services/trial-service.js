export class TrialService {
    constructor() {
        this.STORAGE_KEY = 'trialStatus';
        this.TRIAL_DURATION = 14; // 14 jours d'essai
    }

    async checkTrialStatus() {
        try {
            const data = await chrome.storage.local.get(this.STORAGE_KEY);
            const status = data[this.STORAGE_KEY] || this.getInitialTrialStatus();

            if (status.isTrialMode && !status.isExpired) {
                const now = new Date();
                const trialEnd = new Date(status.trialEndDate);
                status.daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
                status.isExpired = status.daysLeft <= 0;
            }

            return status;
        } catch (error) {
            console.error('Erreur vérification statut essai:', error);
            return this.getInitialTrialStatus();
        }
    }

    async getTrialStatus() {
        try {
            const data = await chrome.storage.local.get(this.STORAGE_KEY);
            return data[this.STORAGE_KEY] || this.getInitialTrialStatus();
        } catch (error) {
            console.error('Erreur récupération statut essai:', error);
            return this.getInitialTrialStatus();
        }
    }

    getInitialTrialStatus() {
        return {
            isTrialMode: false,
            startDate: null,
            trialEndDate: null,
            daysLeft: 0,
            isExpired: true,
            isPremium: false,
            isActive: false
        };
    }

    async resetTrial() {
        const status = this.getInitialTrialStatus();
        await chrome.storage.local.set({ [this.STORAGE_KEY]: status });
        return status;
    }
} 
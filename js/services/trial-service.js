export class TrialService {
    constructor() {
        this.TRIAL_KEY = 'trialInfo';
        this.TRIAL_HISTORY_KEY = 'trialHistory';
        this.TRIAL_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours
        this.DEV_MODE_KEY = 'devMode';
        this.PREMIUM_EMULATION_KEY = 'premiumEmulation';
    }

    async toggleDevMode(enabled) {
        try {
            if (enabled) {
                // Désactiver le mode premium si on active le mode essai
                await this.togglePremiumEmulation(false);
                // Initialiser une nouvelle période d'essai
                await this.resetTrial();
            } else {
                // Terminer la période d'essai
                await this.endTrial();
            }
            await chrome.storage.sync.set({ [this.DEV_MODE_KEY]: enabled });
            return enabled;
        } catch (error) {
            console.error('Erreur lors du changement de mode dev:', error);
            throw error;
        }
    }

    async togglePremiumEmulation(enabled) {
        try {
            if (enabled) {
                // Désactiver le mode essai si on active le mode premium
                await this.toggleDevMode(false);
                // Terminer toute période d'essai en cours
                await this.endTrial();
            }
            await chrome.storage.sync.set({ [this.PREMIUM_EMULATION_KEY]: enabled });
            return enabled;
        } catch (error) {
            console.error('Erreur lors du changement de mode premium:', error);
            throw error;
        }
    }

    async endTrial() {
        try {
            await chrome.storage.sync.remove([this.TRIAL_KEY]);
            return true;
        } catch (error) {
            console.error('Erreur lors de la fin de l\'essai:', error);
            throw error;
        }
    }

    async resetTrial() {
        try {
            const newTrialInfo = {
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + this.TRIAL_DURATION).toISOString(),
                isActive: true
            };
            await chrome.storage.sync.set({ [this.TRIAL_KEY]: newTrialInfo });
            return newTrialInfo;
        } catch (error) {
            console.error('Erreur lors de la réinitialisation de l\'essai:', error);
            throw error;
        }
    }

    async checkTrialStatus() {
        try {
            // Si le mode premium est émulé, retourner un statut premium actif
            if (await this.isPremiumEmulated()) {
                return {
                    isActive: true,
                    hasExpired: false,
                    isPremium: true,
                    daysLeft: 999,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))
                };
            }

            // Si en mode essai, vérifier le statut de l'essai
            if (await this.isDevMode()) {
                const trialInfo = await this.getTrialInfo();
                if (!trialInfo) {
                    return {
                        isActive: false,
                        hasExpired: true,
                        isTrialMode: true
                    };
                }

                const now = new Date();
                const endDate = new Date(trialInfo.endDate);
                const hasExpired = now > endDate;

                return {
                    isActive: !hasExpired && trialInfo.isActive,
                    hasExpired,
                    isTrialMode: true,
                    daysLeft: Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))),
                    startDate: new Date(trialInfo.startDate),
                    endDate: endDate
                };
            }

            // Version gratuite
            return {
                isActive: false,
                hasExpired: true,
                isPremium: false,
                isTrialMode: false
            };
        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            return { isActive: false, hasExpired: true, error: true };
        }
    }

    async isDevMode() {
        try {
            const data = await chrome.storage.sync.get(this.DEV_MODE_KEY);
            return !!data[this.DEV_MODE_KEY];
        } catch (error) {
            console.error('Erreur lors de la vérification du mode dev:', error);
            return false;
        }
    }

    async isPremiumEmulated() {
        try {
            const data = await chrome.storage.sync.get(this.PREMIUM_EMULATION_KEY);
            return !!data[this.PREMIUM_EMULATION_KEY];
        } catch (error) {
            console.error('Erreur lors de la vérification du mode premium:', error);
            return false;
        }
    }

    async getTrialInfo() {
        try {
            const data = await chrome.storage.sync.get(this.TRIAL_KEY);
            return data[this.TRIAL_KEY];
        } catch (error) {
            console.error('Erreur lors de la récupération des infos d\'essai:', error);
            return null;
        }
    }
} 
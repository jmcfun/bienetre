import { premiumFeatures } from './premium-features.js';

export class PremiumManager {
    constructor() {
        this.isPremium = false;
        this.trialEndDate = null;
        this.hasUsedTrial = false;
        this.isDevelopment = localStorage.getItem('devMode') === 'true' || false;
        this.init();
        this.premiumFeatures = premiumFeatures;
    }

    toggleDevMode() {
        this.isDevelopment = !this.isDevelopment;
        localStorage.setItem('devMode', this.isDevelopment);
        this.init();
        this.showNotification(
            this.isDevelopment ? 
            '🛠️ Mode développement activé' : 
            '🔒 Mode développement désactivé'
        );
    }

    async init() {
        // En mode développement, activer toutes les fonctionnalités premium
        if (this.isDevelopment) {
            console.log('Mode développement : activation de toutes les fonctionnalités premium');
            this.isPremium = true;
            this.unlockAllFeatures();
            return;
        }

        const data = await chrome.storage.local.get(['premium', 'trialEndDate', 'hasUsedTrial']);
        
        this.isPremium = data.premium || false;
        this.trialEndDate = data.trialEndDate ? new Date(data.trialEndDate) : null;
        this.hasUsedTrial = data.hasUsedTrial || false;

        if (this.trialEndDate && new Date() > this.trialEndDate) {
            await this.endTrial();
        }

        this.updateUI();
    }

    unlockAllFeatures() {
        // Débloquer toutes les fonctionnalités premium
        document.querySelectorAll('.premium-feature').forEach(el => {
            el.classList.remove('locked');
        });

        // Mettre à jour l'affichage du statut
        this.updateStatusDisplay('Mode Développement', 'development');

        // Masquer le CTA premium
        const premiumCTA = document.querySelector('.premium-cta');
        if (premiumCTA) {
            premiumCTA.style.display = 'none';
        }
    }

    isActiveSubscription() {
        return this.isDevelopment || this.isPremium || (this.trialEndDate && new Date() <= this.trialEndDate);
    }

    getRemainingTrialDays() {
        if (!this.trialEndDate) return 0;
        const now = new Date();
        if (now > this.trialEndDate) return 0;
        return Math.ceil((this.trialEndDate - now) / (1000 * 60 * 60 * 24));
    }

    getSubscriptionStatus() {
        if (this.isPremium) return 'premium';
        if (this.trialEndDate && new Date() <= this.trialEndDate) return 'trial';
        return 'free';
    }

    async startTrial() {
        if (this.isDevelopment) {
            this.showNotification('Mode développement actif - Accès complet disponible');
            return;
        }
        if (this.isPremium || this.hasUsedTrial) {
            this.showNotification('Vous avez déjà utilisé votre période d\'essai', true);
            return;
        }
        
        const trialDuration = 7 * 24 * 60 * 60 * 1000; // 7 jours
        this.trialEndDate = new Date(Date.now() + trialDuration);
        
        await chrome.storage.local.set({
            trialEndDate: this.trialEndDate.toISOString(),
            hasUsedTrial: true
        });

        this.hasUsedTrial = true;
        this.updateUI();
        this.showNotification('Votre période d\'essai Premium a commencé !');
    }

    async endTrial() {
        this.trialEndDate = null;
        this.isPremium = false;
        await chrome.storage.local.set({
            trialEndDate: null,
            premium: false
        });
        this.updateUI();
    }

    startTrialCheck() {
        // Vérifier toutes les heures si la période d'essai est terminée
        setInterval(async () => {
            if (this.trialEndDate && new Date() > this.trialEndDate) {
                await this.endTrial();
                this.showNotification('Votre période d\'essai est terminée');
            }
        }, 3600000); // 1 heure
    }

    updateUI() {
        if (this.isDevelopment) {
            this.unlockAllFeatures();
            return;
        }

        const statusElement = document.getElementById('premiumStatus');
        if (!statusElement) return;

        if (this.isPremium) {
            this.updateStatusDisplay('Premium', 'active');
            document.querySelectorAll('.premium-feature').forEach(el => {
                el.classList.remove('locked');
            });
        } else if (this.trialEndDate && new Date() <= this.trialEndDate) {
            const daysLeft = this.getRemainingTrialDays();
            this.updateStatusDisplay(`Version d'essai (${daysLeft}j)`, 'trial');
            document.querySelectorAll('.premium-feature').forEach(el => {
                el.classList.remove('locked');
            });
        } else {
            this.updateStatusDisplay('Version gratuite', '');
            document.querySelectorAll('.premium-feature').forEach(el => {
                el.classList.add('locked');
            });
        }
    }

    updateStatusDisplay(text, className) {
        const statusElement = document.getElementById('premiumStatus');
        if (statusElement) {
            statusElement.className = `premium-status ${className}`;
            statusElement.querySelector('.status-text').textContent = text;
        }
    }

    async upgradeToPremium() {
        // Simuler un processus de paiement
        const success = await this.simulatePayment();
        if (success) {
            this.isPremium = true;
            await chrome.storage.local.set({ premium: true });
            this.updateUI();
            this.showNotification('Bienvenue dans la version Premium !');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async simulatePayment() {
        return new Promise(resolve => {
            // Simuler une interface de paiement
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Passer à Premium</h3>
                    <p>Prix : 4.99€/mois</p>
                    <div class="modal-actions">
                        <button id="cancelPayment" class="secondary-btn">Annuler</button>
                        <button id="confirmPayment" class="primary-btn">Confirmer</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#confirmPayment').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });
            
            modal.querySelector('#cancelPayment').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }
}

// Initialisation
export const premiumManager = new PremiumManager();

// Gestionnaires d'événements
document.querySelector('.try-premium-btn')?.addEventListener('click', () => {
    premiumManager.startTrial();
});

document.querySelector('#upgradeToPremium')?.addEventListener('click', () => {
    premiumManager.upgradeToPremium();
}); 
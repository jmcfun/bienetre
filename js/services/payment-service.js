export class PaymentService {
    constructor() {
        this.SUBSCRIPTION_KEY = 'subscriptionInfo';
        this.DEV_MODE_KEY = 'devMode';
        this.PLANS = {
            MONTHLY: {
                id: 'premium_monthly',
                price: 4.99,
                period: 'month',
                name: 'Abonnement Mensuel'
            },
            ANNUAL: {
                id: 'premium_annual',
                price: 39.99,
                period: 'year',
                savings: '33%',
                name: 'Abonnement Annuel'
            }
        };

        this.startSubscriptionCheck();
    }

    async isDevMode() {
        const data = await chrome.storage.sync.get(this.DEV_MODE_KEY);
        return !!data[this.DEV_MODE_KEY];
    }

    async startSubscriptionCheck() {
        chrome.alarms.create('checkSubscription', {
            periodInMinutes: 60
        });

        chrome.alarms.onAlarm.addListener(async (alarm) => {
            if (alarm.name === 'checkSubscription') {
                await this.verifySubscription();
            }
        });
    }

    async handlePayment(planId) {
        try {
            const plan = this.PLANS[planId === this.PLANS.MONTHLY.id ? 'MONTHLY' : 'ANNUAL'];
            
            if (await this.isDevMode()) {
                return await this.simulateSubscription(planId);
            }

            // Rediriger vers la page de l'extension dans le Chrome Web Store
            const storeUrl = `https://chrome.google.com/webstore/detail/${chrome.runtime.id}`;
            await chrome.tabs.create({ url: storeUrl });

            return true;
        } catch (error) {
            console.error('Erreur lors du paiement:', error);
            throw error;
        }
    }

    async verifySubscription() {
        try {
            const data = await chrome.storage.sync.get([this.SUBSCRIPTION_KEY]);
            const subscriptionInfo = data[this.SUBSCRIPTION_KEY];

            if (!subscriptionInfo) return false;

            const now = Date.now();
            const expiryTime = new Date(subscriptionInfo.expiryTime).getTime();
            const isActive = now < expiryTime;

            if (!isActive && subscriptionInfo.active) {
                await this.handleExpiredSubscription(subscriptionInfo);
            }

            subscriptionInfo.active = isActive;
            await chrome.storage.sync.set({
                [this.SUBSCRIPTION_KEY]: subscriptionInfo
            });

            return {
                active: isActive,
                expiryDate: new Date(expiryTime),
                plan: subscriptionInfo.plan,
                daysLeft: Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24))
            };
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'abonnement:', error);
            return false;
        }
    }

    async handleExpiredSubscription(subscriptionInfo) {
        chrome.notifications.create('subscription_expired', {
            type: 'basic',
            iconUrl: '/images/icon48.png',
            title: 'Abonnement expiré',
            message: `Votre abonnement ${this.PLANS[subscriptionInfo.plan].name} a expiré. Renouvelez-le pour continuer à profiter des fonctionnalités premium.`,
            priority: 2
        });

        await this.deactivatePremiumFeatures();
    }

    async deactivatePremiumFeatures() {
        await chrome.storage.sync.set({
            isPremium: false
        });

        chrome.runtime.sendMessage({
            type: 'SUBSCRIPTION_EXPIRED'
        });
    }

    // Pour le développement uniquement
    async simulateSubscription(planId) {
        const plan = this.PLANS[planId === this.PLANS.MONTHLY.id ? 'MONTHLY' : 'ANNUAL'];
        const now = new Date();
        const expiryTime = new Date(now);
        
        if (plan.period === 'month') {
            expiryTime.setMonth(expiryTime.getMonth() + 1);
        } else {
            expiryTime.setFullYear(expiryTime.getFullYear() + 1);
        }

        const subscriptionInfo = {
            active: true,
            purchaseDate: now.toISOString(),
            expiryTime: expiryTime.toISOString(),
            plan: planId,
            orderId: `DEV_${Date.now()}`
        };

        await chrome.storage.sync.set({
            [this.SUBSCRIPTION_KEY]: subscriptionInfo,
            isPremium: true
        });

        return subscriptionInfo;
    }
} 
export class PaymentService {
    constructor() {
        this.SUBSCRIPTION_KEY = 'subscriptionInfo';
        this.PLANS = {
            MONTHLY: {
                id: 'monthly',
                price: 4.99,
                period: 'month'
            },
            ANNUAL: {
                id: 'annual',
                price: 39.99,
                period: 'year',
                savings: '33%'
            },
            LIFETIME: {
                id: 'lifetime',
                price: 99.99,
                type: 'one-time'
            }
        };
    }
} 
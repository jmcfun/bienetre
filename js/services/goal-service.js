export class GoalService {
    constructor() {
        this.STORAGE_KEY = 'moodGoals';
        this.goalTypes = {
            mood: {
                name: 'Amélioration de l\'humeur',
                icon: '😊',
                metrics: ['mood'],
                defaultTarget: 4
            },
            activity: {
                name: 'Niveau d\'activité',
                icon: '🏃',
                metrics: ['activity'],
                defaultTarget: 4
            },
            sleep: {
                name: 'Qualité du sommeil',
                icon: '😴',
                metrics: ['sleep'],
                defaultTarget: 4
            },
            social: {
                name: 'Interactions sociales',
                icon: '👥',
                metrics: ['social'],
                defaultTarget: 4
            },
            stress: {
                name: 'Gestion du stress',
                icon: '🧘',
                metrics: ['stress'],
                defaultTarget: 2
            }
        };
        this.goalStatus = {
            ACTIVE: 'active',
            COMPLETED: 'completed',
            FAILED: 'failed',
            ARCHIVED: 'archived'
        };
    }

    async getGoals() {
        const data = await chrome.storage.local.get(this.STORAGE_KEY);
        return data[this.STORAGE_KEY] || [];
    }

    async setGoal(type, target, deadline) {
        if (!this.goalTypes[type]) {
            throw new Error('Type d\'objectif invalide');
        }

        const goals = await this.getGoals();
        const newGoal = {
            id: Date.now(),
            type,
            target,
            deadline: new Date(deadline).toISOString(),
            createdAt: new Date().toISOString(),
            progress: 0,
            completed: false
        };

        goals.push(newGoal);
        await chrome.storage.local.set({ [this.STORAGE_KEY]: goals });
        return newGoal;
    }

    async updateProgress(entries) {
        const goals = await this.getGoals();
        const updatedGoals = goals.map(goal => {
            if (goal.status === this.goalStatus.ARCHIVED) return goal;

            const now = new Date();
            const deadline = new Date(goal.deadline);
            const isExpired = now > deadline;

            const relevantEntries = entries.filter(entry => 
                new Date(entry.timestamp) >= new Date(goal.createdAt) &&
                new Date(entry.timestamp) <= deadline
            );

            const progress = this.calculateProgress(goal, relevantEntries);
            const status = this.determineGoalStatus(progress, isExpired);

            return {
                ...goal,
                progress,
                status,
                achievementDate: status === this.goalStatus.COMPLETED ? 
                    new Date().toISOString() : null
            };
        });

        await chrome.storage.local.set({ [this.STORAGE_KEY]: updatedGoals });
        return updatedGoals;
    }

    calculateProgress(goal, entries) {
        if (!entries.length) return 0;

        const metrics = this.goalTypes[goal.type].metrics;
        const values = entries.map(entry => 
            metrics.reduce((avg, metric) => avg + Number(entry[metric]), 0) / metrics.length
        );

        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const progress = (average / goal.target) * 100;
        return Math.min(Math.round(progress), 100);
    }

    determineGoalStatus(progress, isExpired) {
        if (progress >= 100) return this.goalStatus.COMPLETED;
        if (isExpired) return this.goalStatus.FAILED;
        return this.goalStatus.ACTIVE;
    }

    async archiveGoal(goalId) {
        const goals = await this.getGoals();
        const updatedGoals = goals.map(goal => {
            if (goal.id === goalId) {
                return { ...goal, status: this.goalStatus.ARCHIVED };
            }
            return goal;
        });
        await this.saveGoals(updatedGoals);
        return updatedGoals;
    }

    async deleteGoal(goalId) {
        const goals = await this.getGoals();
        const updatedGoals = goals.filter(goal => goal.id !== goalId);
        await this.saveGoals(updatedGoals);
        return updatedGoals;
    }

    async editGoal(goalId, updates) {
        const goals = await this.getGoals();
        const updatedGoals = goals.map(goal => {
            if (goal.id === goalId) {
                return { ...goal, ...updates };
            }
            return goal;
        });
        await this.saveGoals(updatedGoals);
        return updatedGoals;
    }

    async saveGoals(goals) {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: goals });
    }
} 
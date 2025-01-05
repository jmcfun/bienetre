export class MigrationService {
    constructor() {
        this.BACKUP_KEY = 'dataBackup';
    }

    async backupData() {
        try {
            const dataToBackup = await this.gatherAllData();
            await chrome.storage.sync.set({ [this.BACKUP_KEY]: dataToBackup });
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des données:', error);
            return false;
        }
    }

    async gatherAllData() {
        // Récupérer toutes les données importantes
        const data = await chrome.storage.local.get(null);
        const syncData = await chrome.storage.sync.get(null);

        return {
            localData: data,
            syncData: syncData,
            timestamp: Date.now(),
            version: chrome.runtime.getManifest().version
        };
    }

    async restoreData() {
        try {
            const backup = await chrome.storage.sync.get(this.BACKUP_KEY);
            if (!backup[this.BACKUP_KEY]) return false;

            // Restaurer les données
            await chrome.storage.local.set(backup[this.BACKUP_KEY].localData);
            return true;
        } catch (error) {
            console.error('Erreur lors de la restauration des données:', error);
            return false;
        }
    }
} 
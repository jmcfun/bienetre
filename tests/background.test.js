import '../background.js';

describe('Background Service', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        chrome.storage.local.get.mockClear();
        chrome.storage.local.set.mockClear();
        chrome.alarms.create.mockClear();
    });

    test('initialise les paramètres correctement lors de l\'installation', () => {
        const callback = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
        callback();
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            settings: {
                reminderEnabled: true,
                reminderTime: '20:00',
                lastNotificationDate: null
            }
        });
    });

    test('crée une notification quand aucune entrée n\'existe pour aujourd\'hui', async () => {
        chrome.storage.local.get.mockImplementation(() => ({
            settings: {
                reminderEnabled: true,
                reminderTime: '20:00',
                lastNotificationDate: null
            },
            moodJournal: []
        }));

        const alarmCallback = chrome.alarms.onAlarm.addListener.mock.calls[0][0];
        await alarmCallback({ name: 'moodCheckReminder' });

        expect(chrome.notifications.create).toHaveBeenCalled();
    });
}); 
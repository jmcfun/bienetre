// Mock des APIs Chrome
global.chrome = {
    runtime: {
        onInstalled: {
            addListener: jest.fn()
        },
        onMessage: {
            addListener: jest.fn()
        }
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn()
        }
    },
    alarms: {
        create: jest.fn(),
        clear: jest.fn(),
        onAlarm: {
            addListener: jest.fn()
        }
    },
    notifications: {
        create: jest.fn(),
        onClicked: {
            addListener: jest.fn()
        }
    },
    action: {
        openPopup: jest.fn()
    },
    tabs: {
        query: jest.fn()
    },
    sidePanel: {
        open: jest.fn()
    }
}; 
"use strict";
// src/background.ts
// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id)
            return;
        let messageType = null;
        switch (command) {
            case 'set-start':
                messageType = 'setStart';
                break;
            case 'set-end':
                messageType = 'setEnd';
                break;
            case 'toggle-loop':
                messageType = 'toggleLoop';
                break;
            case 'clear-loop':
                messageType = 'clearLoop';
                break;
            default:
                return;
        }
        if (messageType) {
            chrome.tabs.sendMessage(tab.id, { type: messageType }, () => {
                if (chrome.runtime.lastError) {
                    console.log('Content script not ready:', chrome.runtime.lastError.message);
                }
            });
        }
    });
});
// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.local.set({
            loops: [],
            settings: {
                autoLoop: false,
                showTimeDisplay: true
            }
        }).then(() => {
            console.log('LoopMaster installed successfully!');
        }).catch((error) => {
            console.error('Installation error:', error);
        });
    }
});
// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'keepAlive') {
        port.onDisconnect.addListener(() => {
            // Handle disconnect if needed
        });
    }
});
// Periodically check if we need to keep alive
setInterval(() => {
    // Just a ping to keep service worker alive
    console.log('LoopMaster background service is running');
}, 60000);
// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'saveLoop') {
        // Save a loop to storage
        chrome.storage.local.get(['loops']).then((result) => {
            const loops = result.loops || [];
            loops.push(message.payload);
            chrome.storage.local.set({ loops }).then(() => {
                sendResponse({ success: true });
            }).catch(() => {
                sendResponse({ success: false });
            });
        }).catch(() => {
            sendResponse({ success: false });
        });
        return true;
    }
    if (message.type === 'getLoops') {
        chrome.storage.local.get(['loops']).then((result) => {
            sendResponse({ loops: result.loops || [] });
        }).catch(() => {
            sendResponse({ loops: [] });
        });
        return true;
    }
    // Default response for other messages
    sendResponse({ success: false, error: 'Unknown message type' });
    return true;
});

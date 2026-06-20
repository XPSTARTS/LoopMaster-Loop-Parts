// src/popup.ts

document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('statusDot') as HTMLElement;
  const statusText = document.getElementById('statusText') as HTMLElement;
  const showBtn = document.getElementById('showBtn') as HTMLButtonElement;
  const hideBtn = document.getElementById('hideBtn') as HTMLButtonElement;

  // Check current state
  updateStatus();

  // Show button
  showBtn.addEventListener('click', () => {
    sendMessageToTab({ type: 'showUI' });
    updateStatus();
  });

  // Hide button
  hideBtn.addEventListener('click', () => {
    sendMessageToTab({ type: 'hideUI' });
    updateStatus();
  });

  async function updateStatus() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (!tab.id) {
        setStatus('inactive', 'No active tab');
        return;
      }

      // Check if we're on YouTube
      if (!tab.url?.includes('youtube.com')) {
        setStatus('inactive', 'Not on YouTube');
        return;
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'getState' });
      
      if (response && response.state) {
        const state = response.state;
        const isVisible = response.isVisible !== undefined ? response.isVisible : true;
        
        if (state.isActive) {
          setStatus('looping', `🔴 Looping ${formatTime(state.startTime)} → ${formatTime(state.endTime)}`);
        } else if (state.startTime !== null && state.endTime !== null) {
          setStatus('visible', `⏸ Ready: ${formatTime(state.startTime)} → ${formatTime(state.endTime)}`);
        } else {
          setStatus('visible', '⏸ No loop set');
        }
      } else {
        setStatus('inactive', 'Extension not ready');
      }
    } catch (error) {
      console.log('Error updating status:', error);
      setStatus('inactive', 'Click a YouTube video');
    }
  }

  function setStatus(type: 'visible' | 'hidden' | 'looping' | 'inactive', text: string) {
    statusDot.className = 'status-dot';
    if (type === 'visible') {
      statusDot.classList.add('visible');
      statusText.textContent = text;
    } else if (type === 'looping') {
      statusDot.classList.add('looping');
      statusText.textContent = text;
    } else if (type === 'hidden') {
      statusDot.classList.add('hidden');
      statusText.textContent = text;
    } else {
      statusDot.classList.add('hidden');
      statusText.textContent = text;
    }
  }

  function formatTime(seconds: number | null): string {
    if (seconds === null || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function sendMessageToTab(message: any) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, message);
        // Update status after a short delay
        setTimeout(updateStatus, 200);
      }
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }
});
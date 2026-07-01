// src/popup.ts - NO innerHTML (safe)

document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('statusDot') as HTMLElement;
  const statusText = document.getElementById('statusText') as HTMLElement;
  const showBtn = document.getElementById('showBtn') as HTMLButtonElement;
  const showLabel = document.getElementById('showLabel') as HTMLElement;
  const hideBtn = document.getElementById('hideBtn') as HTMLButtonElement;

  updateStatus();

  showBtn.addEventListener('click', () => {
    sendMessage({ type: 'showUI' });
    setTimeout(updateStatus, 300);
  });

  hideBtn.addEventListener('click', () => {
    sendMessage({ type: 'hideUI' });
    setTimeout(updateStatus, 300);
  });

  async function updateStatus() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (!tab.id || !tab.url?.includes('youtube.com')) {
        setStatus('hidden', 'Open a YouTube video');
        setButtonStates(false);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'getState' });
      
      if (response && response.state) {
        const state = response.state;
        const isVisible = response.isVisible || false;
        
        if (state.isActive) {
          const start = formatTime(state.startTime);
          const end = formatTime(state.endTime);
          setStatus('looping', `🔴 Looping ${start} → ${end}`);
        } else if (state.startTime !== null && state.endTime !== null) {
          const start = formatTime(state.startTime);
          const end = formatTime(state.endTime);
          setStatus('visible', `⏸ Ready: ${start} → ${end}`);
        } else {
          setStatus('visible', '⏸ Set A and B points');
        }
        
        setButtonStates(isVisible);
      } else {
        setStatus('hidden', 'Click a YouTube video');
        setButtonStates(false);
      }
    } catch (error) {
      console.log('Error:', error);
      setStatus('hidden', 'Click a YouTube video');
      setButtonStates(false);
    }
  }

  function setStatus(type: 'visible' | 'hidden' | 'looping', text: string) {
    statusDot.className = 'status-dot';
    if (type === 'visible') {
      statusDot.classList.add('visible');
    } else if (type === 'looping') {
      statusDot.classList.add('looping');
    } else {
      statusDot.classList.add('hidden');
    }
    // Using textContent instead of innerHTML (safe!)
    statusText.textContent = text;
  }

  function setButtonStates(isVisible: boolean) {
    if (isVisible) {
      showBtn.classList.add('active');
      showLabel.textContent = 'UI is Visible';
      hideBtn.classList.remove('active');
    } else {
      showBtn.classList.remove('active');
      showLabel.textContent = 'Show Control UI';
      hideBtn.classList.add('active');
    }
  }

  function formatTime(seconds: number | null): string {
    if (seconds === null || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function sendMessage(message: any) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }
});
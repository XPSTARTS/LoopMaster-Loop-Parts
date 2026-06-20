"use strict";
// src/content.ts - COMPLETE FIXED VERSION
console.log('🔴 LoopMaster v1.0.1 LOADED!');
let loopMasterInstance = null;
class YouTubeLooper {
    constructor() {
        this.video = null;
        this.container = null;
        this.loopState = {
            isActive: false,
            startTime: null,
            endTime: null
        };
        this.boundTimeUpdate = null;
        this.isMobile = false;
        console.log('🎬 Initializing LoopMaster...');
        this.isMobile = window.location.hostname === 'm.youtube.com';
        console.log('📱 Mobile mode:', this.isMobile);
        this.findVideo();
        this.setupMessageListener();
    }
    findVideo() {
        let video = document.querySelector('video');
        if (!video && this.isMobile) {
            video = document.querySelector('video.html5-video-player');
        }
        if (!video) {
            const videos = document.querySelectorAll('video');
            if (videos.length > 0) {
                video = videos[0];
            }
        }
        if (video) {
            this.video = video;
            console.log('✅ Video found!', this.video);
            // Wait for video to be ready
            this.waitForVideoReady().then(() => {
                this.createUI();
                this.restoreVisibility();
            });
        }
        else {
            console.log('⏳ No video found, retrying in 1 second...');
            setTimeout(() => this.findVideo(), 1000);
        }
    }
    waitForVideoReady() {
        return new Promise((resolve) => {
            if (!this.video) {
                resolve();
                return;
            }
            // Check if video already has duration
            if (this.video.duration > 0 && !isNaN(this.video.duration)) {
                console.log('✅ Video ready! Duration:', this.video.duration);
                resolve();
                return;
            }
            // Wait for loadedmetadata event
            const onLoaded = () => {
                if (this.video) {
                    console.log('✅ Video metadata loaded! Duration:', this.video.duration);
                    this.video.removeEventListener('loadedmetadata', onLoaded);
                    resolve();
                }
            };
            this.video.addEventListener('loadedmetadata', onLoaded);
            // Timeout fallback
            setTimeout(() => {
                this.video?.removeEventListener('loadedmetadata', onLoaded);
                console.log('⚠️ Video load timeout, proceeding anyway...');
                resolve();
            }, 5000);
        });
    }
    createUI() {
        const old = document.getElementById('loopmaster-container');
        if (old)
            old.remove();
        this.container = document.createElement('div');
        this.container.id = 'loopmaster-container';
        const bottomPos = this.isMobile ? '70px' : '90px';
        const leftPos = this.isMobile ? '10px' : '20px';
        this.container.style.cssText = `
      position: fixed !important;
      bottom: ${bottomPos} !important;
      left: ${leftPos} !important;
      z-index: 999999 !important;
      background: linear-gradient(145deg, #1a1a2e, #16213e) !important;
      border-radius: 16px !important;
      padding: 12px 16px !important;
      color: white !important;
      font-family: 'Segoe UI', Roboto, Arial, sans-serif !important;
      font-size: ${this.isMobile ? '12px' : '14px'} !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1) !important;
      border: 1px solid rgba(255,255,255,0.15) !important;
      user-select: none !important;
      cursor: grab !important;
      min-width: ${this.isMobile ? '180px' : '240px'} !important;
      max-width: 95vw !important;
      flex-wrap: wrap !important;
      backdrop-filter: blur(10px) !important;
    `;
        const btnSize = this.isMobile ? '34px' : '38px';
        const fontSize = this.isMobile ? '14px' : '16px';
        const padding = this.isMobile ? '4px 10px' : '6px 14px';
        const gap = this.isMobile ? '4px' : '8px';
        const btnWrapper = document.createElement('div');
        btnWrapper.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: ${gap} !important;
      flex-wrap: wrap !important;
    `;
        // A Button
        const btnA = this.createButton('A', '#FF6B6B', 'Set Start', btnSize, fontSize, padding);
        btnA.onclick = () => this.setStart();
        btnWrapper.appendChild(btnA);
        // B Button
        const btnB = this.createButton('B', '#4ECDC4', 'Set End', btnSize, fontSize, padding);
        btnB.onclick = () => this.setEnd();
        btnWrapper.appendChild(btnB);
        // Toggle Loop Button
        const btnLoop = this.createButton('▶', '#FFD93D', 'Toggle Loop', btnSize, fontSize, padding);
        btnLoop.id = 'loop-toggle-btn';
        btnLoop.onclick = () => this.toggleLoop();
        btnWrapper.appendChild(btnLoop);
        // Close Button
        const closeBtn = this.createButton('✕', '#FF6B6B', 'Hide', btnSize, fontSize, padding);
        closeBtn.onclick = () => this.hideUI();
        btnWrapper.appendChild(closeBtn);
        // Clear Button
        const btnClear = this.createButton('🗑', '#FF6B6B', 'Clear', btnSize, fontSize, padding);
        btnClear.onclick = () => this.clearLoop();
        btnWrapper.appendChild(btnClear);
        this.container.appendChild(btnWrapper);
        // Display
        const display = document.createElement('div');
        display.id = 'loop-display';
        display.style.cssText = `
      font-size: ${this.isMobile ? '11px' : '13px'} !important;
      color: #aaa !important;
      padding: 6px 12px !important;
      background: rgba(255,255,255,0.06) !important;
      border-radius: 8px !important;
      min-width: ${this.isMobile ? '80px' : '140px'} !important;
      text-align: center !important;
      font-family: 'Courier New', monospace !important;
      letter-spacing: 0.5px !important;
      border: 1px solid rgba(255,255,255,0.05) !important;
      flex: 1 !important;
    `;
        display.textContent = '⏸ A:--:-- B:--:--';
        this.container.appendChild(display);
        const dragHandle = document.createElement('div');
        dragHandle.style.cssText = `
      position: absolute !important;
      top: 4px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 30px !important;
      height: 3px !important;
      background: rgba(255,255,255,0.15) !important;
      border-radius: 4px !important;
      cursor: grab !important;
    `;
        this.container.appendChild(dragHandle);
        document.body.appendChild(this.container);
        console.log('✅✅✅ UI CREATED! Container added to page!');
        this.updateUI();
        this.makeDraggable(this.container);
    }
    createButton(text, color, title, size, fontSize, padding) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.title = title;
        btn.style.cssText = `
      background: rgba(255,255,255,0.05) !important;
      border: 2px solid ${color} !important;
      color: ${color} !important;
      padding: ${padding} !important;
      border-radius: 10px !important;
      cursor: pointer !important;
      font-size: ${fontSize} !important;
      font-weight: 700 !important;
      min-width: ${size} !important;
      height: ${size} !important;
      transition: all 0.2s ease !important;
      line-height: 1 !important;
      flex-shrink: 0 !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
    `;
        btn.onmouseenter = () => {
            btn.style.background = color + '33';
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
        };
        btn.onmouseleave = () => {
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        };
        btn.onmousedown = () => {
            btn.style.transform = 'scale(0.93)';
        };
        btn.onmouseup = () => {
            btn.style.transform = 'scale(1)';
        };
        return btn;
    }
    makeDraggable(element) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        const onMouseDown = (e) => {
            if (e.target.closest('button'))
                return;
            isDragging = true;
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            element.style.cursor = 'grabbing';
            element.style.opacity = '0.85';
            element.style.transition = 'none';
            e.preventDefault();
        };
        const onMouseMove = (e) => {
            if (!isDragging)
                return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            const maxX = window.innerWidth - element.offsetWidth - 10;
            const maxY = window.innerHeight - element.offsetHeight - 10;
            x = Math.max(10, Math.min(x, maxX));
            y = Math.max(10, Math.min(y, maxY));
            element.style.left = x + 'px';
            element.style.top = y + 'px';
            element.style.right = 'auto';
            element.style.bottom = 'auto';
        };
        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'grab';
                element.style.opacity = '1';
                element.style.transition = 'opacity 0.2s ease';
            }
        };
        element.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    hideUI() {
        if (this.container) {
            this.container.style.display = 'none';
            this.showToast('👋 LoopMaster hidden');
            chrome.storage.local.set({ loopHidden: true }).catch(() => { });
        }
    }
    showUI() {
        if (this.container) {
            this.container.style.display = 'flex';
            this.showToast('👋 LoopMaster visible!');
            chrome.storage.local.set({ loopHidden: false }).catch(() => { });
        }
    }
    toggleVisibility() {
        if (this.container && this.container.style.display === 'none') {
            this.showUI();
        }
        else {
            this.hideUI();
        }
    }
    restoreVisibility() {
        chrome.storage.local.get(['loopHidden']).then((result) => {
            if (result.loopHidden && this.container) {
                this.container.style.display = 'none';
            }
        }).catch(() => { });
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('📨 Message received:', message.type);
            switch (message.type) {
                case 'showUI':
                    this.showUI();
                    sendResponse({ success: true, isVisible: true });
                    break;
                case 'hideUI':
                    this.hideUI();
                    sendResponse({ success: true, isVisible: false });
                    break;
                case 'getState':
                    sendResponse({
                        state: this.loopState,
                        isVisible: this.container ? this.container.style.display !== 'none' : true
                    });
                    break;
                default:
                    sendResponse({ error: 'Unknown message type' });
            }
            return true;
        });
    }
    // ==================== CORE FUNCTIONS (FIXED) ====================
    setStart() {
        if (!this.video) {
            this.showToast('⚠️ Video not ready!');
            return;
        }
        // Make sure video is playing or has currentTime
        const currentTime = this.video.currentTime;
        if (isNaN(currentTime) || currentTime < 0) {
            this.showToast('⚠️ Video not loaded yet!');
            return;
        }
        this.loopState.startTime = Math.round(currentTime * 100) / 100;
        this.updateUI();
        this.showToast(`🔴 Start: ${this.formatTime(this.loopState.startTime)}`);
        console.log('Start set:', this.loopState.startTime);
        console.log('Video current time:', this.video.currentTime);
    }
    setEnd() {
        if (!this.video) {
            this.showToast('⚠️ Video not ready!');
            return;
        }
        const currentTime = this.video.currentTime;
        if (isNaN(currentTime) || currentTime < 0) {
            this.showToast('⚠️ Video not loaded yet!');
            return;
        }
        this.loopState.endTime = Math.round(currentTime * 100) / 100;
        this.updateUI();
        this.showToast(`🔵 End: ${this.formatTime(this.loopState.endTime)}`);
        console.log('End set:', this.loopState.endTime);
        console.log('Video current time:', this.video.currentTime);
    }
    toggleLoop() {
        console.log('🔄 Toggle Loop called! Current state:', this.loopState.isActive);
        console.log('Start time:', this.loopState.startTime);
        console.log('End time:', this.loopState.endTime);
        if (this.loopState.startTime === null || this.loopState.endTime === null) {
            this.showToast('⚠️ Set A and B first!');
            console.log('⚠️ Cannot toggle: A or B not set');
            return;
        }
        // Make sure times are valid
        if (this.loopState.startTime >= this.loopState.endTime) {
            this.showToast('⚠️ Start must be before End!');
            console.log('⚠️ Start >= End');
            return;
        }
        this.loopState.isActive = !this.loopState.isActive;
        console.log('🔄 New loop state:', this.loopState.isActive);
        if (this.loopState.isActive) {
            if (this.video) {
                this.removeTimeUpdateListener();
                this.boundTimeUpdate = this.handleTimeUpdate.bind(this);
                this.video.addEventListener('timeupdate', this.boundTimeUpdate);
                this.video.currentTime = this.loopState.startTime;
                this.video.play().catch((err) => {
                    console.log('⚠️ Play error:', err);
                });
                console.log('✅ Loop started, jumped to:', this.loopState.startTime);
            }
            this.showToast(`🔄 Loop ON (${this.formatTime(this.loopState.startTime)} → ${this.formatTime(this.loopState.endTime)})`);
        }
        else {
            this.removeTimeUpdateListener();
            this.showToast('⏹ Loop OFF');
            console.log('✅ Loop stopped');
        }
        this.updateUI();
    }
    removeTimeUpdateListener() {
        if (this.video && this.boundTimeUpdate) {
            this.video.removeEventListener('timeupdate', this.boundTimeUpdate);
            this.boundTimeUpdate = null;
            console.log('🔇 Timeupdate listener removed');
        }
    }
    handleTimeUpdate() {
        if (!this.video || !this.loopState.isActive)
            return;
        if (this.loopState.endTime === null || this.loopState.startTime === null)
            return;
        const currentTime = this.video.currentTime;
        if (currentTime >= this.loopState.endTime) {
            console.log(`🔄 Loop jump: ${currentTime.toFixed(2)} → ${this.loopState.startTime.toFixed(2)}`);
            this.video.currentTime = this.loopState.startTime;
            this.video.play().catch(() => { });
        }
    }
    clearLoop() {
        this.removeTimeUpdateListener();
        this.loopState = { isActive: false, startTime: null, endTime: null };
        this.updateUI();
        this.showToast('🗑 Cleared');
        console.log('🗑 Loop cleared');
    }
    // ==================== UI UPDATES ====================
    updateUI() {
        const display = document.getElementById('loop-display');
        if (!display)
            return;
        const startStr = this.loopState.startTime !== null ? this.formatTime(this.loopState.startTime) : '--:--';
        const endStr = this.loopState.endTime !== null ? this.formatTime(this.loopState.endTime) : '--:--';
        const status = this.loopState.isActive ? '🔴' : '⏸';
        display.textContent = `${status} A:${startStr} B:${endStr}`;
        const toggleBtn = document.getElementById('loop-toggle-btn');
        if (toggleBtn) {
            if (this.loopState.isActive) {
                toggleBtn.textContent = '⏹';
                toggleBtn.title = 'Stop Loop';
                toggleBtn.style.borderColor = '#FF6B6B';
                toggleBtn.style.color = '#FF6B6B';
                toggleBtn.style.background = 'rgba(255,107,107,0.2)';
            }
            else {
                toggleBtn.textContent = '▶';
                toggleBtn.title = 'Start Loop';
                toggleBtn.style.borderColor = '#FFD93D';
                toggleBtn.style.color = '#FFD93D';
                toggleBtn.style.background = 'rgba(255,217,61,0.1)';
            }
        }
        this.updateProgressHighlight();
    }
    updateProgressHighlight() {
        document.querySelectorAll('.loopmaster-progress-highlight').forEach(el => el.remove());
        if (!this.video || this.loopState.startTime === null || this.loopState.endTime === null)
            return;
        const progressBar = document.querySelector('.ytp-progress-bar');
        if (!progressBar)
            return;
        const duration = this.video.duration;
        if (!duration || duration === 0 || isNaN(duration))
            return;
        const startPercent = (this.loopState.startTime / duration) * 100;
        const endPercent = (this.loopState.endTime / duration) * 100;
        const widthPercent = endPercent - startPercent;
        if (widthPercent <= 0 || !isFinite(widthPercent))
            return;
        const highlight = document.createElement('div');
        highlight.className = 'loopmaster-progress-highlight';
        highlight.style.cssText = `
      position: absolute !important;
      left: ${Math.max(0, startPercent)}% !important;
      width: ${Math.min(100, widthPercent)}% !important;
      height: 100% !important;
      background: ${this.loopState.isActive ? 'rgba(255,107,107,0.5)' : 'rgba(255,217,61,0.35)'} !important;
      pointer-events: none !important;
      z-index: 10 !important;
      border-radius: 2px !important;
      box-shadow: ${this.loopState.isActive ? '0 0 20px rgba(255,107,107,0.3)' : 'none'} !important;
      transition: background 0.3s ease !important;
    `;
        progressBar.style.position = 'relative';
        progressBar.appendChild(highlight);
    }
    // ==================== HELPERS ====================
    formatTime(seconds) {
        if (seconds === null || isNaN(seconds))
            return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    showToast(message) {
        const existing = document.querySelector('.loopmaster-toast');
        if (existing)
            existing.remove();
        const toast = document.createElement('div');
        toast.className = 'loopmaster-toast';
        toast.style.cssText = `
      position: fixed !important;
      bottom: ${this.isMobile ? '130px' : '160px'} !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: rgba(0,0,0,0.92) !important;
      color: white !important;
      padding: ${this.isMobile ? '8px 16px' : '12px 24px'} !important;
      border-radius: 12px !important;
      font-family: 'Segoe UI', Roboto, Arial, sans-serif !important;
      font-size: ${this.isMobile ? '13px' : '15px'} !important;
      z-index: 999999 !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      pointer-events: none !important;
      white-space: nowrap !important;
      max-width: 90vw !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      backdrop-filter: blur(10px) !important;
    `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }
}
// Initialize
console.log('🚀 Starting LoopMaster...');
loopMasterInstance = new YouTubeLooper();
window.loopMaster = loopMasterInstance;

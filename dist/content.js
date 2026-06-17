"use strict";
// src/content.ts - WORKING VERSION
console.log('🔴 LoopMaster FULL VERSION LOADED!');
class YouTubeLooper {
    constructor() {
        this.video = null;
        this.loopState = {
            isActive: false,
            startTime: null,
            endTime: null
        };
        this.container = null;
        console.log('🎬 LoopMaster initializing...');
        this.init();
    }
    init() {
        // Wait for video to exist
        this.waitForVideo().then(() => {
            console.log('✅ Video found!');
            this.createUI();
            this.setupKeyboardShortcuts();
        });
    }
    waitForVideo() {
        return new Promise((resolve) => {
            const checkVideo = () => {
                const video = document.querySelector('video');
                if (video) {
                    this.video = video;
                    resolve();
                }
                else {
                    setTimeout(checkVideo, 500);
                }
            };
            checkVideo();
        });
    }
    createUI() {
        // Remove if exists
        const oldContainer = document.getElementById('loopmaster-container');
        if (oldContainer)
            oldContainer.remove();
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'loopmaster-container';
        this.container.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      z-index: 999999;
      background: rgba(0, 0, 0, 0.9);
      border-radius: 12px;
      padding: 12px 16px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.8);
      border: 2px solid #FF6B6B;
      user-select: none;
    `;
        // A button
        const btnA = this.createButton('A', '#FF6B6B', () => this.setStart());
        this.container.appendChild(btnA);
        // B button
        const btnB = this.createButton('B', '#4ECDC4', () => this.setEnd());
        this.container.appendChild(btnB);
        // Loop toggle button
        const btnLoop = this.createButton('▶', '#FFD93D', () => this.toggleLoop());
        btnLoop.id = 'loop-toggle-btn';
        this.container.appendChild(btnLoop);
        // Clear button
        const btnClear = this.createButton('✕', '#FF6B6B', () => this.clearLoop());
        this.container.appendChild(btnClear);
        // Display
        const display = document.createElement('div');
        display.id = 'loop-display';
        display.style.cssText = `
      font-size: 12px;
      color: #aaa;
      padding: 4px 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
      min-width: 120px;
      text-align: center;
      font-family: monospace;
    `;
        display.textContent = '⏸ A:--:-- B:--:--';
        this.container.appendChild(display);
        document.body.appendChild(this.container);
        console.log('✅ UI created!');
        // Update display
        this.updateUI();
    }
    createButton(text, color, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
      background: transparent;
      border: 2px solid ${color};
      color: white;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      min-width: 36px;
      height: 36px;
      transition: all 0.2s;
    `;
        btn.onmouseenter = () => { btn.style.background = color + '33'; };
        btn.onmouseleave = () => { btn.style.background = 'transparent'; };
        btn.onclick = onClick;
        return btn;
    }
    setStart() {
        if (!this.video)
            return;
        this.loopState.startTime = Math.round(this.video.currentTime * 100) / 100;
        this.updateUI();
        this.showToast(`🔴 Start: ${this.formatTime(this.loopState.startTime)}`);
        console.log('Start set to:', this.loopState.startTime);
    }
    setEnd() {
        if (!this.video)
            return;
        this.loopState.endTime = Math.round(this.video.currentTime * 100) / 100;
        this.updateUI();
        this.showToast(`🔵 End: ${this.formatTime(this.loopState.endTime)}`);
        console.log('End set to:', this.loopState.endTime);
    }
    toggleLoop() {
        if (this.loopState.startTime === null || this.loopState.endTime === null) {
            this.showToast('⚠️ Set A and B first!');
            return;
        }
        this.loopState.isActive = !this.loopState.isActive;
        if (this.loopState.isActive) {
            if (this.video) {
                this.video.currentTime = this.loopState.startTime;
                this.video.play().catch(() => { });
                // Add timeupdate listener
                this.video.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
            }
            this.showToast(`🔄 Loop ON (${this.formatTime(this.loopState.startTime)} → ${this.formatTime(this.loopState.endTime)})`);
        }
        else {
            if (this.video) {
                this.video.removeEventListener('timeupdate', this.handleTimeUpdate.bind(this));
            }
            this.showToast('⏹ Loop OFF');
        }
        this.updateUI();
        console.log('Loop active:', this.loopState.isActive);
    }
    handleTimeUpdate() {
        if (!this.video || !this.loopState.isActive)
            return;
        if (this.loopState.endTime === null || this.loopState.startTime === null)
            return;
        if (this.video.currentTime >= this.loopState.endTime) {
            this.video.currentTime = this.loopState.startTime;
            this.video.play().catch(() => { });
        }
    }
    clearLoop() {
        if (this.video) {
            this.video.removeEventListener('timeupdate', this.handleTimeUpdate.bind(this));
        }
        this.loopState = {
            isActive: false,
            startTime: null,
            endTime: null
        };
        this.updateUI();
        this.showToast('🗑 Cleared');
        console.log('Loop cleared');
    }
    updateUI() {
        const display = document.getElementById('loop-display');
        if (!display)
            return;
        const startStr = this.loopState.startTime !== null ? this.formatTime(this.loopState.startTime) : '--:--';
        const endStr = this.loopState.endTime !== null ? this.formatTime(this.loopState.endTime) : '--:--';
        const status = this.loopState.isActive ? '🔴' : '⏸';
        display.textContent = `${status} A:${startStr} B:${endStr}`;
        // Update toggle button
        const toggleBtn = document.getElementById('loop-toggle-btn');
        if (toggleBtn) {
            if (this.loopState.isActive) {
                toggleBtn.textContent = '⏹';
                toggleBtn.style.borderColor = '#FF6B6B';
                toggleBtn.style.background = 'rgba(255,107,107,0.2)';
            }
            else {
                toggleBtn.textContent = '▶';
                toggleBtn.style.borderColor = '#FFD93D';
                toggleBtn.style.background = 'rgba(255,217,61,0.2)';
            }
        }
        // Update progress bar highlight
        this.updateProgressHighlight();
    }
    updateProgressHighlight() {
        // Remove old highlights
        document.querySelectorAll('.loopmaster-progress-highlight').forEach(el => el.remove());
        if (!this.video || this.loopState.startTime === null || this.loopState.endTime === null)
            return;
        const progressBar = document.querySelector('.ytp-progress-bar');
        if (!progressBar)
            return;
        const duration = this.video.duration;
        if (duration === 0)
            return;
        const startPercent = (this.loopState.startTime / duration) * 100;
        const endPercent = (this.loopState.endTime / duration) * 100;
        const widthPercent = endPercent - startPercent;
        if (widthPercent <= 0)
            return;
        const highlight = document.createElement('div');
        highlight.className = 'loopmaster-progress-highlight';
        highlight.style.cssText = `
      position: absolute;
      left: ${startPercent}%;
      width: ${widthPercent}%;
      height: 100%;
      background: ${this.loopState.isActive ? 'rgba(255,107,107,0.5)' : 'rgba(255,217,61,0.3)'};
      pointer-events: none;
      z-index: 10;
      border-radius: 2px;
    `;
        progressBar.style.position = 'relative';
        progressBar.appendChild(highlight);
    }
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.ctrlKey && e.shiftKey && e.key === '1') {
                e.preventDefault();
                this.setStart();
            }
            else if (e.ctrlKey && e.shiftKey && e.key === '2') {
                e.preventDefault();
                this.setEnd();
            }
            else if (e.ctrlKey && e.shiftKey && e.key === '3') {
                e.preventDefault();
                this.toggleLoop();
            }
            else if (e.ctrlKey && e.shiftKey && e.key === '4') {
                e.preventDefault();
                this.clearLoop();
            }
        });
        console.log('✅ Keyboard shortcuts ready! (Ctrl+Shift+1,2,3,4)');
    }
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
      position: fixed;
      bottom: 140px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      pointer-events: none;
      white-space: nowrap;
      animation: fadeIn 0.3s ease;
    `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}
// Initialize
console.log('🚀 Starting LoopMaster...');
new YouTubeLooper();

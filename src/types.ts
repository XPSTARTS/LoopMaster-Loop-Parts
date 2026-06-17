// src/types.ts

export interface LoopState {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
}

export interface VideoInfo {
  title: string;
  videoId: string;
  duration: number;
  currentTime: number;
}

export interface LoopData {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  label?: string;
  createdAt: number;
}

export interface Message {
  type: 'setStart' | 'setEnd' | 'toggleLoop' | 'clearLoop' | 'getState' | 'saveLoop';
  payload?: any;
}

export interface StorageData {
  loops: LoopData[];
  settings: {
    autoLoop: boolean;
    showTimeDisplay: boolean;
  };
}
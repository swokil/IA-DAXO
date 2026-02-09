
export enum AppTab {
  CHAT = 'chat',
  IMAGE = 'image',
  VIDEO = 'video',
  LIVE = 'live'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  sources?: { title: string; uri: string }[];
  timestamp: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

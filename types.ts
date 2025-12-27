
export enum SearchIntent {
  INFORMATIONAL = 'Informational',
  NAVIGATIONAL = 'Navigational',
  TRANSACTIONAL = 'Transactional',
  COMMERCIAL = 'Commercial',
}

export interface KeywordMetric {
  keyword: string;
  volume: number;
  difficulty: number; // 0-100
  intent: SearchIntent;
  explanation: string;
}

export interface Attachment {
  data: string; // base64
  mimeType: string;
  name?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastKeywords?: KeywordMetric[];
  createdAt: number;
  draftInput?: string;
  draftAttachments?: Attachment[];
  isTyping?: boolean;
}

export type AppView = 'dashboard' | 'chat' | 'keywords';

export interface GroundingSource {
  title: string;
  uri: string;
}

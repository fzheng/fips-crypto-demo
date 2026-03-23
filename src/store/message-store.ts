import { create } from 'zustand';

export interface CryptoDetail {
  ciphertextSize: number;
  signatureSize: number;
  encryptTimeMs?: number;
  signTimeMs?: number;
  verifyTimeMs?: number;
  decryptTimeMs?: number;
}

export interface FileAttachment {
  name: string;
  type: string;      // MIME type
  size: number;      // original file size in bytes
  data: Uint8Array;  // decrypted file bytes
}

export interface ChatMessage {
  id: string;
  peerId: string;
  fromSelf: boolean;
  text: string;
  timestamp: number;
  signatureValid: boolean;
  crypto?: CryptoDetail;
  file?: FileAttachment;
}

const EMPTY_MESSAGES: ChatMessage[] = [];

interface MessageState {
  messages: Map<string, ChatMessage[]>;
  addMessage: (peerId: string, msg: ChatMessage) => void;
  getMessages: (peerId: string) => ChatMessage[];
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  messages: new Map(),

  addMessage: (peerId, msg) =>
    set((state) => {
      const next = new Map(state.messages);
      const existing = next.get(peerId) ?? [];
      next.set(peerId, [...existing, msg]);
      return { messages: next };
    }),

  getMessages: (peerId) => get().messages.get(peerId) ?? EMPTY_MESSAGES,
}));

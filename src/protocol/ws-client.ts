import type { ClientMessage, ServerMessage } from './messages';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';
export type MessageHandler = (msg: ServerMessage) => void;
export type StateHandler = (state: ConnectionState) => void;

/**
 * Reconnecting WebSocket client for the PQC relay server.
 * Sends/receives typed protocol messages as JSON.
 */
export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: MessageHandler;
  private onStateChange: StateHandler;
  private onConnected: (() => void) | null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private intentionallyClosed = false;

  constructor(
    url: string,
    onMessage: MessageHandler,
    onStateChange: StateHandler,
    onConnected?: () => void,
  ) {
    this.url = url;
    this.onMessage = onMessage;
    this.onStateChange = onStateChange;
    this.onConnected = onConnected ?? null;
  }

  connect() {
    this.intentionallyClosed = false;
    this.onStateChange('connecting');

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.onStateChange('connected');
      this.onConnected?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        this.onMessage(msg);
      } catch {
        console.error('Failed to parse server message:', event.data);
      }
    };

    this.ws.onclose = () => {
      this.onStateChange('disconnected');
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect() {
    this.intentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  private scheduleReconnect() {
    if (this.intentionallyClosed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }
}

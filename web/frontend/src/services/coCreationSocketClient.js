// Singleton WebSocket client for co-creation meetings.
// Pure JS (no React) so it can be reused across hooks / contexts.

class CoCreationSocketClient {
  constructor() {
    this.ws = null;
    this.config = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeoutId = null;
    this.heartbeatIntervalId = null;
    this.stopped = false;

    this.state = {
      messages: [],
      participants: {},
      heartRates: {},
      meetingPhase: 'lobby',
      sharedContext: {},
      isConnected: false,
    };

    this.subscribers = new Set();
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    // Immediately send current snapshot
    listener(this.getState());
    return () => {
      this.subscribers.delete(listener);
    };
  }

  _emit() {
    const snapshot = this.getState();
    this.subscribers.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (e) {
        console.error('CoCreationSocketClient subscriber error:', e);
      }
    });
  }

  init(config) {
    const { meetingId, userId } = config || {};
    if (!meetingId || !userId) return;

    const sameMeeting =
      this.config &&
      this.config.meetingId === meetingId &&
      this.config.userId === userId;

    this.config = { ...config };
    this.stopped = false;

    if (sameMeeting && this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Already connected/connecting for this meeting
      return;
    }

    // Different meeting or no connection yet
    this._teardownSocketOnly();
    this._connect();
  }

  _connect() {
    const { meetingId, userId } = this.config || {};
    if (!meetingId || !userId || this.stopped) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/cocreation/ws/${meetingId}/${userId}`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.state.isConnected = true;
      this._emit();

      this._sendJoin();
      this._startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      this._handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      this.state.isConnected = false;
      this._clearHeartbeat();
      this._emit();

      if (this.stopped) {
        return;
      }

      // 1000/1001: normal / going away; don't reconnect automatically
      if (event.code === 1000 || event.code === 1001) {
        return;
      }

      this._scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  _sendJoin() {
    const { role, avatarSeed, initialPhase = 'lobby' } = this.config || {};
    const phase = this.state.meetingPhase || initialPhase || 'lobby';
    const payload = {
      role,
      avatarSeed,
      phase,
      timestamp: new Date().toISOString(),
    };
    this._sendRaw({
      type: 'join_meeting',
      payload,
    });
  }

  _startHeartbeat() {
    this._clearHeartbeat();

    this.heartbeatIntervalId = window.setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      const phase = this.state.meetingPhase || this.config?.initialPhase || 'lobby';
      this._sendRaw({
        type: 'heartbeat',
        payload: {
          phase,
          timestamp: new Date().toISOString(),
        },
      });
    }, 15000);
  }

  _clearHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  _scheduleReconnect() {
    if (this.stopped) return;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    const timeout = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
    this.reconnectAttempts += 1;
    this.reconnectTimeoutId = window.setTimeout(() => {
      this._connect();
    }, timeout);
  }

  _handleMessage(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
      return;
    }

    if (message.type === 'participants_state') {
      const payload = message.payload || {};
      this.state.participants = payload.participants || {};
      if (payload.phase) {
        this.state.meetingPhase = payload.phase;
      }
      if (payload.sharedContext) {
        this.state.sharedContext = payload.sharedContext;
      }

      const newRates = {};
      Object.values(payload.participants || {}).forEach((p) => {
        if (p.heartRate) {
          newRates[p.userId] = p.heartRate;
        }
      });
      if (Object.keys(newRates).length > 0) {
        this.state.heartRates = { ...this.state.heartRates, ...newRates };
      }
    } else if (message.type === 'heart_rate_update') {
      const userId = message.payload?.userId;
      if (userId) {
        this.state.heartRates = {
          ...this.state.heartRates,
          [userId]: message.payload,
        };
      }
    } else if (message.type === 'phase_changed') {
      if (message.payload?.phase) {
        this.state.meetingPhase = message.payload.phase;
      }
      this.state.messages = [...this.state.messages, message];
    } else if (message.type === 'shared_context_updated') {
      if (message.payload?.sharedContext) {
        this.state.sharedContext = message.payload.sharedContext;
      }
      this.state.messages = [...this.state.messages, message];
    } else {
      this.state.messages = [...this.state.messages, message];
    }

    this._emit();
  }

  _sendRaw(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected, cannot send message:', obj);
      return;
    }
    try {
      const msg = JSON.stringify(obj);
      this.ws.send(msg);
    } catch (e) {
      console.warn('Failed to send message over WebSocket:', e);
    }
  }

  sendMessage(data) {
    this._sendRaw(data);
  }

  sendLeaveMeeting(reason) {
    this._sendRaw({
      type: 'leave_meeting',
      payload: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  sendUpdatePhase(phase) {
    this._sendRaw({
      type: 'update_phase',
      payload: {
        phase,
        timestamp: new Date().toISOString(),
      },
    });
  }

  sendUpdateSharedContext(updates) {
    if (!updates || typeof updates !== 'object') return;
    this._sendRaw({
      type: 'update_shared_context',
      payload: {
        sharedContext: updates,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Stop everything and close connection
  stop() {
    this.stopped = true;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this._clearHeartbeat();
    if (this.ws) {
      try {
        this.ws.close(1000, 'Client stopped');
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }
    this.state.isConnected = false;
    this._emit();
  }

  _teardownSocketOnly() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this._clearHeartbeat();
    if (this.ws) {
      try {
        this.ws.close(1000, 'Switching meeting');
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.isConnected = false;
    this.state.isConnected = false;
    this._emit();
  }
}

let singletonClient = null;

export function getCoCreationSocketClient() {
  if (!singletonClient) {
    singletonClient = new CoCreationSocketClient();
  }
  return singletonClient;
}

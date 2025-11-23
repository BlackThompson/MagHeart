import { useEffect, useState } from 'react';
import { getCoCreationSocketClient } from '../services/coCreationSocketClient';

/**
 * React hook wrapper around the module-level singleton WebSocket client.
 * The hook is now only responsible for subscribing to state updates,
 * not for managing the underlying WebSocket lifecycle.
 */
const useCoCreationSocket = ({ meetingId, userId, role, avatarSeed, initialPhase = 'lobby' }) => {
  const [state, setState] = useState({
    messages: [],
    participants: {},
    heartRates: {},
    meetingPhase: initialPhase,
    isConnected: false,
  });

  useEffect(() => {
    const client = getCoCreationSocketClient();
    client.init({ meetingId, userId, role, avatarSeed, initialPhase });

    const unsubscribe = client.subscribe((nextState) => {
      setState((prev) => ({
        ...prev,
        ...nextState,
      }));
    });

    return () => {
      unsubscribe();
      // 不在这里关闭 WebSocket，由上层控制（例如 MeetingSessionProvider 离开整个 meeting 时）
    };
  }, [meetingId, userId, role, avatarSeed, initialPhase]);

  const client = getCoCreationSocketClient();

  return {
    ...state,
    sendMessage: (data) => client.sendMessage(data),
    sendLeaveMeeting: (reason) => client.sendLeaveMeeting(reason),
    sendUpdatePhase: (phase) => client.sendUpdatePhase(phase),
    sendUpdateSharedContext: (updates) => client.sendUpdateSharedContext(updates),
  };
};

export default useCoCreationSocket;

import { useState, useEffect, useRef, useCallback } from 'react';

const useCoCreationSocket = (meetingId, userId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [heartRates, setHeartRates] = useState({});
  const [participants, setParticipants] = useState({});
  
  const websocket = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!meetingId || !userId) return;

    // Clean up existing connection if any
    if (websocket.current) {
      websocket.current.close();
    }

    const wsProtocol = window.location.protocol === 'https' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/cocreation/ws/${meetingId}/${userId}`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    websocket.current = new WebSocket(wsUrl);

    websocket.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset attempts on success
    };

    websocket.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'state_sync') {
          setParticipants(message.payload.participants || {});
          // Extract embedded heart rates
          const newRates = {};
          Object.values(message.payload.participants || {}).forEach(p => {
             if (p.heartRate) {
               newRates[p.userId] = p.heartRate;
             }
          });
          if (Object.keys(newRates).length > 0) {
              setHeartRates(prev => ({ ...prev, ...newRates }));
          }
        } else if (message.type === 'heartbeat-update') {
          setHeartRates(prevRates => ({
            ...prevRates,
            [message.payload.userId]: message.payload,
          }));
        } else {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    websocket.current.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      setIsConnected(false);
      
      // Attempt reconnect if not closed cleanly
      if (event.code !== 1000 && event.code !== 1001) {
        const timeout = Math.min(1000 * (2 ** reconnectAttempts.current), 10000); // Exponential backoff cap at 10s
        console.log(`Attempting to reconnect in ${timeout}ms...`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, timeout);
      }
    };

    websocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onerror will usually be followed by onclose
    };
  }, [meetingId, userId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (websocket.current) {
        websocket.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  const sendMessage = (data) => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      websocket.current.send(message);
    } else {
      console.warn('WebSocket is not connected, cannot send message:', data);
    }
  };

  return { messages, sendMessage, isConnected, heartRates, participants };
};

export default useCoCreationSocket;

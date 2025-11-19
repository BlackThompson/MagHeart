import { useState, useEffect, useRef } from 'react';

const useCoCreationSocket = (sessionId, userId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [heartRates, setHeartRates] = useState({}); // State for all users' heart rates
  const websocket = useRef(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const wsProtocol = window.location.protocol === 'https' ? 'wss' : 'ws';
    // Corrected URL to match the backend endpoint
    const wsUrl = `${wsProtocol}://${window.location.host}/cocreation/ws/${sessionId}/${userId}`;

    websocket.current = new WebSocket(wsUrl);

    websocket.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    websocket.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      if (message.type === 'heartbeat-update') {
        setHeartRates(prevRates => ({
          ...prevRates,
          [message.payload.userId]: message.payload,
        }));
      } else {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    websocket.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [sessionId, userId]);

  const sendMessage = (data) => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      websocket.current.send(message);
    } else {
      console.error('WebSocket is not connected.');
    }
  };

  return { messages, sendMessage, isConnected, heartRates };
};

export default useCoCreationSocket;

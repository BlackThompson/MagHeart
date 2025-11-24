import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';

export function useWebRTC(messages, sendMessage, userId, isInitiator) {
    const [stream, setStream] = useState(null);
    const peerRef = useRef(null);
    const processedIndices = useRef(new Set());

    useEffect(() => {
        console.log('Initializing Peer. Initiator:', isInitiator);
        const peer = new SimplePeer({
            initiator: isInitiator,
            trickle: false,
        });

        peer.on('signal', (data) => {
            sendMessage({
                type: 'webrtc_signal',
                payload: {
                    signal: data,
                    senderId: userId,
                },
            });
        });

        peer.on('stream', (currentStream) => {
            console.log('Received stream');
            setStream(currentStream);
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
        });

        peerRef.current = peer;

        return () => {
            peer.destroy();
        };
    }, [isInitiator, userId]); // Re-run if initiator changes (shouldn't happen)

    useEffect(() => {
        messages.forEach((msg, index) => {
            if (processedIndices.current.has(index)) return;

            if (msg.type === 'webrtc_signal') {
                processedIndices.current.add(index);

                const { payload } = msg;
                // Ignore own signals
                if (payload.senderId === userId) return;

                console.log('Received signal from', payload.senderId);
                peerRef.current?.signal(payload.signal);
            }
        });
    }, [messages, userId]);

    const addStream = (newStream) => {
        if (newStream) {
            setStream(newStream);
        }
        if (peerRef.current) {
            peerRef.current.addStream(newStream);
        }
    };

    return {
        stream,
        addStream,
    };
}

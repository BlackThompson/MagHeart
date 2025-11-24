import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Camera } from 'lucide-react';
import { useMeetingSession } from '../../context/MeetingSessionContext.jsx';
import { useWebRTC } from '../../hooks/useWebRTC';

const CAMERA_SIGNAL_TYPE = 'final_camera_signal';

const CameraView = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { role, name, messages, sendMessage } = useMeetingSession();
  const isCameraOwner = role === 'local' || role === 'host';
  const { stream, addStream } = useWebRTC(
    messages,
    sendMessage,
    name,
    isCameraOwner,
    CAMERA_SIGNAL_TYPE,
  );

  useEffect(() => {
    if (!isCameraOwner) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser.');
      return;
    }

    let localStream;
    let cancelled = false;
    const startCamera = async () => {
      setIsRequesting(true);
      setError(null);
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }
        addStream(localStream);
      } catch (err) {
        setError(err.message || 'Unable to access camera');
      } finally {
        if (!cancelled) {
          setIsRequesting(false);
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOwner, addStream]);

  useEffect(() => {
    if (!videoRef.current || !stream) {
      setIsActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }
    const videoEl = videoRef.current;
    videoEl.srcObject = stream;
    videoEl.muted = isCameraOwner;
    videoEl
      .play()
      .then(() => {
        setIsActive(true);
        setError(null);
      })
      .catch((err) => {
        console.warn('Unable to play camera preview', err);
        setError('Unable to start camera preview');
      });
  }, [stream, isCameraOwner]);

  const subtextMessage = (() => {
    if (error) return error;
    if (isCameraOwner) {
      return isRequesting ? 'Requesting access to camera...' : 'Allow camera access to start sharing.';
    }
    return 'Waiting for local camera feed...';
  })();

  return (
    <Wrapper>
      <Video ref={videoRef} autoPlay playsInline muted={isCameraOwner} $visible={isActive} />
      {!isActive && (
        <Placeholder>
          <Icon>
            <Camera size={48} />
          </Icon>
          <Text>Live Camera Feed</Text>
          <Subtext>{subtextMessage}</Subtext>
        </Placeholder>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px dashed #444;
  overflow: hidden;
`;

const Placeholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  background: #000;
`;

const Icon = styled.div`
  margin-bottom: 16px;
  color: var(--text-color-muted);
`;

const Text = styled.p`
  font-size: 1.5em;
  font-weight: 600;
  margin: 0;
`;

const Subtext = styled.p`
  font-size: 1em;
  color: #aaa;
  margin-top: 8px;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;
`;

export default CameraView;

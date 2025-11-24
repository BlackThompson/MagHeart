import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Camera } from 'lucide-react';

const CameraView = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsActive(true);
        }
      } catch (err) {
        setError(err.message || 'Unable to access camera');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <Wrapper>
      {isActive ? (
        <Video ref={videoRef} muted playsInline />
      ) : (
        <Placeholder>
          <Icon>
            <Camera size={48} />
          </Icon>
          <Text>Live Camera Feed</Text>
          {error ? <Subtext>{error}</Subtext> : <Subtext>Requesting access to camera...</Subtext>}
        </Placeholder>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px dashed #444;
`;

const Placeholder = styled.div`
  text-align: center;
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
`;

export default CameraView;

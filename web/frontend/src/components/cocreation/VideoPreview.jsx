import React from 'react';
import styled from 'styled-components';
import { Activity } from 'lucide-react';

export default function VideoPreview({ videoRef, hasStream, shouldBlur }) {
  return (
    <Shell>
      {hasStream ? (
        <video ref={videoRef} autoPlay playsInline muted controls={false} />
      ) : (
        <WaitingMessage>
          <Activity size={48} />
          <p>Waiting for remote user to share screen...</p>
        </WaitingMessage>
      )}
      {hasStream && shouldBlur && <BlurOverlay />}
    </Shell>
  );
}

const Shell = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #000;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.35);

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const WaitingMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.75);
  color: #f1f5f9;
  text-align: center;

  p {
    margin: 0;
    font-size: 1.1rem;
  }
`;

const BlurOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(18px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  color: #f8fafc;
  font-weight: 600;
`;

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { HeartPulse } from 'lucide-react';

/**
 * Compact card for showing one participant's heart rate in the Lobby.
 * Props:
 * - userId: string
 * - role: string
 * - bpm: number | string
 * - hasHeartbeat: boolean
 * - isOffline: boolean
 */
export default function HeartRateCard({ userId, role, bpm, hasHeartbeat, isOffline }) {
  return (
    <Card $active={hasHeartbeat} $offline={isOffline}>
      <div className="info">
        <span className="name">{userId}</span>
        <span className="role">{role}</span>
      </div>
      <div className="bpm">
        {hasHeartbeat && <PulsingHeart size={16} />}
        <span>{bpm}</span>
        <small>bpm</small>
      </div>
    </Card>
  );
}

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const Card = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.5)' : 'var(--background-color)'};
  border: 1px solid ${props => props.$active ? 'var(--primary-color)' : 'var(--border-color)'};
  opacity: ${props => props.$offline ? 0.5 : 1};
  
  .info {
    display: flex;
    flex-direction: column;
    
    .name {
      font-weight: 600;
      font-size: 0.9rem;
      color: ${props => props.$offline ? 'var(--text-color-muted)' : 'var(--text-color)'};
    }
    .role {
      font-size: 0.75rem;
      color: var(--text-color-muted);
      text-transform: capitalize;
    }
  }

  .bpm {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: ${props => props.$active ? 'var(--error-color)' : 'var(--text-color-muted)'};
    
    span {
      font-size: 1.2rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    
    small {
      font-size: 0.7rem;
      color: var(--text-color-muted);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
  }
`;

const PulsingHeart = styled(HeartPulse)`
  animation: ${pulseAnimation} 1s infinite;
`;


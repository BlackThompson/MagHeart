import React from 'react';
import styled from 'styled-components';
import HeartRateCard from './HeartRateCard.jsx';
import { X, HeartPulse } from 'lucide-react';

/**
 * Small floating drawer for showing current heart rates.
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - participants: record of participants (userId -> meta)
 * - heartRates: record of userId -> { bpm, ts, device }
 */
export default function HeartRateDrawer({ open, onClose, participants, heartRates }) {
  if (!open) return null;
  const list = Object.values(participants || {});

  return (
    <Drawer>
      <DrawerHeader>
        <span><HeartPulse size={16} /> Live Heart Rates</span>
        <CloseButton type="button" onClick={onClose} aria-label="Close heart rates">
          <X size={16} />
        </CloseButton>
      </DrawerHeader>
      <List>
        {list.length === 0 && <Empty>Waiting for participants...</Empty>}
        {list.map((p) => {
          const isOffline = p.status === 'offline';
          const heartbeat = !isOffline ? heartRates?.[p.userId] : null;
          const bpm = heartbeat?.bpm ?? '--';
          const hasHeartbeat = !!heartbeat;
          return (
            <HeartRateCard
              key={p.userId}
              userId={p.userId}
              role={p.role}
              bpm={bpm}
              hasHeartbeat={hasHeartbeat}
              isOffline={isOffline}
            />
          );
        })}
      </List>
    </Drawer>
  );
}

const Drawer = styled.div`
  position: fixed;
  right: 20px;
  top: 70px;
  width: 260px;
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1200;
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: var(--text-color-muted);
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: var(--text-color);
  }
`;

const List = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
`;

const Empty = styled.div`
  color: var(--text-color-muted);
  font-size: 0.9rem;
  font-style: italic;
`;


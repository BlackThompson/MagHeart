import React from 'react';
import styled from 'styled-components';
import { CheckCircle2 } from 'lucide-react';

export default function CompletionStatusBoard({
  remoteDone,
  localDone,
  bothComplete,
  isRemote,
  isLocalSide,
  onRemoteComplete,
  onLocalComplete,
}) {
  return (
    <>
      <Board>
        <StatusCard $done={remoteDone}>
          <StatusHeader>
            <StatusIcon $done={remoteDone}>
              <CheckCircle2 size={20} />
            </StatusIcon>
            <div>
              <StatusTitle>Remote Builder</StatusTitle>
              <StatusCaption>{remoteDone ? 'Ready to showcase' : 'Still building'}</StatusCaption>
            </div>
          </StatusHeader>
          {isRemote ? (
            <StatusButton type="button" disabled={remoteDone} onClick={onRemoteComplete}>
              {remoteDone ? 'Completed' : 'Mark Completed'}
            </StatusButton>
          ) : (
            <StatusNote>{remoteDone ? 'Remote side completed' : 'Waiting for remote confirmation'}</StatusNote>
          )}
        </StatusCard>

        <StatusCard $done={localDone}>
          <StatusHeader>
            <StatusIcon $done={localDone}>
              <CheckCircle2 size={20} />
            </StatusIcon>
            <div>
              <StatusTitle>Local Display</StatusTitle>
              <StatusCaption>{localDone ? 'Ready to reveal' : 'Awaiting host confirmation'}</StatusCaption>
            </div>
          </StatusHeader>
          {isLocalSide ? (
            <StatusButton type="button" disabled={localDone} onClick={onLocalComplete}>
              {localDone ? 'Completed' : 'Mark Completed'}
            </StatusButton>
          ) : (
            <StatusNote>{localDone ? 'Local side completed' : 'Waiting for host confirmation'}</StatusNote>
          )}
        </StatusCard>
      </Board>
      {!bothComplete && <CompletionHint>Both badges must turn green before advancing.</CompletionHint>}
    </>
  );
}

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

const StatusCard = styled.div`
  background: ${({ $done }) => ($done ? '#ecfdf5' : '#f8fafc')};
  border: 1px solid ${({ $done }) => ($done ? '#a7f3d0' : 'var(--border-color)')};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${({ $done }) => ($done ? '0 8px 20px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)')};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: ${({ $done }) => ($done ? 'pulse 1.4s ease forwards' : 'none')};

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.02);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const StatusHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const StatusIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $done }) => ($done ? '#34d399' : '#e2e8f0')};
  color: ${({ $done }) => ($done ? '#065f46' : '#475569')};
`;

const StatusTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
`;

const StatusCaption = styled.div`
  font-size: 0.8rem;
  color: #64748b;
`;

const StatusButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 600;
  background: ${({ disabled }) => (disabled ? '#cbd5f5' : 'var(--primary-color)')};
  color: ${({ disabled }) => (disabled ? '#475569' : '#fff')};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: transform 0.2s ease;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    background: var(--primary-hover);
  }
`;

const StatusNote = styled.div`
  font-size: 0.8rem;
  color: var(--text-color-muted);
`;

const CompletionHint = styled.div`
  font-size: 0.85rem;
  color: var(--text-color-muted);
`;

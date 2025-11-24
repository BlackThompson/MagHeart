import React from 'react';
import styled from 'styled-components';
import { Activity, Eye, EyeOff } from 'lucide-react';

export default function RemoteControlsPanel({
  onStartShare,
  onOpenLego,
  blurEnabled,
  onToggleBlur,
  previewRef,
}) {
  return (
    <Panel>
      <Hint>Share your screen and open the LEGO Minifigure Factory to start building together.</Hint>
      <ButtonRow>
        <ActionButton type="button" onClick={onStartShare} $variant="primary">
          <Activity size={16} />
          Start Sharing
        </ActionButton>
        <ActionButton type="button" onClick={onOpenLego}>
          Open LEGO Site
        </ActionButton>
      </ButtonRow>
      <ToggleButton type="button" onClick={onToggleBlur}>
        {blurEnabled ? (
          <>
            <Eye size={16} />
            Reveal Preview
          </>
        ) : (
          <>
            <EyeOff size={16} />
            Hide Preview
          </>
        )}
      </ToggleButton>
      <HiddenPreviewVideo ref={previewRef} muted playsInline />
    </Panel>
  );
}

const Panel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
`;

const Hint = styled.p`
  margin: 0;
  max-width: 480px;
  color: var(--text-color-muted);
  line-height: 1.5;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: ${({ $variant }) => ($variant === 'primary' ? 'var(--primary-color)' : 'var(--surface-color)')};
  color: ${({ $variant }) => ($variant === 'primary' ? '#ffffff' : 'var(--primary-color)')};
  border: ${({ $variant }) => ($variant === 'primary' ? 'none' : '1px solid var(--primary-color)')};
  padding: 12px 22px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease, background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-hover);
    color: #fff;
    transform: translateY(-2px);
  }
`;

const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px dashed var(--primary-color);
  background: transparent;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(99, 102, 241, 0.08);
  }
`;

const HiddenPreviewVideo = styled.video`
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
`;

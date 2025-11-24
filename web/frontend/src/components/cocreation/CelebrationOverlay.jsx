import React from 'react';
import styled from 'styled-components';
import { Sparkles } from 'lucide-react';

export default function CelebrationOverlay({ visible }) {
  if (!visible) {
    return null;
  }
  return (
    <Overlay>
      <Sparkles size={48} />
      <p>Both sides are ready! Let’s showcase.</p>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.65);
  color: #fff;
  gap: 12px;
  z-index: 200;
  text-align: center;
  pointer-events: none;

  p {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
`;

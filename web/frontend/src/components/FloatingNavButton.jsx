import React from 'react';
import styled from 'styled-components';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const Button = styled.button`
  position: ${({ $position }) => $position || 'fixed'};
  bottom: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  z-index: 40;

  &.next {
    right: 24px;
    background-color: #2563eb; /* Blue */
    &:hover {
      background-color: #1d4ed8; /* Darker Blue */
      transform: translateY(-2px);
    }
  }

  &.prev {
    left: 24px;
    background-color: #64748b; /* Slate */
    &:hover {
      background-color: #475569; /* Darker Slate */
      transform: translateY(-2px);
    }
  }
`;

export default function FloatingNavButton({ onClick, direction, 'aria-label': ariaLabel, title, position }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={direction}
      $position={position}
    >
      {direction === 'next' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
    </Button>
  );
}

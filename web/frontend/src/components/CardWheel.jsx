import React from 'react';
import styled from 'styled-components';
import PlayingCard from './PlayingCard.jsx';

/**
 * CardWheel
 *
 * Replicating the fan layout from example.html.
 */
export default function CardWheel({ cards, onSelect, disabled, selectedCardId, hoveredCardId, onHover }) {
  if (!cards || cards.length === 0) {
    return <EmptyHint>No cards available.</EmptyHint>;
  }

  const count = cards.length;

  return (
    <WheelContainer>
      <WheelFan>
        {cards.map((card, index) => {
          const isSelected = selectedCardId === card.id;
          const isRemoteHovered = hoveredCardId === card.id;

          // Fan calculations
          // Rotation: spread 3 degrees per card
          const rotation = (index - (count - 1) / 2) * 3;
          // Y Offset: abs value from center to create arch
          const yOffset = Math.abs(index - (count - 1) / 2) * 5;

          const isFaceUp = card.isFaceUp !== undefined ? card.isFaceUp : true;

          return (
            <CardSlot
              key={card.id}
              type="button"
              $rotation={rotation}
              $yOffset={yOffset}
              $isSelected={isSelected}
              $isRemoteHovered={isRemoteHovered}
              $index={index}
              disabled={disabled}
              onClick={() => !disabled && onSelect && onSelect(card)}
              onMouseEnter={() => !disabled && onHover && onHover(card.id)}
              onMouseLeave={() => !disabled && onHover && onHover(null)}
            >
              <PlayingCard
                {...card} // Pass extended props like icon, colorTheme
                size="medium"
                isFaceUp={isFaceUp}
                isSelected={isSelected}
                disabled={disabled}
              />
            </CardSlot>
          );
        })}
      </WheelFan>
    </WheelContainer>
  );
}

const WheelContainer = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-x: hidden;
  overflow-y: visible;
  padding: 40px 0;
  perspective: 1000px;
  position: relative;
  z-index: 10;
  
  @media (max-height: 900px) {
    height: 380px;
    padding: 30px 0;
  }
  
  @media (max-height: 800px) {
    height: 340px;
    padding: 20px 0;
  }
  
  @media (max-height: 700px) {
    height: 300px;
    padding: 15px 0;
  }
  
  @media (min-height: 1000px) {
    height: 450px;
    padding: 50px 0;
  }
`;

const WheelFan = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  /* Negative margin to overlap cards */
  width: 100%;
  max-width: 1000px;
  pointer-events: none; 
`;

const CardSlot = styled.button`
  position: relative;
  background: none;
  border: none;
  padding: 0;
  margin: 0 -24px; /* -space-x-12 equivalent approx */
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  pointer-events: auto;
  transition: all 0.5s ease-out;
  
  /* Default State */
  transform: ${({ $rotation, $yOffset }) =>
    `rotate(${$rotation}deg) translateY(${$yOffset}px)`};
  z-index: ${({ $index }) => $index};

  /* Hover State (if not selected) */
  &:hover {
    ${({ disabled, $isSelected }) =>
    !disabled && !$isSelected &&
    `
      z-index: 40 !important;
      transform: translateY(-40px) rotate(0deg);
      margin: 0 16px; /* space-x-4 equivalent */
    `}
  }

  /* Remote Hover State */
  ${({ $isRemoteHovered, disabled, $isSelected }) =>
    $isRemoteHovered && !disabled && !$isSelected && `
      z-index: 40 !important;
      transform: translateY(-40px) rotate(0deg);
      margin: 0 16px;
      filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6)); /* Add glow for remote visibility */
  `}

  /* Selected State */
  ${({ $isSelected }) => $isSelected && `
    z-index: 50 !important;
    transform: translateY(-60px) rotate(0deg) scale(1.1);
  `}
  
  &:focus {
    outline: none;
  }
`;

const EmptyHint = styled.div`
  font-size: 0.9rem;
  color: var(--text-color-muted);
  font-style: italic;
  padding: 20px;
  text-align: center;
`;

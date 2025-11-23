import React from 'react';
import styled from 'styled-components';
import { Check } from 'lucide-react';

/**
 * ContextStageView
 *
 * Renders a single stage of the shared-context card system.
 *
 * Props:
 * - stage: {
 *     id: string;
 *     title: string;
 *     description?: string;
 *     cards: { id: string; label: string; value?: string }[];
 *     multiSelect?: boolean;
 *   }
 * - selection: string | string[] | null
 * - isHost: boolean (only host can change selection)
 * - onSelect: (stageId: string, nextSelection: string | string[]) => void
 */
export default function ContextStageView({ stage, selection, isHost, onSelect }) {
  if (!stage) return null;

  const { id, title, description, cards, multiSelect } = stage;

  const isSelected = (cardLabel) => {
    if (multiSelect) {
      return Array.isArray(selection) && selection.includes(cardLabel);
    }
    return selection === cardLabel;
  };

  const handleCardClick = (cardLabel) => {
    if (!isHost || !onSelect) return;

    if (multiSelect) {
      const current = Array.isArray(selection) ? selection : [];
      const exists = current.includes(cardLabel);
      const next = exists ? current.filter((v) => v !== cardLabel) : [...current, cardLabel];
      onSelect(id, next);
    } else {
      onSelect(id, cardLabel);
    }
  };

  return (
    <StageSection>
      <StageHeader>
        <StageTitle>{title}</StageTitle>
        {description && <StageDescription>{description}</StageDescription>}
      </StageHeader>

      <CardsGrid>
        {cards.map((card) => {
          const selected = isSelected(card.label);
          return (
            <CardButton
              key={card.id}
              type="button"
              $selected={selected}
              onClick={() => handleCardClick(card.label)}
              disabled={!isHost}
            >
              <CardContent>
                <CardLabel>{card.label}</CardLabel>
                {card.subtext && <CardSubtext>{card.subtext}</CardSubtext>}
              </CardContent>
              {selected && (
                <CheckIcon>
                  <Check size={16} />
                </CheckIcon>
              )}
            </CardButton>
          );
        })}
      </CardsGrid>

      {!isHost && (
        <RoleHint>The Host is guiding the flow. You will see the selections sync automatically.</RoleHint>
      )}
    </StageSection>
  );
}

const StageSection = styled.section`
  background-color: var(--surface-color);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: all 0.3s ease;
`;

const StageHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  margin-bottom: 12px;
`;

const StageTitle = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.02em;
`;

const StageDescription = styled.p`
  margin: 0;
  font-size: 1rem;
  color: var(--text-color-muted);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const CardButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 20px;
  border-radius: 20px;
  border: 2px solid ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--border-color)')};
  background-color: ${({ $selected }) => ($selected ? 'rgba(99, 102, 241, 0.03)' : 'var(--background-color)')};
  color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--text-color)')};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 120px;
  box-shadow: ${({ $selected }) => ($selected ? '0 10px 25px -5px rgba(99, 102, 241, 0.15)' : 'var(--shadow-sm)')};

  &:hover {
    ${({ disabled }) =>
      !disabled &&
      `
      transform: translateY(-4px);
      box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);
    `}
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

const CardLabel = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
`;

const CardSubtext = styled.span`
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-color-muted);
  opacity: 0.9;
  line-height: 1.4;
`;

const CheckIcon = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--primary-color);
`;

const RoleHint = styled.div`
  font-size: 0.85rem;
  color: var(--text-color-muted);
  font-style: italic;
`;



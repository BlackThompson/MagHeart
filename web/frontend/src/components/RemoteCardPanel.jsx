import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import deck from '../data/cardDeck.json';
import PlayingCard from './PlayingCard.jsx';

/**
 * RemoteCardPanel
 *
 * Right side of the Card Stage.
 * Remote user draws a card. Everyone sees the draw and face-down card.
 * Only remote side sees the full face and can type an answer during this stage.
 */
export default function RemoteCardPanel({ role, sharedContext, onUpdateCardStage }) {
  const isRemote = role === 'remote';

  const allCards = deck.cards || [];
  const remoteCards = useMemo(
    () => allCards.filter((c) => c.target === 'remote' || c.target === 'both'),
    [allCards],
  );

  const cardStage = sharedContext?.cardStage || {
    status: 'in_progress',
    phase: 'local',
    local: { played: [] },
    remote: { drawn: [] },
  };

  const [draftAnswer, setDraftAnswer] = useState('');

  const lastDrawn = (cardStage.remote?.drawn || []).slice(-1)[0];
  const lastCard = lastDrawn
    ? remoteCards.find((c) => c.id === lastDrawn.cardId) || null
    : null;

  const availableCards = useMemo(() => {
    const usedIds = new Set((cardStage.remote?.drawn || []).map((d) => d.cardId));
    return remoteCards.filter((c) => !usedIds.has(c.id));
  }, [remoteCards, cardStage.remote]);

  const handleDraw = () => {
    if (!isRemote || availableCards.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];
    const now = new Date().toISOString();

    const nextCardStage = {
      status: cardStage.status || 'in_progress',
      phase: cardStage.phase || 'local',
      local: cardStage.local || { played: [] },
      remote: {
        drawn: [
          ...(cardStage.remote?.drawn || []),
          {
            cardId: card.id,
            drawnBy: role,
            drawnAt: now,
            faceDown: true,
            answer: '',
          },
        ],
      },
    };

    onUpdateCardStage(nextCardStage);
    setDraftAnswer('');
  };

  const handleSaveAnswer = () => {
    if (!isRemote || !lastDrawn || !lastCard || !draftAnswer.trim()) return;

    const nextDrawn = (cardStage.remote?.drawn || []).map((d) =>
      d === lastDrawn
        ? {
            ...d,
            answer: draftAnswer.trim(),
          }
        : d,
    );

    const nextCardStage = {
      status: cardStage.status || 'in_progress',
      phase: cardStage.phase || 'local',
      local: cardStage.local || { played: [] },
      remote: {
        drawn: nextDrawn,
      },
    };

    onUpdateCardStage(nextCardStage);
    alert('Answer Saved');
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>Remote Side — Draw Hidden Card</Title>
        <Subtext>
          The remote user draws from the deck. The card remains hidden to others until revealed later. Only you can see it below and write an answer.
        </Subtext>
      </PanelHeader>

      <TopArea>
        {/* Deck Area */}
        <DeckArea>
          <SectionTitle>Deck ({availableCards.length})</SectionTitle>
          <DeckWrapper onClick={handleDraw} $disabled={!isRemote || availableCards.length === 0}>
             {/* Stacked cards visual */}
             {[...Array(Math.min(availableCards.length, 3))].map((_, i) => (
               <StackedCard key={i} $index={i}>
                 <PlayingCard size="medium" isFaceUp={false} disabled={true} />
               </StackedCard>
             ))}
             {availableCards.length === 0 && (
               <EmptyDeckSlot>Empty</EmptyDeckSlot>
             )}
          </DeckWrapper>
          {isRemote && availableCards.length > 0 && (
            <DeckHint>Click deck to draw</DeckHint>
          )}
        </DeckArea>

        {/* Drawn Cards Pile */}
        <DrawnArea>
           <SectionTitle>Drawn Pile</SectionTitle>
           <DrawnGrid>
             {(cardStage.remote?.drawn || []).map((d, i) => (
               <DrawnCardItem key={`${d.cardId}-${i}`}>
                 <PlayingCard
                   id={d.cardId}
                   size="small"
                   isFaceUp={false} // Always face down on the table/pile
                 />
               </DrawnCardItem>
             ))}
           </DrawnGrid>
        </DrawnArea>
      </TopArea>

      {/* Current Active Card (Only visible to remote) */}
      {isRemote && lastCard ? (
        <ActiveCardArea>
          <SectionTitle>Your Current Card (Visible Only to You)</SectionTitle>
          <DetailCard>
            <CardPreview>
              <PlayingCard
                 title={lastCard.title}
                 prompt={lastCard.prompt}
                 id={lastCard.id}
                 size="large"
                 isFaceUp={true} // Remote user sees it face up
              />
            </CardPreview>
            <InputArea>
              <DetailPrompt>{lastCard.prompt}</DetailPrompt>
              <StyledTextArea
                placeholder="Type your hidden answer here..."
                value={draftAnswer}
                onChange={(e) => setDraftAnswer(e.target.value)}
              />
              <ActionsRow>
                <InfoText>This will be revealed in the next stage.</InfoText>
                <ActionButton
                  onClick={handleSaveAnswer}
                  disabled={!draftAnswer.trim()}
                >
                  Save Answer
                </ActionButton>
              </ActionsRow>
            </InputArea>
          </DetailCard>
        </ActiveCardArea>
      ) : (
        !isRemote && (cardStage.remote?.drawn || []).length > 0 && (
          <WaitingMessage>
            Remote user is viewing the card and thinking...
          </WaitingMessage>
        )
      )}
    </PanelContainer>
  );
}

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    display: block;
    width: 4px;
    height: 1.2em;
    background-color: var(--secondary-color);
    border-radius: 2px;
  }
`;

const Subtext = styled.p`
  font-size: 0.9rem;
  color: var(--text-color-muted);
  margin: 0;
  line-height: 1.5;
`;

const SectionTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px 0;
`;

const TopArea = styled.div`
  display: flex;
  gap: 40px;
  min-height: 200px;
`;

const DeckArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const DeckWrapper = styled.div`
  position: relative;
  width: 160px; /* Matched medium card width */
  height: 224px;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  transition: transform 0.2s;

  &:hover {
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'scale(1.05)')};
  }
`;

const StackedCard = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transform: ${({ $index }) => `translate(${$index * 4}px, -${$index * 4}px)`};
  z-index: ${({ $index }) => $index};
  pointer-events: none;
`;

const EmptyDeckSlot = styled.div`
  width: 100%;
  height: 100%;
  border: 2px dashed var(--border-color);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-muted);
  font-size: 0.9rem;
`;

const DeckHint = styled.div`
  font-size: 0.8rem;
  color: var(--primary-color);
  font-weight: 600;
`;

const DrawnArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DrawnGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const DrawnCardItem = styled.div`
  /* Wrapper for drawn cards */
`;

const ActiveCardArea = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailCard = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 32px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: row;
  gap: 32px;
  align-items: flex-start;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: center;
  }
`;

const CardPreview = styled.div`
  flex-shrink: 0;
`;

const InputArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const DetailPrompt = styled.p`
  font-size: 1.1rem;
  color: var(--text-color);
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  background: var(--background-color);
  
  &:focus {
    outline: 2px solid var(--secondary-color);
    border-color: transparent;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoText = styled.span`
  font-size: 0.8rem;
  color: var(--text-color-muted);
`;

const ActionButton = styled.button`
  padding: 12px 32px;
  background-color: var(--surface-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: var(--background-color);
    border-color: var(--secondary-color);
  }
`;

const WaitingMessage = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: rgba(0,0,0,0.02);
  border-radius: 8px;
  text-align: center;
  color: var(--text-color-muted);
  font-style: italic;
  font-size: 0.9rem;
`;

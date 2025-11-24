import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import FloatingNavButton from './FloatingNavButton.jsx';
import CardWheel from './CardWheel.jsx';
import PlayingCard from './PlayingCard.jsx';
import deck from '../data/cardDeck.json';
import { createDefaultCardStage } from '../constants/cardStage.js';

/**
 * LocalCardPanel
 *
 * Redesigned Local Interaction:
 * 1. Wheel: Select local cards.
 * 2. Shared Context: Display selected/saved cards.
 * 3. Draw: Once ready, proceed to draw phase.
 */
export default function LocalCardPanel({ role, meetingState, onUpdateCardStage, onProceedToDraw, sendEvent, messages }) {
  const isLocalSide = role === 'host' || role === 'local';

  const allCards = deck.cards || [];
  const localCardsFull = useMemo(
    () => allCards.filter((c) => c.target === 'local' || c.target === 'both'),
    [allCards],
  );

  // Derive state from meetingState
  const cardStage = meetingState?.cardStage || createDefaultCardStage();
  const [phaseOverride, setPhaseOverride] = useState(cardStage.subPhase || 'select');
  const currentPhase = phaseOverride || 'select';

  // Local UI State
  const [selectedCard, setSelectedCard] = useState(null); // Host-selected card (for highlight)
  const [answer, setAnswer] = useState(''); // Remote answer for select phase
  const [drawAnswer, setDrawAnswer] = useState(''); // Remote answer for draw phase

  // Remote Interaction State
  const [remoteHoveredCardId, setRemoteHoveredCardId] = useState(null);
  const [remoteSelectedCard, setRemoteSelectedCard] = useState(null);

  // Listen for interaction events
  useEffect(() => {
    if (!messages) return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    if (lastMsg.type === 'card_hover') {
      setRemoteHoveredCardId(lastMsg.payload.cardId);
    } else if (lastMsg.type === 'card_select_start') {
      setRemoteSelectedCard(lastMsg.payload.card);
      setAnswer('');
    } else if (lastMsg.type === 'card_select_cancel') {
      setRemoteSelectedCard(null);
      setSelectedCard(null);
      setAnswer('');
    } else if (lastMsg.type === 'card_stage_phase_changed') {
      const nextPhase = lastMsg.payload?.subPhase;
      if (nextPhase) {
        setPhaseOverride(nextPhase);
      }
    }
  }, [messages]);

  useEffect(() => {
    setPhaseOverride(cardStage.subPhase || 'select');
  }, [cardStage.subPhase]);

  // Derived lists
  const playedCards = cardStage.local?.played || [];
  const playedIds = new Set(playedCards.map((p) => p.cardId));

  // Cards available in the wheel (not yet played)
  const wheelCards = useMemo(() => {
    return localCardsFull.filter((c) => !playedIds.has(c.id));
  }, [localCardsFull, playedIds]);

  // Remote Logic for Phase 2 (Draw)
  const remoteCards = useMemo(
    () => allCards.filter((c) => c.target === 'remote' || c.target === 'both'),
    [allCards],
  );
  const remoteState = cardStage.remote || {};
  const remoteDrawnCards = remoteState.drawn || [];
  const remoteDrawnIdSet = useMemo(
    () => new Set(remoteDrawnCards.map((d) => d.cardId)),
    [remoteDrawnCards],
  );
  const availableRemoteCards = useMemo(
    () => remoteCards.filter((c) => !remoteDrawnIdSet.has(c.id)),
    [remoteCards, remoteDrawnIdSet],
  );
  const activeRemoteDrawId = remoteState.activeDrawId || null;
  const activeRemoteDrawCard = activeRemoteDrawId
    ? remoteDrawnCards.find((d) => d.cardId === activeRemoteDrawId)
    : null;
  const shouldShowDrawModal = currentPhase === 'draw' && Boolean(activeRemoteDrawCard);

  const sharedEntries = [
    ...(playedCards || []).map((p) => ({
      side: 'local',
      cardId: p.cardId,
      title: p.title,
      prompt: p.prompt,
      answer: p.answer,
    })),
    ...(remoteDrawnCards || []).map((d) => ({
      side: 'remote',
      cardId: d.cardId,
      title: d.title || d.cardId,
      prompt: d.prompt,
      answer: d.answer,
    })),
  ];

  // Handlers
  const handleCardSelect = (card) => {
    // Host selects a card; remote will answer.
    if (!isLocalSide) return;
      setSelectedCard(card);
      setAnswer('');
      if (sendEvent) {
        sendEvent('card_select_start', { card });
      }
  };

  const handleCardHover = (cardId) => {
    if (isLocalSide && sendEvent) {
      sendEvent('card_hover', { cardId });
    }
  };

  const handleCloseModal = () => {
    // Remote closes the answer modal without saving.
    setSelectedCard(null);
    setRemoteSelectedCard(null);
    setAnswer('');
    if (sendEvent) {
      sendEvent('card_select_cancel', {});
    }
  };

  const handleSaveCard = () => {
    // Remote submits answer for the card chosen by host.
    if (isLocalSide) return;
    if (!remoteSelectedCard || !answer.trim()) return;

    const now = new Date().toISOString();
    const card = remoteSelectedCard;
    const nextCardStage = {
      ...cardStage,
      local: {
        played: [
          ...(cardStage.local?.played || []),
          {
            cardId: card.id,
            title: card.title,
            prompt: card.prompt,
            answer: answer.trim(),
            playedBy: role,
            playedAt: now,
          },
        ],
      },
    };

    onUpdateCardStage(nextCardStage);
    setAnswer('');
    setRemoteSelectedCard(null);
    if (sendEvent) {
      sendEvent('card_select_cancel', {});
    }
  };

  const handleDeleteCard = (cardId) => {
    if (!isLocalSide) return;
    const nextPlayed = (cardStage.local?.played || []).filter(p => p.cardId !== cardId);

    onUpdateCardStage({
      ...cardStage,
      local: { played: nextPlayed },
    });
  };

  const handleGoToDraw = () => {
    if (onProceedToDraw) {
      onProceedToDraw();
    }
    setPhaseOverride('draw');
    if (isLocalSide && sendEvent) {
      sendEvent('card_stage_phase_changed', { subPhase: 'draw' });
    }
  };

  const handleBackToSelect = () => {
    if (!isLocalSide) return;
    const nextCardStage = {
      ...cardStage,
      subPhase: 'select',
      remote: {
        ...(remoteState || {}),
        activeDrawId: null,
      },
    };
    onUpdateCardStage(nextCardStage);
    setPhaseOverride('select');
    if (sendEvent) {
      sendEvent('card_stage_phase_changed', { subPhase: 'select' });
    }
  };

  // Remote Draw Handler: select a specific card and broadcast it
  const handleRemoteDraw = (cardFromClick) => {
    if (!isLocalSide || !cardFromClick) return;
    if (remoteDrawnIdSet.has(cardFromClick.id)) return;

    const now = new Date().toISOString();
    const newEntry = {
      cardId: cardFromClick.id,
      title: cardFromClick.title,
      prompt: cardFromClick.prompt,
      drawnBy: role,
      drawnAt: now,
    };

    const nextCardStage = {
      ...cardStage,
      remote: {
        ...(remoteState || {}),
        drawn: [...remoteDrawnCards, newEntry],
        activeDrawId: cardFromClick.id,
      },
    };

    onUpdateCardStage(nextCardStage);
  };

  const handleDismissDrawPreview = () => {
    if (!isLocalSide || !activeRemoteDrawId) return;
    const nextCardStage = {
      ...cardStage,
      remote: {
        ...(remoteState || {}),
        activeDrawId: null,
      },
    };
    onUpdateCardStage(nextCardStage);
  };

  const handleSaveDrawAnswer = () => {
    // Remote confirms answer for the currently previewed drawn card.
    if (isLocalSide) return;
    if (!activeRemoteDrawCard || !drawAnswer.trim()) return;

    const now = new Date().toISOString();
    const nextDrawn = remoteDrawnCards.map((d) =>
      d.cardId === activeRemoteDrawCard.cardId
        ? {
            ...d,
            answer: drawAnswer.trim(),
            answeredBy: role,
            answeredAt: now,
          }
        : d,
    );

    const nextCardStage = {
      ...cardStage,
      remote: {
        ...(remoteState || {}),
        drawn: nextDrawn,
        activeDrawId: null,
      },
    };

    onUpdateCardStage(nextCardStage);
    setDrawAnswer('');
  };

  const handleCancelDrawAnswer = () => {
    // Remote closes draw preview without answering: put card back to deck.
    if (isLocalSide) return;
    if (!activeRemoteDrawCard) return;

    const nextDrawn = remoteDrawnCards.filter(
      (d) => d.cardId !== activeRemoteDrawCard.cardId,
    );

    const nextCardStage = {
      ...cardStage,
      remote: {
        ...(remoteState || {}),
        drawn: nextDrawn,
        activeDrawId: null,
      },
    };

    onUpdateCardStage(nextCardStage);
    setDrawAnswer('');
  };

  return (
    <Container>
      {/* Top Area: Shared Context Display */}
      <SharedContextArea>
        <SectionHeader>
          <SectionTitle>Shared Context</SectionTitle>
          <HeaderControls>
            {currentPhase === 'draw' && (
              <PhaseBadge>Draw Phase</PhaseBadge>
            )}
            {playedCards.length > 0 && currentPhase === 'select' && isLocalSide && (
              <FloatingNavButton onClick={handleGoToDraw} title="Proceed to Draw Phase" direction="next" position="static" />
            )}
            {currentPhase === 'draw' && isLocalSide && (
              <FloatingNavButton onClick={handleBackToSelect} title="Back to Select Phase" direction="prev" position="static" />
            )}
          </HeaderControls>
        </SectionHeader>

        <ContextGrid>
          {sharedEntries.length === 0 && (
            <EmptyPlaceholder>No cards added yet.</EmptyPlaceholder>
          )}
          {sharedEntries.map((item) => (
            <NoteItem key={`${item.side}-${item.cardId}`} $side={item.side}>
              <ContextSideTag $side={item.side}>
                {item.side === 'local' ? 'Local' : 'Remote'}
              </ContextSideTag>
              <ContextMain>
                <ContextTitle $side={item.side}>{item.title}</ContextTitle>
                {item.prompt && <ContextPrompt>{item.prompt}</ContextPrompt>}
                {item.answer && <ContextAnswer>{item.answer}</ContextAnswer>}
                {!item.answer && item.side === 'remote' && (
                  <ContextHint>Waiting for remote answer…</ContextHint>
                )}
              </ContextMain>
              {item.side === 'local' && isLocalSide && (
                <RowDeleteButton onClick={() => handleDeleteCard(item.cardId)}>×</RowDeleteButton>
              )}
            </NoteItem>
          ))}
        </ContextGrid>
      </SharedContextArea>

      {/* Bottom Area: Action Zone */}
      <ActionZone>
        {currentPhase === 'select' ? (
          <WheelSection>
            <CardWheel
              cards={wheelCards}
              selectedCardId={selectedCard?.id || remoteSelectedCard?.id}
              hoveredCardId={remoteHoveredCardId}
              onSelect={handleCardSelect}
              onHover={handleCardHover}
              disabled={!isLocalSide}
            />
          </WheelSection>
        ) : (
          <DrawSection>
            {/* Use CardWheel for visual consistency; cards are face down in the wheel */}
            {availableRemoteCards.length > 0 ? (
              <>
                <DrawInstruction>
                  Select a face-down card to preview it in the center. Each preview locks the card for the remote pile.
                </DrawInstruction>
                <CardWheel
                  cards={availableRemoteCards.map((c) => ({ ...c, isFaceUp: false }))}
                  onSelect={handleRemoteDraw}
                  disabled={!isLocalSide}
                  selectedCardId={activeRemoteDrawCard?.cardId}
                />
              </>
            ) : (
              <EmptyDeckMessage>No more cards to draw.</EmptyDeckMessage>
            )}
          </DrawSection>
        )}
      </ActionZone>

      {/* Floating Modal - Select phase (answer input on remote side) */}
      {currentPhase === 'select' && remoteSelectedCard && !isLocalSide && (
        <ModalOverlay>
          <ModalCardContainer>
            {/* Render the card "floating" large */}
            <PlayingCard
              {...remoteSelectedCard}
              size="large"
              isFaceUp={true}
              isSelected={false}
            />

            {/* Answer Input Overlay */}
            <InputOverlay>
              <StyledTextArea
                placeholder="Write your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoFocus
              />
              <ButtonRow>
                <CancelButton onClick={handleCloseModal}>✕</CancelButton>
                {answer.trim() && (
                  <SaveButton onClick={handleSaveCard}>✓</SaveButton>
                )}
              </ButtonRow>
            </InputOverlay>
          </ModalCardContainer>
        </ModalOverlay>
      )}

      {/* Floating Modal - Draw phase (remote answers, host sees preview only) */}
      {shouldShowDrawModal && activeRemoteDrawCard && (
        <ModalOverlay>
          <ModalCardContainer>
            <PlayingCard
              title={activeRemoteDrawCard.title}
              prompt={activeRemoteDrawCard.prompt}
              id={activeRemoteDrawCard.cardId}
              size="large"
              isFaceUp={true}
              isSelected={false}
            />
            {isLocalSide ? (
              <PreviewMeta>
                <PreviewTitle>Remote is answering...</PreviewTitle>
              </PreviewMeta>
            ) : (
              <>
                <InputOverlay>
                  <StyledTextArea
                    placeholder="Write your answer..."
                    value={drawAnswer}
                    onChange={(e) => setDrawAnswer(e.target.value)}
                    autoFocus
                  />
                  <ButtonRow>
                    <CancelButton onClick={handleCancelDrawAnswer}>✕</CancelButton>
                    {drawAnswer.trim() && (
                      <SaveButton onClick={handleSaveDrawAnswer}>✓</SaveButton>
                    )}
                  </ButtonRow>
                </InputOverlay>
              </>
            )}
          </ModalCardContainer>
        </ModalOverlay>
      )}
      {/* Host sees that remote is answering the selected card */}
      {remoteSelectedCard && isLocalSide && (
        <ModalOverlay>
          <ModalCardContainer>
            <PlayingCard
              {...remoteSelectedCard}
              size="large"
              isFaceUp={true}
              isSelected={false}
            />
            <WaitingMessage>
              Remote is answering...
            </WaitingMessage>
          </ModalCardContainer>
        </ModalOverlay>
      )}
    </Container>
  );
}

const WaitingMessage = styled.div`
  background: white;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 600;
  color: var(--text-color-muted);
  box-shadow: var(--shadow-md);
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 0;
  position: relative;
  overflow: hidden;
`;

const SharedContextArea = styled.div`
  flex: 0 0 auto;
  /* min-height: 140px; */
  /* max-height removed to allow grid to grow naturally */
  background: transparent; /* Cleaner look for notes on top */
  /* border-radius: 20px; */
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* box-shadow: 0 2px 10px rgba(0,0,0,0.03); */
  /* border: 1px solid #e2e8f0; */
  margin-bottom: 0; /* Remove margin to let action zone take space */
  
  @media (max-height: 800px) {
    padding: 16px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(226, 232, 240, 0.6);
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    width: 3px;
    height: 14px;
    background: #f59e0b; /* Amber */
    border-radius: 2px;
  }
`;

const ContextGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 4px;
`;

const EmptyPlaceholder = styled.div`
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
  text-align: center;
  padding: 20px;
  opacity: 0.7;
  grid-column: 1 / -1;
`;

const NoteItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${({ $side }) => ($side === 'local' ? '#fffbeb' : '#f0fdfa')}; /* Light yellow vs light cyan/green */
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 2px;
  border-bottom-right-radius: 20px;
  padding: 16px;
  position: relative;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: default;
  min-height: 140px;
  
  &:hover {
    transform: translateY(-4px) rotate(1deg);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }
`;

const ContextSideTag = styled.span`
  flex: 0 0 auto;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
  color: ${({ $side }) => ($side === 'local' ? '#b45309' : '#047857')};
  background: ${({ $side }) => ($side === 'local' ? '#fef3c7' : '#d1fae5')};
`;

const ContextMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ContextTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ $side }) => ($side === 'local' ? '#92400e' : '#065f46')};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContextPrompt = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ContextAnswer = styled.div`
  font-size: 0.85rem;
  color: #111827;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ContextHint = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
`;

const RowDeleteButton = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  border: 2px solid white;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
  
  &:hover {
    transform: scale(1.1);
    background: #dc2626;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ActionZone = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* Push content to bottom */
  align-items: center;
  position: relative;
  min-height: 0;
  overflow: visible;
  padding-bottom: 100px; /* Space above the bottom navigation/FAB layer */
  
  @media (max-height: 800px) {
    padding-bottom: 60px;
  }
`;

const WheelSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const SubTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 20px;
  font-weight: 700;
  text-align: center;
`;

/* Draw Phase Styles */
const DrawSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const DrawInstruction = styled.p`
  font-size: 0.95rem;
  color: #475569;
  text-align: center;
  max-width: 420px;
  margin-bottom: 24px;
`;

const EmptyDeckMessage = styled.div`
  font-size: 1.2rem;
  color: var(--text-color-muted);
  font-style: italic;
  margin-top: 40px;
`;

/* Modal Styles */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(255,255,255,0.8); /* Light blur bg as per prompt implies floating */
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalCardContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: floatUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  @keyframes floatUp {
    from { transform: scale(0.5) translateY(100px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
  }
`;

const InputOverlay = styled.div`
  position: absolute;
  bottom: -80px; /* Below the card? Or ON the card? Prompt says "becomes answerable". */
  /* Let's put inputs below or overlaying the bottom. */
  /* Actually, to make it cleaner, let's put controls around the card. */
  width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.1);
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  resize: none;
  height: 80px;
  font-family: inherit;
  
  &:focus { outline: 2px solid var(--primary-color); }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
`;

const CancelButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 1px solid #ccc;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  
  &:hover { background: #f3f4f6; }
`;

const SaveButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #10b981;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  
  
  &:hover { transform: scale(1.1); }
`;

const PreviewMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  max-width: 320px;
`;

const PreviewTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
`;

const PreviewPrompt = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.4;
`;

const PhaseBadge = styled.div`
  background: var(--secondary-color);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import deck from '../data/cardDeck.json';
import PlayingCard from './PlayingCard.jsx';
import CardWheel from './CardWheel.jsx';
import { ArrowLeft } from 'lucide-react';

/**
 * LocalCardPanel
 *
 * Redesigned Local Interaction:
 * 1. Wheel: Select local cards.
 * 2. Shared Context: Display selected/saved cards.
 * 3. Draw: Once ready, proceed to draw phase.
 */
export default function LocalCardPanel({ role, sharedContext, onUpdateCardStage }) {
  const isLocalSide = role === 'host' || role === 'local';

  const allCards = deck.cards || [];
  const localCardsFull = useMemo(
    () => allCards.filter((c) => c.target === 'local' || c.target === 'both'),
    [allCards],
  );

  // Derive state from sharedContext
  const cardStage = sharedContext?.cardStage || {
    status: 'in_progress',
    local: { played: [] },
    remote: { drawn: [] },
  };

  // Local UI State
  const [selectedCard, setSelectedCard] = useState(null); // For select-phase answer modal
  const [answer, setAnswer] = useState('');
  const [localPhase, setLocalPhase] = useState('select'); // 'select' | 'draw'
  const [drawPreviewCard, setDrawPreviewCard] = useState(null); // For draw-phase enlarged card

  // Derived lists
  const playedCards = cardStage.local?.played || [];
  const playedIds = new Set(playedCards.map(p => p.cardId));
  
  // Cards available in the wheel (not yet played)
  const wheelCards = useMemo(() => {
    return localCardsFull.filter(c => !playedIds.has(c.id));
  }, [localCardsFull, playedIds]);

  // Remote Logic for Phase 2 (Draw)
  const remoteCards = useMemo(
    () => allCards.filter((c) => c.target === 'remote' || c.target === 'both'),
    [allCards],
  );
  const availableRemoteCards = remoteCards;

  // Handlers
  const handleCardSelect = (card) => {
    setSelectedCard(card);
    setAnswer('');
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
    setAnswer('');
  };

  const handleSaveCard = () => {
    if (!isLocalSide || !selectedCard || !answer.trim()) return;

    const now = new Date().toISOString();
    const nextCardStage = {
      ...cardStage,
      local: {
        played: [
          ...(cardStage.local?.played || []),
          {
            cardId: selectedCard.id,
            title: selectedCard.title,
            prompt: selectedCard.prompt,
            answer: answer.trim(),
            playedBy: role,
            playedAt: now,
          },
        ],
      },
    };

    onUpdateCardStage(nextCardStage);
    handleCloseModal();
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
    // Enter draw phase
    setLocalPhase('draw');
    setDrawPreviewCard(null);
  };

  const handleBackToSelect = () => {
    setLocalPhase('select');
    setDrawPreviewCard(null);
  };

  // Remote Draw Handler: click specific card, just preview it (do not commit draw yet)
  const handleRemoteDraw = (cardFromClick) => {
     if (!availableRemoteCards.length && !cardFromClick) return;

     // If user clicked a specific card in the wheel, use that one.
     // Fallback to random selection only if no card provided.
     const card = cardFromClick || (() => {
       const randomIndex = Math.floor(Math.random() * availableRemoteCards.length);
       return availableRemoteCards[randomIndex];
     })();

     setDrawPreviewCard(card);
  };

  return (
    <Container>
      {/* Top Area: Shared Context Display */}
      <SharedContextArea>
        <SectionHeader>
          <SectionTitle>Shared Context</SectionTitle>
          <HeaderControls>
             {localPhase === 'draw' && (
                <BackButton onClick={handleBackToSelect} title="Back to Selection">
                   <ArrowLeft size={18} />
                </BackButton>
             )}
             {playedCards.length > 0 && localPhase === 'select' && (
                <ArrowButton onClick={handleGoToDraw}>→</ArrowButton>
             )}
          </HeaderControls>
        </SectionHeader>
        
        <SharedList>
          {playedCards.length === 0 && (
             <EmptyPlaceholder>No cards added yet.</EmptyPlaceholder>
          )}
          {playedCards.map((p) => (
            <SharedItem key={p.cardId}>
              <ItemContent>
                <strong>{p.title}</strong>
                <span>{p.answer}</span>
              </ItemContent>
              {isLocalSide && (
                <DeleteButton onClick={() => handleDeleteCard(p.cardId)}>×</DeleteButton>
              )}
            </SharedItem>
          ))}
        </SharedList>
      </SharedContextArea>

      {/* Bottom Area: Action Zone */}
      <ActionZone>
        {localPhase === 'select' ? (
          <WheelSection>
             <CardWheel 
               cards={wheelCards} 
               selectedCardId={selectedCard?.id}
               onSelect={handleCardSelect} 
               disabled={!isLocalSide} 
             />
          </WheelSection>
        ) : (
          <DrawSection>
             {/* Use CardWheel for visual consistency; cards are face down in the wheel */}
             {availableRemoteCards.length > 0 ? (
               <CardWheel
                 cards={availableRemoteCards.map(c => ({ ...c, isFaceUp: false }))}
                 onSelect={handleRemoteDraw}
                 disabled={!isLocalSide}
               />
             ) : (
               <EmptyDeckMessage>No more cards to draw.</EmptyDeckMessage>
             )}
          </DrawSection>
        )}
      </ActionZone>

      {/* Floating Modal - Select phase (answer input) */}
      {localPhase === 'select' && selectedCard && (
        <ModalOverlay>
          <ModalCardContainer>
             {/* Render the card "floating" large */}
             <PlayingCard
                {...selectedCard}
                size="large"
                isFaceUp={true}
                isSelected={true} // Force selected style for modal
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

      {/* Floating Modal - Draw phase (enlarged drawn card, face-up after draw) */}
      {localPhase === 'draw' && drawPreviewCard && (
        <ModalOverlay>
          <ModalCardContainer>
            <PlayingCard
              title={drawPreviewCard.title}
              prompt={drawPreviewCard.prompt}
              size="large"
              isFaceUp={true}
              isSelected
            />
            <ButtonRow>
              <CancelButton onClick={() => setDrawPreviewCard(null)}>✕</CancelButton>
            </ButtonRow>
          </ModalCardContainer>
        </ModalOverlay>
      )}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 0;
  position: relative;
`;

const SharedContextArea = styled.div`
  flex: 0 0 auto;
  min-height: 140px;
  max-height: 200px;
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
  
  @media (max-height: 800px) {
    min-height: 100px;
    max-height: 150px;
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
    background: #8b5cf6;
    border-radius: 2px;
  }
`;

const ArrowButton = styled.button`
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 12px;
  width: 36px;
  height: 36px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
  
  &:hover {
    transform: translateY(-1px);
    background: #7c3aed;
    box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const BackButton = styled(ArrowButton)`
  background: #94a3b8;
  box-shadow: 0 2px 4px rgba(100, 116, 139, 0.2);
  
  &:hover {
    background: #64748b;
    box-shadow: 0 4px 8px rgba(100, 116, 139, 0.3);
  }
`;

const SharedList = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0;
  
  &::-webkit-scrollbar { 
    height: 8px; 
  }
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb { 
    background: #cbd5e1;
    border-radius: 4px;
    
    &:hover {
      background: #94a3b8;
    }
  }
`;

const EmptyPlaceholder = styled.div`
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
  text-align: center;
  padding: 20px;
  opacity: 0.7;
`;

const SharedItem = styled.div`
  min-width: 180px;
  max-width: 220px;
  background: white;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  cursor: default;
  
  &:hover {
    border-color: rgba(139, 92, 246, 0.3);
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
    transform: translateY(-2px);
    
    button { opacity: 1; }
  }
`;

const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  strong { 
    font-size: 0.8rem;
    font-weight: 700;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  span { 
    font-size: 0.9rem;
    line-height: 1.5;
    color: #475569;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
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
  justify-content: flex-end;
  position: relative;
  padding-bottom: 40px;
  
  @media (max-height: 800px) {
    justify-content: center;
    padding-bottom: 20px;
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

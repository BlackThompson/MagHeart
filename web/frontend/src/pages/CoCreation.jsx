import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LocalInterpretationPanel from '../components/cocreation/LocalInterpretationPanel';
import LegoSketchPad from '../components/cocreation/LegoSketchPad';
import { useMeetingSession } from '../context/MeetingSessionContext.jsx';
import NavBar from '../components/NavBar.jsx';
import {
  Wifi,
  WifiOff,
  ArrowRight,
  ChevronLeft,
  Sun,
  Layers,
  User,
  Feather,
  Activity,
} from 'lucide-react';

export default function CoCreationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sharedContext } = location.state || {};

  const {
    name,
    role,
    meetingId,
    messages,
    sendMessage,
    sendUpdatePhase,
    sharedContext: socketSharedContext,
    isConnected,
  } = useMeetingSession();

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }
  }, [name, role, navigate]);

  if (!name || !role) {
    return null; // Render nothing while redirecting
  }

  const isRemote = role === 'remote';
  const isHost = role === 'host';
  const isLocalSide = role === 'local' || role === 'host';

  const effectiveSharedContext = socketSharedContext || sharedContext || {};
  const cardStage = effectiveSharedContext.cardStage || {
    status: 'in_progress',
    local: { played: [] },
    remote: { drawn: [] },
  };

  const qaItems = [
    ...(cardStage.local?.played || []).map((p) => ({
      side: 'local',
      title: p.title,
      prompt: p.prompt,
      answer: p.answer,
    })),
    ...(cardStage.remote?.drawn || []).map((d) => ({
      side: 'remote',
      title: d.title || d.cardId,
      prompt: d.prompt,
      answer: d.answer,
    })),
  ];

  return (
    <PageWrapper>
      <NavBar
        title="Co-Creation Stage"
        subtitle="Use LEGO pieces and prompts from the shared context to build together."
        tagLabel={isRemote ? 'Remote View' : 'Local View'}
        userLabel={`${name} (${role})`}
      />

      <MainContent>
        {isRemote ? (
          <>
            <SideColumn>
              <PanelTitle>LEGO Parts Selection</PanelTitle>
              <LocalInterpretationPanel sendMessage={sendMessage} />
            </SideColumn>
            <MainColumn>
              <PanelTitle>Figure Preview (1)</PanelTitle>
              <CanvasContainer>
                <LegoSketchPad messages={messages} />
              </CanvasContainer>
            </MainColumn>
          </>
        ) : (
          <>
            <SideColumn>
              <PanelTitle>Card Q&A Summary</PanelTitle>
              <ContextCard>
                {qaItems.length === 0 ? (
                  <ContextRow>
                    <ContextValue>No cards have been played yet.</ContextValue>
                  </ContextRow>
                ) : (
                  qaItems.map((item, index) => (
                    <ContextRow key={`${item.side}-${index}`}>
                      <ContextLabel>
                        {item.side === 'local' ? <Sun size={16} /> : <Feather size={16} />}
                        {item.side === 'local' ? 'Local Side' : 'Remote Side'}
                      </ContextLabel>
                      <ContextValue>
                        <strong>{item.title}</strong>
                      </ContextValue>
                      {item.prompt && (
                        <ContextValue>
                          <em>{item.prompt}</em>
                        </ContextValue>
                      )}
                      {item.answer && <ContextValue>{item.answer}</ContextValue>}
                    </ContextRow>
                  ))
                )}
              </ContextCard>
            </SideColumn>
            <MainColumn>
              <PanelTitle>Remote LEGO Figure (blurred)</PanelTitle>
              <BlurredPreview>
                <LegoSketchPad messages={messages} />
                <BlurOverlay>
                  <span>Work in Progress</span>
                </BlurOverlay>
              </BlurredPreview>
            </MainColumn>
          </>
        )}
        {isHost && (
          <>
            <FloatingPrevButton type="button" onClick={() => navigate(-1)} aria-label="Previous">
              <ChevronLeft size={18} />
            </FloatingPrevButton>
            <FloatingNextButton
              type="button"
              onClick={() => {
                if (sendUpdatePhase) {
                  sendUpdatePhase('showcase');
                }
                navigate(`/showcase?meetingId=${encodeURIComponent(meetingId)}`, {
                  state: { name, role, sharedContext, meetingId },
                });
              }}
              aria-label="Next"
            >
              <ArrowRight size={18} />
            </FloatingNextButton>
          </>
        )}
      </MainContent>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color);
`;

const RoleBadge = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  background-color: var(--border-color);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--text-color-muted);
  font-weight: 600;
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: minmax(320px, 380px) minmax(0, 1fr);
  gap: 32px;
  padding: 32px 32px 40px;
  flex: 1;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  position: relative;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ContextCard = styled.div`
  background-color: var(--surface-color);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ContextRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ContextLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color-muted);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
`;

const ContextValue = styled.div`
  font-size: 1rem;
  color: var(--text-color);
  padding-left: 24px;
  font-weight: 500;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 24px;
`;

const Tag = styled.span`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid ${({ $muted }) => ($muted ? 'var(--border-color)' : 'transparent')};
  background-color: ${({ $muted }) => ($muted ? 'transparent' : 'rgba(99, 102, 241, 0.1)')};
  color: ${({ $muted }) => ($muted ? 'var(--text-color-muted)' : 'var(--primary-color)')};
`;

const CanvasContainer = styled.div`
  background-color: var(--surface-color);
  border-radius: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  flex: 1;
  min-height: 500px;
`;

const BlurredPreview = styled(CanvasContainer)`
  position: relative;
  
  > div:first-child {
    filter: blur(12px);
    opacity: 0.6;
    transition: all 0.5s ease;
  }
`;

const BlurOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  
  span {
    background: rgba(255,255,255,0.9);
    padding: 12px 24px;
    border-radius: 999px;
    font-weight: 600;
    color: var(--text-color);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(4px);
  }
`;

const FloatingPrevButton = styled.button`
  position: fixed;
  left: 24px;
  bottom: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background-color: var(--surface-color);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  z-index: 40;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const FloatingNextButton = styled.button`
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background-color: var(--primary-color);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  z-index: 40;

  &:hover {
    transform: translateY(-2px);
    background-color: var(--primary-hover);
  }
`;

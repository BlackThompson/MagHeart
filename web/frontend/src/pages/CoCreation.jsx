import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LocalInterpretationPanel from '../components/cocreation/LocalInterpretationPanel';
import LegoSketchPad from '../components/cocreation/LegoSketchPad';
import useCoCreationSocket from '../hooks/useCoCreationSocket';
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
  const { name, role, sharedContext, meetingId: stateMeetingId } = location.state || {};

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }
  }, [name, role, navigate]);

  const querySessionId = new URLSearchParams(location.search).get('sessionId');
  const sessionId = stateMeetingId || querySessionId || 'default-session';
  const { messages, sendMessage, isConnected } = useCoCreationSocket(sessionId, name);

  if (!name || !role) {
    return null; // Render nothing while redirecting
  }

  const isRemote = role === 'remote';
  const isLocal = role === 'local';

  const atmosphere = sharedContext?.atmosphere;
  const styleTrend = sharedContext?.styleTrend;
  const identity = sharedContext?.identity;
  const intents = sharedContext?.intents || [];
  const stateFlow = sharedContext?.stateFlow;

  return (
    <PageWrapper>
      <Header>
        <HeaderTitle>Co-Creation Stage</HeaderTitle>
        <UserInfo>
          {name} <RoleBadge>{role}</RoleBadge>
        </UserInfo>
        <ConnectionStatus $connected={isConnected}>
          {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
          {isConnected ? 'Connected' : 'Disconnected'}
        </ConnectionStatus>
      </Header>

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
              <PanelTitle>Shared Context</PanelTitle>
              <ContextCard>
                <ContextRow>
                  <ContextLabel>
                    <Sun size={16} /> Atmosphere
                  </ContextLabel>
                  <ContextValue>{atmosphere || 'Waiting for selection'}</ContextValue>
                </ContextRow>
                <ContextRow>
                  <ContextLabel>
                    <Layers size={16} /> Style Direction
                  </ContextLabel>
                  <ContextValue>{styleTrend || 'Waiting for selection'}</ContextValue>
                </ContextRow>
                <ContextRow>
                  <ContextLabel>
                    <User size={16} /> “Looks Like You”
                  </ContextLabel>
                  <ContextValue>{identity || 'Waiting for selection'}</ContextValue>
                </ContextRow>
                <ContextRow>
                  <ContextLabel>
                    <Feather size={16} /> Intent Clues
                  </ContextLabel>
                  <TagList>
                    {intents.length === 0 ? (
                      <Tag $muted>Waiting for selection</Tag>
                    ) : (
                      intents.map((intent) => <Tag key={intent}>{intent}</Tag>)
                    )}
                  </TagList>
                </ContextRow>
                <ContextRow>
                  <ContextLabel>
                    <Activity size={16} /> Participation State
                  </ContextLabel>
                  <ContextValue>{stateFlow || 'Waiting for selection'}</ContextValue>
                </ContextRow>
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
      </MainContent>
      {isLocal && (
        <FooterBar>
          <FooterSpacer />
          <SecondaryButton type="button" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} /> Previous
          </SecondaryButton>
          <ProgressInfo>Step 2 / 3</ProgressInfo>
          <PrimaryButton
            onClick={() =>
              navigate(`/showcase?sessionId=${encodeURIComponent(sessionId)}`, {
                state: { name, role, sharedContext, meetingId: sessionId },
              })
            }
          >
            Next <ArrowRight size={18} />
          </PrimaryButton>
        </FooterBar>
      )}
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color);
`;

const Header = styled.header`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 16px 32px;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  z-index: 10;
  height: 72px;
`;

const HeaderTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
`;

const ConnectionStatus = styled.div`
  position: absolute;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => (props.$connected ? 'var(--success-color)' : 'var(--error-color)')};
  background-color: ${props => (props.$connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')};
  padding: 6px 12px;
  border-radius: 999px;
`;

const UserInfo = styled.div`
  position: absolute;
  left: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-color);
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
  padding: 32px;
  flex: 1;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
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

const FooterBar = styled.footer`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 20px 40px;
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
  background: linear-gradient(to top, var(--background-color) 80%, transparent);
  pointer-events: none;
`;

const FooterSpacer = styled.div`
  flex: 1;
`;

const ProgressInfo = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color-muted);
  pointer-events: auto;
`;

const PrimaryButton = styled.button`
  min-width: 140px;
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--primary-color);
  cursor: pointer;
  pointer-events: auto;
  box-shadow: var(--shadow-lg);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.4);
  }
`;

const SecondaryButton = styled.button`
  padding: 12px 24px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background-color: var(--surface-color);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: var(--background-color);
    border-color: var(--text-color-muted);
    transform: translateY(-2px);
  }
`;

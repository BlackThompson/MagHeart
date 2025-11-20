import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { HeartPulse, Wifi, WifiOff, Play, LogOut, Copy, Check } from 'lucide-react';
import useCoCreationSocket from '../hooks/useCoCreationSocket';

export default function SessionLobbyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, role, meetingId: stateMeetingId, avatarSeed: stateAvatarSeed } = location.state || {};

  const querySessionId = new URLSearchParams(location.search).get('sessionId');
  const sessionId = stateMeetingId || querySessionId || 'default-session';

  const [copied, setCopied] = useState(false);

  const selfAvatarSeed =
    stateAvatarSeed ||
    window.localStorage.getItem('magheart_avatar_seed') ||
    name ||
    'anonymous';

  const { messages, sendMessage, isConnected, heartRates, participants: serverParticipants } = useCoCreationSocket(
    sessionId,
    name || '',
  );

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }
  }, [name, role, navigate]);

  // Send initial presence when connected
  useEffect(() => {
    if (!sendMessage || !name || !role || !isConnected) return;
    sendMessage({
      type: 'presence',
      payload: {
        role,
        phase: 'lobby',
        avatarSeed: selfAvatarSeed,
        timestamp: new Date().toISOString(),
      },
    });
  }, [sendMessage, name, role, selfAvatarSeed, isConnected]);

  const participantList = useMemo(() => {
    const list = Object.values(serverParticipants || {});
    // Ensure self is in the list even if server hasn't echoed back yet (optimistic UI)
    const selfExists = list.find(p => p.userId === name);
    
    let combined = [...list];
    if (!selfExists && name) {
        combined.push({
            userId: name,
            role,
            avatarSeed: selfAvatarSeed,
            isSelf: true,
            status: 'online'
        });
    }

    return combined.map(p => ({
        ...p,
        isSelf: p.userId === name
    })).sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
  }, [serverParticipants, name, role, selfAvatarSeed]);

  const handleCopySession = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!name || !role) {
    return null;
  }

  return (
    <PageWrapper>
      <Header>
        <Brand>MagHeart Lobby</Brand>
        <HeaderRight>
          <SessionTag onClick={handleCopySession}>
            <span className="label">Session:</span>
            <span className="id">{sessionId}</span>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </SessionTag>
          <ConnectionStatus $connected={isConnected}>
            {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
          </ConnectionStatus>
        </HeaderRight>
      </Header>

      <MainContent>
        <TopSection>
          <WelcomeText>
            <h1>Waiting Room</h1>
            <p>
              Gathering everyone before we start.
              <br />
              Check your heart rate connection below.
            </p>
          </WelcomeText>
        </TopSection>

        <LobbyContainer>
          <VisualArea>
            <AvatarCloud>
              {participantList.map((p, i) => {
                const seed = p.avatarSeed || p.userId || 'anonymous';
                const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(
                  seed,
                )}`;
                const offset = (i * 45) % 360;
                const isOffline = p.status === 'offline';
                
                return (
                  <FloatingAvatar 
                    key={p.userId} 
                    style={{ '--offset': `${offset}deg`, '--delay': `${i * 0.2}s` }}
                    $offline={isOffline}
                  >
                    <AvatarImg src={avatarUrl} alt={p.userId} $offline={isOffline} />
                    <NameTag>
                      {p.userId} {p.isSelf && '(You)'}
                    </NameTag>
                    <RoleTag $role={p.role}>{p.role || 'Unknown'}</RoleTag>
                    {isOffline && <OfflineTag>Offline</OfflineTag>}
                  </FloatingAvatar>
                );
              })}
              {participantList.length === 0 && (
                <EmptyState>Waiting for participants...</EmptyState>
              )}
            </AvatarCloud>
          </VisualArea>

          <StatsPanel>
            <PanelHeader>
              <HeartPulse size={20} />
              <span>Live Vitals</span>
            </PanelHeader>
            <VitalsList>
              {participantList.map((p) => {
                const isOffline = p.status === 'offline';
                const heartbeat = !isOffline ? heartRates[p.userId] : null;
                const bpm = heartbeat?.bpm ?? '--';
                const hasHeartbeat = !!heartbeat;

                return (
                  <VitalCard key={p.userId} $active={hasHeartbeat} $offline={isOffline}>
                    <div className="info">
                      <span className="name">{p.userId}</span>
                      <span className="role">{p.role}</span>
                    </div>
                    <div className="bpm">
                      {hasHeartbeat && <PulsingHeart size={16} />}
                      <span>{bpm}</span>
                      <small>bpm</small>
                    </div>
                  </VitalCard>
                );
              })}
            </VitalsList>
          </StatsPanel>
        </LobbyContainer>

        <ActionFooter>
          <LeaveButton onClick={() => navigate('/')}>
            <LogOut size={18} /> Leave
          </LeaveButton>
          
          {role === 'local' ? (
             <StartButton
               onClick={() =>
                 navigate(`/shared-context?sessionId=${encodeURIComponent(sessionId)}`, {
                   state: { name, role, meetingId: sessionId },
                 })
               }
             >
               Start Session <Play size={18} fill="currentColor" />
             </StartButton>
          ) : (
            <WaitingMessage>
              Waiting for host to start...
            </WaitingMessage>
          )}
        </ActionFooter>
      </MainContent>
    </PageWrapper>
  );
}

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-color);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
`;

const Brand = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-color);
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SessionTag = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--background-color);
  font-size: 0.85rem;
  color: var(--text-color-muted);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--surface-color);
    border-color: var(--text-color);
  }

  .id {
    font-family: monospace;
    font-weight: 600;
    color: var(--text-color);
  }
`;

const ConnectionStatus = styled.div`
  padding: 6px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.$connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${(props) => (props.$connected ? 'var(--success-color)' : 'var(--error-color)')};
  display: flex;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  gap: 24px;
`;

const TopSection = styled.div`
  text-align: center;
  margin-bottom: 16px;
`;

const WelcomeText = styled.div`
  h1 {
    margin: 0 0 8px;
    font-size: 2rem;
    color: var(--text-color);
  }
  p {
    margin: 0;
    color: var(--text-color-muted);
    line-height: 1.5;
  }
`;

const LobbyContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  flex: 1;
  min-height: 0; /* For scrolling within flex item */
`;

const VisualArea = styled.div`
  background-color: var(--surface-color); /* Using surface color instead of plain white/gray */
  border-radius: 24px;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Grid pattern background */
  background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
  background-size: 24px 24px;
`;

const AvatarCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: center;
  align-items: center;
  padding: 40px;
  max-width: 800px;
`;

const FloatingAvatar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: ${floatAnimation} 3s ease-in-out infinite;
  animation-delay: var(--delay, 0s);
  padding: 16px;
  background: var(--surface-color);
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  transition: transform 0.2s;
  opacity: ${props => props.$offline ? 0.6 : 1};
  filter: ${props => props.$offline ? 'grayscale(1)' : 'none'};

  &:hover {
    transform: scale(1.05);
    z-index: 10;
  }
`;

const AvatarImg = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: #f0f0f0;
`;

const NameTag = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
`;

const RoleTag = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  background: ${props => props.$role === 'local' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
  color: ${props => props.$role === 'local' ? 'var(--primary-color)' : 'var(--success-color)'};
`;

const OfflineTag = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--background-color);
  color: var(--text-color-muted);
  font-weight: 600;
  border: 1px solid var(--border-color);
`;

const EmptyState = styled.div`
  color: var(--text-color-muted);
  font-style: italic;
`;

const StatsPanel = styled.div`
  background: var(--surface-color);
  border-radius: 24px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
  background: rgba(0,0,0,0.02);
`;

const VitalsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VitalCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.5)' : 'var(--background-color)'};
  border: 1px solid ${props => props.$active ? 'var(--primary-color)' : 'var(--border-color)'};
  opacity: ${props => props.$offline ? 0.5 : 1};
  
  .info {
    display: flex;
    flex-direction: column;
    
    .name {
      font-weight: 600;
      font-size: 0.9rem;
      color: ${props => props.$offline ? 'var(--text-color-muted)' : 'var(--text-color)'};
    }
    .role {
      font-size: 0.75rem;
      color: var(--text-color-muted);
      text-transform: capitalize;
    }
  }

  .bpm {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: ${props => props.$active ? 'var(--error-color)' : 'var(--text-color-muted)'};
    
    span {
      font-size: 1.2rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    
    small {
      font-size: 0.8rem;
      font-weight: 500;
    }
  }
`;

const PulsingHeart = styled(HeartPulse)`
  animation: ${pulseAnimation} 1s infinite;
`;

const ActionFooter = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
`;

const LeaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-color);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--error-color);
    color: white;
    border-color: var(--error-color);
  }
`;

const StartButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  border-radius: 999px;
  border: none;
  background: var(--primary-color);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    background: var(--primary-hover);
  }
`;

const WaitingMessage = styled.div`
  color: var(--text-color-muted);
  font-style: italic;
  padding: 12px 24px;
  background: rgba(0,0,0,0.03);
  border-radius: 999px;
`;

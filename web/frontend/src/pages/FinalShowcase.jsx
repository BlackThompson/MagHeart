import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LegoSketchPad from '../components/cocreation/LegoSketchPad';
import CameraView from '../components/cocreation/CameraView';
import useCoCreationSocket from '../hooks/useCoCreationSocket';
import { Wifi, WifiOff, ChevronLeft } from 'lucide-react';

export default function FinalShowcasePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, role, meetingId: stateMeetingId } = location.state || {};

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }
  }, [name, role, navigate]);

  const queryMeetingId = new URLSearchParams(location.search).get('meetingId');
  const meetingId = stateMeetingId || queryMeetingId || 'default-meeting';
  const { messages, isConnected } = useCoCreationSocket(meetingId, name);

  if (!name || !role) {
    return null;
  }

  return (
    <PageWrapper>
      <Header>
        <HeaderTitle>Final Showcase</HeaderTitle>
        <UserInfo>
          {name} <RoleBadge>{role}</RoleBadge>
        </UserInfo>
        <ConnectionStatus $connected={isConnected}>
          {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
          {isConnected ? 'Connected' : 'Disconnected'}
        </ConnectionStatus>
      </Header>

      <MainContent>
        <Column>
          <Title>Final LEGO Figure (1)</Title>
          <FigureContainer>
            <LegoSketchPad messages={messages} />
          </FigureContainer>
        </Column>
        <Column>
          <Title>Local Assembly Camera</Title>
          <CameraContainer>
            <CameraView />
          </CameraContainer>
        </Column>
      </MainContent>
      {role === 'local' && (
        <FooterBar>
          <FooterSpacer />
          <SecondaryButton type="button" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} /> Previous
          </SecondaryButton>
          <ProgressInfo>Step 3 / 3</ProgressInfo>
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

const MainContent = styled.main`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  padding: 32px;
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FigureContainer = styled.div`
  background-color: var(--surface-color);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  min-height: 400px;
  flex: 1;
  overflow: hidden;
`;

const CameraContainer = styled.div`
  border-radius: 24px;
  overflow: hidden;
  min-height: 400px;
  flex: 1;
  box-shadow: var(--shadow-md);
  background-color: #000; /* Camera background usually black */
  display: flex;
  align-items: center;
  justify-content: center;
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

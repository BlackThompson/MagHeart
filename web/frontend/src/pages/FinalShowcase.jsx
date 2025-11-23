import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LegoSketchPad from '../components/cocreation/LegoSketchPad';
import CameraView from '../components/cocreation/CameraView';
import { useMeetingSession } from '../context/MeetingSessionContext.jsx';
import { Wifi, WifiOff, ChevronLeft } from 'lucide-react';
import NavBar from '../components/NavBar.jsx';

export default function FinalShowcasePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    name,
    role,
    messages,
    isConnected,
  } = useMeetingSession();

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }
  }, [name, role, navigate]);

  if (!name || !role) {
    return null;
  }

  return (
    <PageWrapper>
      <NavBar
        title="Final Showcase"
        subtitle="Reveal the final LEGO figure and live assembly camera."
        tagLabel={isConnected ? 'Connected' : 'Disconnected'}
        userLabel={`${name} (${role})`}
      />

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
      {(role === 'local' || role === 'host') && (
        <FloatingBackButton type="button" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={18} />
        </FloatingBackButton>
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

const FloatingBackButton = styled.button`
  position: fixed;
  right: 24px;
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

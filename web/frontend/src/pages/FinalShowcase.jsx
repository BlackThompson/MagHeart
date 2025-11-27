import React, { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import CameraView from '../components/cocreation/CameraView';
import { useMeetingSession } from '../context/MeetingSessionContext.jsx';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import NavBar from '../components/NavBar.jsx';

export default function FinalShowcasePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    name,
    role,
    meetingId,
    sendUpdatePhase,
    isConnected,
    meetingState,
    sendEndMeeting,
  } = useMeetingSession();

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }
  }, [name, role, navigate]);

  if (!name || !role) {
    return null;
  }

  const coCreationStatus = meetingState?.coCreationStatus || {};
  const finalSnapshot = coCreationStatus.snapshotPath || coCreationStatus.snapshot;

  const handleBack = useCallback(() => {
    if (role === 'host' && sendUpdatePhase) {
      sendUpdatePhase('cocreation');
    }
    navigate(`/cocreation?meetingId=${encodeURIComponent(meetingId)}`, {
      state: { name, role, meetingId, meetingState },
    });
  }, [role, sendUpdatePhase, navigate, meetingId, name, meetingState]);

  const celebrationSoundRef = useRef(null);
  useEffect(() => {
    celebrationSoundRef.current = new Audio('/sounds/celebration.mp3');
  }, []);

  const handleComplete = useCallback(() => {
    if (role === 'host' && sendEndMeeting) {
      sendEndMeeting('final_showcase_complete');
    }
    if (celebrationSoundRef.current) {
      celebrationSoundRef.current.currentTime = 0;
      celebrationSoundRef.current.play().catch(() => {});
    }
  }, [role, sendEndMeeting]);

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
          <Title>Remote</Title>
          <FigureContainer>
            {finalSnapshot ? (
              <FinalImage src={finalSnapshot} alt="Final LEGO result" />
            ) : (
              <Placeholder>
                Waiting for remote side to finish sharing...
              </Placeholder>
            )}
          </FigureContainer>
        </Column>
        <Column>
          <Title>Co-located</Title>
          <CameraContainer>
            <CameraView />
          </CameraContainer>
        </Column>
      </MainContent>
      {role === 'host' && (
        <CompleteButton type="button" onClick={handleComplete}>
          <CheckCircle2 size={18} />
          Finish Session
        </CompleteButton>
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
  background-color: #020617;
  border-radius: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  aspect-ratio: 4 / 3;
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;


const FinalImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  color: var(--text-color-muted);
  font-weight: 500;
`;

const CameraContainer = styled.div`
  border-radius: 24px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  flex: 1;
  box-shadow: var(--shadow-md);
  background-color: #000; /* Camera background usually black */
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CompleteButton = styled.button`
  position: fixed;
  right: 24px;
  bottom: 24px;
  padding: 14px 24px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background-color: var(--primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    background-color: var(--primary-hover);
  }
`;

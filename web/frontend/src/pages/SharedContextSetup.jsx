import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useMeetingSession } from '../context/MeetingSessionContext.jsx';
import LocalCardPanel from '../components/LocalCardPanel.jsx';
import NavBar from '../components/NavBar.jsx';

export default function SharedContextSetupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, role, meetingId: stateMeetingId } = location.state || {};
  const roleLabel = role === 'host' ? 'Host' : role === 'local' ? 'Local' : 'Remote';
  const { sendUpdatePhase, sendUpdateSharedContext, sharedContext } = useMeetingSession();

  const queryMeetingId = new URLSearchParams(location.search).get('meetingId');
  const meetingId = stateMeetingId || queryMeetingId || 'default-meeting';

  const isHost = role === 'host';

  if (!name || !role) {
    navigate('/');
    return null;
  }

  const background = 'var(--background-color)';

  // Default structure if sharedContext is empty
  const cardStage = sharedContext?.cardStage || {
    status: 'in_progress',
    local: { played: [] },
    remote: { drawn: [] },
  };

  const handleUpdateCardStage = (nextCardStage) => {
    if (!sendUpdateSharedContext) return;
    sendUpdateSharedContext({
      cardStage: nextCardStage,
    });
  };

  const handleNext = () => {
    if (sendUpdateSharedContext) {
      sendUpdateSharedContext({
        cardStage: {
          ...cardStage,
          status: 'completed',
        },
      });
    }
    if (sendUpdatePhase) {
      sendUpdatePhase('cocreation');
    }
    navigate(`/cocreation?meetingId=${encodeURIComponent(meetingId)}`, {
      state: {
        name,
        role,
        meetingId,
        sharedContext: {
          ...(sharedContext || {}),
          cardStage: {
            ...cardStage,
            status: 'completed',
          },
        },
      },
    });
  };

  const subtitle =
    "Let the cards surface today's mood, identity, and hidden wishes. Local side chooses cards and builds the shared context.";

  return (
    <PageWrapper $background={background}>
      <NavBar
        title="Shared Context Setup"
        subtitle={subtitle}
        tagLabel="Card Stage"
        userLabel={`${name} (${roleLabel})`}
      />

      <MainContent>
        <SinglePanel>
          <LocalCardPanel
            role={role}
            sharedContext={sharedContext}
            onUpdateCardStage={handleUpdateCardStage}
          />
        </SinglePanel>

        {isHost && (
          <FloatingNextButton
            type="button"
            onClick={handleNext}
            aria-label="Next stage"
            title="Go to Co-creation"
          >
            →
          </FloatingNextButton>
        )}
      </MainContent>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ $background }) => $background || 'var(--background-color)'};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 24px 24px;
  min-height: 0; /* allow children to scroll */
  position: relative;
`;

const SinglePanel = styled.div`
  flex: 1;
  display: flex;
  padding: 16px 0;
  overflow: auto;
`;

const FloatingNextButton = styled.button`
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: var(--primary-color);
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  z-index: 40;

  &:hover {
    background-color: var(--primary-hover);
    transform: translateY(-2px);
  }
`;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useMeetingSession } from '../context/MeetingSessionContext.jsx';
import LocalCardPanel from '../components/LocalCardPanel.jsx';
import NavBar from '../components/NavBar.jsx';
import FloatingNavButton from '../components/FloatingNavButton.jsx';
import { createDefaultCardStage } from '../constants/cardStage.js';

export default function SharedContextSetupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, role, meetingId: stateMeetingId } = location.state || {};
  const roleLabel = role === 'host' ? 'Host' : role === 'local' ? 'Local' : 'Remote';
  const { sendUpdatePhase, sendUpdateMeetingState, meetingState, sendEvent, messages } = useMeetingSession();

  const queryMeetingId = new URLSearchParams(location.search).get('meetingId');
  const meetingId = stateMeetingId || queryMeetingId || 'default-meeting';

  const isHost = role === 'host';

  if (!name || !role) {
    navigate('/');
    return null;
  }

  const background = 'var(--background-color)';

  // Default structure if meetingState is empty
  const cardStage = meetingState?.cardStage || createDefaultCardStage();

  const handleUpdateCardStage = (nextCardStage) => {
    if (!sendUpdateMeetingState) return;
    sendUpdateMeetingState({
      cardStage: nextCardStage,
    });
  };

  const handleProceedToDraw = () => {
    if (!sendUpdateMeetingState) return;
    const remoteState = cardStage.remote || createDefaultCardStage().remote;
    sendUpdateMeetingState({
      cardStage: {
        ...cardStage,
        subPhase: 'draw',
        remote: {
          ...remoteState,
          drawn: [...(remoteState.drawn || [])],
          activeDrawId: null,
        },
      },
    });
  };

  const handleNext = () => {
    if (sendUpdateMeetingState) {
      sendUpdateMeetingState({
        cardStage: {
          ...cardStage,
          status: 'completed',
          remote: {
            ...(cardStage.remote || createDefaultCardStage().remote),
            activeDrawId: null,
          },
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
        meetingState: {
          ...(meetingState || {}),
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
            meetingState={meetingState}
           onUpdateCardStage={handleUpdateCardStage}
           onProceedToDraw={handleProceedToDraw}
           sendEvent={sendEvent}
            messages={messages}
          />
        </SinglePanel>

        {isHost && (
          <FloatingNavButton
            onClick={handleNext}
            direction="next"
            aria-label="Next stage"
            title="Go to Co-creation"
          />
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

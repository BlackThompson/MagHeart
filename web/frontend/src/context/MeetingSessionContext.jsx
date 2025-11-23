import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import useCoCreationSocket from '../hooks/useCoCreationSocket';
import { getCoCreationSocketClient } from '../services/coCreationSocketClient';

const MeetingSessionContext = createContext(null);

export function useMeetingSession() {
  const ctx = useContext(MeetingSessionContext);
  if (!ctx) {
    throw new Error('useMeetingSession must be used within a MeetingSessionProvider');
  }
  return ctx;
}

function deriveInitialPhase(pathname) {
  if (pathname.startsWith('/shared-context')) return 'shared_context_setup';
  if (pathname.startsWith('/cocreation')) return 'cocreation';
  if (pathname.startsWith('/showcase')) return 'showcase';
  return 'lobby';
}

export function MeetingSessionProvider() {
  const location = useLocation();
  const navigate = useNavigate();

  const { name, role, meetingId: stateMeetingId, avatarSeed: stateAvatarSeed } = location.state || {};
  const queryMeetingId = new URLSearchParams(location.search).get('meetingId');
  const meetingId = stateMeetingId || queryMeetingId || 'default-meeting';

  const avatarSeed =
    stateAvatarSeed ||
    window.localStorage.getItem('magheart_avatar_seed') ||
    name ||
    'anonymous';

  const initialPhase = deriveInitialPhase(location.pathname);

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }

    // When leaving the meeting routes entirely, stop the singleton WebSocket client.
    return () => {
      const client = getCoCreationSocketClient();
      client.stop();
    };
  }, [name, role, navigate]);

  const socketState = useCoCreationSocket({
    meetingId,
    userId: name || '',
    role,
    avatarSeed,
    initialPhase,
  });

  const { meetingPhase } = socketState;

  useEffect(() => {
    if (!meetingPhase || !name || !role || role === 'host') {
      return;
    }

    let targetPath = '/lobby';
    if (meetingPhase === 'shared_context_setup') {
      targetPath = '/shared-context';
    } else if (meetingPhase === 'cocreation') {
      targetPath = '/cocreation';
    } else if (meetingPhase === 'showcase') {
      targetPath = '/showcase';
    }

    if (!location.pathname.startsWith(targetPath)) {
      navigate(`${targetPath}?meetingId=${encodeURIComponent(meetingId)}`, {
        replace: true,
        state: { name, role, meetingId, avatarSeed },
      });
    }
  }, [meetingPhase, location.pathname, navigate, meetingId, name, role, avatarSeed]);

  const value = useMemo(
    () => ({
      name,
      role,
      meetingId,
      avatarSeed,
      initialPhase,
      ...socketState,
    }),
    [name, role, meetingId, avatarSeed, initialPhase, socketState],
  );

  if (!name || !role) {
    return null;
  }

  return (
    <MeetingSessionContext.Provider value={value}>
      <Outlet />
    </MeetingSessionContext.Provider>
  );
}

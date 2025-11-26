import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useMeetingSession } from '../context/MeetingSessionContext.jsx';
import { useWebRTC } from '../hooks/useWebRTC';
import NavBar from '../components/NavBar.jsx';
import FloatingNavButton from '../components/FloatingNavButton.jsx';
import RemoteControlsPanel from '../components/cocreation/RemoteControlsPanel.jsx';
import VideoPreview from '../components/cocreation/VideoPreview.jsx';
import CompletionStatusBoard from '../components/cocreation/CompletionStatusBoard.jsx';
import CelebrationOverlay from '../components/cocreation/CelebrationOverlay.jsx';
import { createDefaultCardStage } from '../constants/cardStage.js';

const DEFAULT_CO_CREATION_STATUS = {
  blurEnabled: true,
  stageActive: false,
  remoteDone: false,
  localDone: false,
  globalCelebration: false,
  snapshot: null,
};

export default function CoCreationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { meetingState: locationMeetingState } = location.state || {};

  const {
    name,
    role,
    meetingId,
    messages,
    sendMessage,
    sendUpdatePhase,
    sendUpdateMeetingState,
    meetingState: socketMeetingState,
    isConnected,
  } = useMeetingSession();

  const isRemote = role === 'remote';
  const { stream, addStream } = useWebRTC(messages, sendMessage, name, isRemote);
  const videoRef = useRef(null);
  const remotePreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const prevCompletionRef = useRef({ remoteDone: false, localDone: false });
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !stream || isRemote) return;
    videoRef.current.srcObject = stream;
  }, [stream, isRemote]);

  useEffect(() => {
    if (!isRemote) {
      return;
    }
    const videoEl = remotePreviewRef.current;
    console.log('remote preview ref', videoEl);
    if (stream && videoEl) {
      console.log('assigning stream to hidden preview');
      videoEl.srcObject = stream;
      videoEl.addEventListener('loadeddata', () => {
        console.log('hidden preview loaded', videoEl.readyState, videoEl.videoWidth, videoEl.videoHeight);
      });
      videoEl.play().catch((err) => {
        console.warn('hidden preview play failed', err);
      });
    } else if (videoEl) {
      console.log('clearing hidden preview stream');
      videoEl.srcObject = null;
    }
  }, [stream, isRemote]);

  useEffect(() => {
    if (!name || !role) {
      navigate('/');
    }
  }, [name, role, navigate]);

  if (!name || !role) {
    return null; // Render nothing while redirecting
  }

  const isHost = role === 'host';
  const isLocalSide = role === 'local' || role === 'host';

  const effectiveMeetingState = socketMeetingState || locationMeetingState || {};
  // console.log('meetingState', effectiveMeetingState);
  const cardStage = effectiveMeetingState.cardStage || createDefaultCardStage();
  const coCreationStatus = useMemo(
    () => ({
      ...DEFAULT_CO_CREATION_STATUS,
      ...(effectiveMeetingState.coCreationStatus || {}),
    }),
    [effectiveMeetingState.coCreationStatus],
  );

  const { blurEnabled, stageActive, remoteDone, localDone, globalCelebration } = coCreationStatus;
  const bothComplete = remoteDone && localDone;
  const canHostAdvance = isHost && bothComplete;
  const shouldBlurPreview = !isRemote && blurEnabled;

  const updateCoCreationStatus = useCallback(
    (patch = {}) => {
      if (!sendUpdateMeetingState) return;
      const nextStatus = {
        ...DEFAULT_CO_CREATION_STATUS,
        ...coCreationStatus,
        ...patch,
        updatedAt: new Date().toISOString(),
        updatedBy: name,
      };
      sendUpdateMeetingState({ coCreationStatus: nextStatus });
    },
    [coCreationStatus, sendUpdateMeetingState, name],
  );

  const playChime = useCallback(
    (notes = [660, 880], duration = 0.18) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        const startTime = ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(ctx.destination);
          const offset = idx * duration;
          gain.gain.setValueAtTime(0.0001, startTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.25, startTime + offset + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + duration);
          osc.start(startTime + offset);
          osc.stop(startTime + offset + duration);
  });
      } catch (err) {
        console.warn('Unable to play chime', err);
      }
    },
    [],
  );

  const captureSnapshot = useCallback(async () => {
    if (!isRemote || !stream) {
      console.log('captureSnapshot skipped: no stream or not remote', { isRemote, hasStream: !!stream });
      return null;
    }
    const [videoTrack] = stream.getVideoTracks();
    if (!videoTrack) {
      console.log('captureSnapshot skipped: no video track');
      return null;
    }
    try {
      if (window.ImageCapture) {
        const imageCapture = new ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        return canvas.toDataURL('image/png');
      }
    } catch (err) {
      console.warn('ImageCapture failed, falling back to video frame', err);
    }

    if (remotePreviewRef.current) {
      const videoEl = remotePreviewRef.current;
      if (videoEl.readyState < 2 || !videoEl.videoWidth) {
      console.log('Snapshot skipped: video not ready', {
        readyState: videoEl.readyState,
        videoWidth: videoEl.videoWidth,
        videoHeight: videoEl.videoHeight,
      });
        return null;
      }
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    }
    return null;
  }, [isRemote, stream]);

  const handleStartShare = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      addStream(mediaStream);
      updateCoCreationStatus({ stageActive: true });
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  }, [addStream, updateCoCreationStatus]);

  const handleOpenLego = useCallback(() => {
    window.open('https://www.lego.com/en-us/minifigure-factory', '_blank', 'noopener,noreferrer');
  }, []);

  const uploadSnapshot = useCallback(
    async (dataUrl) => {
      if (!dataUrl) return null;
      try {
        const res = await fetch('/cocreation/snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId,
            userId: name,
            imageData: dataUrl,
          }),
        });
        if (!res.ok) {
          throw new Error(`Snapshot upload failed: ${res.status}`);
        }
        const data = await res.json();
        return data?.url || null;
      } catch (err) {
        console.warn('Failed to save snapshot', err);
        return null;
      }
    },
    [meetingId, name],
  );

  const handleRemoteComplete = useCallback(async () => {
    if (!stageActive || remoteDone) return;
    console.log('Remote complete clicked');
    const snapshot = await captureSnapshot();
    console.log('Capture result', snapshot ? 'success' : 'null');
    const snapshotPath = snapshot ? await uploadSnapshot(snapshot) : null;
    console.log('Upload result', snapshotPath);
    updateCoCreationStatus({
      remoteDone: true,
      remoteDoneAt: new Date().toISOString(),
      snapshot: snapshot || coCreationStatus.snapshot,
      snapshotPath: snapshotPath || coCreationStatus.snapshotPath,
    });
  }, [
    stageActive,
    remoteDone,
    captureSnapshot,
    uploadSnapshot,
    updateCoCreationStatus,
    coCreationStatus.snapshot,
    coCreationStatus.snapshotPath,
  ]);

  const handleLocalComplete = useCallback(() => {
    if (!stageActive || localDone || !isLocalSide) return;
    updateCoCreationStatus({
      localDone: true,
      localDoneAt: new Date().toISOString(),
    });
  }, [stageActive, localDone, isLocalSide, updateCoCreationStatus]);

  const handleBlurToggle = useCallback(() => {
    if (!isRemote) return;
    updateCoCreationStatus({
      blurEnabled: !blurEnabled,
    });
  }, [isRemote, blurEnabled, updateCoCreationStatus]);

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

  useEffect(() => {
    const prev = prevCompletionRef.current;
    if (!prev.remoteDone && remoteDone) {
      playChime([560, 720]);
    }
    if (!prev.localDone && localDone) {
      playChime([480, 660]);
    }
    prevCompletionRef.current = { remoteDone, localDone };
  }, [remoteDone, localDone, playChime]);

  useEffect(() => {
    if (bothComplete && !globalCelebration) {
      updateCoCreationStatus({ globalCelebration: true, blurEnabled: false });
    }
  }, [bothComplete, globalCelebration, updateCoCreationStatus]);

  useEffect(() => {
    if (!coCreationStatus.globalCelebration) return;
    setCelebrationVisible(true);
    playChime([660, 880, 990], 0.24);
    const timer = setTimeout(() => setCelebrationVisible(false), 4500);
    return () => clearTimeout(timer);
  }, [coCreationStatus.globalCelebration, playChime]);

  const handleBackToContext = useCallback(() => {
    if (!isHost) {
      navigate(-1);
      return;
    }
    if (sendUpdateMeetingState) {
      const nextCardStage = {
        ...(effectiveMeetingState.cardStage || createDefaultCardStage()),
        status: 'in_progress',
        remote: {
          ...(effectiveMeetingState.cardStage?.remote || createDefaultCardStage().remote),
          activeDrawId: null,
        },
      };
      sendUpdateMeetingState({ cardStage: nextCardStage });
    }
    if (sendUpdatePhase) {
      sendUpdatePhase('shared_context_setup');
    }
    navigate(`/shared-context?meetingId=${encodeURIComponent(meetingId)}`, {
      state: {
        name,
        role,
        meetingId,
        meetingState: effectiveMeetingState,
      },
    });
  }, [
    isHost,
    navigate,
    sendUpdateMeetingState,
    effectiveMeetingState,
    sendUpdatePhase,
    meetingId,
    name,
    role,
  ]);

  const handleNext = () => {
    if (!bothComplete) {
      return;
    }
    if (sendUpdatePhase) {
      sendUpdatePhase('showcase');
    }
    navigate(`/showcase?meetingId=${encodeURIComponent(meetingId)}`, {
      state: { name, role, meetingState: effectiveMeetingState, meetingId },
    });
  };

  return (
    <PageWrapper>
      <NavBar
        title="Co-Creation Stage"
        subtitle="Use LEGO pieces and prompts from the shared context to build together."
        tagLabel={isRemote ? 'Remote View' : 'Local View'}
        userLabel={`${name} (${role})`}
      />

      <MainContent>
        <div>
          <PanelTitle>Context Summary</PanelTitle>
          <ContextGrid>
            {qaItems.length === 0 ? (
              <p>No cards have been played yet.</p>
            ) : (
              qaItems.map((item, index) => (
                <NoteItem key={`${item.side}-${index}`} $side={item.side}>
                  <ContextSideTag $side={item.side}>
                    {item.side === 'local' ? 'Local' : 'Remote'}
                  </ContextSideTag>
                  <ContextMain>
                    <ContextTitle $side={item.side}>{item.title}</ContextTitle>
                    {item.prompt && <ContextPrompt>{item.prompt}</ContextPrompt>}
                    {item.answer && <ContextAnswer>{item.answer}</ContextAnswer>}
                    {!item.answer && item.side === 'remote' && (
                      <ContextHint>Waiting for remote answer…</ContextHint>
                    )}
                  </ContextMain>
                </NoteItem>
              ))
            )}
          </ContextGrid>
        </div>

        <MainColumn>
          <PanelTitle>{isRemote ? 'Remote Controls' : 'Remote Operation View'}</PanelTitle>
          <CanvasContainer>
            {isRemote ? (
              <RemoteControlsPanel
                onStartShare={handleStartShare}
                onOpenLego={handleOpenLego}
                blurEnabled={blurEnabled}
                onToggleBlur={handleBlurToggle}
                previewRef={remotePreviewRef}
              />
            ) : (
              <VideoPreview videoRef={videoRef} hasStream={Boolean(stream)} shouldBlur={shouldBlurPreview} />
            )}
          </CanvasContainer>
          {stageActive && (
            <CompletionStatusBoard
              remoteDone={remoteDone}
              localDone={localDone}
              bothComplete={bothComplete}
              isRemote={isRemote}
              isLocalSide={isLocalSide}
              onRemoteComplete={handleRemoteComplete}
              onLocalComplete={handleLocalComplete}
            />
          )}
        </MainColumn>

        {isHost && (
          <>
            <FloatingNavButton
              onClick={handleBackToContext}
              direction="prev"
              aria-label="Previous"
            />
            {canHostAdvance && (
              <FloatingNavButton
                onClick={handleNext}
                direction="next"
                aria-label="Next"
              />
            )}
          </>
        )}
      </MainContent>
      <CelebrationOverlay visible={celebrationVisible} />
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
  width: 100%;
`;

const ContextGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 4px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
`;

const NoteItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${({ $side }) => ($side === 'local' ? '#fffbeb' : '#f0fdfa')}; /* Light yellow vs light cyan/green */
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 2px;
  border-bottom-right-radius: 20px;
  padding: 16px;
  position: relative;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: default;
  min-height: 140px;
  
  &:hover {
    transform: translateY(-4px) rotate(1deg);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }
`;

const ContextSideTag = styled.span`
  flex: 0 0 auto;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
  color: ${({ $side }) => ($side === 'local' ? '#b45309' : '#047857')};
  background: ${({ $side }) => ($side === 'local' ? '#fef3c7' : '#d1fae5')};
`;

const ContextMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ContextTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ $side }) => ($side === 'local' ? '#92400e' : '#065f46')};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContextPrompt = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ContextAnswer = styled.div`
  font-size: 0.85rem;
  color: #111827;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ContextHint = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
`;

const CanvasContainer = styled.div`
  background-color: var(--surface-color);
  border-radius: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  flex: 1;
  min-height: 500px;
  display: flex;
  align-items: stretch;
`;

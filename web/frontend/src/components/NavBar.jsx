import React, { useState } from 'react';
import styled from 'styled-components';
import { Copy, Heart } from 'lucide-react';


export default function NavBar({
  title,
  subtitle,
  tagLabel,
  userLabel,
  meetingId,
  showHeartToggle,
  onHeartToggle,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyMeeting = () => {
    if (!meetingId) return;
    navigator.clipboard?.writeText(meetingId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NavBarWrapper>
      <NavBarRoot>
        <NavLeft>
          <NavTitle>{title}</NavTitle>
          {subtitle && <NavSubtitle>{subtitle}</NavSubtitle>}
        </NavLeft>
        <NavRight>
          {tagLabel && <StageTag>{tagLabel}</StageTag>}
          {userLabel && <UserLabel>{userLabel}</UserLabel>}
          {meetingId && (
            <MeetingInfo>
              <MeetingLabel>Meeting ID</MeetingLabel>
              <MeetingValue>{meetingId}</MeetingValue>
              <CopyButton type="button" onClick={handleCopyMeeting} aria-label="Copy meeting ID">
                <Copy size={14} />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </CopyButton>
            </MeetingInfo>
          )}
        </NavRight>
      </NavBarRoot>
      {showHeartToggle && (
        <HeartToggle
          type="button"
          onClick={onHeartToggle}
          aria-label="Toggle heart rates"
          title="Show heart rates"
        >
          <Heart size={16} />
        </HeartToggle>
      )}
    </NavBarWrapper>
  );
}

const NavBarWrapper = styled.header`
  position: relative;
  z-index: 10;
  flex-shrink: 0;
`;

const NavBarRoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 2; /* Main bar on top */
`;

const NavLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const NavTitle = styled.h1`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.01em;
`;

const NavSubtitle = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-muted);
  line-height: 1.3;
  max-width: 720px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NavRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  position: relative;
`;

const StageTag = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.08);
  padding: 2px 10px;
  border-radius: 999px;
`;

const UserLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-color-muted);
`;

const MeetingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-color-muted);
`;

const MeetingLabel = styled.span`
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.04em;
`;

const MeetingValue = styled.span`
  font-weight: 600;
  color: var(--text-color);
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: var(--surface-color);
  color: var(--primary-color);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
  border: 1px solid rgba(99, 102, 241, 0.2);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
`;

const HeartToggle = styled.button`
  position: absolute;
  right: 24px; /* Align with layout padding */
  top: 100%; /* Attach to bottom of wrapper */
  margin-top: -12px; /* Pull up to hide top part behind bar */
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  padding: 16px 12px 8px; /* Extra top padding to handle the pull-up */
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  /* Top border is visible if we don't hide it behind the bar. 
     Since it's z-index 1 and bar is z-index 2, the bar will cover the top part. */
  border-radius: 0 0 12px 12px;
  
  color: var(--text-color-muted);
  cursor: pointer;
  z-index: 1; /* BEHIND the bar (z-index 2) */
  
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);

  svg {
    transition: transform 0.3s ease;
  }

  &:hover {
    margin-top: -4px; /* Slide down to show more */
    color: #ef4444; 
    box-shadow: 0 8px 16px -4px rgba(239, 68, 68, 0.15);
    /* Keep z-index 1 so it stays behind! Or do we want it to pop over? 
       Usually tabs stay behind. Let's keep it behind for the "tucked" feel. */
    
    svg {
      transform: scale(1.1);
      fill: rgba(239, 68, 68, 0.1);
    }
  }

  &:active {
    margin-top: -8px; 
    transform: scale(0.98);
  }
`;

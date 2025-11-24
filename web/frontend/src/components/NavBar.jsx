import React, { useState } from 'react';
import styled from 'styled-components';
import { Copy } from 'lucide-react';

export default function NavBar({ title, subtitle, tagLabel, userLabel, meetingId }) {
  const [copied, setCopied] = useState(false);

  const handleCopyMeeting = () => {
    if (!meetingId) return;
    navigator.clipboard?.writeText(meetingId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
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
  );
}

const NavBarRoot = styled.header`
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  z-index: 10;
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

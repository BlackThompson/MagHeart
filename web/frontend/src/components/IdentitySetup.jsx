import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { User, Activity } from 'lucide-react';

export default function IdentitySetup() {
  const [name, setName] = useState('');
  const [role, setRole] = useState(null); // 'local' or 'remote'
  const navigate = useNavigate();

  const handleComplete = () => {
    if (name && role) {
      navigate('/shared-context', { state: { name, role } });
    }
  };

  return (
    <Wrapper>
      <Card>
        <Title>Identity Selection</Title>
        <Subtitle>Who are you in this session?</Subtitle>
        
        <Section>
          <Label htmlFor="name-input">Your Name</Label>
          <Input 
            id="name-input"
            type="text" 
            placeholder="Enter your name..." 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </Section>

        <Section>
          <Label>Your Role</Label>
          <RoleSelector>
            <RoleButton $selected={role === 'local'} onClick={() => setRole('local')}>
              <User size={32} className="icon" />
              <span className="text">Local</span>
              <small>(Assembling LEGOs)</small>
            </RoleButton>
            <RoleButton $selected={role === 'remote'} onClick={() => setRole('remote')}>
              <Activity size={32} className="icon" />
              <span className="text">Remote</span>
              <small>(Guiding / Observing)</small>
            </RoleButton>
          </RoleSelector>
        </Section>

        <ContinueButton onClick={handleComplete} disabled={!name || !role}>
          Continue
        </ContinueButton>
      </Card>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--background-color);
`;

const Card = styled.div`
  background: var(--surface-color);
  padding: 48px;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 500px;
  text-align: center;
  border: 1px solid var(--border-color);
`;

const Title = styled.h1`
  font-size: 2em;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px;
`;

const Subtitle = styled.p`
  font-size: 1.1em;
  color: var(--text-color-muted);
  margin: 0 0 32px;
`;

const Section = styled.div`
  text-align: left;
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 1em;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 1em;
  transition: all 0.2s;
  background: var(--background-color);
  color: var(--text-color);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    background: var(--surface-color);
  }
`;

const RoleSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const RoleButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  border: 2px solid ${props => props.$selected ? 'var(--primary-color)' : 'var(--border-color)'};
  background-color: ${props => props.$selected ? 'rgba(99, 102, 241, 0.05)' : 'var(--background-color)'};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: ${props => props.$selected ? 'var(--primary-color)' : 'var(--text-color)'};
  
  .icon {
    margin-bottom: 12px;
    color: ${props => props.$selected ? 'var(--primary-color)' : 'var(--text-color-muted)'};
  }
  
  .text {
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  small {
    font-size: 0.85em;
    color: var(--text-color-muted);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: ${props => props.$selected ? 'var(--primary-color)' : 'var(--text-color-muted)'};
  }
`;

const ContinueButton = styled.button`
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: var(--primary-color);
  color: white;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
  box-shadow: var(--shadow-md);

  &:disabled {
    background: var(--text-color-muted);
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none;
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
    background: var(--primary-hover);
    box-shadow: var(--shadow-lg);
  }
`;

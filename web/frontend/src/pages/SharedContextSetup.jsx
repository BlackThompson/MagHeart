import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Sun,
  Moon,
  Wind,
  Zap,
  Feather,
  Layers,
  User,
  Smile,
  Heart,
  Shield,
  Link,
  Activity,
  Check,
} from 'lucide-react';

const ATMOSPHERES = [
  { label: 'Soft Bright', icon: Sun },
  { label: 'Steady Calm', icon: Moon },
  { label: 'A Hint of Edge', icon: Zap },
  { label: 'Gentle Warmth', icon: Sun },
  { label: 'Quiet Blue', icon: Wind },
];

const STYLE_TRENDS = [
  { label: 'Functional-ish', icon: Layers },
  { label: 'Story-ish', icon: Feather },
  { label: 'Warm-ish', icon: Sun },
  { label: 'Sharp-ish', icon: Zap },
  { label: 'Loose-ish', icon: Wind },
];

const IDENTITY_TIPS = [
  { label: 'Looks like someone who goes outdoors', icon: Sun },
  { label: 'Looks like a thoughtful person', icon: User },
  { label: 'Looks like a powerful person', icon: Shield },
  { label: 'Looks like someone who loves imagination', icon: Smile },
  { label: 'Looks like someone who helps others', icon: Heart },
];

const INTENT_CLUES = [
  { label: 'Want to express something', icon: Feather },
  { label: 'Want to catch a bit of energy', icon: Zap },
  { label: 'Want to feel a bit lighter', icon: Wind },
  { label: 'Want a bit of protection', icon: Shield },
  { label: 'Want more sense of connection', icon: Link },
];

const STATE_FLOW = [
  { label: 'A bit nervous', icon: Activity },
  { label: 'Gently expectant', icon: Smile },
  { label: 'Slightly excited', icon: Zap },
  { label: 'Softly relaxed', icon: Moon },
  { label: 'Calmly flowing', icon: Wind },
];

export default function SharedContextSetupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, role, meetingId: stateMeetingId } = location.state || {};

  const querySessionId = new URLSearchParams(location.search).get('sessionId');
  const meetingId = stateMeetingId || querySessionId || 'default-session';

  const isLocal = role === 'local';
  const isRemote = role === 'remote';

  const [atmosphere, setAtmosphere] = useState(null);
  const [styleTrend, setStyleTrend] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [intents, setIntents] = useState([]);
  const [stateFlow, setStateFlow] = useState(null);

  const step = 1;

  const canProceed = useMemo(() => {
    return !!(atmosphere && styleTrend && identity && intents.length > 0 && stateFlow);
  }, [atmosphere, styleTrend, identity, intents, stateFlow]);

  const handleToggleIntent = (value) => {
    setIntents((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleNext = () => {
    if (!canProceed) return;
    navigate(`/cocreation?sessionId=${encodeURIComponent(meetingId)}`, {
      state: {
        name,
        role,
        meetingId,
        sharedContext: {
          atmosphere,
          styleTrend,
          identity,
          intents,
          stateFlow,
        },
      },
    });
  };

  if (!name || !role) {
    navigate('/');
    return null;
  }

  return (
    <PageWrapper>
      <Header>
        <HeaderText>
          <Title>Shared Context Setup</Title>
          <Subtitle>
            Before we begin co-creating, pick a few elements that feel true to your current state.
          </Subtitle>
        </HeaderText>
        <HeaderRight>
          <StepText>Step {step} / 3</StepText>
          <UserInfo>
            {name} ({role === 'local' ? 'Local' : 'Remote'})
          </UserInfo>
        </HeaderRight>
      </Header>

      <MainContent $isRemote={isRemote}>
        <ModuleColumn>
          <Module>
            <ModuleTitle>
              <Sun size={20} />
              Overall Atmosphere
            </ModuleTitle>
            <ModuleDescription>
              These atmospheres are gentle, fuzzy impressions to express how you feel today.
            </ModuleDescription>
            <Grid>
              {ATMOSPHERES.map((item) => (
                <SelectionCard
                  key={item.label}
                  $selected={atmosphere === item.label}
                  onClick={() => setAtmosphere(item.label)}
                >
                  <item.icon size={24} />
                  <Label>{item.label}</Label>
                  {atmosphere === item.label && (
                    <CheckIcon>
                      <Check size={16} />
                    </CheckIcon>
                  )}
                </SelectionCard>
              ))}
            </Grid>
          </Module>

          <Module>
            <ModuleTitle>
              <Layers size={20} />
              Style Direction
            </ModuleTitle>
            <ModuleDescription>
              Choose the expression direction you&apos;re leaning toward right now.
            </ModuleDescription>
            <Grid>
              {STYLE_TRENDS.map((item) => (
                <SelectionCard
                  key={item.label}
                  $selected={styleTrend === item.label}
                  onClick={() => setStyleTrend(item.label)}
                >
                  <item.icon size={24} />
                  <Label>{item.label}</Label>
                  {styleTrend === item.label && (
                    <CheckIcon>
                      <Check size={16} />
                    </CheckIcon>
                  )}
                </SelectionCard>
              ))}
            </Grid>
          </Module>

          <Module>
            <ModuleTitle>
              <User size={20} />
              “Looks Like You” Direction
            </ModuleTitle>
            <ListGrid>
              {IDENTITY_TIPS.map((item) => (
                <ListItem
                  key={item.label}
                  $selected={identity === item.label}
                  onClick={() => setIdentity(item.label)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {identity === item.label && <Check size={16} style={{ marginLeft: 'auto' }} />}
                </ListItem>
              ))}
            </ListGrid>
            {identity && (
              <SelectionHint>
                Remote selected “{identity}”.
              </SelectionHint>
            )}
          </Module>
        </ModuleColumn>

        <ModuleColumn>
          <Module>
            <ModuleTitle>
              <Heart size={20} />
              Intent Clues
            </ModuleTitle>
            <ModuleDescription>You can pick multiple intentions or wishes for this moment.</ModuleDescription>
            <Grid>
              {INTENT_CLUES.map((item) => (
                <SelectionCard
                  key={item.label}
                  $selected={intents.includes(item.label)}
                  onClick={() => handleToggleIntent(item.label)}
                >
                  <item.icon size={24} />
                  <Label>{item.label}</Label>
                  {intents.includes(item.label) && (
                    <CheckIcon>
                      <Check size={16} />
                    </CheckIcon>
                  )}
                </SelectionCard>
              ))}
            </Grid>
          </Module>

          <Module>
            <ModuleTitle>
              <Activity size={20} />
              Current Participation State
            </ModuleTitle>
            <ListGrid>
              {STATE_FLOW.map((item) => (
                <ListItem
                  key={item.label}
                  $selected={stateFlow === item.label}
                  onClick={() => setStateFlow(item.label)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {stateFlow === item.label && <Check size={16} style={{ marginLeft: 'auto' }} />}
                </ListItem>
              ))}
            </ListGrid>
            <WaveformHint>The background waveform is driven by live heart rate.</WaveformHint>
          </Module>
        </ModuleColumn>
      </MainContent>

      {isLocal && (
        <FooterBar>
          <FooterSpacer />
          <ProgressInfo>Step {step} / 3</ProgressInfo>
          <PrimaryButton onClick={handleNext} disabled={!canProceed}>
            Next
          </PrimaryButton>
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
  justify-content: space-between;
  align-items: center;
  padding: 24px 40px;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-color-muted);
`;

const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

const StepText = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 12px;
  border-radius: 999px;
`;

const UserInfo = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color-muted);
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: ${({ $isRemote }) => ($isRemote ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))')};
  gap: 32px;
  padding: 40px;
  max-width: ${({ $isRemote }) => ($isRemote ? '800px' : '1200px')};
  margin: 0 auto;
  width: 100%;
  flex: 1;
`;

const ModuleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Module = styled.section`
  background-color: var(--surface-color);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

const ModuleTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: var(--primary-color);
  }
`;

const ModuleDescription = styled.p`
  margin: 0 0 20px;
  font-size: 0.95rem;
  color: var(--text-color-muted);
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
`;

const SelectionCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background-color: ${({ $selected }) => ($selected ? 'var(--surface-color)' : 'var(--background-color)')};
  border: 2px solid ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'transparent')};
  color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--text-color-muted)')};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  height: 100%;
  min-height: 100px;

  &:hover {
    background-color: var(--surface-color);
    border-color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--border-color)')};
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  svg {
    color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'inherit')};
  }
`;

const Label = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--text-color)')};
`;

const CheckIcon = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--primary-color);
`;

const ListGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ListItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: ${({ $selected }) => ($selected ? 'var(--surface-color)' : 'var(--background-color)')};
  border: 2px solid ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'transparent')};
  color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--text-color)')};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 500;

  &:hover {
    background-color: var(--surface-color);
    border-color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--border-color)')};
    transform: translateX(2px);
  }

  svg {
    color: ${({ $selected }) => ($selected ? 'var(--primary-color)' : 'var(--text-color-muted)')};
    flex-shrink: 0;
  }
`;

const SelectionHint = styled.div`
  margin-top: 12px;
  font-size: 0.85rem;
  color: var(--primary-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--primary-color);
  }
`;

const WaveformHint = styled.div`
  margin-top: 16px;
  font-size: 0.85rem;
  color: var(--text-color-muted);
  font-style: italic;
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

const PrimaryButton = styled.button`
  min-width: 160px;
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--primary-color);
  cursor: pointer;
  pointer-events: auto;
  box-shadow: var(--shadow-lg);
  transition: all 0.2s ease;

  &:disabled {
    background-color: var(--text-color-muted);
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  &:not(:disabled):hover {
    background-color: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.4);
  }
`;

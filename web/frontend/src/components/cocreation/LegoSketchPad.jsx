import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

export default function LegoSketchPad({ messages }) {
  const [sketchComponents, setSketchComponents] = useState([]);
  const [lastIntent, setLastIntent] = useState(null);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'interpretation') {
        setSketchComponents(prev => [...prev, lastMessage.payload]);
      } else if (lastMessage.type === 'intent') {
        setLastIntent(lastMessage.payload);
      }
    }
  }, [messages]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sketchComponents]);

  return (
    <PadWrapper>
      <SketchCanvas>
        {sketchComponents.length === 0 && (
          <Placeholder>
            <p>🎨</p>
            <span>[LEGO Preview Sketch]</span>
            <small>Waiting for components to be added...</small>
          </Placeholder>
        )}
        <ComponentList>
          {sketchComponents.map((comp, index) => (
            <SketchComponent key={index}>
              <div className="comp-header">
                <span className="comp-category">{comp.category}</span>
                <strong className="comp-name">{comp.component}</strong>
              </div>
              {comp.notes && <Notes>"{comp.notes}"</Notes>}
            </SketchComponent>
          ))}
          <div ref={endOfMessagesRef} />
        </ComponentList>
      </SketchCanvas>
       {lastIntent && (
        <IntentDisplay>
          Last Intent: {lastIntent.feeling} ({lastIntent.energy}) [{lastIntent.keywords.join(', ')}]
        </IntentDisplay>
      )}
      <Cursors>
        <Cursor remote>Remote Cursor</Cursor>
        <Cursor>Local Cursor</Cursor>
      </Cursors>
    </PadWrapper>
  );
}

// --- Styled Components ---

const PadWrapper = styled.div`
  background-color: var(--surface-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const SketchCanvas = styled.div`
  width: 100%;
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
  background-color: var(--background-color);
  border-radius: 8px;
  padding: 16px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: var(--border-color);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ced4da;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #adb5bd;
  }
`;

const Placeholder = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #adb5bd;
  p {
    margin: 0;
    font-size: 3em;
  }
  span {
    font-weight: 500;
    font-size: 1.2em;
  }
  small {
    font-size: 0.9em;
  }
`;

const ComponentList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SketchComponent = styled.div`
  background-color: var(--surface-color);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  text-align: left;
  animation: fadeIn 0.5s ease-out;

  .comp-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .comp-category {
    font-size: 0.8em;
    font-weight: 600;
    color: #fff;
    background-color: var(--secondary-color);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .comp-name {
    font-size: 1.1em;
    font-weight: 600;
    color: var(--text-color);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Notes = styled.p`
  margin: 8px 0 0;
  font-size: 0.95em;
  font-style: italic;
  color: var(--text-color-muted);
  padding-left: 12px;
  border-left: 3px solid var(--border-color);
`;

const IntentDisplay = styled.div`
  position: absolute;
  top: 28px;
  right: 24px;
  font-size: 0.85em;
  color: var(--text-color-muted);
  background: var(--background-color);
  padding: 4px 10px;
  border-radius: 6px;
`;

const Cursors = styled.div`
  position: absolute;
  bottom: 24px;
  left: 24px;
  display: flex;
  gap: 12px;
`;

const Cursor = styled.div`
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  background-color: ${props => props.remote ? 'rgba(255, 159, 64, 0.9)' : 'rgba(54, 162, 235, 0.9)'};
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

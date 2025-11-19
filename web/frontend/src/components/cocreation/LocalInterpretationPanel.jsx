import React, { useState } from 'react';
import styled from 'styled-components';

export default function LocalInterpretationPanel({ sendMessage }) {
  const [category, setCategory] = useState('Hair');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [notes, setNotes] = useState('');

  const handleAddComponent = () => {
    if (sendMessage && selectedComponent) {
      const interpretationMessage = {
        type: 'interpretation',
        payload: {
          category,
          component: selectedComponent,
          notes,
          timestamp: new Date().toISOString(),
        },
      };
      sendMessage(interpretationMessage);
      setSelectedComponent(null); // Reset after sending
      setNotes(''); // Clear notes
    }
  };

  const components = {
    'Hair': ['Messy Short Hair', 'Neat Ponytail', 'Curly Hair'],
    'Expression': ['Smiling', 'Serious', 'Surprised'],
    'Accessories': ['Smart Glasses', 'Coffee Cup', 'Laptop'],
    'Color': ['Red', 'Blue', 'Green'],
    'Pose': ['Sitting Pose 1', 'Standing Pose 2', 'Hand Gesture 3'],
  };

  return (
    <PanelWrapper>
      <PanelTitle>Local Interpretation</PanelTitle>
      
      <Section>
        <Label>LEGO Category:</Label>
        <CategorySelector>
          {Object.keys(components).map(cat => (
            <Category key={cat} active={category === cat} onClick={() => setCategory(cat)}>
              {cat}
            </Category>
          ))}
        </CategorySelector>
      </Section>

      <Section>
        <Label>Recommended Components:</Label>
        <ComponentGrid>
          {components[category].map(comp => (
            <ComponentButton 
              key={comp} 
              selected={selectedComponent === comp}
              onClick={() => setSelectedComponent(comp)}
            >
              {comp}
            </ComponentButton>
          ))}
        </ComponentGrid>
      </Section>

      <Section>
        <Label>Interpretation Notes:</Label>
        <NotesInput 
          placeholder="e.g., 'Because they seem nervous + active, I chose this...'" 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Section>

      <ActionButtons>
        <ActionButton primary onClick={handleAddComponent} disabled={!selectedComponent}>
          Add to Sketch
        </ActionButton>
        <ActionButton onClick={() => setSelectedComponent(null)}>Clear</ActionButton>
      </ActionButtons>
    </PanelWrapper>
  );
}


// --- Styled Components ---

const PanelWrapper = styled.div`
  background-color: var(--surface-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const PanelTitle = styled.h2`
  margin: 0;
  text-align: center;
  font-size: 1.25em;
  font-weight: 600;
  color: var(--text-color);
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.label`
  font-weight: 500;
  color: var(--text-color-muted);
`;

const CategorySelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
`;

const Category = styled.span`
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9em;
  font-weight: 500;
  color: ${props => (props.active ? '#fff' : 'var(--text-color)')};
  background-color: ${props => (props.active ? 'var(--primary-color)' : 'var(--background-color)')};
  transition: all 0.2s;

  &:hover {
    background-color: ${props => (props.active ? 'var(--primary-color)' : 'var(--border-color)')};
    opacity: 0.9;
  }
`;

const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
`;

const ComponentButton = styled.button`
  padding: 10px;
  border: 1px solid ${props => props.selected ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 8px;
  background-color: ${props => props.selected ? 'var(--primary-color-light)' : 'var(--background-color)'};
  color: var(--text-color);
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
  }
`;

const NotesInput = styled.textarea`
  width: 100%;
  min-height: 70px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  font-family: inherit;
  font-size: 1em;
  resize: vertical;
  background-color: var(--background-color);
  color: var(--text-color);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: auto;
`;

const ActionButton = styled.button`
  flex-grow: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  background: ${props => (props.primary ? 'var(--primary-color)' : 'var(--secondary-color)')};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

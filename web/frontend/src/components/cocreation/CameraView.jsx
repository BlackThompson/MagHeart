import React from 'react';
import styled from 'styled-components';

const CameraView = () => {
  return (
    <Wrapper>
      <Placeholder>
        <Icon>📷</Icon>
        <Text>Live Camera Feed</Text>
        <Subtext>(Local user's LEGO assembly area)</Subtext>
      </Placeholder>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px dashed #444;
`;

const Placeholder = styled.div`
  text-align: center;
`;

const Icon = styled.div`
  font-size: 4em;
  margin-bottom: 16px;
`;

const Text = styled.p`
  font-size: 1.5em;
  font-weight: 600;
  margin: 0;
`;

const Subtext = styled.p`
  font-size: 1em;
  color: #aaa;
  margin-top: 8px;
`;

export default CameraView;
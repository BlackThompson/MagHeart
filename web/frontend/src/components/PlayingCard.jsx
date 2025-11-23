import React from 'react';
import styled, { css } from 'styled-components';
import { Check } from 'lucide-react';

/**
 * PlayingCard
 * 
 * Props:
 * - title: string (optional, small header if provided)
 * - prompt: string (main content, takes up most space)
 * - colorTheme: 'emerald' | 'rose' | 'amber' | 'violet' (default: 'emerald')
 * - isSelected: boolean
 * - onClick: function
 * - size: 'small' | 'medium' | 'large'
 * - disabled: boolean
 * - isFaceUp: boolean (default: true)
 */
export default function PlayingCard({
  title,
  prompt,
  colorTheme = 'emerald',
  isSelected = false,
  onClick,
  size = 'medium',
  disabled = false,
  isFaceUp = true,
  className,
}) {
  const theme = THEMES[colorTheme] || THEMES.emerald;

  return (
    <CardContainer
      className={className}
      $size={size}
      $theme={theme}
      $isSelected={isSelected}
      $disabled={disabled}
      $isFaceUp={isFaceUp}
      onClick={!disabled ? onClick : undefined}
    >
      <CardFace $type="front" $theme={theme} $isFaceUp={isFaceUp}>
        {/* Decorative corner patterns */}
        <CornerDecoration $position="top-left" $theme={theme} />
        <CornerDecoration $position="top-right" $theme={theme} />
        <CornerDecoration $position="bottom-left" $theme={theme} />
        <CornerDecoration $position="bottom-right" $theme={theme} />
        
        {/* Background decorative elements */}
        <BackgroundPattern $theme={theme} />

        {/* Optional small title at top */}
        {title && (
          <CardHeader>
            <CardTitle $isSelected={isSelected} $theme={theme}>{title}</CardTitle>
            {isSelected && (
              <CheckBadge>
                <Check size={14} />
              </CheckBadge>
            )}
          </CardHeader>
        )}

        {/* Main Content: The Question/Prompt */}
        <CardBody>
          <QuoteDecoration>"</QuoteDecoration>
          <PromptText $isSelected={isSelected}>
            {prompt}
          </PromptText>
        </CardBody>
      </CardFace>

      <CardFace $type="back" $isFaceUp={isFaceUp}>
        {/* Enhanced back design with multiple layers */}
        <BackOuterGlow />
        <BackPatternOuter />
        <BackPatternMiddle />
        <BackPatternInner />
        <BackCenterCircle>
          <HeartIcon>❤️</HeartIcon>
          <BackSubtext>MagHeart</BackSubtext>
        </BackCenterCircle>
        <BackShimmer />
      </CardFace>
    </CardContainer>
  );
}

const THEMES = {
  emerald: {
    bg: '#ecfdf5',
    text: '#059669',
    border: '#d1fae5',
    ring: '#a7f3d0',
    accent: '#10b981',
  },
  rose: {
    bg: '#fff1f2',
    text: '#e11d48',
    border: '#ffe4e6',
    ring: '#fecdd3',
    accent: '#f43f5e',
  },
  amber: {
    bg: '#fffbeb',
    text: '#d97706',
    border: '#fef3c7',
    ring: '#fde68a',
    accent: '#f59e0b',
  },
  violet: {
    bg: '#f5f3ff',
    text: '#7c3aed',
    border: '#ede9fe',
    ring: '#ddd6fe',
    accent: '#8b5cf6',
  },
  slate: {
    bg: '#f8fafc',
    text: '#475569',
    border: '#e2e8f0',
    ring: '#cbd5e1',
    accent: '#64748b',
  }
};

const SIZES = {
  small: { w: '140px', h: '200px', p: '12px' },
  medium: { w: '220px', h: '320px', p: '20px' },
  large: { w: '320px', h: '460px', p: '32px' },
};

const CardContainer = styled.div`
  width: ${({ $size }) => SIZES[$size].w};
  height: ${({ $size }) => SIZES[$size].h};
  position: relative;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  background: #ffffff;
  border-radius: 18px;
  filter: ${({ $isSelected }) => $isSelected ? 'brightness(1.05)' : 'brightness(1)'};
  
  /* Selection State */
  ${({ $isSelected, $theme }) => $isSelected && css`
    box-shadow: 
      0 0 0 4px #FDFCF8, 
      0 0 0 8px ${$theme.bg}, 
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 30px ${$theme.ring};
    border-color: transparent;
  `}

  ${({ $isSelected }) => !$isSelected && css`
    border: 2px solid #f1f5f9;
    box-shadow: 
      -5px 5px 20px rgba(0,0,0,0.08),
      0 10px 25px rgba(0,0,0,0.04);
    
    &:hover {
      border-color: #e2e8f0;
      box-shadow: 
        -5px 5px 25px rgba(0,0,0,0.12),
        0 15px 35px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }
  `}
`;

const CardFace = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 16px;
  background: ${({ $theme, $type }) =>
    $type === 'front' && $theme ? $theme.bg : '#ffffff'};
  overflow: hidden;
  transition: opacity 0.25s ease;

  ${({ $type, $isFaceUp }) => {
    const shouldShow = ($type === 'front' && $isFaceUp) || ($type === 'back' && !$isFaceUp);
    return css`
      opacity: ${shouldShow ? 1 : 0};
      pointer-events: ${shouldShow ? 'auto' : 'none'};
    `;
  }}
  
  ${({ $type }) => $type === 'back' && css`
    background: #1e293b;
    justify-content: center;
    align-items: center;
    border: 3px solid #334155;
  `}
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $theme, $isSelected }) => 
    $isSelected ? $theme.text : 'rgba(0, 0, 0, 0.5)'
  };
  margin: 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: ${({ $isSelected }) => $isSelected ? 1 : 0.7};
  transition: all 0.3s ease;
`;

const CheckBadge = styled.div`
  background: #10b981;
  color: white;
  padding: 6px;
  border-radius: 999px;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
  display: flex;
  animation: checkPop 0.3s ease-out;
  
  @keyframes checkPop {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;

const CardBody = styled.div`
  flex: 1;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
`;

const PromptText = styled.p`
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.6;
  color: ${({ $isSelected }) => $isSelected ? '#1f2937' : '#374151'};
  margin: 0;
  text-align: center;
  font-family: 'Georgia', serif;
  font-style: italic;
  position: relative;
  z-index: 1;
`;

// Front card decorations
const CornerDecoration = styled.div`
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: ${({ $theme }) => $theme.border};
  opacity: 0.4;
  z-index: 1;
  
  ${({ $position }) => {
    switch($position) {
      case 'top-left':
        return css`
          top: 8px;
          left: 8px;
          border-top: 2px solid;
          border-left: 2px solid;
          border-top-left-radius: 12px;
        `;
      case 'top-right':
        return css`
          top: 8px;
          right: 8px;
          border-top: 2px solid;
          border-right: 2px solid;
          border-top-right-radius: 12px;
        `;
      case 'bottom-left':
        return css`
          bottom: 8px;
          left: 8px;
          border-bottom: 2px solid;
          border-left: 2px solid;
          border-bottom-left-radius: 12px;
        `;
      case 'bottom-right':
        return css`
          bottom: 8px;
          right: 8px;
          border-bottom: 2px solid;
          border-right: 2px solid;
          border-bottom-right-radius: 12px;
        `;
      default:
        return '';
    }
  }}
`;

const BackgroundPattern = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: radial-gradient(circle at 20% 50%, ${({ $theme }) => $theme.accent} 1px, transparent 1px),
                    radial-gradient(circle at 80% 80%, ${({ $theme }) => $theme.accent} 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 0;
  pointer-events: none;
`;

const QuoteDecoration = styled.span`
  font-size: 6rem;
  font-family: Georgia, serif;
  color: rgba(0, 0, 0, 0.04);
  position: absolute;
  left: 20px;
  top: -10px;
  line-height: 1;
  z-index: 0;
`;

// Back card decorations
const BackOuterGlow = styled.div`
  /* Removed glow for cleaner look */
  display: none;
`;

const BackPatternOuter = styled.div`
  position: absolute;
  inset: 12px;
  border: 2px solid #475569;
  border-radius: 12px;
  opacity: 0.5;
`;

const BackPatternMiddle = styled.div`
  position: absolute;
  inset: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 10px;
`;

const BackPatternInner = styled.div`
  /* Simplified */
  display: none;
`;

const BackCenterCircle = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  background: #334155;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid #475569;
  z-index: 10;
`;

const HeartIcon = styled.div`
  font-size: 2.5rem;
  animation: heartbeat 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.8));
  
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    10%, 30% { transform: scale(1.1); }
    20%, 40% { transform: scale(0.95); }
  }
`;

const BackSubtext = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const BackShimmer = styled.div`
  /* Removed shimmer */
  display: none;
`;

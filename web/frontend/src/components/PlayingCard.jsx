import React from 'react';
import styled, { css } from 'styled-components';
import { Check } from 'lucide-react';

/**
 * PlayingCard
 * 
 * Replicating the visual style from example.html (Hand Card).
 * 
 * Props:
 * - title: string
 * - subtitle: string
 * - prompt: string (The main question, shown at bottom)
 * - icon: React.ComponentType (Lucide icon)
 * - colorTheme: 'emerald' | 'rose' | 'amber' | 'violet' (default: 'emerald')
 * - isSelected: boolean
 * - onClick: function
 * - size: 'small' | 'medium' | 'large'
 * - disabled: boolean
 * - isFaceUp: boolean (default: true)
 */
export default function PlayingCard({
  title,
  subtitle,
  prompt,
  icon: Icon,
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
      <CardFace $type="front">
        {/* Header: Icon + Check */}
        <CardHeader>
          <IconWrapper $theme={theme} $isSelected={isSelected}>
            {Icon && <Icon size={20} />}
          </IconWrapper>
          {isSelected && (
            <CheckBadge>
              <Check size={12} />
            </CheckBadge>
          )}
        </CardHeader>

        {/* Body: Title + Subtitle */}
        <CardBody>
          <CardTitle $isSelected={isSelected}>{title}</CardTitle>
          <CardSubtitle $isSelected={isSelected}>{subtitle}</CardSubtitle>
        </CardBody>

        {/* Footer: Question */}
        <CardFooter>
          {prompt}
        </CardFooter>
      </CardFace>

      <CardFace $type="back">
        <BackPattern />
        <BackLogo>✨</BackLogo>
      </CardFace>
    </CardContainer>
  );
}

const THEMES = {
  emerald: {
    bg: '#ecfdf5', // bg-emerald-50
    text: '#059669', // text-emerald-600
    border: '#d1fae5', // border-emerald-100
    ring: '#a7f3d0', // ring-emerald-200
  },
  rose: {
    bg: '#fff1f2', // bg-rose-50
    text: '#e11d48', // text-rose-600
    border: '#ffe4e6', // border-rose-100
    ring: '#fecdd3', // ring-rose-200
  },
  amber: {
    bg: '#fffbeb', // bg-amber-50
    text: '#d97706', // text-amber-600
    border: '#fef3c7', // border-amber-100
    ring: '#fde68a', // ring-amber-200
  },
  violet: {
    bg: '#f5f3ff', // bg-violet-50
    text: '#7c3aed', // text-violet-600
    border: '#ede9fe', // border-violet-100
    ring: '#ddd6fe', // ring-violet-200
  },
  slate: { // Default fallback
    bg: '#f8fafc',
    text: '#475569',
    border: '#e2e8f0',
    ring: '#cbd5e1',
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
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.3s;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  background: #ffffff;
  border-radius: 16px;
  
  /* Selection State: similar to example.html ring-4 */
  ${({ $isSelected, $theme }) => $isSelected && css`
    box-shadow: 0 0 0 4px #FDFCF8, 0 0 0 8px ${$theme.bg}, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: transparent;
  `}

  ${({ $isSelected }) => !$isSelected && css`
    border: 2px solid #f1f5f9; /* border-slate-100 */
    box-shadow: -5px 5px 15px rgba(0,0,0,0.05);
    
    &:hover {
      border-color: #e2e8f0; /* border-slate-200 */
    }
  `}

  transform: ${({ $isFaceUp }) => $isFaceUp ? 'rotateY(0deg)' : 'rotateY(180deg)'};
`;

const CardFace = styled.div`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  
  ${({ $type }) => $type === 'back' && css`
    transform: rotateY(180deg);
    background: linear-gradient(135deg, #1e293b, #0f172a);
    justify-content: center;
    align-items: center;
    border: 2px solid #334155;
  `}
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const IconWrapper = styled.div`
  padding: 10px;
  border-radius: 12px;
  transition: background-color 0.2s;
  background-color: ${({ $isSelected, $theme }) => $isSelected ? 'rgba(255,255,255,0.6)' : '#f8fafc'};
  color: ${({ $isSelected, $theme }) => $isSelected ? $theme.text : '#94a3b8'}; /* text-slate-400 */
  
  ${({ $isSelected, $theme }) => $isSelected && css`
    background-color: ${$theme.bg};
    color: ${$theme.text};
  `}
`;

const CheckBadge = styled.div`
  background-color: #10b981; /* bg-green-500 */
  color: white;
  padding: 4px;
  border-radius: 999px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
`;

const CardBody = styled.div`
  margin-top: 16px;
  flex: 1;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ $isSelected }) => $isSelected ? 'inherit' : '#334155'}; /* text-slate-700 */
  margin: 0;
`;

const CardSubtitle = styled.p`
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 4px;
  color: ${({ $isSelected }) => $isSelected ? 'rgba(0,0,0,0.6)' : '#94a3b8'}; /* text-slate-400 */
`;

const CardFooter = styled.div`
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.05);
  font-size: 0.8rem;
  line-height: 1.5;
  color: #475569;
  font-family: serif; /* font-serif */
  opacity: 0.8;
`;

const BackPattern = styled.div`
  position: absolute;
  inset: 6px;
  border: 2px dashed rgba(255,255,255,0.2);
  border-radius: 12px;
  opacity: 0.5;
`;

const BackLogo = styled.div`
  font-size: 2rem;
`;

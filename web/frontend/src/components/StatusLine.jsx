import React from 'react'
import styled, { css } from 'styled-components'
import { useHeartRate } from '../pages/HeartRateProvider.jsx'

export default function StatusLine() {
  const { status } = useHeartRate()
  return <Line $tone={status.tone}>{status.text}</Line>
}

// CSS below JS
const toneColor = {
  ok: '#059669',
  warn: '#d97706',
  err: '#dc2626',
}

const Line = styled.div`
  color: #6b7280;
  ${({ $tone }) => $tone && css`color: ${toneColor[$tone] || '#6b7280'};`}
`

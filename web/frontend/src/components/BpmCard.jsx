import React from 'react'
import styled from 'styled-components'
import { useHeartRate } from '../pages/HeartRateProvider.jsx'

// JS first: data + render
function BpmCardView({ components }) {
  const { bpm, ts } = useHeartRate()
  const { Card, Bpm, Meta, Footer } = components
  return (
    <Card>
      <Bpm>{String(bpm)}</Bpm>
      <Meta>ts: {ts}</Meta>
      <Footer>Tip: add ?userId=YOUR_ID to the URL</Footer>
    </Card>
  )
}

// CSS (styled-components) below the JS
const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  background: #fff;
`

const Bpm = styled.div`
  font-size: 56px;
  font-weight: 700;
  margin: 8px 0;
`

const Meta = styled.div`
  color: #6b7280;
`

const Footer = styled.div`
  margin-top: 12px;
  font-size: 12px;
  color: #9ca3af;
`

export default function BpmCard() {
  return <BpmCardView components={{ Card, Bpm, Meta, Footer }} />
}

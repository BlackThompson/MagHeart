import React from 'react'
import styled from 'styled-components'
import { HeartRateProvider } from './pages/HeartRateProvider.jsx'
import StatusLine from './components/StatusLine.jsx'
import BpmCard from './components/BpmCard.jsx'
import UserIdBar from './components/UserIdBar.jsx'

export default function App() {
  const [userId, setUserId] = React.useState(() => new URLSearchParams(location.search).get('userId') || 'demo')

  const applyUserId = (id) => {
    setUserId(id)
    const url = new URL(location.href)
    url.searchParams.set('userId', id)
    history.replaceState({}, '', url.toString())
  }

  return (
    <AppWrap>
      <Title>MagHeart Live</Title>
      <UserIdBar userId={userId} onChange={applyUserId} />
      <HeartRateProvider userId={userId}>
        <Stack>
          <StatusLine />
          <BpmCard />
        </Stack>
      </HeartRateProvider>
    </AppWrap>
  )
}

// CSS below JS
const AppWrap = styled.div`
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  margin: 24px;
`

const Title = styled.h1`
  margin-bottom: 16px;
`

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

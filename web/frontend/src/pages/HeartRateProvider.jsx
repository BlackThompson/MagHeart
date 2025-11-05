import React from 'react'

const HeartRateContext = React.createContext(null)

function tsToStr(ts) {
  try { return new Date(Number(ts)).toLocaleTimeString(); } catch { return String(ts); }
}

export function HeartRateProvider({ userId, children }) {
  const [status, setStatus] = React.useState({ text: 'Connecting…', tone: 'meta' })
  const [bpm, setBpm] = React.useState('--')
  const [ts, setTs] = React.useState('--')
  const esRef = React.useRef(null)
  const reconnectTimer = React.useRef(null)

  React.useEffect(() => {
    if (!userId) return
    const connect = () => {
      if (esRef.current) {
        try { esRef.current.close() } catch {}
        esRef.current = null
      }
      const base = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || ''
      const url = `${base}/events?userId=${encodeURIComponent(userId)}`
      const es = new EventSource(url)
      esRef.current = es
      setStatus({ text: `Connected as ${userId}`, tone: 'ok' })

      es.addEventListener('hr', (ev) => {
        try {
          const data = JSON.parse(ev.data)
          setBpm(data?.bpm ?? '--')
          setTs(tsToStr(data?.ts))
        } catch (e) {
          console.error('Parse error', e)
        }
      })

      es.onerror = () => {
        setStatus({ text: 'Disconnected, retrying…', tone: 'warn' })
        try { es.close() } catch {}
        reconnectTimer.current = setTimeout(connect, 1500)
      }
    }

    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (esRef.current) esRef.current.close()
    }
  }, [userId])

  const value = React.useMemo(() => ({ bpm, ts, status }), [bpm, ts, status])
  return (
    <HeartRateContext.Provider value={value}>
      {children}
    </HeartRateContext.Provider>
  )
}

export function useHeartRate() {
  const ctx = React.useContext(HeartRateContext)
  if (!ctx) throw new Error('useHeartRate must be used within HeartRateProvider')
  return ctx
}

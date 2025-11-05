import React from 'react'
import styled from 'styled-components'

export default function UserIdBar({ userId, onChange }) {
  const [val, setVal] = React.useState(userId || '')

  React.useEffect(() => { setVal(userId || '') }, [userId])

  const apply = () => onChange(val || 'demo')
  const onKey = (e) => { if (e.key === 'Enter') apply() }

  return (
    <Bar>
      <span>User:</span>
      <Input value={val} onChange={e => setVal(e.target.value)} onKeyDown={onKey} placeholder="demo" />
      <Btn onClick={apply}>Apply</Btn>
    </Bar>
  )
}

// CSS below JS
const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`

const Input = styled.input`
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`

const Btn = styled.button`
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #111827;
  color: #fff;
`

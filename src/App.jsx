import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import useWorkoutData from './hooks/useWorkoutData'
import AuthGate from './components/layout/AuthGate'
import BottomNav from './components/layout/BottomNav'
import WorkoutsTab from './components/tabs/WorkoutsTab'
import ExercisesTab from './components/tabs/ExercisesTab'
import TodayTab from './components/tabs/TodayTab'
import StatsTab from './components/tabs/StatsTab'
import AccountTab from './components/tabs/AccountTab'
import './App.css'

function App() {
  const [user, setUser] = useState(undefined)
  const [tab, setTab] = useState('today')
  const [start, setStart] = useState(null)

  const { exercises, sessions, history, notice, setNotice, refresh } = useWorkoutData(user)

  useEffect(() => onAuthStateChanged(auth, (next) => setUser(next || null)), [])

  const content = useMemo(() => {
    if (!user) return null
    const props = {
      uid: user.uid,
      exercises,
      sessions,
      history,
      refresh,
      setNotice,
      refreshHistory: refresh,
    }
    if (tab === 'exercises') return <ExercisesTab {...props} />
    if (tab === 'sessions') {
      return (
        <WorkoutsTab
          {...props}
          startSession={(session) => {
            setStart(session)
            setTab('today')
          }}
        />
      )
    }
    if (tab === 'stats') return <StatsTab {...props} />
    if (tab === 'account') return <AccountTab {...props} user={user} />
    return <TodayTab {...props} initialSession={start} />
  }, [tab, user, exercises, sessions, history, start, refresh, setNotice])

  if (user === undefined) return <div className="loading">Chargement...</div>
  if (!user) return <AuthGate />

  return (
    <div className="app-shell pt-[env(safe-area-inset-top)]">
      {content}
      {notice && <div className="toast">{notice}</div>}
      <BottomNav
        activeTab={tab}
        onSelectTab={(id) => {
          setStart(null)
          setTab(id)
        }}
      />
    </div>
  )
}

export default App

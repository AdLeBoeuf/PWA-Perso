import { useCallback, useEffect, useState } from 'react'
import { auth } from '../firebase'
import { listUserData } from '../services/workoutService'

export function useWorkoutData(user) {
  const [exercises, setExercises] = useState([])
  const [sessions, setSessions] = useState([])
  const [history, setHistory] = useState([])
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const uid = user?.uid || auth.currentUser?.uid
    if (!uid) return
    const [e, s, h] = await Promise.all([
      listUserData('exercises', uid),
      listUserData('sessions', uid),
      listUserData('history', uid),
    ])
    setExercises(e)
    setSessions(s)
    setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }, [user])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    Promise.all([
      listUserData('exercises', user.uid),
      listUserData('sessions', user.uid),
      listUserData('history', user.uid),
    ])
      .then(([e, s, h]) => {
        if (!active) return
        setExercises(e)
        setSessions(s)
        setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)))
      })
      .catch(() => {
        if (active) setNotice('Impossible de charger tes données.')
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  return {
    exercises,
    sessions,
    history,
    notice,
    setNotice,
    refresh,
  }
}

export default useWorkoutData

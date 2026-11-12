import { useState } from 'react'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, authPersistenceReady } from '../../firebase'
import { errorLabel } from '../../utils/formatters'
import Button from '../common/Button'

export function AuthGate() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await authPersistenceReady
      if (mode === 'login') await signInWithEmailAndPassword(auth, form.email, form.password)
      else await createUserWithEmailAndPassword(auth, form.email, form.password)
    } catch (firebaseError) {
      setError(errorLabel(firebaseError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="brand-mark"><Dumbbell size={26} /></div>
      <p className="eyebrow">PRIVATE TRAINING</p>
      <h1>Ton entraînement.<br /><span>Ta progression.</span></h1>
      <form className="card auth-card" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Connexion</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Inscription</button>
        </div>
        <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="toi@exemple.com" /></label>
        <label>Mot de passe<input required minLength="6" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></label>
        {error && <p className="error">{error}</p>}
        <Button disabled={busy}>{busy ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <ChevronRight size={18} /></Button>
      </form>
    </main>
  )
}

export default AuthGate


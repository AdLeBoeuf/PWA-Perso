import { Dumbbell } from 'lucide-react'

export function Empty({ text }) {
  return (
    <div className="empty">
      <Dumbbell size={24} />
      <p>{text}</p>
    </div>
  )
}

export default Empty

import { ArrowLeft } from 'lucide-react'

export function Page({ title, subtitle, back, children }) {
  return (
    <main className="page">
      <header className="page-header">
        {back && (
          <button className="back" onClick={back} aria-label="Retour">
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h1>{title}</h1>
        </div>
      </header>
      {children}
    </main>
  )
}

export default Page

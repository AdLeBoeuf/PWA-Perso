import { tabs } from '../../constants/navigation'

export function BottomNav({ activeTab, onSelectTab }) {
  return (
    <nav className="bottom-nav mx-4 mb-6 rounded-3xl border border-gray-800 shadow-xl py-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={activeTab === id ? 'active' : ''}
          onClick={() => onSelectTab(id)}
        >
          <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav


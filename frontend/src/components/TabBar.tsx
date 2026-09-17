import { useEffect } from 'react'
import type { Tab } from '../types/note'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
}

export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab }: TabBarProps) {
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w' && activeTabId) {
        e.preventDefault()
        onCloseTab(activeTabId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId, onCloseTab])

  return (
    <nav id="tabbar">
      <div id="tabList">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={'tab' + (tab.id === activeTabId ? ' active' : '')}
            onClick={() => onSelectTab(tab.id)}
            onMouseDown={e => {
              if (e.button === 1) {
                e.preventDefault()
                onCloseTab(tab.id)
              }
            }}
          >
            {tab.type === 'graph' && <span className="tab-icon">🕸️</span>}
            {tab.type === 'new' && <span className="tab-icon">✨</span>}
            <span className="tab-label">{tab.title}</span>
            <span className="tab-close" onClick={e => { e.stopPropagation(); onCloseTab(tab.id) }}>×</span>
          </div>
        ))}
      </div>
    </nav>
  )
}
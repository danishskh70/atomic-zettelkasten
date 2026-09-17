interface RibbonProps {
  onGraphClick: () => void
  onNewClick: () => void
}

export default function Ribbon({ onGraphClick, onNewClick }: RibbonProps) {
  return (
    <aside id="ribbon">
      <button className="ribbon-icon" onClick={onGraphClick} title="Graph">🕸️</button>
      <button className="ribbon-icon" onClick={onNewClick} title="New note (Ctrl+N)">➕</button>
      <div className="ribbon-spacer"></div>
    </aside>
  )
}
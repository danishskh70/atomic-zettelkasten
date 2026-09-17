export default function Welcome() {
  return (
    <div id="welcome">
      <h2>Zettelkasten</h2>
      <p>Click a note in the sidebar to open it, or press + in the tab bar to create a new one. Click 🕸️ to open the graph.</p>
      <ul className="shortcut-list">
        <li><kbd>Ctrl</kbd> + <kbd>N</kbd> — new note</li>
        <li><kbd>Ctrl</kbd> + <kbd>W</kbd> — close active tab</li>
        <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> — save new note</li>
        <li>Middle-click a tab — close it</li>
      </ul>
    </div>
  )
}
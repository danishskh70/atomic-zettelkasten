import { useEffect } from "react";
import { useNotes } from "./hooks/useNotes";
import Ribbon from "./components/Ribbon";
import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import Welcome from "./components/Welcome";
import NoteView from "./components/NoteView";
import NewNoteForm from "./components/NewNoteForm";
import GraphView from "./components/GraphView";

function App() {
  const {
    notes,
    tabs,
    activeTabId,
    lastNoteId,
    loadNotes,
    addNote,
    editNote,
    removeNote,
    openNoteTab,
    openGraphTab,
    openNewNoteTab,
    closeTab,
    setActiveTabId,
  } = useNotes();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNote =
    activeTab?.type === "note"
      ? notes.find((n) => n.id === activeTab.noteId)
      : null;

  return (
    <div id="app">
      <Ribbon onGraphClick={openGraphTab} onNewClick={openNewNoteTab} />
      <Sidebar
        notes={notes}
        activeNoteId={
          activeTab?.type === "note" ? (activeTab.noteId ?? null) : null
        }
        onSelectNote={openNoteTab}
        onDeleteNote={removeNote}
      />
      <main id="main">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
        />
        <section id="content">
          {!activeTab && <Welcome />}
          {activeTab?.type === "note" && activeNote && (
            <NoteView note={activeNote} onEdit={editNote} />
          )}
          {activeTab?.type === "new" && (
            <NewNoteForm
              onSave={addNote}
              onCancel={() => closeTab("__new__")}
            />
          )}
          <div
            style={{
              display: activeTab?.type === "graph" ? "contents" : "none",
            }}
          >
            <GraphView notes={notes} onSelectNote={openNoteTab} activeNoteId={lastNoteId} isActive={activeTab?.type === 'graph'} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

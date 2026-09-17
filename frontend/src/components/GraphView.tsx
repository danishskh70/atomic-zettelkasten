import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide, forceX, forceY } from "d3-force";
import type { Note } from "../types/note";

interface GraphViewProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  activeNoteId: number | null;
  isActive: boolean;
}

interface GraphNode {
  id: number;
  name: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: number;
  target: number;
}

function computeLinks(notes: Note[]): GraphLink[] {
  const byTitle = new Map(notes.map((n) => [n.title, n.id]));
  const out: GraphLink[] = [];
  notes.forEach((n) => {
    const matches = (n.content || "").matchAll(/\[\[(.*?)\]\]/g);
    for (const m of matches) {
      // Support [[Target]] and [[Target|Display Alias]] — only the part
      // before the pipe is the actual note title to resolve.
      const target = m[1].split("|")[0].trim();
      const targetId = byTitle.get(target);
      if (targetId && targetId !== n.id)
        out.push({ source: n.id, target: targetId });
    }
  });
  return out;
}

function buildAdjacency(links: GraphLink[]): Map<number, Set<number>> {
  const adjacency = new Map<number, Set<number>>();
  links.forEach((l) => {
    if (!adjacency.has(l.source)) adjacency.set(l.source, new Set());
    if (!adjacency.has(l.target)) adjacency.set(l.target, new Set());
    adjacency.get(l.source)!.add(l.target);
    adjacency.get(l.target)!.add(l.source);
  });
  return adjacency;
}

function localSubgraph(
  rootId: number,
  allLinks: GraphLink[],
  depth: number,
): Set<number> {
  const adjacency = buildAdjacency(allLinks);
  const visited = new Set<number>([rootId]);
  let frontier = [rootId];
  for (let d = 0; d < depth; d++) {
    const next: number[] = [];
    frontier.forEach((id) => {
      adjacency.get(id)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.push(neighbor);
        }
      });
    });
    frontier = next;
  }
  return visited;
}

function degreeMap(links: GraphLink[]): Map<number, number> {
  const deg = new Map<number, number>();
  links.forEach((l) => {
    deg.set(l.source, (deg.get(l.source) || 0) + 1);
    deg.set(l.target, (deg.get(l.target) || 0) + 1);
  });
  return deg;
}

export default function GraphView({
  notes,
  onSelectNote,
  activeNoteId,
  isActive,
}: GraphViewProps) {
  const fgRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinnedPositions = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const hasFittedRef = useRef<string | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [mode, setMode] = useState<"global" | "local">("global");
  const [depth, setDepth] = useState(1);
  const [query, setQuery] = useState("");
  const [hoverNode, setHoverNode] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Obsidian-style tunables
  const [repelStrength, setRepelStrength] = useState(-120);
  const [linkDistance, setLinkDistance] = useState(60);
  const [centerStrength, setCenterStrength] = useState(0.3);
  const [showArrows, setShowArrows] = useState(false);
  const [alwaysShowLabels, setAlwaysShowLabels] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      setDims({ width: w, height: h });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const el = wrapperRef.current;
    if (!el) return;
    setDims({ width: el.clientWidth, height: el.clientHeight });
    const t = setTimeout(() => {
      fgRef.current?.d3ReheatSimulation();
      fgRef.current?.zoomToFit(400, 40);
    }, 300);
    return () => clearTimeout(t);
  }, [isActive]);

  const allLinks = useMemo(() => computeLinks(notes), [notes]);
  const degrees = useMemo(() => degreeMap(allLinks), [allLinks]);
  const orphanIds = useMemo(
    () => new Set(notes.filter((n) => !degrees.get(n.id)).map((n) => n.id)),
    [notes, degrees],
  );
  const maxDegree = useMemo(
    () => Math.max(1, ...Array.from(degrees.values())),
    [degrees],
  );

  const graphData = useMemo(() => {
    let visibleNotes = notes;

    if (mode === "local" && activeNoteId != null) {
      const idsInScope = localSubgraph(activeNoteId, allLinks, depth);
      visibleNotes = notes.filter((n) => idsInScope.has(n.id));
    }

    const visibleIds = new Set(visibleNotes.map((n) => n.id));
    const links = allLinks
      .filter((l) => visibleIds.has(l.source) && visibleIds.has(l.target))
      .map((l) => ({ source: l.source, target: l.target })); // clone, avoid mutation carryover
    const nodes: GraphNode[] = visibleNotes.map((n) => {
      const pinned = pinnedPositions.current.get(n.id);
      return pinned
        ? {
            id: n.id,
            name: n.title,
            fx: pinned.x,
            fy: pinned.y,
            x: pinned.x,
            y: pinned.y,
          }
        : { id: n.id, name: n.title };
    });

    return { nodes, links };
    console.log("links", links, "nodes", nodes.length);
  }, [notes, allLinks, mode, depth, activeNoteId]);

  const matchedIds = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return new Set(
      notes.filter((n) => n.title.toLowerCase().includes(q)).map((n) => n.id),
    );
  }, [query, notes]);

  const connectedToHover = useMemo(() => {
    if (hoverNode == null) return null;
    const set = new Set<number>([hoverNode]);
    graphData.links.forEach((l: any) => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      if (s === hoverNode) set.add(t);
      if (t === hoverNode) set.add(s);
    });
    return set;
  }, [hoverNode, graphData]);

  const shapeKey =
    graphData.nodes
      .map((n: GraphNode) => n.id)
      .sort()
      .join(",") +
    "|" +
    graphData.links.length;

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !dims) return;

    fg.d3Force("charge").strength(repelStrength);
    fg.d3Force("link").distance(linkDistance);
    fg.d3Force("collide", forceCollide(18));
    // forceCenter only nudges the *average* node position — a pinned node or
    // asymmetric repel can still let the visible cluster drift off-screen
    // while the "average" stays technically centered. Per-node forceX/forceY
    // is what Obsidian actually uses: every node gets a constant, gentle pull
    // toward the middle regardless of what else is happening, so nothing can
    // wander off on its own.
    fg.d3Force("center", null);
    fg.d3Force("x", forceX(dims.width / 2).strength(centerStrength));
    fg.d3Force("y", forceY(dims.height / 2).strength(centerStrength));

    fg.d3ReheatSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeKey, dims, repelStrength, linkDistance, centerStrength]);

  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node ? node.id : null);
  }, []);

  const handleCenterOnActive = useCallback(() => {
    const fg = fgRef.current;
    if (!fg || activeNoteId == null) return;
    setTimeout(() => {
      const graphNodes = fgRef.current?.graphData()?.nodes as
        | GraphNode[]
        | undefined;
      const target = graphNodes?.find((n) => n.id === activeNoteId);
      if (target && target.x != null && target.y != null) {
        fgRef.current.centerAt(target.x, target.y, 600);
        fgRef.current.zoom(2.2, 600);
      }
    }, 50);
  }, [activeNoteId]);

  const handleResetView = useCallback(() => {
    fgRef.current?.zoomToFit(400, 40);
  }, []);

  // Drag-to-pin: node stays wherever it's dropped, like Obsidian. Right-click
  // (or the "Unpin all" button) releases it back to the simulation.
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
    pinnedPositions.current.set(node.id, { x: node.x, y: node.y });
  }, []);

  const handleNodeRightClick = useCallback((node: any) => {
    node.fx = undefined;
    node.fy = undefined;
    pinnedPositions.current.delete(node.id);
    fgRef.current?.d3ReheatSimulation();
  }, []);

  const handleUnpinAll = useCallback(() => {
    pinnedPositions.current.clear();
    const fg = fgRef.current;
    if (!fg) return;
    const currentNodes = fg.graphData().nodes as GraphNode[];
    currentNodes.forEach((n) => {
      n.fx = undefined;
      n.fy = undefined;
    });
    fg.d3ReheatSimulation();
  }, []);

  const NODE_RADIUS = 3.0;
  const hasPinned = pinnedPositions.current.size > 0;

  return (
    <div id="graphView">
      <div id="graphToolbar">
        <span>
          Drag to pan · Scroll to zoom · Drag a node to pin it · Right-click to
          unpin
        </span>
        <span className="graph-node-count">{graphData.nodes.length} nodes</span>
        {orphanIds.size > 0 && (
          <span
            className="graph-orphan-count"
            title="Notes with no links in or out"
          >
            {orphanIds.size} orphan{orphanIds.size === 1 ? "" : "s"}
          </span>
        )}
        <input
          placeholder="Filter graph…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: "160px", marginBottom: 0 }}
        />
        <button
          className="icon-btn"
          onClick={() => setMode((m) => (m === "global" ? "local" : "global"))}
          disabled={activeNoteId == null}
          title={activeNoteId == null ? "Open a note first" : ""}
        >
          {mode === "global" ? "Show local graph" : "Show global graph"}
        </button>
        {mode === "local" && (
          <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Depth:
            <input
              type="range"
              min={1}
              max={4}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              style={{
                marginLeft: "6px",
                width: "80px",
                verticalAlign: "middle",
              }}
            />{" "}
            {depth}
          </label>
        )}
        <button
          className="icon-btn"
          onClick={handleCenterOnActive}
          disabled={activeNoteId == null}
          title={
            activeNoteId == null ? "Open a note first" : "Center on active note"
          }
        >
          Center active
        </button>
        {hasPinned && (
          <button
            className="icon-btn"
            onClick={handleUnpinAll}
            title="Release all pinned nodes"
          >
            Unpin all
          </button>
        )}
        <button className="icon-btn" onClick={handleResetView}>
          Reset view
        </button>
        <button
          className={"icon-btn" + (showSettings ? " active" : "")}
          onClick={() => setShowSettings((s) => !s)}
          title="Graph settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div id="graphSettings">
          <div className="settings-row">
            <label>Repel force</label>
            <input
              type="range"
              min={-400}
              max={-20}
              step={10}
              value={repelStrength}
              onChange={(e) => setRepelStrength(Number(e.target.value))}
            />
          </div>
          <div className="settings-row">
            <label>Link distance</label>
            <input
              type="range"
              min={20}
              max={200}
              step={5}
              value={linkDistance}
              onChange={(e) => setLinkDistance(Number(e.target.value))}
            />
          </div>
          <div className="settings-row">
            <label>Center pull</label>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={centerStrength}
              onChange={(e) => setCenterStrength(Number(e.target.value))}
            />
          </div>
          <div className="settings-row">
            <label>
              <input
                type="checkbox"
                checked={showArrows}
                onChange={(e) => setShowArrows(e.target.checked)}
              />{" "}
              Show arrows
            </label>
          </div>
          <div className="settings-row">
            <label>
              <input
                type="checkbox"
                checked={alwaysShowLabels}
                onChange={(e) => setAlwaysShowLabels(e.target.checked)}
              />{" "}
              Always show labels
            </label>
          </div>
        </div>
      )}

      <div id="graph" ref={wrapperRef}>
        {dims && (
          <ForceGraph2D
            ref={fgRef}
            width={dims.width}
            height={dims.height}
            graphData={graphData}
            cooldownTime={1000}
            d3AlphaDecay={0.1}
            d3VelocityDecay={0.5}
            warmupTicks={50}
            minZoom={0.3}
            maxZoom={6}
            backgroundColor="transparent"
            onEngineStop={() => {
              // Only auto-fit once per distinct graph shape (new/removed nodes
              // or links). Without this guard, every reheat — slider tweak,
              // hover, unpin — re-triggers zoomToFit and the camera jumps,
              // which reads as the whole graph "drifting".
              if (hasFittedRef.current !== shapeKey) {
                fgRef.current?.zoomToFit(400, 40);
                hasFittedRef.current = shapeKey;
              }
            }}
            onNodeHover={handleNodeHover}
            onNodeDragEnd={handleNodeDragEnd}
            onNodeRightClick={handleNodeRightClick}
            linkDirectionalArrowLength={showArrows ? 4 : 0}
            linkDirectionalArrowRelPos={1}
            linkColor={(l: any) => {
              const s = typeof l.source === "object" ? l.source.id : l.source;
              const t = typeof l.target === "object" ? l.target.id : l.target;
              if (
                connectedToHover &&
                connectedToHover.has(s) &&
                connectedToHover.has(t)
              ) {
                return "rgba(147,133,245,0.9)";
              }
              return "rgba(150,150,190,0.22)";
            }}
            linkWidth={(l: any) => {
              const s = typeof l.source === "object" ? l.source.id : l.source;
              const t = typeof l.target === "object" ? l.target.id : l.target;
              if (
                connectedToHover &&
                connectedToHover.has(s) &&
                connectedToHover.has(t)
              )
                return 1.8;
              return 1;
            }}
            onNodeClick={(node: any) => {
              const note = notes.find((n) => n.id === node.id);
              if (note) onSelectNote(note);
            }}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const fontSize = 9 / globalScale;
              const isActive = node.id === activeNoteId;
              const isHovered = hoverNode === node.id;
              const isDimmed =
                connectedToHover && !connectedToHover.has(node.id);
              const isSearchDimmed = matchedIds && !matchedIds.has(node.id);
              const isOrphan = orphanIds.has(node.id);
              const isPinned = node.fx != null;
              const degree = degrees.get(node.id) || 0;
              const hubBoost = (degree / maxDegree) * 2.5;
              const radius =
                (isHovered ? NODE_RADIUS * 1.3 : NODE_RADIUS) + hubBoost;

              ctx.globalAlpha = isDimmed || isSearchDimmed ? 0.2 : 1;

              ctx.fillStyle = isActive
                ? "#9385f5"
                : isOrphan
                  ? "#e05d5d"
                  : isHovered
                    ? "#b0c6ff"
                    : "#dcdde0";
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fill();

              if (isOrphan) {
                ctx.setLineDash([1.5, 1.5]);
                ctx.strokeStyle = "#e05d5d";
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 1.5, 0, 2 * Math.PI, false);
                ctx.stroke();
                ctx.setLineDash([]);
              }

              if (isPinned) {
                ctx.strokeStyle = "#f5a623";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI, false);
                ctx.stroke();
              }

              if (
                alwaysShowLabels ||
                globalScale > 1.2 ||
                isHovered ||
                isActive
              ) {
                ctx.font = `${fontSize}px Inter, sans-serif`;
                ctx.fillStyle = "#8a8a94";
                ctx.textAlign = "center";
                ctx.fillText(node.name, node.x, node.y + fontSize + radius + 2);
              }

              ctx.globalAlpha = 1;
            }}
          />
        )}
      </div>
      <div id="graphLegend">
        <span>
          <i className="legend-dot legend-active" /> Active note
        </span>
        <span>
          <i className="legend-dot legend-hover" /> Hovered
        </span>
        <span>
          <i className="legend-dot legend-orphan" /> Orphan (unlinked)
        </span>
        <span>
          <i className="legend-ring" /> Pinned (dragged)
        </span>
        <span>
          <i className="legend-dot legend-default" /> Note (size = link count)
        </span>
      </div>
    </div>
  );
}

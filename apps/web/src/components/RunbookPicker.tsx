import { useEffect, useState } from "react";
import { api } from "../api";

type RunbookMeta = { slug: string; filename: string; title: string };

function parseSelected(value: string | null | undefined): Set<string> {
  const set = new Set<string>();
  for (const part of (value ?? "").split(/[\n,]+/)) {
    const t = part.trim();
    if (!t) continue;
    const inParens = t.match(/\(([a-z0-9-]+)\.md\)/i);
    if (inParens) {
      set.add(inParens[1].toLowerCase());
      continue;
    }
    if (/^[a-z0-9-]+(?:\.md)?$/i.test(t)) {
      set.add(t.replace(/\.md$/i, "").toLowerCase());
    }
  }
  return set;
}

function serializeSelected(slugs: Set<string>, catalog: RunbookMeta[]): string {
  return catalog
    .filter((r) => slugs.has(r.slug))
    .map((r) => `${r.title} (${r.filename})`)
    .join("\n");
}

export function RunbookPicker({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}) {
  const [catalog, setCatalog] = useState<RunbookMeta[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewSlug, setViewSlug] = useState<string | null>(null);
  const [viewTitle, setViewTitle] = useState("");
  const [viewBody, setViewBody] = useState("");
  const [viewBusy, setViewBusy] = useState(false);

  useEffect(() => {
    api<RunbookMeta[]>("/api/runbooks")
      .then(setCatalog)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Gagal memuat"));
  }, []);

  const selected = parseSelected(value);

  function toggle(slug: string) {
    if (!catalog.length) return;
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange(serializeSelected(next, catalog) || null);
  }

  async function openView(slug: string) {
    setViewBusy(true);
    setViewSlug(slug);
    setViewBody("");
    try {
      const doc = await api<{ title: string; content: string }>(
        `/api/runbooks/${slug}`,
      );
      setViewTitle(doc.title);
      setViewBody(doc.content);
    } catch (e) {
      setViewTitle(slug);
      setViewBody(e instanceof Error ? e.message : "Gagal memuat runbook");
    } finally {
      setViewBusy(false);
    }
  }

  return (
    <div className="runbook-picker">
      <label>Related runbooks</label>
      <p className="muted" style={{ marginTop: 0 }}>
        Pilih dari docs/runbooks — centang untuk menautkan, Lihat untuk membuka isi.
      </p>
      {loadError && <p className="error">{loadError}</p>}
      {!loadError && !catalog.length && (
        <p className="muted">Tidak ada runbook di docs/runbooks</p>
      )}
      <ul className="runbook-list">
        {catalog.map((r) => (
          <li key={r.slug}>
            <label className="runbook-item">
              <input
                type="checkbox"
                checked={selected.has(r.slug)}
                onChange={() => toggle(r.slug)}
              />
              <span>{r.title}</span>
            </label>
            <button
              type="button"
              className="secondary"
              style={{ padding: "0.25rem 0.55rem", fontSize: "0.8rem" }}
              onClick={() => void openView(r.slug)}
            >
              Lihat
            </button>
          </li>
        ))}
      </ul>
      {viewSlug && (
        <div className="runbook-viewer">
          <div className="runbook-viewer-head">
            <strong>{viewBusy ? "Memuat…" : viewTitle}</strong>
            <button
              type="button"
              className="secondary"
              style={{ padding: "0.25rem 0.55rem", fontSize: "0.8rem" }}
              onClick={() => setViewSlug(null)}
            >
              Tutup
            </button>
          </div>
          <pre className="runbook-viewer-body">{viewBody}</pre>
        </div>
      )}
    </div>
  );
}

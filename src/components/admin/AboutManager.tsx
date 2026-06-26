"use client";

import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AboutMoiManager from "./AboutMoiManager";

type Word = { text: string; img: string | null };
type GearItem = { icon: string; name: string; category: string };
type Galerie = { title: string; body: string };
type Vision = { title: string; lead: string; words: Word[]; close: string };
type Gear = { title: string; description: string; items: GearItem[] };

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <p className="text-sm admin-text-muted mt-1">{hint}</p>
    </div>
  );
}

function SaveButton({
  saving,
  onClick,
}: {
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="admin-button flex items-center justify-center"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
    </button>
  );
}

export default function AboutManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [galerie, setGalerie] = useState<Galerie>({ title: "", body: "" });
  const [vision, setVision] = useState<Vision>({
    title: "",
    lead: "",
    words: [],
    close: "",
  });
  const [gear, setGear] = useState<Gear>({
    title: "",
    description: "",
    items: [],
  });
  const [visionFiles, setVisionFiles] = useState<Record<number, File | null>>(
    {},
  );

  useEffect(() => {
    fetch("/api/about-content")
      .then((r) => r.json())
      .then((d) => {
        if (d.galerie) setGalerie(d.galerie);
        if (d.vision) setVision({ ...d.vision, words: d.vision.words ?? [] });
        if (d.gear) setGear({ ...d.gear, items: d.gear.items ?? [] });
      })
      .catch(() => toast.error("Failed to load About content"))
      .finally(() => setLoading(false));
  }, []);

  const saveSection = async (
    section: string,
    // biome-ignore lint/suspicious/noExplicitAny: section payload varies
    data: any,
    files?: Record<number, File | null>,
  ) => {
    setSaving(section);
    const fd = new FormData();
    fd.append("section", section);
    fd.append("data", JSON.stringify(data));
    if (files) {
      for (const [i, f] of Object.entries(files))
        if (f) fd.append(`vimg${i}`, f);
    }
    try {
      const res = await fetch("/api/about-content", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error();
      const out = await res.json();
      if (section === "vision" && out.data) {
        setVision({ ...out.data, words: out.data.words ?? [] });
        setVisionFiles({});
      }
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin" style={{ color: "var(--text)" }} />
      </div>
    );
  }

  const updateGear = (i: number, key: keyof GearItem, val: string) =>
    setGear((g) => ({
      ...g,
      items: g.items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)),
    }));

  return (
    <div className="space-y-10">
      {/* 1 ─ About Ma Galerie */}
      <section className="space-y-3">
        <SectionHeading
          title="About Ma Galerie"
          hint="The intro heading and paragraphs at the very top of the About page."
        />
        <input
          type="text"
          value={galerie.title}
          onChange={(e) => setGalerie({ ...galerie, title: e.target.value })}
          placeholder="Heading"
          className="admin-input w-full px-3 py-2 rounded-md"
        />
        <textarea
          value={galerie.body}
          onChange={(e) => setGalerie({ ...galerie, body: e.target.value })}
          placeholder="Body — separate paragraphs with a blank line"
          rows={8}
          className="admin-input w-full px-3 py-2 rounded-md resize-none"
        />
        <SaveButton
          saving={saving === "galerie"}
          onClick={() => saveSection("galerie", galerie)}
        />
      </section>

      <hr style={{ borderColor: "var(--glass-border)" }} />

      {/* 2 ─ About Moi (image blocks) */}
      <AboutMoiManager />

      <hr style={{ borderColor: "var(--glass-border)" }} />

      {/* 3 ─ Ma Vision */}
      <section className="space-y-3">
        <SectionHeading
          title="Ma Vision"
          hint="Your vision statement. The three highlighted words each reveal a photo on hover."
        />
        <input
          type="text"
          value={vision.title}
          onChange={(e) => setVision({ ...vision, title: e.target.value })}
          placeholder="Heading"
          className="admin-input w-full px-3 py-2 rounded-md"
        />
        <textarea
          value={vision.lead}
          onChange={(e) => setVision({ ...vision, lead: e.target.value })}
          placeholder="Lead text (before the highlighted words)"
          rows={2}
          className="admin-input w-full px-3 py-2 rounded-md resize-none"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {vision.words.map((w, i) => {
            const pending = visionFiles[i];
            const preview = pending ? URL.createObjectURL(pending) : w.img;
            return (
              <div
                key={`vword-${i}`}
                className="admin-card-inner rounded-lg p-3 space-y-2"
              >
                <label className="block aspect-[3/2] rounded-md overflow-hidden cursor-pointer relative admin-bg-muted">
                  {preview ? (
                    <img
                      src={preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 admin-text-muted">
                      <Upload className="w-5 h-5" />
                      <span className="text-xs">Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setVisionFiles((p) => ({ ...p, [i]: f }));
                    }}
                  />
                </label>
                <input
                  type="text"
                  value={w.text}
                  onChange={(e) => {
                    const words = vision.words.map((x, idx) =>
                      idx === i ? { ...x, text: e.target.value } : x,
                    );
                    setVision({ ...vision, words });
                  }}
                  placeholder="Word"
                  className="admin-input w-full px-2 py-1 rounded text-center"
                />
              </div>
            );
          })}
        </div>
        <textarea
          value={vision.close}
          onChange={(e) => setVision({ ...vision, close: e.target.value })}
          placeholder="Closing text (after the highlighted words)"
          rows={2}
          className="admin-input w-full px-3 py-2 rounded-md resize-none"
        />
        <SaveButton
          saving={saving === "vision"}
          onClick={() => saveSection("vision", vision, visionFiles)}
        />
      </section>

      <hr style={{ borderColor: "var(--glass-border)" }} />

      {/* 4 ─ Ma Gear */}
      <section className="space-y-3">
        <SectionHeading
          title="Ma Gear"
          hint="Your equipment list. The emoji is the icon shown on each card."
        />
        <input
          type="text"
          value={gear.title}
          onChange={(e) => setGear({ ...gear, title: e.target.value })}
          placeholder="Heading"
          className="admin-input w-full px-3 py-2 rounded-md"
        />
        <textarea
          value={gear.description}
          onChange={(e) => setGear({ ...gear, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="admin-input w-full px-3 py-2 rounded-md resize-none"
        />
        <div className="space-y-2">
          {gear.items.map((it, i) => (
            <div key={`gear-${i}`} className="flex items-center gap-2">
              <input
                type="text"
                value={it.icon}
                onChange={(e) => updateGear(i, "icon", e.target.value)}
                placeholder="📷"
                className="admin-input w-12 px-2 py-1 rounded text-center"
              />
              <input
                type="text"
                value={it.name}
                onChange={(e) => updateGear(i, "name", e.target.value)}
                placeholder="Name"
                className="admin-input flex-1 px-2 py-1 rounded"
              />
              <input
                type="text"
                value={it.category}
                onChange={(e) => updateGear(i, "category", e.target.value)}
                placeholder="Category"
                className="admin-input w-28 px-2 py-1 rounded"
              />
              <button
                type="button"
                onClick={() =>
                  setGear((g) => ({
                    ...g,
                    items: g.items.filter((_, idx) => idx !== i),
                  }))
                }
                className="admin-icon-btn danger"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setGear((g) => ({
                ...g,
                items: [...g.items, { icon: "📷", name: "", category: "" }],
              }))
            }
            className="admin-icon-btn flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" /> Add item
          </button>
        </div>
        <SaveButton
          saving={saving === "gear"}
          onClick={() => saveSection("gear", gear)}
        />
      </section>
    </div>
  );
}

"use client";

import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Feature = {
  slot: number;
  title: string;
  text: string;
  image_src: string | null;
};

export default function AboutMoiManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<number, File | null>>(
    {},
  );

  useEffect(() => {
    fetch("/api/about-moi")
      .then((r) => r.json())
      .then((d) => setFeatures(d))
      .catch(() => toast.error("Failed to load About Moi"))
      .finally(() => setLoading(false));
  }, []);

  const update = (slot: number, key: "title" | "text", val: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.slot === slot ? { ...f, [key]: val } : f)),
    );
  };

  const save = async (slot: number) => {
    setSavingSlot(slot);
    const f = features.find((x) => x.slot === slot);
    if (!f) return;
    const fd = new FormData();
    fd.append("slot", String(slot));
    fd.append("title", f.title);
    fd.append("text", f.text);
    const file = pendingFiles[slot];
    if (file) fd.append("file", file);
    try {
      const res = await fetch("/api/about-moi", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.image_src) {
        setFeatures((prev) =>
          prev.map((x) =>
            x.slot === slot ? { ...x, image_src: data.image_src } : x,
          ),
        );
      }
      setPendingFiles((prev) => ({ ...prev, [slot]: null }));
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSavingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin" style={{ color: "var(--text)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          About Moi
        </h2>
        <p className="text-sm admin-text-muted mt-1">
          The three story blocks on the About page. Set a photo, title and text
          for each, then Save.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f) => {
          const pending = pendingFiles[f.slot];
          const preview = pending
            ? URL.createObjectURL(pending)
            : f.image_src || null;
          return (
            <div
              key={f.slot}
              className="admin-card-inner rounded-lg p-4 space-y-3"
            >
              <div className="text-xs admin-text-muted tracking-widest">
                0{f.slot + 1}
              </div>

              <label
                className="block aspect-[4/5] rounded-md overflow-hidden cursor-pointer relative admin-bg-muted"
                title="Click to choose a photo"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 admin-text-muted">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Add photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      setPendingFiles((prev) => ({ ...prev, [f.slot]: file }));
                  }}
                />
              </label>

              <input
                type="text"
                value={f.title}
                onChange={(e) => update(f.slot, "title", e.target.value)}
                placeholder="Title"
                className="admin-input w-full px-3 py-2 rounded-md"
              />
              <textarea
                value={f.text}
                onChange={(e) => update(f.slot, "text", e.target.value)}
                placeholder="Text"
                rows={5}
                className="admin-input w-full px-3 py-2 rounded-md resize-none"
              />

              <button
                type="button"
                onClick={() => save(f.slot)}
                disabled={savingSlot === f.slot}
                className="admin-button w-full flex justify-center items-center"
              >
                {savingSlot === f.slot ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

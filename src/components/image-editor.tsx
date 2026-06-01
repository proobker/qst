"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { RotateCw, X, ZoomIn } from "lucide-react";
import {
  DEFAULT_EDIT_SETTINGS,
  FILTER_PRESETS,
  ImageEditSettings,
  blobToFile,
  readFileAsDataUrl,
  renderEditedImage,
} from "@/lib/image-editor";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ImageEditorProps = {
  open: boolean;
  onClose: () => void;
  onSave: (file: File, metadata: ImageEditSettings) => void | Promise<void>;
  initialFile?: File | null;
  initialImageUrl?: string | null;
  title?: string;
};

export function ImageEditor({
  open,
  onClose,
  onSave,
  initialFile,
  initialImageUrl,
  title = "Edit image",
}: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [settings, setSettings] = useState<ImageEditSettings>(DEFAULT_EDIT_SETTINGS);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [mode, setMode] = useState<"crop" | "adjust">("crop");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    // Resets the editor when the modal is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(DEFAULT_EDIT_SETTINGS);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMode("crop");

    async function load() {
      setLoading(true);
      try {
        if (initialFile) {
          const url = await readFileAsDataUrl(initialFile);
          setImageSrc(url);
        } else if (initialImageUrl) {
          setImageSrc(initialImageUrl);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [open, initialFile, initialImageUrl]);

  const updatePreview = useCallback(async () => {
    if (!imageSrc) {
      return;
    }
    try {
      const blob = await renderEditedImage(imageSrc, settings, croppedAreaPixels);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setPreviewUrl(null);
    }
  }, [imageSrc, settings, croppedAreaPixels]);

  useEffect(() => {
    if (mode === "adjust" && imageSrc) {
      const timer = setTimeout(() => {
        void updatePreview();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mode, imageSrc, settings, updatePreview]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!imageSrc) {
      return;
    }
    setSaving(true);
    try {
      const metadata: ImageEditSettings = {
        ...settings,
        crop: croppedAreaPixels
          ? {
              x: croppedAreaPixels.x,
              y: croppedAreaPixels.y,
              width: croppedAreaPixels.width,
              height: croppedAreaPixels.height,
            }
          : null,
      };
      const blob = await renderEditedImage(imageSrc, metadata, croppedAreaPixels);
      const file = blobToFile(blob, initialFile?.name ?? "edited-quest.jpg");
      await onSave(file, metadata);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-surface sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-hover hover:text-foreground"
            aria-label="Close editor"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={() => setMode("crop")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              mode === "crop" ? "bg-primary text-white" : "text-muted hover:text-foreground",
            )}
          >
            Crop
          </button>
          <button
            type="button"
            onClick={() => setMode("adjust")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              mode === "adjust" ? "bg-primary text-white" : "text-muted hover:text-foreground",
            )}
          >
            Adjust & Filters
          </button>
        </div>

        <div className="relative min-h-[280px] flex-1 bg-background">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <Spinner label="Loading image..." />
            </div>
          ) : mode === "crop" && imageSrc ? (
            <>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={settings.rotation}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={(rotation) => setSettings((s) => ({ ...s, rotation }))}
                onCropComplete={onCropComplete}
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-lg bg-black/60 px-3 py-2">
                <ZoomIn size={16} className="text-white" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-primary"
                  aria-label="Zoom"
                />
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
                  className="rounded-lg p-1.5 text-white transition hover:bg-white/10"
                  aria-label="Rotate 90 degrees"
                >
                  <RotateCw size={18} />
                </button>
              </div>
            </>
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="mx-auto max-h-72 object-contain" />
          ) : imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="Preview" className="mx-auto max-h-72 object-contain" />
          ) : null}
        </div>

        {mode === "adjust" ? (
          <div className="space-y-3 border-t border-border px-4 py-3">
            {(
              [
                ["brightness", "Brightness", 50, 150],
                ["contrast", "Contrast", 50, 150],
                ["saturation", "Saturation", 0, 200],
                ["sharpness", "Sharpness", 0, 100],
              ] as const
            ).map(([key, label, min, max]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium text-muted">
                  {label}: {settings[key]}
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={settings[key]}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, [key]: Number(e.target.value) }))
                  }
                  className="mt-1 w-full accent-primary"
                />
              </label>
            ))}
            <div className="flex flex-wrap gap-2">
              {FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, filter: preset.id }))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    settings.filter === preset.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:border-primary",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-3 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !imageSrc}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" /> : null}
            {saving ? "Saving..." : "Save image"}
          </button>
        </div>
      </div>
    </div>
  );
}

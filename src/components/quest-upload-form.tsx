"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { uploadQuestCompletionAction } from "@/app/actions/quests";
import { ImageEditor } from "@/components/image-editor";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

type QuestUploadFormProps = {
  userQuestId: string;
};

export function QuestUploadForm({ userQuestId }: QuestUploadFormProps) {
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setEditedFile(null);
      setEditorOpen(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim()) {
      toast("Please add a caption.", "error");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("userQuestId", userQuestId);
      formData.set("caption", caption.trim());
      const file = editedFile ?? selectedFile;
      if (file) {
        formData.set("image", file);
      }
      try {
        await uploadQuestCompletionAction(formData);
        toast("Quest completion uploaded!", "success");
        setCaption("");
        setSelectedFile(null);
        setEditedFile(null);
      } catch {
        toast("Upload failed. Try again.", "error");
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border p-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted">Caption</label>
        <textarea
          required
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Explain what you did to complete this quest."
          className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted transition hover:border-primary hover:text-primary"
        >
          <ImagePlus size={18} />
          {editedFile || selectedFile ? "Change & edit photo" : "Choose photo to edit"}
        </button>

        {(editedFile || selectedFile) && (
          <p className="text-xs text-success">
            ✓ {(editedFile ?? selectedFile)?.name} ready to upload
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? <Spinner size="sm" /> : null}
          {pending ? "Uploading..." : "Upload completion"}
        </button>
      </form>

      <ImageEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialFile={selectedFile}
        title="Edit quest photo"
        onSave={async (file) => {
          setEditedFile(file);
          toast("Photo edited and ready to upload.", "success");
        }}
      />
    </>
  );
}

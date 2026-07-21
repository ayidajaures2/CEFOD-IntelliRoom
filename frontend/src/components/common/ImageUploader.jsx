import { LuImage, LuLoaderCircle } from "react-icons/lu";
import { useRef, useState } from "react";

/**
 * Uploader d'image générique (avatar rond ou photo de salle rectangulaire).
 * - affiche l'image actuelle (currentUrl) ou un aperçu local avant envoi
 * - onUpload(file) et onDelete() sont fournis par le parent
 * Palette noir/blanc/orange uniquement.
 */
export default function ImageUploader({
  currentUrl,
  onUpload,
  onDelete,
  shape = "square",     // "circle" | "square"
  label = "Photo",
  hint = "JPG, PNG ou WebP",
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const rounded = shape === "circle" ? "rounded-full" : "rounded-xl";
  const size = shape === "circle" ? "h-28 w-28" : "h-40 w-full max-w-xs";

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      await onUpload(file);
    } finally {
      setBusy(false);
      setPreview(null); // on repasse sur currentUrl (rafraîchi par le parent)
    }
  };

  const shown = preview || currentUrl;

  return (
    <div className="flex items-center gap-5">
      <div
        className={`${size} ${rounded} relative flex shrink-0 items-center justify-center overflow-hidden border border-ink/10 bg-accent-soft`}
      >
        {shown ? (
          <img src={shown} alt={label} className="h-full w-full object-cover" />
        ) : (
<LuImage className="h-10 w-10 text-ink/25" />
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <LuLoaderCircle className="h-6 w-6 animate-spin text-paper" />
          </div>
        )}
      </div>

      <div>
        <p className="field-label">{label}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <button type="button" onClick={pick} className="btn-outline px-3 py-1.5 text-sm" disabled={busy}>
            {currentUrl ? "Changer" : "Ajouter"}
          </button>
          {currentUrl && onDelete && (
            <button
              type="button"
              onClick={async () => { setBusy(true); try { await onDelete(); } finally { setBusy(false); } }}
              className="btn-ghost px-3 py-1.5 text-sm text-accent-dark"
              disabled={busy}
            >
              Retirer
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-ink/45">{hint}</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
}

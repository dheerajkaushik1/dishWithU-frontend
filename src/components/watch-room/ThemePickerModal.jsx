import { Check, Palette, X } from "lucide-react";
import ErrorText from "../common/ErrorText";
import Spinner from "../common/Spinner";
import { ROOM_THEMES } from "../../utils/constants";

export default function ThemePickerModal({
  theme,
  themeDraft,
  setThemeDraft,
  themeBusy,
  error,
  onClose,
  onSave,
}) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal theme-modal" role="dialog" aria-modal="true" aria-labelledby="theme-title">
        <button className="icon-btn modal-x" onClick={onClose} aria-label="Close theme picker"><X size={16} /></button>
        <span className="modal-symbol"><Palette size={19} /></span>
        <h2 id="theme-title">Set your room’s mood</h2>
        <p>Choose the atmosphere for this movie night. Your selection is saved to the room.</p>
        <div className="theme-options">
          {ROOM_THEMES.map(({ id, label, detail, icon: ThemeIcon }) => (
            <button key={id} className={`theme-option theme-${id.toLowerCase()} ${themeDraft === id ? "selected" : ""}`} onClick={() => setThemeDraft(id)} aria-pressed={themeDraft === id}>
              <ThemeIcon size={18} /><span><b>{label}</b><small>{detail}</small></span>{themeDraft === id && <Check size={16} />}
            </button>
          ))}
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="theme-actions">
          <button className="button quiet" onClick={onClose} disabled={themeBusy}>Cancel</button>
          <button className="button primary" onClick={() => onSave(themeDraft)} disabled={themeBusy || themeDraft === theme}>{themeBusy ? <><Spinner /> Saving...</> : <>Save theme <Check size={15} /></>}</button>
        </div>
      </section>
    </div>
  );
}

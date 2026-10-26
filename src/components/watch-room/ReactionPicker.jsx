import { Smile } from "lucide-react";
import { THEME_REACTIONS } from "../../utils/constants";

export default function ReactionPicker({ theme, open, onToggle, onSend }) {
  return (
    <div className="player-reactions">
      <button className="player-control reaction-trigger" onClick={onToggle} title="Send a reaction" aria-label="Send a reaction" aria-expanded={open}>
        <Smile size={17} />
      </button>
      {open && (
        <div className="reaction-picker reaction-picker-floating" aria-label={`${theme} reactions`}>
          {THEME_REACTIONS[theme]?.map((reaction, index) => (
            <button
              key={`${theme}-${index}`}
              className="reaction-button"
              onClick={() => onSend(reaction)}
              title={`Send ${reaction}`}
              aria-label={`Send ${reaction}`}
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

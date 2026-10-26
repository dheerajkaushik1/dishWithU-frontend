import { LockKeyhole, X } from "lucide-react";
import ErrorText from "../common/ErrorText";
import Spinner from "../common/Spinner";

export default function CloseRoomModal({ error, busy, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-title"
      >
        <button
          className="icon-btn modal-x"
          onClick={onCancel}
          aria-label="Cancel"
        >
          <X size={16} />
        </button>
        <span className="modal-symbol">
          <LockKeyhole size={19} />
        </span>
        <h2 id="close-title">Close this room?</h2>
        <p>This ends the room for everyone in it.</p>
        <ErrorText>{error}</ErrorText>
        <div>
          <button
            className="button quiet"
            onClick={onCancel}
            disabled={busy}
          >
            Keep room open
          </button>
          <button
            className="button danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <Spinner /> Closing room...
              </>
            ) : (
              "Close room"
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

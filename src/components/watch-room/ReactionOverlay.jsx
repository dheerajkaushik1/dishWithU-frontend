export default function ReactionOverlay({ reactions }) {
  return reactions.length > 0 ? (
    <div className="reaction-floats" aria-live="polite">
      {reactions.map((item) => (
        <span className="reaction-float" key={item.localId}>
          {item.reaction}
        </span>
      ))}
    </div>
  ) : null;
}

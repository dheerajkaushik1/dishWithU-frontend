import { useCallback, useEffect, useRef, useState } from "react";

export default function useRoomReactions() {
  const [reactionBursts, setReactionBursts] = useState([]);
  const reactionTimersRef = useRef(new Set());

  const receiveReaction = useCallback((reaction) => {
    const item = {
      ...reaction,
      localId: `${reaction.userId}-${Date.now()}-${Math.random()}`,
    };
    setReactionBursts((current) => [...current.slice(-3), item]);
    const timer = window.setTimeout(() => {
      setReactionBursts((current) =>
        current.filter((entry) => entry.localId !== item.localId),
      );
      reactionTimersRef.current.delete(timer);
    }, 2400);
    reactionTimersRef.current.add(timer);
  }, []);

  useEffect(
    () => () => {
      reactionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  return { reactionBursts, receiveReaction };
}

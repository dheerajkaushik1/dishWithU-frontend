import { useCallback, useState } from "react";
import { roomApi } from "../services/roomApi";

export default function useRoomTheme({ token, roomId, isHost, setRoom, setError }) {
  const [theme, setTheme] = useState("FRIENDSHIP");
  const [themeDraft, setThemeDraft] = useState("FRIENDSHIP");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [themeBusy, setThemeBusy] = useState(false);

  const updateTheme = useCallback(async (nextTheme) => {
    if (!isHost) return;
    setThemeBusy(true);
    setError("");
    try {
      const result = await roomApi.updateTheme(token, roomId, nextTheme);
      setTheme(result.theme);
      setRoom((current) => ({ ...current, theme: result.theme }));
      setThemePickerOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setThemeBusy(false);
    }
  }, [isHost, roomId, setError, setRoom, token]);

  return {
    theme,
    setTheme,
    themeDraft,
    setThemeDraft,
    themePickerOpen,
    setThemePickerOpen,
    themeBusy,
    updateTheme,
  };
}

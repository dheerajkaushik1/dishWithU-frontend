import {
  Maximize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import formatTime from "../../utils/formatTime";

export default function VideoControls({
  available,
  controlsVisible,
  duration,
  currentTime,
  movieBusy,
  isPlaying,
  isHost,
  isMuted,
  volume,
  videoFit,
  seeking,
  onSeekingChange,
  onCurrentTimeChange,
  onSeek,
  onPlaybackToggle,
  onMuteToggle,
  onVolumeChange,
  onFitToggle,
  onFullscreen,
  onShowControls,
}) {
  return available ? (
    <div className={`movie-controls ${controlsVisible ? "shown" : "faded"}`} onMouseEnter={onShowControls}>
      <input
        className="seek-slider"
        aria-label="Seek movie"
        title="Drag to seek for everyone in the room"
        type="range"
        min="0"
        max={Math.max(duration, 1)}
        step="0.1"
        value={Math.min(currentTime, duration || currentTime)}
        disabled={!available || !duration || movieBusy}
        onPointerDown={() => onSeekingChange(true)}
        onChange={(event) => {
          onSeekingChange(true);
          onCurrentTimeChange(Number(event.target.value));
        }}
        onPointerUp={(event) => {
          onSeek(Number(event.currentTarget.value));
          onSeekingChange(false);
        }}
        onPointerCancel={() => onSeekingChange(false)}
        onBlur={(event) => {
          if (seeking) {
            onSeek(Number(event.currentTarget.value));
            onSeekingChange(false);
          }
        }}
        onKeyUp={(event) => {
          onSeek(Number(event.currentTarget.value));
          onSeekingChange(false);
        }}
        style={{
          "--seek-progress": `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
        }}
      />
      <div className="control-row">
        <button className="player-control" onClick={onPlaybackToggle} disabled={!available || movieBusy} title={isPlaying ? "Pause movie for everyone" : "Play movie for everyone"} aria-label={isPlaying ? "Pause movie for everyone" : "Play movie for everyone"}>
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button className="player-control skip-control" onClick={() => onSeek(currentTime - 10)} disabled={!available || !duration || movieBusy} title="Back 10 seconds for everyone" aria-label="Back 10 seconds">
          <SkipBack size={17} /><small>10</small>
        </button>
        <button className="player-control skip-control" onClick={() => onSeek(currentTime + 10)} disabled={!available || !duration || movieBusy} title="Forward 10 seconds for everyone" aria-label="Forward 10 seconds">
          <SkipForward size={17} /><small>10</small>
        </button>
        <span className="time-readout">{formatTime(currentTime)} <i>/</i> {formatTime(duration)}</span>
        <span className="playback-indicator"><i /> {isHost ? "HOST" : "GUEST"}</span>
        <button className="player-control volume-toggle" onClick={onMuteToggle} title={isMuted ? "Unmute" : "Mute"} aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <input className="volume-slider" aria-label="Volume" type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={onVolumeChange} />
        <button className={`player-control fit-toggle ${videoFit === "contain" ? "selected" : ""}`} onClick={onFitToggle} title={`Switch to ${videoFit === "contain" ? "Fill" : "Fit"}`} aria-label={`Video mode: ${videoFit === "contain" ? "Fit" : "Fill"}`} aria-pressed={videoFit === "contain"}>
          {videoFit === "contain" ? "Fit" : "Fill"}
        </button>
        <button className="player-control" onClick={onFullscreen} title="Full screen" aria-label="Full screen"><Maximize size={17} /></button>
      </div>
    </div>
  ) : null;
}

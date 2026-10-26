import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Copy, Film, Heart, LockKeyhole, LogOut, MessageCircle, PanelLeft, Palette, Settings, ShieldCheck, Sparkles, Upload, UsersRound, Volume2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { roomApi } from "../services/roomApi";
import { useAuth } from "../context/useAuth";
import ErrorText from "../components/common/ErrorText";
import Spinner from "../components/common/Spinner";
import CloseRoomModal from "../components/watch-room/CloseRoomModal";
import ChatPanel from "../components/watch-room/ChatPanel";
import ReactionPicker from "../components/watch-room/ReactionPicker";
import ReactionOverlay from "../components/watch-room/ReactionOverlay";
import ThemePickerModal from "../components/watch-room/ThemePickerModal";
import VideoControls from "../components/watch-room/VideoControls";
import useRoomChat from "../hooks/useRoomChat";
import useRoomReactions from "../hooks/useRoomReactions";
import useRoomTheme from "../hooks/useRoomTheme";
import formatTime from "../utils/formatTime";
export default function WatchRoom() {
  const { roomId } = useParams();
  const { token, user, socket } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [roomRole, setRoomRole] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [peerStatus, setPeerStatus] = useState("waiting");
  const [url, setUrl] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);
  const [movie, setMovie] = useState({ name: "", type: "", duration: 0 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [movieBusy, setMovieBusy] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [videoFit, setVideoFit] = useState("contain");
  const [controlsVisible, setControlsVisible] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenTarget, setFullscreenTarget] = useState(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const peerRef = useRef(null);
  const videoRef = useRef(null);
  const playerFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatPanelRef = useRef(null);
  const chatOpenRef = useRef(chatOpen);
  const {
    messages,
    messageDraft,
    setMessageDraft,
    chatError,
    setChatError,
    unreadMessages,
    setUnreadMessages,
    chatEndRef,
    onHistory,
    onMessage,
    sendMessage,
  } = useRoomChat(socket, roomId, chatOpenRef);
  const { reactionBursts, receiveReaction } = useRoomReactions();
  const urlRef = useRef("");
  const streamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const candidateQueue = useRef([]);
  const remotePlaybackRef = useRef({ currentTime: 0, isPlaying: false, startedAt: 0 });
  const controlsTimerRef = useRef(null);
  const resumeAfterLoadRef = useRef(false);
  const seekRecoveryTimerRef = useRef(null);
  const audioRecoveryVerifyTimerRef = useRef(null);
  const peerStatsTimerRef = useRef(null);
  const audioRecoveryRef = useRef(false);
  const hostId = room?.host?._id || room?.host?.id;
  const myId = user?._id || user?.id;
  const isHost = roomRole
    ? roomRole === "HOST"
    : Boolean(hostId && myId && String(hostId) === String(myId));
  const {
    theme,
    setTheme,
    themeDraft,
    setThemeDraft,
    themePickerOpen,
    setThemePickerOpen,
    themeBusy,
    updateTheme,
  } = useRoomTheme({ token, roomId, isHost, setRoom, setError });
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);
  useEffect(() => {
    const updateFullscreen = () => {
      const target = playerFrameRef.current;
      const active = document.fullscreenElement === target;
      setIsFullscreen(active);
      setFullscreenTarget(active ? target : null);
      setChatOpen(false);
    };

    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, []);
  useEffect(() => {
    let active = true;
    roomApi
      .get(token, roomId)
      .then(({ room: data }) => {
        if (active) {
          setRoom(data);
          setPeople(data.participants || []);
          setTheme(data.theme || "FRIENDSHIP");
          setMovie(data.movie || { name: "", type: "", duration: 0 });
          setDuration(data.movie?.duration || 0);
          setCurrentTime(data.playback?.currentTime || 0);
          setIsPlaying(Boolean(data.playback?.isPlaying));
          remotePlaybackRef.current = {
            currentTime: data.playback?.currentTime || 0,
            isPlaying: Boolean(data.playback?.isPlaying),
            startedAt: Date.now(),
          };
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, roomId, setTheme]);
  const closePeer = useCallback(() => {
    if (peerStatsTimerRef.current) {
      window.clearInterval(peerStatsTimerRef.current);
      peerStatsTimerRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    remoteStreamRef.current = null;
    setRemoteStream(null);
    setPlaybackBlocked(false);
    setPeerStatus("waiting");
    candidateQueue.current = [];
  }, []);
  const makePeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    const logStats = async () => {
      if (!import.meta.env.DEV || peer.signalingState === "closed") return;
      try {
        const stats = await peer.getStats();
        const audioReports = [];
        stats.forEach((report) => {
          if (
            (report.type === "outbound-rtp" || report.type === "inbound-rtp") &&
            (report.kind || report.mediaType) === "audio"
          ) {
            audioReports.push({
              direction: report.type === "outbound-rtp" ? "sent" : "received",
              bytes: report.bytesSent ?? report.bytesReceived,
              samples: report.totalSamplesSent ?? report.totalSamplesReceived,
              packets: report.packetsSent ?? report.packetsReceived,
              trackId: report.trackIdentifier,
            });
          }
        });
        console.info("[DishWithU] WebRTC audio stats:", {
          connectionState: peer.connectionState,
          iceConnectionState: peer.iceConnectionState,
          reports: audioReports,
        });
      } catch (statsError) {
        console.info("[DishWithU] WebRTC stats unavailable:", statsError.message);
      }
    };
    peer.oniceconnectionstatechange = () => {
      if (import.meta.env.DEV) {
        console.info("[DishWithU] WebRTC ICE state:", peer.iceConnectionState);
      }
    };
    peer.onicecandidate = (event) => {
      if (event.candidate)
        socket?.emit("webrtc:ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
    };
    peer.onconnectionstatechange = () => {
      if (import.meta.env.DEV) {
        console.info("[DishWithU] WebRTC connection state:", peer.connectionState);
      }
      setPeerStatus(
        {
          connected: "connected",
          connecting: "connecting",
          disconnected: "disconnected",
          failed: "disconnected",
          closed: "disconnected",
        }[peer.connectionState] || "connecting",
      );
    };
    peer.ontrack = (event) => {
      const stream = remoteStreamRef.current || new MediaStream();
      const incomingTracks = [
        ...(event.streams || []).flatMap((incomingStream) => incomingStream.getTracks()),
        event.track,
      ];
      incomingTracks.forEach((track) => {
        if (!stream.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
          stream.addTrack(track);
          if (import.meta.env.DEV) {
            console.info("[DishWithU] Remote track received:", {
              kind: track.kind,
              id: track.id,
              readyState: track.readyState,
            });
          }
          if (track.kind === "audio") {
            for (const eventName of ["mute", "unmute", "ended"]) {
              track.addEventListener(eventName, () => {
                if (import.meta.env.DEV) {
                  console.info(`[DishWithU] Remote audio ${eventName}:`, {
                    id: track.id,
                    readyState: track.readyState,
                    enabled: track.enabled,
                  });
                }
              });
            }
          }
        }
      });
      remoteStreamRef.current = stream;
      if (import.meta.env.DEV) {
        const tracks = stream.getTracks();
        console.info("[DishWithU] Received remote media tracks:", {
          videoTrackCount: stream.getVideoTracks().length,
          audioTrackCount: stream.getAudioTracks().length,
          tracks: tracks.map(({ kind, readyState, enabled, muted }) => ({
            kind,
            readyState,
            enabled,
            muted,
          })),
        });
      }
      setRemoteStream(stream);
    };
    peerRef.current = peer;
    if (import.meta.env.DEV) {
      peerStatsTimerRef.current = window.setInterval(logStats, 10000);
      void logStats();
    }
    return peer;
  }, [socket, roomId]);
  const offerToGuest = useCallback(async (nextStream = streamRef.current, forceOffer = false) => {
    try {
      const peer = makePeer();
      const previousStream = streamRef.current;
      let needsNegotiation = false;
      if (nextStream) {
        for (const kind of ["video", "audio"]) {
          const nextTracks = nextStream.getTracks().filter((track) => track.kind === kind);
          const kindSenders = peer.getSenders().filter(
            (sender) => sender.track?.kind === kind || sender.__dishWithUKind === kind,
          );
          if (nextTracks.length === 0 && kindSenders.length === 0) {
            const transceiver = peer.addTransceiver(kind, { direction: "sendonly" });
            transceiver.sender.__dishWithUKind = kind;
            needsNegotiation = true;
            continue;
          }
          const assignedSenders = new Set();
          for (const nextTrack of nextTracks) {
            const sender = kindSenders.find((item) => item.track?.id === nextTrack.id)
              || kindSenders.find((item) => !assignedSenders.has(item));
            if (sender) {
              if (sender.track !== nextTrack) await sender.replaceTrack(nextTrack);
              sender.__dishWithUKind = kind;
              assignedSenders.add(sender);
            } else {
              const addedSender = peer.addTrack(nextTrack, nextStream);
              addedSender.__dishWithUKind = kind;
              kindSenders.push(addedSender);
              assignedSenders.add(addedSender);
              needsNegotiation = true;
            }
          }
          for (const sender of kindSenders) {
            if (!assignedSenders.has(sender) && sender.track) {
              await sender.replaceTrack(null);
            }
          }
        }
        streamRef.current = nextStream;
        if (previousStream && previousStream !== nextStream) {
        previousStream.getTracks().forEach((track) => { if (!nextStream.getTracks().includes(track)) track.stop(); });
        }
      }
      if (needsNegotiation || forceOffer) {
        if (peer.signalingState === "have-local-offer") {
          await peer.setLocalDescription({ type: "rollback" });
        }
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket?.emit("webrtc:offer", { roomId, offer });
        setPeerStatus("connecting");
      }
    } catch {
      setMediaError(
        "Could not start video sharing. Reload the room and try again.",
      );
      return false;
    }
    return true;
  }, [makePeer, roomId, socket]);
  const attemptPlayback = useCallback(async (video = videoRef.current) => {
    if (!video) return false;
    try {
      await video.play();
      setPlaybackBlocked(false);
      return true;
    } catch (playError) {
      if (playError?.name === "NotAllowedError" && !isHost) {
        if (import.meta.env.DEV) {
          console.info("[DishWithU] Remote playback was rejected:", {
            name: playError.name,
            message: playError.message,
          });
        }
        setPlaybackBlocked(true);
      } else {
        if (import.meta.env.DEV) {
          console.info("[DishWithU] Media playback failed:", {
            name: playError?.name,
            message: playError?.message,
          });
        }
        setMediaError(isHost
          ? "This video could not be played by your browser."
          : "Remote playback could not start. Check the browser’s media permissions and try again.");
      }
      return false;
    }
  }, [isHost]);
  useEffect(() => {
    if (!room || !socket) return undefined;
    const joined = () => {
      setSocketStatus("connected");
      socket.emit("room:join", { roomId });
    };
    const disconnected = () => {
      setSocketStatus("disconnected");
      closePeer();
    };
    const onJoined = () => {
      setSocketStatus("connected");
    };
    const onJoinedState = (state) => {
      setSocketStatus("connected");
      if (state.role === "HOST" || state.role === "GUEST") setRoomRole(state.role);
      if (state.theme) setTheme(state.theme);
      if (state.movie) {
        setMovie(state.movie);
        setDuration(state.movie.duration || 0);
      }
      if (Array.isArray(state.participants) && state.participants.some((person) => person.username)) {
        setPeople(state.participants);
      }
      const playback = state.playback;
      if (playback) {
        const currentTime = playback.currentTime || 0;
        setCurrentTime(currentTime);
        setIsPlaying(Boolean(playback.isPlaying));
        remotePlaybackRef.current = {
          currentTime,
          isPlaying: Boolean(playback.isPlaying),
          startedAt: Date.now(),
        };
      }
      socket.emit("chat:history", { roomId });
      if (isHost && streamRef.current) offerToGuest(streamRef.current, true);
    };
    const onRoomError = (data) =>
      setError(data?.message || "Could not enter this room.");
    const onMovieReady = (data) => {
      setMovie({ name: data.name, type: data.type, duration: data.duration || 0 });
      setDuration(data.duration || 0);
      setCurrentTime(0);
      setIsPlaying(false);
      setMovieBusy(false);
    };
    const onMovieError = (data) => {
      setMovieBusy(false);
      setMediaError(data?.message || "The movie could not be prepared.");
    };
    const onChatHistory = onHistory;
    const onChatMessage = onMessage;
    const onReaction = receiveReaction;
    const applyPlaybackState = (time, playing, applyTransport = true) => {
      const safeTime = Number.isFinite(time) && time >= 0
        ? time
        : remotePlaybackRef.current.currentTime;
      remotePlaybackRef.current = { currentTime: safeTime, isPlaying: playing, startedAt: Date.now() };
      setCurrentTime(safeTime);
      setIsPlaying(playing);
      const video = videoRef.current;
      if (!video) return;
      if ((isHost || !video.srcObject) && video.readyState >= 1 && Math.abs(video.currentTime - safeTime) > 0.35) {
        video.currentTime = safeTime;
      }
      if (applyTransport) {
        if (playing && video.paused) {
          void attemptPlayback(video);
        } else if (!playing && !video.paused) {
          video.pause();
        }
      }
    };
    const onPlaybackPlay = ({ currentTime }) => applyPlaybackState(currentTime, true);
    const onPlaybackPause = ({ currentTime }) => applyPlaybackState(currentTime, false);
    const onPlaybackSeek = ({ currentTime }) => {
      const playing = remotePlaybackRef.current.isPlaying;
      applyPlaybackState(currentTime, playing, false);
    };
    const onPlaybackError = ({ message }) => setMediaError(message || "Playback could not be synchronized.");
    const onRoomClosed = ({ message }) => {
      closePeer();
      navigate("/dashboard", {
        replace: true,
        state: { roomClosed: message || "The host closed this watch room." },
      });
    };
    const onUserJoined = (person) => {
      setPeople((current) =>
        current.some((entry) => (entry._id || entry.id) === person.userId)
          ? current
          : [...current, { _id: person.userId, username: person.username }],
      );
      if (isHost && streamRef.current) offerToGuest(streamRef.current, true);
    };
    const onUserLeft = ({ userId }) => {
      setPeople((current) =>
        current.filter((entry) => (entry._id || entry.id) !== userId),
      );
      if (userId !== myId) closePeer();
    };
    const onOffer = async ({ offer }) => {
      try {
        const peer = makePeer();
        if (
          peer.remoteDescription?.type === "offer" &&
          peer.remoteDescription.sdp === offer.sdp
        ) {
          return;
        }
        if (peer.signalingState !== "stable") return;
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        for (const candidate of candidateQueue.current)
          await peer.addIceCandidate(candidate);
        candidateQueue.current = [];
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("webrtc:answer", { roomId, answer });
      } catch {
        setMediaError(
          "Could not connect to the host’s stream. Try rejoining the room.",
        );
      }
    };
    const onAnswer = async ({ answer }) => {
      try {
        const peer = peerRef.current;
        if (!peer || peer.signalingState !== "have-local-offer") return;
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        for (const candidate of candidateQueue.current)
          await peer.addIceCandidate(candidate);
        candidateQueue.current = [];
      } catch {
        setMediaError("The video connection could not be completed.");
      }
    };
    const onCandidate = async ({ candidate }) => {
      try {
        const item = new RTCIceCandidate(candidate);
        if (peerRef.current?.remoteDescription)
          await peerRef.current.addIceCandidate(item);
        else candidateQueue.current.push(item);
      } catch {
        setMediaError("A network connection could not be established.");
      }
    };
    const listeners = [
      ["connect", joined],
      ["disconnect", disconnected],
      ["room:joined", onJoined],
      ["room:joined", onJoinedState],
      ["room:error", onRoomError],
      ["room:user-joined", onUserJoined],
      ["room:user-left", onUserLeft],
      ["room:user-disconnected", onUserLeft],
      ["movie:ready", onMovieReady],
      ["movie:error", onMovieError],
      ["chat:history", onChatHistory],
      ["chat:message", onChatMessage],
      ["reaction:received", onReaction],
      ["playback:play", onPlaybackPlay],
      ["playback:pause", onPlaybackPause],
      ["playback:seek", onPlaybackSeek],
      ["playback:error", onPlaybackError],
      ["room:closed", onRoomClosed],
      ["webrtc:offer", onOffer],
      ["webrtc:answer", onAnswer],
      ["webrtc:ice-candidate", onCandidate],
    ];
    listeners.forEach(([event, listener]) => socket.on(event, listener));
    if (socket.connected) socket.emit("room:join", { roomId });
    return () => {
      socket.emit("room:leave");
      listeners.forEach(([event, listener]) => socket.off(event, listener));
      closePeer();
    };
  }, [room, socket, roomId, isHost, myId, closePeer, makePeer, offerToGuest, attemptPlayback, navigate, onHistory, onMessage, receiveReaction, setTheme]);
  useEffect(() => {
    const video = videoRef.current;
    if (!remoteStream || !video) return;
    video.srcObject = remoteStream;
    video.defaultMuted = false;
    if (import.meta.env.DEV) {
      console.info("[DishWithU] Remote stream attached:", {
        tracks: remoteStream.getTracks().map(({ id, kind, readyState, enabled, muted }) => ({
          id,
          kind,
          readyState,
          enabled,
          muted,
        })),
        elementMuted: video.muted,
        volume: video.volume,
      });
    }
    if (!isHost && remotePlaybackRef.current.isPlaying) {
      void attemptPlayback(video);
    }
  }, [remoteStream, isHost, attemptPlayback]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
    if (!isHost && remoteStream && import.meta.env.DEV) {
      console.info("[DishWithU] Remote video audio output:", {
        muted: video.muted,
        defaultMuted: video.defaultMuted,
        volume: video.volume,
      });
    }
  }, [volume, isMuted, url, remoteStream, isHost]);
  useEffect(() => {
    if (!url) return undefined;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  useEffect(
    () => () => {
      closePeer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
      if (seekRecoveryTimerRef.current) window.clearTimeout(seekRecoveryTimerRef.current);
      if (audioRecoveryVerifyTimerRef.current) window.clearTimeout(audioRecoveryVerifyTimerRef.current);
    },
    [closePeer],
  );
  useEffect(() => {
    if (isHost || !room) return undefined;
    const interval = window.setInterval(() => {
      roomApi.get(token, roomId).then(({ room: latest }) => {
        if (latest.theme && latest.theme !== theme) setTheme(latest.theme);
      }).catch(() => {});
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isHost, room, roomId, theme, token, setTheme]);
  useEffect(() => {
    if (isHost || !isPlaying || seeking) return undefined;
    const interval = window.setInterval(() => {
      const state = remotePlaybackRef.current;
      setCurrentTime(state.currentTime + Math.max(0, Date.now() - state.startedAt) / 1000);
    }, 300);
    return () => window.clearInterval(interval);
  }, [isHost, isPlaying, seeking]);

  const publishCurrentStream = async () => {
    const video = videoRef.current;
    const captureStream = video?.captureStream || video?.mozCaptureStream;
    if (!video || typeof captureStream !== "function") {
      setMediaError("This browser cannot share local video. Try a current version of Chrome, Edge, or Firefox.");
      return;
    }
    const stream = captureStream.call(video);
    if (!stream.getTracks().length) {
      setMediaError("The video is still preparing. Try again in a moment.");
      return;
    }
    const audioTracks = stream.getAudioTracks();
    if (import.meta.env.DEV) {
      stream.getTracks().forEach((track) => {
        if (track.kind !== "audio") return;
        for (const eventName of ["mute", "unmute", "ended"]) {
          track.addEventListener(eventName, () => {
            console.info(`[DishWithU] Host audio ${eventName}:`, {
              id: track.id,
              readyState: track.readyState,
              enabled: track.enabled,
              muted: track.muted,
              playbackTime: video.currentTime,
              paused: video.paused,
            });
          });
        }
      });
    }
    if (import.meta.env.DEV) {
      console.info("[DishWithU] Captured local media tracks:", {
        tracks: stream.getTracks().map(({ kind, id, readyState, enabled, muted }) => ({
          kind,
          id,
          readyState,
          enabled,
          muted,
        })),
      });
    }
    const published = await offerToGuest(stream);
    if (!published) return;
    if (import.meta.env.DEV) {
      const audioSender = peerRef.current?.getSenders().find(
        (sender) => sender.track?.kind === "audio",
      );
      console.info("[DishWithU] Active audio sender:", {
        trackId: audioSender?.track?.id,
        readyState: audioSender?.track?.readyState,
        enabled: audioSender?.track?.enabled,
        muted: audioSender?.track?.muted,
      });
    }
    setMediaError(audioTracks.length
      ? ""
      : "No audio track was captured from this video. It may be silent or use an audio codec this browser cannot capture.");
  };

  const recoverAudioCapture = async () => {
    const video = videoRef.current;
    const captureStream = video?.captureStream || video?.mozCaptureStream;
    if (!video || typeof captureStream !== "function" || audioRecoveryRef.current) return;
    audioRecoveryRef.current = true;
    const sourceUrl = urlRef.current;
    let replacementCapture;
    try {
      replacementCapture = captureStream.call(video);
      const replacementAudio = replacementCapture.getAudioTracks().find(
        (track) => track.readyState === "live",
      );
      if (!replacementAudio) {
        replacementCapture.getTracks().forEach((track) => track.stop());
        setMediaError("The browser stopped providing captured movie audio after seeking. Try a different video format or browser.");
        return;
      }
      if (replacementAudio.muted) {
        const audioReady = await new Promise((resolve) => {
          const timeout = window.setTimeout(() => {
            replacementAudio.removeEventListener("unmute", onUnmute);
            resolve(false);
          }, 1500);
          const onUnmute = () => {
            window.clearTimeout(timeout);
            resolve(true);
          };
          replacementAudio.addEventListener("unmute", onUnmute, { once: true });
        });
        if (!audioReady) {
          replacementCapture.getTracks().forEach((track) => track.stop());
          setMediaError("The browser returned a muted replacement audio track after seeking. Existing WebRTC audio stats are available in the development console to help identify whether audio samples are being sent.");
          return;
        }
      }
      if (urlRef.current !== sourceUrl || videoRef.current !== video) {
        replacementCapture.getTracks().forEach((track) => track.stop());
        return;
      }
      const retainedVideoTracks = (streamRef.current?.getVideoTracks() || [])
        .filter((track) => track.readyState === "live");
      const recoveredStream = new MediaStream([
        ...retainedVideoTracks,
        replacementAudio,
      ]);
      replacementCapture.getVideoTracks().forEach((track) => track.stop());
      const published = await offerToGuest(recoveredStream);
      if (!published) {
        replacementAudio.stop();
        return;
      }
      if (import.meta.env.DEV) {
        console.info("[DishWithU] Replaced persistently muted captured audio track:", {
          trackId: replacementAudio.id,
          readyState: replacementAudio.readyState,
          muted: replacementAudio.muted,
        });
        for (const eventName of ["mute", "unmute", "ended"]) {
          replacementAudio.addEventListener(eventName, () => {
            console.info(`[DishWithU] Recovered host audio ${eventName}:`, {
              id: replacementAudio.id,
              readyState: replacementAudio.readyState,
              enabled: replacementAudio.enabled,
              muted: replacementAudio.muted,
              playbackTime: video.currentTime,
              paused: video.paused,
            });
          });
        }
      }
      if (audioRecoveryVerifyTimerRef.current) {
        window.clearTimeout(audioRecoveryVerifyTimerRef.current);
      }
      audioRecoveryVerifyTimerRef.current = window.setTimeout(() => {
        if (urlRef.current !== sourceUrl) return;
        if (
          replacementAudio.readyState === "live" &&
          !replacementAudio.muted
        ) {
          setMediaError((current) =>
            current.startsWith("The browser stopped providing captured movie audio")
              ? ""
              : current,
          );
        } else {
          setMediaError("A replacement captured audio track remains muted after seeking. The browser may not be producing audio samples for this source; check the development WebRTC audio stats and try a supported codec or browser.");
        }
      }, 1200);
    } catch (recoveryError) {
      replacementCapture?.getTracks().forEach((track) => track.stop());
      setMediaError(`Movie audio recovery failed: ${recoveryError.message}`);
    } finally {
      audioRecoveryRef.current = false;
    }
  };

  const checkAudioAfterTransition = () => {
    if (!isHost || !videoRef.current || videoRef.current.paused) return;
    if (seekRecoveryTimerRef.current) {
      window.clearTimeout(seekRecoveryTimerRef.current);
    }
    seekRecoveryTimerRef.current = window.setTimeout(() => {
      const audioTrack = streamRef.current?.getAudioTracks().find(
        (track) => track.readyState === "live",
      );
      if (!audioTrack?.muted) return;
      if (import.meta.env.DEV) {
        console.info("[DishWithU] Host capture audio remains muted after media transition:", {
          trackId: audioTrack.id,
          readyState: audioTrack.readyState,
          playbackTime: videoRef.current?.currentTime,
        });
      }
      void recoverAudioCapture();
    }, 1200);
  };

  const logHostAudioState = (transition) => {
    if (!import.meta.env.DEV || !isHost) return;
    const audioSender = peerRef.current?.getSenders().find(
      (sender) => sender.track?.kind === "audio",
    );
    console.info(`[DishWithU] Host audio state after ${transition}:`, {
      playbackTime: videoRef.current?.currentTime,
      paused: videoRef.current?.paused,
      captured: streamRef.current?.getAudioTracks().map(({ id, readyState, enabled, muted }) => ({
        id,
        readyState,
        enabled,
        muted,
      })),
      senderTrackId: audioSender?.track?.id,
      senderTrackState: audioSender?.track?.readyState,
    });
  };

  const onVideoMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
    if (Number.isFinite(video.duration)) setDuration(video.duration);
    if (!isHost || !selectedFile) return;
    const nextMovie = { name: selectedFile.name, type: selectedFile.type || "video", duration: videoDuration };
    setMovie(nextMovie);
    setMovieBusy(false);
    socket?.emit("movie:ready", { roomId, ...nextMovie });
    void publishCurrentStream();
    if (resumeAfterLoadRef.current) {
      resumeAfterLoadRef.current = false;
      video.play().then(() => {
        setIsPlaying(true);
        remotePlaybackRef.current = { currentTime: 0, isPlaying: true, startedAt: Date.now() };
        socket?.emit("playback:play", { roomId, currentTime: 0 });
      }).catch(() => setMediaError("The new movie is ready. Press play to start it."));
    }
  };

  const selectVideo = (event) => {
    if (!isHost) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi|wmv|mpeg|mpg|3gp)$/i.test(file.name)) {
      setMediaError("Choose a video file supported by your browser.");
      return;
    }
    resumeAfterLoadRef.current = Boolean(isPlaying);
    if (seekRecoveryTimerRef.current) {
      window.clearTimeout(seekRecoveryTimerRef.current);
      seekRecoveryTimerRef.current = null;
    }
    if (audioRecoveryVerifyTimerRef.current) {
      window.clearTimeout(audioRecoveryVerifyTimerRef.current);
      audioRecoveryVerifyTimerRef.current = null;
    }
    const previousUrl = urlRef.current;
    videoRef.current?.pause();
    const nextUrl = URL.createObjectURL(file);
    urlRef.current = nextUrl;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    setSelectedFile({ name: file.name, type: file.type || "video", size: file.size });
    setMovieBusy(true);
    setMediaError("");
    setCurrentTime(0);
    setIsPlaying(false);
    setUrl(nextUrl);
  };

  const sharedPlaybackTime = () => {
    const playback = remotePlaybackRef.current;
    if (isHost) return videoRef.current?.currentTime ?? playback.currentTime;
    return playback.currentTime + (playback.isPlaying
      ? Math.max(0, Date.now() - playback.startedAt) / 1000
      : 0);
  };

  const togglePlayback = async () => {
    if (!videoRef.current || movieBusy || !(url || remoteStream)) return;
    const video = videoRef.current;
    if (video.paused) {
      if (!await attemptPlayback(video)) return;
      setIsPlaying(true);
      const playbackTime = sharedPlaybackTime();
      remotePlaybackRef.current = { currentTime: playbackTime, isPlaying: true, startedAt: Date.now() };
      if (!socket?.connected) {
        setMediaError("Playback changed locally, but the room is reconnecting.");
        return;
      }
      socket?.emit("playback:play", { roomId, currentTime: playbackTime });
    } else {
      const playbackTime = sharedPlaybackTime();
      video.pause();
      setIsPlaying(false);
      remotePlaybackRef.current = { currentTime: playbackTime, isPlaying: false, startedAt: Date.now() };
      if (!socket?.connected) {
        setMediaError("Playback changed locally, but the room is reconnecting.");
        return;
      }
      socket?.emit("playback:pause", { roomId, currentTime: playbackTime });
    }
  };

  const enableRemotePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    setIsMuted(false);
    video.muted = false;
    if (await attemptPlayback(video)) setMediaError("");
  };

  const seekTo = (time) => {
    if (!videoRef.current || !Number.isFinite(time) || !(url || remoteStream)) return;
    const nextTime = Math.max(0, Math.min(time, duration || time));
    const video = videoRef.current;
    if (isHost && video.readyState >= 1) {
      const previousTime = video.currentTime;
      video.currentTime = nextTime;
      if (import.meta.env.DEV) {
        console.info("[DishWithU] Host seek requested:", {
          from: previousTime,
          to: nextTime,
          audioTrack: streamRef.current?.getAudioTracks().map(({ id, readyState, muted }) => ({ id, readyState, muted })),
        });
      }
    }
    setCurrentTime(nextTime);
    remotePlaybackRef.current = { ...remotePlaybackRef.current, currentTime: nextTime, startedAt: Date.now() };
    if (!socket?.connected) {
      setMediaError("The seek changed locally, but the room is reconnecting.");
      return;
    }
    socket?.emit("playback:seek", { roomId, currentTime: nextTime });
  };

  const revealControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    if (isPlaying) controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2200);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else {
      setChatOpen(false);
      playerFrameRef.current?.requestFullscreen?.().catch(() => {});
    }
  };

  const sendReaction = (reaction) => {
    if (socket?.connected) socket.emit("reaction:send", { roomId, reaction });
    else setChatError("Reconnecting to the room. Your reaction wasn’t sent.");
  };

  const stopLocalMedia = () => {
    if (seekRecoveryTimerRef.current) {
      window.clearTimeout(seekRecoveryTimerRef.current);
      seekRecoveryTimerRef.current = null;
    }
    if (audioRecoveryVerifyTimerRef.current) {
      window.clearTimeout(audioRecoveryVerifyTimerRef.current);
      audioRecoveryVerifyTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
  };
  const closeRoom = async () => {
    setBusy(true);
    setError("");
    try {
      await roomApi.close(token, roomId);
      stopLocalMedia();
      closePeer();
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e.message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };
  const leave = () => {
    stopLocalMedia();
    closePeer();
    navigate("/dashboard", { replace: true });
  };
  if (loading)
    return (
      <div className="loader room-loader">
        <Spinner />
        <p>Opening your room</p>
      </div>
    );
  if (!room)
    return (
      <main className="room-missing">
        <Film size={28} />
        <h1>This room isn’t available.</h1>
        <p>{error}</p>
        <Link className="button primary" to="/dashboard">
          Back to your space
        </Link>
      </main>
    );
  const chatVisible = chatOpen;
  const roomChat = (
    <ChatPanel
      messages={messages}
      myId={myId}
      chatVisible={chatVisible}
      isFullscreen={isFullscreen}
      socketStatus={socketStatus}
      chatPanelRef={chatPanelRef}
      chatEndRef={chatEndRef}
      chatError={chatError}
      onClose={() => setChatOpen(false)}
      onSendMessage={sendMessage}
      messageDraft={messageDraft}
      onMessageDraftChange={(event) => setMessageDraft(event.target.value)}
      socketConnected={Boolean(socket?.connected)}
    />
  );
  return (
    <main className={`watch page-enter ${leftSidebarOpen ? "sidebar-open" : ""} ${chatOpen ? "chat-open" : ""}`} data-theme={theme.toLowerCase()}>
      <header className="room-head">
        <div>
          <button className="icon-btn drawer-trigger" onClick={() => setLeftSidebarOpen((open) => !open)} title={leftSidebarOpen ? "Close room navigation" : "Open room navigation"} aria-label={leftSidebarOpen ? "Close room navigation" : "Open room navigation"} aria-expanded={leftSidebarOpen}><PanelLeft size={16} /></button>
          <Link to="/dashboard" className="brand-icon">
            <Heart size={15} fill="currentColor" />
          </Link>
          <span>
            ROOM <b>{room.roomId}</b>
          </span>
          <button
            className="icon-btn"
            aria-label="Copy room ID"
            onClick={() => navigator.clipboard.writeText(room.roomId)}
          >
            <Copy size={14} />
          </button>
          {isHost && <button className="icon-btn header-movie-button" onClick={() => fileInputRef.current?.click()} title={movie.name ? "Change movie" : "Choose movie"} aria-label={movie.name ? "Change movie" : "Choose movie"}><Film size={15} /><span>{movie.name ? "Change movie" : "Choose movie"}</span></button>}
        </div>
        <div>
          <span className={`socket-state ${socketStatus}`}>
            <i />
            {socketStatus === "connected"
              ? "Connected"
              : socketStatus === "disconnected"
                ? "Reconnecting"
                : "Connecting"}
          </span>
          <span className={`peer-state ${peerStatus}`} title={peerStatus === "connected" ? "Peer video connected" : peerStatus === "connecting" ? "Connecting video" : peerStatus === "disconnected" ? "Peer video disconnected" : "Waiting for host video"}><i />{peerStatus === "connected" ? "Video ready" : peerStatus === "connecting" ? "Video connecting" : peerStatus === "disconnected" ? "Video offline" : "Waiting video"}</span>
          <span className="people-count">
            <UsersRound size={14} />
            {people.length}/{room.maxParticipants}
          </span>
          <button className={`icon-btn chat-trigger ${chatOpen ? "active" : ""}`} onClick={() => { setChatOpen((open) => !open); setUnreadMessages(0); }} title={chatOpen ? "Close chat" : "Open chat"} aria-label={chatOpen ? "Close chat" : "Open chat"} aria-expanded={chatOpen}>
            {chatOpen ? <X size={15} /> : <MessageCircle size={15} />}
            <span>{chatOpen ? "Close Chat" : "Chat"}</span>
            {unreadMessages > 0 && !chatOpen && <i className="unread-badge">{unreadMessages > 9 ? "9+" : unreadMessages}</i>}
          </button>
          {isHost && <button className="icon-btn room-theme-trigger" onClick={() => { setThemeDraft(theme); setThemePickerOpen(true); }} title="Change room theme" aria-label="Change room theme"><Palette size={15} /></button>}
          <button
            className="icon-btn"
            onClick={leave}
            title="Leave room"
            aria-label="Leave room"
          >
            <LogOut size={15} />
          </button>
          {isHost && (
            <button className="close-room" onClick={() => setConfirm(true)}>
              <X size={14} /> Close room
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="room-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
      <aside className={`room-rail ${leftSidebarOpen ? "open" : ""}`} aria-hidden={!leftSidebarOpen} inert={!leftSidebarOpen}>
        <div className="rail-head"><Link to="/dashboard" className="rail-brand"><span className="brand-icon"><Heart size={15} fill="currentColor" /></span><b>DishWithU</b></Link><button className="icon-btn" onClick={() => setLeftSidebarOpen(false)} title="Close navigation" aria-label="Close navigation"><X size={16} /></button></div>
        <div className="rail-summary"><span>ROOM</span><b>{room.roomId}</b><small><i className={socketStatus === "connected" ? "live-dot" : "wait-dot"} /> {people.length}/{room.maxParticipants} members</small><small className="room-theme-label"><Palette size={12} /> {theme}</small></div>
        <span className="rail-label">YOUR ROOM</span>
        <button className="rail-item active" onClick={() => playerFrameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}><Film size={15} /> Movie player</button>
        <button className="rail-item" onClick={() => { setChatOpen(true); setUnreadMessages(0); }}><MessageCircle size={15} /> Chat {unreadMessages > 0 && <small className="rail-unread">{unreadMessages}</small>}</button>
        <button className="rail-item" onClick={() => { setThemeDraft(theme); setThemePickerOpen(true); }} disabled={!isHost} title={isHost ? "Choose the room theme" : `Host selected ${theme}`}><Palette size={15} /> Theme {isHost && <ArrowRight size={12} />}</button>
        <button className="rail-item disabled" disabled title="No room settings are exposed by this backend"><Settings size={15} /> Room settings</button>
        {isHost && <button className="rail-item rail-close" onClick={() => setConfirm(true)}><X size={15} /> Close room</button>}
        <button className="rail-leave" onClick={leave}><LogOut size={14} /> Leave room</button>
      </aside>
      <section className="watch-grid">
        <div className="player">
          <div className="player-heading">
            <div>
              <span className="eyebrow">A LITTLE BIG SCREEN</span>
              <h1>{movie.name || (isHost ? "Choose tonight’s movie" : "Waiting for your host")}</h1>
              {movie.name && <small className="movie-subtitle">{movie.type || "Video"} {duration ? `· ${formatTime(duration)}` : ""}</small>}
            </div>
            {isHost ? <button className="button change-movie" onClick={() => fileInputRef.current?.click()}><Film size={15} /> {movie.name ? "Change Movie" : "Choose Movie"}</button> : <span className="private-tag"><LockKeyhole size={12} /> HOST CONTROLS PLAYBACK</span>}
          </div>
          <input ref={fileInputRef} className="movie-file-input" type="file" accept="video/*" onChange={selectVideo} />
          <div className={`video-box ${controlsVisible ? "controls-visible" : "controls-idle"}`} ref={playerFrameRef} onPointerMove={revealControls} onMouseLeave={() => { if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current); if (isPlaying) setControlsVisible(false); }}>
            {isHost && selectedFile && <button className="mobile-change-movie" onClick={() => fileInputRef.current?.click()} title="Change movie" aria-label="Change movie"><Film size={15} /></button>}
            {isFullscreen && <button className="fullscreen-chat-trigger" onClick={() => { setChatOpen((open) => !open); setUnreadMessages(0); }} title={chatOpen ? "Close chat" : "Open chat"} aria-label={chatOpen ? "Close chat" : "Open chat"}>{chatOpen ? <X size={18} /> : <MessageCircle size={18} />}{unreadMessages > 0 && !chatOpen && <i className="unread-badge">{unreadMessages > 9 ? "9+" : unreadMessages}</i>}</button>}
            <ReactionPicker
              theme={theme}
              open={reactionPickerOpen}
              onToggle={() => setReactionPickerOpen((open) => !open)}
              onSend={(reaction) => {
                sendReaction(reaction);
                setReactionPickerOpen(false);
              }}
            />
            {url || remoteStream ? (
              <video
                ref={videoRef}
                src={isHost ? url : undefined}
                style={{ objectFit: videoFit }}
                controls={false}
                playsInline
                preload="metadata"
                onLoadedMetadata={onVideoMetadata}
                onError={() => {
                  const mediaErrorCode = videoRef.current?.error?.code;
                  const message = !isHost
                    ? "The received movie stream could not be decoded by your browser."
                    : mediaErrorCode === MediaError.MEDIA_ERR_DECODE
                      ? "This video’s codec could not be decoded by your browser. Try a browser-supported video format."
                      : mediaErrorCode === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                        ? "This video format or codec is not supported by your browser."
                        : "The video could not be loaded. Choose another file or try again.";
                  setMovieBusy(false);
                  setMediaError(message);
                }}
                onSeeking={() => {
                  if (seekRecoveryTimerRef.current) {
                    window.clearTimeout(seekRecoveryTimerRef.current);
                  }
                  logHostAudioState("seek start");
                }}
                onSeeked={() => {
                  logHostAudioState("seeked");
                  checkAudioAfterTransition();
                }}
                onTimeUpdate={(event) => { if (isHost && !seeking) setCurrentTime(event.currentTarget.currentTime); }}
                onPlay={() => {
                  setIsPlaying(true);
                  remotePlaybackRef.current = { ...remotePlaybackRef.current, currentTime: isHost ? videoRef.current?.currentTime || 0 : remotePlaybackRef.current.currentTime, isPlaying: true, startedAt: Date.now() };
                  logHostAudioState("resume");
                  checkAudioAfterTransition();
                }}
                onPause={() => {
                  setIsPlaying(false);
                  remotePlaybackRef.current = { ...remotePlaybackRef.current, currentTime: isHost ? videoRef.current?.currentTime || 0 : remotePlaybackRef.current.currentTime, isPlaying: false, startedAt: Date.now() };
                  logHostAudioState("pause");
                }}
                onEnded={() => { socket?.emit("playback:pause", { roomId, currentTime: isHost ? videoRef.current?.currentTime || 0 : remotePlaybackRef.current.currentTime }); }}
              />
            ) : (
              <div className="video-empty">
                <span>
                  <Film size={26} />
                </span>
                <h2>
                  {isHost
                    ? "Your screen, your story."
                    : "The host’s movie will appear here."}
                </h2>
                <p>
                  {isHost
                    ? "Choose a video stored on this device to share it privately."
                    : movie.name ? `Connecting to ${movie.name}...` : "Your host is choosing a movie..."}
                </p>
                {isHost && <button className="button cream upload" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Choose Movie</button>}
              </div>
            )}
            {playbackBlocked && !isHost && <button className="sound-enable-prompt" onClick={enableRemotePlayback}><Volume2 size={17} /> Click to start playback with sound</button>}
            {movieBusy && <div className="movie-preparing"><Spinner /> Preparing local movie...</div>}
            <ReactionOverlay reactions={reactionBursts} />
            <VideoControls
              available={Boolean(url || remoteStream)}
              controlsVisible={controlsVisible}
              duration={duration}
              currentTime={currentTime}
              movieBusy={movieBusy}
              isPlaying={isPlaying}
              isHost={isHost}
              isMuted={isMuted}
              volume={volume}
              videoFit={videoFit}
              seeking={seeking}
              onSeekingChange={setSeeking}
              onCurrentTimeChange={setCurrentTime}
              onSeek={seekTo}
              onPlaybackToggle={togglePlayback}
              onMuteToggle={() => setIsMuted((value) => !value)}
              onVolumeChange={(event) => {
                setVolume(Number(event.target.value));
                setIsMuted(false);
              }}
              onFitToggle={() => setVideoFit((mode) => mode === "contain" ? "cover" : "contain")}
              onFullscreen={toggleFullscreen}
              onShowControls={() => setControlsVisible(true)}
            />
          </div>
          {selectedFile && isHost && <div className="movie-file-info"><span><Film size={14} /><b>{selectedFile.name}</b></span><small>{selectedFile.type || "Video file"}{selectedFile.size ? ` · ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : ""} · Local only</small>{movieBusy && <span className="preparing-label"><Spinner /> Preparing</span>}</div>}
          <ErrorText>{mediaError}</ErrorText>
          <div className="privacy-note">
            <ShieldCheck size={16} />
            <span>
              <b>Your video stays yours.</b> Streamed peer-to-peer from this
              device, never sent to the server.
            </span>
            <Sparkles size={15} />
          </div>
        </div>
      </section>
      {!isFullscreen && roomChat}
      {isFullscreen && fullscreenTarget && createPortal(roomChat, fullscreenTarget)}
      {confirm && (
        <CloseRoomModal
          error={error}
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={closeRoom}
        />
      )}
      {themePickerOpen && isHost && (
        <ThemePickerModal
          theme={theme}
          themeDraft={themeDraft}
          setThemeDraft={setThemeDraft}
          themeBusy={themeBusy}
          error={error}
          onClose={() => setThemePickerOpen(false)}
          onSave={updateTheme}
        />
      )}
    </main>
  );
}

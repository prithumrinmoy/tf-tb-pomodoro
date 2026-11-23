import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, Pause, RotateCcw, SkipForward, Settings, Music2, Upload,
  Volume2, VolumeX, Maximize, Minimize, X, Headphones, Coffee,
  Timer, Check, Github, Linkedin, Mail, ExternalLink, Keyboard,
  CircleHelp, ChevronDown
} from "lucide-react";

const DEFAULTS = { focus: 50, break: 10 };

const formatTime = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

export default function App() {
  const [durations, setDurations] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("tf-durations") || "{}") }; }
    catch { return DEFAULTS; }
  });
  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(durations.focus * 60);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(65);
  const [muted, setMuted] = useState(false);
  const [musicName, setMusicName] = useState("");
  const [musicReady, setMusicReady] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [repeat, setRepeat] = useState(true);
  const [toast, setToast] = useState("");
  const [sessions, setSessions] = useState(() => Number(localStorage.getItem("tf-sessions") || 0));
  const [showHelp, setShowHelp] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const objectUrlRef = useRef(null);
  const remainingRef = useRef(remaining);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => { localStorage.setItem("tf-durations", JSON.stringify(durations)); }, [durations]);
  useEffect(() => { remainingRef.current = remaining; }, [remaining]);

  const installAudio = useCallback((file) => {
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    if (audioRef.current) {
      audioRef.current.src = objectUrlRef.current;
      audioRef.current.load();
    }
    setMusicName(file.name);
    setMusicReady(true);
    setMusicPlaying(false);
  }, []);

  // Music is session-only: nothing is saved to a database or uploaded to a server.
  // The user selects a local audio file whenever they want music.
  useEffect(() => {
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume / 100;
    audioRef.current.loop = repeat;
  }, [volume, muted, repeat]);

  useEffect(() => {
    if (!running || !endAt) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        setRunning(false);
        setEndAt(null);
        if (mode === "focus") {
          setSessions(s => {
            const updated = s + 1;
            localStorage.setItem("tf-sessions", String(updated));
            return updated;
          });
          notify("Focus session complete. Time to take a break.");
        } else {
          notify("Break complete. Ready for another focus session?");
        }
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(mode === "focus" ? "Focus complete!" : "Break is over", {
            body: mode === "focus" ? "You earned a break. Stretch and recharge." : "Ready to focus again?"
          });
        }
        const nextMode = mode === "focus" ? "break" : "focus";
        setMode(nextMode);
        setRemaining(durations[nextMode] * 60);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, endAt, mode, durations, notify]);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const startPause = () => {
    if (running) {
      setRunning(false);
      setEndAt(null);
    } else {
      setEndAt(Date.now() + remaining * 1000);
      setRunning(true);
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  };
  const resetTimer = () => {
    setRunning(false);
    setEndAt(null);
    setRemaining(durations[mode] * 60);
  };
  const switchMode = (next) => {
    setRunning(false);
    setEndAt(null);
    setMode(next);
    setRemaining(durations[next] * 60);
  };
  const skipMode = () => switchMode(mode === "focus" ? "break" : "focus");

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { notify("Fullscreen isn't available in this browser."); }
  };
  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio || !musicReady) { fileRef.current?.click(); return; }
    if (audio.paused) {
      try { await audio.play(); setMusicPlaying(true); }
      catch { notify("Your browser blocked playback. Press play again."); }
    } else {
      audio.pause(); setMusicPlaying(false);
    }
  };
  const uploadMusic = (file) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) { notify("Please choose an audio file."); return; }
    installAudio(file);
    notify("Music loaded for this session. It is not saved or uploaded.");
  };
  const clearMusic = () => {
    audioRef.current?.pause();
    setMusicPlaying(false);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    if (audioRef.current) audioRef.current.removeAttribute("src");
    setMusicName("");
    setMusicReady(false);
    notify("Music removed from this browser.");
  };

  useEffect(() => {
    const handleKeys = (e) => {
      const tag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.code === "Space") { e.preventDefault(); startPause(); }
      if (e.key.toLowerCase() === "r") resetTimer();
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (e.key.toLowerCase() === "m") setCompact(v => !v);
      if (e.key === "Escape") { setSettingsOpen(false); setShowHelp(false); }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  });

  const total = durations[mode] * 60;
  const progress = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const circumference = 2 * Math.PI * 138;
  const offset = circumference * (1 - progress);

  return (
    <main className={`app-shell ${mode === "break" ? "break-mode" : "focus-mode"} ${compact ? "compact-mode" : ""}`}>
      <audio ref={audioRef} onEnded={() => setMusicPlaying(false)} />
      {!compact && (
        <header className="topbar">
          <a className="brand" href="#" onClick={e => e.preventDefault()}>
            <span className="brand-mark">PRI<span>THU</span></span>
            <span>FOCUS <small>POMODORO</small></span>
          </a>
          <div className="top-actions">
            <div className="session-count"><Check size={14} /> {sessions} focus sessions</div>
            <button className="icon-button" onClick={() => setShowHelp(true)} title="Shortcuts"><Keyboard size={18}/></button>
            <button className="icon-button" onClick={() => setSettingsOpen(true)} title="Settings"><Settings size={18}/></button>
          </div>
        </header>
      )}

      <section className="timer-layout">
        <article className={`timer-panel focus-panel ${mode === "focus" ? "active-panel" : ""}`}>
          <div className="panel-inner">
            <div className="mode-kicker"><span className="status-dot"/> DEEP WORK SESSION</div>
            <h1>FOCUS</h1>
            <div className="timer-visual">
              <svg className="progress-ring" viewBox="0 0 300 300" aria-label={`Focus progress ${Math.round(progress * 100)} percent`}>
                <circle className="ring-track" cx="150" cy="150" r="138"/>
                <circle className="ring-progress" cx="150" cy="150" r="138"
                  strokeDasharray={circumference} strokeDashoffset={mode === "focus" ? offset : circumference}/>
              </svg>
              <div className="timer-symbol"><Timer size={64} strokeWidth={1.35}/></div>
            </div>
            <div className="time-display">{mode === "focus" ? formatTime(remaining) : formatTime(durations.focus * 60)}</div>
            <p className="panel-caption">{mode === "focus" ? (running ? "Stay with it. You're doing great." : "One thing at a time.") : "Focus is resting. Recharge for the next round."}</p>
            <div className="panel-controls">
              <button className="control-button secondary-control" onClick={resetTimer} title="Reset"><RotateCcw size={19}/></button>
              <button className="control-button primary-control" onClick={mode === "focus" ? startPause : () => switchMode("focus")}>
                {mode === "focus" ? (running ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>) : <Play size={20} fill="currentColor"/>}
                <span>{mode === "focus" ? (running ? "PAUSE" : "START FOCUS") : "START FOCUS"}</span>
              </button>
              <button className="control-button secondary-control" onClick={skipMode} title="Skip to break"><SkipForward size={19}/></button>
            </div>
            <div className="duration-chip"><span>TF DURATION</span><strong>{durations.focus} MIN</strong><button onClick={() => setSettingsOpen(true)}>EDIT</button></div>
          </div>
        </article>

        <article className={`timer-panel break-panel ${mode === "break" ? "active-panel" : ""}`}>
          <div className="panel-inner">
            <div className="mode-kicker"><span className="status-dot"/> REST & RECOVER</div>
            <h1>BREAK</h1>
            <div className="timer-visual">
              <svg className="progress-ring" viewBox="0 0 300 300">
                <circle className="ring-track" cx="150" cy="150" r="138"/>
                <circle className="ring-progress" cx="150" cy="150" r="138"
                  strokeDasharray={circumference} strokeDashoffset={mode === "break" ? offset : circumference}/>
              </svg>
              <div className="timer-symbol"><Coffee size={66} strokeWidth={1.35}/></div>
            </div>
            <div className="time-display">{mode === "break" ? formatTime(remaining) : formatTime(durations.break * 60)}</div>
            <p className="panel-caption">{mode === "break" ? (running ? "Take a breath. You've earned this." : "A little rest goes a long way.") : "Your next break is waiting."}</p>
            <div className="panel-controls">
              <button className="control-button secondary-control" onClick={resetTimer} title="Reset"><RotateCcw size={19}/></button>
              <button className="control-button primary-button-light" onClick={mode === "break" ? startPause : () => switchMode("break")}>
                {mode === "break" ? (running ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>) : <Coffee size={20}/>}
                <span>{mode === "break" ? (running ? "PAUSE" : "START BREAK") : "TAKE A BREAK"}</span>
              </button>
              <button className="control-button secondary-control" onClick={skipMode} title="Skip to focus"><SkipForward size={19}/></button>
            </div>
            <div className="duration-chip"><span>TB DURATION</span><strong>{durations.break} MIN</strong><button onClick={() => setSettingsOpen(true)}>EDIT</button></div>
          </div>
        </article>
      </section>

      <footer className="player-bar">
        <div className="music-info">
          <div className={`music-art ${musicPlaying ? "music-active" : ""}`}><Headphones size={19}/></div>
          <div className="music-label"><strong>{musicName || "Your focus soundtrack"}</strong><span>{musicReady ? "LOCAL AUDIO • PRIVATE" : "ADD YOUR OWN MUSIC"}</span></div>
        </div>
        <div className="music-controls">
          <button className="player-button upload-button" onClick={() => fileRef.current?.click()}><Upload size={16}/><span>{musicReady ? "CHANGE TRACK" : "UPLOAD MUSIC"}</span></button>
          <button className="player-button play-music" onClick={toggleMusic} title={musicPlaying ? "Pause music" : "Play music"}>{musicPlaying ? <Pause size={17}/> : <Play size={17}/>}</button>
          <button className={`player-button repeat-button ${repeat ? "selected" : ""}`} onClick={() => setRepeat(v => !v)} title="Toggle repeat">↻</button>
          <div className="volume-control"><button className="player-button" onClick={() => setMuted(v => !v)}>{muted || volume === 0 ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><input aria-label="Music volume" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))}/></div>
          {musicReady && <button className="player-button remove-track" onClick={clearMusic} title="Remove track"><X size={16}/></button>}
        </div>
        <div className="view-controls">
          <button className="view-button" onClick={() => setCompact(v => !v)} title="Minimize mode"><Minimize size={17}/><span>MINIMIZE</span></button>
          <button className="view-button" onClick={toggleFullscreen} title="Fullscreen">{isFullscreen ? <Minimize size={17}/> : <Maximize size={17}/>}<span>{isFullscreen ? "EXIT FULL" : "FULLSCREEN"}</span></button>
        </div>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => { uploadMusic(e.target.files?.[0]); e.target.value = ""; }}/>
      </footer>

      {compact && (
        <div className="compact-card">
          <div className="compact-top"><span className="compact-brand">TF / TB</span><button onClick={() => setCompact(false)}><Maximize size={16}/> Expand</button></div>
          <div className="compact-mode-label">{mode === "focus" ? "FOCUS SESSION" : "BREAK TIME"}</div>
          <div className="compact-time">{formatTime(remaining)}</div>
          <div className="compact-progress"><span style={{width: `${progress * 100}%`}}/></div>
          <div className="compact-actions">
            <button onClick={resetTimer}><RotateCcw size={17}/></button>
            <button className="compact-play" onClick={startPause}>{running ? <Pause size={18}/> : <Play size={18}/>} {running ? "PAUSE" : "START"}</button>
            <button onClick={skipMode}><SkipForward size={17}/></button>
          </div>
        </div>
      )}

      <div className="bottom-note">
        <span>MAKE TIME FOR WHAT MATTERS.</span>
        <button onClick={() => setProfileOpen(true)}>ABOUT THE CREATOR <ExternalLink size={12}/></button>
      </div>

      {settingsOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
        <section className="modal settings-modal">
          <div className="modal-heading"><div><span className="eyebrow">PERSONALIZE YOUR FLOW</span><h2>Timer settings</h2></div><button className="icon-button" onClick={() => setSettingsOpen(false)}><X/></button></div>
          <p className="modal-description">Set the length of your focus sessions and breaks. Changes apply to the next reset or session.</p>
          <div className="duration-settings">
            <label><span>FOCUS TIME (TF)</span><div className="number-field"><input type="number" min="1" max="180" value={durations.focus} onChange={e => setDurations(d => ({...d, focus: Math.min(180, Math.max(1, Number(e.target.value) || 1))}))}/><b>MIN</b></div></label>
            <label><span>BREAK TIME (TB)</span><div className="number-field"><input type="number" min="1" max="60" value={durations.break} onChange={e => setDurations(d => ({...d, break: Math.min(60, Math.max(1, Number(e.target.value) || 1))}))}/><b>MIN</b></div></label>
          </div>
          <div className="preset-row"><span>QUICK PRESETS</span><button onClick={() => setDurations({focus:25,break:5})}>25 / 5</button><button onClick={() => setDurations({focus:50,break:10})}>50 / 10</button><button onClick={() => setDurations({focus:90,break:15})}>90 / 15</button></div>
          <div className="modal-tip"><CircleHelp size={17}/> Changing durations won't interrupt a timer already running. Press reset to apply the new duration.</div>
          <button className="modal-primary" onClick={() => { if (!running) setRemaining(durations[mode] * 60); setSettingsOpen(false); notify("Timer settings saved."); }}>SAVE SETTINGS</button>
        </section>
      </div>}

      {showHelp && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowHelp(false); }}>
        <section className="modal help-modal">
          <div className="modal-heading"><div><span className="eyebrow">WORK FASTER</span><h2>Keyboard shortcuts</h2></div><button className="icon-button" onClick={() => setShowHelp(false)}><X/></button></div>
          <div className="shortcut-list">{[["Space","Start / pause timer"],["R","Reset current timer"],["F","Toggle fullscreen"],["M","Toggle minimize mode"],["Esc","Close open panel"]].map(([key,desc])=><div key={key}><span>{desc}</span><kbd>{key}</kbd></div>)}</div>
        </section>
      </div>}

      {profileOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setProfileOpen(false); }}>
        <section className="modal profile-modal">
          <div className="modal-heading"><div><span className="eyebrow">BUILT WITH PURPOSE</span><h2>About the creator</h2></div><button className="icon-button" onClick={() => setProfileOpen(false)}><X/></button></div>
          <div className="creator-avatar">PM</div>
          <h3>Prithu Mrinmoy</h3>
          <p className="creator-role">BSc in CSE · Green University of Bangladesh</p>
          <p className="creator-bio">ICT Instructor & Founder of ICT Wizard. A simple productivity tool built to make focused work feel a little easier. Customize your sessions, bring your own soundtrack, and make every minute count.</p>
          <div className="creator-links">
            <a href="https://www.linkedin.com/in/aamamun-prithu/" target="_blank" rel="noreferrer"><Linkedin size={17}/> LinkedIn <ExternalLink size={13}/></a>
            <a href="https://github.com/prithumrinmoy" target="_blank" rel="noreferrer"><Github size={17}/> GitHub <ExternalLink size={13}/></a>
            <a href="mailto:mrprithumrinmoy@gmail.com"><Mail size={17}/> Email <ExternalLink size={13}/></a>
          </div>
        </section>
      </div>}
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </main>
  );
}

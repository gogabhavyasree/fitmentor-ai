import { useEffect, useRef, useState } from 'react';

// Web Audio synthesizer tone helper
const playBeep = (freq = 440, duration = 0.15, type = 'sine') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may be restricted by autoplay policy until user interacts
  }
};

function VoiceCoachWidget({ autoOpen = false }) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [mode, setMode] = useState('rest'); // 'rest' | 'tempo'
  const [initialSeconds, setInitialSeconds] = useState(60);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  // Metronome / Tempo state
  const [tempoState, setTempoState] = useState('Idle'); // 'Down', 'Hold', 'Up', 'Idle'
  const [tempoRunning, setTempoRunning] = useState(false);
  const [tempoRepCount, setTempoRepCount] = useState(0);

  const timerRef = useRef(null);
  const tempoRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);

  // Load available browser voices
  useEffect(() => {
    if (!synthRef.current) return;
    const updateVoices = () => {
      const available = synthRef.current.getVoices().filter((v) => v.lang.startsWith('en'));
      setVoices(available.length > 0 ? available : synthRef.current.getVoices());
    };
    updateVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = (text) => {
    if (!voiceEnabled || !synthRef.current) return;
    try {
      synthRef.current.cancel(); // cancel pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      if (voices[selectedVoiceIndex]) {
        utterance.voice = voices[selectedVoiceIndex];
      }
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      synthRef.current.speak(utterance);
    } catch {
      // Speech synthesis error handling
    }
  };

  // Rest Timer countdown
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          if (soundEnabled) playBeep(880, 0.4, 'triangle');
          speak('Rest complete! Ready for your next set.');
          return 0;
        }

        const next = prev - 1;

        // Cues at key intervals
        if (next === Math.floor(initialSeconds / 2) && initialSeconds >= 30) {
          speak('Halfway through your rest.');
        } else if (next === 10) {
          speak('Ten seconds left. Get in position.');
        } else if (next === 3 || next === 2 || next === 1) {
          if (soundEnabled) playBeep(520, 0.1, 'sine');
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning, initialSeconds, soundEnabled, voiceEnabled]);

  const startTimer = (secs) => {
    const s = secs !== undefined ? secs : secondsLeft;
    if (s <= 0) {
      setSecondsLeft(initialSeconds);
    }
    setIsRunning(true);
    if (soundEnabled) playBeep(440, 0.12, 'sine');
    speak(`Rest starting. ${s || initialSeconds} seconds.`);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    speak('Timer paused.');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  };

  const selectPreset = (secs) => {
    setInitialSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(false);
  };

  const adjustSeconds = (delta) => {
    setSecondsLeft((prev) => Math.max(5, prev + delta));
    setInitialSeconds((prev) => Math.max(5, prev + delta));
  };

  // Tempo / Metronome cycle (2s eccentric, 1s isometric, 2s concentric)
  useEffect(() => {
    if (!tempoRunning) {
      if (tempoRef.current) clearInterval(tempoRef.current);
      setTempoState('Idle');
      return;
    }

    const phases = [
      { name: 'Lower Down (2s)', duration: 2000, beep: 380, speak: 'Down' },
      { name: 'Hold at Bottom (1s)', duration: 1000, beep: 440, speak: 'Hold' },
      { name: 'Drive Up (2s)', duration: 2000, beep: 580, speak: 'Up' },
    ];

    let currentPhase = 0;
    speak('Starting tempo metronome.');

    const runPhase = () => {
      const p = phases[currentPhase];
      setTempoState(p.name);
      if (soundEnabled) playBeep(p.beep, 0.12, 'sine');

      currentPhase = (currentPhase + 1) % phases.length;
      if (currentPhase === 0) {
        setTempoRepCount((c) => c + 1);
      }
    };

    runPhase();
    tempoRef.current = setInterval(runPhase, 1600);

    return () => clearInterval(tempoRef.current);
  }, [tempoRunning, soundEnabled]);

  const progressPercent = initialSeconds > 0
    ? Math.max(0, Math.min(100, ((initialSeconds - secondsLeft) / initialSeconds) * 100))
    : 0;

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          className={`voice-coach-launcher ${isRunning ? 'active-pulse' : ''}`}
          onClick={() => setIsOpen(true)}
          title="Open Voice Coach & Rest Timer"
          type="button"
        >
          <span className="coach-icon">🎙️</span>
          <div className="coach-launcher-text">
            <strong>Voice Coach</strong>
            <span>{isRunning ? `${secondsLeft}s remaining` : 'Rest Timer'}</span>
          </div>
          {isRunning && <span className="running-dot" />}
        </button>
      )}

      {/* Expanded Coach Widget */}
      {isOpen && (
        <div className="voice-coach-panel form-card" role="dialog" aria-label="Voice Coach & Rest Timer">
          <div className="coach-panel-header">
            <div className="coach-title-wrap">
              <span className="coach-avatar">🎙️</span>
              <div>
                <strong>FitMentor Voice Coach</strong>
                <span className="coach-status-sub">{isRunning ? '⏱️ Rest in progress' : 'Workout Audio Assistant'}</span>
              </div>
            </div>
            <div className="coach-header-actions">
              <button
                className="icon-tool-btn"
                onClick={() => setVoiceEnabled((v) => !v)}
                title={voiceEnabled ? 'Mute Speech' : 'Enable Speech'}
                type="button"
              >
                {voiceEnabled ? '🔊' : '🔇'}
              </button>
              <button
                className="icon-tool-btn"
                onClick={() => setSoundEnabled((s) => !s)}
                title={soundEnabled ? 'Mute Beeps' : 'Enable Beeps'}
                type="button"
              >
                {soundEnabled ? '🔔' : '🔕'}
              </button>
              <button
                className="coach-close-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize Coach"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="coach-mode-tabs">
            <button
              className={`coach-mode-tab ${mode === 'rest' ? 'active' : ''}`}
              onClick={() => setMode('rest')}
              type="button"
            >
              ⏱️ Rest Timer
            </button>
            <button
              className={`coach-mode-tab ${mode === 'tempo' ? 'active' : ''}`}
              onClick={() => setMode('tempo')}
              type="button"
            >
              🎵 Rep Metronome
            </button>
          </div>

          {mode === 'rest' && (
            <div className="rest-timer-view">
              {/* Circular Digital Countdown Display */}
              <div className="timer-display-ring">
                <svg className="timer-svg" viewBox="0 0 120 120">
                  <circle className="timer-track" cx="60" cy="60" r="52" />
                  <circle
                    className="timer-indicator"
                    cx="60"
                    cy="60"
                    r="52"
                    style={{
                      strokeDasharray: 326.7,
                      strokeDashoffset: 326.7 - (326.7 * progressPercent) / 100,
                    }}
                  />
                </svg>
                <div className="timer-center-text">
                  <span className="timer-digits">
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                  </span>
                  <span className="timer-label">{isRunning ? 'RESTING' : 'READY'}</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="preset-buttons-row">
                {[30, 45, 60, 90, 120].map((secs) => (
                  <button
                    key={secs}
                    className={`preset-pill ${initialSeconds === secs && !isRunning ? 'active' : ''}`}
                    onClick={() => selectPreset(secs)}
                    type="button"
                  >
                    {secs}s
                  </button>
                ))}
              </div>

              {/* Adjust +/- 15s */}
              <div className="adjust-buttons-row">
                <button className="adjust-btn" onClick={() => adjustSeconds(-15)} type="button" title="Subtract 15 seconds">-15s</button>
                <button className="adjust-btn" onClick={() => adjustSeconds(15)} type="button" title="Add 15 seconds">+15s</button>
                <button className="adjust-btn" onClick={resetTimer} type="button" title="Reset timer">Reset</button>
              </div>

              {/* Main Play/Pause Button */}
              <div className="timer-main-actions">
                {isRunning ? (
                  <button className="pause-timer-btn" onClick={pauseTimer} type="button">
                    ⏸ Pause Rest
                  </button>
                ) : (
                  <button className="start-timer-btn" onClick={() => startTimer()} type="button">
                    ▶ Start Rest ({secondsLeft}s)
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'tempo' && (
            <div className="tempo-metronome-view">
              <div className="tempo-display-box">
                <span className="tempo-phase-label">{tempoState}</span>
                <div className="tempo-reps-counter">
                  <strong>{tempoRepCount}</strong>
                  <span>reps completed</span>
                </div>
              </div>

              <p className="tempo-guidance">
                Follow the 2s-1s-2s tempo: Lower down under control for 2 seconds, pause briefly at the bottom, and drive up with power.
              </p>

              <div className="timer-main-actions">
                {tempoRunning ? (
                  <button
                    className="pause-timer-btn"
                    onClick={() => setTempoRunning(false)}
                    type="button"
                  >
                    ⏹ Stop Metronome
                  </button>
                ) : (
                  <button
                    className="start-timer-btn"
                    onClick={() => {
                      setTempoRepCount(0);
                      setTempoRunning(true);
                    }}
                    type="button"
                  >
                    ▶ Start Rep Tempo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Voice Selector Footer */}
          {voices.length > 0 && (
            <div className="coach-voice-selector">
              <label htmlFor="voice-select">Voice:</label>
              <select
                id="voice-select"
                value={selectedVoiceIndex}
                onChange={(e) => {
                  setSelectedVoiceIndex(Number(e.target.value));
                  speak('Voice updated.');
                }}
              >
                {voices.map((v, i) => (
                  <option key={v.name} value={i}>
                    {v.name.slice(0, 24)} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default VoiceCoachWidget;

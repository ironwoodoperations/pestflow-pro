// app.jsx — Composes the 8 scenes inside a Stage, synced to the ElevenLabs voiceover.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "captionPosition": "middle",
  "showSceneChip": true,
  "showSubcopy": true,
  "voiceOn": true
}/*EDITMODE-END*/;

// Per-scene durations tuned to the 71s ElevenLabs render — proportional to
// each line's word count so the caption swap lines up with the narrator.
const SCENES = [
  { dur: 10.8, Component: Scene1_Dashboard, caption: 'One dashboard for your digital presence.',     sub: 'Website, SEO, social, content, leads \u2014 in one place.' },
  { dur: 8.7,  Component: Scene2_Content,   caption: 'Your website, under your control.',             sub: 'Edit any page, swap any image. No developer required.' },
  { dur: 8.7,  Component: Scene3_SEO,       caption: 'Stay relevant in local search.',                sub: 'AI keyword research and page-level optimization.' },
  { dur: 7.9,  Component: Scene4_Locations, caption: 'Cover every city you serve.',                   sub: 'Generate optimized service-area pages in minutes.' },
  { dur: 10.0, Component: Scene5_Social,    caption: 'Post consistently without doing it every day.', sub: 'AI captions. Cross-platform scheduling.' },
  { dur: 7.1,  Component: Scene6_Blog,      caption: 'Publish content that helps you get found.',     sub: 'Long-form posts, drafted with AI and indexed by Google.' },
  { dur: 8.7,  Component: Scene7_Branding,  caption: 'Look and feel \u2014 under your control.',      sub: 'Brand, logo, reviews, and business info in one settings panel.' },
  { dur: 9.1,  Component: Scene8_Lead,      caption: 'Know immediately when a new lead comes in.',    sub: 'Instant alerts and a lightweight lead inbox.' },
];

// Build cumulative start/end times.
let _acc = 0;
SCENES.forEach((s) => { s.start = _acc; _acc += s.dur; s.end = _acc; });
const TOTAL = _acc; // ~71.0
const OUTRO_START = TOTAL - 2.5;

// ── Audio sync: a sibling element inside Stage that tracks Timeline state ──
function VoiceoverAudio({ src, enabled }) {
  const { time, playing } = useTimeline();
  const audioRef = React.useRef(null);

  // Play / pause follows Stage state
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!enabled) { a.pause(); return; }
    if (playing) {
      const p = a.play();
      if (p && p.catch) p.catch(() => {/* autoplay blocked until user gesture */});
    } else {
      a.pause();
    }
  }, [playing, enabled]);

  // Re-sync if user scrubs the timeline (>0.25s drift)
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a || !enabled) return;
    if (Math.abs(a.currentTime - time) > 0.25) {
      try { a.currentTime = Math.min(time, (a.duration || time)); } catch (e) {}
    }
  }, [time, enabled]);

  // Mute reflects toggle
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !enabled;
  }, [enabled]);

  return (
    <audio
      ref={audioRef}
      src={src}
      preload="auto"
      style={{display: 'none'}}
    />
  );
}

function Walkthrough({ tweaks }) {
  return (
    <>
      {SCENES.map((s, i) => (
        <Sprite key={i} start={s.start} end={s.end}>
          <div style={{position: 'absolute', inset: 0}}>
            <s.Component/>
          </div>
        </Sprite>
      ))}

      {SCENES.map((s, i) => {
        const start = s.start + 0.4;
        const end = s.end - 0.3;
        return (
          <Sprite key={`cap-${i}`} start={start} end={end}>
            {({ progress }) => (
              <Caption
                text={s.caption}
                sub={tweaks.showSubcopy ? s.sub : null}
                progress={progress}
                position={tweaks.captionPosition}
              />
            )}
          </Sprite>
        );
      })}

      <Sprite start={OUTRO_START} end={TOTAL}>
        {({ progress }) => {
          const e = Easing.easeOutCubic(Math.min(progress * 4, 1));
          return (
            <div style={{
              position: 'absolute', inset: 0,
              background: `rgba(11,20,38,${0.55 * e})`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 300, pointerEvents: 'none',
            }}>
              <div style={{opacity: e, transform: `translateY(${(1 - e) * 16}px)`, textAlign: 'center', fontFamily: FONT}}>
                <div style={{fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: PFP.teal, textTransform: 'uppercase', marginBottom: 14}}>PestFlow Pro</div>
                <div style={{fontSize: 42, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15, maxWidth: 900}}>
                  Better website. Better visibility.<br/>
                  Better consistency. Faster lead response.
                </div>
                <div style={{fontSize: 15, color: '#94A3B8', marginTop: 18, letterSpacing: '-0.005em'}}>
                  All from one dashboard built for pest control.
                </div>
              </div>
            </div>
          );
        }}
      </Sprite>

      <VoiceoverAudio src="voiceover.mp3" enabled={tweaks.voiceOn}/>

      <Starter active={tweaks._started}/>

      {tweaks.showSceneChip && <SceneChip/>}
    </>
  );
}

// Flips Stage to playing once the user dismisses the start gate.
function Starter({ active }) {
  const { setPlaying, setTime } = useTimeline();
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (active && !fired.current) {
      fired.current = true;
      setTime(0);
      setPlaying(true);
    }
  }, [active]);
  return null;
}

function SceneChip() {
  const t = useTime();
  let idx = 0;
  for (let i = 0; i < SCENES.length; i++) { if (t >= SCENES[i].start) idx = i; }
  const labels = ['Dashboard','Website','Local SEO','Service Areas','Social','Blog','Branding','Leads'];
  return (
    <div style={{
      position: 'absolute', left: 22, top: 22, zIndex: 250,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 10px', borderRadius: 999,
      background: 'rgba(11,20,38,0.85)', color: '#fff',
      fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
      backdropFilter: 'blur(6px)', letterSpacing: '0.02em',
    }}>
      <span style={{
        fontFamily: MONO, fontSize: 10, fontWeight: 700, color: PFP.teal,
        background: 'rgba(15,179,154,0.18)', padding: '2px 6px', borderRadius: 5,
      }}>{String(idx + 1).padStart(2, '0')} / 08</span>
      <span>{labels[idx]}</span>
    </div>
  );
}

// ── One-time tap-to-start overlay (lets audio autoplay past browser gate) ──
function StartGate({ onStart }) {
  return (
    <div
      onClick={onStart}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(11,20,38,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 32px',
        boxShadow: '0 24px 70px rgba(11,20,38,0.45)',
        textAlign: 'center', fontFamily: FONT, maxWidth: 380,
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: PFP.teal, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
          </svg>
        </div>
        <div style={{fontSize: 20, fontWeight: 700, color: PFP.text, letterSpacing: '-0.01em', marginBottom: 6}}>
          Watch the walkthrough
        </div>
        <div style={{fontSize: 13, color: PFP.muted, lineHeight: 1.5, marginBottom: 18}}>
          71-second tour with voiceover. Click anywhere to start.
        </div>
        <div style={{
          display: 'inline-block',
          background: PFP.teal, color: '#fff',
          padding: '10px 22px', borderRadius: 8,
          fontSize: 13, fontWeight: 600,
        }}>
          Play with sound
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [started, setStarted] = React.useState(false);

  return (
    <>
      <Stage
        width={1440}
        height={900}
        duration={TOTAL}
        background={PFP.bg}
        persistKey="pestflow-walkthru"
        autoplay={false}
        loop={false}
      >
        <Walkthrough tweaks={{...t, _started: started}}/>
      </Stage>
      {!started && <StartGate onStart={() => { setStarted(true); }}/>}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Voiceover"/>
        <TweakToggle
          label="Narration audio"
          value={t.voiceOn}
          onChange={(v) => setTweak('voiceOn', v)}
        />
        <TweakSection label="Description overlay"/>
        <TweakRadio
          label="Position"
          value={t.captionPosition}
          options={['top','middle','bottom']}
          onChange={(v) => setTweak('captionPosition', v)}
        />
        <TweakToggle
          label="Show sub-copy"
          value={t.showSubcopy}
          onChange={(v) => setTweak('showSubcopy', v)}
        />
        <TweakSection label="Chrome"/>
        <TweakToggle
          label="Scene number chip"
          value={t.showSceneChip}
          onChange={(v) => setTweak('showSceneChip', v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

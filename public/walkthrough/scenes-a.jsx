// scenes-a.jsx — Scenes 1-4

// ── Scene 1: Dashboard load-in ──────────────────────────────────────────────
function Scene1_Dashboard() {
  const { localTime } = useSprite();
  const sidebarT = clamp(localTime / 0.8, 0, 1);
  const topT = clamp((localTime - 0.5) / 0.5, 0, 1);

  return (
    <AppFrame active="dash" leadBadge={0} sidebarEntry={Easing.easeOutCubic(sidebarT)}>
      <div style={{opacity: Easing.easeOutCubic(topT)}}>
        <Topbar
          subtitle="Welcome back, Ridge Pest Co."
          title="Your digital presence"
          right={<Btn kind="ghost" icon="eye" size="md">View live site</Btn>}
        />
      </div>

      <div style={{flex: 1, padding: '22px 28px', overflow: 'hidden'}}>
        {/* Stats row */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18}}>
          {[
            { label: 'Website visitors', value: '4,218', delta: '+22%', icon: 'globe', accent: PFP.teal, d: 1.0 },
            { label: 'Local SEO score',  value: '82/100', delta: '+9 pts', icon: 'seo', accent: PFP.blue, d: 1.15 },
            { label: 'Scheduled posts',  value: '14',     delta: '+4',     icon: 'social', accent: PFP.violet, d: 1.3 },
            { label: 'New leads (7d)',   value: '11',     delta: '+38%',   icon: 'inbox', accent: PFP.amber, d: 1.45 },
          ].map((s, i) => (
            <StageIn key={i} delay={s.d} dur={0.55}>
              <StatCard {...s}/>
            </StageIn>
          ))}
        </div>

        {/* Two-column body */}
        <div style={{display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14}}>
          {/* Left: Website overview */}
          <StageIn delay={1.8} dur={0.55}>
            <Card pad={18}>
              <SectionHeader kicker="Website" title="ridgepest.com"
                right={<Pill color="green" dot>Live · synced 2h ago</Pill>}/>
              <div style={{display: 'flex', gap: 14, alignItems: 'stretch'}}>
                <div style={{
                  flex: 1, borderRadius: 10, border: `1px solid ${PFP.border}`,
                  overflow: 'hidden', background: '#FAFBFD',
                }}>
                  {/* Tiny browser chrome */}
                  <div style={{display: 'flex', gap: 4, padding: '7px 10px', background: '#fff', borderBottom: `1px solid ${PFP.border}`}}>
                    <span style={{width: 7, height: 7, borderRadius: '50%', background: '#E4E8F0'}}/>
                    <span style={{width: 7, height: 7, borderRadius: '50%', background: '#E4E8F0'}}/>
                    <span style={{width: 7, height: 7, borderRadius: '50%', background: '#E4E8F0'}}/>
                    <span style={{flex: 1, marginLeft: 10, fontFamily: MONO, fontSize: 9.5, color: PFP.muted, letterSpacing: '0.02em'}}>ridgepest.com</span>
                  </div>
                  {/* Tiny hero preview */}
                  <div style={{padding: 14, display: 'flex', flexDirection: 'column', gap: 8}}>
                    <div style={{fontSize: 13, fontWeight: 700, color: PFP.text, letterSpacing: '-0.01em'}}>Pest-free homes across the Treasure Valley.</div>
                    <div style={{fontSize: 10.5, color: PFP.muted, lineHeight: 1.4}}>Family-owned, locally-licensed pest control. Same-week service in Boise, Meridian, and Nampa.</div>
                    <div style={{display: 'flex', gap: 6, marginTop: 2}}>
                      <span style={{padding: '4px 9px', borderRadius: 6, background: PFP.teal, color: '#fff', fontSize: 10, fontWeight: 600}}>Get a free quote</span>
                      <span style={{padding: '4px 9px', borderRadius: 6, border: `1px solid ${PFP.borderStrong}`, color: PFP.text, fontSize: 10, fontWeight: 600}}>Our services</span>
                    </div>
                    <ImgSlot label="hero image" h={62} style={{marginTop: 4}}/>
                  </div>
                </div>
                <div style={{width: 152, display: 'flex', flexDirection: 'column', gap: 8}}>
                  {[
                    { l: 'Pages',     v: '14' },
                    { l: 'Services',  v: '6' },
                    { l: 'Locations', v: '12' },
                    { l: 'Last edit', v: '2h ago' },
                  ].map(r => (
                    <div key={r.l} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 7, background: PFP.bg,
                    }}>
                      <span style={{fontSize: 11.5, color: PFP.muted, fontWeight: 500}}>{r.l}</span>
                      <span style={{fontSize: 12, color: PFP.text, fontWeight: 700, fontFamily: MONO}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </StageIn>

          {/* Right: Quick actions */}
          <StageIn delay={2.0} dur={0.55}>
            <Card pad={18}>
              <SectionHeader kicker="Quick actions" title="What's next"/>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {[
                  { i: 'edit',    t: 'Edit your home page',        s: 'Update hero & services', c: PFP.teal },
                  { i: 'seo',     t: 'Fix 3 missing SEO fields',   s: 'On service pages',       c: PFP.blue },
                  { i: 'social',  t: 'Schedule this week\u2019s posts', s: 'AI captions ready',     c: PFP.violet },
                  { i: 'inbox',   t: 'Review 2 new leads',         s: 'Last from 12 min ago',   c: PFP.amber },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '10px 12px', borderRadius: 9,
                    background: PFP.bg, border: `1px solid ${PFP.border}`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: r.c + '1A', color: r.c,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Icon name={r.i} size={16}/></div>
                    <div style={{flex: 1, lineHeight: 1.25}}>
                      <div style={{fontSize: 12.5, fontWeight: 600, color: PFP.text}}>{r.t}</div>
                      <div style={{fontSize: 11, color: PFP.muted}}>{r.s}</div>
                    </div>
                    <Icon name="chev" size={14} style={{color: PFP.faint}}/>
                  </div>
                ))}
              </div>
            </Card>
          </StageIn>
        </div>

        {/* Bottom: overview panels */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14}}>
          {[
            {
              d: 2.6,
              kicker: 'Local SEO',
              title: 'Page coverage',
              body: (
                <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <SeoRing pct={82}/>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 7}}>
                    <SeoRow label="Title tags"      done={14} total={14}/>
                    <SeoRow label="Meta descriptions" done={11} total={14}/>
                    <SeoRow label="H1 headings"     done={13} total={14}/>
                    <SeoRow label="Focus keywords"  done={9}  total={14}/>
                  </div>
                </div>
              ),
            },
            {
              d: 2.75,
              kicker: 'Social',
              title: 'Posting cadence',
              body: <SocialBars/>,
            },
            {
              d: 2.9,
              kicker: 'Lead inbox',
              title: 'Recent inquiries',
              body: (
                <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
                  {[
                    { n: 'Sarah Whitmore', s: 'Ant problem — Meridian', t: '12m', c: 'green' },
                    { n: 'Daniel Park',    s: 'Quarterly plan — Boise', t: '2h', c: 'gray' },
                    { n: 'Maya Rivera',    s: 'Wasps — Nampa',         t: '6h', c: 'gray' },
                  ].map((l, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 4px',
                      borderBottom: i < 2 ? `1px solid ${PFP.border}` : 'none',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#EFF2F7', color: PFP.muted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                      }}>{l.n.split(' ').map(p => p[0]).join('')}</div>
                      <div style={{flex: 1, lineHeight: 1.2}}>
                        <div style={{fontSize: 12, color: PFP.text, fontWeight: 600}}>{l.n}</div>
                        <div style={{fontSize: 10.5, color: PFP.muted}}>{l.s}</div>
                      </div>
                      {l.c === 'green' ? <Pill color="green" dot>New</Pill> : <span style={{fontSize: 11, color: PFP.faint, fontFamily: MONO}}>{l.t}</span>}
                    </div>
                  ))}
                </div>
              ),
            },
          ].map((p, i) => (
            <StageIn key={i} delay={p.d} dur={0.55}>
              <Card pad={16}>
                <SectionHeader kicker={p.kicker} title={p.title}/>
                {p.body}
              </Card>
            </StageIn>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

function SeoRing({ pct }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <div style={{position: 'relative', width: 78, height: 78}}>
      <svg width="78" height="78">
        <circle cx="39" cy="39" r={r} stroke="#EEF2F8" strokeWidth="8" fill="none"/>
        <circle cx="39" cy="39" r={r} stroke={PFP.teal} strokeWidth="8" fill="none"
                strokeLinecap="round" strokeDasharray={c}
                strokeDashoffset={c * (1 - pct / 100)}
                transform="rotate(-90 39 39)"/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', lineHeight: 1,
      }}>
        <span style={{fontSize: 18, fontWeight: 700, color: PFP.text}}>{pct}</span>
        <span style={{fontSize: 9.5, color: PFP.muted, marginTop: 2}}>/ 100</span>
      </div>
    </div>
  );
}

function SeoRow({ label, done, total }) {
  const pct = (done / total) * 100;
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 3}}>
        <span style={{color: PFP.muted, fontWeight: 500}}>{label}</span>
        <span style={{color: PFP.text, fontWeight: 600, fontFamily: MONO}}>{done}/{total}</span>
      </div>
      <div style={{height: 4, background: '#EEF2F8', borderRadius: 2}}>
        <div style={{width: `${pct}%`, height: '100%', background: PFP.teal, borderRadius: 2}}/>
      </div>
    </div>
  );
}

function SocialBars() {
  const days = ['M','T','W','T','F','S','S'];
  const heights = [40, 65, 28, 80, 55, 35, 70];
  return (
    <div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, height: 78, padding: '6px 0'}}>
        {heights.map((h, i) => (
          <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5}}>
            <div style={{
              width: '100%', height: h + '%',
              background: i === 3 ? PFP.teal : '#E4E9F2',
              borderRadius: 4,
            }}/>
          </div>
        ))}
      </div>
      <div style={{display: 'flex', gap: 8, marginTop: 2}}>
        {days.map((d, i) => (
          <div key={i} style={{flex: 1, textAlign: 'center', fontSize: 10, color: PFP.muted, fontWeight: 600}}>{d}</div>
        ))}
      </div>
      <div style={{marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11}}>
        <span style={{color: PFP.muted}}>This week</span>
        <span style={{color: PFP.tealDark, fontWeight: 600}}>14 scheduled · 5 platforms</span>
      </div>
    </div>
  );
}

// ── Scene 2: Content editor ─────────────────────────────────────────────────
function Scene2_Content() {
  const { localTime } = useSprite();

  // Stages: 0-1.2 enter, 1.2-2.5 cursor to "Home", 2.5-3 click + open editor,
  // 3-4.5 cursor to headline, edit happens, 4.5-6 swap image, 6-7.5 save+toast
  const showEditor = localTime > 2.8;
  const headlineEdited = localTime > 4.5;
  const bodyEdited = localTime > 5.5;
  const imgSwapped = localTime > 6.4;
  const saved = localTime > 7.6;

  // Cursor path
  const cur = curseSeq(localTime, [
    { t: 0,   x: 900, y: 540 },
    { t: 1.2, x: 380, y: 268 },     // hover home page row
    { t: 2.4, x: 380, y: 268, click: 1 },
    { t: 3.4, x: 720, y: 200 },     // headline
    { t: 5.0, x: 720, y: 320 },     // body
    { t: 6.2, x: 720, y: 540, click: 1 }, // image swap
    { t: 7.4, x: 1280, y: 100, click: 1 }, // save
  ]);

  return (
    <AppFrame active="site">
      <Topbar
        subtitle="Website / Pages"
        title={showEditor ? 'Edit \u2014 Home' : 'All pages'}
        right={showEditor ? (
          <>
            <Btn kind="ghost" icon="eye">Preview</Btn>
            <Btn kind="primary" icon="save" style={{
              transform: saved ? 'scale(0.95)' : 'scale(1)',
              opacity: saved ? 0.7 : 1,
            }}>{saved ? 'Saved' : 'Save changes'}</Btn>
          </>
        ) : <Btn kind="primary" icon="plus">New page</Btn>}
      />

      <div style={{flex: 1, padding: '22px 28px', display: 'flex', gap: 14, overflow: 'hidden'}}>
        {/* Pages list — always visible */}
        <Card pad={0} style={{width: 280, padding: 0, height: 'fit-content', flexShrink: 0}}>
          <div style={{padding: '14px 16px', borderBottom: `1px solid ${PFP.border}`}}>
            <div style={{fontSize: 13, fontWeight: 700, color: PFP.text}}>Pages</div>
            <div style={{fontSize: 11, color: PFP.muted, marginTop: 2}}>14 published</div>
          </div>
          {[
            { n: 'Home',         s: 'ridgepest.com/', live: true, active: true },
            { n: 'Services',     s: '/services',     live: true },
            { n: 'Ant Control',  s: '/services/ants', live: true },
            { n: 'Termites',     s: '/services/termites', live: true },
            { n: 'About',        s: '/about',        live: true },
            { n: 'Contact',      s: '/contact',      live: true },
            { n: 'Reviews',      s: '/reviews',      live: true },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              background: p.active && localTime > 2.6 ? PFP.tealSoft : 'transparent',
              borderLeft: p.active && localTime > 2.6 ? `3px solid ${PFP.teal}` : '3px solid transparent',
              borderBottom: i < 6 ? `1px solid ${PFP.border}` : 'none',
            }}>
              <Icon name="site" size={15} style={{color: p.active && localTime > 2.6 ? PFP.teal : PFP.faint}}/>
              <div style={{flex: 1, lineHeight: 1.2}}>
                <div style={{fontSize: 12.5, fontWeight: 600, color: PFP.text}}>{p.n}</div>
                <div style={{fontSize: 10.5, color: PFP.muted, fontFamily: MONO}}>{p.s}</div>
              </div>
              <Pill color="green" dot={false}>Live</Pill>
            </div>
          ))}
        </Card>

        {/* Editor panel */}
        {showEditor ? (
          <StageIn delay={0} dur={0.4} from="up" style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12}}>
            <Card pad={18}>
              <div style={{display: 'flex', gap: 6, marginBottom: 14}}>
                {['Content','SEO','Settings'].map((t, i) => (
                  <div key={t} style={{
                    padding: '6px 12px', borderRadius: 7,
                    fontSize: 12, fontWeight: 600,
                    background: i === 0 ? PFP.navy : 'transparent',
                    color: i === 0 ? '#fff' : PFP.muted,
                  }}>{t}</div>
                ))}
              </div>

              <Field label="Hero headline">
                <div style={{
                  border: `1px solid ${headlineEdited ? PFP.teal : PFP.border}`,
                  borderRadius: 7, padding: '10px 12px',
                  fontSize: 17, fontWeight: 700,
                  color: PFP.text, letterSpacing: '-0.012em',
                  position: 'relative',
                  background: '#fff',
                }}>
                  <TypeReveal
                    full="Same-week pest control across the Treasure Valley."
                    initial="Pest control in Boise."
                    startAt={3.4} endAt={4.5} localTime={localTime}
                  />
                  {localTime >= 3.4 && localTime <= 4.5 && (
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginLeft: 1,
                      width: 2, height: 18,
                      background: PFP.teal,
                      animation: 'pfBlink 0.6s steps(2) infinite',
                    }}/>
                  )}
                </div>
              </Field>

              <div style={{height: 14}}/>

              <Field label="Body copy" hint="Plain text or rich content. Markdown supported.">
                <div style={{
                  border: `1px solid ${bodyEdited ? PFP.teal : PFP.border}`,
                  borderRadius: 7, padding: '10px 12px',
                  fontSize: 12.5, color: PFP.text, lineHeight: 1.55, minHeight: 70,
                  background: '#fff',
                }}>
                  <TypeReveal
                    full="Family-owned, locally-licensed. Same-week service in Boise, Meridian, Nampa, and Caldwell. Guaranteed results, no contracts."
                    initial="Family-owned pest control company."
                    startAt={5.0} endAt={6.2} localTime={localTime}
                  />
                </div>
              </Field>
            </Card>

            <Card pad={18}>
              <Field label="Hero image">
                <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                  <div style={{
                    width: 200, height: 116, borderRadius: 8, overflow: 'hidden',
                    border: `1px solid ${imgSwapped ? PFP.teal : PFP.border}`,
                    background: imgSwapped
                      ? 'linear-gradient(135deg, #2D5F4E, #5A8F77)'
                      : 'linear-gradient(135deg, #B4C1D1, #889AB3)',
                    position: 'relative',
                    transition: 'all 400ms',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 10px, transparent 10px 20px)',
                    }}/>
                    <div style={{
                      position: 'absolute', left: 10, bottom: 8,
                      fontFamily: MONO, fontSize: 9, color: '#fff', opacity: 0.85,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>{imgSwapped ? 'tech-spraying-yard.jpg' : 'placeholder.jpg'}</div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    <Btn kind="ghost" icon="upload" size="sm">Replace image</Btn>
                    <div style={{fontSize: 11, color: PFP.muted}}>1600 × 900 · JPG</div>
                  </div>
                </div>
              </Field>
            </Card>
          </StageIn>
        ) : (
          <Card pad={16} style={{flex: 1}}>
            <div style={{fontSize: 12, color: PFP.muted, marginBottom: 8}}>Select a page from the list to start editing.</div>
            <ImgSlot label="page preview" h={300}/>
          </Card>
        )}

        {/* Saved toast */}
        {saved && (
          <StageIn delay={0} dur={0.3} from="down" style={{
            position: 'absolute', right: 28, bottom: 28, zIndex: 200,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 10,
              background: PFP.navy, color: '#fff',
              boxShadow: '0 10px 30px rgba(11,20,38,0.25)',
              fontSize: 13, fontWeight: 500,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: PFP.teal, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="check" size={13} stroke={2.2}/></div>
              Home page saved · published in 2s
            </div>
          </StageIn>
        )}
      </div>

      <Cursor x={cur.x} y={cur.y} click={cur.click}/>
    </AppFrame>
  );
}

// Animated reveal of a text string between startAt and endAt
function TypeReveal({ initial, full, startAt, endAt, localTime }) {
  if (localTime < startAt) return <span>{initial}</span>;
  if (localTime >= endAt) return <span>{full}</span>;
  const p = (localTime - startAt) / (endAt - startAt);
  // Phase 1: delete initial (0-0.35), phase 2: type full (0.35-1)
  if (p < 0.35) {
    const kept = Math.max(0, Math.floor(initial.length * (1 - p / 0.35)));
    return <span>{initial.slice(0, kept)}</span>;
  } else {
    const tp = (p - 0.35) / 0.65;
    const shown = Math.floor(full.length * Easing.easeOutQuad(tp));
    return <span>{full.slice(0, shown)}</span>;
  }
}

// Cursor sequence helper — interpolates position between keyframes with easeOutCubic
function curseSeq(t, keys) {
  // find current segment
  let cur = { x: keys[0].x, y: keys[0].y, click: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t < keys[i + 1].t) {
      const span = keys[i + 1].t - keys[i].t;
      const local = (t - keys[i].t) / span;
      const e = Easing.easeOutCubic(local);
      cur = {
        x: keys[i].x + (keys[i + 1].x - keys[i].x) * e,
        y: keys[i].y + (keys[i + 1].y - keys[i].y) * e,
        click: 0,
      };
      // Click ripple if this segment ENDS on a click keyframe
      if (keys[i + 1].click && local > 0.85) {
        cur.click = 1 - (1 - local) / 0.15;
      }
      return cur;
    }
  }
  // after last
  const last = keys[keys.length - 1];
  cur = { x: last.x, y: last.y, click: 0 };
  return cur;
}

// ── Scene 3: Local SEO ──────────────────────────────────────────────────────
function Scene3_SEO() {
  const { localTime } = useSprite();
  const aiOpen = localTime > 4.2;
  const tagFilled = localTime > 5.8;
  const metaFilled = localTime > 7.0;
  const keywordPicked = localTime > 8.0;

  const cur = curseSeq(localTime, [
    { t: 0,   x: 1000, y: 540 },
    { t: 1.2, x: 580, y: 360 },              // hover Ant Control row
    { t: 2.4, x: 580, y: 360, click: 1 },    // click it
    { t: 4.0, x: 1240, y: 590, click: 1 },   // AI button
    { t: 5.6, x: 950, y: 340, click: 1 },    // pick keyword
    { t: 7.0, x: 1000, y: 510 },             // meta description area
  ]);

  return (
    <AppFrame active="seo">
      <Topbar
        subtitle="Local SEO"
        title="Page optimization"
        right={
          <>
            <Pill color="green" dot>Avg score 82</Pill>
            <Btn kind="ghost" icon="sparkle">AI suggestions</Btn>
          </>
        }
      />

      <div style={{flex: 1, padding: '22px 28px', display: 'flex', gap: 14, overflow: 'hidden'}}>
        {/* Page table */}
        <StageIn delay={0.1} dur={0.5} style={{flex: 1, minWidth: 0}}>
          <Card pad={0}>
            <div style={{padding: '14px 18px', borderBottom: `1px solid ${PFP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontSize: 13.5, fontWeight: 700, color: PFP.text}}>Site pages · 14</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: PFP.muted}}>
                <span>Filter:</span>
                <Pill color="amber" dot>3 need attention</Pill>
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.6fr', padding: '10px 18px', background: '#FAFBFD', fontSize: 10.5, fontWeight: 700, color: PFP.muted, letterSpacing: '0.05em', textTransform: 'uppercase'}}>
              <span>Page</span><span>Focus keyword</span><span>Meta</span><span>Score</span><span></span>
            </div>
            {[
              { p: 'Home', u: '/', k: 'pest control boise', m: 'ok', s: 92, c: 'green' },
              { p: 'Ant Control', u: '/services/ants', k: '— missing —', m: 'missing', s: 54, c: 'amber', sel: true },
              { p: 'Termites', u: '/services/termites', k: 'termite treatment boise', m: 'ok', s: 88, c: 'green' },
              { p: 'Boise', u: '/locations/boise', k: 'pest control boise id', m: 'ok', s: 90, c: 'green' },
              { p: 'Meridian', u: '/locations/meridian', k: '— missing —', m: 'missing', s: 61, c: 'amber' },
              { p: 'About', u: '/about', k: 'about ridge pest', m: 'short', s: 78, c: 'amber' },
            ].map((r, i) => {
              const highlighted = r.sel && localTime > 2.4;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr 0.6fr',
                  padding: '11px 18px', alignItems: 'center',
                  borderBottom: i < 5 ? `1px solid ${PFP.border}` : 'none',
                  background: highlighted ? PFP.tealSoft : 'transparent',
                  fontSize: 12.5,
                }}>
                  <div>
                    <div style={{fontWeight: 600, color: PFP.text}}>{r.p}</div>
                    <div style={{fontFamily: MONO, fontSize: 10.5, color: PFP.muted, marginTop: 2}}>{r.u}</div>
                  </div>
                  <div style={{fontSize: 11.5, color: r.k.startsWith('—') ? PFP.amber : PFP.text, fontFamily: r.k.startsWith('—') ? MONO : FONT}}>
                    {highlighted && tagFilled ? 'ant exterminator meridian' : r.k}
                  </div>
                  <div>
                    {r.m === 'ok' && <Pill color="green" dot>OK</Pill>}
                    {r.m === 'short' && <Pill color="amber" dot>Short</Pill>}
                    {r.m === 'missing' && (highlighted && metaFilled
                      ? <Pill color="green" dot>OK</Pill>
                      : <Pill color="amber" dot>Missing</Pill>
                    )}
                  </div>
                  <div style={{fontFamily: MONO, fontWeight: 700, color: r.c === 'green' ? PFP.tealDark : PFP.amber}}>
                    {highlighted && tagFilled ? 91 : r.s}
                  </div>
                  <Icon name="chev" size={14} style={{color: PFP.faint}}/>
                </div>
              );
            })}
          </Card>
        </StageIn>

        {/* Right rail: details panel */}
        <StageIn delay={0.3} dur={0.5} style={{width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12}}>
          <Card pad={16}>
            <SectionHeader kicker="Editing" title="Ant Control"/>
            <Field label="Title tag" hint="60 chars max">
              <Input value={tagFilled ? 'Ant Exterminator in Meridian, ID | Ridge Pest' : 'Ant Control Services'}/>
            </Field>
            <div style={{height: 10}}/>
            <Field label="Focus keyword">
              <Input
                value={keywordPicked ? 'ant exterminator meridian' : (tagFilled ? 'ant exterminator meridian' : '— none —')}
                placeholder="— none —"
              />
            </Field>
            <div style={{height: 10}}/>
            <Field label="Meta description" hint="150–160 chars recommended">
              <div style={{
                border: `1px solid ${metaFilled ? PFP.teal : PFP.border}`,
                borderRadius: 7, padding: '10px 12px',
                fontSize: 12, color: metaFilled ? PFP.text : PFP.faint, minHeight: 46, lineHeight: 1.4,
              }}>
                {metaFilled
                  ? 'Same-week ant treatment in Meridian, Boise, and Nampa. Licensed, family-owned, guaranteed.'
                  : 'No description set.'}
              </div>
            </Field>
          </Card>

          {/* AI keyword research panel */}
          <Card pad={16} style={{
            opacity: aiOpen ? 1 : 0.4,
            borderColor: aiOpen ? PFP.teal : PFP.border,
            transition: 'all 300ms',
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10}}>
              <div style={{
                width: 24, height: 24, borderRadius: 7,
                background: 'linear-gradient(135deg, #0FB39A, #6E60F2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}><Icon name="sparkle" size={13}/></div>
              <div style={{fontSize: 13, fontWeight: 700, color: PFP.text}}>AI Keyword Research</div>
              {aiOpen && <Pill color="green" dot>local</Pill>}
            </div>
            <div style={{fontSize: 11, color: PFP.muted, marginBottom: 10}}>
              {aiOpen ? 'Top local terms for Ant Control in Meridian, ID:' : 'Click to generate suggestions.'}
            </div>
            {aiOpen && [
              { k: 'ant exterminator meridian', v: '720/mo', best: true },
              { k: 'carpenter ants boise',      v: '480/mo' },
              { k: 'ant control near me',       v: '390/mo' },
              { k: 'sugar ants treatment',      v: '210/mo' },
            ].map((r, i) => {
              const isPicked = r.best && keywordPicked;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 7,
                  background: isPicked ? PFP.tealSoft : '#FAFBFD',
                  border: `1px solid ${isPicked ? PFP.teal : PFP.border}`,
                  marginBottom: 5,
                }}>
                  <Icon name="target" size={12} style={{color: isPicked ? PFP.teal : PFP.muted}}/>
                  <span style={{flex: 1, fontSize: 11.5, color: PFP.text, fontWeight: isPicked ? 600 : 500}}>{r.k}</span>
                  <span style={{fontSize: 10.5, fontFamily: MONO, color: PFP.muted}}>{r.v}</span>
                  {isPicked && <Icon name="check" size={12} style={{color: PFP.teal}} stroke={2.4}/>}
                </div>
              );
            })}
          </Card>
        </StageIn>
      </div>

      <Cursor x={cur.x} y={cur.y} click={cur.click}/>
    </AppFrame>
  );
}

// ── Scene 4: Locations / service areas ─────────────────────────────────────
function Scene4_Locations() {
  const { localTime } = useSprite();
  const modalOpen = localTime > 2.2 && localTime < 8.8;
  const modalT = clamp((localTime - 2.2) / 0.4, 0, 1);
  const closingT = localTime > 8.4 ? clamp((localTime - 8.4) / 0.4, 0, 1) : 0;
  const finalT = Math.min(modalT, 1 - closingT);

  const cityName = localTime > 4.0;
  const slugFilled = localTime > 4.8;
  const introFilled = localTime > 5.8;
  const metaFilled = localTime > 6.8;
  const keywordFilled = localTime > 7.5;
  const newCityAdded = localTime > 8.8;

  const cur = curseSeq(localTime, [
    { t: 0,   x: 1100, y: 480 },
    { t: 1.6, x: 1240, y: 100, click: 1 },  // Add city
    { t: 3.6, x: 680, y: 290 },              // city name input
    { t: 4.7, x: 680, y: 380 },              // slug
    { t: 5.6, x: 680, y: 460 },              // intro
    { t: 6.6, x: 680, y: 550 },              // meta
    { t: 7.4, x: 950, y: 620, click: 1 },    // keyword chip
    { t: 8.5, x: 1140, y: 690, click: 1 },   // publish
  ]);

  const cities = [
    { c: 'Boise', s: '/locations/boise', score: 92, p: 312 },
    { c: 'Meridian', s: '/locations/meridian', score: 88, p: 184 },
    { c: 'Nampa', s: '/locations/nampa', score: 81, p: 142 },
    { c: 'Caldwell', s: '/locations/caldwell', score: 78, p: 96 },
    { c: 'Eagle', s: '/locations/eagle', score: 74, p: 71 },
    { c: 'Kuna', s: '/locations/kuna', score: 70, p: 58 },
  ];
  if (newCityAdded) cities.push({ c: 'Star', s: '/locations/star', score: 0, p: 0, isNew: true });

  return (
    <AppFrame active="pin">
      <Topbar
        subtitle="Service areas"
        title="Cities you serve"
        right={<Btn kind="primary" icon="plus">Add city page</Btn>}
      />

      <div style={{flex: 1, padding: '22px 28px', overflow: 'hidden', position: 'relative'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
          {cities.map((city, i) => (
            <StageIn key={i} delay={0.1 + i * 0.06} dur={0.45}>
              <Card pad={16} style={{
                position: 'relative',
                borderColor: city.isNew ? PFP.teal : PFP.border,
                background: city.isNew ? PFP.tealSoft : '#fff',
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: city.isNew ? PFP.teal : PFP.bg,
                    color: city.isNew ? '#fff' : PFP.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name="pin" size={18}/></div>
                  <div style={{flex: 1, lineHeight: 1.2}}>
                    <div style={{fontSize: 14, fontWeight: 700, color: PFP.text, letterSpacing: '-0.01em'}}>{city.c}, ID</div>
                    <div style={{fontSize: 11, color: PFP.muted, fontFamily: MONO}}>{city.s}</div>
                  </div>
                  {city.isNew ? <Pill color="green" dot>New</Pill> : <Pill color={city.score > 85 ? 'green' : 'amber'} dot>{city.score}</Pill>}
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: PFP.muted, marginTop: 6}}>
                  <span>{city.p} visits / mo</span>
                  <span>{city.isNew ? 'Draft' : 'Live'}</span>
                </div>
              </Card>
            </StageIn>
          ))}
        </div>

        {/* Mini map illustration row below */}
        <StageIn delay={0.7} dur={0.5}>
          <div style={{marginTop: 14}}>
            <Card pad={16}>
              <SectionHeader kicker="Coverage map" title="Treasure Valley"
                right={<Pill color="green" dot>{cities.length} active cities</Pill>}/>
              <div style={{
                height: 130, borderRadius: 9, position: 'relative',
                background: 'radial-gradient(circle at 30% 60%, #DCEFEA 0%, #EEF4F8 60%, #F4F6FB 100%)',
                overflow: 'hidden',
              }}>
                {[
                  { x: 22, y: 60, c: 'Boise', big: true },
                  { x: 38, y: 55, c: 'Meridian' },
                  { x: 50, y: 65, c: 'Nampa' },
                  { x: 60, y: 72, c: 'Caldwell' },
                  { x: 30, y: 38, c: 'Eagle' },
                  { x: 28, y: 78, c: 'Kuna' },
                  ...(newCityAdded ? [{ x: 44, y: 40, c: 'Star', isNew: true }] : []),
                ].map((m, i) => (
                  <div key={i} style={{position: 'absolute', left: `${m.x}%`, top: `${m.y}%`}}>
                    <div style={{
                      width: m.big ? 16 : 12, height: m.big ? 16 : 12, borderRadius: '50%',
                      background: m.isNew ? PFP.amber : PFP.teal,
                      border: '2px solid #fff',
                      boxShadow: m.isNew ? `0 0 0 4px ${PFP.amber}40` : '0 1px 3px rgba(0,0,0,0.15)',
                      transform: 'translate(-50%, -50%)',
                    }}/>
                    <div style={{
                      position: 'absolute', left: 10, top: -4,
                      fontSize: 10.5, fontWeight: 600, color: PFP.text,
                      whiteSpace: 'nowrap',
                    }}>{m.c}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </StageIn>
      </div>

      {/* Add city modal */}
      {modalOpen && (
        <Modal width={620} progress={finalT}>
          <ModalHeader title="Add a service-area page" subtitle="Generate an optimized city page for your local SEO."/>
          <div style={{padding: 22, display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{display: 'flex', gap: 12}}>
              <Field label="City name" full>
                <Input value={cityName ? 'Star' : ''} placeholder="e.g. Star"/>
              </Field>
              <Field label="State" full>
                <Input value="Idaho"/>
              </Field>
            </div>
            <Field label="URL slug">
              <Input value={slugFilled ? '/locations/star' : '/locations/'} mono/>
            </Field>
            <Field label="Intro paragraph" hint="Shown above the fold on the city page.">
              <div style={{
                border: `1px solid ${introFilled ? PFP.teal : PFP.border}`,
                borderRadius: 7, padding: '10px 12px',
                fontSize: 12, color: introFilled ? PFP.text : PFP.faint,
                lineHeight: 1.5, minHeight: 60,
              }}>
                {introFilled
                  ? 'Family-owned pest control trusted by Star, Idaho homeowners. Same-week service, no contracts, fully licensed in Ada County.'
                  : 'Write a short, local-flavored intro…'}
              </div>
            </Field>
            <div style={{display: 'flex', gap: 12}}>
              <Field label="Meta title" full>
                <Input value={metaFilled ? 'Pest Control in Star, ID | Ridge Pest Co.' : ''} placeholder="Pest Control in [City], ID"/>
              </Field>
              <Field label="Focus keyword" full>
                <div style={{display: 'flex', gap: 5, flexWrap: 'wrap'}}>
                  {['pest control star id','exterminator star idaho','ant control star'].map((k, i) => {
                    const picked = keywordFilled && i === 0;
                    return (
                      <span key={k} style={{
                        padding: '6px 10px', borderRadius: 7, fontSize: 11.5,
                        fontFamily: MONO,
                        background: picked ? PFP.teal : '#FAFBFD',
                        color: picked ? '#fff' : PFP.text,
                        border: `1px solid ${picked ? PFP.teal : PFP.border}`,
                        fontWeight: 600,
                      }}>{k}</span>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>
          <div style={{
            padding: '14px 22px', borderTop: `1px solid ${PFP.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#FAFBFD',
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: PFP.muted}}>
              <Icon name="sparkle" size={13} style={{color: PFP.teal}}/>
              <span>AI will optimize this page automatically.</span>
            </div>
            <div style={{display: 'flex', gap: 8}}>
              <Btn kind="ghost">Cancel</Btn>
              <Btn kind="primary" icon="check">Create page</Btn>
            </div>
          </div>
        </Modal>
      )}

      <Cursor x={cur.x} y={cur.y} click={cur.click}/>
    </AppFrame>
  );
}

Object.assign(window, {
  Scene1_Dashboard, Scene2_Content, Scene3_SEO, Scene4_Locations,
  curseSeq, TypeReveal,
});

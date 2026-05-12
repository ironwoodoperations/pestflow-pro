// scenes-b.jsx — Scenes 5-8

// ── Scene 5: Social ─────────────────────────────────────────────────────────
function Scene5_Social() {
  const { localTime } = useSprite();
  const composeOpen = localTime > 2.0 && localTime < 8.6;
  const composeT = clamp((localTime - 2.0) / 0.4, 0, 1);
  const closing = localTime > 8.2 ? clamp((localTime - 8.2) / 0.4, 0, 1) : 0;
  const finalT = Math.min(composeT, 1 - closing);

  const captionGenerated = localTime > 4.2;
  const platformPicked = localTime > 5.6;
  const timePicked = localTime > 6.8;
  const scheduled = localTime > 8.6;

  const cur = curseSeq(localTime, [
    { t: 0,   x: 1100, y: 400 },
    { t: 1.4, x: 1240, y: 100, click: 1 },  // New post
    { t: 3.6, x: 1180, y: 320, click: 1 },  // Generate caption
    { t: 5.2, x: 700, y: 460, click: 1 },   // Instagram chip
    { t: 6.4, x: 1100, y: 570, click: 1 },  // schedule time
    { t: 8.0, x: 1180, y: 680, click: 1 },  // schedule button
  ]);

  return (
    <AppFrame active="social">
      <Topbar
        subtitle="Social"
        title="Content queue"
        right={<>
          <Btn kind="ghost" icon="calendar">Calendar view</Btn>
          <Btn kind="primary" icon="plus">New post</Btn>
        </>}
      />

      <div style={{flex: 1, padding: '22px 28px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, overflow: 'hidden'}}>
        {/* Queue / week view */}
        <StageIn delay={0.1} dur={0.5}>
          <Card pad={0}>
            <div style={{padding: '14px 18px', borderBottom: `1px solid ${PFP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <div style={{fontSize: 13.5, fontWeight: 700, color: PFP.text}}>Week of May 11</div>
                <div style={{fontSize: 11, color: PFP.muted, marginTop: 2}}>{scheduled ? '15 scheduled' : '14 scheduled'} · 5 platforms</div>
              </div>
              <div style={{display: 'flex', gap: 4}}>
                {['IG','FB','LI','TT','GBP'].map(p => (
                  <span key={p} style={{
                    padding: '3px 8px', borderRadius: 5,
                    background: PFP.bg, fontSize: 10, fontFamily: MONO,
                    fontWeight: 700, color: PFP.muted,
                  }}>{p}</span>
                ))}
              </div>
            </div>
            <div style={{padding: 14, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, height: 'calc(100% - 60px)'}}>
              {['MON 11','TUE 12','WED 13','THU 14','FRI 15','SAT 16','SUN 17'].map((day, di) => (
                <div key={day} style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: PFP.muted,
                    letterSpacing: '0.06em', padding: '2px 4px',
                  }}>{day}</div>
                  {[
                    [{p:'IG', t:'9:00 AM', txt:'Spring termite tips', c: PFP.violet}],
                    [{p:'FB', t:'10:30 AM', txt:'New review reposted', c: PFP.blue}, {p:'IG', t:'5:00 PM', txt:'Before/after deck', c: PFP.violet}],
                    [{p:'GBP', t:'8:00 AM', txt:'May offer — $50 off', c: PFP.teal}],
                    [{p:'IG', t:'11:00 AM', txt:'Carpenter ant guide', c: PFP.violet, added: scheduled}],
                    [{p:'LI', t:'2:00 PM', txt:'Hiring techs', c: PFP.blue}],
                    [{p:'TT', t:'4:00 PM', txt:'Mosquito myth #3', c: PFP.rose}],
                    [],
                  ][di].map((p, pi) => (
                    <div key={pi} style={{
                      borderRadius: 7, padding: '7px 8px',
                      background: p.added ? PFP.tealSoft : '#FAFBFD',
                      border: `1px solid ${p.added ? PFP.teal : PFP.border}`,
                      display: 'flex', flexDirection: 'column', gap: 3,
                      lineHeight: 1.2,
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                        <span style={{
                          width: 14, height: 14, borderRadius: 4,
                          background: p.c, color: '#fff', fontSize: 7, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: MONO,
                        }}>{p.p}</span>
                        <span style={{fontSize: 9.5, color: PFP.muted, fontFamily: MONO}}>{p.t}</span>
                      </div>
                      <div style={{fontSize: 10.5, color: PFP.text, fontWeight: 500}}>{p.txt}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </StageIn>

        {/* Connected accounts panel */}
        <StageIn delay={0.3} dur={0.5}>
          <Card pad={16}>
            <SectionHeader kicker="Connected" title="Accounts"/>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {[
                { p: 'Instagram', h: '@ridgepest', c: PFP.violet, dot: 'green' },
                { p: 'Facebook', h: 'Ridge Pest Co.', c: PFP.blue, dot: 'green' },
                { p: 'LinkedIn', h: 'Ridge Pest Co.', c: PFP.blue, dot: 'green' },
                { p: 'Google Business', h: 'Boise', c: PFP.teal, dot: 'green' },
                { p: 'TikTok', h: '@ridgepestco', c: PFP.rose, dot: 'green' },
              ].map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 0',
                  borderBottom: i < 4 ? `1px solid ${PFP.border}` : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: a.c + '1A', color: a.c,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name="social" size={14}/></div>
                  <div style={{flex: 1, lineHeight: 1.2}}>
                    <div style={{fontSize: 12, color: PFP.text, fontWeight: 600}}>{a.p}</div>
                    <div style={{fontSize: 10.5, color: PFP.muted}}>{a.h}</div>
                  </div>
                  <span style={{width: 7, height: 7, borderRadius: '50%', background: PFP.teal}}/>
                </div>
              ))}
            </div>
            <div style={{marginTop: 10, fontSize: 11, color: PFP.muted, display: 'flex', alignItems: 'center', gap: 6}}>
              <Icon name="link" size={12}/> Connect another platform
            </div>
          </Card>
        </StageIn>
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <Modal width={680} progress={finalT}>
          <ModalHeader title="New social post" subtitle="Write once. Schedule across platforms."/>
          <div style={{padding: 22, display: 'flex', flexDirection: 'column', gap: 14}}>
            <Field label="Caption">
              <div style={{
                border: `1px solid ${captionGenerated ? PFP.teal : PFP.border}`,
                borderRadius: 7, padding: '12px 14px',
                fontSize: 13, color: PFP.text, lineHeight: 1.55, minHeight: 90,
                background: '#fff', position: 'relative',
              }}>
                <TypeReveal
                  full={"Carpenter ants love Idaho springs \u2014 here's how to tell them apart from sugar ants in your kitchen. Three signs to watch for + when to call us. \ud83d\udd17 link in bio.\n\n#PestControlBoise #CarpenterAnts #TreasureValley"}
                  initial=""
                  startAt={3.6}
                  endAt={5.2}
                  localTime={localTime}
                />
                {!captionGenerated && localTime < 3.6 && (
                  <span style={{color: PFP.faint}}>Write a caption, or let AI draft it for you…</span>
                )}
              </div>
            </Field>

            <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
              <Btn kind="soft" icon="sparkle" style={{
                background: captionGenerated ? PFP.tealSoft : 'linear-gradient(135deg, #E6F8F4, #EDE8FE)',
                color: PFP.tealDark,
              }}>{captionGenerated ? 'Regenerate' : 'Generate with AI'}</Btn>
              <span style={{fontSize: 11, color: PFP.muted}}>Trained on your tone of voice and past top posts.</span>
            </div>

            <Field label="Image">
              <div style={{display: 'flex', gap: 8}}>
                <ImgSlot label="carpenter-ants-vs-sugar.jpg" h={92} style={{flex: 1}}/>
                <ImgSlot label="alt-image" h={92} style={{width: 110}}/>
              </div>
            </Field>

            <div style={{display: 'flex', gap: 12}}>
              <Field label="Platforms" full>
                <div style={{display: 'flex', gap: 6}}>
                  {[
                    { p: 'Instagram', c: PFP.violet, on: platformPicked },
                    { p: 'Facebook',  c: PFP.blue,   on: platformPicked },
                    { p: 'LinkedIn',  c: PFP.blue,   on: false },
                    { p: 'TikTok',    c: PFP.rose,   on: false },
                  ].map((pl, i) => (
                    <div key={pl.p} style={{
                      padding: '7px 10px', borderRadius: 7,
                      background: pl.on ? pl.c : '#fff',
                      color: pl.on ? '#fff' : PFP.muted,
                      border: `1px solid ${pl.on ? pl.c : PFP.border}`,
                      fontSize: 11.5, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {pl.on && <Icon name="check" size={11} stroke={2.4}/>}
                      {pl.p}
                    </div>
                  ))}
                </div>
              </Field>
              <Field label="Schedule" full>
                <Input value={timePicked ? 'Thu, May 14 · 11:00 AM' : 'Pick a date & time'} suffix={<Icon name="calendar" size={14} style={{color: PFP.muted}}/>}/>
              </Field>
            </div>
          </div>
          <div style={{
            padding: '14px 22px', borderTop: `1px solid ${PFP.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#FAFBFD',
          }}>
            <span style={{fontSize: 11, color: PFP.muted}}>Auto-resized for each platform.</span>
            <div style={{display: 'flex', gap: 8}}>
              <Btn kind="ghost">Save draft</Btn>
              <Btn kind="primary" icon="calendar">Schedule post</Btn>
            </div>
          </div>
        </Modal>
      )}

      <Cursor x={cur.x} y={cur.y} click={cur.click}/>
    </AppFrame>
  );
}

// ── Scene 6: Blog ───────────────────────────────────────────────────────────
function Scene6_Blog() {
  const { localTime } = useSprite();
  // 0-1: pages list, 1.4-3 click new, 3-4.5 AI draft generating, 4.5-7 editor view, 7-9 publish
  const newOpen = localTime > 1.6 && localTime < 4.2;
  const newT = clamp((localTime - 1.6) / 0.4, 0, 1);
  const newClose = localTime > 3.8 ? clamp((localTime - 3.8) / 0.4, 0, 1) : 0;
  const newFinal = Math.min(newT, 1 - newClose);

  const draftGenerated = localTime > 3.6;
  const editorOpen = localTime > 4.4;
  const published = localTime > 8.4;

  const cur = curseSeq(localTime, [
    { t: 0,    x: 1100, y: 480 },
    { t: 1.2,  x: 1240, y: 100, click: 1 }, // New post
    { t: 2.8,  x: 1150, y: 510, click: 1 }, // Draft with AI button
    { t: 4.5,  x: 700, y: 280 },             // editor title
    { t: 6.0,  x: 700, y: 540 },             // body
    { t: 8.0,  x: 1240, y: 100, click: 1 }, // publish
  ]);

  return (
    <AppFrame active="blog">
      <Topbar
        subtitle="Blog"
        title={editorOpen ? (published ? 'Published \u2014 Spring termite swarms' : 'Editing \u2014 Spring termite swarms') : 'All posts'}
        right={editorOpen
          ? <>
              <Btn kind="ghost" icon="eye">Preview</Btn>
              <Btn kind="primary" icon={published ? 'check' : 'globe'} style={{opacity: published ? 0.7 : 1}}>{published ? 'Published' : 'Publish'}</Btn>
            </>
          : <Btn kind="primary" icon="plus">New post</Btn>
        }
      />

      <div style={{flex: 1, padding: '22px 28px', overflow: 'hidden', position: 'relative'}}>
        {!editorOpen ? (
          // Posts list
          <StageIn delay={0.1} dur={0.5}>
            <Card pad={0}>
              <div style={{display: 'grid', gridTemplateColumns: '2.4fr 1fr 0.8fr 0.8fr', padding: '12px 20px', background: '#FAFBFD', fontSize: 10.5, fontWeight: 700, color: PFP.muted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${PFP.border}`}}>
                <span>Title</span><span>Topic</span><span>Status</span><span>Views</span>
              </div>
              {[
                { t: '5 signs you have carpenter ants', k: 'Ants', s: 'Live', v: '2.4k', c: 'green' },
                { t: 'Why mosquitoes love your backyard', k: 'Mosquitoes', s: 'Live', v: '1.8k', c: 'green' },
                { t: 'Termite swarm season in Idaho', k: 'Termites', s: 'Live', v: '1.1k', c: 'green' },
                { t: 'How often should you spray?', k: 'Treatment', s: 'Live', v: '820', c: 'green' },
                { t: 'Bed bug prevention 101', k: 'Bed bugs', s: 'Draft', v: '—', c: 'gray' },
                { t: 'Spider species in the Treasure Valley', k: 'Spiders', s: 'Draft', v: '—', c: 'gray' },
              ].map((r, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2.4fr 1fr 0.8fr 0.8fr',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < 5 ? `1px solid ${PFP.border}` : 'none',
                  fontSize: 13,
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <div style={{width: 32, height: 32, borderRadius: 6, background: PFP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PFP.muted}}>
                      <Icon name="blog" size={14}/>
                    </div>
                    <span style={{fontWeight: 600, color: PFP.text}}>{r.t}</span>
                  </div>
                  <Pill color="gray">{r.k}</Pill>
                  <div><Pill color={r.c} dot>{r.s}</Pill></div>
                  <span style={{fontFamily: MONO, fontSize: 12, color: PFP.text, fontWeight: 600}}>{r.v}</span>
                </div>
              ))}
            </Card>
          </StageIn>
        ) : (
          // Editor view
          <StageIn delay={0} dur={0.4} style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, height: '100%'}}>
            <Card pad={20}>
              <Field label="Title">
                <div style={{
                  border: `1px solid ${PFP.teal}`, borderRadius: 7,
                  padding: '11px 13px', fontSize: 19, fontWeight: 700, color: PFP.text, letterSpacing: '-0.012em',
                }}>
                  <TypeReveal full="When termites swarm in Idaho: a homeowner's spring guide" initial="" startAt={3.6} endAt={4.6} localTime={localTime}/>
                </div>
              </Field>
              <div style={{height: 12}}/>
              <div style={{display: 'flex', gap: 12}}>
                <Field label="Slug" full>
                  <Input value="/blog/termite-swarms-idaho-spring" mono/>
                </Field>
                <Field label="Excerpt" full>
                  <Input value="What swarms mean and what to do."/>
                </Field>
              </div>
              <div style={{height: 14}}/>
              <Field label="Body">
                <div style={{
                  border: `1px solid ${PFP.border}`, borderRadius: 7,
                  padding: '14px 16px', fontSize: 12.5, color: PFP.text, lineHeight: 1.65, minHeight: 200,
                  background: '#fff',
                }}>
                  <div style={{fontWeight: 700, fontSize: 14, marginBottom: 8}}>
                    <TypeReveal full="What is a termite swarm?" initial="" startAt={4.6} endAt={5.4} localTime={localTime}/>
                  </div>
                  <div style={{marginBottom: 10, color: PFP.muted}}>
                    <TypeReveal full={"In late April and May, mature termite colonies release winged reproductives looking to start new colonies. If you see piles of discarded wings on your windowsill, that's a swarm event \u2014 and it usually means the colony is already nearby."} initial="" startAt={5.0} endAt={6.4} localTime={localTime}/>
                  </div>
                  <div style={{fontWeight: 700, fontSize: 13, marginBottom: 6}}>
                    <TypeReveal full="Three signs to act fast" initial="" startAt={6.2} endAt={6.8} localTime={localTime}/>
                  </div>
                  <div style={{color: PFP.muted, fontSize: 12}}>
                    <TypeReveal full={"1. Discarded wings near doors or windows\n2. Mud tubes on the foundation\n3. Hollow-sounding wood in baseboards"} initial="" startAt={6.6} endAt={7.6} localTime={localTime}/>
                  </div>
                </div>
              </Field>
            </Card>

            <div style={{display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0}}>
              <Card pad={16}>
                <SectionHeader kicker="SEO" title="Search visibility"/>
                <Field label="Focus keyword"><Input value="termite swarms idaho" mono/></Field>
                <div style={{height: 8}}/>
                <Field label="Meta description">
                  <div style={{
                    border: `1px solid ${PFP.border}`, borderRadius: 7,
                    padding: '8px 10px', fontSize: 11.5, color: PFP.text, lineHeight: 1.5, minHeight: 50,
                  }}>
                    What termite swarms look like in Idaho, why they happen in spring, and three signs you need a treatment.
                  </div>
                </Field>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 10}}>
                  <SeoRing pct={94}/>
                  <div>
                    <div style={{fontSize: 11.5, fontWeight: 600, color: PFP.text}}>Optimized for search</div>
                    <div style={{fontSize: 10.5, color: PFP.muted, marginTop: 2}}>All checks pass.</div>
                  </div>
                </div>
              </Card>
              <Card pad={16}>
                <SectionHeader kicker="Featured image" title=""/>
                <ImgSlot label="termite-swarm-window.jpg" h={140}/>
              </Card>
            </div>
          </StageIn>
        )}

        {/* "Start a post" modal */}
        {newOpen && (
          <Modal width={520} progress={newFinal}>
            <ModalHeader title="Start a new post"/>
            <div style={{padding: 22, display: 'flex', flexDirection: 'column', gap: 12}}>
              <Field label="Topic">
                <Input value="Termite swarm season in Idaho"/>
              </Field>
              <Field label="Tone">
                <div style={{display: 'flex', gap: 6}}>
                  {['Helpful','Authoritative','Friendly'].map((t, i) => (
                    <span key={t} style={{
                      padding: '6px 12px', borderRadius: 7, fontSize: 11.5,
                      background: i === 0 ? PFP.navy : '#FAFBFD',
                      color: i === 0 ? '#fff' : PFP.text,
                      border: `1px solid ${i === 0 ? PFP.navy : PFP.border}`,
                      fontWeight: 600,
                    }}>{t}</span>
                  ))}
                </div>
              </Field>
              <div style={{
                padding: '12px 14px', borderRadius: 9,
                background: 'linear-gradient(135deg, rgba(15,179,154,0.06), rgba(110,96,242,0.06))',
                border: `1px solid ${PFP.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'linear-gradient(135deg, #0FB39A, #6E60F2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}><Icon name="sparkle" size={15}/></div>
                <div style={{flex: 1, lineHeight: 1.3}}>
                  <div style={{fontSize: 12.5, fontWeight: 600, color: PFP.text}}>Draft with AI</div>
                  <div style={{fontSize: 10.5, color: PFP.muted}}>Generates title, body, meta, and image suggestion.</div>
                </div>
                {draftGenerated && <Pill color="green" dot>Done</Pill>}
              </div>
            </div>
            <div style={{padding: '14px 22px', borderTop: `1px solid ${PFP.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#FAFBFD'}}>
              <Btn kind="ghost">Start blank</Btn>
              <Btn kind="primary" icon="sparkle">Draft with AI</Btn>
            </div>
          </Modal>
        )}

        {/* Published toast */}
        {published && (
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
              Published · indexed by Google in ~2h
            </div>
          </StageIn>
        )}
      </div>

      <Cursor x={cur.x} y={cur.y} click={cur.click}/>
    </AppFrame>
  );
}

// ── Scene 7: Branding ───────────────────────────────────────────────────────
function Scene7_Branding() {
  const { localTime } = useSprite();
  const colorPicked = localTime > 3.0;
  const logoSwapped = localTime > 5.0;
  const reviewImported = localTime > 7.2;

  const cur = curseSeq(localTime, [
    { t: 0,    x: 1100, y: 480 },
    { t: 1.4,  x: 530, y: 380 },             // hover palette
    { t: 2.6,  x: 530, y: 380, click: 1 },   // pick teal
    { t: 4.3,  x: 530, y: 600, click: 1 },   // upload logo
    { t: 6.4,  x: 1080, y: 460, click: 1 },  // import review
  ]);

  const palettes = [
    ['#0FB39A','#0F1B2D','#FAFBFD'],  // Teal & Navy
    ['#2563EB','#0F172A','#F8FAFC'],  // Blue
    ['#059669','#1F2937','#F0FDF4'],  // Forest
    ['#DC2626','#1F2937','#FEF2F2'],  // Red
    ['#7C3AED','#0F172A','#FAF5FF'],  // Violet
  ];

  return (
    <AppFrame active="brush">
      <Topbar
        subtitle="Branding"
        title="Look & feel"
        right={<Btn kind="primary" icon="check">Save brand</Btn>}
      />

      <div style={{flex: 1, padding: '22px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, overflow: 'hidden'}}>
        {/* Left column — brand controls */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <StageIn delay={0.1} dur={0.5}>
            <Card pad={18}>
              <SectionHeader kicker="Theme" title="Brand colors"/>
              <div style={{display: 'flex', flexDirection: 'column', gap: 9}}>
                {palettes.map((p, i) => {
                  const picked = i === 0 && colorPicked;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 9,
                      background: picked ? PFP.tealSoft : '#FAFBFD',
                      border: `1px solid ${picked ? PFP.teal : PFP.border}`,
                    }}>
                      <div style={{display: 'flex', gap: 4}}>
                        {p.map(c => (
                          <div key={c} style={{
                            width: 22, height: 22, borderRadius: 5,
                            background: c, border: c === '#FAFBFD' || c === '#F8FAFC' || c === '#F0FDF4' || c === '#FEF2F2' || c === '#FAF5FF' ? `1px solid ${PFP.border}` : 'none',
                          }}/>
                        ))}
                      </div>
                      <div style={{flex: 1, fontSize: 12, color: PFP.text, fontWeight: 600}}>
                        {['Teal & Navy','Trust Blue','Forest Green','Rescue Red','Royal Violet'][i]}
                      </div>
                      {picked && <Icon name="check" size={14} style={{color: PFP.teal}} stroke={2.4}/>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </StageIn>

          <StageIn delay={0.2} dur={0.5}>
            <Card pad={18}>
              <SectionHeader kicker="Identity" title="Logo & favicon"/>
              <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                <div style={{
                  width: 110, height: 110, borderRadius: 11,
                  border: `1px solid ${logoSwapped ? PFP.teal : PFP.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: logoSwapped ? `linear-gradient(135deg, ${PFP.teal}, #1FE0BC)` : '#FAFBFD',
                  position: 'relative',
                  transition: 'all 400ms',
                }}>
                  <div style={{
                    fontFamily: FONT, fontSize: 28, fontWeight: 800,
                    color: logoSwapped ? '#04231E' : PFP.muted,
                    letterSpacing: '-0.02em',
                  }}>RP</div>
                </div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 6}}>
                  <Btn kind="ghost" icon="upload" size="sm" style={{alignSelf: 'flex-start'}}>{logoSwapped ? 'Replace logo' : 'Upload logo'}</Btn>
                  <div style={{fontSize: 11, color: PFP.muted}}>PNG or SVG · transparent bg</div>
                  <div style={{display: 'flex', gap: 6, marginTop: 4}}>
                    <div style={{width: 26, height: 26, borderRadius: 5, background: logoSwapped ? PFP.teal : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800}}>RP</div>
                    <div style={{width: 18, height: 18, borderRadius: 4, background: logoSwapped ? PFP.teal : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 800}}>R</div>
                    <span style={{fontSize: 10.5, color: PFP.muted, alignSelf: 'center'}}>favicons auto-generated</span>
                  </div>
                </div>
              </div>
            </Card>
          </StageIn>

          <StageIn delay={0.3} dur={0.5}>
            <Card pad={18}>
              <SectionHeader kicker="Business info" title="What your site shows"/>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
                <Field label="Business name"><Input value="Ridge Pest Co."/></Field>
                <Field label="Phone"><Input value="(208) 555-0142" mono/></Field>
                <Field label="Email"><Input value="hello@ridgepest.com" mono/></Field>
                <Field label="Hours"><Input value="Mon–Sat · 7a–6p"/></Field>
              </div>
            </Card>
          </StageIn>
        </div>

        {/* Right column — reviews & preview */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <StageIn delay={0.2} dur={0.5}>
            <Card pad={18}>
              <SectionHeader kicker="Trust" title="Reviews & testimonials"
                right={<Btn kind="ghost" icon="upload" size="sm">{reviewImported ? 'Imported' : 'Import from Google'}</Btn>}/>
              <div style={{display: 'flex', flexDirection: 'column', gap: 9}}>
                {[
                  { n: 'Jamie L.', s: 5, q: 'Showed up the same week. Ants are gone for the first spring in years.', src: 'Google', show: true },
                  { n: 'Marcus G.', s: 5, q: 'Honest pricing, no contracts. They explained everything.', src: 'Google', show: true },
                  { n: 'Priya R.', s: 5, q: 'Quarterly plan has been worth every penny. Super responsive.', src: 'Google', show: true },
                  { n: 'Tasha O.', s: 5, q: 'Quickly handled a wasp nest in my eaves. Excellent communication.', src: 'Google', show: reviewImported, isNew: true },
                ].filter(r => r.show).map((r, i) => (
                  <div key={i} style={{
                    padding: '11px 13px', borderRadius: 9,
                    background: r.isNew ? PFP.tealSoft : '#FAFBFD',
                    border: `1px solid ${r.isNew ? PFP.teal : PFP.border}`,
                    display: 'flex', flexDirection: 'column', gap: 5,
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: PFP.bg, color: PFP.muted, fontSize: 9.5, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{r.n.split(' ').map(p => p[0]).join('')}</div>
                      <span style={{fontSize: 11.5, fontWeight: 700, color: PFP.text}}>{r.n}</span>
                      <div style={{display: 'flex', gap: 1}}>
                        {Array(r.s).fill(0).map((_, si) => <Icon key={si} name="star" size={11} style={{color: PFP.amber, fill: PFP.amber}}/>)}
                      </div>
                      <span style={{flex: 1}}/>
                      <span style={{fontSize: 10, color: PFP.muted, fontFamily: MONO}}>{r.src}</span>
                      {r.isNew && <Pill color="green" dot>New</Pill>}
                    </div>
                    <div style={{fontSize: 11.5, color: PFP.text, lineHeight: 1.45}}>"{r.q}"</div>
                  </div>
                ))}
              </div>
            </Card>
          </StageIn>

          <StageIn delay={0.4} dur={0.5}>
            <Card pad={0} style={{overflow: 'hidden'}}>
              <div style={{padding: '12px 16px', borderBottom: `1px solid ${PFP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{fontSize: 12, fontWeight: 700, color: PFP.text}}>Live preview</div>
                <Pill color={colorPicked ? 'green' : 'gray'} dot>Syncs to site instantly</Pill>
              </div>
              <div style={{padding: 16, background: colorPicked ? '#fff' : '#fff'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12}}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: colorPicked ? `linear-gradient(135deg, ${PFP.teal}, #1FE0BC)` : '#888',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#04231E', fontWeight: 800, fontSize: 12,
                  }}>RP</div>
                  <span style={{fontSize: 12.5, fontWeight: 700, color: PFP.text}}>Ridge Pest Co.</span>
                  <span style={{flex: 1}}/>
                  <span style={{fontSize: 10, color: PFP.muted}}>Services</span>
                  <span style={{fontSize: 10, color: PFP.muted}}>Locations</span>
                  <span style={{fontSize: 10, color: PFP.muted}}>Reviews</span>
                </div>
                <div style={{fontSize: 16, fontWeight: 700, color: PFP.text, letterSpacing: '-0.012em', marginBottom: 6}}>
                  Pest-free homes across the Treasure Valley.
                </div>
                <div style={{fontSize: 11, color: PFP.muted, marginBottom: 12, lineHeight: 1.5}}>
                  Family-owned, locally-licensed. Same-week service in Boise, Meridian, and Nampa.
                </div>
                <div style={{display: 'flex', gap: 6}}>
                  <span style={{padding: '6px 12px', borderRadius: 7, background: colorPicked ? PFP.teal : '#888', color: '#fff', fontSize: 11, fontWeight: 600}}>Get a free quote</span>
                  <span style={{padding: '6px 12px', borderRadius: 7, border: `1px solid ${PFP.borderStrong}`, color: PFP.text, fontSize: 11, fontWeight: 600}}>Our services</span>
                </div>
              </div>
            </Card>
          </StageIn>
        </div>
      </div>

      <Cursor x={cur.x} y={cur.y} click={cur.click}/>
    </AppFrame>
  );
}

// ── Scene 8: Lead alert & close ─────────────────────────────────────────────
function Scene8_Lead() {
  const { localTime } = useSprite();
  // 0-1.4 dashboard, 1.4-2.5 notification slides in, 2.5-4 click → inbox view,
  // 4-7 lead details, 7-9.5 pull back to dashboard with final overlay
  const notifIn = localTime > 1.2 && localTime < 3.4;
  const notifT = clamp((localTime - 1.2) / 0.5, 0, 1);
  const notifOut = localTime > 2.9 ? clamp((localTime - 2.9) / 0.5, 0, 1) : 0;
  const notifFinal = Math.min(notifT, 1 - notifOut);

  const inboxOpen = localTime > 3.0 && localTime < 8.4;
  const inboxT = clamp((localTime - 3.0) / 0.5, 0, 1);
  const inboxOut = localTime > 7.8 ? clamp((localTime - 7.8) / 0.6, 0, 1) : 0;

  const finalView = localTime > 8.2;

  const cur = curseSeq(localTime, [
    { t: 0,   x: 700, y: 400 },
    { t: 1.6, x: 1180, y: 130 },             // toward notif
    { t: 2.8, x: 1180, y: 130, click: 1 },   // click notif
    { t: 4.4, x: 800, y: 320, click: 1 },    // click lead in inbox
    { t: 6.0, x: 1100, y: 580 },             // hover quote button
    { t: 7.4, x: 1100, y: 580 },
  ]);

  if (finalView) {
    return (
      <AppFrame active="dash" leadBadge={3}>
        <Topbar
          subtitle="One dashboard, everything connected."
          title="Better website. Better visibility. Better consistency."
          right={<Btn kind="primary" icon="sparkle">See your demo</Btn>}
        />
        <div style={{flex: 1, padding: '22px 28px', overflow: 'hidden'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14}}>
            {[
              { label: 'Website visitors', value: '4,218', delta: '+22%', icon: 'globe', accent: PFP.teal },
              { label: 'Local SEO score',  value: '89/100', delta: '+16 pts', icon: 'seo', accent: PFP.blue },
              { label: 'Scheduled posts',  value: '15',     delta: '+5',     icon: 'social', accent: PFP.violet },
              { label: 'New leads (7d)',   value: '12',     delta: '+45%',   icon: 'inbox', accent: PFP.amber },
            ].map((s, i) => <StatCard key={i} {...s}/>)}
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14}}>
            {[
              { i: 'site',   t: 'Website',     s: 'Under your control' },
              { i: 'seo',    t: 'Local SEO',   s: 'Ranking locally' },
              { i: 'social', t: 'Social',      s: 'Posting on schedule' },
              { i: 'inbox',  t: 'Leads',       s: 'Notified instantly' },
            ].map((c, i) => (
              <Card key={i} pad={18}>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: PFP.tealSoft, color: PFP.teal,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name={c.i} size={17}/></div>
                  <div style={{fontSize: 14, fontWeight: 700, color: PFP.text}}>{c.t}</div>
                </div>
                <div style={{fontSize: 11.5, color: PFP.muted}}>{c.s}</div>
              </Card>
            ))}
          </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame active={inboxOpen ? 'inbox' : 'dash'} leadBadge={inboxOpen ? 3 : 2}>
      <Topbar
        subtitle={inboxOpen ? 'Lead inbox' : 'Welcome back, Ridge Pest Co.'}
        title={inboxOpen ? 'New inquiries' : 'Your digital presence'}
        right={inboxOpen ? <Pill color="green" dot>1 new · 12s ago</Pill> : <Btn kind="ghost" icon="eye">View live site</Btn>}
      />

      <div style={{flex: 1, padding: '22px 28px', overflow: 'hidden', position: 'relative'}}>
        {!inboxOpen && (
          // Dashboard-ish background
          <div style={{opacity: 1 - inboxT}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14}}>
              {[
                { label: 'Website visitors', value: '4,218', delta: '+22%', icon: 'globe', accent: PFP.teal },
                { label: 'Local SEO score',  value: '82/100', delta: '+9 pts', icon: 'seo', accent: PFP.blue },
                { label: 'Scheduled posts',  value: '14',     delta: '+4',     icon: 'social', accent: PFP.violet },
                { label: 'New leads (7d)',   value: '11',     delta: '+38%',   icon: 'inbox', accent: PFP.amber },
              ].map((s, i) => <StatCard key={i} {...s}/>)}
            </div>
          </div>
        )}

        {/* Inbox view */}
        {inboxOpen && (
          <div style={{
            opacity: Easing.easeOutCubic(Math.min(inboxT, 1 - inboxOut)),
            transform: `translateY(${(1 - inboxT) * 16}px)`,
            display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 14,
          }}>
            {/* Lead list */}
            <Card pad={0}>
              <div style={{padding: '14px 16px', borderBottom: `1px solid ${PFP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{fontSize: 13.5, fontWeight: 700, color: PFP.text}}>All leads</div>
                <span style={{fontSize: 11, color: PFP.muted, fontFamily: MONO}}>14 this month</span>
              </div>
              {[
                { n: 'Sarah Whitmore', s: 'Ant problem — Meridian', t: 'Just now',    sel: localTime > 4.5, isNew: true, src: 'Quote form' },
                { n: 'Daniel Park',    s: 'Quarterly plan — Boise', t: '2h ago',    src: 'Phone' },
                { n: 'Maya Rivera',    s: 'Wasps — Nampa',          t: '6h ago',    src: 'Quote form' },
                { n: 'Aaron Tate',     s: 'Termite inspection',     t: 'Yesterday', src: 'Quote form' },
                { n: 'Eve Castillo',   s: 'Mice in attic — Eagle',  t: '2d ago',    src: 'Phone' },
              ].map((l, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: l.sel ? PFP.tealSoft : 'transparent',
                  borderLeft: l.sel ? `3px solid ${PFP.teal}` : '3px solid transparent',
                  borderBottom: i < 4 ? `1px solid ${PFP.border}` : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: l.isNew ? PFP.teal : PFP.bg,
                    color: l.isNew ? '#fff' : PFP.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{l.n.split(' ').map(p => p[0]).join('')}</div>
                  <div style={{flex: 1, lineHeight: 1.25}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                      <span style={{fontSize: 12.5, fontWeight: 700, color: PFP.text}}>{l.n}</span>
                      {l.isNew && <Pill color="green" dot>New</Pill>}
                    </div>
                    <div style={{fontSize: 11, color: PFP.muted}}>{l.s}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: 10.5, color: PFP.muted, fontFamily: MONO}}>{l.t}</div>
                    <div style={{fontSize: 10, color: PFP.faint, marginTop: 2}}>{l.src}</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Lead detail */}
            {localTime > 4.5 ? (
              <Card pad={20} style={{
                opacity: clamp((localTime - 4.5) / 0.4, 0, 1),
                transform: `translateY(${(1 - clamp((localTime - 4.5) / 0.4, 0, 1)) * 10}px)`,
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16}}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: PFP.teal, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700,
                  }}>SW</div>
                  <div style={{flex: 1, lineHeight: 1.2}}>
                    <div style={{fontSize: 16, fontWeight: 700, color: PFP.text, letterSpacing: '-0.01em'}}>Sarah Whitmore</div>
                    <div style={{fontSize: 11.5, color: PFP.muted}}>Meridian, ID · came in 12 seconds ago</div>
                  </div>
                  <Pill color="green" dot>New</Pill>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14}}>
                  {[
                    { l: 'Phone', v: '(208) 555-0192', m: true },
                    { l: 'Email', v: 'sarah.w@gmail.com', m: true },
                    { l: 'Service', v: 'Ant control' },
                    { l: 'Source', v: 'Quote form · /services/ants' },
                  ].map((r, i) => (
                    <div key={i} style={{
                      padding: '9px 11px', borderRadius: 8,
                      background: PFP.bg, border: `1px solid ${PFP.border}`,
                    }}>
                      <div style={{fontSize: 10, color: PFP.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em'}}>{r.l}</div>
                      <div style={{fontSize: 12.5, color: PFP.text, fontWeight: 600, marginTop: 2, fontFamily: r.m ? MONO : FONT}}>{r.v}</div>
                    </div>
                  ))}
                </div>

                <Field label="Message">
                  <div style={{
                    border: `1px solid ${PFP.border}`, borderRadius: 8,
                    padding: '12px 14px', fontSize: 12.5, color: PFP.text, lineHeight: 1.55,
                    background: '#FAFBFD',
                  }}>
                    "Hi — we've been seeing a lot of ants on our kitchen counters this week. Single-family home, around 2,400 sqft. Can someone come out this week to take a look?"
                  </div>
                </Field>

                <div style={{display: 'flex', gap: 8, marginTop: 14, alignItems: 'center'}}>
                  <Btn kind="primary" icon="phone">Call Sarah</Btn>
                  <Btn kind="ghost" icon="edit">Send quote</Btn>
                  <span style={{flex: 1}}/>
                  <span style={{fontSize: 11, color: PFP.muted, display: 'flex', alignItems: 'center', gap: 5}}>
                    <Icon name="bell" size={12} style={{color: PFP.teal}}/>
                    SMS + email sent to your phone
                  </span>
                </div>
              </Card>
            ) : (
              <Card pad={20} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: PFP.muted, fontSize: 13,
              }}>
                Select a lead to view details
              </Card>
            )}
          </div>
        )}

        {/* Live notification toast */}
        {notifIn && (
          <div style={{
            position: 'absolute', right: 28, top: 18,
            transform: `translateY(${(1 - Easing.easeOutBack(notifFinal)) * -40}px)`,
            opacity: notifFinal,
            zIndex: 200,
            width: 340,
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 11,
              boxShadow: '0 14px 36px rgba(11,20,38,0.18)',
              border: `1px solid ${PFP.border}`,
              padding: 14,
              display: 'flex', gap: 11, alignItems: 'flex-start',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 3, background: PFP.teal,
              }}/>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: PFP.tealSoft, color: PFP.teal,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}><Icon name="bell" size={17}/></div>
              <div style={{flex: 1, lineHeight: 1.3}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <span style={{fontSize: 12.5, fontWeight: 700, color: PFP.text}}>New lead</span>
                  <Pill color="green" dot>Live</Pill>
                </div>
                <div style={{fontSize: 12, color: PFP.text, marginTop: 4, fontWeight: 500}}>Sarah Whitmore · Ant problem in Meridian</div>
                <div style={{fontSize: 10.5, color: PFP.muted, marginTop: 2}}>Just now · /services/ants</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Cursor x={cur.x} y={cur.y} click={cur.click}/>
    </AppFrame>
  );
}

Object.assign(window, {
  Scene5_Social, Scene6_Blog, Scene7_Branding, Scene8_Lead,
});

'use client';

import React from 'react';
import './landing.css';
import { T, LANGS, type Lang } from './translations';

type SubmitStatus = 'idle' | 'sending' | 'ok' | 'error';
type Theme = 'dark' | 'light';

const FEATURE_META = [
  { icon: '◉', wide: true },
  { icon: '⌘', wide: false },
  { icon: '⇄', wide: false },
  { icon: '✎', wide: false },
  { icon: '文', wide: false },
  { icon: '⛨', wide: false },
];

type DemoPhase = 'idle' | 'scan' | 'typing' | 'done';

/* Brand mark: a geometric wasp inside a hexagonal badge, drawn in the accent color.
   The abdomen stripes are painted with the page ground color so the mark works in both themes. */
function WaspLogo() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 3.5 57 18v28L32 60.5 7 46V18Z"
        fill="rgba(55, 214, 197, 0.1)"
        stroke="var(--cyan)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="21" cy="24.5" rx="9.5" ry="4.6" fill="var(--cyan)" opacity="0.38" transform="rotate(-26 21 24.5)" />
      <ellipse cx="43" cy="24.5" rx="9.5" ry="4.6" fill="var(--cyan)" opacity="0.38" transform="rotate(26 43 24.5)" />
      <path
        d="M28.6 13.6q-3.2-3.2-6.8-3.7M35.4 13.6q3.2-3.2 6.8-3.7"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="17.6" r="4.3" fill="var(--cyan)" />
      <circle cx="32" cy="26.8" r="5.3" fill="var(--cyan)" />
      <path
        d="M32 32.2c6.2 0 8.8 3.4 8.8 7.4 0 6.8-5.2 12.6-8.8 15.6-3.6-3-8.8-8.8-8.8-15.6 0-4 2.6-7.4 8.8-7.4Z"
        fill="var(--cyan)"
      />
      <path d="M23.9 38h16.2M24.6 44h14.8M27.6 50h8.8" stroke="var(--ground)" strokeWidth="2.6" />
    </svg>
  );
}

/* Real anonymized MRI slices (lumbosacral spine study, pixel data only — no patient info). */
const SERIES = [
  { src: '/mri/sag_t1_3.png', label: 'SAG T1 · 3/7', meta: '512 × 512 · 4 mm' },
  { src: '/mri/sag_t1_4.png', label: 'SAG T1 · 4/7', meta: '512 × 512 · 4 mm' },
  { src: '/mri/sag_t1_5.png', label: 'SAG T1 · 5/7', meta: '512 × 512 · 4 mm' },
  { src: '/mri/sag_stir_3.png', label: 'SAG T2 IRFSE · 3/7', meta: '256 × 256 · 4 mm' },
  { src: '/mri/sag_stir_4.png', label: 'SAG T2 IRFSE · 4/7', meta: '256 × 256 · 4 mm' },
  { src: '/mri/sag_stir_5.png', label: 'SAG T2 IRFSE · 5/7', meta: '256 × 256 · 4 mm' },
  { src: '/mri/ax_t2_4.png', label: 'AX T2 · 4/9', meta: '256 × 256 · 4 mm' },
  { src: '/mri/ax_t2_5.png', label: 'AX T2 · 5/9', meta: '256 × 256 · 4 mm' },
  { src: '/mri/ax_t2_6.png', label: 'AX T2 · 6/9', meta: '256 × 256 · 4 mm' },
];

export default function LandingPage() {
  const [status, setStatus] = React.useState<SubmitStatus>('idle');
  const [lang, setLang] = React.useState<Lang>('ru');
  const [theme, setTheme] = React.useState<Theme>('dark');
  const t = T[lang];

  /* eslint-disable react-hooks/set-state-in-effect --
     SSR-safe client preference hydration and demo-loop state machine:
     these synchronous setStates in effects are intentional. */
  React.useEffect(() => {
    const storedLang = localStorage.getItem('medai-lang');
    if (storedLang === 'ru' || storedLang === 'uz' || storedLang === 'en') setLang(storedLang);
    const storedTheme = localStorage.getItem('medai-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('medai-lang', l);
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('medai-theme', next);
  };

  /* ---- hero mockup demo animation: scan → type the report → done, looped ---- */
  const [phase, setPhase] = React.useState<DemoPhase>('idle');
  const [series, setSeries] = React.useState(0);
  /* after the draft is done, the "physician confirmed" state appears with a short delay */
  const [verified, setVerified] = React.useState(false);
  const [typedCount, setTypedCount] = React.useState(0);
  const fullReport = t.mockup.lines.join('\n');

  React.useEffect(() => {
    // restart the demo from scratch when the language changes
    setPhase('idle');
    setTypedCount(0);
  }, [lang]);

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (phase !== 'done' || typedCount !== fullReport.length) {
        setPhase('done');
        setTypedCount(fullReport.length);
      }
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (phase === 'idle') {
      timer = setTimeout(() => setPhase('scan'), 900);
    } else if (phase === 'scan') {
      timer = setTimeout(() => setPhase('typing'), 2000);
    } else if (phase === 'typing') {
      if (typedCount < fullReport.length) {
        timer = setTimeout(() => setTypedCount((c) => Math.min(fullReport.length, c + 3)), 16);
      } else {
        timer = setTimeout(() => setPhase('done'), 350);
      }
    } else {
      // done: hold the result, then run the demo again
      timer = setTimeout(() => {
        setTypedCount(0);
        setVerified(false);
        setPhase('scan');
      }, 12000);
    }
    return () => clearTimeout(timer);
  }, [phase, typedCount, fullReport]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const restartDemo = () => {
    setTypedCount(0);
    setVerified(false);
    setPhase('scan');
  };

  React.useEffect(() => {
    if (phase !== 'done') return;
    const id = setTimeout(() => setVerified(true), 1600);
    return () => clearTimeout(id);
  }, [phase]);

  /* reveal-on-scroll: cards and section heads fade in as they enter the viewport.
     The initial hidden state is applied only after JS adds .reveal-on, so the page
     stays fully visible without JS or with prefers-reduced-motion.
     Re-runs on language change: translated nodes are remounted with new keys and
     would otherwise stay hidden — on re-runs everything is shown immediately. */
  const revealRan = React.useRef(false);
  React.useEffect(() => {
    const root = document.querySelector('.landing');
    if (!root) return;

    const els = root.querySelectorAll(
      '.sec-head, .card, .step, .bento-card, .aud-card, .tech-panel, .disclaimer, .legal-box, .faq-item, .demo-panel',
    );

    const showNow = () => {
      els.forEach((el) => {
        el.classList.add('in');
      });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('reveal-on');
      showNow();
      return;
    }

    root.classList.add('reveal-on');

    if (revealRan.current) {
      showNow();
      return;
    }
    revealRan.current = true;

    if (!('IntersectionObserver' in window)) {
      showNow();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px' },
    );

    els.forEach((el) => io.observe(el));

    const fallback = window.setTimeout(() => {
      els.forEach((el) => {
        if (!el.classList.contains('in')) {
          el.classList.add('in');
        }
      });
    }, 700);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [lang]);

  const reportBodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // keep the last typed line in view while the draft is being written
    const el = reportBodyRef.current;
    if (el && phase === 'typing') el.scrollTop = el.scrollHeight;
  }, [typedCount, phase]);

  const typedLines = fullReport.slice(0, typedCount).split('\n');

  const handleDemoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const v = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() ?? '';

    setStatus('sending');
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: v('name'),
          org: v('org'),
          email: v('email'),
          phone: v('phone'),
          msg: v('msg'),
        }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('ok');
      form.reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="landing" data-theme={theme}>
      <div className="bg-glow" aria-hidden="true"></div>

      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="logo" href="#top">
            <WaspLogo />
            WaspMed <b>Draft</b>
          </a>
          <nav>
            <a href="#problem">{t.nav.problem}</a>
            <a href="#how">{t.nav.how}</a>
            <a href="#features">{t.nav.features}</a>
            <a href="#tech">{t.nav.tech}</a>
            <a href="#faq">{t.nav.faq}</a>
            <div className="lang-switch" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={lang === l.code ? 'active' : ''}
                  onClick={() => changeLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={t.themeToggle}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <a className="btn btn-primary btn-sm" href="#demo">
              {t.nav.cta}
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="hero">
          <div className="wrap">
            <div className="hero-grid">
            <div className="mockup">
              <div className="mockup-bar">
                <span className="mdot"></span>
                <span className="mdot"></span>
                <span className="mdot"></span>
                <span className="mockup-title">WaspMed Draft — Study #4821 · MRI Lumbar Spine</span>
              </div>
              <div className="mockup-body">
                <div className="mockup-viewer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="mri-img" src={SERIES[series].src} alt={t.mockup.alt} decoding="async" />
                  {phase === 'scan' && <div className="viewer-scanline" aria-hidden="true"></div>}
                  <div className="scan-cross-h" aria-hidden="true"></div>
                  <div className="scan-cross-v" aria-hidden="true"></div>
                  <span className="scan-meta tl">{SERIES[series].label}</span>
                  <span className="scan-meta br">{SERIES[series].meta}</span>
                  <div className="series-thumbs">
                    {SERIES.map((s, i) => (
                      <button
                        key={s.src}
                        type="button"
                        className={i === series ? 'active' : ''}
                        onClick={() => setSeries(i)}
                        aria-label={s.label}
                        aria-pressed={i === series}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt="" loading="lazy" decoding="async" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mockup-report">
                  <div className="report-head">
                    <button
                      type="button"
                      className={`report-badge${phase === 'scan' || phase === 'typing' ? ' busy' : ''}`}
                      onClick={restartDemo}
                    >
                      AI DRAFT
                    </button>
                    <span className="report-time">
                      {phase === 'done' ? t.mockup.time : phase === 'idle' ? '' : t.mockup.analyzing}
                    </span>
                  </div>
                  <div className="report-body" ref={reportBodyRef}>
                    {phase === 'idle' || phase === 'scan' ? (
                      <>
                        <div className={`rline w90${phase === 'scan' ? ' pulse' : ''}`}></div>
                        <div className={`rline w75${phase === 'scan' ? ' pulse' : ''}`}></div>
                        <div className={`rline w85${phase === 'scan' ? ' pulse' : ''}`}></div>
                        <div className={`rline w60${phase === 'scan' ? ' pulse' : ''}`}></div>
                      </>
                    ) : (
                      typedLines.map((line, i) => (
                        <div
                          key={i}
                          className={`rtext${line.startsWith(t.mockup.conclusionMark) ? ' rtext-conclusion' : ''}`}
                        >
                          {line}
                          {phase === 'typing' && i === typedLines.length - 1 && (
                            <span className="caret" aria-hidden="true"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className={`rfinding${phase === 'done' ? ' show' : ''}${verified ? ' ok' : ''}`}>
                    <span className="rfinding-dot"></span>
                    {verified ? t.mockup.verified : t.mockup.finding}
                  </div>
                  <div className={`report-actions${phase === 'done' ? ' show' : ''}`}>
                    <span className="raccept">{t.mockup.accept}</span>
                    <span className="redit">{t.mockup.edit}</span>
                    <span className={`rprint${verified ? ' ready' : ''}`}>{t.mockup.print}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-copy">
              <div className="pill">
                <span className="pill-dot" aria-hidden="true"></span>
                {t.hero.pill}
              </div>
              <h1>
                {t.hero.h1a}
                <span className="grad-text">{t.hero.h1accent}</span>
                {t.hero.h1b}
              </h1>
              <p className="lead">
                {t.hero.leadA}
                <b>{t.hero.leadB}</b>
                {t.hero.leadC}
              </p>
              <div className="cta-row">
                <a className="btn btn-primary" href="#demo">
                  {t.hero.ctaDemo}
                </a>
                <a className="btn btn-ghost" href="#how">
                  {t.hero.ctaHow}
                </a>
              </div>
              <ul className="hero-points">
                {t.hero.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            </div>
          </div>

          <div className="wrap">
            <div className="stats">
              {t.stats.map((s) => (
                <div key={s.cap} className="stat">
                  <div className="num">{s.num}</div>
                  <div className="cap">{s.cap}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- problem ---------- */}
        <section id="problem">
          <div className="wrap">
            <div className="sec-head">
              <div className="kicker">{t.problem.kicker}</div>
              <h2>{t.problem.h2}</h2>
              <p className="sec-intro">{t.problem.intro}</p>
            </div>
            <div className="cards">
              {t.problem.cards.map((c) => (
                <div key={c.h3} className="card">
                  <div className="k">{c.k}</div>
                  <h3>{c.h3}</h3>
                  <p>{c.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- how ---------- */}
        <section id="how">
          <div className="wrap">
            <div className="sec-head">
              <div className="kicker">{t.how.kicker}</div>
              <h2>{t.how.h2}</h2>
              <p className="sec-intro">{t.how.intro}</p>
            </div>
            <div className="pipeline">
              {t.how.steps.map((s, i) => (
                <div key={s.h3} className="step">
                  <div className="step-num">{i + 1}</div>
                  <h3>{s.h3}</h3>
                  <p>{s.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- features ---------- */}
        <section id="features">
          <div className="wrap">
            <div className="sec-head">
              <div className="kicker">{t.features.kicker}</div>
              <h2>{t.features.h2}</h2>
              <p className="sec-intro">{t.features.intro}</p>
            </div>
            <div className="bento">
              {t.features.items.map((f, i) => (
                <div key={f.title} className={`bento-card${FEATURE_META[i]?.wide ? ' wide' : ''}`}>
                  <div className="bento-icon" aria-hidden="true">
                    {FEATURE_META[i]?.icon}
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- audiences ---------- */}
        <section id="for">
          <div className="wrap">
            <div className="sec-head">
              <div className="kicker">{t.audiences.kicker}</div>
              <h2>{t.audiences.h2}</h2>
            </div>
            <div className="aud-grid">
              {t.audiences.items.map((a, i) => (
                <div key={a.title} className="aud-card">
                  <span className="aud-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- tech ---------- */}
        <section id="tech">
          <div className="wrap">
            <div className="sec-head">
              <div className="kicker">{t.tech.kicker}</div>
              <h2>{t.tech.h2}</h2>
              <p className="sec-intro">{t.tech.intro}</p>
            </div>
            <div className="tech">
              <div className="tech-panel">
                <h3>{t.tech.modelTitle}</h3>
                <ul>
                  {t.tech.model.map((li) => (
                    <li key={li.b}>
                      <b>{li.b}</b>
                      {li.rest}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="tech-panel">
                <h3>{t.tech.datasetTitle}</h3>
                <ul>
                  {t.tech.dataset.map((li) => (
                    <li key={li.b}>
                      <b>{li.b}</b>
                      {li.rest}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="disclaimer">
              <b>{t.tech.disclaimerB}</b>
              {t.tech.disclaimer}
            </div>
            <div className="legal-box">
              <h3>
                <span className="legal-lock" aria-hidden="true">⛨</span>
                {t.tech.legalTitle}
              </h3>
              <ul>
                {t.tech.legalPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------- faq ---------- */}
        <section id="faq">
          <div className="wrap wrap-narrow">
            <div className="sec-head">
              <div className="kicker">{t.faq.kicker}</div>
              <h2>{t.faq.h2}</h2>
            </div>
            <div className="faq-list">
              {t.faq.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>
                    {item.q}
                    <span className="faq-chevron" aria-hidden="true">
                      ＋
                    </span>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- demo ---------- */}
        <section id="demo" className="demo">
          <div className="wrap">
            <div className="demo-panel">
              <div className="demo-grid">
                <div className="side">
                  <div className="kicker">{t.demo.kicker}</div>
                  <h2>{t.demo.h2}</h2>
                  <p>{t.demo.p}</p>
                  <ul className="demo-points">
                    {t.demo.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                {status === 'ok' ? (
                  <div className="form-success" role="status">
                    <svg className="success-ring" viewBox="0 0 64 64" aria-hidden="true">
                      <circle className="ring" cx="32" cy="32" r="28" />
                      <path className="check" d="M20 33 l8.5 8.5 L44 24" />
                    </svg>
                    <p className="success-title">{t.demo.form.okTitle}</p>
                    <p className="success-sub">{t.demo.form.okSub}</p>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatus('idle')}>
                      {t.demo.form.again}
                    </button>
                  </div>
                ) : (
                <form onSubmit={handleDemoSubmit}>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="f-name">{t.demo.form.name}</label>
                      <input id="f-name" name="name" type="text" placeholder={t.demo.form.namePh} required />
                    </div>
                    <div className="field">
                      <label htmlFor="f-org">{t.demo.form.org}</label>
                      <input id="f-org" name="org" type="text" placeholder={t.demo.form.orgPh} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="f-email">{t.demo.form.email}</label>
                      <input id="f-email" name="email" type="email" placeholder={t.demo.form.emailPh} required />
                    </div>
                    <div className="field">
                      <label htmlFor="f-phone">{t.demo.form.phone}</label>
                      <input id="f-phone" name="phone" type="tel" placeholder={t.demo.form.phonePh} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="f-msg">{t.demo.form.msg}</label>
                    <textarea id="f-msg" name="msg" placeholder={t.demo.form.msgPh} />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
                    {status === 'sending' ? t.demo.form.sending : t.demo.form.submit}
                  </button>
                  {status === 'error' ? (
                    <p className="form-note form-note-err">{t.demo.form.err}</p>
                  ) : (
                    <p className="form-note">{t.demo.form.note}</p>
                  )}
                </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <a className="logo" href="#top">
              <WaspLogo />
              WaspMed <b>Draft</b>
            </a>
            <p>{t.footer.desc}</p>
          </div>
          <div className="footer-col">
            <div className="footer-title">{t.footer.product}</div>
            <a href="#problem">{t.nav.problem}</a>
            <a href="#how">{t.nav.how}</a>
            <a href="#features">{t.nav.features}</a>
            <a href="#tech">{t.nav.tech}</a>
          </div>
          <div className="footer-col">
            <div className="footer-title">{t.footer.company}</div>
            <a href="#for">{t.nav.forWho}</a>
            <a href="#faq">{t.nav.faq}</a>
            <a href="#demo">{t.nav.cta}</a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>{t.footer.copyright}</span>
          <span>{t.footer.legal}</span>
        </div>
      </footer>
    </div>
  );
}

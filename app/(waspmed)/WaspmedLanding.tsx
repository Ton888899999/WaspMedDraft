'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ICONS, type IconId } from './icons';
import {
  CONTACT,
  DEPARTMENTS,
  FAQ,
  FOOTER,
  HERO,
  INTEGRATIONS,
  LANGS,
  LAUNCH,
  METRICS,
  METRICS_NOTE,
  MODULES,
  NAV,
  REQUEST_DEMO,
  ROLES,
  SECURITY,
  TITLES,
  TOUR,
  WHY,
  type Lang,
  type Shot,
  type Text,
} from './content';

type Theme = 'light' | 'dark';

const LANG_KEY = 'waspmed-lang';
const THEME_KEY = 'waspmed-theme';

/* The highlighted phrase sits in a different place in each language. */
const HERO_TITLE: Record<Lang, React.ReactNode> = {
  ru: <>Операционная система<br />для <span className="hl">частной клиники</span></>,
  uz: <><span className="hl">Хусусий клиника</span> учун<br />операцион тизим</>,
  en: <>The operating system<br />for <span className="hl">private clinics</span></>,
};

/* A tour screenshot fills the right column from 980px and the whole width below. */
const SCREEN_SIZES = '(min-width: 980px) 760px, 100vw';

/* Screens are numbered across the whole tour: the first number of each department. */
const FIRST_SCREEN: number[] = [];
let nextScreen = 1;
for (const department of DEPARTMENTS) {
  FIRST_SCREEN.push(nextScreen);
  nextScreen += department.screens.length;
}

function Icon({ id }: { id: IconId }) {
  return <svg className="i" viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[id] }} />;
}

/** The saved language, else the browser's: Uzbek and Russian readers get their own, everyone else English. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  } catch {
    /* storage blocked — fall back to the browser language */
  }
  const browser = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  return browser === 'uz' ? 'uz' : browser === 'ru' ? 'ru' : 'en';
}

export function WaspmedLanding({ className }: { className?: string }) {
  const [lang, setLang] = React.useState<Lang>('ru');
  // null: follow the system theme until the visitor picks one.
  const [theme, setTheme] = React.useState<Theme | null>(null);
  const [tab, setTab] = React.useState(0);
  const [zoomed, setZoomed] = React.useState<Shot | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const tr = (text: Text) => text[lang];

  /* eslint-disable react-hooks/set-state-in-effect --
     SSR-safe hydration of the visitor's saved language and theme. */
  React.useEffect(() => {
    setLang(initialLang());
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {
      /* storage blocked — follow the system theme */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    document.title = TITLES[lang];
  }, [lang]);

  // Blocks fade in the first time they scroll into view.
  React.useEffect(() => {
    const blocks = rootRef.current?.querySelectorAll('.reveal') ?? [];
    if (!('IntersectionObserver' in window)) {
      blocks.forEach((b) => b.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    blocks.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoomed]);

  const chooseLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* not remembered — still switched for this visit */
    }
  };

  const toggleTheme = () => {
    const current = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* not remembered — still switched for this visit */
    }
  };

  const shotImage = (shot: Shot, sizes: string, priority = false) => (
    <Image src={shot.image} alt={tr(shot.caption)} sizes={sizes} priority={priority} />
  );

  const logo = (
    <a className="logo" href="#top">
      <span className="logo-mark">
        <Icon id="plus" />
      </span>
      <span>
        Wasp<em>Med</em>
      </span>
    </a>
  );

  return (
    <div ref={rootRef} className={`wm ${className ?? ''}`} lang={lang} data-theme={theme ?? undefined}>
      <nav>
        <div className="wrap">
          {logo}
          <div className="links">
            {NAV.map((item) =>
              item.href.startsWith('#') ? (
                <a key={item.href} href={item.href}>
                  {tr(item.label)}
                </a>
              ) : (
                <Link key={item.href} href={item.href}>
                  {tr(item.label)}
                </Link>
              ),
            )}
          </div>
          <div className="nav-r">
            <div className="lang" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => chooseLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button" className="theme" title="Сменить тему" aria-label="Сменить тему" onClick={toggleTheme}>
              <Icon id="sun" />
            </button>
            <a className="btn btn-primary btn-sm" href="#contact">
              {tr(REQUEST_DEMO)}
            </a>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="wrap">
          <span className="badge">
            <b>MVP</b> {tr(HERO.badge)}
          </span>
          <h1>{HERO_TITLE[lang]}</h1>
          <p className="lead">{tr(HERO.lead)}</p>
          <div className="cta">
            <a className="btn btn-primary" href="#contact">
              {tr(REQUEST_DEMO)} <Icon id="arrow" />
            </a>
            <a className="btn btn-line" href="#tour">
              {tr(HERO.seeProduct)}
            </a>
          </div>
          <div className="fine">
            {HERO.fine.map((item) => (
              <span key={item.en}>
                <Icon id="check" />
                {tr(item)}
              </span>
            ))}
          </div>

          <div className="stage">
            <button type="button" className="frame" onClick={() => setZoomed(HERO.main)}>
              <span className="bar">
                <i />
                <i />
                <i />
                <span className="url">waspmed · Молиявий панел</span>
              </span>
              {shotImage(HERO.main, '(min-width: 1184px) 1120px, 100vw', true)}
            </button>
            <button type="button" className="float r" onClick={() => setZoomed(HERO.right)}>
              {shotImage(HERO.right, '340px')}
            </button>
          </div>
        </div>
      </header>

      <div className="proof">
        <div className="wrap">
          <div className="metrics reveal">
            {METRICS.map((m) => (
              <div key={m.value} className="metric">
                <b>{m.value}</b>
                <span>{tr(m.label)}</span>
              </div>
            ))}
          </div>
          <div className="metrics-note">{tr(METRICS_NOTE)}</div>
          <div className="integr reveal">
            <p>{tr(INTEGRATIONS.title)}</p>
            <ul>
              {INTEGRATIONS.items.map((item) => (
                <li key={item.en}>{tr(item)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <section id="why">
        <div className="wrap">
          <div className="head reveal">
            <span className="eyebrow">{tr(WHY.eyebrow)}</span>
            <h2>{tr(WHY.title)}</h2>
            <p className="sub">{tr(WHY.sub)}</p>
          </div>
          <div className="ps">
            <div className="ps-col before reveal">
              <h4>{tr(WHY.before.title)}</h4>
              <ul>
                {WHY.before.items.map((item) => (
                  <li key={item.en}>
                    <Icon id="x" />
                    {tr(item)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ps-col after reveal">
              <h4>{tr(WHY.after.title)}</h4>
              <ul>
                {WHY.after.items.map((item) => (
                  <li key={item.en}>
                    <Icon id="check" />
                    {tr(item)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="tour" className="alt">
        <div className="wrap">
          <div className="head reveal">
            <span className="eyebrow">{tr(TOUR.eyebrow)}</span>
            <h2>{tr(TOUR.title)}</h2>
            <p className="sub">{tr(TOUR.sub)}</p>
          </div>
          <div className="tabs" role="tablist">
            {DEPARTMENTS.map((d, i) => (
              <button
                key={d.name.en}
                type="button"
                className="tab"
                role="tab"
                id={`t${i}`}
                aria-controls={`p${i}`}
                aria-selected={tab === i}
                onClick={() => setTab(i)}
              >
                <Icon id={d.icon} />
                {tr(d.name)}
              </button>
            ))}
          </div>
          {DEPARTMENTS.map((d, i) => (
            <div key={d.name.en} className={`panel${tab === i ? ' on' : ''}`} id={`p${i}`} role="tabpanel" aria-labelledby={`t${i}`}>
              {d.screens.map((s, j) => (
                <div key={s.title.en} className="screen">
                  <div>
                    <div className="num">
                      {String(FIRST_SCREEN[i] + j).padStart(2, '0')} · <span>{tr(d.name)}</span>
                    </div>
                    <h3>{tr(s.title)}</h3>
                    <p>{tr(s.lead)}</p>
                    <ul className="checks">
                      {s.checks.map((c) => (
                        <li key={c.en}>
                          <Icon id="check" />
                          {tr(c)}
                        </li>
                      ))}
                    </ul>
                    {s.more && (
                      <Link className="btn btn-line btn-sm more" href={s.more.href}>
                        {tr(s.more.label)} <Icon id="arrow" />
                      </Link>
                    )}
                  </div>
                  <button type="button" className="shot" onClick={() => setZoomed(s.shot)}>
                    {shotImage(s.shot, SCREEN_SIZES)}
                    <span className="zoom">
                      <Icon id="zoom" />
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="modules">
        <div className="wrap">
          <div className="head reveal">
            <span className="eyebrow">{tr(MODULES.eyebrow)}</span>
            <h2>{tr(MODULES.title)}</h2>
            <p className="sub">{tr(MODULES.sub)}</p>
          </div>
          <div className="mods reveal">
            {MODULES.items.map((m) => (
              <div key={m.title.en} className="mod">
                <span className="ic">
                  <Icon id={m.icon} />
                </span>
                <div>
                  <h4>{tr(m.title)}</h4>
                  <p>{tr(m.text)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="alt">
        <div className="wrap">
          <div className="head reveal">
            <span className="eyebrow">{tr(ROLES.eyebrow)}</span>
            <h2>{tr(ROLES.title)}</h2>
            <p className="sub">{tr(ROLES.sub)}</p>
          </div>
          <div className="rgrid reveal">
            {ROLES.groups.map((g) => (
              <div key={g.title.en} className="rcol">
                <h4>
                  <Icon id={g.icon} />
                  {tr(g.title)}
                </h4>
                <ul>
                  {g.roles.map((r) => (
                    <li key={r.en}>{tr(r)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="dark">
        <div className="wrap">
          <div className="head reveal">
            <span className="eyebrow">{tr(SECURITY.eyebrow)}</span>
            <h2>{tr(SECURITY.title)}</h2>
            <p className="sub">{tr(SECURITY.sub)}</p>
          </div>
          <div className="sec-grid">
            {SECURITY.items.map((s) => (
              <div key={s.title.en} className="sec reveal">
                <Icon id={s.icon} />
                <h4>{tr(s.title)}</h4>
                <p>{tr(s.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="launch">
        <div className="wrap">
          <div className="head reveal">
            <span className="eyebrow">{tr(LAUNCH.eyebrow)}</span>
            <h2>{tr(LAUNCH.title)}</h2>
          </div>
          <div className="steps reveal">
            {LAUNCH.steps.map((s) => (
              <div key={s.title.en} className="step">
                <h4>{tr(s.title)}</h4>
                <p>{tr(s.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="alt">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">{tr(FAQ.eyebrow)}</span>
            <h2>{tr(FAQ.title)}</h2>
          </div>
          <div className="faq reveal">
            {FAQ.items.map((item) => (
              <details key={item.q.en}>
                <summary>
                  {tr(item.q)}
                  <Icon id="plus" />
                </summary>
                <p>{tr(item.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="wrap">
          <div className="final reveal">
            <span className="eyebrow">{tr(CONTACT.eyebrow)}</span>
            <h2>{tr(CONTACT.title)}</h2>
            <p>{tr(CONTACT.text)}</p>
            <div className="cta">
              <a className="btn btn-primary" href="mailto:?subject=WaspMed%20—%20демо">
                {tr(REQUEST_DEMO)} <Icon id="arrow" />
              </a>
              <a className="btn btn-line" href="#tour">
                {tr(CONTACT.seeAgain)}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          {logo}
          <span>{tr(FOOTER)}</span>
        </div>
      </footer>

      {zoomed && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="Просмотр скриншота" onClick={() => setZoomed(null)}>
          <button type="button" className="x" aria-label="Закрыть">
            <Icon id="x" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- the full-size view shows the original file */}
          <img src={zoomed.image.src} alt={tr(zoomed.caption)} />
          <div className="cap">{tr(zoomed.caption)}</div>
        </div>
      )}
    </div>
  );
}

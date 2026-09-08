'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import catalog from './catalog.json';
import imageSizes from './image-sizes.json';
type Work = (typeof catalog.works)[number];
type SoundMode = 'off' | 'on' | 'paused';
type AmbientEngine = {
  context: AudioContext;
  master: GainNode;
  wind: GainNode;
  water: GainNode;
  fauna: GainNode;
  tone: GainNode;
  sources: AudioScheduledSourceNode[];
  season: string;
  eventTimer: ReturnType<typeof setTimeout> | null;
};
const works = catalog.works;
const themes = ['All', 'Birds', 'Flowers', 'Moon', 'Rain', 'Snow', 'Animals'];
const themeZh = ['全部', '鸟', '花', '月', '雨', '雪', '动物'];
const seasons = [
  {
    name: 'Spring',
    zh: '春',
    id: 103,
    line: 'The first notes of a new year.',
    poem: '梅枝初醒，鸟声渐近。',
  },
  {
    name: 'Summer',
    zh: '夏',
    id: 48,
    line: 'Life gathers at the water’s edge.',
    poem: '水际花开，万物丰盈。',
  },
  {
    name: 'Autumn',
    zh: '秋',
    id: 36,
    line: 'A wingbeat across the evening moon.',
    poem: '雁过月明，秋意无声。',
  },
  {
    name: 'Winter',
    zh: '冬',
    id: 79,
    line: 'The world holds its breath.',
    poem: '雪落松间，静候来春。',
  },
];
const soundProfiles: Record<string, [number, number, number, number]> = {
  Spring: [0.3, 0.02, 0.11, 0.012],
  Summer: [0.18, 0.22, 0.015, 0.022],
  Autumn: [0.34, 0.018, 0.07, 0.02],
  Winter: [0.055, 0.004, 0, 0.008],
};

function createAmbientEngine(): AmbientEngine {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const sources: AudioScheduledSourceNode[] = [];
  const makeNoise = (
    seconds: number,
    memory: number,
    filterType: BiquadFilterType,
    frequency: number,
    modulationRate: number,
  ) => {
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let shaped = 0;
    for (let i = 0; i < data.length; i += 1) {
      shaped = memory * shaped + (1 - memory) * (Math.random() * 2 - 1);
      data[i] = shaped * 0.72;
    }
    data[data.length - 1] = data[0];
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = 0.985 + Math.random() * 0.03;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const swell = context.createGain();
    swell.gain.value = 0.72;
    const modulation = context.createOscillator();
    modulation.frequency.value = modulationRate;
    const modulationDepth = context.createGain();
    modulationDepth.gain.value = 0.16;
    modulation.connect(modulationDepth).connect(swell.gain);
    source.connect(filter).connect(swell);
    source.start();
    modulation.start();
    sources.push(source, modulation);
    return { output: swell, filter };
  };

  const wind = context.createGain();
  const water = context.createGain();
  const fauna = context.createGain();
  const tone = context.createGain();
  [wind, water, fauna, tone].forEach((gain) => {
    gain.gain.value = 0;
    gain.connect(master);
  });

  // Prime-length beds and slightly different playback rates keep their shared pattern from lining up.
  const windNoise = makeNoise(43, 0.975, 'lowpass', 560, 0.027);
  windNoise.output.connect(wind);
  const waterNoise = makeNoise(59, 0.68, 'bandpass', 1420, 0.043);
  waterNoise.filter.Q.value = 0.7;
  waterNoise.output.connect(water);

  const airTone = context.createOscillator();
  airTone.type = 'sine';
  airTone.frequency.value = 92;
  const toneFilter = context.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 190;
  const toneSwell = context.createGain();
  toneSwell.gain.value = 0.38;
  const toneModulation = context.createOscillator();
  toneModulation.frequency.value = 0.019;
  const toneDepth = context.createGain();
  toneDepth.gain.value = 0.25;
  toneModulation.connect(toneDepth).connect(toneSwell.gain);
  airTone.connect(toneFilter).connect(toneSwell).connect(tone);
  airTone.start();
  toneModulation.start();
  sources.push(airTone, toneModulation);

  const engine: AmbientEngine = {
    context,
    master,
    wind,
    water,
    fauna,
    tone,
    sources,
    season: 'Spring',
    eventTimer: null,
  };
  scheduleDistantTone(engine);
  return engine;
}

function scheduleDistantTone(engine: AmbientEngine) {
  const delay = 18000 + Math.random() * 29000;
  engine.eventTimer = setTimeout(() => {
    if (engine.context.state === 'running') {
      const chance = engine.season === 'Spring' ? 0.48 : engine.season === 'Autumn' ? 0.22 : 0.04;
      if (Math.random() < chance) {
        const now = engine.context.currentTime;
        const oscillator = engine.context.createOscillator();
        const filter = engine.context.createBiquadFilter();
        const envelope = engine.context.createGain();
        const autumn = engine.season === 'Autumn';
        const frequency = autumn ? 380 + Math.random() * 190 : 940 + Math.random() * 420;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.linearRampToValueAtTime(frequency * (0.97 + Math.random() * 0.07), now + 1.6);
        filter.type = 'bandpass';
        filter.frequency.value = frequency;
        filter.Q.value = 0.8;
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.055, now + 0.65);
        envelope.gain.linearRampToValueAtTime(0, now + 2.1);
        oscillator.connect(filter).connect(envelope).connect(engine.fauna);
        oscillator.start(now);
        oscillator.stop(now + 2.2);
      }
    }
    scheduleDistantTone(engine);
  }, delay);
}

function holdGain(parameter: AudioParam, time: number) {
  parameter.cancelAndHoldAtTime(time);
}

function setAmbientSeason(engine: AmbientEngine, season: string, immediate = false) {
  const profile = soundProfiles[season] ?? soundProfiles.Spring;
  const now = engine.context.currentTime;
  engine.season = season;
  [engine.wind, engine.water, engine.fauna, engine.tone].forEach((channel, index) => {
    holdGain(channel.gain, now);
    if (immediate) channel.gain.setValueAtTime(profile[index], now);
    else channel.gain.linearRampToValueAtTime(profile[index], now + 3.2);
  });
}
function Artwork({
  work,
  className = '',
  priority = false,
  sizes = '(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 20vw',
}: {
  work: Work;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const size = imageSizes[work.web_image_filename as keyof typeof imageSizes];
  return (
    // Preserve the supplied JPEG bytes; native lazy loading and original dimensions are intentional.
    // oxlint-disable-next-line next/no-img-element
    <img
      className={className}
      src={'/artworks/' + work.web_image_filename}
      width={size.width}
      height={size.height}
      alt={work.image_alt_zh + ' / ' + work.image_alt_en}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      sizes={sizes}
    />
  );
}
function Hero({ soundMode, onToggleSound }: { soundMode: SoundMode; onToggleSound: () => void }) {
  const heroWork = works.find((work) => work.season.includes('Spring'))!;
  return (
    <>
      <header className="masthead">
        <a href="#top" aria-label="Hiroshige home">
          Hiroshige
        </a>
        <nav aria-label="Exhibition">
          <a href="#seasons">Seasons / 四时</a>
          <a href="#gallery">Works / 作品</a>
        </nav>
        <button
          className="sound-toggle"
          type="button"
          aria-pressed={soundMode === 'on'}
          aria-label={`${soundMode === 'on' ? 'Mute' : soundMode === 'paused' ? 'Resume' : 'Enable'} ambient sound / ${soundMode === 'on' ? '关闭' : '开启'}环境声`}
          onClick={onToggleSound}
        >
          <span className="sound-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>SOUND / 声音</span>
          <b>{soundMode === 'on' ? 'ON' : soundMode === 'paused' ? 'RESUME' : 'OFF'}</b>
        </button>
        <span>UTAGAWA · 1797–1858</span>
      </header>
      <section className="hero" aria-labelledby="exhibition-title">
        <div className="hero-copy" data-reveal="">
          <p className="eyebrow">AN EXHIBITION IN FOUR SEASONS · 花鸟画展</p>
          <h1 id="exhibition-title">Hiroshige</h1>
          <h2>
            Birds, Flowers,
            <br />
            <i>Seasons.</i>
          </h2>
          <p className="chinese" lang="zh">
            歌川广重：花鸟与四时
          </p>
          <p className="intro">
            A flower, a bird, a passing season.
            <br />
            <span lang="zh">一枝花，一只鸟，一个季节。</span>
          </p>
          <a className="enter" href="#seasons">
            Enter the Exhibition <span lang="zh">进入展览 <span className="entrance-arrow" aria-hidden="true">↘</span></span>
          </a>
        </div>
        <figure className="hero-art" data-reveal="">
          <Artwork work={heroWork} priority sizes="(max-width: 700px) 72vw, 340px" />
          <figcaption>
            A MOMENT IN SPRING <span lang="zh">{heroWork.title_zh}</span>
          </figcaption>
        </figure>
        <div className="hero-bottom">
          <span>114 PRINTS · CHŪ-TANZAKU</span>
          <span>SCROLL TO WANDER ↓</span>
          <span lang="zh">花鸟之间，四时流转。</span>
        </div>
      </section>
    </>
  );
}
export default function Exhibition() {
  const [season, setSeason] = useState('All');
  const [catVisible, setCatVisible] = useState(false);
  const [theme, setTheme] = useState('All');
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIds, setDetailIds] = useState<number[]>([]);
  const [journeySeason, setJourneySeason] = useState('Spring');
  const [soundMode, setSoundMode] = useState<SoundMode>('off');
  const [filterPending, setFilterPending] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const ambientEngine = useRef<AmbientEngine | null>(null);
  const soundSuspendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterRequest = useRef({ season: 'All', theme: 'All' });
  const changeFilter = (nextSeason: string, nextTheme: string) => {
    filterRequest.current = { season: nextSeason, theme: nextTheme };
    if (filterTimer.current) clearTimeout(filterTimer.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSeason(nextSeason); setTheme(nextTheme); setFilterPending(false);
      return;
    }
    setFilterPending(true);
    const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-filter')) || 200;
    filterTimer.current = setTimeout(() => {
      setSeason(nextSeason); setTheme(nextTheme); setFilterPending(false);
    }, duration);
  };
  useEffect(() => () => { if (filterTimer.current) clearTimeout(filterTimer.current); }, []);
  useEffect(() => {
    const preferenceTimer = setTimeout(() => {
      if (sessionStorage.getItem('hiroshige-ambient-sound') === 'on') setSoundMode('paused');
    }, 0);
    return () => {
      clearTimeout(preferenceTimer);
      if (soundSuspendTimer.current) clearTimeout(soundSuspendTimer.current);
      if (ambientEngine.current?.eventTimer) clearTimeout(ambientEngine.current.eventTimer);
      void ambientEngine.current?.context.close();
    };
  }, []);
  useEffect(() => {
    if (ambientEngine.current) setAmbientSeason(ambientEngine.current, journeySeason);
  }, [journeySeason]);

  const toggleSound = async () => {
    if (soundMode === 'on') {
      const engine = ambientEngine.current;
      if (engine) {
        const now = engine.context.currentTime;
        holdGain(engine.master.gain, now);
        engine.master.gain.linearRampToValueAtTime(0, now + 0.7);
        soundSuspendTimer.current = setTimeout(() => engine.context.suspend(), 760);
      }
      sessionStorage.setItem('hiroshige-ambient-sound', 'off');
      setSoundMode('off');
      return;
    }
    if (soundSuspendTimer.current) clearTimeout(soundSuspendTimer.current);
    const engine = ambientEngine.current ?? createAmbientEngine();
    ambientEngine.current = engine;
    setAmbientSeason(engine, journeySeason, true);
    await engine.context.resume();
    const now = engine.context.currentTime;
    holdGain(engine.master.gain, now);
    engine.master.gain.linearRampToValueAtTime(0.012, now + 1.4);
    sessionStorage.setItem('hiroshige-ambient-sound', 'on');
    setSoundMode('on');
  };

  // One observer per wall refresh; revealed works are unobserved immediately.
  // Content stays visible without JavaScript or IntersectionObserver.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const setup = () => {
      observer?.disconnect();
      if (media.matches || !('IntersectionObserver' in window)) {
        targets.forEach(el => { el.dataset.reveal = 'visible'; });
        return;
      }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = 'visible';
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px 24px 0px' });
      targets.forEach(el => {
        if (el.dataset.reveal === 'visible') return;
        el.dataset.reveal = 'pending';
        observer?.observe(el);
      });
    };
    setup(); media.addEventListener('change', setup);
    return () => { observer?.disconnect(); media.removeEventListener('change', setup); };
  }, [season, theme]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setJourneySeason((entry.target as HTMLElement).dataset.season!);
      });
    }, { rootMargin: '-30% 0px -45% 0px', threshold: 0 });
    document.querySelectorAll('[data-season]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  const opener = useRef<HTMLButtonElement | null>(null);
  const imageArea = useRef<HTMLDivElement | null>(null);
  const openDetail = (id: number, ids: number[], trigger?: HTMLButtonElement) => {
    if (trigger) opener.current = trigger;
    setDetailIds(ids);
    setSelected(id);
    setZoom(false);
    setShareStatus('');
    setDetailOpen(true);
    history.replaceState(null, '', `#artwork-${String(id).padStart(3, '0')}`);
  };
  useEffect(() => {
    const openFromHash = () => {
      const match = location.hash.match(/^#artwork-(\d{1,3})$/);
      const id = match ? Number(match[1]) : 0;
      if (works.some(work => work.id === id)) openDetail(id, works.map(work => work.id));
    };
    const initialTimer = setTimeout(openFromHash, 0);
    window.addEventListener('hashchange', openFromHash);
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('hashchange', openFromHash);
    };
  }, []);
  const filtered = useMemo(
    () =>
      works.filter(
        (w) =>
          (season === 'All' || w.season.includes(season)) &&
          (theme === 'All' || w.subjects.includes(theme)),
      ),
    [season, theme],
  );
  const active =
    selected === null ? null : works.find((w) => w.id === selected)!;
  const detailWorks = detailIds.length ? detailIds.map(id => works.find(w => w.id === id)!) : works;
  const index = detailWorks.findIndex((w) => w.id === selected);
  const changeWork = (direction: number) => {
    if (!detailWorks.length) return;
    const nextId = detailWorks[(index + direction + detailWorks.length) % detailWorks.length].id;
    setSelected(nextId);
    setShareStatus('');
    history.replaceState(null, '', `#artwork-${String(nextId).padStart(3, '0')}`);
    setZoom(false);
    imageArea.current?.scrollTo(0, 0);
  };
  const shareArtwork = async () => {
    if (!active) return;
    const url = `${location.origin}${location.pathname}#artwork-${String(active.id).padStart(3, '0')}`;
    const shareData = { title: `${active.title_en} / ${active.title_zh} — Hiroshige`, text: active.blurb_en, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Shared / 已分享');
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus('Link copied / 链接已复制');
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') setShareStatus('Copy the address above / 请复制地址栏链接');
    }
  };
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: object,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: 'filter_artworks',
          title: 'Explore Hiroshige’s prints',
          description:
            'Filter the visible gallery by season and theme. All clears that filter.',
          inputSchema: {
            type: 'object',
            properties: {
              season: {
                type: 'string',
                enum: ['All', ...seasons.map((s) => s.name)],
              },
              theme: { type: 'string', enum: themes },
            },
            required: ['season', 'theme'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input: unknown) => {
            const value = input as { season: string; theme: string };
            if (
              !value ||
              !['All', ...seasons.map((s) => s.name)].includes(value.season) ||
              !themes.includes(value.theme)
            )
              throw new Error('Choose a supported season and theme.');
            flushSync(() => {
              setDetailOpen(false);
              if (filterTimer.current) clearTimeout(filterTimer.current);
              setFilterPending(false);
              filterRequest.current = { season: value.season, theme: value.theme };
              setSeason(value.season);
              setTheme(value.theme);
            });
            document.getElementById('gallery')?.scrollIntoView();
            return {
              season: value.season,
              theme: value.theme,
              count: works.filter(
                (w) =>
                  (value.season === 'All' || w.season.includes(value.season)) &&
                  (value.theme === 'All' || w.subjects.includes(value.theme)),
              ).length,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  return (
    <main id="top">
      <Hero soundMode={soundMode} onToggleSound={toggleSound} />
      <section
        id="seasons"
        className="seasons-section"
        aria-labelledby="seasons-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / THE SEASONAL JOURNEY</p>
            <h2 id="seasons-title">
              A year, <i>in passing.</i>
            </h2>
            <p className="section-zh" lang="zh">
              与季节同行
            </p>
          </div>
          <p className="section-intro season-margin-note">
            The seasons turn, but beauty endures.
            <br />
            <span lang="zh">四季流转，花鸟常在。</span>
          </p>
        </div>
        <div className="season-grid">
          {seasons.map((s, i) => (
            <button
              key={s.name}
              className="season-entry"
              aria-label={'Begin ' + s.name + ' / ' + s.zh}
              onClick={() => {
                document.getElementById('journey-' + s.name.toLowerCase())?.scrollIntoView();
              }}
            >
              <div className="season-art">
                <Artwork work={works.find((w) => w.id === s.id)!} />
                <span className="season-caption">
                  {works.find((w) => w.id === s.id)!.title_zh}
                </span>
              </div>
              <div className="season-title">
                <span>
                  <span lang="zh">{s.zh}</span> {s.name}
                </span>
                <span aria-hidden="true">↗</span>
              </div>
              <p>{s.line}</p>
              <p lang="zh">{s.poem}</p>
              <span className="season-number">0{i + 1}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="year-journey" aria-label="Through the year / 四时之旅">
        <nav className="year-cue" aria-label="Seasonal journey progress">
          {seasons.map(s => <a key={s.name} href={'#journey-' + s.name.toLowerCase()} aria-current={journeySeason === s.name ? 'step' : undefined}>{s.name}<span lang="zh">{s.zh}</span></a>)}
        </nav>
        {seasons.map((s, i) => {
          const representative = works.find(w => w.id === s.id)!;
          return <section key={s.name} id={'journey-' + s.name.toLowerCase()} data-season={s.name} className={'season-chapter chapter-' + s.name.toLowerCase()} aria-labelledby={'chapter-title-' + s.name}>
            <div className="chapter-copy" data-reveal="">
              <p className="eyebrow">0{i + 1} / A YEAR IN PASSING</p>
              <h2 id={'chapter-title-' + s.name}>{s.name} <span lang="zh">{s.zh}</span></h2>
              <p className="chapter-line">{s.line}</p>
              <p className="chapter-poem" lang="zh">{s.poem}</p>
              <button className="text-link chapter-link" onClick={() => { changeFilter(s.name, 'All'); document.getElementById('gallery')?.scrollIntoView(); }}>Explore {s.name} / {s.zh}之画册 <span aria-hidden="true">↘</span></button>
            </div>
            <figure className="chapter-art" data-reveal="">
              <button aria-label={'Study ' + representative.title_en + ' / ' + representative.title_zh} onClick={event => openDetail(representative.id, seasons.map(season => season.id), event.currentTarget)}>
                <Artwork work={representative} />
              </button>
              <figcaption><span lang="zh">{representative.title_zh}</span><span>{representative.title_en}</span></figcaption>
            </figure>
            <span className="chapter-rule" aria-hidden="true" />
          </section>;
        })}
      </div>
      <section className="page-turn" aria-labelledby="fragments-title">
        <span className="page-turn-rule" aria-hidden="true" />
        <div><p className="eyebrow">INTERLUDE / 自然片段</p>
          <h2 id="fragments-title">Nature, observed in fragments.</h2>
          <p lang="zh">花、鸟、月、雨，被截取成一瞬。</p>
        </div>
      </section>
      <section
        id="gallery"
        className="gallery-section"
        aria-labelledby="gallery-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / THE COLLECTION</p>
            <h2 id="gallery-title">
              {season === 'All' ? 'All Works' : season}
              <span className="heading-count" aria-hidden="true">
                {String(filtered.length).padStart(2, '0')}
              </span>
            </h2>
            <p className="section-zh" lang="zh">
              {season === 'All'
                ? '所有作品'
                : seasons.find((s) => s.name === season)?.zh + '之画册'}
            </p>
          </div>
          <p className="section-intro">
            Chū-tanzaku: a narrow, vertical print format.
            <br />
            <span lang="zh">中短册判：以细长竖幅，容纳自然的一瞬。</span>
          </p>
        </div>
        <div className="filters">
          <fieldset
            className="season-filter"
            aria-label="Filter by season"
          >
            <span className="filter-label">Seasons / 四时</span>
            {['All', ...seasons.map((s) => s.name)].map((s) => (
              <button
                key={s}
                aria-pressed={season === s}
                onClick={() => changeFilter(s, filterRequest.current.theme)}
              >
                {s === 'All' ? 'All seasons / 四时' : s}
              </button>
            ))}
          </fieldset>
          <fieldset
            className="theme-filter"
            aria-label="Filter by theme"
          >
            {themes.map((t, i) => (
              <button
                key={t}
                aria-pressed={theme === t}
                onClick={() => changeFilter(filterRequest.current.season, t)}
              >
                {t}
                <span lang="zh">{themeZh[i]}</span>
              </button>
            ))}
          </fieldset>
        </div>
        <div className="gallery-status">
          <p aria-live="polite" aria-atomic="true">
            {filtered.length} works / 幅作品
          </p>
          <span>LOOK CLOSER · 点击细赏</span>
        </div>
        <div className={'gallery-wall' + (filterPending ? ' is-filtering' : '')} aria-busy={filterPending}>
        {filtered.length ? (
          <div className="art-grid">
            {filtered.map((w) => (
              <button
                key={w.id}
                className="art-card" data-reveal=""
                aria-label={w.title_zh + ' / ' + w.title_en + ' — ' + w.id}
                onClick={(event) => {
                  openDetail(w.id, filtered.map(work => work.id), event.currentTarget);
                }}
              >
                <div className="art-card-image">
                  <Artwork work={w} />
                </div>
                <div className="art-card-caption">
                  <h3 lang="zh">{w.title_zh}</h3>
                  <p>{w.title_en}</p>
                  {w.date && <small>{w.date}</small>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty className="empty-gallery">
            <EmptyHeader>
              <EmptyTitle>No works in this selection.</EmptyTitle>
              <EmptyDescription>
                这一季，暂未收录此主题的作品。
              </EmptyDescription>
            </EmptyHeader>
            <button
              className="text-link"
              onClick={() => {
                changeFilter('All', 'All');
              }}
            >
              View all 114 works / 查看全部作品 →
            </button>
          </Empty>
        )}
        </div>
      </section>
      <footer>
        <div className="footer-poem">
          <p className="eyebrow closing-label">CODA / 四时之外</p>
          <p>
            More than a gallery —<br />
            <i>a journey through Hiroshige’s year.</i>
          </p>
          <p lang="zh">不只是看画，而是穿过广重的一整年。</p>
        </div>
        <div
          className="collection-actions"
          aria-label="Exhibition collection"
        >
          <p className="eyebrow">THE COLLECTION, TO KEEP · 珍藏展览</p>
          {/* Static export uses native links to avoid client prefetch overhead. */}
          {/* oxlint-disable-next-line next/no-html-link-for-pages */}
          <a href="/collection.html">Download Album / 下载图册 ↗</a>
          {/* oxlint-disable-next-line next/no-html-link-for-pages */}
          <a href="/collection.html#wallpapers">Wallpaper / 壁纸 ↗</a>
          <button type="button" onClick={async () => {
            const data = { title: 'Hiroshige — Birds, Flowers, Seasons', text: 'Explore 114 prints through Hiroshige’s year.', url: location.href.split('#')[0] };
            if (navigator.share) await navigator.share(data).catch(() => {});
            else await navigator.clipboard.writeText(data.url).catch(() => {});
          }}>Share / 分享 ↗</button>
        </div>
        <div className="footer-bottom">
          <div className="colophon-visitor">
            <button className="visitor-trigger" aria-label={catVisible ? 'Hide the quiet visitor / 隐藏小访客' : 'Reveal a quiet visitor / 一位小访客'} aria-expanded={catVisible} onClick={() => setCatVisible(!catVisible)}>HIROSHIGE · BIRDS, FLOWERS, SEASONS</button>
            {catVisible && <span className="cat-easter-egg"><span className="sr-only">A resting cat / 小憩的猫</span>
              <svg viewBox="0 0 70 40" width="56" height="32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 29C11 30 9 20 16 16L15 7L23 12L31 7L32 17C39 17 49 19 51 28C59 30 64 25 59 22C55 20 54 24 57 25M19 29C27 34 42 34 51 28M18 20L21 21M26 21L29 20M22 25L25 25"/></svg>
            </span>}
          </div>
          <p>
            Catalogue:{' '}
            <a href={catalog.source} target="_blank" rel="noreferrer">
              Hiroshige.org.uk ↗
            </a>
            <br />
            <span lang="zh">季节、主题与赏析为本展策展编辑内容。</span>
          </p>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
      <Dialog
        open={detailOpen}
        onOpenChangeComplete={(open) => { if (!open) { setSelected(null); setZoom(false); } }}
        onOpenChange={(open) => {
          if (!open) {
            setDetailOpen(false);
            setShareStatus('');
            if (location.hash.startsWith('#artwork-')) history.replaceState(null, '', '#gallery');
          }
        }}
      >
        {active && (
          <DialogContent
            className={'artwork-dialog' + (zoom ? ' study-mode' : '')}
            showCloseButton={false}
            finalFocus={() => opener.current}
            onKeyDown={(event) => {
              if (!zoom && event.key === 'ArrowRight') {
                event.preventDefault();
                changeWork(1);
              }
              if (!zoom && event.key === 'ArrowLeft') {
                event.preventDefault();
                changeWork(-1);
              }
            }}
          >
            <div className="detail-toolbar">
              <span>HIROSHIGE / {String(active.id).padStart(3, '0')}</span>
              <button className="study-toggle" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? 'Full print / 查看全画' : 'Detail study / 细赏'}</button>
              <DialogClose className="close-detail">
                Close / 关闭 <span aria-hidden="true">×</span>
              </DialogClose>
            </div>
            <div className="detail-body">
              <div
                className={'detail-image-area' + (zoom ? ' is-zoomed' : '')}
                ref={imageArea}
              >
                <button
                  className="zoom-image"
                  onClick={() => setZoom(!zoom)}
                  aria-label={zoom ? 'Zoom out / 缩小' : 'Zoom in / 放大'}
                  aria-pressed={zoom}
                >
                  <span className="detail-print-reveal" key={active.id}><Artwork work={active} priority /></span>
                </button>
              </div>
              <div className="detail-copy" key={active.id}>
                <p className="eyebrow">UTAGAWA HIROSHIGE · 歌川广重</p>
                <DialogTitle className="detail-title">
                  <span lang="zh">{active.title_zh}</span>
                  <span>{active.title_en}</span>
                </DialogTitle>
                {active.title_ja && (
                  <p className="japanese" lang="ja">
                    {active.title_ja}
                  </p>
                )}
                <dl className="historical">
                  {active.date && (
                    <div>
                      <dt>Date / 年代</dt>
                      <dd>{active.date}</dd>
                    </div>
                  )}
                  {active.publisher && (
                    <div>
                      <dt>Publisher / 出版</dt>
                      <dd>{active.publisher}</dd>
                    </div>
                  )}
                </dl>
                {(active.seasonal_note_zh || active.seasonal_note_en) && (
                  <aside className="seasonal-note" aria-labelledby="seasonal-note-title">
                    <div className="seasonal-note-heading" id="seasonal-note-title">
                      <span>SEASONAL NOTE</span>
                      <span lang="zh">季节注</span>
                    </div>
                    {active.seasonal_note_zh && <p lang="zh">{active.seasonal_note_zh}</p>}
                    {active.seasonal_note_en && <p>{active.seasonal_note_en}</p>}
                  </aside>
                )}
                <DialogDescription className="detail-blurb" render={<div />}>
                  <p lang="zh">{active.blurb_zh}</p>
                  <p>{active.blurb_en}</p>
                </DialogDescription>
                <dl className="editorial">
                  <div>
                    <dt>Season / 季节</dt>
                    <dd>{active.season.join(' · ')}</dd>
                  </div>
                  <div>
                    <dt>Subjects / 主题</dt>
                    <dd>{active.subjects.join(' · ')}</dd>
                  </div>
                </dl>
                <p className="editorial-note">
                  Curatorial interpretation / 策展编辑分类与赏析
                </p>
                <button
                  className="text-link zoom-control"
                  tabIndex={zoom ? -1 : 0}
                  aria-pressed={zoom}
                  onClick={() => setZoom(!zoom)}
                >
                  {zoom
                    ? '− View full artwork / 查看全画'
                    : '+ Look closer / 放大细赏'}
                </button>
                <div className="detail-placeholders">
                  <a href={'/artworks/' + active.web_image_filename} download>Download print / 下载原图</a>
                  {/* oxlint-disable-next-line next/no-html-link-for-pages */}
                  <a href="/collection.html#wallpapers">Wallpaper / 壁纸</a>
                  <button type="button" onClick={shareArtwork}>Share / 分享</button>
                  <span aria-live="polite">{shareStatus || `Permanent link / 永久链接 · #artwork-${String(active.id).padStart(3, '0')}`}</span>
                </div>
              </div>
            </div>
            <div className="detail-navigation">
              <button onClick={() => changeWork(-1)}>
                ← Previous / 上一幅
              </button>
              <span aria-live="polite">
                {index + 1} / {detailWorks.length}
              </span>
              <button onClick={() => changeWork(1)}>Next / 下一幅 →</button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}


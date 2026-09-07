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
const works = catalog.works;
const themes = ['All', 'Birds', 'Flowers', 'Moon', 'Rain', 'Snow', 'Animals'];
const themeZh = ['全部', '鸟', '花', '月', '雨', '雪', '动物'];
const seasons = [
  {
    name: 'Spring',
    zh: '春',
    id: 103,
    line: 'A bird among opening blossoms.',
    poem: '花初绽，鸟声近。',
  },
  {
    name: 'Summer',
    zh: '夏',
    id: 48,
    line: 'A wing above the quiet water.',
    poem: '水无声，翠羽轻。',
  },
  {
    name: 'Autumn',
    zh: '秋',
    id: 36,
    line: 'Wild geese across the evening moon.',
    poem: '雁影过，晚月明。',
  },
  {
    name: 'Winter',
    zh: '冬',
    id: 79,
    line: 'Soft snow along a pine branch.',
    poem: '雪轻落，松枝静。',
  },
];
function Artwork({
  work,
  className = '',
  priority = false,
}: {
  work: Work;
  className?: string;
  priority?: boolean;
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
    />
  );
}
function Hero() {
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
        <span>UTAGAWA · 1797–1858</span>
      </header>
      <section className="hero" aria-labelledby="exhibition-title">
        <div className="hero-copy">
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
            Enter the Exhibition <span lang="zh">进入展览 ↘</span>
          </a>
        </div>
        <figure className="hero-art">
          <Artwork work={heroWork} priority />
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
  const [theme, setTheme] = useState('All');
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const imageArea = useRef<HTMLDivElement | null>(null);
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
  const index = filtered.findIndex((w) => w.id === selected);
  const changeWork = (direction: number) => {
    if (!filtered.length) return;
    setSelected(
      filtered[(index + direction + filtered.length) % filtered.length].id,
    );
    setZoom(false);
    imageArea.current?.scrollTo(0, 0);
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
              setSelected(null);
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
      <Hero />
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
              aria-label={s.name + ' / ' + s.zh}
              aria-pressed={season === s.name}
              onClick={() => {
                setSeason(s.name);
                setTheme('All');
                document.getElementById('gallery')?.scrollIntoView();
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
      <section
        id="gallery"
        className="gallery-section"
        aria-labelledby="gallery-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / THE COLLECTION</p>
            <h2 id="gallery-title">
              {season === 'All' ? 'All works' : season}
              <span className="heading-count" aria-hidden="true">
                {String(filtered.length).padStart(2, '0')}
              </span>
            </h2>
            <p className="section-zh" lang="zh">
              {season === 'All'
                ? '花鸟万象，一幅一观'
                : seasons.find((s) => s.name === season)?.zh + '之画册'}
            </p>
          </div>
          <p className="section-intro">
            An intimate world, held in a narrow frame.
            <br />
            <span lang="zh">方寸之间，自有天地。</span>
          </p>
        </div>
        <div className="filters">
          <fieldset
            className="season-filter"
            aria-label="Filter by season"
          >
            <span className="filter-label">SEASON / 四时</span>
            {['All', ...seasons.map((s) => s.name)].map((s) => (
              <button
                key={s}
                aria-pressed={season === s}
                onClick={() => setSeason(s)}
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
                onClick={() => setTheme(t)}
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
        {filtered.length ? (
          <div className="art-grid">
            {filtered.map((w) => (
              <button
                key={w.id}
                className="art-card"
                aria-label={w.title_zh + ' / ' + w.title_en + ' — ' + w.id}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setSelected(w.id);
                  setZoom(false);
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
                setSeason('All');
                setTheme('All');
              }}
            >
              View all 114 works / 查看全部作品 →
            </button>
          </Empty>
        )}
      </section>
      <footer>
        <div className="footer-poem">
          <p>
            More than a gallery —<br />
            <i>a journey through Hiroshige’s year.</i>
          </p>
          <p lang="zh">不只是看画，而是穿过广重的一整年。</p>
        </div>
        <div
          className="collection-actions"
          aria-label="Future collection features"
        >
          <p className="eyebrow">THE COLLECTION, TO KEEP · 即将开放</p>
          <button disabled>Download Album / 下载图册 ↗</button>
          <button disabled>Wallpaper / 壁纸 ↗</button>
          <button disabled>Share / 分享 ↗</button>
        </div>
        <div className="footer-bottom">
          <span>HIROSHIGE · BIRDS, FLOWERS, SEASONS</span>
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
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setZoom(false);
          }
        }}
      >
        {active && (
          <DialogContent
            className="artwork-dialog"
            showCloseButton={false}
            finalFocus={() => opener.current}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                changeWork(1);
              }
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                changeWork(-1);
              }
            }}
          >
            <div className="detail-toolbar">
              <span>HIROSHIGE / {String(active.id).padStart(3, '0')}</span>
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
                  <Artwork work={active} priority />
                </button>
              </div>
              <div className="detail-copy">
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
                  aria-pressed={zoom}
                  onClick={() => setZoom(!zoom)}
                >
                  {zoom
                    ? '− View full artwork / 查看全画'
                    : '+ Look closer / 放大细赏'}
                </button>
                <div className="detail-placeholders">
                  <button disabled>Wallpaper / 壁纸</button>
                  <button disabled>Share / 分享</button>
                  <span>Coming soon / 即将开放</span>
                </div>
              </div>
            </div>
            <div className="detail-navigation">
              <button onClick={() => changeWork(-1)}>
                ← Previous / 上一幅
              </button>
              <span aria-live="polite">
                {index + 1} / {filtered.length}
              </span>
              <button onClick={() => changeWork(1)}>Next / 下一幅 →</button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}

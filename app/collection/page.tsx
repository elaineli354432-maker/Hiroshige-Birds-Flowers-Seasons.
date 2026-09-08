import type { Metadata } from 'next';
import catalog from '../catalog.json';

export const metadata: Metadata = {
  title: 'Collection Downloads / 展览珍藏',
  description: 'Download the bilingual Hiroshige exhibition catalogue and full-frame wallpapers.',
};

const wallpapers = [
  { id: 103, slug: 'spring', season: 'Spring / 春' },
  { id: 48, slug: 'summer', season: 'Summer / 夏' },
  { id: 36, slug: 'autumn', season: 'Autumn / 秋' },
  { id: 79, slug: 'winter', season: 'Winter / 冬' },
].map(item => ({ ...item, work: catalog.works.find(work => work.id === item.id)! }));

export default function CollectionPage() {
  return <main className="collection-page">
    <header className="collection-header">
      {/* Native links keep this static download page independent of RSC prefetching. */}
      {/* oxlint-disable-next-line next/no-html-link-for-pages */}
      <a href="/">Hiroshige</a>
      {/* oxlint-disable-next-line next/no-html-link-for-pages */}
      <a href="/#gallery">Return to exhibition / 返回展览</a>
    </header>
    <section className="collection-intro">
      <p className="eyebrow">THE COLLECTION, TO KEEP · 展览珍藏</p>
      <h1>Carry a quiet<br /><i>season with you.</i></h1>
      <p lang="zh">将广重的一季，安静地留在身边。</p>
      <p>Original prints remain complete and unaltered. Wallpaper editions place each work within a warm paper field without cropping.</p>
    </section>
    <section className="catalogue-download" aria-labelledby="catalogue-title">
      <div>
        <p className="eyebrow">01 / DIGITAL CATALOGUE</p>
        <h2 id="catalogue-title">114 works, bilingual.</h2>
        <p lang="zh">完整收录作品题名、年代、出版者、季节、主题与双语赏析。</p>
      </div>
      <a className="download-link" href="/downloads/hiroshige-exhibition-catalog.json" download>
        Download catalogue data <span>JSON · 下载 ↘</span>
      </a>
    </section>
    <section id="wallpapers" className="wallpaper-section" aria-labelledby="wallpaper-title">
      <div className="wallpaper-heading">
        <p className="eyebrow">02 / WALLPAPER EDITIONS</p>
        <h2 id="wallpaper-title">Four seasons,<br /><i>held in full.</i></h2>
        <p lang="zh">四时壁纸保留原作全幅，以纸色留白适配屏幕。</p>
      </div>
      <div className="wallpaper-list">
        {wallpapers.map(({ work, slug, season }) => <article key={work.id} className="wallpaper-item">
          {/* Original source dimensions vary; the contained preview never crops the supplied JPEG. */}
          {/* oxlint-disable-next-line next/no-img-element */}
          <img src={'/artworks/' + work.web_image_filename} alt={work.image_alt_zh + ' / ' + work.image_alt_en} loading="lazy" />
          <div>
            <p className="eyebrow">{season}</p>
            <h3><span lang="zh">{work.title_zh}</span>{work.title_en}</h3>
            <div className="wallpaper-links">
              <a href={`/wallpapers/hiroshige-${slug}-desktop.jpg`} download>Desktop · 2560 × 1440 ↘</a>
              <a href={`/wallpapers/hiroshige-${slug}-mobile.jpg`} download>Mobile · 1440 × 2560 ↘</a>
            </div>
          </div>
        </article>)}
      </div>
    </section>
    <footer className="collection-colophon">
      <span>HIROSHIGE · BIRDS, FLOWERS, SEASONS</span>
      {/* oxlint-disable-next-line next/no-html-link-for-pages */}
      <a href="/">Back to exhibition ↑</a>
    </footer>
  </main>;
}

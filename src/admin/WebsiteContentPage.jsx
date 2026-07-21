import { useState } from 'react';
import { ArrowUpRight, ChevronDown, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { defaultHomepageStats, heroSlides as defaultHeroSlides, normalizeHeroSlides } from '../data/content';
import { isSupabaseConfigured, uploadMediaFile } from '../lib/supabase';

const normalizeSlides = (slides) => {
  const normalized = normalizeHeroSlides(slides);
  const source = normalized.length ? normalized : normalizeHeroSlides(defaultHeroSlides);
  return source.map((slide, index) => ({
    ...slide,
    id: slide.id || `hero-${index + 1}`,
    order: slide.order || index + 1,
    active: slide.active !== false,
  }));
};

const normalizeStats = (stats) => {
  const source = Array.isArray(stats) && stats.length ? stats : defaultHomepageStats;
  return source.map((item, index) => ({
    id: item.id || `stat-${index + 1}`,
    value: String(item.value ?? ''),
    label: String(item.label ?? ''),
  }));
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function WebsiteContentPage({ state, commit, notify }) {
  const homepage = state.homepage || {};
  const [uploadingHero, setUploadingHero] = useState('');
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [draft, setDraft] = useState(() => ({
    ...homepage,
    heroSlides: normalizeSlides(homepage.heroSlides),
    stats: normalizeStats(homepage.stats),
    signatureLabel: homepage.signatureLabel || 'Naseeb Signature Dishes',
  }));

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateHeroSlide = (id, changes) => setDraft((current) => ({
    ...current,
    heroSlides: current.heroSlides.map((slide) => slide.id === id ? { ...slide, ...changes } : slide),
  }));
  const updateStat = (id, key, value) => setDraft((current) => ({
    ...current,
    stats: current.stats.map((item) => item.id === id ? { ...item, [key]: value } : item),
  }));
  const addHeroSlide = () => setDraft((current) => ({
    ...current,
    heroSlides: [...current.heroSlides, {
      id: `hero-${Date.now()}`,
      heading: 'New hero slide',
      text: 'Add a short message for this homepage slide.',
      desktopImage: '',
      mobileImage: '',
      imageAlt: '',
      primaryButtonLabel: 'View Menu',
      primaryButtonUrl: '/menu',
      secondaryButtonLabel: 'Order Now',
      secondaryButtonUrl: homepage.secondaryButtonUrl || state.settings?.orderUrl || '',
      active: true,
      order: current.heroSlides.length + 1,
    }],
  }));
  const removeHeroSlide = (id) => setDraft((current) => ({
    ...current,
    heroSlides: current.heroSlides.filter((slide) => slide.id !== id).map((slide, index) => ({ ...slide, order: index + 1 })),
  }));
  const moveHeroSlide = (id, direction) => setDraft((current) => {
    const index = current.heroSlides.findIndex((slide) => slide.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= current.heroSlides.length) return current;
    const slides = [...current.heroSlides];
    [slides[index], slides[nextIndex]] = [slides[nextIndex], slides[index]];
    return { ...current, heroSlides: slides.map((slide, order) => ({ ...slide, order: order + 1 })) };
  });
  const uploadHeroImage = async (event, slideId, field) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      notify('Choose a PNG, JPG, WebP, or AVIF image up to 5 MB.');
      input.value = '';
      return;
    }
    const uploadKey = `${slideId}:${field}`;
    setUploadingHero(uploadKey);
    try {
      const uploaded = isSupabaseConfigured ? await uploadMediaFile(file) : { url: await fileToDataUrl(file), path: '' };
      if (uploaded.error) throw uploaded.error;
      updateHeroSlide(slideId, { [field]: uploaded.url, [`${field}StoragePath`]: uploaded.path || '' });
      notify(isSupabaseConfigured ? 'Hero image uploaded to Supabase Storage.' : 'Hero image added to the local preview.');
    } catch (error) {
      notify(`Hero image upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingHero('');
      input.value = '';
    }
  };
  const uploadAboutImage = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      notify('Choose a PNG, JPG, WebP, or AVIF image up to 5 MB.');
      input.value = '';
      return;
    }
    setUploadingAbout(true);
    try {
      const uploaded = isSupabaseConfigured ? await uploadMediaFile(file) : { url: await fileToDataUrl(file), path: '' };
      if (uploaded.error) throw uploaded.error;
      setDraft((current) => ({ ...current, aboutImage: uploaded.url, aboutImageStoragePath: uploaded.path || '' }));
      notify(isSupabaseConfigured ? 'About image uploaded to Supabase Storage.' : 'About image added to the local preview.');
    } catch (error) {
      notify(`About image upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingAbout(false);
      input.value = '';
    }
  };
  const saveHomepage = () => {
    const slides = normalizeSlides(draft.heroSlides).map((slide, index) => ({ ...slide, order: index + 1 }));
    if (!slides.some((slide) => slide.active !== false && slide.desktopImage)) {
      notify('Keep at least one active hero slide with a desktop image.');
      return;
    }
    commit({ homepage: { ...draft, stats: normalizeStats(draft.stats), heroSlides: slides } });
    notify('Homepage content and hero slides published successfully.');
  };

  return <section className="admin-content-page"><div className="admin-editor-grid"><div className="admin-editor-main">
    <div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Hero section</span><h2>Homepage headline</h2></div><span className="admin-status positive"><i />Published</span></div><div className="admin-form admin-editor-form"><label>Main heading<input value={draft.heroHeading || ''} onChange={(event) => update('heroHeading', event.target.value)} /></label><label>Supporting text<textarea rows="4" value={draft.heroText || ''} onChange={(event) => update('heroText', event.target.value)} /></label><div className="admin-two-col"><label>Primary button label<input value={draft.primaryButtonLabel || ''} onChange={(event) => update('primaryButtonLabel', event.target.value)} /></label><label>Primary button URL<input value={draft.primaryButtonUrl || ''} onChange={(event) => update('primaryButtonUrl', event.target.value)} /></label></div><div className="admin-two-col"><label>Secondary button label<input value={draft.secondaryButtonLabel || ''} onChange={(event) => update('secondaryButtonLabel', event.target.value)} /></label><label>Secondary button URL<input value={draft.secondaryButtonUrl || ''} onChange={(event) => update('secondaryButtonUrl', event.target.value)} /></label></div></div></div>
    <div className="admin-panel admin-form-panel admin-hero-slides-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Hero carousel images</span><h2>Manage every homepage slide</h2><p>Upload separate desktop and mobile images. Changes publish when you save homepage content.</p></div><button className="admin-primary-button" type="button" onClick={addHeroSlide}><Plus size={15} />Add slide</button></div><div className="admin-hero-slide-list">{draft.heroSlides.map((slide, index) => <article className="admin-hero-slide-card" key={slide.id}><div className="admin-hero-slide-card-head"><div><span className="admin-panel-kicker">Slide {index + 1}</span><strong>{slide.heading || 'Untitled slide'}</strong></div><div className="admin-hero-slide-actions"><button className="admin-icon-button small" type="button" aria-label={`Move slide ${index + 1} up`} title="Move up" onClick={() => moveHeroSlide(slide.id, -1)} disabled={index === 0}><ChevronDown className="admin-chevron-up" size={15} /></button><button className="admin-icon-button small" type="button" aria-label={`Move slide ${index + 1} down`} title="Move down" onClick={() => moveHeroSlide(slide.id, 1)} disabled={index === draft.heroSlides.length - 1}><ChevronDown size={15} /></button><button className="admin-icon-button small admin-media-delete" type="button" aria-label={`Remove slide ${index + 1}`} title="Remove slide" onClick={() => removeHeroSlide(slide.id)} disabled={draft.heroSlides.length <= 1}><Trash2 size={15} /></button></div></div><div className="admin-hero-slide-layout"><div className="admin-hero-slide-media"><img src={slide.desktopImage || '/naseeb-chapati-logo.png'} alt={slide.imageAlt || ''} /><div className="admin-hero-upload-grid"><label className="admin-outline-button admin-hero-upload-button">Desktop image<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => uploadHeroImage(event, slide.id, 'desktopImage')} disabled={Boolean(uploadingHero)} /></label><label className="admin-outline-button admin-hero-upload-button">Mobile image<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => uploadHeroImage(event, slide.id, 'mobileImage')} disabled={Boolean(uploadingHero)} /></label></div>{uploadingHero && <small className="admin-hero-uploading">Uploading hero image…</small>}</div><div className="admin-form admin-editor-form"><label>Slide heading<input value={slide.heading || ''} onChange={(event) => updateHeroSlide(slide.id, { heading: event.target.value })} /></label><label>Slide text<textarea rows="3" value={slide.text || ''} onChange={(event) => updateHeroSlide(slide.id, { text: event.target.value })} /></label><label>Image alt text<input value={slide.imageAlt || ''} onChange={(event) => updateHeroSlide(slide.id, { imageAlt: event.target.value })} placeholder="Describe the food image" /></label><label>Desktop image URL<input value={slide.desktopImage || ''} onChange={(event) => updateHeroSlide(slide.id, { desktopImage: event.target.value })} placeholder="Upload an image or paste a URL" /></label><label>Mobile image URL<input value={slide.mobileImage || ''} onChange={(event) => updateHeroSlide(slide.id, { mobileImage: event.target.value })} placeholder="Optional mobile crop URL" /></label></div></div><label className="admin-switch-row admin-hero-active-row"><input type="checkbox" checked={slide.active !== false} onChange={(event) => updateHeroSlide(slide.id, { active: event.target.checked })} /><span className="admin-switch" /><span>{slide.active !== false ? 'Published on homepage' : 'Hidden from homepage'}</span></label></article>)}</div></div>
    <div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Trending menu</span><h2>Section controls</h2></div><span className="admin-status positive"><i />Published</span></div><div className="admin-form admin-editor-form"><div className="admin-two-col"><label>Section title<input value={draft.trendingTitle || ''} onChange={(event) => update('trendingTitle', event.target.value)} /></label><label>Autoplay speed (ms)<input type="number" value={draft.trendingSpeed || 4500} onChange={(event) => update('trendingSpeed', Number(event.target.value))} /></label></div><label>Section subtitle<textarea rows="3" value={draft.trendingSubtitle || ''} onChange={(event) => update('trendingSubtitle', event.target.value)} /></label><label className="admin-switch-row"><input type="checkbox" checked={draft.trendingAutoplay !== false} onChange={(event) => update('trendingAutoplay', event.target.checked)} /><span className="admin-switch" /><span>Enable autoplay</span></label><label className="admin-switch-row"><input type="checkbox" checked={draft.showPromotions !== false} onChange={(event) => update('showPromotions', event.target.checked)} /><span className="admin-switch" /><span>Show promotions section</span></label></div></div>
    <div className="admin-panel admin-form-panel admin-about-editor"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">About Naseeb</span><h2>Homepage story block</h2><p>Update the restaurant photo and the content shown in the homepage About section.</p></div><span className="admin-status positive"><i />Published</span></div><div className="admin-about-editor-layout"><div className="admin-about-editor-media"><img src={draft.aboutImage || '/naseeb-chapati-logo.png'} alt={draft.aboutImageAlt || ''} /><label className="admin-outline-button admin-about-upload-button">{uploadingAbout ? 'Uploading…' : 'Upload restaurant photo'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={uploadAboutImage} disabled={uploadingAbout} /></label><small>Recommended: landscape or portrait WebP/AVIF, maximum 5 MB.</small></div><div className="admin-form admin-editor-form"><label>Section label<input value={draft.aboutEyebrow || ''} onChange={(event) => update('aboutEyebrow', event.target.value)} placeholder="About Naseeb Chapati" /></label><label>Heading<input value={draft.aboutHeading || ''} onChange={(event) => update('aboutHeading', event.target.value)} /></label><label>About content<textarea rows="5" value={draft.aboutText || ''} onChange={(event) => update('aboutText', event.target.value)} /></label><label>Image URL<input value={draft.aboutImage || ''} onChange={(event) => update('aboutImage', event.target.value)} placeholder="Upload an image or paste a URL" /></label><label>Image alt text<input value={draft.aboutImageAlt || ''} onChange={(event) => update('aboutImageAlt', event.target.value)} placeholder="Describe the restaurant photo" /></label><div className="admin-two-col"><label>Button label<input value={draft.aboutButtonLabel || ''} onChange={(event) => update('aboutButtonLabel', event.target.value)} /></label><label>Button URL<input value={draft.aboutButtonUrl || ''} onChange={(event) => update('aboutButtonUrl', event.target.value)} /></label></div></div></div></div>
    <div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Visibility</span><h2>Homepage sections</h2></div></div><div className="admin-visibility-list">{[['showAbout', 'About section', 'Brand story and restaurant values'], ['showPromotions', 'Promotions section', 'Current offers and seasonal specials'], ['showReviews', 'Testimonials section', 'Approved customer reviews']].map(([key, label, description]) => <label className="admin-visibility-item" key={key}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={draft[key] !== false} onChange={(event) => update(key, event.target.checked)} /><span className="admin-switch" /></label>)}</div></div>
    <div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Homepage counters</span><h2>Restaurant highlights</h2><p>Use only restaurant-approved figures. These counters appear directly below the hero.</p></div><span className="admin-status positive"><i />Published</span></div><div className="admin-homepage-stats-editor">{draft.stats.map((item) => <div className="admin-homepage-stat-row" key={item.id}><label>Count<input value={item.value} onChange={(event) => updateStat(item.id, 'value', event.target.value)} placeholder="2+" /></label><label>Label<input value={item.label} onChange={(event) => updateStat(item.id, 'label', event.target.value)} placeholder="Years of Excellence" /></label></div>)}</div></div>
  </div><aside className="admin-editor-side"><div className="admin-panel admin-preview-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Live preview</span><h2>Homepage hero</h2></div><ExternalLink size={16} /></div><div className="admin-hero-preview"><img src={draft.heroSlides.find((slide) => slide.active !== false && slide.desktopImage)?.desktopImage || draft.desktopImage || '/naseeb-chapati-logo.png'} alt="Homepage hero preview" /><div><span>Homepage</span><h3>{draft.heroHeading}</h3><p>{draft.heroText}</p><button type="button">View Menu <ArrowUpRight size={13} /></button></div></div></div><button className="admin-primary-button admin-save-wide" onClick={saveHomepage}><Save size={16} />Publish homepage content</button></aside></div></section>;
}

export default WebsiteContentPage;

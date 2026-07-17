import { useEffect, useMemo, useState } from 'react';
import { m as motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, ExternalLink, Lightbulb, Mail,
  MessageCircle, Phone, Share2, ShieldCheck, Sparkles, Target, UsersRound,
} from 'lucide-react';
import { getTeamMemberBySlug, listPublishedTeamMembers } from '../lib/supabase';
import { motionEase, motionSpring } from '../motion';
import './team.css';

const journeyItems = ['Company Established', 'Restaurant Launch', 'Branch Expansion', 'Future Vision'];
const valueItems = [
  ['Leadership', Target],
  ['Integrity', ShieldCheck],
  ['Quality', CheckCircle2],
  ['Customer First', UsersRound],
  ['Innovation', Lightbulb],
  ['Teamwork', Sparkles],
];

const cardGroup = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: motionSpring },
};

function navigate(href) {
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function InternalLink({ href, className = '', children }) {
  return <a className={className} href={href} onClick={(event) => { event.preventDefault(); navigate(href); }}>{children}</a>;
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NC';
}

function contactHref(member) {
  if (member.email) return `mailto:${member.email}`;
  if (member.whatsapp) return `https://wa.me/${member.whatsapp.replace(/\D/g, '')}`;
  if (member.phone) return `tel:${member.phone.replace(/[^+\d]/g, '')}`;
  return '/contact';
}

function updateProfileMeta(member) {
  if (!member) return;
  const title = member.seo_title || `${member.full_name} — ${member.position} | Naseeb Chapati`;
  const description = member.seo_description || member.short_intro || `Meet ${member.full_name}, ${member.position} at Naseeb Chapati Restaurant.`;
  document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute('content', description);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `https://naseebchapati.com/our-team/${member.slug}`);
  const socialMeta = [
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', `https://naseebchapati.com/our-team/${member.slug}`],
    ['property', 'og:type', 'profile'],
    ['property', 'og:image', member.meta_image || member.cover_image || member.profile_image],
  ];
  socialMeta.forEach(([attribute, key, content]) => {
    if (!content) return;
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  });
}

function Portrait({ member, eager = false }) {
  if (!member.profile_image) {
    return <div className="team-portrait-placeholder" aria-label={`${member.full_name} profile image not uploaded`}><span>{initials(member.full_name)}</span><i /></div>;
  }
  return <picture><img src={member.profile_image} alt={member.image_alt || `${member.full_name}, ${member.position}`} loading={eager ? 'eager' : 'lazy'} decoding="async" /></picture>;
}

function TeamSkeleton({ cards = 2 }) {
  return <div className="team-skeleton-grid" aria-label="Loading team members" aria-live="polite">{Array.from({ length: cards }, (_, index) => <div className="team-skeleton-card" key={index}><span /><div><i /><i /><i /></div></div>)}</div>;
}

function DataMessage({ error, onRetry }) {
  return <div className="team-data-message" role={error ? 'alert' : 'status'}><span><UsersRound size={25} /></span><h3>{error ? 'The team directory is temporarily unavailable.' : 'Leadership profiles are being prepared.'}</h3><p>{error ? 'Please try again. If this continues, confirm the Team Members table has been created in Supabase.' : 'Published team members added in the admin dashboard will appear here automatically.'}</p>{error && <button type="button" onClick={onRetry}>Try again <ArrowRight size={15} /></button>}</div>;
}

function TeamCard({ member }) {
  const reduceMotion = useReducedMotion();
  const contact = contactHref(member);
  const isInternalContact = contact.startsWith('/');
  return <motion.article className="team-card" variants={cardItem} whileHover={reduceMotion ? undefined : { y: -8 }} transition={motionSpring}>
    <InternalLink href={`/our-team/${member.slug}`} className="team-card-image" aria-label={`View ${member.full_name}'s profile`}><Portrait member={member} /><span className="team-card-position">{member.position}</span></InternalLink>
    <div className="team-card-copy">
      {member.department && <span className="team-card-department">{member.department}</span>}
      <h3>{member.full_name}</h3>
      {member.short_intro && <p>{member.short_intro}</p>}
      {member.experience && <div className="team-card-experience"><BriefcaseBusiness size={15} /><span>{member.experience}</span></div>}
      <div className="team-card-actions">
        <InternalLink href={`/our-team/${member.slug}`} className="team-button team-button-primary">View Profile <ArrowRight size={15} /></InternalLink>
        {isInternalContact
          ? <InternalLink href={contact} className="team-button team-button-outline">Contact</InternalLink>
          : <a href={contact} className="team-button team-button-outline" target={contact.startsWith('http') ? '_blank' : undefined} rel={contact.startsWith('http') ? 'noreferrer' : undefined}>Contact</a>}
      </div>
    </div>
  </motion.article>;
}

export function TeamRouteFallback() {
  return <div className="team-route-fallback"><div className="team-route-fallback-hero"><span /><span /><span /></div><TeamSkeleton /></div>;
}

export function TeamPage() {
  const reduceMotion = useReducedMotion();
  const [members, setMembers] = useState([]);
  const [state, setState] = useState('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    listPublishedTeamMembers().then(({ data, error }) => {
      if (!active) return;
      setMembers(data || []);
      setState(error ? 'error' : 'ready');
    });
    return () => { active = false; };
  }, [retry]);

  return <div className="team-page">
    <section className="team-hero">
      <div className="team-hero-pattern" aria-hidden="true"><i /><i /><i /></div>
      <motion.div className="container team-hero-inner" initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={cardGroup}>
        <motion.span className="team-eyebrow" variants={cardItem}>Our Leadership</motion.span>
        <motion.h1 variants={cardItem}>Meet The People Behind Naseeb Chapati</motion.h1>
        <motion.p variants={cardItem}>Passion, Leadership, Experience and Commitment to Serving Authentic Pakistani Cuisine.</motion.p>
      </motion.div>
    </section>

    <section className="team-section team-leadership" aria-labelledby="leadership-heading">
      <div className="container">
        <motion.div className="team-section-heading" initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.55, ease: motionEase }}>
          <span className="team-eyebrow">Leadership</span>
          <h2 id="leadership-heading">Guided by purpose.<br />Driven by hospitality.</h2>
        </motion.div>
        {state === 'loading' && <TeamSkeleton cards={2} />}
        {state === 'error' && <DataMessage error onRetry={() => setRetry((value) => value + 1)} />}
        {state === 'ready' && members.length === 0 && <DataMessage />}
        {state === 'ready' && members.length > 0 && <motion.div className="team-card-grid" initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount: 0.08 }} variants={cardGroup}>{members.map((member) => <TeamCard member={member} key={member.id} />)}</motion.div>}
      </div>
    </section>

    <section className="team-section team-journey" aria-labelledby="journey-heading">
      <div className="container">
        <motion.div className="team-section-heading team-section-heading-light" initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.55, ease: motionEase }}>
          <span className="team-eyebrow">Our Journey</span>
          <h2 id="journey-heading">Company Leadership Journey</h2>
        </motion.div>
        <motion.ol className="team-timeline" initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount: 0.18 }} variants={cardGroup}>{journeyItems.map((item, index) => <motion.li key={item} variants={cardItem}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></motion.li>)}</motion.ol>
      </div>
    </section>

    <section className="team-section team-values" aria-labelledby="values-heading">
      <div className="container">
        <motion.div className="team-section-heading centered" initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.55, ease: motionEase }}>
          <span className="team-eyebrow">What Guides Us</span>
          <h2 id="values-heading">Values that shape every service.</h2>
        </motion.div>
        <motion.div className="team-values-grid" initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount: 0.12 }} variants={cardGroup}>{valueItems.map(([label, Icon]) => <motion.article key={label} variants={cardItem} whileHover={reduceMotion ? undefined : { y: -5 }}><span><Icon size={22} /></span><h3>{label}</h3></motion.article>)}</motion.div>
      </div>
    </section>

    <section className="team-join-section">
      <motion.div className="container team-join-card" initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.99 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease: motionEase }}>
        <div><span className="team-eyebrow">Careers</span><h2>Join the Naseeb Chapati Family</h2></div>
        <div><InternalLink href="/contact" className="team-button team-button-light">View Careers <ArrowRight size={15} /></InternalLink><InternalLink href="/contact" className="team-button team-button-ghost">Contact HR</InternalLink></div>
      </motion.div>
    </section>
  </div>;
}

function SocialLinks({ member }) {
  const links = [
    ['LinkedIn', member.linkedin, Share2],
    ['Facebook', member.facebook, Share2],
    ['Instagram', member.instagram, Share2],
    ['Website', member.website, ExternalLink],
  ].filter(([, href]) => href);
  if (!links.length) return null;
  return <div className="team-profile-socials">{links.map(([label, href, Icon]) => <a href={href} target="_blank" rel="noreferrer" aria-label={`${member.full_name} on ${label}`} key={label}><Icon size={17} /></a>)}</div>;
}

function ProfileContact({ member }) {
  const contacts = [
    member.email && ['Email', member.email, `mailto:${member.email}`, Mail],
    member.phone && ['Phone', member.phone, `tel:${member.phone.replace(/[^+\d]/g, '')}`, Phone],
    member.whatsapp && ['WhatsApp', member.whatsapp, `https://wa.me/${member.whatsapp.replace(/\D/g, '')}`, MessageCircle],
  ].filter(Boolean);
  if (!contacts.length) return null;
  return <aside className="team-profile-contact"><span className="team-eyebrow">Contact</span><h2>Connect</h2>{contacts.map(([label, value, href, Icon]) => <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} key={label}><span><Icon size={17} /></span><div><small>{label}</small><strong>{value}</strong></div></a>)}</aside>;
}

export function TeamProfilePage({ slug }) {
  const reduceMotion = useReducedMotion();
  const [member, setMember] = useState(null);
  const [state, setState] = useState('loading');
  const [retry, setRetry] = useState(0);
  const preview = useMemo(() => new URLSearchParams(window.location.search).get('preview') === '1', []);

  useEffect(() => {
    let active = true;
    setState('loading');
    getTeamMemberBySlug(decodeURIComponent(slug || ''), { preview }).then(({ data, error }) => {
      if (!active) return;
      setMember(data || null);
      setState(error ? 'error' : data ? 'ready' : 'missing');
    });
    return () => { active = false; };
  }, [slug, preview, retry]);

  useEffect(() => { if (member) updateProfileMeta(member); }, [member]);

  if (state === 'loading') return <div className="team-profile-loading"><div className="container"><TeamSkeleton cards={1} /></div></div>;
  if (state === 'error') return <section className="team-profile-state"><DataMessage error onRetry={() => setRetry((value) => value + 1)} /></section>;
  if (state === 'missing') return <section className="team-profile-state"><div className="team-data-message"><span><UsersRound size={25} /></span><h1>Profile not found.</h1><p>This team member is not published or the profile address has changed.</p><InternalLink href="/our-team" className="team-button team-button-primary"><ArrowLeft size={15} />Back to Our Team</InternalLink></div></section>;

  const gallery = member.gallery_images || [];
  return <article className="team-profile-page">
    <section className={`team-profile-cover ${member.cover_image ? 'has-cover' : ''}`} style={member.cover_image ? { '--team-cover': `url("${member.cover_image.replace(/"/g, '%22')}")` } : undefined}>
      <div className="team-profile-cover-overlay" />
      <motion.div className="container team-profile-hero" initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={cardGroup}>
        <motion.div className="team-profile-portrait" variants={cardItem}><Portrait member={member} eager /></motion.div>
        <motion.div className="team-profile-heading" variants={cardItem}>
          {preview && member.status !== 'Published' && <span className="team-preview-badge">Preview · {member.status}</span>}
          <span className="team-eyebrow">{member.department || 'Our Team'}</span>
          <h1>{member.full_name}</h1>
          <p className="team-profile-position">{member.position}</p>
          {member.short_intro && <p className="team-profile-intro">{member.short_intro}</p>}
          <SocialLinks member={member} />
        </motion.div>
      </motion.div>
    </section>

    <section className="team-profile-content">
      <div className="container">
        <InternalLink href="/our-team" className="team-profile-back"><ArrowLeft size={15} />All team members</InternalLink>
        {member.quote && <motion.blockquote initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: motionEase }}>“{member.quote}”</motion.blockquote>}
        <div className="team-profile-layout">
          <motion.div className="team-profile-editorial" initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount: 0.08 }} variants={cardGroup}>
            {member.biography && <motion.section variants={cardItem}><span className="team-eyebrow">Biography</span><h2>About {member.full_name}</h2><p>{member.biography}</p></motion.section>}
            {member.vision && <motion.section variants={cardItem}><span className="team-eyebrow">Vision</span><h2>Leadership vision</h2><p>{member.vision}</p></motion.section>}
            {member.experience && <motion.section variants={cardItem}><span className="team-eyebrow">Experience</span><h2>Professional experience</h2><p>{member.experience}</p></motion.section>}
            {member.qualification && <motion.section variants={cardItem}><span className="team-eyebrow">Qualifications</span><h2>Qualifications</h2><p>{member.qualification}</p></motion.section>}
          </motion.div>
          <ProfileContact member={member} />
        </div>
        {gallery.length > 0 && <section className="team-profile-gallery"><div className="team-section-heading"><div><span className="team-eyebrow">Gallery</span><h2>Leadership moments</h2></div></div><motion.div initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount: 0.12 }} variants={cardGroup}>{gallery.map((image, index) => <motion.figure key={`${image}-${index}`} variants={cardItem}><img src={image} alt={`${member.full_name} gallery image ${index + 1}`} loading="lazy" decoding="async" /></motion.figure>)}</motion.div></section>}
      </div>
    </section>
  </article>;
}

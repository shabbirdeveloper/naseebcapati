import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m as motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, CalendarDays, Check, CheckCircle2, ChefHat, ChevronRight, Clock3,
  HeartHandshake, LayoutGrid, Mail, MapPin, MessageCircle, Minus, PackageCheck, Phone, Plus,
  Send, Sparkles, Store, Users, UtensilsCrossed, X,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { branches, contactInfo, servicesContent } from '../data/content';
import { submitEventEnquiry } from '../lib/supabase';
import './services.css';

const spring = { type: 'spring', stiffness: 120, damping: 20, mass: .8 };
const reveal = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: spring } };

function goTo(href) {
  if (/^(https?:|mailto:|tel:)/.test(href)) { window.location.href = href; return; }
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function LinkButton({ href, children, tone = 'primary', icon: Icon = ArrowRight, onClick, className = '' }) {
  return <a className={`service-button ${tone} ${className}`} href={href} onClick={(event) => {
    if (onClick) { event.preventDefault(); onClick(event); return; }
    if (href?.startsWith('/')) { event.preventDefault(); goTo(href); }
  }}>{children}{Icon && <Icon size={17} aria-hidden="true" />}</a>;
}

function SectionTitle({ eyebrow, title, copy, align = 'left' }) {
  return <div className={`services-section-title ${align}`}><span>{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>;
}

function SortableActive(items = []) {
  return items.filter((item) => item.active !== false).sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
}

function formatPrice(item) {
  if (item.priceType === 'Price per person' && item.pricePerPerson) return `RM ${item.pricePerPerson} / person`;
  if (item.packagePrice) return `RM ${item.packagePrice}`;
  if (item.startingPrice) return `From RM ${item.startingPrice}`;
  return item.priceType || item.priceDisplay || 'Contact for Quotation';
}

function branchFor(value) {
  return branches.find((branch) => branch.slug === value || branch.name === value) || branches[0];
}

function whatsappNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function Hero({ onPlan }) {
  const settings = servicesContent.settings;
  const reduceMotion = useReducedMotion();
  const activeServices = SortableActive(servicesContent.services);
  return <section className="services-hero">
    <div className="services-hero-glow" aria-hidden="true" />
    <div className="services-container services-hero-grid">
      <motion.div className="services-hero-copy" initial={reduceMotion ? false : 'hidden'} animate="show" variants={{ show: { transition: { staggerChildren: .09 } } }}>
        <motion.span className="services-kicker" variants={reveal}>{settings.heroEyebrow}</motion.span>
        <motion.h1 variants={reveal}>{settings.heroTitle}</motion.h1>
        <motion.p variants={reveal}>{settings.heroText}</motion.p>
        <motion.div className="services-hero-actions" variants={reveal}>
          <LinkButton href="#event-enquiry" onClick={onPlan} icon={CalendarDays}>{settings.eventButtonLabel}</LinkButton>
          <LinkButton href="/services/catering" tone="outline" icon={ChefHat}>{settings.cateringButtonLabel}</LinkButton>
        </motion.div>
        <motion.div className="services-contact-actions" variants={reveal}>
          <a href={`https://wa.me/${whatsappNumber(settings.defaultWhatsapp || contactInfo.whatsapp)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} />{settings.whatsappButtonLabel}</a>
          <a href={`tel:${String(contactInfo.phone).replace(/\s/g, '')}`}><Phone size={16} />{settings.callButtonLabel}</a>
        </motion.div>
      </motion.div>
      <motion.div className="services-hero-visual" initial={reduceMotion ? false : { opacity: 0, scale: .97, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ ...spring, delay: .12 }}>
        <img src={settings.heroImage} alt={settings.heroAlt} fetchPriority="high" />
        <div className="services-capacity-badge"><Users size={20} /><span>{settings.capacityBadgeLabel.replace('{capacity}', settings.eventCapacity)}</span></div>
        <div className="services-hero-service-tabs">{activeServices.slice(0, 2).map((service) => <a href={`/services/${service.slug}`} key={service.id} onClick={(event) => { event.preventDefault(); goTo(`/services/${service.slug}`); }}><strong>{service.name}</strong><small>{service.availability}</small><ChevronRight size={15} /></a>)}</div>
      </motion.div>
    </div>
  </section>;
}

function ServicesOverview({ onPlan }) {
  const icons = [CalendarDays, ChefHat];
  return <section className="services-section services-overview"><div className="services-container">
    <SectionTitle eyebrow="What we offer" title="A thoughtful setting. Food people remember." copy="Choose a service to explore the published options, then send the restaurant team your preferred date and requirements." align="center" />
    <motion.div className="service-overview-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: .16 }} variants={{ show: { transition: { staggerChildren: .1 } } }}>
      {SortableActive(servicesContent.services).map((service, index) => { const Icon = icons[index] || Sparkles; return <motion.article className="service-overview-card" key={service.id} variants={reveal} whileHover={{ y: -8 }} transition={spring}>
        <div className="service-overview-image"><img src={service.image} alt={service.imageAlt} loading="lazy" /><span><Icon size={21} /></span></div>
        <div className="service-overview-body"><span className="services-kicker">{service.serviceType}</span><h3>{service.name}</h3><p>{service.shortDescription}</p><ul>{(service.features || []).slice(0, 6).map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul><div className="service-card-footer"><LinkButton href={`/services/${service.slug}`} tone="text">{service.ctaLabel || 'View Service'}</LinkButton><button type="button" onClick={onPlan}>{service.slug === 'events' ? 'Enquire Now' : 'Request Quote'}<ArrowRight size={15} /></button></div></div>
      </motion.article>; })}
    </motion.div>
  </div></section>;
}

function EventTypes({ onPlan }) {
  const items = SortableActive(servicesContent.eventTypes);
  return <section className="services-section services-event-types"><div className="services-container">
    <SectionTitle eyebrow="Every occasion" title="A place for meaningful moments." copy="Explore event types currently open for enquiry. Final space, layout and branch availability are confirmed by our team." />
    <motion.div className="event-type-grid" layout initial="hidden" whileInView="show" viewport={{ once: true, amount: .08 }} variants={{ show: { transition: { staggerChildren: .055 } } }}>
      {items.map((item) => <motion.article className="event-type-card" key={item.id} variants={reveal} whileHover={{ y: -6 }} transition={spring}>
        <div><img src={item.image} alt={item.imageAlt} loading="lazy" /></div><section><span>{item.minGuests}–{item.maxGuests} guests</span><h3>{item.name}</h3><p>{item.shortDescription}</p><small><MapPin size={13} />{(item.branches || []).join(' · ')}</small><footer><LinkButton href="/services/events" tone="text">View Details</LinkButton><button type="button" onClick={() => onPlan({ eventType: item.name })}>Enquire Now</button></footer></section>
      </motion.article>)}
    </motion.div>
  </div></section>;
}

function VenueSection() {
  const settings = servicesContent.settings;
  const facilities = SortableActive(servicesContent.facilities);
  return <section className="services-venue"><div className="services-container services-venue-grid">
    <motion.div className="services-venue-copy" initial="hidden" whileInView="show" viewport={{ once: true, amount: .24 }} variants={reveal}>
      <span className="services-kicker light">Event space</span><h2>Comfortable gatherings, planned around your group.</h2><p>Enabled facilities are shown below. Exact arrangements depend on the selected branch, guest count and event requirements.</p>
      <div className="capacity-scale">{settings.capacityRanges.filter((range) => range.active !== false).map((range, index) => <div key={range.id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{range.label}</strong><small>{range.range}</small></div>)}</div>
    </motion.div>
    <motion.div className="facility-panel" initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={{ show: { transition: { staggerChildren: .05 } } }}>
      <div className="facility-panel-heading"><span><Users size={22} /></span><div><small>Maximum published capacity</small><strong>Up to {settings.eventCapacity} guests</strong></div></div>
      <div className="facility-list">{facilities.map((facility) => <motion.div variants={reveal} key={facility.id}><CheckCircle2 size={17} /><div><strong>{facility.name}</strong><p>{facility.description}</p></div></motion.div>)}</div>
    </motion.div>
  </div></section>;
}

function PackageCards({ items, type, onPlan }) {
  return <motion.div className="services-package-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: .1 }} variants={{ show: { transition: { staggerChildren: .09 } } }}>
    {items.map((item) => <motion.article className={`services-package-card ${item.featured ? 'featured' : ''}`} key={item.id} variants={reveal} whileHover={{ y: -7 }} transition={spring}>
      {item.featured && <span className="featured-label"><Sparkles size={13} />Featured</span>}
      {type === 'catering' && <img src={item.image} alt={item.imageAlt || item.name} loading="lazy" />}
      <div className="package-card-head"><span>{item.packageType}</span><h3>{item.name}</h3><p>{item.shortDescription}</p></div>
      <strong className="package-price">{formatPrice(item)}</strong>
      <div className="package-meta"><span><Users size={14} />{type === 'event' ? `${item.minGuests}–${item.maxGuests} guests` : item.guests}</span><span><MapPin size={14} />{(item.branches || []).length} branches</span></div>
      <ul>{type === 'event' ? [...(item.menuItems || []), ...(item.facilities || []), item.staffIncluded ? 'Service staff included' : null].filter(Boolean).slice(0, 5).map((line) => <li key={line}><Check size={14} />{line}</li>) : [...(item.mainDishes || []), item.deliveryArea, item.advanceOrder].filter(Boolean).map((line) => <li key={line}><Check size={14} />{line}</li>)}</ul>
      <small className="package-terms">{item.terms}</small>
      <div className="package-actions"><button type="button" onClick={() => onPlan({ preferredPackage: item.name, serviceType: type === 'event' ? 'Event Space and Catering' : 'Catering Service' })}>{type === 'event' ? 'Enquire' : 'Request Quote'}<ArrowRight size={15} /></button>{type === 'catering' && <a href={`https://wa.me/${whatsappNumber(contactInfo.whatsapp)}`} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp</a>}</div>
    </motion.article>)}
  </motion.div>;
}

function CateringSection({ onPlan }) {
  const types = SortableActive(servicesContent.cateringTypes);
  const options = SortableActive(servicesContent.cateringOptions);
  return <section className="services-section services-catering"><div className="services-container">
    <div className="catering-intro"><SectionTitle eyebrow="Catering services" title="Your menu, served where the moment happens." copy="Build an enquiry for on-site or off-site catering. Delivery, setup and staffing are confirmed according to branch and event requirements." /><LinkButton href="/services/catering" tone="outline">Explore Catering</LinkButton></div>
    <div className="catering-options-grid"><div className="catering-type-list"><h3>Popular catering enquiries</h3>{types.map((item) => <button key={item.id} type="button" onClick={() => onPlan({ eventType: item.name, serviceType: 'Catering Service', cateringRequired: true })}><span>{item.name}</span><ArrowRight size={15} /></button>)}</div><div className="catering-option-panel"><span className="services-kicker">Available to request</span><h3>Choose the support your event needs.</h3><div>{options.map((option) => <span key={option.id}><Check size={14} />{option.name}</span>)}</div></div></div>
  </div></section>;
}

function EventGallery() {
  const items = SortableActive(servicesContent.gallery);
  const [category, setCategory] = useState('All');
  const [branch, setBranch] = useState('All branches');
  const [lightbox, setLightbox] = useState(null);
  const categories = ['All', ...new Set(items.map((item) => item.category))];
  const branchFilters = ['All branches', ...new Set(items.map((item) => item.branch).filter((item) => item && item !== 'All branches'))];
  const visible = items.filter((item) => (category === 'All' || item.category === category) && (branch === 'All branches' || item.branch === branch || item.branch === 'All branches'));
  useEffect(() => { if (!lightbox) return undefined; const close = (event) => event.key === 'Escape' && setLightbox(null); window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [lightbox]);
  return <section className="services-section service-gallery-section"><div className="services-container">
    <SectionTitle eyebrow="Event gallery" title="A closer look at gathering around our table." copy="Browse published event, dining and catering imagery from the Services media library." />
    <div className="service-gallery-filters"><div>{categories.map((item) => <button className={category === item ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><select aria-label="Filter service gallery by branch" value={branch} onChange={(event) => setBranch(event.target.value)}>{branchFilters.map((item) => <option key={item}>{item}</option>)}</select></div>
    <motion.div className="service-gallery-grid" layout>{visible.map((item, index) => <motion.button layout className={index % 5 === 0 ? 'wide' : ''} key={item.id} type="button" onClick={() => setLightbox(item)} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><img src={item.image} alt={item.alt} loading="lazy" /><span><strong>{item.category}</strong><small>{item.branch}</small><Plus size={18} /></span></motion.button>)}</motion.div>
  </div><AnimatePresence>{lightbox && <motion.div className="service-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.alt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)}><button type="button" aria-label="Close image" onClick={() => setLightbox(null)}><X /></button><motion.figure initial={{ y: 20, scale: .98 }} animate={{ y: 0, scale: 1 }} onClick={(event) => event.stopPropagation()}><img src={lightbox.image} alt={lightbox.alt} /><figcaption>{lightbox.caption}</figcaption></motion.figure></motion.div>}</AnimatePresence></section>;
}

function Benefits() {
  const icons = [UtensilsCrossed, ChefHat, LayoutGrid, Users, BadgeCheck, HeartHandshake, PackageCheck, Sparkles];
  return <section className="services-section services-benefits"><div className="services-container"><SectionTitle eyebrow="Why Naseeb Chapati" title="Hospitality that keeps every detail connected." align="center" /><motion.div className="benefit-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={{ show: { transition: { staggerChildren: .05 } } }}>{SortableActive(servicesContent.benefits).map((item, index) => { const Icon = icons[index % icons.length]; return <motion.div variants={reveal} key={item.id}><span><Icon size={20} /></span><strong>{item.name.replace('60', servicesContent.settings.eventCapacity)}</strong></motion.div>; })}</motion.div></div></section>;
}

function buildWhatsAppMessage(form, reference = '') {
  return `Hello Naseeb Chapati,\n\nI would like to enquire about an event.${reference ? `\nReference: ${reference}` : ''}\n\nEvent Type: ${form.eventType}\nPreferred Branch: ${branchFor(form.branch)?.name || form.branch}\nDate: ${form.eventDate}\nTime: ${form.startTime}\nNumber of Guests: ${form.guests}\nService Required: ${form.serviceType}\nPreferred Package: ${form.preferredPackage || 'Please recommend'}\nAdditional Request: ${form.specialRequests || 'None'}\n\nPlease provide availability and quotation.`;
}

function initialForm() {
  return {
    name: '', phone: '', whatsapp: '', email: '', eventType: servicesContent.eventTypes.find((item) => item.active !== false)?.name || '',
    serviceType: 'Event Space and Catering', branch: branches[0]?.slug || '', eventDate: '', startTime: '', guests: 20,
    eventSpaceRequired: true, cateringRequired: true, deliveryLocation: '', preferredPackage: '', estimatedBudget: '', decorationRequired: false,
    specialRequests: '', preferredContactMethod: 'WhatsApp', consent: false, foodCategories: [], preferredDishes: '', drinks: '', desserts: '', eventDuration: '', cateringType: '', setupRequired: false, servingStaffRequired: false,
  };
}

function MenuBuilder({ form, setForm }) {
  const toggle = (key, value) => setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const foodOptions = ['Chapati and Bread', 'Biryani and Rice', 'Chicken Dishes', 'Mutton Dishes', 'Tandoori and Grill', 'Desserts'];
  return <section className="custom-builder"><div><span className="services-kicker">Optional menu builder</span><h3>Shape your enquiry before you send it.</h3><p>Select the categories that interest you. This creates an enquiry only and does not calculate or confirm a final price.</p></div><div className="builder-controls"><label>Event duration<input value={form.eventDuration} onChange={(event) => setForm({ ...form, eventDuration: event.target.value })} placeholder="For example: 3 hours" /></label><label>Catering type<select value={form.cateringType} onChange={(event) => setForm({ ...form, cateringType: event.target.value })}><option value="">Select if required</option>{SortableActive(servicesContent.cateringTypes).map((item) => <option key={item.id}>{item.name}</option>)}</select></label><fieldset><legend>Food categories</legend><div>{foodOptions.map((item) => <button className={form.foodCategories.includes(item) ? 'active' : ''} key={item} type="button" onClick={() => toggle('foodCategories', item)}>{form.foodCategories.includes(item) ? <Minus size={13} /> : <Plus size={13} />}{item}</button>)}</div></fieldset><label>Preferred dishes<input value={form.preferredDishes} onChange={(event) => setForm({ ...form, preferredDishes: event.target.value })} placeholder="Add dish preferences if known" /></label><div className="builder-checks"><label><input type="checkbox" checked={form.setupRequired} onChange={(event) => setForm({ ...form, setupRequired: event.target.checked })} />Setup service required</label><label><input type="checkbox" checked={form.servingStaffRequired} onChange={(event) => setForm({ ...form, servingStaffRequired: event.target.checked })} />Serving staff required</label></div></div></section>;
}

function EventEnquiry({ form, setForm }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const update = (event) => { const { name, type, checked, value } = event.target; setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })); };
  const submit = async (event) => {
    event.preventDefault(); setError(''); setState('submitting');
    const extras = [form.foodCategories.length ? `Food categories: ${form.foodCategories.join(', ')}` : '', form.preferredDishes ? `Preferred dishes: ${form.preferredDishes}` : '', form.eventDuration ? `Duration: ${form.eventDuration}` : '', form.cateringType ? `Catering type: ${form.cateringType}` : '', form.setupRequired ? 'Setup service requested' : '', form.servingStaffRequired ? 'Serving staff requested' : ''].filter(Boolean).join('\n');
    const result = await submitEventEnquiry({ ...form, specialRequests: [form.specialRequests, extras].filter(Boolean).join('\n') });
    if (result.error) { setError('We could not store your enquiry. Please continue on WhatsApp or call the restaurant team.'); setState('idle'); return; }
    setReference(result.data.reference); setState('success');
  };
  const branch = branchFor(form.branch);
  const waHref = `https://wa.me/${whatsappNumber(branch?.whatsapp || servicesContent.settings.defaultWhatsapp || contactInfo.whatsapp)}?text=${encodeURIComponent(buildWhatsAppMessage(form, reference))}`;
  if (state === 'success') return <motion.div className="event-success" role="status" initial={{ opacity: 0, scale: .98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={spring}><span><Check size={28} /></span><p className="services-kicker">Enquiry received</p><h3>Thank you, {form.name}.</h3><p>Our team will review the details. Availability and pricing are not confirmed until the restaurant contacts you.</p><strong>{reference}</strong><a href={waHref} target="_blank" rel="noreferrer"><MessageCircle size={17} />Continue on WhatsApp</a><button type="button" onClick={() => { setState('idle'); setReference(''); setForm(initialForm()); }}>Send another enquiry</button></motion.div>;
  return <form className="event-enquiry-form" onSubmit={submit}>
    <div className="enquiry-form-grid"><label>Full name<input name="name" value={form.name} onChange={update} required autoComplete="name" /></label><label>Phone number<input type="tel" name="phone" value={form.phone} onChange={update} required autoComplete="tel" /></label><label>WhatsApp number<input type="tel" name="whatsapp" value={form.whatsapp} onChange={update} required /></label><label>Email address<input type="email" name="email" value={form.email} onChange={update} required autoComplete="email" /></label>
      <label>Event type<select name="eventType" value={form.eventType} onChange={update} required>{SortableActive(servicesContent.eventTypes).map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Service type<select name="serviceType" value={form.serviceType} onChange={update} required>{['Restaurant Event Space', 'Catering Service', 'Event Space and Catering', 'Corporate Food Order', 'Custom Requirement'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Preferred branch<select name="branch" value={form.branch} onChange={update} required>{branches.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label><label>Event date<input type="date" name="eventDate" min={new Date().toISOString().slice(0, 10)} value={form.eventDate} onChange={update} required /></label><label>Start time<input type="time" name="startTime" value={form.startTime} onChange={update} required /></label><label>Number of guests<input type="number" name="guests" min="1" max="5000" value={form.guests} onChange={update} required /></label>
      <label>Preferred package<select name="preferredPackage" value={form.preferredPackage} onChange={update}><option value="">Please recommend</option>{[...SortableActive(servicesContent.eventPackages), ...SortableActive(servicesContent.cateringPackages)].map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Estimated budget<input name="estimatedBudget" value={form.estimatedBudget} onChange={update} placeholder="Optional" /></label><label>Delivery location<input name="deliveryLocation" value={form.deliveryLocation} onChange={update} placeholder="Required for delivery enquiry" /></label><label>Preferred contact<select name="preferredContactMethod" value={form.preferredContactMethod} onChange={update}><option>WhatsApp</option><option>Phone</option><option>Email</option></select></label>
    </div><div className="enquiry-choice-row"><label><input type="checkbox" name="eventSpaceRequired" checked={form.eventSpaceRequired} onChange={update} />Event space required</label><label><input type="checkbox" name="cateringRequired" checked={form.cateringRequired} onChange={update} />Catering required</label><label><input type="checkbox" name="decorationRequired" checked={form.decorationRequired} onChange={update} />Decoration required</label></div><label className="full-field">Special requests<textarea name="specialRequests" rows="5" value={form.specialRequests} onChange={update} placeholder="Tell us about the menu, setup, timing or accessibility requirements." /></label><label className="consent-field"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required />I consent to Naseeb Chapati using these details to respond to my event enquiry.</label>{error && <p className="enquiry-error">{error}</p>}<div className="enquiry-submit"><p><BadgeCheck size={16} />Submitting an enquiry does not confirm availability or price.</p><button type="submit" disabled={state === 'submitting'}>{state === 'submitting' ? 'Sending enquiry…' : 'Send Event Enquiry'}<Send size={17} /></button></div>
  </form>;
}

function EnquirySection({ form, setForm, enquiryRef }) {
  return <section id="event-enquiry" ref={enquiryRef} className="services-section enquiry-section"><div className="services-container"><div className="enquiry-heading"><SectionTitle eyebrow="Booking & quotation" title={servicesContent.settings.enquiryTitle} copy={servicesContent.settings.enquiryText} /><div><span><Phone size={17} /></span><p>Prefer to speak with us?</p><a href={`tel:${String(contactInfo.phone).replace(/\s/g, '')}`}>{contactInfo.phone}</a></div></div><MenuBuilder form={form} setForm={setForm} /><EventEnquiry form={form} setForm={setForm} /></div></section>;
}

function FAQSection() {
  const faqs = SortableActive(servicesContent.faqs);
  return <section className="services-section services-faq"><div className="services-container faq-grid"><SectionTitle eyebrow="Frequently asked" title="A few things to know before you enquire." copy="The final details for every booking depend on the selected branch, date, guest count and service requirements." /><Accordion className="faq-accordion" type="single" collapsible defaultValue={faqs[0]?.id}>{faqs.map((faq) => <AccordionItem key={faq.id} value={faq.id}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent>{faq.answer}</AccordionContent></AccordionItem>)}</Accordion></div></section>;
}

function FinalCTA({ onPlan }) {
  const settings = servicesContent.settings;
  return <section className="services-final-cta" style={{ '--service-cta-image': `url(${settings.finalImage})` }}><div className="services-container"><span className="services-kicker light">Plan with our team</span><h2>{settings.finalTitle}</h2><p>{settings.finalText}</p><div><LinkButton href="#event-enquiry" onClick={onPlan}>{settings.finalPrimaryLabel}</LinkButton><LinkButton href={`https://wa.me/${whatsappNumber(settings.defaultWhatsapp || contactInfo.whatsapp)}`} tone="light" icon={MessageCircle}>{settings.finalWhatsappLabel}</LinkButton><LinkButton href={`tel:${String(contactInfo.phone).replace(/\s/g, '')}`} tone="text-light" icon={Phone}>{settings.finalCallLabel}</LinkButton><LinkButton href="/services/events" tone="text-light">{settings.finalPackagesLabel}</LinkButton></div></div></section>;
}

function ServiceMobileBar({ onPlan }) {
  useEffect(() => {
    document.body.classList.add('has-service-mobile-bar');
    return () => document.body.classList.remove('has-service-mobile-bar');
  }, []);
  if (typeof document === 'undefined') return null;
  return createPortal(<div className="service-mobile-bar"><button type="button" onClick={onPlan}><CalendarDays size={17} />{servicesContent.settings.eventButtonLabel}</button><a href={`https://wa.me/${whatsappNumber(servicesContent.settings.defaultWhatsapp || contactInfo.whatsapp)}`} target="_blank" rel="noreferrer"><MessageCircle size={18} />WhatsApp</a></div>, document.body);
}

export function ServicesPage() {
  const [form, setForm] = useState(initialForm);
  const enquiryRef = useRef(null);
  const onPlan = (changes = {}) => { if (changes && typeof changes === 'object' && !changes.preventDefault) setForm((current) => ({ ...current, ...changes })); window.setTimeout(() => enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  return <div className="services-page"><Hero onPlan={onPlan} /><ServicesOverview onPlan={onPlan} /><EventTypes onPlan={onPlan} /><VenueSection /><section className="services-section event-packages"><div className="services-container"><SectionTitle eyebrow="Event packages" title="A flexible starting point for your gathering." copy="Prices stay as Contact for Quotation until the restaurant publishes verified pricing." /><PackageCards items={SortableActive(servicesContent.eventPackages)} type="event" onPlan={onPlan} /></div></section><CateringSection onPlan={onPlan} /><section className="services-section catering-packages"><div className="services-container"><SectionTitle eyebrow="Catering packages" title="Built for the way your guests will be served." copy="Choose a published package as a starting point, then request a tailored menu and quotation." /><PackageCards items={SortableActive(servicesContent.cateringPackages)} type="catering" onPlan={onPlan} /></div></section><EventGallery /><Benefits /><EnquirySection form={form} setForm={setForm} enquiryRef={enquiryRef} /><FAQSection /><FinalCTA onPlan={onPlan} /><ServiceMobileBar onPlan={onPlan} /></div>;
}

export function ServiceDetailPage({ slug }) {
  const service = servicesContent.services.find((item) => item.slug === slug && item.active !== false);
  const [form, setForm] = useState(() => ({ ...initialForm(), serviceType: slug === 'catering' ? 'Catering Service' : 'Event Space and Catering', cateringRequired: true, eventSpaceRequired: slug !== 'catering' }));
  const enquiryRef = useRef(null);
  const onPlan = (changes = {}) => { setForm((current) => ({ ...current, ...(changes && typeof changes === 'object' ? changes : {}) })); window.setTimeout(() => enquiryRef.current?.scrollIntoView({ behavior: 'smooth' }), 20); };
  if (!service) return <section className="service-not-found"><span>Services</span><h1>Service not found.</h1><LinkButton href="/services">View all services</LinkButton></section>;
  const isCatering = slug === 'catering';
  return <div className="services-page service-detail-page"><section className="service-detail-hero"><img src={service.image} alt={service.imageAlt} /><div className="services-container"><span className="services-kicker light">{service.serviceType}</span><h1>{service.name}</h1><p>{service.fullDescription}</p><div><LinkButton href="#event-enquiry" onClick={onPlan}>{isCatering ? 'Request Catering Quote' : 'Plan Your Event'}</LinkButton><LinkButton href="/services" tone="light">All Services</LinkButton></div></div></section><section className="services-section"><div className="services-container service-detail-summary"><div><SectionTitle eyebrow="Service overview" title={service.shortDescription} copy={service.fullDescription} /><ul>{(service.features || []).map((item) => <li key={item}><CheckCircle2 size={17} />{item}</li>)}</ul></div><aside><span><Users size={20} /></span><small>Published capacity</small><strong>{service.maxCapacity ? `Up to ${service.maxCapacity} guests` : 'Custom guest count'}</strong><small>Availability</small><strong>{service.availability}</strong><small>Branches</small><strong>{(service.branches || []).join(' · ')}</strong></aside></div></section>{isCatering ? <><CateringSection onPlan={onPlan} /><section className="services-section catering-packages"><div className="services-container"><SectionTitle eyebrow="Catering packages" title="Choose a starting point for your quotation." /><PackageCards items={SortableActive(servicesContent.cateringPackages)} type="catering" onPlan={onPlan} /></div></section></> : <><EventTypes onPlan={onPlan} /><VenueSection /><section className="services-section event-packages"><div className="services-container"><SectionTitle eyebrow="Event packages" title="Compare the published package options." /><PackageCards items={SortableActive(servicesContent.eventPackages)} type="event" onPlan={onPlan} /></div></section></>}<EventGallery /><EnquirySection form={form} setForm={setForm} enquiryRef={enquiryRef} /><FAQSection /><FinalCTA onPlan={onPlan} /><ServiceMobileBar onPlan={onPlan} /></div>;
}

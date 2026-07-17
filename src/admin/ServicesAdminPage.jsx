import { useMemo, useState } from 'react';
import {
  ArrowUpRight, CalendarDays, Check, ChevronRight, CircleAlert, Download, Edit3, Eye, FileText,
  ImagePlus, Mail, MapPin, MessageCircle, PackageCheck, PartyPopper, Phone, Plus, Search, Settings,
  Sparkles, Store, Trash2, Upload, Users, UtensilsCrossed, X,
} from 'lucide-react';
import { uploadMediaFile } from '../lib/supabase';
import './servicesAdmin.css';

const sectionMap = {
  services: { title: 'Service Overview', description: 'Manage the public event and catering service cards.', key: 'services', icon: Store },
  'service-events': { title: 'Event Types', description: 'Manage occasions shown on the Services page.', key: 'eventTypes', icon: PartyPopper },
  'service-packages': { title: 'Event Packages', description: 'Manage event package inclusions and quotation display.', key: 'eventPackages', icon: PackageCheck },
  'catering-packages': { title: 'Catering Packages', description: 'Manage catering menus, order requirements and service areas.', key: 'cateringPackages', icon: UtensilsCrossed },
  'service-facilities': { title: 'Facilities', description: 'Only enabled facilities are published on the website.', key: 'facilities', icon: Check },
  'service-gallery': { title: 'Service Gallery', description: 'Publish event and catering imagery with branch filters.', key: 'gallery', icon: ImagePlus },
};

const commonFields = [
  ['name', 'Name', 'text'], ['slug', 'Slug', 'text'], ['shortDescription', 'Short description', 'textarea'], ['fullDescription', 'Full description', 'textarea'],
  ['image', 'Main image', 'image'], ['imageAlt', 'Image alt text', 'text'], ['ctaLabel', 'Card CTA label', 'text'], ['branches', 'Applicable branches', 'csv'], ['displayOrder', 'Display order', 'number'], ['active', 'Active on website', 'checkbox'],
];

const resourceFields = {
  services: [...commonFields, ['serviceType', 'Service type', 'text'], ['icon', 'Icon key', 'text'], ['maxCapacity', 'Maximum capacity', 'number'], ['minGuests', 'Minimum guests', 'number'], ['startingPrice', 'Starting price', 'number'], ['priceDisplay', 'Pricing display type', 'select', ['Contact for Quotation', 'Starting price', 'Price per person']], ['features', 'Features', 'csv'], ['facilities', 'Facilities', 'csv'], ['availability', 'Availability note', 'text'], ['featured', 'Featured service', 'checkbox'], ['seoTitle', 'SEO title', 'text'], ['seoDescription', 'SEO description', 'textarea'], ['openGraphImage', 'Open Graph image', 'image']],
  eventTypes: [...commonFields, ['minGuests', 'Minimum guests', 'number'], ['maxGuests', 'Maximum guests', 'number'], ['recommendedPackages', 'Recommended packages', 'csv'], ['seoTitle', 'SEO title', 'text'], ['seoDescription', 'SEO description', 'textarea']],
  eventPackages: [['name', 'Package name', 'text'], ['slug', 'Slug', 'text'], ['packageType', 'Package type', 'text'], ['image', 'Package image', 'image'], ['shortDescription', 'Short description', 'textarea'], ['priceType', 'Price type', 'select', ['Contact for Quotation', 'Package price', 'Price per person']], ['packagePrice', 'Package price', 'number'], ['pricePerPerson', 'Price per person', 'number'], ['minGuests', 'Minimum guests', 'number'], ['maxGuests', 'Maximum guests', 'number'], ['menuItems', 'Included menu items', 'csv'], ['drinks', 'Included drinks', 'csv'], ['desserts', 'Included desserts', 'csv'], ['duration', 'Event duration', 'text'], ['facilities', 'Facilities included', 'csv'], ['setupIncluded', 'Setup included', 'checkbox'], ['staffIncluded', 'Staff included', 'checkbox'], ['decorationIncluded', 'Decoration included', 'checkbox'], ['branches', 'Applicable branches', 'csv'], ['terms', 'Terms and conditions', 'textarea'], ['featured', 'Featured package', 'checkbox'], ['active', 'Active on website', 'checkbox'], ['displayOrder', 'Display order', 'number']],
  cateringPackages: [['name', 'Package name', 'text'], ['slug', 'Slug', 'text'], ['packageType', 'Package type', 'text'], ['image', 'Package image', 'image'], ['imageAlt', 'Image alt text', 'text'], ['shortDescription', 'Short description', 'textarea'], ['minimumOrder', 'Minimum order', 'text'], ['guests', 'Number of guests', 'text'], ['mainDishes', 'Main dishes', 'csv'], ['riceDishes', 'Rice dishes', 'csv'], ['breads', 'Bread selection', 'csv'], ['sides', 'Side dishes', 'csv'], ['drinks', 'Drinks', 'csv'], ['desserts', 'Desserts', 'csv'], ['addOns', 'Add-on items', 'csv'], ['priceType', 'Price type', 'select', ['Contact for Quotation', 'Package price', 'Price per person']], ['packagePrice', 'Package price', 'number'], ['pricePerPerson', 'Price per person', 'number'], ['deliveryArea', 'Delivery area', 'text'], ['branches', 'Applicable branches', 'csv'], ['advanceOrder', 'Advance-order requirement', 'text'], ['terms', 'Terms and conditions', 'textarea'], ['featured', 'Featured package', 'checkbox'], ['active', 'Active on website', 'checkbox'], ['displayOrder', 'Display order', 'number']],
  facilities: [['name', 'Facility name', 'text'], ['description', 'Description', 'textarea'], ['icon', 'Icon key', 'text'], ['branches', 'Applicable branches', 'csv'], ['active', 'Enabled on website', 'checkbox'], ['displayOrder', 'Display order', 'number']],
  gallery: [['image', 'Gallery image', 'image'], ['alt', 'Image alt text', 'text'], ['caption', 'Caption', 'text'], ['category', 'Category', 'text'], ['branch', 'Branch', 'text'], ['active', 'Published on website', 'checkbox'], ['displayOrder', 'Display order', 'number']],
  faqs: [['question', 'Question', 'text'], ['answer', 'Answer', 'textarea'], ['active', 'Published on website', 'checkbox'], ['displayOrder', 'Display order', 'number']],
};

function emptyRecord(key, length) {
  const id = `${key}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
  const base = { id, active: true, displayOrder: length + 1 };
  if (key === 'services') return { ...base, name: '', slug: '', serviceType: 'Restaurant Event Space', branches: [], features: [], facilities: [], priceDisplay: 'Contact for Quotation' };
  if (key === 'eventTypes') return { ...base, name: '', slug: '', branches: [], recommendedPackages: [] };
  if (key === 'eventPackages') return { ...base, name: '', slug: '', packageType: 'Event', priceType: 'Contact for Quotation', menuItems: [], drinks: [], desserts: [], facilities: [], branches: [] };
  if (key === 'cateringPackages') return { ...base, name: '', slug: '', packageType: 'Catering', priceType: 'Contact for Quotation', mainDishes: [], riceDishes: [], breads: [], sides: [], drinks: [], desserts: [], addOns: [], branches: [] };
  if (key === 'facilities') return { ...base, name: '', description: '', branches: [] };
  if (key === 'gallery') return { ...base, image: '', alt: '', caption: '', category: 'Event Setups', branch: 'All branches' };
  if (key === 'faqs') return { ...base, question: '', answer: '' };
  return base;
}

function statusLabel(row) { return row.active === false ? 'Inactive' : 'Published'; }

function ResourceEditor({ resourceKey, value, onClose, onSave, notify }) {
  const [draft, setDraft] = useState({ ...value });
  const [uploading, setUploading] = useState('');
  const fields = resourceFields[resourceKey] || commonFields;
  const update = (key, next, type) => setDraft((current) => ({ ...current, [key]: type === 'number' ? (next === '' ? '' : Number(next)) : type === 'csv' ? next.split(',').map((item) => item.trim()).filter(Boolean) : next }));
  const upload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    const result = await uploadMediaFile(file, `services/${resourceKey}`);
    setUploading('');
    if (result.error) { notify(result.error.message || 'Image upload failed.'); return; }
    update(field, result.url);
  };
  return <div className="service-admin-drawer-backdrop" role="presentation" onMouseDown={onClose}><aside className="service-admin-drawer" role="dialog" aria-modal="true" aria-label={`Edit ${resourceKey}`} onMouseDown={(event) => event.stopPropagation()}><header><div><span>Services CMS</span><h2>{value?.name || value?.question || 'New record'}</h2></div><button type="button" onClick={onClose} aria-label="Close editor"><X /></button></header><div className="service-admin-editor-fields">{fields.map(([key, label, type, options]) => {
    if (type === 'checkbox') return <label className="service-admin-check" key={key}><input type="checkbox" checked={Boolean(draft[key])} onChange={(event) => update(key, event.target.checked)} /><span><strong>{label}</strong><small>{draft[key] ? 'Enabled' : 'Disabled'}</small></span></label>;
    if (type === 'image') return <div className="service-admin-image-field" key={key}><label>{label}<input value={draft[key] || ''} onChange={(event) => update(key, event.target.value)} placeholder="Image URL" /></label>{draft[key] && <img src={draft[key]} alt="Preview" />}<label className="service-admin-upload"><Upload size={15} />{uploading === key ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/*" onChange={(event) => upload(key, event.target.files?.[0])} disabled={Boolean(uploading)} /></label></div>;
    if (type === 'textarea') return <label key={key}>{label}<textarea rows="4" value={draft[key] || ''} onChange={(event) => update(key, event.target.value)} /></label>;
    if (type === 'select') return <label key={key}>{label}<select value={draft[key] || options[0]} onChange={(event) => update(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
    const shown = type === 'csv' ? (draft[key] || []).join(', ') : (draft[key] ?? '');
    return <label key={key}>{label}<input type={type === 'number' ? 'number' : 'text'} value={shown} onChange={(event) => update(key, event.target.value, type)} /></label>;
  })}</div><footer><button type="button" onClick={onClose}>Cancel</button><button type="button" className="primary" onClick={() => onSave(draft)}><Check size={16} />Save changes</button></footer></aside></div>;
}

function ServicesResource({ section, state, commit, notify }) {
  const config = sectionMap[section];
  const rows = state.servicesContent[config.key] || [];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [editor, setEditor] = useState(null);
  const [selected, setSelected] = useState([]);
  const filtered = rows.filter((row) => `${row.name || row.caption || ''} ${row.slug || ''} ${row.category || ''}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || statusLabel(row) === filter));
  const id = (row) => row.id;
  const setRows = (nextRows) => commit((current) => ({ ...current, servicesContent: { ...current.servicesContent, [config.key]: nextRows } }));
  const save = (draft) => { setRows(rows.some((row) => id(row) === id(draft)) ? rows.map((row) => id(row) === id(draft) ? draft : row) : [draft, ...rows]); setEditor(null); notify(`${config.title} saved.`); };
  const remove = (record) => { if (!window.confirm(`Delete ${record.name || record.caption || 'this record'}?`)) return; setRows(rows.filter((row) => id(row) !== id(record))); setSelected((current) => current.filter((item) => item !== id(record))); notify('Record deleted.'); };
  const bulk = (active) => { setRows(rows.map((row) => selected.includes(id(row)) ? { ...row, active } : row)); setSelected([]); notify(active ? 'Selected records published.' : 'Selected records deactivated.'); };
  const Icon = config.icon;
  return <div className="service-admin-page"><div className="service-admin-toolbar"><div className="service-admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`} /></div><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Published</option><option>Inactive</option></select><button type="button" className="service-admin-primary" onClick={() => setEditor(emptyRecord(config.key, rows.length))}><Plus size={16} />Add {config.title.replace(/s$/, '')}</button></div>{selected.length > 0 && <div className="service-admin-bulk"><strong>{selected.length} selected</strong><button type="button" onClick={() => bulk(true)}>Publish</button><button type="button" onClick={() => bulk(false)}>Deactivate</button></div>}<div className="service-admin-cards">{filtered.map((row) => <article key={id(row)}><label className="service-admin-select"><input type="checkbox" checked={selected.includes(id(row))} onChange={() => setSelected((current) => current.includes(id(row)) ? current.filter((item) => item !== id(row)) : [...current, id(row)])} /></label>{row.image ? <img src={row.image} alt={row.imageAlt || row.alt || ''} /> : <span className="service-admin-card-icon"><Icon size={22} /></span>}<div><span className={`service-admin-status ${row.active === false ? 'off' : ''}`}>{statusLabel(row)}</span><h3>{row.name || row.caption}</h3><p>{row.shortDescription || row.description || row.category || 'Service content record'}</p><small>{row.branches?.join(' · ') || row.branch || `Display order ${row.displayOrder}`}</small></div><footer><button type="button" onClick={() => setEditor(row)}><Edit3 size={15} />Edit</button><button type="button" onClick={() => remove(row)}><Trash2 size={15} />Delete</button></footer></article>)}</div>{!filtered.length && <div className="service-admin-empty"><CircleAlert /><h3>No matching records</h3><p>Adjust the filter or add a new record.</p></div>}{editor && <ResourceEditor resourceKey={config.key} value={editor} onClose={() => setEditor(null)} onSave={save} notify={notify} />}</div>;
}

function ServiceOverview({ state, commit, notify, navigate }) {
  const content = state.servicesContent;
  const [editor, setEditor] = useState(null);
  const stats = [
    ['Published services', content.services.filter((item) => item.active !== false).length, Store, null],
    ['Event types', content.eventTypes.filter((item) => item.active !== false).length, PartyPopper, 'service-events'],
    ['Packages', [...content.eventPackages, ...content.cateringPackages].filter((item) => item.active !== false).length, PackageCheck, 'service-packages'],
    ['New enquiries', state.eventEnquiries.filter((item) => item.status === 'New' && !item.archivedAt).length, Mail, 'service-enquiries'],
  ];
  const saveService = (draft) => {
    commit((current) => ({
      ...current,
      servicesContent: {
        ...current.servicesContent,
        services: current.servicesContent.services.map((service) => service.id === draft.id ? draft : service),
      },
    }));
    setEditor(null);
    notify('Service card published.');
  };
  return <div className="service-admin-overview">
    <div className="service-admin-stat-grid">{stats.map(([label, value, Icon, destination]) => <button key={label} onClick={() => destination ? navigate(destination) : document.querySelector('.service-admin-overview-cards')?.scrollIntoView({ behavior: 'smooth' })}><span><Icon size={18} /></span><small>{label}</small><strong>{value}</strong><ChevronRight size={16} /></button>)}</div>
    <section className="service-admin-panel"><header><div><span>Public experience</span><h2>Services publishing overview</h2><p>These cards feed the public /services detail pages directly.</p></div><a href="/services" target="_blank" rel="noreferrer"><Eye size={15} />Preview Services</a></header><div className="service-admin-overview-cards">{content.services.map((service) => <article key={service.id}><img src={service.image} alt="" /><div><span>{service.serviceType}</span><h3>{service.name}</h3><p>{service.shortDescription}</p><small>{service.active === false ? 'Hidden from website' : 'Published on website'}</small></div><button type="button" onClick={() => setEditor(service)}><Edit3 size={15} />Manage</button></article>)}</div></section>
    <section className="service-admin-panel"><header><div><span>Publishing checklist</span><h2>Ready for customer enquiries</h2></div></header><div className="service-admin-checklist"><span><Check />Capacity is set to {content.settings.eventCapacity} guests</span><span><Check />{content.facilities.filter((item) => item.active !== false).length} verified facilities enabled</span><span><Check />{content.faqs.filter((item) => item.active !== false).length} public FAQs active</span><span><Check />Pricing safely defaults to quotation where no verified amount exists</span></div></section>
    {editor && <ResourceEditor resourceKey="services" value={editor} onClose={() => setEditor(null)} onSave={saveService} notify={notify} />}
  </div>;
}

function ServiceSettings({ state, commit, notify }) {
  const [draft, setDraft] = useState({ ...state.servicesContent.settings, capacityRanges: state.servicesContent.settings.capacityRanges.map((item) => ({ ...item })) });
  const [faqEditor, setFaqEditor] = useState(null);
  const [uploading, setUploading] = useState('');
  const save = () => { commit((current) => ({ ...current, servicesContent: { ...current.servicesContent, settings: draft } })); notify('Service settings published.'); };
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const upload = async (key, file) => { if (!file) return; setUploading(key); const result = await uploadMediaFile(file, 'services/settings'); setUploading(''); if (result.error) { notify(result.error.message || 'Upload failed.'); return; } update(key, result.url); };
  const saveFaq = (faq) => { const exists = state.servicesContent.faqs.some((item) => item.id === faq.id); commit((current) => ({ ...current, servicesContent: { ...current.servicesContent, faqs: exists ? current.servicesContent.faqs.map((item) => item.id === faq.id ? faq : item) : [...current.servicesContent.faqs, faq] } })); setFaqEditor(null); notify('FAQ saved.'); };
  return <div className="service-admin-settings"><section className="service-admin-panel"><header><div><span>Public hero</span><h2>Hero and calls to action</h2><p>Every field below is read by the public Services page.</p></div><button className="service-admin-primary" type="button" onClick={save}><Check size={16} />Save settings</button></header><div className="service-settings-grid"><label>Eyebrow<input value={draft.heroEyebrow || ''} onChange={(event) => update('heroEyebrow', event.target.value)} /></label><label className="wide">Hero headline<input value={draft.heroTitle || ''} onChange={(event) => update('heroTitle', event.target.value)} /></label><label className="wide">Supporting text<textarea rows="3" value={draft.heroText || ''} onChange={(event) => update('heroText', event.target.value)} /></label><label>Maximum capacity<input type="number" min="1" value={draft.eventCapacity || ''} onChange={(event) => update('eventCapacity', Number(event.target.value))} /></label><label>Capacity badge label<input value={draft.capacityBadgeLabel || ''} onChange={(event) => update('capacityBadgeLabel', event.target.value)} /></label><ImageSetting label="Hero image" value={draft.heroImage} field="heroImage" uploading={uploading} update={update} upload={upload} /><label>Hero image alt<input value={draft.heroAlt || ''} onChange={(event) => update('heroAlt', event.target.value)} /></label><label>Event CTA label<input value={draft.eventButtonLabel || ''} onChange={(event) => update('eventButtonLabel', event.target.value)} /></label><label>Catering CTA label<input value={draft.cateringButtonLabel || ''} onChange={(event) => update('cateringButtonLabel', event.target.value)} /></label><label>WhatsApp CTA label<input value={draft.whatsappButtonLabel || ''} onChange={(event) => update('whatsappButtonLabel', event.target.value)} /></label><label>Call CTA label<input value={draft.callButtonLabel || ''} onChange={(event) => update('callButtonLabel', event.target.value)} /></label><label>Default WhatsApp<input value={draft.defaultWhatsapp || ''} onChange={(event) => update('defaultWhatsapp', event.target.value)} placeholder="Uses website number when empty" /></label><label>Notification email<input type="email" value={draft.notificationEmail || ''} onChange={(event) => update('notificationEmail', event.target.value)} /></label></div></section><section className="service-admin-panel"><header><div><span>Capacity ranges</span><h2>Guest-count indicator</h2></div></header><div className="capacity-admin-grid">{draft.capacityRanges.map((range, index) => <div key={range.id}><label>Label<input value={range.label} onChange={(event) => setDraft((current) => ({ ...current, capacityRanges: current.capacityRanges.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))} /></label><label>Range<input value={range.range} onChange={(event) => setDraft((current) => ({ ...current, capacityRanges: current.capacityRanges.map((item, itemIndex) => itemIndex === index ? { ...item, range: event.target.value } : item) }))} /></label><label className="service-admin-check"><input type="checkbox" checked={range.active !== false} onChange={(event) => setDraft((current) => ({ ...current, capacityRanges: current.capacityRanges.map((item, itemIndex) => itemIndex === index ? { ...item, active: event.target.checked } : item) }))} /><span>Enabled</span></label></div>)}</div></section><section className="service-admin-panel"><header><div><span>SEO and final CTA</span><h2>Search and conversion content</h2></div></header><div className="service-settings-grid"><label className="wide">SEO title<input value={draft.seoTitle || ''} onChange={(event) => update('seoTitle', event.target.value)} /></label><label className="wide">SEO description<textarea rows="3" value={draft.seoDescription || ''} onChange={(event) => update('seoDescription', event.target.value)} /></label><label className="wide">Final CTA title<input value={draft.finalTitle || ''} onChange={(event) => update('finalTitle', event.target.value)} /></label><label className="wide">Final CTA text<textarea rows="3" value={draft.finalText || ''} onChange={(event) => update('finalText', event.target.value)} /></label><ImageSetting label="Final CTA image" value={draft.finalImage} field="finalImage" uploading={uploading} update={update} upload={upload} /></div></section><section className="service-admin-panel"><header><div><span>Public FAQ</span><h2>Frequently asked questions</h2></div><button className="service-admin-primary" type="button" onClick={() => setFaqEditor(emptyRecord('faqs', state.servicesContent.faqs.length))}><Plus size={16} />Add FAQ</button></header><div className="service-admin-faq-list">{state.servicesContent.faqs.map((faq) => <button type="button" key={faq.id} onClick={() => setFaqEditor(faq)}><span>{faq.question}</span><small>{faq.active === false ? 'Hidden' : 'Published'}</small><Edit3 size={15} /></button>)}</div></section>{faqEditor && <ResourceEditor resourceKey="faqs" value={faqEditor} onClose={() => setFaqEditor(null)} onSave={saveFaq} notify={notify} />}</div>;
}

function ImageSetting({ label, value, field, uploading, update, upload }) {
  return <div className="service-setting-image"><label>{label}<input value={value || ''} onChange={(event) => update(field, event.target.value)} /></label>{value && <img src={value} alt="Preview" />}<label className="service-admin-upload"><Upload size={14} />{uploading === field ? 'Uploading…' : 'Upload'}<input type="file" accept="image/*" onChange={(event) => upload(field, event.target.files?.[0])} /></label></div>;
}

const enquiryStatuses = ['New', 'Contacted', 'Quotation Sent', 'Follow-Up Required', 'Tentative', 'Confirmed', 'Completed', 'Cancelled', 'Lost'];

function EventEnquiries({ state, commit, notify }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [branch, setBranch] = useState('All branches');
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState(null);
  const rows = state.eventEnquiries.filter((item) => !item.archivedAt);
  const filtered = useMemo(() => rows.filter((item) => `${item.reference} ${item.name} ${item.phone} ${item.eventType}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || item.status === status) && (branch === 'All branches' || item.branch === branch) && (!date || item.eventDate === date)), [rows, query, status, branch, date]);
  const save = (draft) => { commit((current) => ({ ...current, eventEnquiries: current.eventEnquiries.map((item) => item.id === draft.id ? draft : item) })); setSelected(null); notify('Event enquiry updated.'); };
  const exportCsv = () => { const headers = ['reference','name','phone','whatsapp','email','eventType','serviceType','branch','eventDate','startTime','guests','preferredPackage','status','assigned','notes']; const csv = [headers.join(','), ...filtered.map((row) => headers.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const link = document.createElement('a'); link.href = url; link.download = 'naseeb-event-enquiries.csv'; link.click(); URL.revokeObjectURL(url); notify('Event enquiry CSV exported.'); };
  return <div className="service-admin-enquiries"><div className="service-admin-toolbar"><div className="service-admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, name or event..." /></div><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{enquiryStatuses.map((item) => <option key={item}>{item}</option>)}</select><select value={branch} onChange={(event) => setBranch(event.target.value)}><option>All branches</option>{state.branches.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select><input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filter by event date" /><button type="button" onClick={exportCsv}><Download size={15} />Export CSV</button></div><div className="service-enquiry-table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Event</th><th>Branch & date</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.reference}</strong><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small></td><td><strong>{item.name}</strong><small>{item.phone}</small></td><td><strong>{item.eventType}</strong><small>{item.serviceType}</small></td><td><strong>{state.branches.find((entry) => entry.slug === item.branch)?.name || item.branch}</strong><small>{item.eventDate} · {item.startTime}</small></td><td>{item.guests}</td><td><span className={`service-enquiry-status status-${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span></td><td><button type="button" onClick={() => setSelected(item)}>View <ArrowUpRight size={13} /></button></td></tr>)}</tbody></table>{!filtered.length && <div className="service-admin-empty"><Mail /><h3>No event enquiries found</h3><p>New website submissions will appear here automatically.</p></div>}</div>{selected && <EnquiryDrawer value={selected} onClose={() => setSelected(null)} onSave={save} onArchive={(draft) => save({ ...draft, archivedAt: new Date().toISOString() })} notify={notify} />}</div>;
}

function EnquiryDrawer({ value, onClose, onSave, onArchive }) {
  const [draft, setDraft] = useState({ ...value });
  const set = (key, next) => setDraft((current) => ({ ...current, [key]: next }));
  const branchNumber = String(draft.whatsapp || draft.phone || '').replace(/\D/g, '');
  return <div className="service-admin-drawer-backdrop" onMouseDown={onClose}><aside className="service-admin-drawer enquiry-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div><span>{draft.reference}</span><h2>{draft.name}</h2></div><button type="button" onClick={onClose}><X /></button></header><div className="enquiry-contact-actions"><a href={`tel:${String(draft.phone).replace(/\s/g, '')}`}><Phone size={15} />Call</a><a href={`https://wa.me/${branchNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp</a><a href={`mailto:${draft.email}?subject=${encodeURIComponent(`Naseeb Chapati event quotation ${draft.reference}`)}`}><Mail size={15} />Send quotation</a><button type="button" onClick={() => window.print()}><FileText size={15} />Print</button></div><div className="enquiry-detail-grid">{[['Event type',draft.eventType],['Service',draft.serviceType],['Branch',draft.branch],['Date',draft.eventDate],['Start time',draft.startTime],['Guests',draft.guests],['Package',draft.preferredPackage || 'Not selected'],['Budget',draft.estimatedBudget || 'Not provided'],['Delivery',draft.deliveryLocation || 'Not requested'],['Contact method',draft.preferredContactMethod]].map(([label, detail]) => <div key={label}><small>{label}</small><strong>{detail}</strong></div>)}</div><label>Status<select value={draft.status} onChange={(event) => set('status', event.target.value)}>{enquiryStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label>Assigned staff<input value={draft.assigned || ''} onChange={(event) => set('assigned', event.target.value)} /></label><label>Internal notes<textarea rows="5" value={draft.notes || ''} onChange={(event) => set('notes', event.target.value)} /></label><div className="enquiry-customer-request"><small>Customer request</small><p>{draft.specialRequests || 'No special request provided.'}</p></div><footer><button type="button" className="danger" onClick={() => onArchive(draft)}><Trash2 size={15} />Archive</button><button type="button" className="primary" onClick={() => onSave(draft)}><Check size={15} />Save enquiry</button></footer></aside></div>;
}

export default function ServicesAdminPage({ section, state, commit, notify, navigate }) {
  if (section === 'service-enquiries') return <EventEnquiries state={state} commit={commit} notify={notify} />;
  if (section === 'service-settings') return <ServiceSettings state={state} commit={commit} notify={notify} />;
  if (section === 'services-overview') return <ServiceOverview state={state} commit={commit} notify={notify} navigate={navigate} />;
  return <ServicesResource section={sectionMap[section] ? section : 'services'} state={state} commit={commit} notify={notify} />;
}

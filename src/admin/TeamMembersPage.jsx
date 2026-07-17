import { useEffect, useMemo, useState } from 'react';
import {
  Archive, ArrowDownAZ, CheckSquare, ExternalLink, GripVertical, ImagePlus, ListFilter,
  LoaderCircle, Pencil, Plus, RefreshCw, Save, Search, Trash2, Upload, UserRound, X,
} from 'lucide-react';
import {
  createTeamSlug, deleteTeamMembers, isSupabaseConfigured, listAdminTeamMembers,
  reorderTeamMembers, saveTeamMember, updateTeamMembers, uploadMediaFile,
} from '../lib/supabase';
import './teamMembers.css';

const defaultPositions = [
  'Director', 'CEO', 'Managing Director', 'Operations Manager', 'Branch Manager', 'HR Manager',
  'Finance Manager', 'Marketing Manager', 'Executive Chef', 'Head Chef', 'Restaurant Manager',
  'Kitchen Manager', 'Service Manager', 'Digital Marketing Manager', 'Cashier', 'Supervisor', 'Waiter',
];

const emptyMember = {
  full_name: '', slug: '', position: '', department: '', display_order: 0, short_intro: '',
  biography: '', vision: '', quote: '', experience: '', qualification: '', profile_image: '',
  cover_image: '', email: '', phone: '', whatsapp: '', linkedin: '', facebook: '', instagram: '',
  website: '', status: 'Draft', featured: false, seo_title: '', seo_description: '', meta_image: '',
  image_alt: '', gallery_images: [],
};

function dateLabel(value) {
  if (!value) return 'Not saved yet';
  return new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function memberInitials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NC';
}

function StatusPill({ status }) {
  return <span className={`team-admin-status is-${String(status || 'draft').toLowerCase()}`}><i />{status || 'Draft'}</span>;
}

function TeamAvatar({ member }) {
  return member.profile_image
    ? <img src={member.profile_image} alt="" loading="lazy" />
    : <span>{memberInitials(member.full_name)}</span>;
}

function EditorSection({ eyebrow, title, children }) {
  return <section className="team-admin-editor-section"><div><span>{eyebrow}</span><h3>{title}</h3></div>{children}</section>;
}

function TeamMemberEditor({ member, onClose, onSaved, notify }) {
  const [draft, setDraft] = useState({ ...emptyMember, ...member, gallery_images: member?.gallery_images || [] });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const updateName = (value) => setDraft((current) => {
    const previousAutoSlug = createTeamSlug(current.full_name);
    return { ...current, full_name: value, slug: !current.slug || current.slug === previousAutoSlug ? createTeamSlug(value) : current.slug };
  });

  const upload = async (field, event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG, JPG, WebP, or AVIF image up to 5 MB.');
      input.value = '';
      return;
    }
    setError('');
    setUploading(field);
    const result = await uploadMediaFile(file, `team/${field === 'profile_image' ? 'profiles' : field === 'cover_image' ? 'covers' : 'meta'}`);
    setUploading('');
    input.value = '';
    if (result.error) {
      setError(`Upload failed: ${result.error.message}`);
      return;
    }
    update(field, result.url);
    notify('Image uploaded to Supabase Storage. Save the profile to publish the change.');
  };

  const submit = async (event) => {
    event.preventDefault();
    const normalizedSlug = createTeamSlug(draft.slug || draft.full_name);
    if (!draft.full_name.trim() || !draft.position.trim() || !normalizedSlug) {
      setError('Full name, slug, and position are required.');
      return;
    }
    setError('');
    setSaving(true);
    const { data, error: saveError } = await saveTeamMember({ ...draft, slug: normalizedSlug });
    setSaving(false);
    if (saveError) {
      setError(saveError.code === '23505' ? 'That slug is already in use. Choose a unique profile URL.' : saveError.message);
      return;
    }
    onSaved(data);
  };

  return <div className="team-admin-drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="team-admin-drawer" role="dialog" aria-modal="true" aria-labelledby="team-editor-title">
      <header><div><span className="admin-eyebrow">{draft.id ? 'Edit profile' : 'Create profile'}</span><h2 id="team-editor-title">{draft.full_name || 'New Team Member'}</h2></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close team member editor"><X size={18} /></button></header>
      <form onSubmit={submit}>
        {error && <div className="team-admin-error" role="alert">{error}</div>}

        <EditorSection eyebrow="Media" title="Profile imagery">
          <div className="team-admin-image-grid">
            {[['profile_image', 'Profile Photo'], ['cover_image', 'Cover Photo'], ['meta_image', 'Meta Image']].map(([field, label]) => <label className="team-admin-image-upload" key={field}>
              <span className={field}>{draft[field] ? <img src={draft[field]} alt="" /> : <ImagePlus size={24} />}</span>
              <strong>{label}</strong>
              <small>{uploading === field ? 'Uploading...' : 'PNG, JPG, WebP or AVIF'}</small>
              <em><Upload size={13} />Choose image</em>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => upload(field, event)} disabled={Boolean(uploading)} />
            </label>)}
          </div>
          <label>Image Alt<input value={draft.image_alt || ''} onChange={(event) => update('image_alt', event.target.value)} placeholder="Describe the professional portrait" /></label>
        </EditorSection>

        <EditorSection eyebrow="Identity" title="Profile details">
          <div className="team-admin-two-col">
            <label>Full Name *<input value={draft.full_name} onChange={(event) => updateName(event.target.value)} required /></label>
            <label>Slug *<div className="team-admin-slug"><span>/our-team/</span><input value={draft.slug} onChange={(event) => update('slug', createTeamSlug(event.target.value))} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div></label>
            <label>Position *<input list="team-position-options" value={draft.position} onChange={(event) => update('position', event.target.value)} required /><datalist id="team-position-options">{defaultPositions.map((position) => <option value={position} key={position} />)}</datalist></label>
            <label>Department<input value={draft.department || ''} onChange={(event) => update('department', event.target.value)} /></label>
            <label>Display Order<input type="number" min="0" value={draft.display_order} onChange={(event) => update('display_order', Number(event.target.value))} /></label>
            <label>Status<select value={draft.status} onChange={(event) => update('status', event.target.value)}><option>Draft</option><option>Published</option><option>Archived</option></select></label>
          </div>
          <label>Short Introduction<textarea rows="3" value={draft.short_intro || ''} onChange={(event) => update('short_intro', event.target.value)} /></label>
          <label className="team-admin-featured"><input type="checkbox" checked={Boolean(draft.featured)} onChange={(event) => update('featured', event.target.checked)} /><span /><div><strong>Featured leader</strong><small>Featured profiles appear first on the public page.</small></div></label>
        </EditorSection>

        <EditorSection eyebrow="Story" title="Biography and leadership">
          <label>Biography<textarea rows="6" value={draft.biography || ''} onChange={(event) => update('biography', event.target.value)} /></label>
          <label>Vision<textarea rows="5" value={draft.vision || ''} onChange={(event) => update('vision', event.target.value)} /></label>
          <label>Quote<textarea rows="3" value={draft.quote || ''} onChange={(event) => update('quote', event.target.value)} /></label>
          <label>Experience<textarea rows="4" value={draft.experience || ''} onChange={(event) => update('experience', event.target.value)} /></label>
          <label>Qualification<textarea rows="4" value={draft.qualification || ''} onChange={(event) => update('qualification', event.target.value)} /></label>
        </EditorSection>

        <EditorSection eyebrow="Contact" title="Contact and social links">
          <div className="team-admin-two-col">
            <label>Email<input type="email" value={draft.email || ''} onChange={(event) => update('email', event.target.value)} /></label>
            <label>Phone<input type="tel" value={draft.phone || ''} onChange={(event) => update('phone', event.target.value)} /></label>
            <label>WhatsApp<input type="tel" value={draft.whatsapp || ''} onChange={(event) => update('whatsapp', event.target.value)} /></label>
            <label>LinkedIn<input type="url" value={draft.linkedin || ''} onChange={(event) => update('linkedin', event.target.value)} placeholder="https://" /></label>
            <label>Facebook<input type="url" value={draft.facebook || ''} onChange={(event) => update('facebook', event.target.value)} placeholder="https://" /></label>
            <label>Instagram<input type="url" value={draft.instagram || ''} onChange={(event) => update('instagram', event.target.value)} placeholder="https://" /></label>
            <label>Website<input type="url" value={draft.website || ''} onChange={(event) => update('website', event.target.value)} placeholder="https://" /></label>
          </div>
        </EditorSection>

        <EditorSection eyebrow="Optional gallery" title="Profile gallery">
          <label>Gallery image URLs<textarea rows="5" value={(draft.gallery_images || []).join('\n')} onChange={(event) => update('gallery_images', event.target.value.split('\n').map((value) => value.trim()).filter(Boolean))} placeholder="One image URL per line" /></label>
        </EditorSection>

        <EditorSection eyebrow="Search visibility" title="SEO metadata">
          <label>SEO Title<input value={draft.seo_title || ''} onChange={(event) => update('seo_title', event.target.value)} maxLength="70" /></label>
          <label>SEO Description<textarea rows="3" value={draft.seo_description || ''} onChange={(event) => update('seo_description', event.target.value)} maxLength="170" /></label>
        </EditorSection>

        <div className="team-admin-dates"><span>Created: {dateLabel(draft.created_at)}</span><span>Updated: {dateLabel(draft.updated_at)}</span></div>
        <footer><button type="button" className="admin-outline-button" onClick={onClose}>Cancel</button>{draft.id && <a className="admin-outline-button" href={`/our-team/${draft.slug}?preview=1`} target="_blank" rel="noreferrer"><ExternalLink size={14} />Preview</a>}<button className="admin-primary-button" type="submit" disabled={saving || Boolean(uploading)}><Save size={15} />{saving ? 'Saving...' : 'Save Team Member'}</button></footer>
      </form>
    </aside>
  </div>;
}

export default function TeamMembersPage({ notify }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [department, setDepartment] = useState('All departments');
  const [sort, setSort] = useState('display_order');
  const [selected, setSelected] = useState([]);
  const [editor, setEditor] = useState(null);
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await listAdminTeamMembers();
    setLoading(false);
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setMembers(data || []);
  };

  useEffect(() => { void load(); }, []);

  const departments = useMemo(() => [...new Set(members.map((member) => member.department).filter(Boolean))].sort(), [members]);
  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const next = members.filter((member) => {
      const matchesQuery = !lowered || `${member.full_name} ${member.position} ${member.department || ''} ${member.email || ''}`.toLowerCase().includes(lowered);
      return matchesQuery && (status === 'All statuses' || member.status === status) && (department === 'All departments' || member.department === department);
    });
    return next.sort((a, b) => {
      if (sort === 'name') return a.full_name.localeCompare(b.full_name);
      if (sort === 'updated') return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      return a.display_order - b.display_order || a.full_name.localeCompare(b.full_name);
    });
  }, [members, query, status, department, sort]);

  const allSelected = filtered.length > 0 && filtered.every((member) => selected.includes(member.id));
  const toggleAll = () => setSelected(allSelected ? selected.filter((id) => !filtered.some((member) => member.id === id)) : [...new Set([...selected, ...filtered.map((member) => member.id)])]);
  const toggleOne = (id) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  const saved = (member) => {
    setMembers((current) => current.some((item) => item.id === member.id) ? current.map((item) => item.id === member.id ? member : item) : [...current, member]);
    setEditor(null);
    notify(`${member.full_name} saved as ${member.status.toLowerCase()}.`);
  };

  const bulkStatus = async (nextStatus) => {
    if (!selected.length || working) return;
    setWorking(true);
    const { data, error: updateError } = await updateTeamMembers(selected, { status: nextStatus });
    setWorking(false);
    if (updateError) { notify(`Update failed: ${updateError.message}`); return; }
    const changed = new Map(data.map((member) => [member.id, member]));
    setMembers((current) => current.map((member) => changed.get(member.id) || member));
    notify(`${selected.length} team member${selected.length === 1 ? '' : 's'} moved to ${nextStatus.toLowerCase()}.`);
    setSelected([]);
  };

  const remove = async (ids) => {
    if (!ids.length || working || !window.confirm(`Permanently delete ${ids.length} team member${ids.length === 1 ? '' : 's'}?`)) return;
    setWorking(true);
    const { error: deleteError } = await deleteTeamMembers(ids);
    setWorking(false);
    if (deleteError) { notify(`Delete failed: ${deleteError.message}`); return; }
    setMembers((current) => current.filter((member) => !ids.includes(member.id)));
    setSelected((current) => current.filter((id) => !ids.includes(id)));
    notify(`${ids.length} team member${ids.length === 1 ? '' : 's'} deleted.`);
  };

  const dropOn = async (targetId) => {
    if (!dragging || dragging === targetId) { setDragging(''); return; }
    const before = members;
    const ordered = [...members].sort((a, b) => a.display_order - b.display_order || a.full_name.localeCompare(b.full_name));
    const sourceIndex = ordered.findIndex((member) => member.id === dragging);
    const targetIndex = ordered.findIndex((member) => member.id === targetId);
    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    const next = ordered.map((member, index) => ({ ...member, display_order: index }));
    setMembers(next);
    setDragging('');
    const { error: reorderError } = await reorderTeamMembers(next);
    if (reorderError) {
      setMembers(before);
      notify(`Ordering failed: ${reorderError.message}`);
      return;
    }
    notify('Team display order updated.');
  };

  if (!isSupabaseConfigured) return <section className="team-admin-setup"><UserRound size={32} /><h2>Supabase connection required</h2><p>Team Members are intentionally database-only. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then run the team_members schema.</p></section>;

  return <section className="team-admin-page">
    <div className="team-admin-toolbar">
      <label className="admin-search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team members..." /></label>
      <label><ListFilter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter team members by status"><option>All statuses</option><option>Published</option><option>Draft</option><option>Archived</option></select></label>
      <label><ListFilter size={15} /><select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter team members by department"><option>All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><ArrowDownAZ size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort team members"><option value="display_order">Display order</option><option value="name">Name</option><option value="updated">Recently updated</option></select></label>
      <button className="admin-outline-button" type="button" onClick={load}><RefreshCw size={15} />Refresh</button>
      <button className="admin-primary-button" type="button" onClick={() => setEditor({ ...emptyMember, display_order: members.length })}><Plus size={16} />Add Team Member</button>
    </div>

    {selected.length > 0 && <div className="team-admin-bulkbar"><span><CheckSquare size={16} />{selected.length} selected</span><button type="button" onClick={() => bulkStatus('Published')} disabled={working}>Publish</button><button type="button" onClick={() => bulkStatus('Draft')} disabled={working}>Move to Draft</button><button type="button" onClick={() => bulkStatus('Archived')} disabled={working}><Archive size={14} />Archive</button><button type="button" onClick={() => remove(selected)} disabled={working}><Trash2 size={14} />Delete</button><button type="button" onClick={() => setSelected([])}>Clear</button></div>}

    <div className="team-admin-table-panel">
      <div className="team-admin-table-head"><span>{filtered.length} team member{filtered.length === 1 ? '' : 's'}</span><small><GripVertical size={13} />Drag rows to change the public display order</small></div>
      {loading && <div className="team-admin-loading"><LoaderCircle size={22} />Loading team members...</div>}
      {!loading && error && <div className="team-admin-empty" role="alert"><UserRound size={26} /><h3>Team Members could not be loaded.</h3><p>{error}</p><button className="admin-primary-button" type="button" onClick={load}><RefreshCw size={15} />Try again</button></div>}
      {!loading && !error && filtered.length === 0 && <div className="team-admin-empty"><UserRound size={28} /><h3>{members.length ? 'No team members match these filters.' : 'No team members yet.'}</h3><p>{members.length ? 'Clear a filter or search for another profile.' : 'Add the Director, CEO, or any future role from this database-driven module.'}</p><button className="admin-primary-button" type="button" onClick={() => setEditor({ ...emptyMember, display_order: members.length })}><Plus size={15} />Add Team Member</button></div>}
      {!loading && !error && filtered.length > 0 && <div className="team-admin-table-wrap"><table className="team-admin-table"><thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all visible team members" /></th><th>Order</th><th>Team Member</th><th>Position</th><th>Department</th><th>Status</th><th>Updated</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.map((member) => <tr key={member.id} draggable={sort === 'display_order'} onDragStart={() => setDragging(member.id)} onDragEnd={() => setDragging('')} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOn(member.id)} className={dragging === member.id ? 'is-dragging' : ''}><td><input type="checkbox" checked={selected.includes(member.id)} onChange={() => toggleOne(member.id)} aria-label={`Select ${member.full_name}`} /></td><td><span className="team-admin-drag"><GripVertical size={16} />{member.display_order + 1}</span></td><td><div className="team-admin-person"><TeamAvatar member={member} /><div><strong>{member.full_name}</strong><small>/our-team/{member.slug}</small></div></div></td><td>{member.position}</td><td>{member.department || '—'}</td><td><StatusPill status={member.status} />{member.featured && <small className="team-admin-featured-tag">Featured</small>}</td><td><small>{dateLabel(member.updated_at)}</small></td><td><div className="team-admin-row-actions"><a href={`/our-team/${member.slug}?preview=1`} target="_blank" rel="noreferrer" aria-label={`Preview ${member.full_name}`}><ExternalLink size={15} /></a><button type="button" onClick={() => setEditor(member)} aria-label={`Edit ${member.full_name}`}><Pencil size={15} /></button><button type="button" onClick={() => remove([member.id])} aria-label={`Delete ${member.full_name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
    </div>
    {editor && <TeamMemberEditor member={editor} onClose={() => setEditor(null)} onSaved={saved} notify={notify} />}
  </section>;
}

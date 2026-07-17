import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const CONTENT_ROW_ID = 'default';
const CONTENT_STORAGE_KEY = 'naseeb-admin-state-v1';
export const MEDIA_BUCKET = 'naseeb-media';

export async function uploadMediaFile(file, folder = 'gallery') {
  if (!supabase) return { path: '', url: '', error: new Error('Supabase Storage is not configured.') };
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const uniqueName = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeFolder = String(folder || 'gallery').replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'gallery';
  const path = `${safeFolder}/${uniqueName}.${extension}`;
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (error) return { path: '', url: '', error };
  const { data: publicUrl } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(data.path);
  return { path: data.path, url: publicUrl.publicUrl, error: null };
}

export async function removeMediaFile(path) {
  if (!supabase || !path) return { error: null };
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  return { error };
}

export async function submitReservation(payload) {
  if (!supabase) return { data: null, error: null, source: 'local-preview' };
  const { data, error } = await supabase
    .from('naseeb_reservations')
    .insert({
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || null,
      branch: payload.branch,
      reservation_date: payload.date,
      reservation_time: payload.time,
      guests: Number(payload.guests),
      special_request: payload.request?.trim() || null,
      status: 'New',
    });
  return { data, error, source: 'supabase' };
}

export async function submitEnquiry(payload) {
  if (!supabase) return { data: null, error: null, source: 'local-preview' };
  const { data, error } = await supabase
    .from('naseeb_enquiries')
    .insert({
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      branch: payload.branch,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      status: 'New',
    });
  return { data, error, source: 'supabase' };
}

export function createEventEnquiryReference() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NC-EVT-${stamp}-${random}`;
}

export async function submitEventEnquiry(payload) {
  const reference = payload.reference || createEventEnquiryReference();
  if (!supabase) return { data: { reference }, error: null, source: 'local-preview' };
  const { error } = await supabase
    .from('naseeb_event_enquiries')
    .insert({
      reference,
      name: String(payload.name || '').trim(),
      phone: String(payload.phone || '').trim(),
      whatsapp: String(payload.whatsapp || '').trim() || null,
      email: String(payload.email || '').trim() || null,
      event_type: payload.eventType,
      service_type: payload.serviceType,
      branch: payload.branch,
      event_date: payload.eventDate,
      start_time: payload.startTime,
      guests: Number(payload.guests),
      event_space_required: Boolean(payload.eventSpaceRequired),
      catering_required: Boolean(payload.cateringRequired),
      delivery_location: String(payload.deliveryLocation || '').trim() || null,
      preferred_package: payload.preferredPackage || null,
      estimated_budget: String(payload.estimatedBudget || '').trim() || null,
      decoration_required: Boolean(payload.decorationRequired),
      special_requests: String(payload.specialRequests || '').trim() || null,
      preferred_contact_method: payload.preferredContactMethod || 'WhatsApp',
      consent: Boolean(payload.consent),
      status: 'New',
    });
  return { data: { reference }, error, source: 'supabase' };
}

export async function loadPublicContentCache() {
  if (!supabase) return { ok: false, source: 'local', error: null };

  const { data, error } = await supabase
    .from('naseeb_content_state')
    .select('payload')
    .eq('id', CONTENT_ROW_ID)
    .maybeSingle();

  if (error || !data?.payload || typeof window === 'undefined') {
    return { ok: false, source: 'local', error };
  }

  try {
    const current = JSON.parse(window.localStorage.getItem(CONTENT_STORAGE_KEY) || '{}');
    window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify({ ...current, ...data.payload }));
    return { ok: true, source: 'supabase', error: null };
  } catch (storageError) {
    return { ok: false, source: 'local', error: storageError };
  }
}

const TEAM_MEMBER_COLUMNS = 'id, full_name, slug, position, department, short_intro, biography, vision, quote, experience, qualification, profile_image, cover_image, email, phone, whatsapp, linkedin, facebook, instagram, website, featured, display_order, status, seo_title, seo_description, meta_image, image_alt, gallery_images, created_at, updated_at';

export function createTeamSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeTeamMember(member) {
  if (!member) return member;
  return {
    ...member,
    gallery_images: Array.isArray(member.gallery_images) ? member.gallery_images.filter(Boolean) : [],
    display_order: Number.isFinite(Number(member.display_order)) ? Number(member.display_order) : 0,
    featured: Boolean(member.featured),
  };
}

function teamMemberPayload(member) {
  const nullableFields = [
    'department', 'short_intro', 'biography', 'vision', 'quote', 'experience', 'qualification',
    'profile_image', 'cover_image', 'email', 'phone', 'whatsapp', 'linkedin', 'facebook',
    'instagram', 'website', 'seo_title', 'seo_description', 'meta_image', 'image_alt',
  ];
  const payload = {
    full_name: String(member.full_name || '').trim(),
    slug: createTeamSlug(member.slug || member.full_name),
    position: String(member.position || '').trim(),
    featured: Boolean(member.featured),
    display_order: Math.max(0, Number(member.display_order) || 0),
    status: ['Draft', 'Published', 'Archived'].includes(member.status) ? member.status : 'Draft',
    gallery_images: Array.isArray(member.gallery_images) ? member.gallery_images.filter(Boolean) : [],
  };
  nullableFields.forEach((field) => {
    const value = typeof member[field] === 'string' ? member[field].trim() : member[field];
    payload[field] = value || null;
  });
  return payload;
}

export async function listPublishedTeamMembers() {
  if (!supabase) return { data: [], error: new Error('Supabase is not configured.') };
  const { data, error } = await supabase
    .from('team_members')
    .select(TEAM_MEMBER_COLUMNS)
    .eq('status', 'Published')
    .order('featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('full_name', { ascending: true });
  return { data: (data || []).map(normalizeTeamMember), error };
}

export async function getTeamMemberBySlug(slug, { preview = false } = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };
  let query = supabase
    .from('team_members')
    .select(TEAM_MEMBER_COLUMNS)
    .eq('slug', createTeamSlug(slug));
  if (!preview) query = query.eq('status', 'Published');
  const { data, error } = await query.maybeSingle();
  return { data: normalizeTeamMember(data), error };
}

export async function listAdminTeamMembers() {
  if (!supabase) return { data: [], error: new Error('Supabase is not configured.') };
  const { data, error } = await supabase
    .from('team_members')
    .select(TEAM_MEMBER_COLUMNS)
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false });
  return { data: (data || []).map(normalizeTeamMember), error };
}

export async function saveTeamMember(member) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') };
  const payload = teamMemberPayload(member);
  const query = member.id
    ? supabase.from('team_members').update(payload).eq('id', member.id)
    : supabase.from('team_members').insert(payload);
  const { data, error } = await query.select(TEAM_MEMBER_COLUMNS).single();
  return { data: normalizeTeamMember(data), error };
}

export async function updateTeamMembers(ids, changes) {
  if (!supabase) return { data: [], error: new Error('Supabase is not configured.') };
  if (!ids.length) return { data: [], error: null };
  const allowed = {};
  if (changes.status && ['Draft', 'Published', 'Archived'].includes(changes.status)) allowed.status = changes.status;
  if (typeof changes.featured === 'boolean') allowed.featured = changes.featured;
  const { data, error } = await supabase
    .from('team_members')
    .update(allowed)
    .in('id', ids)
    .select(TEAM_MEMBER_COLUMNS);
  return { data: (data || []).map(normalizeTeamMember), error };
}

export async function deleteTeamMembers(ids) {
  if (!supabase) return { error: new Error('Supabase is not configured.') };
  if (!ids.length) return { error: null };
  const { error } = await supabase.from('team_members').delete().in('id', ids);
  return { error };
}

export async function reorderTeamMembers(members) {
  if (!supabase) return { error: new Error('Supabase is not configured.') };
  const results = await Promise.all(
    members.map((member, index) => supabase
      .from('team_members')
      .update({ display_order: index })
      .eq('id', member.id)),
  );
  return { error: results.find((result) => result.error)?.error || null };
}

export { CONTENT_ROW_ID };

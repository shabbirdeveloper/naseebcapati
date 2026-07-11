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

export async function uploadMediaFile(file) {
  if (!supabase) return { path: '', url: '', error: new Error('Supabase Storage is not configured.') };
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const uniqueName = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `gallery/${uniqueName}.${extension}`;
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

export { CONTENT_ROW_ID };

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowUpRight, BarChart3, Bell, CalendarCheck, CalendarDays, Check, CheckCircle2, CheckSquare, ChevronDown, ChevronRight, CircleAlert, Clock3, Command, Copy, Database, Download, DollarSign, Edit3, ExternalLink, Eye, FileText, Globe2, ImagePlus, Images, Inbox, LayoutDashboard, ListFilter, LockKeyhole, LogOut, MapPin, Menu as MenuIcon, MoreHorizontal, PanelsTopLeft, Plus, RefreshCw, Save, Search, Settings, Share2, ShieldAlert, ShieldCheck, SlidersHorizontal, Star, TableProperties, Tags, TicketPercent, Trash2, TrendingUp, Upload, UserCheck, UserRound, Users, Utensils, Wallet, X,
} from 'lucide-react';
import {
  clearAdminSession, loadAdminState, persistAdminState, readAdminSession, readAdminState, roleCatalog, saveAdminSession, saveAdminState, sessionFromSupabaseUser, signInAdmin, signOutAdmin,
} from './adminData';
import WebsiteContentPage from './WebsiteContentPage';
import TeamMembersPage from './TeamMembersPage';
import { FinancePage, HrPage } from './crmPages';
import { isSupabaseConfigured, removeMediaFile, supabase, uploadMediaFile } from '../lib/supabase';
import './admin.css';

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'website', label: 'Website Content', icon: PanelsTopLeft, children: [{ id: 'website', label: 'Homepage' }, { id: 'team', label: 'Team Members' }] },
  { id: 'menu', label: 'Menu Management', icon: Utensils, children: [{ id: 'menu', label: 'Menu Items' }, { id: 'categories', label: 'Categories' }] },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'promotions', label: 'Promotions', icon: TicketPercent },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'reservations', label: 'Reservations', icon: CalendarDays },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'hr', label: 'HR & Staff', icon: UserCheck },
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'seo', label: 'SEO', icon: Globe2 },
  { id: 'media', label: 'Media Library', icon: ImagePlus },
  { id: 'users', label: 'Admin Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const pageMeta = {
  dashboard: ['Dashboard', 'Overview', 'A live view of your restaurant website operations.'],
  website: ['Website Content', 'Content workspace', 'Shape the homepage without changing code.'],
  team: ['Website Content', 'Team Members', 'Manage leadership profiles, publishing, contact details, and public display order.'],
  menu: ['Menu Management', 'Menu Items', 'Manage dishes, prices, availability, and publishing.'],
  categories: ['Menu Management', 'Categories', 'Organise the menu into clear, discoverable groups.'],
  branches: ['Branches', 'Branch Directory', 'Manage branch details, hours, and availability.'],
  promotions: ['Promotions', 'Offers', 'Schedule, publish, and retire promotions.'],
  gallery: ['Gallery', 'Gallery Items', 'Curate food, interior, staff, and events imagery.'],
  reviews: ['Reviews', 'Customer Reviews', 'Approve, feature, and manage public reviews.'],
  reservations: ['Reservations', 'Reservation Inbox', 'Respond to table requests and assign follow-up.'],
  enquiries: ['Enquiries', 'Contact Enquiries', 'Route customer questions to the right team.'],
  finance: ['Finance', 'Income & Expenses', 'Track restaurant income, expenses, profit, and cash flow by branch.'],
  hr: ['HR & Staff', 'People Operations', 'Manage staff records, attendance, leave, and payroll planning.'],
  social: ['Social Media', 'Social Accounts', 'Control the links shown across the public website.'],
  seo: ['SEO', 'SEO Metadata', 'Keep page titles, descriptions, and index settings current.'],
  media: ['Media Library', 'Media Library', 'Review and reuse the site’s image inventory.'],
  users: ['Admin Users', 'Users & Roles', 'Control access and review staff activity.'],
  settings: ['Settings', 'Website Settings', 'Configure operational defaults and security posture.'],
};

const roleAccess = {
  super_admin: ['*'],
  content_manager: ['dashboard', 'website', 'team', 'menu', 'categories', 'promotions', 'gallery', 'social', 'seo', 'media'],
  branch_manager: ['dashboard', 'branches', 'team', 'menu', 'promotions', 'gallery', 'reservations', 'enquiries', 'hr'],
  reservation_manager: ['dashboard', 'reservations', 'enquiries'],
  viewer: ['dashboard', 'team', 'menu', 'categories', 'branches', 'promotions', 'gallery', 'reviews', 'reservations', 'enquiries', 'finance', 'hr', 'social', 'seo', 'media'],
};

const resourceConfig = {
  menu: { key: 'menuItems', title: 'Menu Items', description: 'Manage dishes, prices, badges, stock, and branch availability.', add: 'Add Menu Item', search: 'Search menu items...', empty: 'No menu items match your filters.' },
  categories: { key: 'categories', title: 'Categories', description: 'Keep menu categories ordered, featured, and easy to browse.', add: 'Add Category', search: 'Search categories...', empty: 'No categories match your filters.' },
  branches: { key: 'branches', title: 'Branch Directory', description: 'Independent branch details, hours, contacts, and facilities.', add: 'Add Branch', search: 'Search branches...', empty: 'No branches match your filters.' },
  promotions: { key: 'promotions', title: 'Promotions', description: 'Schedule, publish, and expire offers without touching the public code.', add: 'Add Promotion', search: 'Search promotions...', empty: 'No promotions match your filters.' },
  gallery: { key: 'gallery', title: 'Gallery Items', description: 'Publish food, interiors, events, customers, staff, and behind-the-scenes images.', add: 'Add Gallery Image', search: 'Search gallery...', empty: 'No gallery items match your filters.' },
  reviews: { key: 'reviews', title: 'Customer Reviews', description: 'Approve and feature public review content by branch and source.', add: 'Add Review', search: 'Search reviews...', empty: 'No reviews match your filters.' },
  reservations: { key: 'reservations', title: 'Reservation Inbox', description: 'Search, confirm, assign, and follow up on table requests.', add: 'Add Reservation', search: 'Search reservations...', empty: 'No reservations match your filters.' },
  enquiries: { key: 'enquiries', title: 'Contact Enquiries', description: 'Keep customer messages moving from new to resolved.', add: 'Add Enquiry', search: 'Search enquiries...', empty: 'No enquiries match your filters.' },
  social: { key: 'social', title: 'Social Accounts', description: 'Manage social and delivery links surfaced across the public site.', add: 'Add Social Account', search: 'Search accounts...', empty: 'No social accounts match your filters.' },
  seo: { key: 'seo', title: 'SEO Metadata', description: 'Edit page titles, descriptions, and publishing status.', add: 'Add SEO Record', search: 'Search pages...', empty: 'No SEO records match your filters.' },
};

function getAdminView() {
  const value = window.location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
  return value || 'dashboard';
}

function goAdmin(view) {
  const destination = view === 'dashboard' ? '/admin' : `/admin/${view}`;
  window.history.pushState({}, '', destination);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hasAccess(session, view) {
  const access = roleAccess[session?.role] || [];
  return access.includes('*') || access.includes(view);
}

function roleLabel(role) {
  return roleCatalog.find((item) => item.key === role)?.label || 'Viewer';
}

function formatCurrency(value) {
  if (value == null || value === '') return 'Ask in branch';
  return `RM ${Number(value).toFixed(2).replace('.00', '')}`;
}

function statusTone(status) {
  const key = String(status || '').toLowerCase().replace(/\s/g, '-');
  if (['published', 'approved', 'confirmed', 'completed', 'active', 'available', 'resolved'].includes(key)) return 'positive';
  if (['new', 'pending', 'in-progress', 'draft', 'scheduled'].includes(key)) return 'attention';
  if (['inactive', 'cancelled', 'expired', 'sold-out', 'spam', 'archived'].includes(key)) return 'muted';
  return 'neutral';
}

function StatusBadge({ status }) { return <span className={`admin-status ${statusTone(status)}`}><i />{status}</span>; }

function AdminLoginPreview({ onLogin }) {
  const [form, setForm] = useState({ email: 'naseebchapatinanpg@gmail.com', password: '', role: 'super_admin' });
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!form.email.includes('@') || form.password.length < 8) { setError('Enter a valid email and a password with at least 8 characters.'); return; }
    setError('');
    onLogin({ name: form.email.split('@')[0].replace(/[._-]/g, ' '), email: form.email, role: form.role, avatar: form.email.slice(0, 2).toUpperCase() });
  };
  return <div className="admin-auth"><div className="admin-auth-art"><div className="admin-auth-grid" /><div className="admin-auth-copy"><img src="/naseeb-chapati-logo.png" alt="Naseeb Chapati Restaurant" /><p className="admin-kicker">Restaurant operations workspace</p><h1>Keep the table moving.</h1><p>Manage your content, branches, promotions, and reservations from one secure workspace.</p><div className="admin-auth-points"><span><CheckCircle2 size={16} />Role-aware access</span><span><ShieldCheck size={16} />Session-protected admin route</span><span><Activity size={16} />Audit-ready activity trail</span></div></div></div><div className="admin-auth-panel"><div className="admin-auth-brand"><img src="/naseeb-chapati-logo.png" alt="Naseeb Chapati Restaurant" /><span>Admin Console</span></div><div className="admin-auth-heading"><span className="admin-eyebrow">Welcome back</span><h2>Sign in to continue</h2><p>Use your staff account to manage naseebchapati.com.</p></div><form onSubmit={submit} className="admin-form"><label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="username" /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} autoComplete="current-password" placeholder="At least 8 characters" /></label><label>Preview role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roleCatalog.map((role) => <option value={role.key} key={role.key}>{role.label}</option>)}</select></label>{error && <div className="admin-form-error"><CircleAlert size={16} />{error}</div>}<button className="admin-primary-button admin-submit" type="submit"><LockKeyhole size={17} />Sign in securely</button></form><div className="admin-auth-foot"><button type="button" className="admin-link-button">Forgot password?</button><span>Preview mode · connect server auth before production</span></div></div></div>;
}

function AdminLogin({ onLogin, authMode }) {
  const [form, setForm] = useState({ email: 'naseebchapatinanpg@gmail.com', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!form.email.includes('@') || form.password.length < 8) {
      setError('Enter a valid email and a password with at least 8 characters.');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await onLogin({ ...form, name: form.email.split('@')[0].replace(/[._-]/g, ' '), avatar: form.email.slice(0, 2).toUpperCase(), role: 'super_admin' });
    setSubmitting(false);
    if (result?.error) setError(result.error);
  };
  return <div className="admin-auth"><div className="admin-auth-art"><div className="admin-auth-grid" /><div className="admin-auth-copy"><img src="/naseeb-chapati-logo.png" alt="Naseeb Chapati Restaurant" /><p className="admin-kicker">Restaurant operations workspace</p><h1>Keep the table moving.</h1><p>Manage your content, branches, promotions, and reservations from one secure workspace.</p><div className="admin-auth-points"><span><CheckCircle2 size={16} />Role-aware access</span><span><ShieldCheck size={16} />Session-protected admin route</span><span><Activity size={16} />Audit-ready activity trail</span></div></div></div><div className="admin-auth-panel"><div className="admin-auth-brand"><img src="/naseeb-chapati-logo.png" alt="Naseeb Chapati Restaurant" /><span>Admin Console</span></div><div className="admin-auth-heading"><span className="admin-eyebrow">Welcome back</span><h2>Sign in to continue</h2><p>Use your staff account to manage naseebchapati.com.</p></div><form onSubmit={submit} className="admin-form"><label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="username" /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} autoComplete="current-password" placeholder="At least 8 characters" /></label>{authMode ? <div className="admin-auth-mode"><Database size={16} /><span>Supabase Auth is connected. Use a staff account created in Supabase.</span></div> : <div className="admin-auth-mode"><Database size={16} /><span>Preview mode is active until server authentication is configured.</span></div>}{error && <div className="admin-form-error"><CircleAlert size={16} />{error}</div>}<button className="admin-primary-button admin-submit" type="submit" disabled={submitting}><LockKeyhole size={17} />{submitting ? 'Signing in…' : 'Sign in securely'}</button></form><div className="admin-auth-foot"><button type="button" className="admin-link-button">Forgot password?</button><span>{authMode ? 'Protected by Supabase Auth' : 'Local preview mode'}</span></div></div></div>;
}

function AdminApp() {
  const [session, setSession] = useState(() => (isSupabaseConfigured ? null : readAdminSession()));
  const [state, setState] = useState(readAdminState());
  const [view, setView] = useState(getAdminView());
  const [booting, setBooting] = useState(isSupabaseConfigured);
  const [dataSource, setDataSource] = useState(isSupabaseConfigured ? 'connecting' : 'local');
  const [syncState, setSyncState] = useState(isSupabaseConfigured ? 'connecting' : 'local');
  useEffect(() => { const onPopState = () => setView(getAdminView()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  useEffect(() => { document.title = session ? `${pageMeta[view]?.[1] || 'Admin'} | Naseeb Chapati Admin` : 'Admin Login | Naseeb Chapati Restaurant'; }, [session, view]);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setBooting(false); return undefined; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session?.user) { clearAdminSession(); setBooting(false); setSyncState('signed-out'); return; }
      const next = saveAdminSession({ ...sessionFromSupabaseUser(data.session.user), signedInAt: new Date().toISOString() });
      const loaded = await loadAdminState();
      if (cancelled) return;
      setState(loaded.state); setSession(next); setDataSource(loaded.source); setSyncState(loaded.source === 'supabase' ? 'synced' : 'error'); setBooting(false);
    })();
    return () => { cancelled = true; };
  }, []);
  const login = async (next) => {
    if (!isSupabaseConfigured) {
      setSession(saveAdminSession({ ...next, signedInAt: new Date().toISOString() }));
      return { ok: true };
    }
    const { data, error } = await signInAdmin(next);
    if (error) return { error: error.message || 'Unable to sign in. Check your Supabase staff account.' };
    const signedIn = saveAdminSession({ ...sessionFromSupabaseUser(data.user), signedInAt: new Date().toISOString() });
    const loaded = await loadAdminState();
    setState(loaded.state); setDataSource(loaded.source); setSyncState(loaded.source === 'supabase' ? 'synced' : 'error'); setSession(signedIn);
    return { ok: true };
  };
  const logout = async () => { await signOutAdmin(); clearAdminSession(); setSession(null); };
  const commit = (updater) => setState((current) => { const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }; saveAdminState(next); if (isSupabaseConfigured) { setSyncState('saving'); void persistAdminState(next).then((result) => { setDataSource(result.source); setSyncState(result.ok ? 'synced' : 'error'); }); } return next; });
  if (booting) return <div className="admin-loading-screen"><img src="/naseeb-chapati-logo.png" alt="Naseeb Chapati" /><span>Connecting to the admin workspace…</span></div>;
  if (!session) return <AdminLogin onLogin={login} authMode={isSupabaseConfigured} />;
  return <AdminShell session={session} state={state} view={view} setView={setView} commit={commit} onLogout={logout} syncState={syncState} dataSource={dataSource} />;
}

function AdminShell({ session, state, view, setView, commit, onLogout, syncState, dataSource }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [toast, setToast] = useState('');
  const meta = pageMeta[view] || pageMeta.dashboard;
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  const selectView = (next) => { if (!hasAccess(session, next)) { notify('Your current role does not have access to this area.'); return; } goAdmin(next); setView(next); setSidebarOpen(false); };
  const unread = state.notifications.filter((notification) => !notification.read).length;
  return <div className={`admin-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
      <div className="admin-sidebar-head"><a href="/" className="admin-logo" onClick={(event) => { event.preventDefault(); window.location.href = '/'; }}><img src="/naseeb-chapati-logo.png" alt="Naseeb Chapati Restaurant" /><span><strong>Naseeb Chapati</strong><small>Admin Console</small></span></a><button className="admin-icon-button admin-mobile-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <div className="admin-workspace"><span className="admin-workspace-dot" />Production workspace</div>
      <nav className="admin-nav" aria-label="Admin navigation">{navigation.map((item) => { const Icon = item.icon; const active = view === item.id || item.children?.some((child) => child.id === view); return <div key={item.id} className={`admin-nav-group ${active ? 'is-active' : ''}`}><button className="admin-nav-item" onClick={() => selectView(item.id)} disabled={!hasAccess(session, item.id)}><Icon size={17} /><span>{item.label}</span>{item.children && <ChevronDown size={14} className="admin-nav-chevron" />}</button>{item.children && active && <div className="admin-nav-children">{item.children.map((child) => <button key={child.id} className={view === child.id ? 'active' : ''} onClick={() => selectView(child.id)} disabled={!hasAccess(session, child.id)}>{child.label}</button>)}</div>}</div>; })}</nav>
      <div className="admin-sidebar-foot"><button className="admin-nav-item" onClick={onLogout}><LogOut size={17} /><span>Logout</span></button><div className="admin-security-note"><ShieldCheck size={16} /><div><strong>Protected workspace</strong><small>Session expires on logout</small></div></div></div>
    </aside>
    {sidebarOpen && <button className="admin-sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
    <div className="admin-main">
      <header className="admin-topbar"><div className="admin-topbar-left"><button className="admin-icon-button admin-sidebar-toggle" aria-label="Toggle sidebar" onClick={() => { if (window.innerWidth < 760) setSidebarOpen(true); else setSidebarCollapsed((value) => !value); }}><MenuIcon size={20} /></button><div className="admin-breadcrumbs"><span>{meta[0]}</span><ChevronRight size={14} /><strong>{meta[1]}</strong></div></div><div className="admin-topbar-actions"><label className="admin-global-search"><Search size={16} /><input placeholder="Search anything..." aria-label="Global search" /></label><div className="admin-topbar-menu"><button className="admin-icon-button admin-notification-button" aria-label="Notifications" onClick={() => setNotificationOpen((value) => !value)}><Bell size={18} />{unread > 0 && <b>{unread}</b>}</button>{notificationOpen && <NotificationMenu notifications={state.notifications} />}</div><a href="/" className="admin-preview-button" target="_blank" rel="noreferrer"><Eye size={16} />Preview website</a><div className="admin-topbar-menu"><button className="admin-primary-button admin-quick-button" onClick={() => setQuickAddOpen((value) => !value)}><Plus size={16} />Quick Add</button>{quickAddOpen && <QuickAddMenu onSelect={(next) => { selectView(next); setQuickAddOpen(false); }} />}</div><div className="admin-topbar-menu"><button className="admin-profile-button" onClick={() => setProfileOpen((value) => !value)}><span className="admin-avatar">{session.avatar || 'AU'}</span><span className="admin-profile-copy"><strong>{session.name}</strong><small>{roleLabel(session.role)}</small></span><ChevronDown size={14} /> </button>{profileOpen && <div className="admin-popover admin-profile-popover"><div className="admin-profile-popover-head"><span className="admin-avatar large">{session.avatar || 'AU'}</span><div><strong>{session.email}</strong><small>{roleLabel(session.role)}</small></div></div><button onClick={() => selectView('settings')}><Settings size={15} />Account settings</button><button onClick={onLogout}><LogOut size={15} />Logout</button></div>}</div></div></header>
      <main className="admin-content"><div className="admin-page-intro"><div><span className="admin-eyebrow">{meta[0]}</span><h1>{meta[1]}</h1><p>{meta[2]}</p></div><div className="admin-page-intro-actions"><span className={`admin-last-sync sync-${syncState}`}><Database size={14} />{syncState === 'saving' ? 'Saving to Supabase…' : syncState === 'synced' ? 'Synced to Supabase' : dataSource === 'local' ? 'Local fallback' : syncState === 'error' ? 'Database setup needed' : 'Connecting…'}</span></div></div><AdminView view={view} session={session} state={state} commit={commit} notify={notify} selectView={selectView} /></main>
    </div>
    {toast && <div className="admin-toast"><CheckCircle2 size={17} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button></div>}
  </div>;
}

function NotificationMenu({ notifications }) { return <div className="admin-popover admin-notification-popover"><div className="admin-popover-heading"><strong>Notifications</strong><button className="admin-link-button">Mark all read</button></div>{notifications.map((notification) => <div className={`admin-notification ${notification.read ? 'read' : ''}`} key={notification.id}><span className="admin-notification-icon"><Bell size={14} /></span><div><strong>{notification.title}</strong><p>{notification.detail}</p><small>{notification.time}</small></div></div>)}<button className="admin-popover-footer">View notification centre <ArrowUpRight size={14} /></button></div>; }
function QuickAddMenu({ onSelect }) { return <div className="admin-popover admin-quick-popover"><strong>Quick Add</strong>{[['menu', 'Menu item', Utensils], ['team', 'Team member', UserRound], ['finance', 'Finance transaction', Wallet], ['hr', 'Staff member', UserCheck], ['promotions', 'Promotion', TicketPercent], ['branches', 'Branch', MapPin], ['gallery', 'Gallery image', ImagePlus], ['social', 'Social link', Share2]].map(([id, label, Icon]) => <button key={id} onClick={() => onSelect(id)}><Icon size={15} /><span>{label}</span><Plus size={14} /></button>)}</div>; }

function AdminView({ view, session, state, commit, notify, selectView }) {
  if (!hasAccess(session, view)) return <AccessDenied />;
  if (view === 'dashboard') return <OverviewPage state={state} selectView={selectView} />;
  if (view === 'website') return <WebsiteContentPage state={state} commit={commit} notify={notify} />;
  if (view === 'team') return <TeamMembersPage notify={notify} />;
  if (view === 'media') return <MediaPage state={state} commit={commit} notify={notify} />;
  if (view === 'finance') return <FinancePage state={state} commit={commit} notify={notify} />;
  if (view === 'hr') return <HrPage state={state} commit={commit} notify={notify} />;
  if (view === 'users') return <UsersPage state={state} commit={commit} notify={notify} session={session} />;
  if (view === 'settings') return <SettingsPage state={state} commit={commit} notify={notify} />;
  return <ManagementPage resource={view} state={state} commit={commit} notify={notify} />;
}

function AccessDenied() { return <section className="admin-empty-panel admin-access-denied"><ShieldAlert size={30} /><h2>Access restricted</h2><p>Your current role cannot access this section. Ask a Super Admin to update your permissions.</p></section>; }

function OverviewPage({ state, selectView }) {
  const stats = [
    { label: 'Menu items', value: state.menuItems.length, meta: `${state.menuItems.filter((item) => item.status === 'Published').length} published`, icon: Utensils, view: 'menu' },
    { label: 'Branches', value: state.branches.length, meta: `${state.branches.filter((branch) => branch.status === 'Published').length} active`, icon: MapPin, view: 'branches' },
    { label: 'Active promotions', value: state.promotions.filter((item) => item.status === 'Published').length, meta: `${state.promotions.filter((item) => item.status === 'Draft').length} drafts`, icon: TicketPercent, view: 'promotions' },
    { label: 'Pending reservations', value: state.reservations.filter((item) => ['New', 'Pending'].includes(item.status)).length, meta: `${state.reservations.length} total requests`, icon: CalendarCheck, view: 'reservations' },
  ];
  return <div className="admin-dashboard"><div className="admin-stat-grid">{stats.map(({ label, value, meta, icon: Icon, view }) => <button className="admin-stat-card" key={label} onClick={() => selectView(view)}><span className="admin-stat-icon"><Icon size={19} /></span><span className="admin-stat-label">{label}</span><strong>{value}</strong><small>{meta}<ArrowUpRight size={13} /></small></button>)}</div><div className="admin-dashboard-grid"><section className="admin-panel admin-chart-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Reservations</span><h2>Demand is trending up</h2></div><select aria-label="Chart range"><option>Last 7 days</option><option>Last 30 days</option></select></div><ReservationChart /></section><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">By branch</span><h2>Branch performance</h2></div><button className="admin-link-button" onClick={() => selectView('branches')}>View all <ArrowUpRight size={14} /></button></div><BranchPerformance branches={state.branches} /></section></div><div className="admin-dashboard-grid lower"><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Activity stream</span><h2>Recent activity</h2></div><button className="admin-icon-button"><MoreHorizontal size={17} /></button></div><ActivityTable activity={state.activity} /></section><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Shortcuts</span><h2>Quick actions</h2></div></div><div className="admin-quick-actions">{[['menu', 'Add menu item', Utensils], ['promotions', 'Add promotion', TicketPercent], ['branches', 'Add branch', MapPin], ['gallery', 'Upload gallery image', ImagePlus], ['website', 'Edit homepage', PanelsTopLeft], ['settings', 'Update settings', Settings]].map(([view, label, Icon]) => <button key={label} onClick={() => selectView(view)}><span><Icon size={17} /></span>{label}<ArrowUpRight size={15} /></button>)}</div></section></div><section className="admin-panel admin-health-panel"><div><span className="admin-panel-kicker">System health</span><h2>Everything is ready for the next update.</h2><p>Content is stored in the editable admin data layer. Connect your production API and authentication service before launch.</p></div><div className="admin-health-items"><span><CheckCircle2 size={16} />Public site online</span><span><CheckCircle2 size={16} />Schema metadata active</span><span><ShieldAlert size={16} />Backend auth pending</span></div></section></div>;
}

function ReservationChart() { return <div className="admin-chart"><svg viewBox="0 0 640 220" role="img" aria-label="Reservations rising from 12 to 31 over the last seven days"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1F4D3A" stopOpacity=".18" /><stop offset="1" stopColor="#1F4D3A" stopOpacity="0" /></linearGradient></defs><path d="M30 174 L125 92 L220 138 L315 78 L410 48 L505 104 L600 64 L600 195 L30 195 Z" fill="url(#chart-fill)" /><path d="M30 174 L125 92 L220 138 L315 78 L410 48 L505 104 L600 64" fill="none" stroke="#1F4D3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{[[30,174],[125,92],[220,138],[315,78],[410,48],[505,104],[600,64]].map(([x,y]) => <circle cx={x} cy={y} r="5" fill="#FFFFFF" stroke="#1F4D3A" strokeWidth="3" key={`${x}-${y}`} />)}</svg><div className="admin-chart-axis"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div>; }
function BranchPerformance({ branches }) { return <div className="admin-branch-performance">{branches.slice(0, 5).map((branch, index) => <div className="admin-branch-row" key={branch.slug}><span className="admin-branch-avatar"><MapPin size={15} /></span><div><strong>{branch.name}</strong><small>{12 + index * 7} reservations this week</small></div><div className="admin-progress"><span style={{ width: `${82 - index * 8}%` }} /></div><b>{82 - index * 8}%</b></div>)}</div>; }
function ActivityTable({ activity }) { return <div className="admin-activity-table">{activity.map((item) => <div className="admin-activity-row" key={`${item.action}-${item.date}`}><span className="admin-activity-icon"><Activity size={14} /></span><div><strong>{item.action}</strong><small>{item.detail} · {item.by}</small></div><time>{item.date}</time></div>)}</div>; }

function ManagementPage({ resource, state, commit, notify }) {
  const config = resourceConfig[resource] || resourceConfig.menu;
  const rows = state[config.key] || [];
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const filtered = useMemo(() => rows.filter((row) => `${row.name || row.title || row.page || row.id || ''} ${row.category || ''} ${row.branch || ''} ${row.subject || ''} ${row.email || ''}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || row.status === status)), [rows, query, status]);
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.includes(row.id || row.slug || row.path));
  const ids = (row) => row.id || row.slug || row.path;
  const toggleAll = () => setSelected(allVisibleSelected ? selected.filter((id) => !visible.some((row) => ids(row) === id)) : [...new Set([...selected, ...visible.map(ids)])]);
  const toggleOne = (row) => setSelected((current) => current.includes(ids(row)) ? current.filter((id) => id !== ids(row)) : [...current, ids(row)]);
  const openDrawer = (row = null) => setDrawer(row || makeNewRecord(resource));
  const saveRecord = (draft) => { commit((current) => ({ ...current, [config.key]: current[config.key].some((row) => ids(row) === ids(draft)) ? current[config.key].map((row) => ids(row) === ids(draft) ? draft : row) : [draft, ...current[config.key]] })); setDrawer(null); notify(`${config.title.slice(0, -1)} saved successfully.`); };
  const archiveSelected = () => { if (!selected.length) return; commit((current) => ({ ...current, [config.key]: current[config.key].map((row) => selected.includes(ids(row)) ? { ...row, status: 'Archived' } : row) })); setSelected([]); notify(`${selected.length} record${selected.length > 1 ? 's' : ''} archived.`); };
  const exportRows = () => { const header = Object.keys(filtered[0] || {}).join(','); const body = filtered.map((row) => Object.values(row).map((value) => JSON.stringify(Array.isArray(value) ? value.join('|') : value ?? '')).join(',')).join('\n'); const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${resource}-export.csv`; anchor.click(); URL.revokeObjectURL(url); notify('CSV export prepared.'); };
  return <section className="admin-data-page"><div className="admin-toolbar"><label className="admin-search-field"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={config.search} /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status"><option>All statuses</option><option>Published</option><option>Active</option><option>Approved</option><option>Confirmed</option><option>Pending</option><option>Draft</option><option>New</option><option>Inactive</option><option>Archived</option><option>Resolved</option></select><button className="admin-outline-button" onClick={() => notify('Advanced filters are ready to connect to the production API.')}><SlidersHorizontal size={16} />Filters</button><button className="admin-outline-button" onClick={exportRows}><Download size={16} />Export</button><button className="admin-primary-button" onClick={() => openDrawer()}><Plus size={16} />{config.add}</button></div>{selected.length > 0 && <div className="admin-bulkbar"><span><CheckSquare size={16} />{selected.length} selected</span><button onClick={archiveSelected}><Trash2 size={15} />Archive selected</button><button onClick={() => setSelected([])}>Clear selection</button></div>}<div className="admin-table-panel"><div className="admin-table-top"><span>{filtered.length} {config.title.toLowerCase()} · page {page} of {Math.max(1, Math.ceil(filtered.length / perPage))}</span><button className="admin-link-button"><TableProperties size={15} />Column visibility</button></div>{visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all visible rows" /></th>{tableHeaders(resource).map((header) => <th key={header}>{header}</th>)}<th aria-label="Actions" /></tr></thead><tbody>{visible.map((row) => <tr key={ids(row)}><td><input type="checkbox" checked={selected.includes(ids(row))} onChange={() => toggleOne(row)} aria-label={`Select ${row.name || row.title || row.id || row.page}`} /></td>{renderCells(resource, row)}<td><button className="admin-icon-button small" aria-label={`Edit ${row.name || row.title || row.id || row.page}`} onClick={() => openDrawer(row)}><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table></div> : <div className="admin-empty-panel"><Search size={24} /><h3>{config.empty}</h3><p>Try clearing a filter or add your first record.</p><button className="admin-primary-button" onClick={() => openDrawer()}><Plus size={15} />{config.add}</button></div>}<div className="admin-pagination"><span>Showing {visible.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span><div><button className="admin-icon-button small" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>{Array.from({ length: Math.min(3, Math.max(1, Math.ceil(filtered.length / perPage))) }, (_, index) => index + 1).map((number) => <button key={number} className={`admin-page-number ${page === number ? 'active' : ''}`} onClick={() => setPage(number)}>{number}</button>)}<button className="admin-icon-button small" disabled={page >= Math.ceil(filtered.length / perPage)} onClick={() => setPage((value) => Math.min(Math.max(1, Math.ceil(filtered.length / perPage)), value + 1))}>›</button></div><label className="admin-page-size">8 / page<ChevronDown size={13} /></label></div></div>{drawer && <RecordDrawer resource={resource} record={drawer} onSave={saveRecord} onClose={() => setDrawer(null)} />}</section>;
}

function tableHeaders(resource) { return ({ menu: ['Item', 'Category', 'Price', 'Status', 'Branches'], categories: ['Category', 'Order', 'Featured', 'Branches', 'Status'], branches: ['Branch', 'Manager', 'Hours', 'Facilities', 'Status'], promotions: ['Promotion', 'Type', 'Validity', 'Branches', 'Status'], gallery: ['Image', 'Category', 'Branch', 'Uploaded', 'Status'], reviews: ['Reviewer', 'Rating', 'Source', 'Branch', 'Status'], reservations: ['Reservation', 'Branch', 'Date & time', 'Guests', 'Status'], enquiries: ['Enquiry', 'Branch', 'Date', 'Assigned', 'Status'], social: ['Account', 'Username', 'Branches', 'Order', 'Status'], seo: ['Page', 'Path', 'Meta title', 'Description', 'Status'] })[resource] || ['Name', 'Status']; }

function renderCells(resource, row) {
  if (resource === 'menu') return <><td><div className="admin-table-primary"><img src={row.image} alt="" /><span><strong>{row.name}</strong><small>{row.badge || 'No badge'}</small></span></div></td><td>{row.category}</td><td className="admin-money">{formatCurrency(row.price)}</td><td><StatusBadge status={row.status} /><small className="admin-cell-note">{row.stock}</small></td><td><span className="admin-count-chip">{row.branchAvailability?.length || 0} branches</span></td></>;
  if (resource === 'categories') return <><td><div className="admin-table-primary"><img src={row.image} alt="" /><span><strong>{row.name}</strong><small>{row.description}</small></span></div></td><td>{row.order}</td><td>{row.featured ? <StatusBadge status="Featured" /> : '—'}</td><td>{row.branches?.length || 0} branches</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'branches') return <><td><div className="admin-table-primary"><img src={row.image} alt="" /><span><strong>{row.name}</strong><small>{row.address}</small></span></div></td><td>{row.manager}</td><td><span className="admin-hour-chip"><Clock3 size={13} />{row.hours?.[1]?.join(' – ') || 'Hours pending'}</span></td><td>{row.facilities?.slice(0, 2).join(' · ')}</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'promotions') return <><td><div className="admin-table-primary"><img src={row.image} alt="" /><span><strong>{row.title}</strong><small>{row.details}</small></span></div></td><td>{row.type}</td><td>{row.startDate || 'Not scheduled'}{row.endDate ? ` – ${row.endDate}` : ''}</td><td>{row.branches}</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'gallery') return <><td><div className="admin-table-primary"><img src={row.image} alt="" /><span><strong>{row.title}</strong><small>{row.alt}</small></span></div></td><td>{row.category}</td><td>{row.branch}</td><td>{row.uploadedAt}</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'reviews') return <><td><div className="admin-table-primary"><span className="admin-avatar small">{row.name?.slice(0, 2).toUpperCase()}</span><span><strong>{row.name}</strong><small>{row.text}</small></span></div></td><td><span className="admin-rating"><Star size={14} fill="currentColor" />{row.rating}/5</span></td><td>{row.source}</td><td>{row.branch}</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'reservations') return <><td><div className="admin-table-primary"><span className="admin-id-badge">{row.id}</span><span><strong>{row.name}</strong><small>{row.phone}</small></span></div></td><td>{row.branch}</td><td><strong>{row.date}</strong><small className="admin-cell-note">{row.time}</small></td><td>{row.guests} guests</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'enquiries') return <><td><div className="admin-table-primary"><span className="admin-id-badge">{row.id}</span><span><strong>{row.subject}</strong><small>{row.name} · {row.email}</small></span></div></td><td>{row.branch}</td><td>{row.date}</td><td>{row.assigned}</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'social') return <><td><div className="admin-table-primary"><span className="admin-social-icon"><Share2 size={15} /></span><span><strong>{row.title}</strong><small>{row.href}</small></span></div></td><td>{row.username || 'Not set'}</td><td>{row.branches?.join(', ')}</td><td>{row.displayOrder}</td><td><StatusBadge status={row.status} /></td></>;
  if (resource === 'seo') return <><td><strong>{row.page}</strong></td><td><code>{row.path}</code></td><td>{row.title}</td><td><span className="admin-truncate">{row.description}</span></td><td><StatusBadge status={row.status} /></td></>;
  return <><td><strong>{row.name || row.title || row.id}</strong></td><td><StatusBadge status={row.status} /></td></>;
}

function makeNewRecord(resource) {
  const id = `${resource}-${Date.now()}`;
  if (resource === 'menu') return { id, slug: id, name: 'New menu item', category: 'Chapati and Bread', price: 0, description: '', ingredients: '', image: '', badge: 'New', status: 'Draft', stock: 'Available', branchAvailability: [], halal: true };
  if (resource === 'categories') return { id, slug: id, name: 'New category', description: '', image: '', order: 1, status: 'Draft', featured: false, branches: [] };
  if (resource === 'branches') return { id, slug: id, name: 'New branch', code: 'NC-00', address: '', phone: '', whatsapp: '', email: '', manager: 'Unassigned', status: 'Draft', featured: false, hours: { 1: ['09:00', '22:00'] }, facilities: [] };
  if (resource === 'promotions') return { id, slug: id, title: 'New promotion', details: '', type: 'Percentage discount', startDate: '', endDate: '', branches: 'Selected branches', terms: '', image: '', status: 'Draft', featured: false };
  if (resource === 'gallery') return { id, title: 'New gallery image', category: 'Food', branch: 'All branches', image: '', alt: '', status: 'Draft', featured: false, uploadedAt: 'Today' };
  if (resource === 'reviews') return { id, name: 'New reviewer', rating: 5, text: '', source: 'Manual review', branch: 'All branches', status: 'Pending', featured: false, date: 'Today' };
  if (resource === 'reservations') return { id: id.toUpperCase(), name: '', phone: '', email: '', branch: 'Pasir Gudang', date: '', time: '', guests: 2, status: 'New', request: '', assigned: 'Unassigned', notes: '' };
  if (resource === 'enquiries') return { id: id.toUpperCase(), name: '', email: '', phone: '', branch: 'All branches', subject: '', message: '', status: 'New', assigned: 'Unassigned', date: 'Today', notes: '' };
  if (resource === 'social') return { id, label: 'New account', title: 'New account', href: '', username: '', className: 'social', status: 'Inactive', displayOrder: 1, branches: ['All branches'] };
  return { page: 'New page', path: '/', title: '', description: '', status: 'Draft' };
}

function RecordDrawer({ resource, record, onSave, onClose }) {
  const [draft, setDraft] = useState(record);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateHours = (day, slot, value) => setDraft((current) => ({ ...current, hours: { ...current.hours, [day]: (current.hours?.[day] || ['', '']).map((time, index) => index === slot ? value : time) } }));
  const fields = resource === 'menu' ? [['name', 'Item name'], ['category', 'Category'], ['price', 'Base price'], ['status', 'Status'], ['stock', 'Stock status'], ['description', 'Short description'], ['ingredients', 'Ingredients']] : resource === 'branches' ? [['name', 'Branch name'], ['code', 'Branch code'], ['address', 'Full address'], ['phone', 'Phone'], ['whatsapp', 'WhatsApp'], ['manager', 'Branch manager'], ['status', 'Status']] : resource === 'promotions' ? [['title', 'Promotion title'], ['type', 'Promotion type'], ['startDate', 'Start date'], ['endDate', 'End date'], ['branches', 'Applicable branches'], ['status', 'Status'], ['details', 'Short description'], ['terms', 'Terms and conditions']] : resource === 'gallery' ? [['title', 'Title'], ['category', 'Category'], ['branch', 'Branch'], ['alt', 'Image alt text'], ['status', 'Status']] : resource === 'reviews' ? [['name', 'Customer name'], ['rating', 'Rating'], ['branch', 'Branch'], ['status', 'Status'], ['text', 'Review text']] : resource === 'reservations' ? [['name', 'Customer name'], ['phone', 'Phone'], ['email', 'Email'], ['branch', 'Branch'], ['date', 'Date'], ['time', 'Time'], ['guests', 'Guests'], ['status', 'Status'], ['notes', 'Internal notes']] : resource === 'enquiries' ? [['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['branch', 'Branch'], ['subject', 'Subject'], ['status', 'Status'], ['message', 'Message'], ['notes', 'Internal notes']] : resource === 'social' ? [['title', 'Account title'], ['href', 'Profile URL'], ['username', 'Username'], ['status', 'Status'], ['displayOrder', 'Display order']] : resource === 'seo' ? [['page', 'Page'], ['path', 'Path'], ['title', 'Meta title'], ['description', 'Meta description'], ['status', 'Status']] : [['name', 'Name'], ['description', 'Description'], ['status', 'Status']];

  const uploadMenuImage = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setImageError('Choose a PNG, JPG, WebP, or AVIF image up to 5 MB.');
      input.value = '';
      return;
    }

    setImageError('');
    setUploadingImage(true);
    try {
      if (isSupabaseConfigured) {
        const uploaded = await uploadMediaFile(file, 'menu');
        if (uploaded.error) throw uploaded.error;
        setDraft((current) => ({ ...current, image: uploaded.url, storagePath: uploaded.path }));
      } else {
        const image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('The selected image could not be read.'));
          reader.readAsDataURL(file);
        });
        setDraft((current) => ({ ...current, image, storagePath: '' }));
      }
    } catch (error) {
      setImageError(`Image upload failed: ${error.message || 'Please try again.'}`);
    } finally {
      setUploadingImage(false);
      input.value = '';
    }
  };

  const submitRecord = (event) => {
    event.preventDefault();
    if (uploadingImage) return;
    onSave({
      ...draft,
      price: draft.price === '' ? null : Number(draft.price),
      rating: draft.rating === '' ? 5 : Number(draft.rating),
      guests: draft.guests === '' ? 2 : Number(draft.guests),
    });
  };

  return <div className="admin-drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !uploadingImage && onClose()}>
    <aside className="admin-drawer">
      <div className="admin-drawer-head"><div><span className="admin-eyebrow">{record.id?.startsWith('new-') ? 'Create record' : 'Edit record'}</span><h2>{resourceConfig[resource]?.title || 'Edit content'}</h2></div><button className="admin-icon-button" onClick={onClose} aria-label="Close editor" disabled={uploadingImage}><X size={18} /></button></div>
      {resource === 'menu' && <>
        <div className={`admin-drawer-image ${uploadingImage ? 'is-uploading' : ''}`}>
          <img src={draft.image || '/naseeb-chapati-logo.png'} alt={`${draft.name || 'Menu item'} preview`} />
          <label className="admin-image-edit"><Edit3 size={14} />{uploadingImage ? 'Uploading…' : 'Change image'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={uploadMenuImage} disabled={uploadingImage} /></label>
        </div>
        <div className="admin-menu-image-controls">
          <label>Image URL<input type="url" value={draft.image || ''} onChange={(event) => { update('image', event.target.value); setImageError(''); }} placeholder="Upload an image or paste a public URL" disabled={uploadingImage} /></label>
          <small>PNG, JPG, WebP, or AVIF · maximum 5 MB</small>
          {imageError && <div className="admin-form-error" role="alert"><CircleAlert size={16} />{imageError}</div>}
          {uploadingImage && <div className="admin-menu-image-progress" role="status" aria-live="polite"><RefreshCw size={15} />Uploading image to storage…</div>}
        </div>
      </>}
      <form className="admin-form admin-drawer-form" onSubmit={submitRecord}>
        <div className="admin-drawer-fields">{fields.map(([key, label]) => <label key={key}>{label}{['status', 'category', 'type', 'stock', 'branch'].includes(key) ? <select value={draft[key] ?? ''} onChange={(event) => update(key, event.target.value)}><option value="">Select {label.toLowerCase()}</option>{(key === 'status' ? ['Draft', 'Published', 'Active', 'Inactive', 'Pending', 'Approved', 'Confirmed', 'Resolved'] : key === 'category' ? ['Chapati and Bread', 'Breakfast', 'Chicken Dishes', 'Mutton Dishes', 'Biryani and Rice', 'Curry', 'Tandoori and Grill', 'Family Platters', 'Fast Food', 'Hot Drinks', 'Cold Drinks', 'Desserts'] : key === 'branch' ? ['All branches', 'Pasir Gudang', 'Ayer Hitam', 'Angsana JB Mall'] : key === 'stock' ? ['Available', 'Sold out', 'Scheduled'] : ['Combo meal', 'Percentage discount', 'Fixed discount', 'Weekend promotion']).map((option) => <option key={option}>{option}</option>)}</select> : key === 'description' || key === 'ingredients' || key === 'terms' || key === 'text' || key === 'message' || key === 'notes' ? <textarea value={draft[key] ?? ''} onChange={(event) => update(key, event.target.value)} rows="3" /> : <input type={['price', 'rating', 'guests', 'displayOrder'].includes(key) ? 'number' : ['startDate', 'endDate', 'date'].includes(key) ? 'date' : ['time'].includes(key) ? 'time' : key === 'email' ? 'email' : 'text'} value={draft[key] ?? ''} onChange={(event) => update(key, event.target.value)} />}</label>)}</div>
        {resource === 'branches' && <div className="admin-hours-editor"><div><strong>Independent opening hours</strong><small>Each branch keeps its own weekly schedule.</small></div>{[['Monday', '1'], ['Tuesday', '2'], ['Wednesday', '3'], ['Thursday', '4'], ['Friday', '5'], ['Saturday', '6'], ['Sunday', '0']].map(([label, day]) => <label key={day}><span>{label}</span><div><input type="time" value={draft.hours?.[day]?.[0] || ''} onChange={(event) => updateHours(day, 0, event.target.value)} /><span>to</span><input type="time" value={draft.hours?.[day]?.[1] || ''} onChange={(event) => updateHours(day, 1, event.target.value)} /></div></label>)}</div>}
        <div className="admin-drawer-checks"><label className="admin-switch-row"><input type="checkbox" checked={Boolean(draft.featured)} onChange={(event) => update('featured', event.target.checked)} /><span className="admin-switch" /><span>Featured content</span></label><label className="admin-switch-row"><input type="checkbox" checked={draft.halal !== false} onChange={(event) => update('halal', event.target.checked)} /><span className="admin-switch" /><span>Halal / approved</span></label></div>
        <div className="admin-drawer-actions"><button type="button" className="admin-outline-button" onClick={onClose} disabled={uploadingImage}>Cancel</button><button className="admin-primary-button" type="submit" disabled={uploadingImage}><Save size={15} />{uploadingImage ? 'Uploading image…' : 'Save changes'}</button></div>
      </form>
    </aside>
  </div>;
}

function WebsiteContentPageLegacy({ state, commit, notify }) {
  const [draft, setDraft] = useState(state.homepage);
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  return <section className="admin-content-page"><div className="admin-editor-grid"><div className="admin-editor-main"><div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Hero section</span><h2>Homepage headline</h2></div><StatusBadge status="Published" /></div><div className="admin-form admin-editor-form"><label>Main heading<input value={draft.heroHeading} onChange={(event) => update('heroHeading', event.target.value)} /></label><label>Supporting text<textarea rows="4" value={draft.heroText} onChange={(event) => update('heroText', event.target.value)} /></label><div className="admin-two-col"><label>Primary button label<input value="View Menu" readOnly /></label><label>Primary button URL<input value="/menu" readOnly /></label></div></div></div><div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Trending menu</span><h2>Section controls</h2></div><StatusBadge status="Published" /></div><div className="admin-form admin-editor-form"><div className="admin-two-col"><label>Section title<input value={draft.trendingTitle} onChange={(event) => update('trendingTitle', event.target.value)} /></label><label>Autoplay speed (ms)<input type="number" value={draft.trendingSpeed} onChange={(event) => update('trendingSpeed', Number(event.target.value))} /></label></div><label>Section subtitle<textarea rows="3" value={draft.trendingSubtitle} onChange={(event) => update('trendingSubtitle', event.target.value)} /></label><label className="admin-switch-row"><input type="checkbox" checked={draft.trendingAutoplay} onChange={(event) => update('trendingAutoplay', event.target.checked)} /><span className="admin-switch" /><span>Enable autoplay</span></label><label className="admin-switch-row"><input type="checkbox" checked={draft.showPromotions} onChange={(event) => update('showPromotions', event.target.checked)} /><span className="admin-switch" /><span>Show promotions section</span></label></div></div><div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Visibility</span><h2>Homepage sections</h2></div></div><div className="admin-visibility-list">{[['showAbout', 'About section', 'Brand story and restaurant values'], ['showPromotions', 'Promotions section', 'Current offers and seasonal specials'], ['showReviews', 'Testimonials section', 'Approved customer reviews']].map(([key, label, description]) => <label className="admin-visibility-item" key={key}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={draft[key]} onChange={(event) => update(key, event.target.checked)} /><span className="admin-switch" /></label>)}</div></div></div><aside className="admin-editor-side"><div className="admin-panel admin-preview-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Live preview</span><h2>Homepage hero</h2></div><ExternalLink size={16} /></div><div className="admin-hero-preview"><img src="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80" alt="Restaurant food preview" /><div><span>Homepage</span><h3>{draft.heroHeading}</h3><p>{draft.heroText}</p><button>View Menu <ArrowUpRight size={13} /></button></div></div></div><button className="admin-primary-button admin-save-wide" onClick={() => { commit({ homepage: draft }); notify('Homepage content saved to the local content layer.'); }}><Save size={16} />Save homepage content</button></aside></div></section>;
}

function MediaPageLegacy({ state, commit, notify }) {
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const filtered = state.gallery.filter((item) => `${item.title} ${item.category} ${item.branch}`.toLowerCase().includes(query.toLowerCase()));
  const addMedia = (event) => { const file = event.target.files?.[0]; if (!file) return; commit((current) => ({ ...current, gallery: [{ id: `upload-${Date.now()}`, title: file.name, category: 'Food', branch: 'All branches', image: URL.createObjectURL(file), alt: file.name, status: 'Published', featured: false, uploadedAt: 'Just now' }, ...current.gallery] })); notify('Image uploaded and published to the media library.'); };
  const removeMedia = () => { if (!deleteTarget) return; if (deleteTarget.image?.startsWith('blob:')) URL.revokeObjectURL(deleteTarget.image); commit((current) => ({ ...current, gallery: current.gallery.filter((item) => item.id !== deleteTarget.id) })); notify('Image deleted from the media library.'); setDeleteTarget(null); };
  return <section className="admin-media-page"><div className="admin-toolbar"><label className="admin-search-field"><Search size={16} /><input placeholder="Search files..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="admin-outline-button"><ListFilter size={16} />Filter by type</button><label className="admin-primary-button admin-upload-button"><Upload size={16} />Upload image<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={addMedia} /></label></div><div className="admin-upload-dropzone"><Upload size={23} /><div><strong>Drop images here or browse</strong><p>PNG, JPG, WebP, or AVIF · uploads publish immediately · production storage pending</p></div><button className="admin-outline-button"><ImagePlus size={15} />Choose files</button></div><div className="admin-media-grid">{filtered.map((item) => <article className="admin-media-card" key={item.id}><div className="admin-media-image"><img src={item.image} alt={item.alt} loading="lazy" /><button className="admin-icon-button admin-media-delete" aria-label={`Delete ${item.title}`} title="Delete image" onClick={() => setDeleteTarget(item)}><Trash2 size={16} /></button></div><div><div className="admin-media-card-title"><strong>{item.title}</strong><StatusBadge status={item.status} /></div><small>{item.category} · {item.branch}</small><span><FileText size={13} />Alt text {item.alt ? 'ready' : 'missing'}</span></div></article>)}</div>{deleteTarget && <div className="admin-confirm-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}><div className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-media-title"><span className="admin-confirm-icon"><Trash2 size={18} /></span><h2 id="delete-media-title">Delete this image?</h2><p><strong>{deleteTarget.title}</strong> will be removed from the media library and public gallery content.</p><div className="admin-confirm-actions"><button className="admin-outline-button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="admin-primary-button" onClick={removeMedia}><Trash2 size={15} />Delete image</button></div></div></div>}</section>;
}

function MediaPage({ state, commit, notify }) {
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const filtered = state.gallery.filter((item) => `${item.title} ${item.category} ${item.branch}`.toLowerCase().includes(query.toLowerCase()));

  const addMedia = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      notify('Choose a PNG, JPG, WebP, or AVIF image up to 5 MB.');
      input.value = '';
      return;
    }
    setUploading(true);
    let image = URL.createObjectURL(file);
    let storagePath = '';
    if (isSupabaseConfigured) {
      const uploaded = await uploadMediaFile(file);
      if (uploaded.error) {
        notify(`Upload failed: ${uploaded.error.message}`);
        setUploading(false);
        input.value = '';
        return;
      }
      URL.revokeObjectURL(image);
      image = uploaded.url;
      storagePath = uploaded.path;
    }
    commit((current) => ({ ...current, gallery: [{ id: `upload-${Date.now()}`, title: file.name, category: 'Food', branch: 'All branches', image, storagePath, alt: file.name, status: 'Published', featured: false, uploadedAt: 'Just now' }, ...current.gallery] }));
    setUploading(false);
    input.value = '';
    notify(isSupabaseConfigured ? 'Image uploaded to Supabase Storage and published.' : 'Image uploaded and published to the local preview.');
  };

  const removeMedia = async () => {
    if (!deleteTarget || deleting) return;
    const target = deleteTarget;
    setDeleting(true);
    if (isSupabaseConfigured && target.storagePath) {
      const { error } = await removeMediaFile(target.storagePath);
      if (error) {
        notify(`Delete failed: ${error.message}`);
        setDeleting(false);
        return;
      }
    }
    if (target.image?.startsWith('blob:')) URL.revokeObjectURL(target.image);
    commit((current) => ({ ...current, gallery: current.gallery.filter((item) => item.id !== target.id) }));
    setDeleting(false);
    setDeleteTarget(null);
    notify('Image deleted from the media library.');
  };

  return <section className="admin-media-page"><div className="admin-toolbar"><label className="admin-search-field"><Search size={16} /><input placeholder="Search files..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="admin-outline-button"><ListFilter size={16} />Filter by type</button><label className={`admin-primary-button admin-upload-button ${uploading ? 'is-uploading' : ''}`}><Upload size={16} />{uploading ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={addMedia} disabled={uploading} /></label></div><div className="admin-upload-dropzone"><Upload size={23} /><div><strong>Drop images here or browse</strong><p>PNG, JPG, WebP, or AVIF · upload to Supabase Storage · published immediately</p></div><button className="admin-outline-button" disabled={uploading}><ImagePlus size={15} />Choose files</button></div><div className="admin-media-grid">{filtered.map((item) => <article className="admin-media-card" key={item.id}><div className="admin-media-image"><img src={item.image} alt={item.alt} loading="lazy" /><button className="admin-icon-button admin-media-delete" aria-label={`Delete ${item.title}`} title="Delete image" onClick={() => setDeleteTarget(item)}><Trash2 size={16} /></button></div><div><div className="admin-media-card-title"><strong>{item.title}</strong><StatusBadge status={item.status} /></div><small>{item.category} · {item.branch}</small><span><FileText size={13} />Alt text {item.alt ? 'ready' : 'missing'}</span></div></article>)}</div>{deleteTarget && <div className="admin-confirm-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}><div className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-media-title"><span className="admin-confirm-icon"><Trash2 size={18} /></span><h2 id="delete-media-title">Delete this image?</h2><p><strong>{deleteTarget.title}</strong> will be removed from storage, the media library, and public gallery content.</p><div className="admin-confirm-actions"><button className="admin-outline-button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button><button className="admin-primary-button" onClick={removeMedia} disabled={deleting}><Trash2 size={15} />{deleting ? 'Deleting…' : 'Delete image'}</button></div></div></div>}</section>;
}

function UsersPage({ state, commit, notify, session }) { const users = state.adminUsers || [{ id: 'usr-1', name: 'Admin User', email: 'naseebchapatinanpg@gmail.com', role: 'super_admin', branches: ['All branches'], status: 'Active', lastLogin: 'Today, 08:50 AM' }]; return <section className="admin-users-page"><div className="admin-toolbar"><div className="admin-toolbar-note"><ShieldCheck size={17} /><span>Role-based access is active for this session as <strong>{roleLabel(session.role)}</strong>.</span></div><button className="admin-primary-button" onClick={() => notify('User invitation flow is ready for production identity provider integration.')}><Plus size={16} />Invite admin</button></div><div className="admin-user-grid">{users.map((user) => <article className="admin-user-card" key={user.id}><div className="admin-user-card-top"><span className="admin-avatar large">{user.name.slice(0, 2).toUpperCase()}</span><StatusBadge status={user.status} /><button className="admin-icon-button small"><MoreHorizontal size={15} /></button></div><h3>{user.name}</h3><p>{user.email}</p><div className="admin-user-meta"><span><ShieldCheck size={14} />{roleLabel(user.role)}</span><span><MapPin size={14} />{user.branches?.join(', ')}</span><span><Clock3 size={14} />Last login {user.lastLogin}</span></div><div className="admin-user-actions"><button className="admin-outline-button" onClick={() => notify('User edit is ready for the production identity provider.')}><Edit3 size={14} />Edit</button><button className="admin-link-button" onClick={() => notify('Password reset request queued in preview mode.')}>Reset password</button></div></article>)}</div><section className="admin-panel admin-role-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Permissions matrix</span><h2>Role boundaries</h2></div><LockKeyhole size={18} /></div><div className="admin-role-grid">{roleCatalog.map((role) => <div key={role.key}><span className="admin-role-icon"><ShieldCheck size={16} /></span><strong>{role.label}</strong><p>{role.description}</p></div>)}</div></section></section>; }

function SettingsPage({ state, commit, notify }) { const [draft, setDraft] = useState(state.settings); const update = (key, value) => setDraft((current) => ({ ...current, [key]: value })); return <section className="admin-settings-page"><div className="admin-settings-grid"><div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">General</span><h2>Website defaults</h2></div><Settings size={18} /></div><div className="admin-form admin-editor-form"><label>Website name<input value={draft.websiteName} onChange={(event) => update('websiteName', event.target.value)} /></label><label>Website URL<input value={draft.websiteUrl} onChange={(event) => update('websiteUrl', event.target.value)} /></label><div className="admin-two-col"><label>Currency<select value={draft.currency} onChange={(event) => update('currency', event.target.value)}><option>MYR</option><option>USD</option></select></label><label>Timezone<select value={draft.timezone} onChange={(event) => update('timezone', event.target.value)}><option>Asia/Kuala_Lumpur</option><option>Asia/Singapore</option></select></label></div><label>Main email<input type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} /></label><label>Main phone<input type="tel" value={draft.phone} onChange={(event) => update('phone', event.target.value)} /></label></div></div><div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Security & integrations</span><h2>Production checklist</h2></div><ShieldCheck size={18} /></div><div className="admin-security-list"><div><span className="admin-security-icon"><LockKeyhole size={15} /></span><span><strong>Server authentication</strong><small>Connect Supabase Auth, Auth.js, or your identity provider before launch.</small></span><StatusBadge status="Pending" /></div><div><span className="admin-security-icon"><Database size={15} /></span><span><strong>Relational database</strong><small>Map this content layer to PostgreSQL tables and protected APIs.</small></span><StatusBadge status="Pending" /></div><div><span className="admin-security-icon"><ShieldAlert size={15} /></span><span><strong>Rate limiting & audit log</strong><small>Add server-side throttling, IP logging, and immutable audit events.</small></span><StatusBadge status="Pending" /></div></div></div><div className="admin-panel admin-form-panel"><div className="admin-panel-heading"><div><span className="admin-panel-kicker">Operations</span><h2>Website controls</h2></div></div><div className="admin-visibility-list"><label className="admin-visibility-item"><span><strong>Maintenance mode</strong><small>Keep the public site visible only to approved visitors.</small></span><input type="checkbox" checked={draft.maintenance} onChange={(event) => update('maintenance', event.target.checked)} /><span className="admin-switch" /></label><label className="admin-visibility-item"><span><strong>Cookie banner</strong><small>Show a consent banner when the production privacy workflow is connected.</small></span><input type="checkbox" checked={draft.cookieBanner} onChange={(event) => update('cookieBanner', event.target.checked)} /><span className="admin-switch" /></label></div></div></div><button className="admin-primary-button admin-save-wide" onClick={() => { commit({ settings: draft }); notify('Settings saved to the local admin layer.'); }}><Save size={16} />Save settings</button></section>; }

export default AdminApp;

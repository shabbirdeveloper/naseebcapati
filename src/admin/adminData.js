import {
  branches as publicBranches,
  contactInfo,
  defaultHomepageStats,
  galleryItems as publicGallery,
  menuCategories as publicCategories,
  menuItems as publicMenuItems,
  normalizeHeroSlides,
  promotions as publicPromotions,
  reviews as publicReviews,
  socialLinks as publicSocial,
} from '../data/content';
import { CONTENT_ROW_ID, isSupabaseConfigured, supabase } from '../lib/supabase';
import { createDefaultServicesContent, normalizeServicesContent } from '../services/servicesSeed';

const STORAGE_KEY = 'naseeb-admin-state-v1';
const SESSION_KEY = 'naseeb-admin-session-v1';
const OPERATIONS_ROW_ID = 'default';
const publicStateKeys = ['menuItems', 'categories', 'branches', 'promotions', 'gallery', 'reviews', 'social', 'homepage', 'servicesContent', 'seo', 'settings'];
const operationsStateKeys = ['reservations', 'enquiries', 'eventEnquiries', 'financeTransactions', 'staff', 'attendance', 'leaveRequests', 'adminUsers', 'activity', 'notifications'];

export const roleCatalog = [
  { key: 'super_admin', label: 'Super Admin', description: 'Full access to every website, branch, content, and security setting.' },
  { key: 'content_manager', label: 'Content Manager', description: 'Manage homepage content, menu, promotions, gallery, social, and SEO.' },
  { key: 'branch_manager', label: 'Branch Manager', description: 'Manage assigned branch details, hours, menu availability, and reservations.' },
  { key: 'reservation_manager', label: 'Reservation Manager', description: 'Manage reservations, enquiries, and customer follow-up.' },
  { key: 'viewer', label: 'Viewer', description: 'Read-only access to the admin workspace.' },
];

const statusFor = (index, active = true) => (active ? (index === 2 ? 'Draft' : 'Published') : 'Inactive');

const makeSeedState = () => ({
  user: { name: 'Admin User', email: 'naseebchapatinanpg@gmail.com', role: 'super_admin', avatar: 'AU' },
  menuItems: publicMenuItems.map((item, index) => ({
    ...item,
    order: index + 1,
    slug: item.id,
    status: statusFor(index),
    featured: index < 4,
    bestSeller: index < 3,
    popular: item.popular > 85,
    chefsChoice: item.badge === 'Chef’s Choice',
    vegetarian: Boolean(item.vegetarian),
    halal: true,
    branchAvailability: item.availability,
    stock: index === 6 ? 'Sold out' : 'Available',
    updatedAt: index === 0 ? 'Today, 09:45' : `May ${18 - (index % 6)}, 2026`,
  })),
  categories: publicCategories.map((category, index) => ({
    ...category,
    slug: category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: `Manage ${category.name.toLowerCase()} dishes and branch availability.`,
    order: index + 1,
    status: 'Published',
    featured: index < 6,
    branches: publicBranches.map((branch) => branch.name),
  })),
  branches: publicBranches.map((branch, index) => ({
    ...branch,
    code: `NC-${String(index + 1).padStart(2, '0')}`,
    status: 'Published',
    featured: index === 0,
    manager: index === 0 ? 'Admin User' : 'Unassigned',
    email: contactInfo.email,
    city: branch.name === 'Pasir Gudang' ? 'Pasir Gudang' : branch.name === 'Ayer Hitam' ? 'Ayer Hitam' : 'Johor Bahru',
    country: 'Malaysia',
    timezone: 'Asia/Kuala_Lumpur',
    facilities: branch.facilities,
    updatedAt: 'May 18, 2026',
  })),
  promotions: publicPromotions.map((promotion, index) => ({
    ...promotion,
    slug: promotion.id,
    status: index === 2 ? 'Draft' : 'Published',
    type: index === 0 ? 'Combo meal' : index === 1 ? 'Weekend promotion' : 'Percentage discount',
    startDate: index === 2 ? '' : '2026-05-01',
    endDate: index === 2 ? '' : '2026-06-30',
    featured: index === 0,
    updatedAt: `May ${18 - index}, 2026`,
  })),
  gallery: publicGallery.map((item, index) => ({
    ...item,
    status: 'Published',
    featured: index < 4,
    branch: index % 2 === 0 ? 'Pasir Gudang' : 'All branches',
    uploadedAt: `May ${17 - (index % 5)}, 2026`,
    credit: 'Naseeb Chapati team',
  })),
  reviews: publicReviews.map((review, index) => ({
    ...review,
    id: `review-${index + 1}`,
    status: index < 2 ? 'Approved' : 'Pending',
    featured: index === 1,
    date: `May ${16 - index}, 2026`,
  })),
  reservations: [
    { id: 'RES-1048', name: 'Ahmed R.', phone: '+60 12-345 6789', email: 'ahmed@example.com', branch: 'Pasir Gudang', date: '2026-05-20', time: '19:30', guests: 5, status: 'New', request: 'Family table near the window', submitted: 'Today, 10:30 AM', assigned: 'Unassigned', notes: '' },
    { id: 'RES-1047', name: 'Nur Aisyah', phone: '+60 11-443 2290', email: 'nur@example.com', branch: 'Ayer Hitam', date: '2026-05-20', time: '20:00', guests: 3, status: 'Confirmed', request: 'Birthday dinner', submitted: 'Today, 09:20 AM', assigned: 'Admin User', notes: 'Confirm cake policy.' },
    { id: 'RES-1046', name: 'Daniel Lim', phone: '+60 16-818 9021', email: 'daniel@example.com', branch: 'Angsana JB Mall', date: '2026-05-18', time: '18:30', guests: 2, status: 'Completed', request: '', submitted: 'May 17, 2026', assigned: 'Branch team', notes: '' },
    { id: 'RES-1045', name: 'Siti Rahman', phone: '+60 13-200 1119', email: 'siti@example.com', branch: 'Pasir Gudang', date: '2026-05-22', time: '12:30', guests: 8, status: 'Pending', request: 'High chair if available', submitted: 'May 17, 2026', assigned: 'Unassigned', notes: '' },
  ],
  enquiries: [
    { id: 'ENQ-2201', name: 'Farhan Malik', email: 'farhan@example.com', phone: '+60 12-998 1200', branch: 'Pasir Gudang', subject: 'Large group order', message: 'Can you prepare a family meal for 20 people?', status: 'New', date: 'Today, 08:52 AM', assigned: 'Unassigned', notes: '' },
    { id: 'ENQ-2200', name: 'Liyana S.', email: 'liyana@example.com', phone: '+60 17-540 9008', branch: 'Ayer Hitam', subject: 'Opening hours', message: 'Are you open on the public holiday?', status: 'In Progress', date: 'May 17, 2026', assigned: 'Admin User', notes: 'Check special hours.' },
    { id: 'ENQ-2199', name: 'Jason Tan', email: 'jason@example.com', phone: '+60 18-345 2211', branch: 'All branches', subject: 'Delivery coverage', message: 'Which branch delivers to Taman Rinting?', status: 'Resolved', date: 'May 16, 2026', assigned: 'Branch team', notes: '' },
  ],
  eventEnquiries: [],
  financeTransactions: [
    { id: 'a1111111-1111-4111-8111-111111111111', description: 'Daily counter and dine-in sales', type: 'Income', category: 'Food sales', amount: 4680, transactionDate: '2026-07-12', branch: 'Pasir Gudang', paymentMethod: 'Cash', reference: 'POS-PG-0712', status: 'Posted', notes: 'Sample finance record.' },
    { id: 'a2222222-2222-4222-8222-222222222222', description: 'Online delivery settlement', type: 'Income', category: 'Delivery sales', amount: 2310, transactionDate: '2026-07-11', branch: 'Ayer Hitam', paymentMethod: 'Online', reference: 'DEL-AH-0711', status: 'Posted', notes: 'Sample finance record.' },
    { id: 'a3333333-3333-4333-8333-333333333333', description: 'Fresh produce and pantry restock', type: 'Expense', category: 'Supplies', amount: 680, transactionDate: '2026-07-11', branch: 'Pasir Gudang', paymentMethod: 'Bank transfer', reference: 'SUP-0711', status: 'Posted', notes: 'Sample finance record.' },
    { id: 'a4444444-4444-4444-8444-444444444444', description: 'Monthly electricity bill', type: 'Expense', category: 'Utilities', amount: 420, transactionDate: '2026-07-10', branch: 'Angsana JB Mall', paymentMethod: 'Online', reference: 'UTIL-0710', status: 'Posted', notes: 'Sample finance record.' },
    { id: 'a5555555-5555-4555-8555-555555555555', description: 'Family catering order', type: 'Income', category: 'Catering', amount: 1890, transactionDate: '2026-07-09', branch: 'Pasir Gudang', paymentMethod: 'Card', reference: 'CAT-0709', status: 'Posted', notes: 'Sample finance record.' },
    { id: 'a6666666-6666-4666-8666-666666666666', description: 'Equipment maintenance', type: 'Expense', category: 'Maintenance', amount: 350, transactionDate: '2026-07-08', branch: 'Ayer Hitam', paymentMethod: 'Cash', reference: 'MNT-0708', status: 'Pending', notes: 'Sample finance record.' },
  ],
  staff: [
    { id: 'b1111111-1111-4111-8111-111111111111', employeeCode: 'NC-EMP-001', fullName: 'Aiman Abdullah', role: 'Restaurant Manager', branch: 'Pasir Gudang', phone: '+60 12-400 1111', email: 'aiman@example.com', employmentType: 'Full-time', salary: 3800, startDate: '2024-01-15', status: 'Active', emergencyContact: '+60 12-400 1112', notes: 'Sample HR record.' },
    { id: 'b2222222-2222-4222-8222-222222222222', employeeCode: 'NC-EMP-002', fullName: 'Siti Nur', role: 'Chef', branch: 'Ayer Hitam', phone: '+60 13-400 2222', email: 'siti.nur@example.com', employmentType: 'Full-time', salary: 3200, startDate: '2024-04-08', status: 'Active', emergencyContact: '+60 13-400 2223', notes: 'Sample HR record.' },
    { id: 'b3333333-3333-4333-8333-333333333333', employeeCode: 'NC-EMP-003', fullName: 'Kumar Raj', role: 'Service Crew', branch: 'Angsana JB Mall', phone: '+60 14-400 3333', email: 'kumar.raj@example.com', employmentType: 'Part-time', salary: 1800, startDate: '2025-02-03', status: 'On Leave', emergencyContact: '+60 14-400 3334', notes: 'Sample HR record.' },
    { id: 'b4444444-4444-4444-8444-444444444444', employeeCode: 'NC-EMP-004', fullName: 'Nur Aisyah', role: 'Cashier', branch: 'Pasir Gudang', phone: '+60 15-400 4444', email: 'nur.aisyah@example.com', employmentType: 'Full-time', salary: 2400, startDate: '2025-06-16', status: 'Active', emergencyContact: '+60 15-400 4445', notes: 'Sample HR record.' },
  ],
  attendance: [
    { id: 'c1111111-1111-4111-8111-111111111111', staffId: 'b1111111-1111-4111-8111-111111111111', staffName: 'Aiman Abdullah', employeeCode: 'NC-EMP-001', branch: 'Pasir Gudang', attendanceDate: '2026-07-12', status: 'Present', clockIn: '08:42', clockOut: '', notes: '' },
    { id: 'c2222222-2222-4222-8222-222222222222', staffId: 'b2222222-2222-4222-8222-222222222222', staffName: 'Siti Nur', employeeCode: 'NC-EMP-002', branch: 'Ayer Hitam', attendanceDate: '2026-07-12', status: 'Present', clockIn: '08:55', clockOut: '', notes: '' },
    { id: 'c3333333-3333-4333-8333-333333333333', staffId: 'b4444444-4444-4444-8444-444444444444', staffName: 'Nur Aisyah', employeeCode: 'NC-EMP-004', branch: 'Pasir Gudang', attendanceDate: '2026-07-12', status: 'Late', clockIn: '09:18', clockOut: '', notes: 'Sample HR record.' },
  ],
  leaveRequests: [
    { id: 'd1111111-1111-4111-8111-111111111111', staffId: 'b3333333-3333-4333-8333-333333333333', staffName: 'Kumar Raj', employeeCode: 'NC-EMP-003', branch: 'Angsana JB Mall', leaveType: 'Annual leave', startDate: '2026-07-13', endDate: '2026-07-15', reason: 'Family commitment', status: 'Pending' },
    { id: 'd2222222-2222-4222-8222-222222222222', staffId: 'b2222222-2222-4222-8222-222222222222', staffName: 'Siti Nur', employeeCode: 'NC-EMP-002', branch: 'Ayer Hitam', leaveType: 'Medical leave', startDate: '2026-07-06', endDate: '2026-07-06', reason: 'Medical appointment', status: 'Approved' },
  ],
  social: publicSocial.map((item, index) => ({ ...item, title: item.label, username: index === 0 ? '@naseebchapati' : '', status: 'Active', displayOrder: index + 1, branches: ['All branches'] })),
  homepage: {
    heroHeading: 'Authentic Flavours, Freshly Served',
    heroText: 'Enjoy freshly prepared Pakistani favourites, delicious chapati, flavourful curries, biryani, grills, drinks, and family meals at Naseeb Chapati.',
    desktopImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1800&q=85',
    mobileImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=82',
    primaryButtonLabel: 'View Menu',
    primaryButtonUrl: '/menu',
    secondaryButtonLabel: 'Order Now',
    secondaryButtonUrl: 'https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan',
    heroSlides: [],
    heroAutoplay: true,
    heroSpeed: 6000,
    quickInfo: [
      { icon: 'halal', title: 'Halal food', description: 'Prepared for the whole table' },
      { icon: 'fresh', title: 'Freshly prepared', description: 'Warm plates made to order' },
      { icon: 'family', title: 'Family-friendly dining', description: 'Space to gather and share' },
      { icon: 'takeaway', title: 'Dine-in and takeaway', description: 'Eat in or take it with you' },
      { icon: 'branches', title: 'Multiple branches', description: 'Find a location nearby' },
      { icon: 'order', title: 'Online ordering', description: 'Order ahead with ease' },
    ],
    stats: defaultHomepageStats.map((item) => ({ ...item })),
    signatureLabel: 'Naseeb Signature Dishes',
    trendingTitle: 'Naseeb Signature Dishes',
    trendingSubtitle: 'The favourites our guests come back for, served warm and full of flavour.',
    featuredItems: publicMenuItems.slice(0, 7).map((item) => item.id),
    trendingAutoplay: true,
    trendingSpeed: 4500,
    trendingEffect: true,
    aboutEyebrow: 'About Naseeb Chapati',
    aboutHeading: 'Food that brings people closer.',
    aboutText: 'From traditional recipes to modern favourites, Naseeb Chapati brings the true taste of Pakistan to Malaysia. Our table is made for generous portions, easy conversation, and the comfort of a meal served with care.',
    aboutImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=82',
    aboutImageAlt: 'Naseeb Chapati restaurant dining atmosphere',
    aboutButtonLabel: 'Learn more about us',
    aboutButtonUrl: '/about',
    bestSellingTitle: 'Best-selling dishes',
    branchTitle: 'Find your nearest branch',
    promotionTitle: 'Made for sharing',
    reviewTitle: 'A table worth coming back to.',
    showAbout: true,
    showPromotions: true,
    showReviews: true,
  },
  servicesContent: createDefaultServicesContent(),
  seo: [
    { page: 'Homepage', path: '/', title: 'Naseeb Chapati Restaurant | Authentic Flavours, Freshly Served', description: 'Authentic Pakistani favourites, fresh chapati, naan, biryani, grills, and family meals across Johor.', status: 'Published' },
    { page: 'Menu', path: '/menu', title: 'Full Menu | Naseeb Chapati Restaurant', description: 'Search the Naseeb Chapati menu by dish, category, spice level, vegetarian options, and branch availability.', status: 'Published' },
    { page: 'Services', path: '/services', title: 'Events & Catering Services | Naseeb Chapati Restaurant', description: 'Plan private events, family celebrations, corporate meetings and catering with Naseeb Chapati Restaurant in Johor.', status: 'Published' },
    { page: 'Branches', path: '/branches', title: 'Branches | Naseeb Chapati Restaurant', description: 'Find Naseeb Chapati branches, hours, contact details, and directions.', status: 'Published' },
    { page: 'About Us', path: '/about', title: 'About Us | Naseeb Chapati Restaurant', description: 'Discover the warm, family-first story behind Naseeb Chapati Restaurant.', status: 'Published' },
  ],
  settings: {
    websiteName: 'Naseeb Chapati Restaurant', websiteUrl: 'https://naseebchapati.com', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur', dateFormat: 'DD MMM YYYY', timeFormat: '12-hour', phone: contactInfo.phone, whatsapp: contactInfo.whatsapp, email: contactInfo.email, address: 'Johor, Malaysia', orderUrl: 'https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan', copyright: '© 2026 Naseeb Chapati Restaurant. All rights reserved.', maintenance: false, cookieBanner: false, reservationRecipient: contactInfo.email,
  },
  adminUsers: [
    { id: 'usr-1', name: 'Admin User', email: 'naseebchapatinanpg@gmail.com', role: 'super_admin', branches: ['All branches'], status: 'Active', lastLogin: 'Today, 08:50 AM' },
    { id: 'usr-2', name: 'Content Manager', email: 'content@naseebchapati.com', role: 'content_manager', branches: ['All branches'], status: 'Active', lastLogin: 'Yesterday, 04:20 PM' },
    { id: 'usr-3', name: 'Branch Manager', email: 'pasirgudang@naseebchapati.com', role: 'branch_manager', branches: ['Pasir Gudang'], status: 'Active', lastLogin: 'May 17, 2026' },
  ],
  activity: [
    { action: 'New reservation received', type: 'Reservation', detail: 'RES-1048 by Ahmed R.', by: 'Admin User', date: 'Today, 10:30 AM' },
    { action: 'Menu item updated', type: 'Menu', detail: 'Chapati Kimah updated', by: 'Content Manager', date: 'Today, 09:15 AM' },
    { action: 'Promotion published', type: 'Promotion', detail: 'Family Feast', by: 'Admin User', date: 'May 18, 2026' },
    { action: 'Branch hours changed', type: 'Branch', detail: 'Pasir Gudang hours', by: 'Branch Manager', date: 'May 17, 2026' },
  ],
  notifications: [
    { id: 'notif-1', title: 'New reservation', detail: 'RES-1048 needs a response.', time: '8 min ago', read: false },
    { id: 'notif-2', title: 'Promotion expiring soon', detail: 'Biryani Weekend Special ends in 12 days.', time: '2 hr ago', read: false },
    { id: 'notif-3', title: 'Branch update', detail: 'Ayer Hitam hours were edited.', time: 'Yesterday', read: true },
  ],
});

function normalizeAdminState(state) {
  const seed = makeSeedState();
  const incoming = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
  const incomingHomepage = incoming.homepage && typeof incoming.homepage === 'object' && !Array.isArray(incoming.homepage) ? incoming.homepage : {};
  const normalized = {
    ...seed,
    ...incoming,
    homepage: {
      ...seed.homepage,
      ...incomingHomepage,
      heroSlides: normalizeHeroSlides(incomingHomepage.heroSlides),
    },
    servicesContent: normalizeServicesContent(incoming.servicesContent),
  };
  const arrayKeys = ['menuItems', 'categories', 'branches', 'promotions', 'gallery', 'reviews', 'reservations', 'enquiries', 'eventEnquiries', 'financeTransactions', 'staff', 'attendance', 'leaveRequests', 'adminUsers', 'activity', 'notifications', 'social', 'seo'];
  arrayKeys.forEach((key) => {
    const value = incoming[key];
    normalized[key] = Array.isArray(value)
      ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      : seed[key];
  });
  normalized.categories = normalized.categories.map((category, index) => ({
    ...category,
    icon: category.icon || 'utensils',
    order: Number.isFinite(Number(category.order)) && Number(category.order) > 0 ? Number(category.order) : index + 1,
  }));
  normalized.menuItems = normalized.menuItems.map((item, index) => ({
    ...item,
    order: Number.isFinite(Number(item.order)) && Number(item.order) > 0 ? Number(item.order) : index + 1,
  }));
  ['user', 'settings'].forEach((key) => {
    const value = incoming[key];
    normalized[key] = value && typeof value === 'object' && !Array.isArray(value) ? value : seed[key];
  });
  const featuredItems = incomingHomepage.featuredItems;
  normalized.homepage.featuredItems = Array.isArray(featuredItems) ? featuredItems.filter((item) => typeof item === 'string') : seed.homepage.featuredItems;
  if (!normalized.homepage.trendingTitle || normalized.homepage.trendingTitle === 'Trending now') {
    normalized.homepage.trendingTitle = seed.homepage.trendingTitle;
  }
  const stats = incomingHomepage.stats;
  normalized.homepage.stats = Array.isArray(stats) && stats.length
    ? stats.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `stat-${index + 1}`,
      value: String(item.value ?? ''),
      label: String(item.label ?? ''),
    }))
    : seed.homepage.stats;
  return normalized;
}

export function readAdminState() {
  if (typeof window === 'undefined') return makeSeedState();
  let stored;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return normalizeAdminState(makeSeedState());
  }
  let parsed;
  try {
    parsed = stored ? JSON.parse(stored) : makeSeedState();
  } catch {
    return normalizeAdminState(makeSeedState());
  }
  const normalized = normalizeAdminState(parsed);
  if (stored) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('Admin state is larger than local browser storage; connect Supabase to persist uploads.', error);
    }
  }
  return normalized;
}

export function saveAdminState(state) {
  const normalized = normalizeAdminState(state);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('Admin state could not be saved to local browser storage; connect Supabase for production persistence.', error);
    }
  }
  return normalized;
}

function pickState(state, keys) {
  return keys.reduce((result, key) => ({ ...result, [key]: state[key] }), {});
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fromReservationRow(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    branch: row.branch,
    date: row.reservation_date,
    time: String(row.reservation_time || '').slice(0, 5),
    guests: row.guests,
    request: row.special_request || '',
    status: row.status,
    submitted: row.created_at ? new Date(row.created_at).toLocaleString() : 'Recently',
    assigned: row.assigned_staff || 'Unassigned',
    notes: row.internal_notes || '',
  };
}

function fromEnquiryRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    branch: row.branch,
    subject: row.subject,
    message: row.message,
    status: row.status,
    date: row.created_at ? new Date(row.created_at).toLocaleString() : 'Recently',
    assigned: row.assigned_staff || 'Unassigned',
    notes: row.internal_notes || '',
  };
}

function fromFinanceRow(row) {
  return { id: row.id, description: row.description, type: row.entry_type, category: row.category, amount: Number(row.amount || 0), transactionDate: row.transaction_date, branch: row.branch, paymentMethod: row.payment_method, reference: row.reference || '', status: row.status, notes: row.notes || '' };
}

function fromStaffRow(row) {
  return { id: row.id, employeeCode: row.employee_code, fullName: row.full_name, role: row.role, branch: row.branch, phone: row.phone || '', email: row.email || '', employmentType: row.employment_type, salary: Number(row.monthly_salary || 0), startDate: row.start_date, status: row.status, emergencyContact: row.emergency_contact || '', notes: row.notes || '' };
}

function fromAttendanceRow(row) {
  return { id: row.id, staffId: row.staff_id, staffName: row.staff_name, employeeCode: row.employee_code, branch: row.branch, attendanceDate: row.attendance_date, status: row.status, clockIn: String(row.clock_in || '').slice(0, 5), clockOut: String(row.clock_out || '').slice(0, 5), notes: row.notes || '' };
}

function fromLeaveRow(row) {
  return { id: row.id, staffId: row.staff_id, staffName: row.staff_name, employeeCode: row.employee_code, branch: row.branch, leaveType: row.leave_type, startDate: row.start_date, endDate: row.end_date, reason: row.reason || '', status: row.status };
}

function toFinanceRow(row) {
  if (!UUID_PATTERN.test(row.id || '') || !row.description || !row.transactionDate) return null;
  return { id: row.id, entry_type: row.type || 'Expense', description: row.description, category: row.category || 'Other', amount: Number(row.amount || 0), transaction_date: row.transactionDate, branch: row.branch || 'All branches', payment_method: row.paymentMethod || 'Other', reference: row.reference || null, status: row.status || 'Posted', notes: row.notes || null };
}

function toStaffRow(row) {
  if (!UUID_PATTERN.test(row.id || '') || !row.employeeCode || !row.fullName) return null;
  return { id: row.id, employee_code: row.employeeCode, full_name: row.fullName, role: row.role || 'Other', branch: row.branch || 'All branches', phone: row.phone || null, email: row.email || null, employment_type: row.employmentType || 'Full-time', monthly_salary: Number(row.salary || 0), start_date: row.startDate || null, status: row.status || 'Active', emergency_contact: row.emergencyContact || null, notes: row.notes || null };
}

function toAttendanceRow(row) {
  if (!UUID_PATTERN.test(row.id || '') || !UUID_PATTERN.test(row.staffId || '') || !row.attendanceDate) return null;
  return { id: row.id, staff_id: row.staffId, staff_name: row.staffName || 'Staff member', employee_code: row.employeeCode || '', branch: row.branch || 'All branches', attendance_date: row.attendanceDate, status: row.status || 'Present', clock_in: row.clockIn || null, clock_out: row.clockOut || null, notes: row.notes || null };
}

function toLeaveRow(row) {
  if (!UUID_PATTERN.test(row.id || '') || !UUID_PATTERN.test(row.staffId || '') || !row.startDate || !row.endDate) return null;
  return { id: row.id, staff_id: row.staffId, staff_name: row.staffName || 'Staff member', employee_code: row.employeeCode || '', branch: row.branch || 'All branches', leave_type: row.leaveType || 'Other', start_date: row.startDate, end_date: row.endDate, reason: row.reason || null, status: row.status || 'Pending' };
}

function toReservationRow(row) {
  if (!UUID_PATTERN.test(row.id || '') || !row.date || !row.time) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || null,
    branch: row.branch,
    reservation_date: row.date,
    reservation_time: row.time,
    guests: Number(row.guests || 2),
    special_request: row.request || null,
    status: row.status || 'New',
    internal_notes: row.notes || null,
    assigned_staff: row.assigned || null,
  };
}

function toEnquiryRow(row) {
  if (!UUID_PATTERN.test(row.id || '') || !row.email || !row.subject || !row.message) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    branch: row.branch,
    subject: row.subject,
    message: row.message,
    status: row.status || 'New',
    internal_notes: row.notes || null,
    assigned_staff: row.assigned || null,
  };
}

function fromEventEnquiryRow(row) {
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    eventType: row.event_type,
    serviceType: row.service_type,
    branch: row.branch,
    eventDate: row.event_date,
    startTime: String(row.start_time || '').slice(0, 5),
    guests: Number(row.guests || 1),
    eventSpaceRequired: Boolean(row.event_space_required),
    cateringRequired: Boolean(row.catering_required),
    deliveryLocation: row.delivery_location || '',
    preferredPackage: row.preferred_package || '',
    estimatedBudget: row.estimated_budget || '',
    decorationRequired: Boolean(row.decoration_required),
    specialRequests: row.special_requests || '',
    preferredContactMethod: row.preferred_contact_method || 'WhatsApp',
    consent: Boolean(row.consent),
    status: row.status || 'New',
    assigned: row.assigned_staff || 'Unassigned',
    notes: row.internal_notes || '',
    createdAt: row.created_at,
    archivedAt: row.archived_at || null,
  };
}

function toEventEnquiryRow(row) {
  if (!UUID_PATTERN.test(row.id || '') || !row.reference) return null;
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp || null,
    email: row.email || null,
    event_type: row.eventType,
    service_type: row.serviceType,
    branch: row.branch,
    event_date: row.eventDate,
    start_time: row.startTime,
    guests: Number(row.guests || 1),
    event_space_required: Boolean(row.eventSpaceRequired),
    catering_required: Boolean(row.cateringRequired),
    delivery_location: row.deliveryLocation || null,
    preferred_package: row.preferredPackage || null,
    estimated_budget: row.estimatedBudget || null,
    decoration_required: Boolean(row.decorationRequired),
    special_requests: row.specialRequests || null,
    preferred_contact_method: row.preferredContactMethod || 'WhatsApp',
    consent: Boolean(row.consent),
    status: row.status || 'New',
    assigned_staff: row.assigned || null,
    internal_notes: row.notes || null,
    archived_at: row.archivedAt || null,
  };
}

function mergeAdminState(payload = {}) {
  return normalizeAdminState(payload);
}

export async function loadAdminState() {
  const localState = readAdminState();
  if (!isSupabaseConfigured || !supabase) return { state: localState, source: 'local', error: null };

  const [contentResult, operationsResult, reservationsResult, enquiriesResult, eventEnquiriesResult, financeResult, staffResult, attendanceResult, leaveResult] = await Promise.all([
    supabase.from('naseeb_content_state').select('payload').eq('id', CONTENT_ROW_ID).maybeSingle(),
    supabase.from('naseeb_operations_state').select('payload').eq('id', OPERATIONS_ROW_ID).maybeSingle(),
    supabase.from('naseeb_reservations').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('naseeb_enquiries').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('naseeb_event_enquiries').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('naseeb_finance_transactions').select('*').order('transaction_date', { ascending: false }).limit(500),
    supabase.from('naseeb_staff').select('*').order('full_name', { ascending: true }).limit(500),
    supabase.from('naseeb_attendance').select('*').order('attendance_date', { ascending: false }).limit(500),
    supabase.from('naseeb_leave_requests').select('*').order('created_at', { ascending: false }).limit(500),
  ]);
  const error = contentResult.error || operationsResult.error;
  if (error) return { state: localState, source: 'local', error };

  const remotePayload = { ...(contentResult.data?.payload || {}), ...(operationsResult.data?.payload || {}) };
  if (!reservationsResult.error && reservationsResult.data?.length) remotePayload.reservations = reservationsResult.data.map(fromReservationRow);
  if (!enquiriesResult.error && enquiriesResult.data?.length) remotePayload.enquiries = enquiriesResult.data.map(fromEnquiryRow);
  if (!eventEnquiriesResult.error && eventEnquiriesResult.data) remotePayload.eventEnquiries = eventEnquiriesResult.data.map(fromEventEnquiryRow);
  if (!financeResult.error && financeResult.data) remotePayload.financeTransactions = financeResult.data.map(fromFinanceRow);
  if (!staffResult.error && staffResult.data) remotePayload.staff = staffResult.data.map(fromStaffRow);
  if (!attendanceResult.error && attendanceResult.data) remotePayload.attendance = attendanceResult.data.map(fromAttendanceRow);
  if (!leaveResult.error && leaveResult.data) remotePayload.leaveRequests = leaveResult.data.map(fromLeaveRow);
  const state = mergeAdminState(Object.keys(remotePayload).length ? remotePayload : localState);
  saveAdminState(state);

  if (!Object.keys(remotePayload).length) await persistAdminState(state);
  return { state, source: 'supabase', error: null };
}

export async function persistAdminState(state) {
  const normalized = saveAdminState(state);
  if (!isSupabaseConfigured || !supabase) return { ok: true, source: 'local', error: null };

  const reservationRows = (normalized.reservations || []).map(toReservationRow).filter(Boolean);
  const enquiryRows = (normalized.enquiries || []).map(toEnquiryRow).filter(Boolean);
  const eventEnquiryRows = (normalized.eventEnquiries || []).map(toEventEnquiryRow).filter(Boolean);
  const financeRows = (normalized.financeTransactions || []).map(toFinanceRow).filter(Boolean);
  const staffRows = (normalized.staff || []).map(toStaffRow).filter(Boolean);
  const attendanceRows = (normalized.attendance || []).map(toAttendanceRow).filter(Boolean);
  const leaveRows = (normalized.leaveRequests || []).map(toLeaveRow).filter(Boolean);
  const [contentResult, operationsResult, reservationsResult, enquiriesResult, eventEnquiriesResult, financeResult, staffResult] = await Promise.all([
    supabase.from('naseeb_content_state').upsert({ id: CONTENT_ROW_ID, payload: pickState(normalized, publicStateKeys) }),
    supabase.from('naseeb_operations_state').upsert({ id: OPERATIONS_ROW_ID, payload: pickState(normalized, operationsStateKeys) }),
    reservationRows.length ? supabase.from('naseeb_reservations').upsert(reservationRows, { onConflict: 'id' }) : Promise.resolve({ error: null }),
    enquiryRows.length ? supabase.from('naseeb_enquiries').upsert(enquiryRows, { onConflict: 'id' }) : Promise.resolve({ error: null }),
    eventEnquiryRows.length ? supabase.from('naseeb_event_enquiries').upsert(eventEnquiryRows, { onConflict: 'id' }) : Promise.resolve({ error: null }),
    financeRows.length ? supabase.from('naseeb_finance_transactions').upsert(financeRows, { onConflict: 'id' }) : Promise.resolve({ error: null }),
    staffRows.length ? supabase.from('naseeb_staff').upsert(staffRows, { onConflict: 'id' }) : Promise.resolve({ error: null }),
  ]);
  const [attendanceResult, leaveResult] = await Promise.all([
    attendanceRows.length ? supabase.from('naseeb_attendance').upsert(attendanceRows, { onConflict: 'id' }) : Promise.resolve({ error: null }),
    leaveRows.length ? supabase.from('naseeb_leave_requests').upsert(leaveRows, { onConflict: 'id' }) : Promise.resolve({ error: null }),
  ]);
  const error = contentResult.error || operationsResult.error || reservationsResult.error || enquiriesResult.error || eventEnquiriesResult.error || financeResult.error || staffResult.error || attendanceResult.error || leaveResult.error;
  return { ok: !error, source: error ? 'local' : 'supabase', error };
}

export async function signInAdmin({ email, password }) {
  if (!supabase) return { data: null, error: null };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutAdmin() {
  if (supabase) await supabase.auth.signOut();
}

export function sessionFromSupabaseUser(user) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Admin User';
  const role = user.app_metadata?.role || user.user_metadata?.role || 'super_admin';
  return { id: user.id, name, email: user.email, role, avatar: name.slice(0, 2).toUpperCase() };
}

export function readAdminSession() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

export function saveAdminSession(session) {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAdminSession() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(SESSION_KEY);
}

export { STORAGE_KEY };

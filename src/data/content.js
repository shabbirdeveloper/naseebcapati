import { createDefaultServicesContent, normalizeServicesContent } from '../services/servicesSeed';

function readPersistedAdminState() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(window.localStorage.getItem('naseeb-admin-state-v1') || 'null'); } catch { return null; }
}

const persistedAdminState = readPersistedAdminState();

export const imageUrls = {
  hero: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1800&q=85',
  interior: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=82',
  naan: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=82',
  curry: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=82',
  biryani: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=82',
  grill: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=82',
  dessert: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=900&q=82',
  drinks: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=82',
  family: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=82',
  kitchen: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=82',
};

export const defaultHomepageStats = [
  { id: 'years', value: '2+', label: 'Years of Excellence' },
  { id: 'menu-items', value: '60+', label: 'Menu Items' },
  { id: 'customers', value: '15k+', label: 'Happy Customers' },
  { id: 'services', value: '4+', label: 'Event Services' },
];

const defaultHomepageContent = {
  heroHeading: 'Authentic Flavours, Freshly Served',
  heroText: 'Enjoy freshly prepared Pakistani favourites, delicious chapati, flavourful curries, biryani, grills, drinks, and family meals at Naseeb Chapati.',
  desktopImage: imageUrls.hero,
  mobileImage: imageUrls.hero,
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
  stats: defaultHomepageStats,
  signatureLabel: 'Naseeb Signature Dishes',
  trendingTitle: 'Naseeb Signature Dishes',
  trendingSubtitle: 'The favourites our guests come back for, served warm and full of flavour.',
  featuredItems: [],
  trendingAutoplay: true,
  trendingSpeed: 4500,
  trendingEffect: true,
  aboutEyebrow: 'About Naseeb Chapati',
  aboutHeading: 'Food that brings people closer.',
  aboutText: 'From traditional recipes to modern favourites, Naseeb Chapati brings the true taste of Pakistan to Malaysia. Our table is made for generous portions, easy conversation, and the comfort of a meal served with care.',
  aboutImage: imageUrls.interior,
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
};

const persistedHomepageContent = persistedAdminState?.homepage || {};
export const homepageContent = {
  ...defaultHomepageContent,
  ...persistedHomepageContent,
  trendingTitle: persistedHomepageContent.trendingTitle === 'Trending now'
    ? defaultHomepageContent.signatureLabel
    : persistedHomepageContent.trendingTitle || persistedHomepageContent.signatureLabel || defaultHomepageContent.signatureLabel,
};

export function normalizeHeroSlides(value) {
  let slides = value;
  if (typeof slides === 'string') {
    try { slides = JSON.parse(slides); } catch { slides = []; }
  }
  if (!Array.isArray(slides)) return [];
  return slides.filter((slide) => slide && typeof slide === 'object' && !Array.isArray(slide)).map((slide, index) => ({
    ...slide,
    id: typeof slide.id === 'string' && slide.id.trim() ? slide.id : `hero-${index + 1}`,
    heading: typeof slide.heading === 'string' ? slide.heading : '',
    text: typeof slide.text === 'string' ? slide.text : '',
    desktopImage: typeof slide.desktopImage === 'string' ? slide.desktopImage : '',
    mobileImage: typeof slide.mobileImage === 'string' ? slide.mobileImage : '',
    imageAlt: typeof slide.imageAlt === 'string' ? slide.imageAlt : '',
    active: slide.active !== false,
    order: Number.isFinite(Number(slide.order)) ? Number(slide.order) : index + 1,
  }));
}

const configuredHeroSlides = normalizeHeroSlides(homepageContent.heroSlides);

export const heroSlides = configuredHeroSlides.length ? configuredHeroSlides : [
  { id: 'hero-main', heading: homepageContent.heroHeading, text: homepageContent.heroText, desktopImage: homepageContent.desktopImage, mobileImage: homepageContent.mobileImage, primaryButtonLabel: homepageContent.primaryButtonLabel, primaryButtonUrl: homepageContent.primaryButtonUrl, secondaryButtonLabel: homepageContent.secondaryButtonLabel, secondaryButtonUrl: homepageContent.secondaryButtonUrl },
  { id: 'hero-sharing', heading: 'Made for sharing', text: 'Gather around warm chapati, fragrant biryani, generous curries, and family favourites prepared with care.', desktopImage: imageUrls.family, mobileImage: imageUrls.family, primaryButtonLabel: 'Explore the Menu', primaryButtonUrl: '/menu', secondaryButtonLabel: 'Find a Branch', secondaryButtonUrl: '/branches' },
  { id: 'hero-grill', heading: 'Warm plates. Big flavour.', text: 'From tandoori grills to comforting drinks and desserts, find something everyone at the table will enjoy.', desktopImage: imageUrls.grill, mobileImage: imageUrls.grill, primaryButtonLabel: 'View Menu', primaryButtonUrl: '/menu', secondaryButtonLabel: 'Order Now', secondaryButtonUrl: 'https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan' },
];

const fallbackMenuCategories = [
  { name: 'Chapati and Bread', image: imageUrls.naan, icon: 'bread' },
  { name: 'Breakfast', image: imageUrls.family, icon: 'sunrise' },
  { name: 'Chicken Dishes', image: imageUrls.grill, icon: 'drumstick' },
  { name: 'Mutton Dishes', image: imageUrls.curry, icon: 'pot' },
  { name: 'Biryani and Rice', image: imageUrls.biryani, icon: 'bowl' },
  { name: 'Curry', image: imageUrls.curry, icon: 'pot' },
  { name: 'Tandoori and Grill', image: imageUrls.grill, icon: 'flame' },
  { name: 'Family Platters', image: imageUrls.family, icon: 'users' },
  { name: 'Fast Food', image: imageUrls.grill, icon: 'sandwich' },
  { name: 'Hot Drinks', image: imageUrls.drinks, icon: 'coffee' },
  { name: 'Cold Drinks', image: imageUrls.drinks, icon: 'glass' },
  { name: 'Desserts', image: imageUrls.dessert, icon: 'cake' },
];

export const menuCategories = (persistedAdminState?.categories?.length
  ? persistedAdminState.categories.filter((item) => item.status !== 'Archived' && item.status !== 'Inactive')
  : fallbackMenuCategories)
  .map((category, index) => ({
    ...category,
    icon: category.icon || 'utensils',
    order: Number.isFinite(Number(category.order)) && Number(category.order) > 0 ? Number(category.order) : index + 1,
  }))
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

// Public reference menu seed. Confirm final prices, ingredients, and availability with the restaurant before launch.
const fallbackMenuItems = [
  { id: 'nan-cheese-mozzarella-kimah', name: 'Nan Cheese Mozzarella Kimah', category: 'Chapati and Bread', filter: 'Main Course', description: 'Warm naan with stretchy mozzarella and seasoned minced meat.', ingredients: 'Naan, mozzarella cheese, minced meat, herbs.', price: 21, image: imageUrls.naan, badge: 'Best Seller', spicy: false, vegetarian: false, availability: ['Pasir Gudang', 'Ayer Hitam'], popular: 98 },
  { id: 'chapati-kimah', name: 'Chapati Kimah', category: 'Chapati and Bread', filter: 'Main Course', description: 'Soft chapati served with a fragrant minced-meat kimah.', ingredients: 'Chapati, minced meat, onion, spices.', price: 11, image: imageUrls.naan, badge: 'Popular', spicy: true, vegetarian: false, availability: ['Pasir Gudang', 'Ayer Hitam'], popular: 94 },
  { id: 'ayam-tandoori', name: 'Ayam Tandoori', category: 'Tandoori and Grill', filter: 'Grill', description: 'Charred tandoori chicken with warm spices and a smoky finish.', ingredients: 'Chicken, yoghurt, tandoori spices, lemon.', price: 12, image: imageUrls.grill, badge: 'Chef’s Choice', spicy: true, vegetarian: false, availability: ['Pasir Gudang', 'Ayer Hitam', 'Angsana JB Mall'], popular: 96 },
  { id: 'biryani-kambing', name: 'Biryani Kambing', category: 'Biryani and Rice', filter: 'Main Course', description: 'Fragrant basmati rice served with tender mutton and accompaniments.', ingredients: 'Basmati rice, mutton, spices, egg, cucumber.', price: 27.5, image: imageUrls.biryani, badge: 'Popular', spicy: true, vegetarian: false, availability: ['Pasir Gudang', 'Ayer Hitam'], popular: 95 },
  { id: 'kimah', name: 'Kimah', category: 'Curry', filter: 'Main Course', description: 'A rich, slow-cooked minced-meat dish with aromatic spices.', ingredients: 'Minced meat, onion, tomato, spices.', price: 8, image: imageUrls.curry, badge: 'Popular', spicy: true, vegetarian: false, availability: ['Pasir Gudang', 'Ayer Hitam'], popular: 90 },
  { id: 'kebab-pakistan', name: 'Kebab Pakistan', category: 'Tandoori and Grill', filter: 'Grill', description: 'Seasoned kebab with a savoury char and tender centre.', ingredients: 'Minced meat, herbs, spices.', price: 8, image: imageUrls.grill, badge: 'Chef’s Choice', spicy: true, vegetarian: false, availability: ['Pasir Gudang', 'Ayer Hitam'], popular: 89 },
  { id: 'daal', name: 'Daal', category: 'Curry', filter: 'Main Course', description: 'Comforting lentils seasoned with a gentle tempering of spices.', ingredients: 'Lentils, onion, garlic, spices.', price: 7, image: imageUrls.curry, badge: 'Vegetarian', spicy: false, vegetarian: true, availability: ['Pasir Gudang', 'Ayer Hitam'], popular: 83 },
  { id: 'puri-kimah', name: 'Puri Kimah', category: 'Breakfast', filter: 'Breakfast', description: 'Crisp, airy puri paired with seasoned minced meat and chutney.', ingredients: 'Puri, minced meat, chutney, herbs.', price: 12, image: imageUrls.naan, badge: 'Popular', spicy: true, vegetarian: false, availability: ['Pasir Gudang', 'Ayer Hitam'], popular: 86 },
  { id: 'nasi-goreng-pattya', name: 'Nasi Goreng Pattya', category: 'Fast Food', filter: 'Main Course', description: 'A wok-fried rice favourite with a satisfying savoury finish.', ingredients: 'Rice, egg, vegetables, seasoning.', price: 13, image: imageUrls.biryani, badge: 'Popular', spicy: false, vegetarian: false, availability: ['Scientex Utama'], popular: 79 },
  { id: 'carrot-juice', name: 'Carrot Juice', category: 'Cold Drinks', filter: 'Drinks', description: 'Freshly blended carrot juice, bright and naturally sweet.', ingredients: 'Carrot.', price: 10.1, image: imageUrls.drinks, badge: 'Fresh', spicy: false, vegetarian: true, availability: ['Pasir Gudang'], popular: 72 },
  { id: 'carrot-susu', name: 'Carrot Susu', category: 'Cold Drinks', filter: 'Drinks', description: 'Fresh carrot juice blended with milk for a creamy finish.', ingredients: 'Carrot, milk.', price: 11, image: imageUrls.drinks, badge: 'Fresh', spicy: false, vegetarian: true, availability: ['Pasir Gudang'], popular: 71 },
  { id: 'horlicks', name: 'Horlicks', category: 'Hot Drinks', filter: 'Drinks', description: 'A warm, malted drink for an easy finish to any meal.', ingredients: 'Malted drink mix, milk.', price: null, image: imageUrls.drinks, badge: 'Family Favourite', spicy: false, vegetarian: true, availability: ['Pasir Gudang'], popular: 67 },
];

export const menuItems = (persistedAdminState?.menuItems?.length
  ? persistedAdminState.menuItems.filter((item) => ['Published', 'Active', undefined].includes(item.status) && item.status !== 'Archived' && item.status !== 'Inactive')
  : fallbackMenuItems)
  .map((item, index) => ({
    ...item,
    order: Number.isFinite(Number(item.order)) && Number(item.order) > 0 ? Number(item.order) : index + 1,
    availability: Array.isArray(item.availability) ? item.availability : (Array.isArray(item.branchAvailability) ? item.branchAvailability : []),
  }))
  .sort((a, b) => a.order - b.order || String(a.name || '').localeCompare(String(b.name || '')));

export const branches = persistedAdminState?.branches?.length ? persistedAdminState.branches.filter((item) => item.status !== 'Archived' && item.status !== 'Inactive') : [
  {
    slug: 'pasir-gudang', name: 'Pasir Gudang', shortName: 'Kawasan Perindustrian Pasir Gudang',
    address: 'No. 23, Jalan Mawar Merah 3/1, Business Centre 2, 81700 Pasir Gudang, Johor, Malaysia',
    phone: '+60 11-2166 4379', whatsapp: '+601121664379', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Naseeb+Capati+Nan+Pasir+Gudang',
    mapQuery: 'Naseeb Capati Nan Pasir Gudang Johor',
    hours: { 0: ['07:00', '23:30'], 1: ['02:00', '17:00'], 2: ['02:00', '17:00'], 3: ['02:00', '17:00'], 4: ['02:00', '17:00'], 5: ['02:00', '17:00'], 6: ['02:00', '17:00'] },
    facilities: ['Dine-in', 'Takeaway', 'Delivery', 'Family seating'], image: imageUrls.interior,
    sourceNote: 'Public directory and delivery listing reference; confirm before publishing as official.',
  },
  {
    slug: 'ayer-hitam', name: 'Ayer Hitam', shortName: 'Pusat Bandar Bahru',
    address: '11, Jalan Bandar Baru 6, Pusat Bandar Bahru, 86100 Ayer Hitam, Johor, Malaysia',
    phone: '+60 11-5122 0039', whatsapp: '+601151220039', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Naseeb+Capati+Nan+Ayer+Hitam',
    mapQuery: 'Naseeb Capati Nan Ayer Hitam Johor',
    hours: { 0: ['08:00', '23:30'], 1: ['08:00', '23:30'], 2: ['08:00', '23:30'], 3: ['08:00', '23:30'], 4: ['08:00', '23:30'], 5: ['08:00', '23:30'], 6: ['08:00', '23:30'] },
    facilities: ['Dine-in', 'Takeaway', 'Delivery', 'Family seating'], image: imageUrls.family,
    sourceNote: 'Public map and delivery listing reference; confirm before publishing as official.',
  },
  {
    slug: 'angsana-jb-mall', name: 'Angsana JB Mall', shortName: 'Bandar Baru Uda',
    address: 'Lot L1-45, Angsana JB Mall, Bandar Baru Uda, 81200 Johor Bahru, Johor, Malaysia',
    phone: '+60 18-788 0082', whatsapp: '+60187880082', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Naseeb+Capati+Nan+Angsana+JB+Mall',
    mapQuery: 'Naseeb Capati Nan Angsana JB Mall Johor Bahru',
    hours: { 0: ['00:00', '23:59'], 1: ['00:00', '23:59'], 2: ['00:00', '23:59'], 3: ['00:00', '23:59'], 4: ['00:00', '23:59'], 5: ['00:00', '23:59'], 6: ['00:00', '23:59'] },
    facilities: ['Mall seating', 'Takeaway', 'Delivery', 'Family seating'], image: imageUrls.interior,
    sourceNote: 'Public directory reference; confirm branch ownership, phone, and hours before publishing as official.',
  },
];

function promotionIsLive(item) {
  if (item.active === false || ['Archived', 'Inactive', 'Expired'].includes(item.status)) return false;
  const now = new Date();
  const starts = item.startDate ? new Date(`${item.startDate}T${item.startTime || '00:00'}:00`) : null;
  const ends = item.endDate ? new Date(`${item.endDate}T${item.endTime || '23:59'}:59`) : null;
  return (!starts || now >= starts) && (!ends || now <= ends);
}

export const promotions = persistedAdminState?.promotions?.length ? persistedAdminState.promotions.filter((item) => ['Published', 'Active', undefined].includes(item.status) && promotionIsLive(item)).map((item) => ({ ...item, active: true })) : [
  { id: 'family-feast', title: 'Family Feast', details: 'A generous spread for sharing with family and friends.', validity: 'Add active dates', branches: 'All branches', terms: 'Subject to branch availability. Confirm offer details with the restaurant.', image: imageUrls.family, active: true },
  { id: 'biryani-weekend', title: 'Biryani Weekend Special', details: 'Make the weekend memorable with fragrant rice and rich, slow-cooked flavours.', validity: 'Add active dates', branches: 'Selected branches', terms: 'Offer terms, dates, and serving times to be confirmed by the restaurant.', image: imageUrls.biryani, active: true },
  { id: 'student-meal', title: 'Student Meal', details: 'A satisfying plate for study breaks and late-night cravings.', validity: 'Add active dates', branches: 'Add applicable branch', terms: 'Valid student ID may be required. Final terms to be confirmed.', image: imageUrls.grill, active: true },
];

export const reviews = persistedAdminState?.reviews?.length ? persistedAdminState.reviews.filter((item) => ['Approved', 'Published', undefined].includes(item.status)) : [
  { name: 'Google guest', text: 'The food was good. The capati are two large pieces on a single serving.', rating: 4, source: 'Public review reference', branch: 'Angsana JB Mall' },
  { name: 'Google guest', text: 'One of the best places to have capati or briyani. The food was really good.', rating: 5, source: 'Public review reference', branch: 'Angsana JB Mall' },
  { name: 'Food delivery guest', text: 'Capati, roti, kimah and kebab all good. Biryani kambing recommended.', rating: 5, source: 'Public delivery review reference', branch: 'Pasir Gudang' },
];

const persistedGalleryItems = persistedAdminState?.gallery?.filter((item) => ['Published', 'Active', undefined].includes(item.status) && item.image && !item.image.startsWith('blob:')) || [];

export const galleryItems = persistedGalleryItems.length ? persistedGalleryItems : [
  { id: 'gallery-food-1', title: 'Fresh chapati and curry', category: 'Food', image: imageUrls.naan, alt: 'Fresh flatbread served with curry' },
  { id: 'gallery-food-2', title: 'Biryani for sharing', category: 'Food', image: imageUrls.biryani, alt: 'Fragrant biryani with herbs' },
  { id: 'gallery-food-3', title: 'Charcoal grill favourites', category: 'Food', image: imageUrls.grill, alt: 'Grilled meat served with herbs' },
  { id: 'gallery-interior', title: 'A warm table awaits', category: 'Interior', image: imageUrls.interior, alt: 'Warm restaurant interior with tables and chairs' },
  { id: 'gallery-family', title: 'Made for sharing', category: 'Customers', image: imageUrls.family, alt: 'Family-style food spread on a table' },
  { id: 'gallery-kitchen', title: 'Prepared with care', category: 'Behind the Scenes', image: imageUrls.kitchen, alt: 'Chef preparing food in a restaurant kitchen' },
  { id: 'gallery-drinks', title: 'Cool, bright drinks', category: 'Food', image: imageUrls.drinks, alt: 'Colourful cold drinks on a table' },
  { id: 'gallery-dessert', title: 'A sweet finish', category: 'Food', image: imageUrls.dessert, alt: 'Dessert in a white bowl' },
];

export const socialLinks = persistedAdminState?.social?.length ? persistedAdminState.social.filter((item) => item.status !== 'Inactive' && item.status !== 'Archived') : [
  { label: 'Facebook', href: 'https://www.facebook.com/', className: 'facebook', username: 'Naseeb Chapati', description: 'Follow our page for restaurant news, promotions, and daily updates.', ctaLabel: 'Like page' },
  { label: 'Instagram', href: 'https://www.instagram.com/', className: 'instagram', username: 'Naseeb Chapati', description: 'Explore fresh dishes, restaurant moments, and food photography.', ctaLabel: 'Follow us' },
  { label: 'TikTok', href: 'https://www.tiktok.com/', className: 'tiktok', username: 'Naseeb Chapati', description: 'Watch our latest food videos, kitchen moments, and behind-the-scenes stories.', ctaLabel: 'Watch now' },
  { label: 'Google Business', href: 'https://www.google.com/maps/search/?api=1&query=Naseeb+Capati+Nan+Malaysia', className: 'google', username: 'Google Reviews', description: 'Read guest feedback and leave your own review for Naseeb Chapati.', ctaLabel: 'Write a review' },
];

export const servicesContent = normalizeServicesContent(
  persistedAdminState?.servicesContent || createDefaultServicesContent(),
);

export const contactInfo = persistedAdminState?.settings ? {
  email: persistedAdminState.settings.email,
  phone: persistedAdminState.settings.phone,
  whatsapp: persistedAdminState.settings.whatsapp,
  address: persistedAdminState.settings.address || '',
  orderUrl: persistedAdminState.settings.orderUrl || 'https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan',
  copyright: persistedAdminState.settings.copyright || '© 2026 Naseeb Chapati Restaurant. All rights reserved.',
} : {
  email: 'info@naseebchapati.com',
  phone: '+60 11-2166 4379',
  whatsapp: '+601121664379',
  address: 'Johor, Malaysia',
  orderUrl: 'https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan',
  copyright: '© 2026 Naseeb Chapati Restaurant. All rights reserved.',
};

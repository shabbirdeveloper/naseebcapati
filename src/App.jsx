import { Component, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m as motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bike, BookOpen, Check, ChevronLeft, ChevronRight, CircleAlert, Clock3, Flame, Heart, Home, Leaf, Mail, MapPin, Menu as MenuIcon, MessageCircle, Moon, Navigation, Phone, Search, Send, Share2, ShoppingBag, ShoppingCart, Star, TicketPercent, Utensils, Users, X, } from 'lucide-react';
import { branches, contactInfo, galleryItems, heroSlides, homepageContent, imageUrls, menuCategories, menuItems, promotions, reviews, socialLinks } from './data/content';
import AdminApp from './admin/AdminApp';
import { submitEnquiry, submitReservation } from './lib/supabase';
import { MotionCard, MotionGroup, MotionImage, MotionPage, MotionReveal, buttonTransition, drawerTransition, headerVariants, itemVariants, staggerVariants } from './motion';

const navItems = [
  { label: 'Home', href: '/' }, { label: 'Menu', href: '/menu' }, { label: 'About Us', href: '/about' }, { label: 'Branches', href: '/branches' }, { label: 'Gallery', href: '/gallery' }, { label: 'Promotions', href: '/promotions' }, { label: 'Contact', href: '/contact' },
];

const routeMeta = {
  '/': ['Naseeb Chapati Restaurant | Authentic Flavours, Freshly Served', 'Authentic Pakistani favourites, fresh chapati, naan, biryani, grills, and family meals across Johor.'],
  '/menu': ['Full Menu | Naseeb Chapati Restaurant', 'Search the Naseeb Chapati menu by dish, category, spice level, vegetarian options, and branch availability.'],
  '/about': ['About Us | Naseeb Chapati Restaurant', 'Discover the warm, family-first story behind Naseeb Chapati Restaurant.'],
  '/branches': ['Branches | Naseeb Chapati Restaurant', 'Find Naseeb Chapati branches, independent opening hours, contact details, and directions.'],
  '/gallery': ['Gallery | Naseeb Chapati Restaurant', 'A visual taste of Naseeb Chapati food, interiors, preparation, and family dining.'],
  '/promotions': ['Promotions | Naseeb Chapati Restaurant', 'See current Naseeb Chapati offers and branch-specific promotions.'],
  '/contact': ['Contact | Naseeb Chapati Restaurant', 'Contact Naseeb Chapati Restaurant for reservations, orders, directions, and questions.'],
};

function getBranchFromPath(path) {
  if (!path.startsWith('/branches/')) return null;
  const slug = path.split('/').filter(Boolean)[1];
  return branches.find((branch) => branch.slug === slug) || null;
}

function getPageMeta(path) {
  const branch = getBranchFromPath(path);
  if (branch) return [`${branch.name} Branch | Naseeb Chapati Restaurant`, `Visit Naseeb Chapati ${branch.name} for Pakistani favourites, branch-specific opening hours, directions, and ordering options.`];
  return routeMeta[path] || ['Naseeb Chapati Restaurant', routeMeta['/'][1]];
}

function buildRestaurantSchema(path) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const toOpeningHours = (branch) => Object.entries(branch.hours || {}).map(([day, range]) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: dayNames[Number(day)],
    opens: range[0],
    closes: range[1],
  }));
  const branchEntities = branches.map((branch) => ({
    '@type': 'Restaurant',
    name: `Naseeb Chapati Restaurant — ${branch.name}`,
    address: { '@type': 'PostalAddress', streetAddress: branch.address, addressCountry: 'MY' },
    telephone: branch.phone,
    openingHoursSpecification: toOpeningHours(branch),
    url: `https://naseebchapati.com/branches/${branch.slug}`,
  }));
  const selectedBranch = getBranchFromPath(path);
  return {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'LocalBusiness'],
    name: 'Naseeb Chapati Restaurant',
    url: 'https://naseebchapati.com',
    telephone: contactInfo.phone,
    email: contactInfo.email,
    servesCuisine: ['Pakistani', 'Malaysian'],
    menu: 'https://naseebchapati.com/menu',
    sameAs: socialLinks.map((social) => social.href),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Naseeb Chapati menu', url: 'https://naseebchapati.com/menu' },
    department: branchEntities,
    ...(selectedBranch ? { mainEntity: branchEntities.find((branch) => branch.name.endsWith(selectedBranch.name)) } : {}),
  };
}

function getPath() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  return pathname;
}

function navigateTo(href) {
  if (href.startsWith('http')) return;
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatPrice(price) {
  if (price == null || price === '') return 'Ask in branch';
  const numeric = Number(price);
  return Number.isFinite(numeric) ? `RM ${numeric.toFixed(2).replace('.00', '')}` : 'Ask in branch';
}

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function getBranchStatus(branch, now = new Date()) {
  const day = now.getDay();
  const today = branch.hours[day];
  if (!today) return { label: 'Hours pending', open: false, detail: 'Please call ahead' };
  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(today[0]);
  const close = toMinutes(today[1]);
  const isOvernight = close < open;
  const isOpen = isOvernight ? current >= open || current <= close : current >= open && current <= close;
  return { label: isOpen ? 'Open now' : 'Closed', open: isOpen, detail: `${formatTime(today[0])} – ${formatTime(today[1])}` };
}

function formatTime(time) {
  const [hourString, minute] = time.split(':');
  const hour = Number(hourString);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const shownHour = hour % 12 || 12;
  return `${shownHour}:${minute} ${suffix}`;
}

function setPageMeta(path) {
  const [title, description] = getPageMeta(path);
  document.title = title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute('content', description);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `https://naseebchapati.com${path === '/' ? '/' : path}`);
  let schemaScript = document.getElementById('naseeb-restaurant-schema');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'naseeb-restaurant-schema';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }
  schemaScript.textContent = JSON.stringify(buildRestaurantSchema(path));
}

function Logo({ light = false }) {
  return (
    <a className={`logo-lockup ${light ? 'logo-light' : ''}`} href="/" onClick={(event) => { event.preventDefault(); navigateTo('/'); }} aria-label="Naseeb Chapati Restaurant home">
      <img className="site-logo" src="/naseeb-chapati-logo.png" alt="Naseeb Chapati Restaurant" />
    </a>
  );
}

function SafeImage({ src, fallback = imageUrls.naan, alt = '', ...props }) {
  const [source, setSource] = useState(src || fallback);
  useEffect(() => setSource(src || fallback), [src, fallback]);
  return <img {...props} src={source} alt={alt} onError={() => setSource((current) => current === fallback ? current : fallback)} />;
}

function Button({ children, href, variant = 'primary', icon: Icon, onClick, type = 'button', className = '' }) {
  const reduceMotion = useReducedMotion();
  const classes = `button button-${variant} ${className}`;
  const content = <>{children}{Icon ? <Icon size={16} strokeWidth={2.2} /> : null}</>;
  const motionProps = { whileHover: reduceMotion ? undefined : { y: -2 }, whileTap: reduceMotion ? undefined : { scale: .98 }, transition: buttonTransition };
  if (href?.startsWith('http')) return <motion.a {...motionProps} className={classes} href={href} target="_blank" rel="noreferrer">{content}</motion.a>;
  if (href) return <motion.a {...motionProps} className={classes} href={href} onClick={(event) => { event.preventDefault(); navigateTo(href); }}>{content}</motion.a>;
  return <motion.button {...motionProps} className={classes} type={type} onClick={onClick}>{content}</motion.button>;
}

const CartContext = createContext(null);

function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = window.localStorage.getItem('naseeb-cart-v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { window.localStorage.setItem('naseeb-cart-v1', JSON.stringify(items)); }, [items]);
  const addItem = useCallback((item, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) return current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry);
      return [...current, { ...item, quantity }];
    });
    setIsOpen(true);
  }, []);
  const updateQuantity = useCallback((id, quantity) => {
    setItems((current) => quantity <= 0 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item));
  }, []);
  const clearCart = useCallback(() => setItems([]), []);
  const itemCount = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((total, item) => total + (Number(item.price) || 0) * item.quantity, 0), [items]);
  const orderText = useMemo(() => {
    if (!items.length) return 'Hi Naseeb Chapati, I would like to place an order.';
    const lines = items.map((item) => `- ${item.name} x${item.quantity} (${formatPrice(item.price)})`);
    return `Hi Naseeb Chapati, I would like to place an order:\n${lines.join('\n')}\nEstimated total: ${formatPrice(subtotal)}`;
  }, [items, subtotal]);
  const value = useMemo(() => ({ items, itemCount, subtotal, orderText, isOpen, addItem, updateQuantity, clearCart, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false), toggleCart: () => setIsOpen((open) => !open) }), [items, itemCount, subtotal, orderText, isOpen, addItem, updateQuantity, clearCart]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  return useContext(CartContext);
}

function CartAddButton({ item, label = 'Add' }) {
  const { addItem } = useCart();
  return <Button variant="small" icon={ShoppingCart} onClick={() => addItem(item)}>{label}</Button>;
}

function CartDrawer() {
  const { items, itemCount, subtotal, orderText, isOpen, updateQuantity, clearCart, closeCart } = useCart();
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeCart]);
  const orderUrl = `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(orderText)}`;
  return <AnimatePresence>{isOpen && <><motion.div className="cart-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && closeCart()} /><motion.aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your order" initial={{ x: reduceMotion ? 0 : '100%' }} animate={{ x: 0 }} exit={{ x: reduceMotion ? 0 : '100%' }} transition={reduceMotion ? { duration: 0 } : drawerTransition}><div className="cart-drawer-header"><div><span className="eyebrow">Your order</span><h2>Cart <span>({itemCount})</span></h2></div><button className="icon-button" onClick={closeCart} aria-label="Close cart"><X size={20} /></button></div>{items.length ? <><div className="cart-items">{items.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-copy"><strong>{item.name}</strong><span>{formatPrice(item.price)}</span><div className="cart-quantity"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</button></div></div><strong className="cart-item-total">{formatPrice((Number(item.price) || 0) * item.quantity)}</strong></div>)}</div><div className="cart-summary"><div><span>Estimated total</span><strong>{formatPrice(subtotal)}</strong></div><a className="button button-accent cart-order-button" href={orderUrl} target="_blank" rel="noreferrer"><MessageCircle size={17} />Order on WhatsApp</a><button className="cart-clear" onClick={clearCart}>Clear cart</button><p>Final availability and total will be confirmed by the restaurant team.</p></div></> : <div className="cart-empty"><ShoppingCart size={34} /><h3>Your cart is empty</h3><p>Add dishes from the menu and they’ll appear here for one easy order.</p><Button href="/menu" variant="primary" icon={BookOpen}>Browse menu</Button></div>}</motion.aside></>}</AnimatePresence>;
}

function SectionHeading({ title, copy, action, align = 'left' }) {
  return <MotionReveal className={`section-heading align-${align}`} amount={.25} y={16}>
    <div><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
    {action}
  </MotionReveal>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = getPath() === '/';
  const reduceMotion = useReducedMotion();
  const { itemCount, toggleCart } = useCart();
  useEffect(() => { document.body.classList.toggle('nav-open', open); return () => document.body.classList.remove('nav-open'); }, [open]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const close = () => setOpen(false);
  return <>
    <motion.header className={`site-header ${isHome ? 'site-header-home' : ''} ${scrolled ? 'is-scrolled' : ''}`} initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={headerVariants}>
      <div className="container header-inner">
        <Logo />
        <motion.nav className="desktop-nav" aria-label="Primary navigation" initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={staggerVariants}>{navItems.map((item) => <motion.a variants={itemVariants} key={item.href} className={getPath() === item.href ? 'active' : ''} href={item.href} onClick={(event) => { event.preventDefault(); navigateTo(item.href); }}>{item.href === '/menu' && <BookOpen size={15} />}<span>{item.label}</span></motion.a>)}</motion.nav>
        <div className="header-actions"><button className="cart-trigger" type="button" onClick={toggleCart} aria-label={`Open cart${itemCount ? `, ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}`}><ShoppingCart size={19} /><span className="cart-trigger-label">Cart</span>{itemCount > 0 && <span className="cart-count">{itemCount}</span>}</button><Button href={contactInfo.orderUrl} variant="primary" icon={ShoppingBag}>{homepageContent.secondaryButtonLabel || 'Order Now'}</Button><button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={22} /> : <MenuIcon size={22} />}</button></div>
      </div>
    </motion.header>
    <AnimatePresence>{open && <motion.div className="mobile-nav is-open" aria-hidden={!open} initial={reduceMotion ? false : { opacity: 0, x: '100%' }} animate={reduceMotion ? undefined : { opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: '100%' }} transition={reduceMotion ? { duration: 0 } : drawerTransition}><div className="mobile-nav-top"><Logo /><button className="icon-button" aria-label="Close menu" onClick={close}><X size={21} /></button></div><motion.nav initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={staggerVariants}>{navItems.map((item) => <motion.a variants={itemVariants} key={item.href} href={item.href} onClick={(event) => { event.preventDefault(); close(); navigateTo(item.href); }}>{item.href === '/menu' && <BookOpen size={20} />}<span>{item.label}</span><ArrowUpRight size={15} /></motion.a>)}</motion.nav><Button href={contactInfo.orderUrl} variant="primary" icon={ShoppingBag}>{homepageContent.secondaryButtonLabel || 'Order Now'}</Button></motion.div>}</AnimatePresence>
  </>;
}

function MobileActionBar() {
  return <div className="mobile-action-bar"><a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}><Phone size={17} /><span>Call</span></a><a href={`https://wa.me/${contactInfo.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /><span>WhatsApp</span></a><a href={branches[0].mapUrl} target="_blank" rel="noreferrer"><Navigation size={17} /><span>Directions</span></a><a href={contactInfo.orderUrl} target="_blank" rel="noreferrer"><ShoppingBag size={17} /><span>{homepageContent.secondaryButtonLabel || 'Order Now'}</span></a></div>;
}

function FloatingWhatsApp() {
  return <a className="floating-whatsapp" href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('Hi Naseeb Chapati, I would like to place an order.')}`} target="_blank" rel="noreferrer" aria-label="Order on WhatsApp" title="Order on WhatsApp"><MessageCircle size={21} /><span>WhatsApp</span></a>;
}

function Footer() {
  return <footer className="site-footer"><div className="container footer-grid"><div className="footer-brand"><Logo light /><p>Authentic Pakistani flavours, freshly served for family meals, quick bites, and late-night cravings.</p><div className="social-row">{socialLinks.map((social) => <a className={`social-icon ${social.className}`} key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>{social.label === 'TikTok' ? <span className="tiktok-mark">♪</span> : social.label === 'Google Business' ? <MapPin size={16} /> : <Share2 size={16} />}</a>)}</div></div><div><h3>Explore</h3><div className="footer-links">{navItems.slice(1, 6).map((item) => <a key={item.href} href={item.href} onClick={(event) => { event.preventDefault(); navigateTo(item.href); }}>{item.label}</a>)}</div></div><div><h3>Menu favourites</h3><div className="footer-links">{menuCategories.slice(0, 5).map((item) => <a key={item.name} href="/menu" onClick={(event) => { event.preventDefault(); navigateTo('/menu'); }}>{item.name}</a>)}</div></div><div><h3>Contact</h3><div className="footer-contact"><a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}><Phone size={14} />{contactInfo.phone}</a><a href={`mailto:${contactInfo.email}`}><Mail size={14} />{contactInfo.email}</a><span><Clock3 size={14} />Branch hours vary</span><span><MapPin size={14} />{contactInfo.address || 'Johor, Malaysia'}</span></div></div></div><div className="container footer-bottom"><span>{contactInfo.copyright || `© ${new Date().getFullYear()} Naseeb Chapati Restaurant. All rights reserved.`}</span><span><a href="/privacy" onClick={(event) => event.preventDefault()}>Privacy Policy</a><a href="/terms" onClick={(event) => event.preventDefault()}>Terms & Conditions</a></span></div></footer>;
}

function AppShell({ children }) {
  const path = getPath();
  useEffect(() => { setPageMeta(path); }, [path]);
  return <LazyMotion features={domAnimation}><CartProvider><Header /><CartDrawer /><main id="main-content"><AnimatePresence mode="wait" initial={false}><MotionPage key={path}>{children}</MotionPage></AnimatePresence></main><FloatingWhatsApp /><MobileActionBar /><Footer /></CartProvider></LazyMotion>;
}

function Hero() {
  const slides = (Array.isArray(heroSlides) ? heroSlides : []).filter((slide) => slide.active !== false && slide.desktopImage);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const pointerStart = useRef(null);
  const current = slides[active] || slides[0];
  const step = (direction) => setActive((value) => (value + direction + slides.length) % slides.length);
  useEffect(() => {
    if (paused || slides.length < 2 || homepageContent.heroAutoplay === false) return undefined;
    const timer = window.setInterval(() => step(1), Math.max(3500, Number(homepageContent.heroSpeed) || 6000));
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);
  const onPointerDown = (event) => { if (event.target.closest?.('button, a')) return; pointerStart.current = event.clientX; setPaused(true); event.currentTarget.setPointerCapture?.(event.pointerId); };
  const onPointerUp = (event) => { if (pointerStart.current !== null) { const distance = event.clientX - pointerStart.current; if (Math.abs(distance) > 42) step(distance < 0 ? 1 : -1); } pointerStart.current = null; setPaused(false); };
  if (!current) return null;
  return <section className="hero-section" aria-roledescription="carousel" aria-label="Naseeb Chapati highlights" tabIndex="0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onKeyDown={(event) => { if (event.key === 'ArrowLeft') step(-1); if (event.key === 'ArrowRight') step(1); }} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; setPaused(false); }}><motion.div className="hero-media" initial={reduceMotion ? false : { opacity: 0, scale: .985 }} animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }} transition={reduceMotion ? { duration: 0 } : { duration: .9, ease: [.22, 1, .36, 1] }}>{slides.map((slide, index) => <div className={`hero-slide ${index === active ? 'is-active' : ''}`} key={slide.id || index} aria-hidden={index !== active}><picture><source media="(max-width: 720px)" srcSet={slide.mobileImage || slide.desktopImage} /><SafeImage src={slide.desktopImage} fallback={imageUrls.hero} alt={slide.imageAlt || slide.heading} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} /></picture></div>)}</motion.div><div className="container hero-inner"><motion.div className="hero-copy" key={current.id || current.heading} initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={staggerVariants}><motion.p className="eyebrow" variants={itemVariants}>Naseeb Chapati Restaurant</motion.p><motion.h1 variants={itemVariants}>{current.heading}</motion.h1><motion.p className="hero-description" variants={itemVariants}>{current.text}</motion.p><motion.div className="hero-actions" variants={itemVariants}><Button href={current.primaryButtonUrl || '/menu'} icon={BookOpen}>{current.primaryButtonLabel || 'View Menu'}</Button><Button href={current.secondaryButtonUrl || contactInfo.orderUrl} variant="accent" icon={ShoppingBag}>{current.secondaryButtonLabel || 'Order Now'}</Button><Button href="/branches" variant="outline" icon={MapPin}>Find Nearest Branch</Button></motion.div><motion.div className="hero-note" variants={itemVariants}><span className="hero-note-dot"><Check size={13} /></span><span>Halal food · Dine-in, takeaway and delivery</span></motion.div></motion.div><div className="hero-carousel-controls"><button className="hero-carousel-arrow" type="button" aria-label="Previous hero slide" onClick={() => step(-1)}><ChevronLeft size={19} /></button><div className="hero-carousel-dots" role="tablist" aria-label="Hero slides">{slides.map((slide, index) => <button type="button" key={slide.id || index} role="tab" aria-label={`Show slide ${index + 1}: ${slide.heading}`} aria-selected={index === active} className={index === active ? 'active' : ''} onClick={() => { setActive(index); setPaused(true); }} />)}</div><button className="hero-carousel-arrow" type="button" aria-label="Next hero slide" onClick={() => step(1)}><ChevronRight size={19} /></button></div></div></section>;
}

function QuickInfo() {
  const iconMap = { halal: Moon, fresh: Utensils, family: Users, takeaway: ShoppingBag, branches: MapPin, order: Bike };
  const items = (homepageContent.quickInfo || []).filter((item) => item.active !== false);
  return <section className="quick-info"><MotionGroup className="container quick-info-inner" amount={.2}>{items.map((item, index) => { const Icon = iconMap[item.icon] || Check; return <MotionCard as="div" className="quick-info-item" key={item.title} index={index}><Icon size={20} /><span>{item.title}</span></MotionCard>; })}</MotionGroup></section>;
}

function FoodCoverflow() {
  const featuredItems = Array.isArray(homepageContent.featuredItems) ? homepageContent.featuredItems : [];
  const slides = (featuredItems.length ? featuredItems.map((id) => menuItems.find((item) => item.id === id)).filter(Boolean) : menuItems).slice(0, 7);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef(null);
  const step = (direction) => setActive((current) => (current + direction + slides.length) % slides.length);
  useEffect(() => { if (paused || homepageContent.trendingAutoplay === false) return undefined; const timer = window.setInterval(() => step(1), Math.max(2500, Number(homepageContent.trendingSpeed) || 4500)); return () => window.clearInterval(timer); }, [paused, slides.length]);
  const stopDragging = () => { pointerStart.current = null; setDragging(false); setPaused(false); };
  const onPointerDown = (event) => { if (event.target.closest?.('button, a')) return; pointerStart.current = event.clientX; setDragging(true); setPaused(true); event.currentTarget.setPointerCapture?.(event.pointerId); };
  const onPointerUp = (event) => { if (pointerStart.current != null) { const diff = event.clientX - pointerStart.current; if (Math.abs(diff) > 34) step(diff < 0 ? 1 : -1); } stopDragging(); };
  if (!slides.length) return null;
  return <section className="section coverflow-section"><div className="container"><SectionHeading title={homepageContent.trendingTitle || 'Trending now'} copy={homepageContent.trendingSubtitle || 'The favourites our guests come back for, served warm and full of flavour.'} action={<Button href="/menu" variant="text" icon={ArrowUpRight}>View Full Menu</Button>} /><div className={`coverflow-viewport ${dragging ? 'is-dragging' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={stopDragging}><div className="coverflow-track">{slides.map((item, index) => { const rawOffset = index - active; const offset = Math.abs(rawOffset) > slides.length / 2 ? rawOffset - Math.sign(rawOffset) * slides.length : rawOffset; const distance = Math.abs(offset); const position = offset === 0 ? 'is-active' : offset === -1 ? 'is-prev' : offset === 1 ? 'is-next' : offset < 0 ? 'is-prev-far' : 'is-next-far'; return <article className={`food-slide ${position}`} key={item.id} style={{ '--distance': distance, opacity: distance > 2 ? .42 : 1, zIndex: 10 - distance }}><div className="food-slide-image"><img src={item.image} alt={item.name} loading="lazy" onError={(event) => { if (event.currentTarget.dataset.fallback !== 'true') { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = imageUrls.naan; } }} /><span className="food-badge">{item.badge}</span></div><div className="food-slide-body"><div><span className="food-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p></div><div className="food-slide-meta"><strong>{formatPrice(item.price)}</strong><div><Button href="/menu" variant="text">View Details</Button><Button href="https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan" variant="small" icon={ShoppingBag}>Order</Button></div></div></div></article>; })}</div><button className="carousel-arrow carousel-prev" aria-label="Previous trending dish" onClick={() => step(-1)}><ChevronLeft size={22} /></button><button className="carousel-arrow carousel-next" aria-label="Next trending dish" onClick={() => step(1)}><ChevronRight size={22} /></button></div><div className="carousel-dots" role="tablist" aria-label="Trending dishes">{slides.map((item, index) => <button key={item.id} className={index === active ? 'active' : ''} aria-label={`Show ${item.name}`} aria-selected={index === active} onClick={() => { setActive(index); setPaused(true); }} />)}</div></div></section>;
}

function CategoryGrid() {
  return <section className="section categories-section"><div className="container"><SectionHeading title="Browse by category" copy="Whatever the craving, there’s something warm, flavourful, and made to share." action={<Button href="/menu" variant="outline" icon={ArrowUpRight}>Explore all</Button>} /><MotionGroup className="category-grid" amount={.12}>{menuCategories.map((category, index) => <MotionCard as="a" className="category-card" href="/menu" key={category.name} index={index} onClick={(event) => { event.preventDefault(); navigateTo('/menu'); }}><img src={category.image} alt={category.name} loading="lazy" /><div className="category-card-overlay"><span>{category.name}</span><ArrowUpRight size={17} /></div></MotionCard>)}</MotionGroup></div></section>;
}

function AboutBand() {
  if (homepageContent.showAbout === false) return null;
  return <section className="about-band"><div className="container about-band-grid"><MotionImage className="about-band-image"><img src={homepageContent.aboutImage || imageUrls.interior} alt="Warm Naseeb Chapati dining room with family tables" loading="lazy" /></MotionImage><MotionReveal className="about-band-copy" y={18}><p className="eyebrow">About Naseeb Chapati</p><h2>{homepageContent.aboutHeading}</h2><p>{homepageContent.aboutText}</p><div className="value-list"><span><BadgeCheck size={18} />Fresh, made-to-order plates</span><span><BadgeCheck size={18} />Authentic recipes and spices</span><span><BadgeCheck size={18} />A welcoming family dining experience</span></div><Button href={homepageContent.aboutButtonUrl || '/about'} variant="primary" icon={ArrowUpRight}>{homepageContent.aboutButtonLabel || 'Learn more about us'}</Button></MotionReveal></div></section>;
}

function DishCard({ item, onDetails, index = 0 }) {
  return <MotionCard as="article" className="dish-card" index={index} layout="position" exit={{ opacity: 0, y: 10 }}><div className="dish-card-image"><SafeImage src={item.image} alt={item.name} loading="lazy" /><span className="food-badge">{item.badge}</span></div><div className="dish-card-content"><span className="food-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><div className="dish-card-footer"><strong>{formatPrice(item.price)}</strong><div><button className="link-button" onClick={() => onDetails?.(item)}>Details <ArrowUpRight size={14} /></button><CartAddButton item={item} /></div></div></div></MotionCard>;
}

function BestSellers() {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Breakfast', 'Main Course', 'Grill', 'Drinks', 'Desserts'];
  const [selected, setSelected] = useState(null);
  const reduceMotion = useReducedMotion();
  const filtered = menuItems.filter((item) => filter === 'All' || item.filter === filter).slice(0, 8);
  return <section className="section best-sellers"><div className="container"><SectionHeading title="Best-selling dishes" copy="A few guest favourites to start your next order." action={<Button href="/menu" variant="text" icon={ArrowUpRight}>See full menu</Button>} /><div className="filter-tabs" role="tablist" aria-label="Filter best-selling dishes">{filters.map((item) => <motion.button whileTap={reduceMotion ? undefined : { scale: .96 }} key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</motion.button>)}</div><div className="dish-grid"><AnimatePresence mode="popLayout">{filtered.map((item, index) => <DishCard key={item.id} item={item} index={index} onDetails={setSelected} />)}</AnimatePresence></div><AnimatePresence>{selected && <DishModal item={selected} onClose={() => setSelected(null)} />}</AnimatePresence></div></section>;
}

function BranchStatus({ branch }) {
  const status = getBranchStatus(branch);
  return <span className={`branch-status ${status.open ? 'is-open' : 'is-closed'}`}><span className="status-dot" />{status.label}</span>;
}

function BranchCard({ branch, compact = false, index = 0 }) {
  return <MotionCard as="article" className={`branch-card ${compact ? 'compact' : ''}`} index={index}><div className="branch-card-top"><img src={branch.image} alt={`${branch.name} branch dining area`} loading="lazy" /><div className="branch-card-overlay"><BranchStatus branch={branch} /></div></div><div className="branch-card-content"><div className="branch-card-title"><div><span className="eyebrow">Naseeb Chapati</span><h3>{branch.name}</h3></div><a className="icon-button icon-button-light" href={branch.mapUrl} target="_blank" rel="noreferrer" aria-label={`Directions to ${branch.name}`}><Navigation size={16} /></a></div><p className="branch-address"><MapPin size={15} />{branch.address}</p><div className="branch-hours"><Clock3 size={15} /><strong>{getBranchStatus(branch).detail}</strong><span>today</span></div><div className="branch-actions"><Button href={`tel:${branch.phone.replace(/\s/g, '')}`} variant="outline" icon={Phone}>Call</Button><Button href={`/branches/${branch.slug}`} variant="text" icon={ArrowUpRight}>View branch</Button></div></div></MotionCard>;
}

function BranchSection() {
  const [selectedSlug, setSelectedSlug] = useState(branches[0].slug);
  const selected = branches.find((branch) => branch.slug === selectedSlug) || branches[0];
  const reduceMotion = useReducedMotion();
  return <section className="section branch-section"><div className="container"><SectionHeading title="Find your nearest branch" copy="Choose a location to see its own opening hours, contact details, and directions." action={<Button href="/branches" variant="outline" icon={ArrowUpRight}>All branches</Button>} /><div className="branch-selector" role="tablist" aria-label="Restaurant branches">{branches.map((branch) => <button key={branch.slug} role="tab" aria-selected={branch.slug === selectedSlug} className={branch.slug === selectedSlug ? 'active' : ''} onClick={() => setSelectedSlug(branch.slug)}><span>{branch.name}</span><BranchStatus branch={branch} /></button>)}</div><AnimatePresence mode="wait" initial={false}><motion.div className="featured-branch" key={selected.slug} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .35, ease: [.22, 1, .36, 1] }}><div className="featured-branch-copy"><span className="eyebrow">Selected branch</span><h3>{selected.name}</h3><p>{selected.address}</p><div className="featured-branch-contact"><a href={`tel:${selected.phone.replace(/\s/g, '')}`}><Phone size={16} />{selected.phone}</a><a href={`https://wa.me/${selected.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a></div><div className="featured-hours"><Clock3 size={17} /><div><strong>{getBranchStatus(selected).label}</strong><span>Today · {getBranchStatus(selected).detail}</span></div></div><div className="hero-actions"><Button href={selected.mapUrl} variant="accent" icon={Navigation}>Get directions</Button><Button href={`/branches/${selected.slug}`} variant="outline" icon={ArrowUpRight}>View branch</Button></div></div><div className="featured-branch-map"><iframe title={`${selected.name} map`} src={`https://www.google.com/maps?q=${encodeURIComponent(selected.mapQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></motion.div></AnimatePresence></div></section>;
}

function PromotionsSection() {
  const activePromotions = promotions.filter((promo) => promo.active);
  if (homepageContent.showPromotions === false) return null;
  return <section className="section promotions-section"><div className="container"><SectionHeading title="Made for sharing" copy="Keep an eye out for family-friendly offers and seasonal specials." action={<Button href="/promotions" variant="text" icon={ArrowUpRight}>All promotions</Button>} /><MotionGroup className="promotion-grid" amount={.12}>{activePromotions.slice(0, 3).map((promo, index) => <MotionCard as="article" className="promotion-card" key={promo.id} index={index}><img src={promo.image} alt={promo.title} loading="lazy" /><div className="promotion-content"><span className="promo-label"><TicketPercent size={13} />Offer</span><h3>{promo.title}</h3><p>{promo.details}</p><div className="promotion-meta"><span>{promo.validity}</span><span>{promo.branches}</span></div><Button href="https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan" variant="small" icon={ShoppingBag}>Order now</Button></div></MotionCard>)}</MotionGroup><p className="data-note"><CircleAlert size={15} />Promotion dates and terms are editable content and should be confirmed by the restaurant before publishing.</p></div></section>;
}

function ReviewSection() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  if (homepageContent.showReviews === false) return null;
  const review = reviews[index];
  return <section className="section review-section"><div className="container review-wrap"><MotionReveal y={14}><p className="eyebrow">What our guests say</p><h2>“A table worth coming back to.”</h2><p className="review-intro">Read a small selection of public review references while the restaurant’s official review feed is connected.</p><Button href="https://www.google.com/maps/search/?api=1&query=Naseeb+Capati+Nan+Malaysia" variant="outline" icon={ArrowUpRight}>Leave a Google review</Button></MotionReveal><AnimatePresence mode="wait" initial={false}><motion.div className="review-card" key={review.id || index} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={reduceMotion ? undefined : { opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -18 }} transition={{ duration: reduceMotion ? 0 : .35, ease: [.22, 1, .36, 1] }}><div className="stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, star) => <Star key={star} size={17} fill={star < review.rating ? 'currentColor' : 'none'} />)}</div><blockquote>“{review.text}”</blockquote><div className="review-attribution"><div className="avatar-placeholder">{review.name.charAt(0)}</div><div><strong>{review.name}</strong><span>{review.source} · {review.branch}</span></div></div><div className="review-controls"><button onClick={() => setIndex((index - 1 + reviews.length) % reviews.length)} aria-label="Previous review"><ChevronLeft size={18} /></button><span>{String(index + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}</span><button onClick={() => setIndex((index + 1) % reviews.length)} aria-label="Next review"><ChevronRight size={18} /></button></div></motion.div></AnimatePresence></div></section>;
}

function GalleryStrip() {
  return <section className="section gallery-strip"><div className="container"><SectionHeading title="A taste of the table" copy="From sizzling grills to the calm of a family meal, come see what’s being served." action={<Button href="/gallery" variant="outline" icon={ArrowUpRight}>View gallery</Button>} /><MotionGroup className="gallery-strip-grid" amount={.12}>{galleryItems.slice(0, 5).map((item, index) => <MotionCard as="a" className="gallery-strip-item" href="/gallery" key={item.id} index={index} onClick={(event) => { event.preventDefault(); navigateTo('/gallery'); }}><img src={item.image} alt={item.alt} loading="lazy" /><span>{item.category}</span></MotionCard>)}</MotionGroup></div></section>;
}

function ReservationForm() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', branch: branches[0].slug, date: '', time: '', guests: '2', request: '' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setError(''); setStatus('submitting'); const result = await submitReservation(form); if (result.error) { setStatus('idle'); setError('We could not save your request right now. Please call or WhatsApp the restaurant.'); return; } setStatus('success'); };
  if (status === 'submitting') return <div className="success-card" role="status"><div className="success-icon"><Send size={22} /></div><h3>Sending your request…</h3><p>Please wait while we send your reservation to the restaurant team.</p></div>;
  if (status === 'success') return <div className="success-card"><div className="success-icon"><Check size={22} /></div><h3>Request received</h3><p>Thank you, {form.name || 'guest'}. The restaurant team can confirm your reservation by phone or WhatsApp.</p><div className="hero-actions"><Button href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(`Reservation request for ${form.name} on ${form.date} at ${form.time}`)}`} variant="accent" icon={MessageCircle}>Send to WhatsApp</Button><button className="link-button" onClick={() => setStatus('idle')}>Make another request</button></div></div>;
  return <form className="reservation-form" onSubmit={submit}><div className="form-grid"><label>Full name<input name="name" value={form.name} onChange={update} required placeholder="Your name" /></label><label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} required placeholder="e.g. 01x xxx xxxx" /></label><label>Branch<select name="branch" value={form.branch} onChange={update}>{branches.map((branch) => <option key={branch.slug} value={branch.slug}>{branch.name}</option>)}</select></label><label>Date<input name="date" type="date" value={form.date} onChange={update} required /></label><label>Time<input name="time" type="time" value={form.time} onChange={update} required /></label><label>Guests<select name="guests" value={form.guests} onChange={update}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => <option key={value}>{value}</option>)}</select></label></div><label>Special request<textarea name="request" value={form.request} onChange={update} placeholder="Birthday, high chair, or anything we should know?" rows="3" /></label>{error && <p className="form-error" role="alert"><CircleAlert size={15} />{error}</p>}<div className="form-footer"><span><CircleAlert size={15} />Your request is sent securely to the restaurant team.</span><Button type="submit" variant="primary" icon={Send}>Reserve a table</Button></div></form>;
}

function ReservationSection() {
  return <section className="reservation-section"><div className="container reservation-grid"><MotionReveal className="reservation-copy" y={18}><p className="eyebrow">Make a plan</p><h2>Good food tastes even better together.</h2><p>Reserve a table, order ahead, or get directions to the branch that suits you best.</p><div className="reservation-actions"><Button href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} variant="outline" icon={Phone}>Call restaurant</Button><Button href={`https://wa.me/${contactInfo.whatsapp}`} variant="outline" icon={MessageCircle}>Order on WhatsApp</Button><Button href={branches[0].mapUrl} variant="outline" icon={Navigation}>Get directions</Button></div></MotionReveal><MotionReveal className="reservation-panel" y={22} delay={.08}><div className="panel-heading"><div><span className="eyebrow">Reservation request</span><h3>Save your table</h3></div><CalendarGlyph /></div><ReservationForm /></MotionReveal></div></section>;
}

function CalendarGlyph() { return <div className="calendar-glyph"><span>OPEN</span><strong>24</strong></div>; }

function SocialSection() {
  return <section className="social-section"><div className="container social-inner"><MotionReveal y={14}><p className="eyebrow">Follow along</p><h2>See what’s fresh today.</h2><p>Follow the restaurant for menu updates, new offers, and the occasional extra cheese pull.</p></MotionReveal><MotionGroup className="social-links" amount={.2}>{socialLinks.map((social, index) => <MotionCard as="a" className={`social-link ${social.className}`} key={social.label} index={index} href={social.href} target="_blank" rel="noreferrer"><span>{social.label === 'TikTok' ? <span className="tiktok-mark">♪</span> : social.label === 'Google Business' ? <MapPin size={19} /> : <Share2 size={19} />}</span>{social.label}<ArrowUpRight size={16} /></MotionCard>)}</MotionGroup></div></section>;
}

function HomePage() {
  return <div className="home-page"><Hero /><QuickInfo /><FoodCoverflow /><CategoryGrid /><AboutBand /><BestSellers /><BranchSection /><PromotionsSection /><ReviewSection /><GalleryStrip /><ReservationSection /><SocialSection /></div>;
}

function DishModal({ item, onClose }) {
  const reduceMotion = useReducedMotion();
  useEffect(() => { const onKey = (event) => event.key === 'Escape' && onClose(); document.body.classList.add('modal-open'); window.addEventListener('keydown', onKey); return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); }; }, [onClose]);
  return <motion.div className="modal-backdrop" role="presentation" initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.div className="dish-modal" role="dialog" aria-modal="true" aria-label={item.name} initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .97 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: .98 }} transition={{ duration: reduceMotion ? 0 : .3, ease: [.22, 1, .36, 1] }}><button className="modal-close" onClick={onClose} aria-label="Close dish details"><X size={20} /></button><img src={item.image} alt={item.name} /><div className="dish-modal-content"><span className="food-category">{item.category}</span><h2>{item.name}</h2><p>{item.description}</p><div className="modal-detail-row"><span>Price</span><strong>{formatPrice(item.price)}</strong></div><div className="modal-detail-row"><span>Spice level</span><strong>{item.spicy ? 'Spiced' : 'Mild'}</strong></div><div className="modal-detail-row"><span>Ingredients</span><strong>{item.ingredients}</strong></div><Button href="https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan" variant="primary" icon={ShoppingBag}>Order this dish</Button></div></motion.div></motion.div>;
}

function PageHero({ eyebrow, title, copy, image = imageUrls.interior }) {
  return <section className="page-hero"><MotionImage className="page-hero-image"><img src={image} alt="Naseeb Chapati Restaurant" /></MotionImage><MotionReveal className="container page-hero-inner" amount={.25} y={14}><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{copy && <p>{copy}</p>}</MotionReveal></section>;
}

function MenuPage() {
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('All categories'); const [branch, setBranch] = useState('All branches'); const [vegetarian, setVegetarian] = useState(false); const [spicy, setSpicy] = useState(false); const [sort, setSort] = useState('popularity'); const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => menuItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && (category === 'All categories' || item.category === category) && (branch === 'All branches' || item.availability.includes(branch)) && (!vegetarian || item.vegetarian) && (!spicy || item.spicy)).sort((a, b) => sort === 'price-low' ? (a.price ?? 999) - (b.price ?? 999) : sort === 'price-high' ? (b.price ?? 0) - (a.price ?? 0) : b.popular - a.popular), [search, category, branch, vegetarian, spicy, sort]);
  return <><PageHero eyebrow="The menu" title="Made for the whole table." copy="Search, filter, and find your next favourite. Prices and availability are structured for easy branch-by-branch updates." image={imageUrls.biryani} /><section className="section menu-page-section"><div className="container"><div className="menu-toolbar"><label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by dish name" /></label><label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{menuCategories.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label><span>Branch</span><select value={branch} onChange={(event) => setBranch(event.target.value)}><option>All branches</option>{branches.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="popularity">Popularity</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div><div className="menu-toggle-filters"><button className={vegetarian ? 'active' : ''} onClick={() => setVegetarian((value) => !value)}><Leaf size={15} />Vegetarian</button><button className={spicy ? 'active' : ''} onClick={() => setSpicy((value) => !value)}><Flame size={15} />Spicy</button></div><div className="menu-results-top"><p>{filtered.length} dishes</p><span>Public reference menu · confirm final details before publishing</span></div>{filtered.length ? <div className="dish-grid menu-grid"><AnimatePresence mode="popLayout">{filtered.map((item, index) => <DishCard key={item.id} item={item} index={index} onDetails={setSelected} />)}</AnimatePresence></div> : <div className="empty-state"><Search size={28} /><h3>No dishes found</h3><p>Try another search or clear a filter.</p><button className="link-button" onClick={() => { setSearch(''); setCategory('All categories'); setBranch('All branches'); setVegetarian(false); setSpicy(false); }}>Clear filters</button></div>}<AnimatePresence>{selected && <DishModal item={selected} onClose={() => setSelected(null)} />}</AnimatePresence></div></section><CalloutBand title="Need help choosing?" copy="Message the branch for availability, dietary questions, and group-order guidance." action={<Button href={`https://wa.me/${contactInfo.whatsapp}`} variant="accent" icon={MessageCircle}>Ask on WhatsApp</Button>} /></>;
}

function CalloutBand({ title, copy, action }) { return <section className="callout-band"><MotionReveal className="container callout-inner" y={14}><div><h2>{title}</h2><p>{copy}</p></div>{action}</MotionReveal></section>; }

function AboutPage() {
  return <><PageHero eyebrow="About Naseeb Chapati" title="A generous table, rooted in tradition." copy="Naseeb Chapati brings the warmth of Pakistani cooking to everyday family dining in Malaysia." image={imageUrls.interior} /><section className="section story-section"><div className="container story-grid"><MotionReveal className="story-copy"><p className="eyebrow">Our story</p><h2>Recipes with history. Hospitality for today.</h2><p>We believe the best meals do two things at once: they honour where they come from, and they make room for the people around the table. That’s why our menu brings together soft chapati, fragrant naan, rich curries, biryani, tandoori favourites, refreshing drinks, and shareable meals.</p><p>Every plate is designed to feel familiar, generous, and worth returning to — whether it’s a quick breakfast, a family dinner, or a late-night craving.</p><Button href="/branches" variant="primary" icon={MapPin}>Find a branch</Button></MotionReveal><MotionImage className="story-image-stack"><img src={imageUrls.naan} alt="Fresh naan and curry on a table" loading="lazy" /><img src={imageUrls.kitchen} alt="Food being prepared in a restaurant kitchen" loading="lazy" /></MotionImage></div></section><section className="values-section"><div className="container"><SectionHeading title="Why choose Naseeb" copy="The details that make a casual meal feel like a proper welcome." align="center" /><MotionGroup className="value-grid" amount={.14}><ValueCard icon={Leaf} title="Freshness first" copy="Food is prepared with attention to warmth, texture, and the moment it reaches your table." /><ValueCard icon={BadgeCheck} title="Authentic flavour" copy="Classic Pakistani flavours, familiar spices, and the comfort of food made to share." /><ValueCard icon={Users} title="Family at the centre" copy="A welcoming setting for solo diners, friends, families, and everyone in between." /><ValueCard icon={Heart} title="Local connection" copy="A neighbourhood restaurant built around generous service and returning guests." /></MotionGroup></div></section><section className="section commitment-section"><div className="container commitment-grid"><MotionImage className="commitment-image"><img src={imageUrls.family} alt="Family-style meal shared around a table" loading="lazy" /></MotionImage><MotionReveal className="commitment-copy"><p className="eyebrow">Our promise</p><h2>Good food, honest welcome.</h2><p>Naseeb Chapati is a halal Pakistani restaurant experience shaped around quality, consistency, and an easy-going family atmosphere. Our team is committed to keeping the food flavourful, the service friendly, and the table open to everyone.</p><div className="commitment-list"><span><Check size={16} />Halal food positioning</span><span><Check size={16} />Dine-in, takeaway, and delivery options</span><span><Check size={16} />Branch-level information that stays up to date</span></div></MotionReveal></div></section></>;
}

function ValueCard({ icon: Icon, title, copy }) { return <MotionCard className="value-card"><div className="value-icon"><Icon size={20} /></div><h3>{title}</h3><p>{copy}</p></MotionCard>; }

function BranchesPage() {
  const [search, setSearch] = useState(''); const filtered = branches.filter((branch) => `${branch.name} ${branch.address}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHero eyebrow="Find us" title="A seat is waiting nearby." copy="Compare branch locations, opening hours, facilities, and directions in one place." image={imageUrls.family} /><section className="section branches-page"><div className="container"><div className="directory-tools"><label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search branches or area" /></label><span><MapPin size={15} />{filtered.length} locations</span></div><MotionGroup className="branch-directory-grid" amount={.12}>{filtered.map((branch, index) => <BranchCard key={branch.slug} branch={branch} index={index} />)}</MotionGroup><p className="data-note"><CircleAlert size={15} />Branch details are seeded from public listings and should be verified by the restaurant team before launch.</p></div></section><section className="map-section"><div className="container"><SectionHeading title="Explore the area" copy="Use the map to plan your next visit." /><MotionReveal className="map-large" y={14}><iframe title="Naseeb Chapati branch map" src={`https://www.google.com/maps?q=${encodeURIComponent('Naseeb Capati Nan Johor Malaysia')}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></MotionReveal></div></section></>;
}

function BranchPage({ slug }) {
  const branch = branches.find((item) => item.slug === slug) || branches[0]; const branchMenu = menuItems.filter((item) => item.availability.includes(branch.name));
  return <><PageHero eyebrow="Naseeb Chapati branch" title={branch.name} copy={branch.address} image={branch.image} /><section className="section branch-detail"><div className="container"><div className="branch-detail-top"><div><BranchStatus branch={branch} /><h2>Come hungry. Leave happy.</h2><p>Everything you need for your visit, from today’s hours to directions and ordering.</p></div><div className="hero-actions"><Button href={branch.mapUrl} variant="accent" icon={Navigation}>Directions</Button><Button href={`https://wa.me/${branch.whatsapp}`} variant="outline" icon={MessageCircle}>WhatsApp</Button><Button href={`tel:${branch.phone.replace(/\s/g, '')}`} variant="outline" icon={Phone}>Call</Button></div></div><div className="branch-detail-grid"><div className="branch-detail-panel"><h3>Branch information</h3><div className="detail-list"><span><MapPin size={17} /><strong>{branch.address}</strong></span><span><Phone size={17} /><a href={`tel:${branch.phone.replace(/\s/g, '')}`}>{branch.phone}</a></span><span><Clock3 size={17} /><strong>{getBranchStatus(branch).detail} today</strong></span></div><div className="facility-list">{branch.facilities.map((facility) => <span key={facility}><Check size={14} />{facility}</span>)}</div></div><div className="branch-detail-map"><iframe title={`${branch.name} Google Maps`} src={`https://www.google.com/maps?q=${encodeURIComponent(branch.mapQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></div><div className="branch-menu-block"><SectionHeading title="Available menu reference" copy={`Items listed for ${branch.name}; confirm availability with the branch.`} action={<Button href="/menu" variant="text" icon={ArrowUpRight}>Full menu</Button>} /><div className="dish-grid">{branchMenu.slice(0, 6).map((item) => <DishCard key={item.id} item={item} />)}</div></div></div></section><CalloutBand title="Planning a group meal?" copy="Message this branch directly for table requests, large orders, and availability." action={<Button href={`https://wa.me/${branch.whatsapp}`} variant="accent" icon={MessageCircle}>Message branch</Button>} /></>;
}

function GalleryPage() {
  const [filter, setFilter] = useState('All'); const [selected, setSelected] = useState(null); const filters = ['All', 'Food', 'Interior', 'Events', 'Customers', 'Behind the Scenes']; const filtered = galleryItems.filter((item) => filter === 'All' || item.category === filter); const reduceMotion = useReducedMotion();
  return <><PageHero eyebrow="Gallery" title="A visual taste of the table." copy="Browse food, interiors, behind-the-scenes moments, and family dining scenes." image={imageUrls.grill} /><section className="section gallery-page"><div className="container"><div className="filter-tabs gallery-filters">{filters.map((item) => <motion.button whileTap={reduceMotion ? undefined : { scale: .96 }} className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</motion.button>)}</div><MotionGroup className="gallery-masonry" amount={.1}>{filtered.map((item, index) => <MotionCard as="button" className="gallery-tile" key={item.id} index={index} onClick={() => setSelected(item)}><img src={item.image} alt={item.alt} loading="lazy" /><span><strong>{item.title}</strong><small>{item.category}</small></span></MotionCard>)}</MotionGroup></div></section><AnimatePresence>{selected && <motion.div className="lightbox" role="presentation" initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close image"><X size={20} /></button><motion.img initial={reduceMotion ? false : { opacity: 0, scale: .96 }} animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .3 }} src={selected.image} alt={selected.alt} /><div><strong>{selected.title}</strong><span>{selected.category}</span></div></motion.div>}</AnimatePresence></>;
}

function PromotionsPage() { const activePromotions = promotions.filter((promo) => promo.active); return <><PageHero eyebrow="Promotions" title="More reasons to gather." copy="Explore offers, family meals, and seasonal specials — with branch details ready to be updated by the restaurant team." image={imageUrls.family} /><section className="section promotions-page"><div className="container"><MotionGroup className="promotion-list" amount={.12}>{activePromotions.map((promo, index) => <MotionCard as="article" className="promotion-feature" key={promo.id} index={index}><img src={promo.image} alt={promo.title} loading="lazy" /><div className="promotion-feature-copy"><span className="promo-label"><TicketPercent size={13} />Current offer</span><h2>{promo.title}</h2><p>{promo.details}</p><dl><div><dt>Validity</dt><dd>{promo.validity}</dd></div><div><dt>Branches</dt><dd>{promo.branches}</dd></div><div><dt>Terms</dt><dd>{promo.terms}</dd></div></dl><Button href="https://www.foodpanda.my/chain/cx8vw/naseeb-capati-nan" variant="accent" icon={ShoppingBag}>Order now</Button></div></MotionCard>)}</MotionGroup><p className="data-note"><CircleAlert size={15} />Expired promotions are designed to be filtered by the <code>active</code> field in the shared content model.</p></div></section></>; }

function ContactPage() {
  const [sent, setSentState] = useState(false); const [submitting, setSubmitting] = useState(false); const [form, setForm] = useState({ name: '', phone: '', email: '', branch: branches[0].slug, subject: '', message: '' }); const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value })); const setSent = (value) => { if (!value) { setSentState(false); return; } setSubmitting(true); void submitEnquiry(form).then((result) => { setSubmitting(false); if (result.error) { window.alert('We could not send your message right now. Please call or WhatsApp the restaurant.'); return; } setSentState(true); }); };
  return <><PageHero eyebrow="Get in touch" title="Let’s plan your next meal." copy="Ask a question, make a reservation, or reach the branch that’s right for you." image={imageUrls.kitchen} /><section className="section contact-page"><div className="container contact-grid"><div className="contact-form-wrap"><div className="section-heading"><div><h2>Send a message</h2><p>We’ll route your message to the right restaurant contact once the workflow is connected.</p></div></div>{sent ? <div className="success-card compact-success"><div className="success-icon"><Check size={22} /></div><h3>Message ready to send</h3><p>Thanks, {form.name || 'guest'}. Your message has been validated and is ready for the restaurant team.</p><button className="link-button" onClick={() => setSent(false)}>Send another</button></div> : <form className="contact-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><div className="form-grid"><label>Name<input name="name" value={form.name} onChange={update} required placeholder="Your name" /></label><label>Phone<input type="tel" name="phone" value={form.phone} onChange={update} required placeholder="Your phone number" /></label><label>Email<input type="email" name="email" value={form.email} onChange={update} required placeholder="you@example.com" /></label><label>Branch<select name="branch" value={form.branch} onChange={update}>{branches.map((branch) => <option key={branch.slug} value={branch.slug}>{branch.name}</option>)}</select></label></div><label>Subject<input name="subject" value={form.subject} onChange={update} required placeholder="How can we help?" /></label><label>Message<textarea name="message" value={form.message} onChange={update} required rows="5" placeholder="Tell us a little more" /></label><div className="form-footer"><span><CircleAlert size={15} />Connect this form to email, database, or WhatsApp before launch.</span><Button type="submit" variant="primary" icon={Send}>Send message</Button></div></form>}</div><aside className="contact-aside"><div className="contact-aside-card"><span className="eyebrow">Contact details</span><h3>We’re here to help.</h3><div className="contact-detail-list"><a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}><span><Phone size={17} /></span><div><small>Call</small><strong>{contactInfo.phone}</strong></div></a><a href={`https://wa.me/${contactInfo.whatsapp}`} target="_blank" rel="noreferrer"><span><MessageCircle size={17} /></span><div><small>WhatsApp</small><strong>Message the team</strong></div></a><a href={`mailto:${contactInfo.email}`}><span><Mail size={17} /></span><div><small>Email</small><strong>{contactInfo.email}</strong></div></a></div></div><div className="contact-branch-list"><h3>Branches</h3>{branches.map((branch) => <a href={`/branches/${branch.slug}`} key={branch.slug} onClick={(event) => { event.preventDefault(); navigateTo(`/branches/${branch.slug}`); }}><div><strong>{branch.name}</strong><span>{getBranchStatus(branch).detail} today</span></div><ArrowUpRight size={16} /></a>)}</div></aside></div></section><CalloutBand title="Prefer a quick answer?" copy="Call, WhatsApp, or get directions to your nearest branch." action={<Button href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} variant="accent" icon={Phone}>Call restaurant</Button>} /></>;
}

function ContactPageDynamic() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', branch: branches[0]?.slug || '', subject: '', message: '' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('submitting');
    const result = await submitEnquiry(form);
    if (result.error) { setStatus('idle'); setError('We could not send your message right now. Please call or WhatsApp the restaurant.'); return; }
    setStatus('success');
  };
  const content = status === 'success' ? <div className="success-card compact-success" role="status"><div className="success-icon"><Check size={22} /></div><h3>Message received</h3><p>Thanks, {form.name || 'guest'}. Your message has been sent to the restaurant team.</p><button className="link-button" onClick={() => setStatus('idle')}>Send another</button></div> : status === 'submitting' ? <div className="success-card compact-success" role="status"><div className="success-icon"><Send size={22} /></div><h3>Sending your message…</h3><p>Please wait while we send it securely.</p></div> : <form className="contact-form" onSubmit={submit}><div className="form-grid"><label>Name<input name="name" value={form.name} onChange={update} required placeholder="Your name" /></label><label>Phone<input type="tel" name="phone" value={form.phone} onChange={update} required placeholder="Your phone number" /></label><label>Email<input type="email" name="email" value={form.email} onChange={update} required placeholder="you@example.com" /></label><label>Branch<select name="branch" value={form.branch} onChange={update}>{branches.map((branch) => <option key={branch.slug} value={branch.slug}>{branch.name}</option>)}</select></label></div><label>Subject<input name="subject" value={form.subject} onChange={update} required placeholder="How can we help?" /></label><label>Message<textarea name="message" value={form.message} onChange={update} required rows="5" placeholder="Tell us a little more" /></label>{error && <p className="form-error" role="alert"><CircleAlert size={15} />{error}</p>}<div className="form-footer"><span><CircleAlert size={15} />Your message is sent securely to the restaurant team.</span><Button type="submit" variant="primary" icon={Send}>Send message</Button></div></form>;
  return <><PageHero eyebrow="Get in touch" title="Let’s plan your next meal." copy="Ask a question, make a reservation, or reach the branch that’s right for you." image={imageUrls.kitchen} /><section className="section contact-page"><div className="container contact-grid"><div className="contact-form-wrap"><div className="section-heading"><div><h2>Send a message</h2><p>We’ll route your message to the right restaurant contact.</p></div></div>{content}</div><aside className="contact-aside"><div className="contact-aside-card"><span className="eyebrow">Contact details</span><h3>We’re here to help.</h3><div className="contact-detail-list"><a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}><span><Phone size={17} /></span><div><small>Call</small><strong>{contactInfo.phone}</strong></div></a><a href={`https://wa.me/${contactInfo.whatsapp}`} target="_blank" rel="noreferrer"><span><MessageCircle size={17} /></span><div><small>WhatsApp</small><strong>Message the team</strong></div></a><a href={`mailto:${contactInfo.email}`}><span><Mail size={17} /></span><div><small>Email</small><strong>{contactInfo.email}</strong></div></a></div></div><div className="contact-branch-list"><h3>Branches</h3>{branches.map((branch) => <a href={`/branches/${branch.slug}`} key={branch.slug} onClick={(event) => { event.preventDefault(); navigateTo(`/branches/${branch.slug}`); }}><div><strong>{branch.name}</strong><span>{getBranchStatus(branch).detail} today</span></div><ArrowUpRight size={16} /></a>)}</div></aside></div></section><CalloutBand title="Prefer a quick answer?" copy="Call, WhatsApp, or get directions to your nearest branch." action={<Button href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} variant="accent" icon={Phone}>Call restaurant</Button>} /></>;
}

function NotFoundPage() { return <section className="not-found"><div><span className="eyebrow">404</span><h1>That page took a wrong turn.</h1><p>Let’s get you back to the food.</p><Button href="/" variant="primary" icon={Home}>Back home</Button></div></section>; }

class AdminErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('Admin console render error:', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="admin-fatal-error"><div><span className="admin-eyebrow">Admin console</span><h1>We’re restoring the workspace.</h1><p>The last content update could not be rendered safely. Your saved content is still protected.</p><button className="admin-primary-button" type="button" onClick={() => window.location.reload()}>Reload admin</button><a href="/" onClick={(event) => { event.preventDefault(); window.location.href = '/'; }}>Preview website</a></div></div>;
  }
}

function App() {
  const [path, setPath] = useState(getPath());
  useEffect(() => { const handle = () => setPath(getPath()); window.addEventListener('popstate', handle); return () => window.removeEventListener('popstate', handle); }, []);
  if (path.startsWith('/admin')) return <AdminErrorBoundary><AdminApp /></AdminErrorBoundary>;
  let page = <NotFoundPage />;
  if (path === '/') page = <HomePage />;
  else if (path === '/menu') page = <MenuPage />;
  else if (path === '/about') page = <AboutPage />;
  else if (path === '/branches') page = <BranchesPage />;
  else if (path === '/gallery') page = <GalleryPage />;
  else if (path === '/promotions') page = <PromotionsPage />;
  else if (path === '/contact') page = <ContactPageDynamic />;
  else if (path.startsWith('/branches/')) page = <BranchPage slug={path.split('/')[2]} />;
  return <AppShell>{page}</AppShell>;
}

export default App;

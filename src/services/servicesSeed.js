const eventImages = {
  hero: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=86',
  celebration: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=84',
  dining: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=84',
  buffet: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=84',
  meeting: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=84',
  catering: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=84',
};

const allBranches = ['Pasir Gudang', 'Ayer Hitam', 'Angsana JB Mall'];

export function createDefaultServicesContent() {
  return {
    settings: {
      heroEyebrow: 'Events & catering',
      heroTitle: 'Celebrate, Meet and Dine With Naseeb Chapati',
      heroText: 'Host your birthday, corporate meeting, wedding, nikah or private gathering in a welcoming space with delicious food and professional service.',
      heroImage: eventImages.hero,
      heroAlt: 'Elegant event dining setup prepared for a celebration',
      eventCapacity: 60,
      capacityBadgeLabel: 'Event Space Available for Up to {capacity} Guests',
      eventButtonLabel: 'Plan Your Event',
      cateringButtonLabel: 'Request Catering Quote',
      whatsappButtonLabel: 'WhatsApp Us',
      callButtonLabel: 'Call Now',
      finalPrimaryLabel: 'Request a Quote',
      finalWhatsappLabel: 'Chat on WhatsApp',
      finalCallLabel: 'Call Our Team',
      finalPackagesLabel: 'View Event Packages',
      enquiryTitle: 'Tell us about your event',
      enquiryText: 'Share the details below. Our team will review availability and prepare a quotation.',
      finalTitle: 'Planning a Special Event? Let Us Take Care of the Food and Space.',
      finalText: 'From the first menu choice to the final plate, our team is ready to help you plan with confidence.',
      finalImage: eventImages.celebration,
      notificationEmail: '',
      defaultWhatsapp: '',
      seoTitle: 'Events & Catering Services | Naseeb Chapati Restaurant',
      seoDescription: 'Plan private events, family celebrations, corporate meetings and catering with Naseeb Chapati Restaurant in Johor.',
      capacityRanges: [
        { id: 'capacity-small', label: 'Small Gathering', range: '10–20 Guests', active: true },
        { id: 'capacity-medium', label: 'Medium Event', range: '21–40 Guests', active: true },
        { id: 'capacity-full', label: 'Full Capacity', range: '41–60 Guests', active: true },
      ],
    },
    services: [
      {
        id: 'service-events', slug: 'events', name: 'Event Hosting', serviceType: 'Restaurant Event Space',
        shortDescription: 'A welcoming setting for celebrations, meetings and private dining, supported by flexible food and beverage packages.',
        fullDescription: 'Plan a gathering around authentic Pakistani food with branch-specific seating, service and setup options.',
        image: eventImages.celebration, imageAlt: 'Dining tables prepared for a private celebration', icon: 'party',
        branches: allBranches, maxCapacity: 60, minGuests: 10, startingPrice: '', priceDisplay: 'Contact for Quotation',
        features: ['Private event space', 'Flexible seating setup', 'Food and beverage packages', 'Decoration options', 'Dedicated event support', 'Branch-specific availability'],
        facilities: ['Flexible seating', 'Decoration support', 'Event service team'], availability: 'Enquiry required',
        ctaLabel: 'Explore Event Services', displayOrder: 1, featured: true, active: true, seoTitle: 'Private Events at Naseeb Chapati', seoDescription: 'Host a family, community or corporate event with Naseeb Chapati.', openGraphImage: eventImages.celebration,
      },
      {
        id: 'service-catering', slug: 'catering', name: 'Catering Services', serviceType: 'Catering Service',
        shortDescription: 'Flexible on-site and off-site catering for family occasions, offices, community events and larger celebrations.',
        fullDescription: 'Choose buffet service, food trays or individual meal options, with delivery and setup subject to branch availability.',
        image: eventImages.buffet, imageAlt: 'Fresh dishes arranged for buffet catering', icon: 'catering',
        branches: allBranches, maxCapacity: '', minGuests: '', startingPrice: '', priceDisplay: 'Contact for Quotation',
        features: ['On-site and off-site catering', 'Food trays and buffet packages', 'Corporate catering', 'Custom menu selection', 'Delivery and setup options', 'Small and large order support'],
        facilities: ['Buffet setup', 'Delivery options', 'Serving support'], availability: 'Service area varies by branch',
        ctaLabel: 'View Catering Services', displayOrder: 2, featured: true, active: true, seoTitle: 'Pakistani Catering by Naseeb Chapati', seoDescription: 'Request Pakistani catering for celebrations, meetings and community events.', openGraphImage: eventImages.buffet,
      },
    ],
    eventTypes: [
      ['Birthday Parties', 'Warm, family-friendly celebrations with menu and seating options for different group sizes.', eventImages.celebration, 10, 60],
      ['Corporate Meetings', 'Professional food service for team meetings, presentations and company gatherings.', eventImages.meeting, 10, 60],
      ['Weddings', 'A generous dining experience for wedding celebrations, subject to branch capacity and availability.', eventImages.hero, 20, 60],
      ['Nikah Ceremonies', 'A welcoming setting for intimate nikah gatherings and shared family meals.', eventImages.dining, 10, 60],
      ['Engagement Events', 'Flexible dining arrangements for engagement celebrations with family and friends.', eventImages.celebration, 10, 60],
      ['Family Gatherings', 'Comfortable group dining with menus designed for sharing around the table.', eventImages.dining, 10, 60],
      ['Aqiqah Events', 'Family-focused food and space options for meaningful aqiqah gatherings.', eventImages.catering, 10, 60],
      ['Anniversary Celebrations', 'Mark a special milestone with a private meal and flexible celebration setup.', eventImages.celebration, 10, 60],
      ['Graduation Parties', 'Celebrate an achievement with group dining, catering and optional decoration support.', eventImages.hero, 10, 60],
      ['Community Gatherings', 'Food packages and service options for local groups and community occasions.', eventImages.buffet, 15, 60],
      ['Private Dining', 'A more personal Naseeb Chapati dining experience for invited guests.', eventImages.dining, 10, 40],
      ['Other Special Events', 'Tell our team what you are planning and we will explore suitable options with you.', eventImages.catering, 10, 60],
    ].map(([name, shortDescription, image, minGuests, maxGuests], index) => ({
      id: `event-type-${index + 1}`, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name,
      image, imageAlt: `${name} service at Naseeb Chapati`, shortDescription, fullDescription: shortDescription,
      minGuests, maxGuests, branches: allBranches, recommendedPackages: ['Essential Package', 'Celebration Package', 'Premium Event Package'],
      displayOrder: index + 1, active: true, seoTitle: `${name} | Naseeb Chapati Events`, seoDescription: shortDescription,
    })),
    eventPackages: [
      {
        id: 'event-package-essential', slug: 'essential-package', name: 'Essential Package', packageType: 'Event', image: eventImages.dining,
        shortDescription: 'Suitable for small family gatherings and meetings.', priceType: 'Contact for Quotation', packagePrice: '', pricePerPerson: '', minGuests: 10, maxGuests: 30,
        menuItems: ['Menu selected with the restaurant team'], drinks: ['Drinks options available'], desserts: [], duration: 'Subject to confirmation',
        facilities: ['Flexible table layout'], setupIncluded: true, staffIncluded: true, decorationIncluded: false, branches: allBranches,
        terms: 'Availability, menu, duration and final quotation must be confirmed by the restaurant.', featured: false, active: true, displayOrder: 1,
      },
      {
        id: 'event-package-celebration', slug: 'celebration-package', name: 'Celebration Package', packageType: 'Event', image: eventImages.celebration,
        shortDescription: 'Suitable for birthdays, nikah events and private dining.', priceType: 'Contact for Quotation', packagePrice: '', pricePerPerson: '', minGuests: 20, maxGuests: 50,
        menuItems: ['Custom menu selection'], drinks: ['Drinks options available'], desserts: ['Dessert options available'], duration: 'Subject to confirmation',
        facilities: ['Flexible seating', 'Decoration coordination'], setupIncluded: true, staffIncluded: true, decorationIncluded: true, branches: allBranches,
        terms: 'Availability, inclusions and final quotation must be confirmed by the restaurant.', featured: true, active: true, displayOrder: 2,
      },
      {
        id: 'event-package-premium', slug: 'premium-event-package', name: 'Premium Event Package', packageType: 'Event', image: eventImages.hero,
        shortDescription: 'Suitable for weddings, corporate events and larger celebrations.', priceType: 'Contact for Quotation', packagePrice: '', pricePerPerson: '', minGuests: 30, maxGuests: 60,
        menuItems: ['Custom menu planning'], drinks: ['Drinks package options'], desserts: ['Dessert package options'], duration: 'Subject to confirmation',
        facilities: ['Event setup planning', 'Dedicated service support'], setupIncluded: true, staffIncluded: true, decorationIncluded: true, branches: allBranches,
        terms: 'A consultation is required before availability and quotation can be confirmed.', featured: false, active: true, displayOrder: 3,
      },
    ],
    cateringTypes: ['Birthday Catering', 'Wedding Catering', 'Nikah Catering', 'Corporate Catering', 'Meeting Catering', 'Office Lunch Catering', 'Family Gathering Catering', 'Buffet Catering', 'Packed Meal Catering', 'Community Event Catering'].map((name, index) => ({ id: `catering-type-${index + 1}`, name, active: true, displayOrder: index + 1 })),
    cateringOptions: ['Buffet setup', 'Food trays', 'Individual meal boxes', 'Live serving station', 'Drinks package', 'Dessert package', 'Delivery', 'Setup service', 'Serving staff', 'Cleanup service', 'Custom menu selection'].map((name, index) => ({ id: `catering-option-${index + 1}`, name, active: name !== 'Live serving station', displayOrder: index + 1 })),
    cateringPackages: [
      {
        id: 'catering-package-buffet', slug: 'celebration-buffet', name: 'Celebration Buffet', packageType: 'Catering', image: eventImages.buffet, imageAlt: 'Celebration buffet catering spread',
        shortDescription: 'A flexible buffet enquiry for family occasions and group events.', minimumOrder: 'To be confirmed', guests: 'Custom guest count', mainDishes: ['Choose with our catering team'], riceDishes: [], breads: [], sides: [], drinks: [], desserts: [], addOns: [],
        priceType: 'Contact for Quotation', packagePrice: '', pricePerPerson: '', deliveryArea: 'Based on selected branch', branches: allBranches, advanceOrder: 'Advance enquiry required', terms: 'Final menu, delivery area and quotation require restaurant confirmation.', featured: true, active: true, displayOrder: 1,
      },
      {
        id: 'catering-package-corporate', slug: 'corporate-meal-service', name: 'Corporate Meal Service', packageType: 'Catering', image: eventImages.catering, imageAlt: 'Corporate meal catering service',
        shortDescription: 'A practical catering enquiry for meetings, office lunches and company events.', minimumOrder: 'To be confirmed', guests: 'Custom guest count', mainDishes: ['Choose with our catering team'], riceDishes: [], breads: [], sides: [], drinks: [], desserts: [], addOns: [],
        priceType: 'Contact for Quotation', packagePrice: '', pricePerPerson: '', deliveryArea: 'Based on selected branch', branches: allBranches, advanceOrder: 'Advance enquiry required', terms: 'Final menu, delivery timing and quotation require restaurant confirmation.', featured: false, active: true, displayOrder: 2,
      },
      {
        id: 'catering-package-packed', slug: 'packed-meal-catering', name: 'Packed Meal Catering', packageType: 'Catering', image: eventImages.dining, imageAlt: 'Prepared individual meal catering',
        shortDescription: 'Individual meal options for organised events, offices and community gatherings.', minimumOrder: 'To be confirmed', guests: 'Custom quantity', mainDishes: ['Choose with our catering team'], riceDishes: [], breads: [], sides: [], drinks: [], desserts: [], addOns: [],
        priceType: 'Contact for Quotation', packagePrice: '', pricePerPerson: '', deliveryArea: 'Based on selected branch', branches: allBranches, advanceOrder: 'Advance enquiry required', terms: 'Minimum order, menu and delivery must be confirmed by the restaurant.', featured: false, active: true, displayOrder: 3,
      },
    ],
    facilities: [
      ['Flexible seating', 'Table layouts can be discussed for the selected event and branch.', 'layout', true],
      ['Air-conditioned space', 'Available at selected event spaces.', 'air', false],
      ['Parking information', 'Ask the selected branch about nearby parking arrangements.', 'parking', true],
      ['Prayer space', 'Availability varies by branch.', 'prayer', false],
      ['Audio or microphone', 'Availability varies by branch and event setup.', 'audio', false],
      ['Projector or display', 'Availability varies by branch and must be requested in advance.', 'projector', false],
      ['Decoration support', 'Decoration requirements can be included in the enquiry.', 'decor', true],
      ['Separate dining area', 'Available only where enabled by the selected branch.', 'private', false],
      ['Accessibility information', 'Contact the selected branch for current access details.', 'accessibility', true],
      ['Dedicated event support', 'Our team coordinates confirmed food and service arrangements.', 'support', true],
    ].map(([name, description, icon, active], index) => ({ id: `facility-${index + 1}`, name, description, icon, branches: allBranches, active, displayOrder: index + 1 })),
    gallery: [
      [eventImages.celebration, 'Birthday Setups', 'Pasir Gudang', 'Celebration table setup'],
      [eventImages.meeting, 'Corporate Meetings', 'All branches', 'Corporate event setting'],
      [eventImages.hero, 'Wedding Arrangements', 'All branches', 'Elegant dining event arrangement'],
      [eventImages.buffet, 'Buffet Setups', 'All branches', 'Prepared catering buffet'],
      [eventImages.catering, 'Catering Orders', 'All branches', 'Professional catering presentation'],
      [eventImages.dining, 'Private Dining', 'All branches', 'Private restaurant dining area'],
    ].map(([image, category, branch, alt], index) => ({ id: `service-gallery-${index + 1}`, image, category, branch, alt, caption: alt, active: true, displayOrder: index + 1 })),
    benefits: ['Authentic Pakistani Cuisine', 'Freshly Prepared Food', 'Customizable Menus', 'Event Space for Up to 60 Guests', 'Professional Service', 'Family-Friendly Environment', 'Catering and Delivery Options', 'Flexible Event Packages'].map((name, index) => ({ id: `benefit-${index + 1}`, name, active: true, displayOrder: index + 1 })),
    faqs: [
      ['How many guests can the event space accommodate?', 'The current maximum shown is up to 60 guests. Capacity and layout are confirmed by the selected branch for each enquiry.'],
      ['Which event types can be hosted?', 'The published event types above show the occasions currently open for enquiry.'],
      ['Is advance booking required?', 'Yes. Please enquire in advance so the restaurant can review the date, branch, menu and setup.'],
      ['Can we customize the menu?', 'Custom menu requests can be included in your enquiry and are confirmed during quotation.'],
      ['Is decoration included?', 'Decoration depends on the selected package and branch. Add your requirements to the enquiry for confirmation.'],
      ['Do you provide catering outside the restaurant?', 'Off-site catering can be requested. Service area and delivery are confirmed by the selected branch.'],
      ['Is delivery available?', 'Delivery options vary by branch, order size and location.'],
      ['Can staff serve food at the event?', 'Serving support may be requested and is confirmed as part of the quotation.'],
      ['Is a deposit required?', 'Any deposit requirement will be explained by the restaurant before a booking is confirmed.'],
      ['Can we visit the venue before booking?', 'Ask the selected branch to arrange a suitable venue viewing time.'],
      ['Which branches provide event services?', 'Branch availability is shown on each service and confirmed when the restaurant reviews your enquiry.'],
      ['How early should catering be ordered?', 'Advance notice is recommended. Lead time depends on guest count, menu, delivery and setup requirements.'],
    ].map(([question, answer], index) => ({ id: `service-faq-${index + 1}`, question, answer, active: true, displayOrder: index + 1 })),
  };
}

export function normalizeServicesContent(value) {
  const seed = createDefaultServicesContent();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return seed;
  const arrays = ['services', 'eventTypes', 'eventPackages', 'cateringTypes', 'cateringOptions', 'cateringPackages', 'facilities', 'gallery', 'benefits', 'faqs'];
  const normalized = { ...seed, ...value, settings: { ...seed.settings, ...(value.settings || {}) } };
  arrays.forEach((key) => {
    normalized[key] = Array.isArray(value[key])
      ? value[key].filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      : seed[key];
  });
  normalized.settings.capacityRanges = Array.isArray(value.settings?.capacityRanges)
    ? value.settings.capacityRanges.filter((item) => item && typeof item === 'object')
    : seed.settings.capacityRanges;
  return normalized;
}

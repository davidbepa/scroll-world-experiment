export const CASES = [
  {
    id: 'marinemax', label: 'MarineMax',
    eyebrow: 'Commerce that moves', title: 'Turn inspiration into action.',
    body: 'We transformed premium boat discovery into a clearer, mobile-first path from browsing to buying.',
    tags: ['Strategy', 'UX', 'Commerce'], proof: '104% increase in product-detail-page engagement',
    source: 'https://www.verndale.com/our-work/marinemax',
    subject: 'A real marina at golden hour with a full-scale luxury yacht moored beside a contemporary glass, metal, and stone commerce pavilion; an amber-gold path embedded in the boardwalk connects the dock, a consultation lounge, and a refined boat-discovery gallery.',
    focalPoint: 'the full-scale yacht, marina boardwalk, and waterfront commerce pavilion',
    still: 'public/assets/stills/marinemax.webp', clip: 'public/assets/video/marinemax.mp4',
    copySide: 'right', accent: '#6A2FF3', scroll: 1.5, linger: 0.35,
  },
  {
    id: 'southeast-toyota-finance', label: 'Southeast Toyota Finance',
    eyebrow: 'Personalization at scale', title: 'Make every next step personal.',
    body: "A guided digital experience responds to each customer's context, simplifying service and payment journeys.",
    tags: ['DXP', 'Personalization', 'UX'], proof: '700% increase in seven-day promises to pay',
    source: 'https://www.verndale.com/our-work/southeast-toyota-finance',
    subject: 'A real Southeast Toyota Finance experience center at late golden hour, with a full-scale Toyota vehicle beneath a steel-and-glass canopy, restrained environmental client identity, private consultation bays, service lanes, and an amber-gold route branching naturally through the architecture.',
    focalPoint: 'the full-scale vehicle and branching route through the automotive-finance experience center',
    still: 'public/assets/stills/southeast-toyota-finance.webp', clip: 'public/assets/video/southeast-toyota-finance.mp4',
    copySide: 'left', accent: '#FFB800', scroll: 1.25, linger: 0.2,
  },
  {
    id: 'iata', label: 'IATA',
    eyebrow: 'Complexity, cleared', title: 'Move complexity at global scale.',
    body: 'A rapid CMS migration unified operations, improved performance, and returned thousands of hours to the team.',
    tags: ['Optimizely', 'Migration', 'Governance'], proof: 'Approximately 5,000 hours saved',
    source: 'https://www.verndale.com/our-work/iata',
    subject: 'A real IATA international airport and global-operations content hub at dusk, with a glass operations center overlooking active gates, aircraft on the apron, restrained environmental client identity, connected editorial workspaces, and an amber-gold path running from the concourse into the control room.',
    focalPoint: 'the airport operations center and connected global-operations content hub',
    still: 'public/assets/stills/iata.webp', clip: 'public/assets/video/iata.mp4',
    copySide: 'left', accent: '#6A2FF3', scroll: 1.25, linger: 0.2,
  },
  {
    id: 'aspen-snowmass', label: 'Aspen Snowmass',
    eyebrow: 'Digital as destination', title: 'Make planning feel like arriving.',
    body: 'An immersive, accessible experience turns trip planning into the first memorable part of the visit.',
    tags: ['Experience Design', 'Accessibility', 'DXP'], proof: '58% conversion growth',
    source: 'https://www.verndale.com/our-work/aspen-snowmass',
    subject: 'A real Aspen alpine resort during blue hour, with full-scale snow-covered peaks, a timber-and-stone lodge, gondola cabins, groomed trails, accessible arrival terraces, and an amber-gold path integrated into the resort lighting.',
    focalPoint: 'the gondola arrival, timber-and-stone lodge, and illuminated alpine route',
    still: 'public/assets/stills/aspen-snowmass.webp', clip: 'public/assets/video/aspen-snowmass.mp4',
    copySide: 'right', accent: '#FFB800', scroll: 1.4, linger: 0.35,
  },
  {
    id: 'honda-powersports', label: 'Honda Powersports',
    eyebrow: 'Performance by design', title: 'Build for speed. Stay built to scale.',
    body: 'Platform engineering and integrations gave a global product experience the speed and stability it needed.',
    tags: ['Performance', 'Sitecore', 'Integrations'], proof: 'Average CPU usage reduced from 30% to 6%',
    source: 'https://www.verndale.com/fr/our-work/honda-powersports',
    subject: 'A real Honda Powersports performance engineering lab opening directly onto a floodlit racetrack at blue hour, with a full-scale Honda motorcycle on a service stand, restrained environmental client identity, metal test equipment, glass workshop partitions, and an amber-gold line continuing onto the circuit.',
    focalPoint: 'the full-scale motorcycle, engineering bay, and racetrack entry',
    still: 'public/assets/stills/honda-powersports.webp', clip: 'public/assets/video/honda-powersports.mp4',
    copySide: 'right', accent: '#6A2FF3', scroll: 1.25, linger: 0.2,
  },
  {
    id: 'seaworld', label: 'SeaWorld',
    eyebrow: 'Experiences that evolve', title: 'Make every visit begin online.',
    body: 'A flexible commerce platform, analytics, and continuous optimization connect inspiration to checkout.',
    tags: ['Commerce', 'Analytics', 'Optimization'], proof: 'Checkout success improved by 13%',
    source: 'https://www.verndale.com/our-work/seaworld',
    subject: 'A real theme-park arrival and commerce environment at blue hour, with an elegant illuminated entry canopy, ticketing pavilions, attraction silhouettes beyond the gates, stone promenades, and an amber-gold route leading from arrival to purchase. No people, no figures.',
    focalPoint: 'the illuminated arrival canopy, ticketing pavilions, and connected entry route',
    still: 'public/assets/stills/seaworld.webp', clip: 'public/assets/video/seaworld.mp4',
    copySide: 'left', accent: '#FFB800', scroll: 1.7, linger: 0.45,
    cta: { primary: { label: "Build what's next", href: 'https://www.verndale.com/contact-us' } },
  },
];

export const CONNECTORS = Array.from({ length: CASES.length - 1 }, (_, index) => {
  const cacheKey = index === 3 ? '?v=87b2bbc' : '';
  return `public/assets/video/connector-${index + 1}.mp4${cacheKey}`;
});

export function createWorldConfig() {
  return {
    hero: {
      copySide: 'right',
      eyebrow: 'Connected experiences · measurable growth',
      title: 'Experience is your growth system.',
      body: 'We connect strategy, design, technology, data, AI and marketing to create digital experiences that perform.',
      cta: { label: 'Explore the work', href: '#marinemax' },
      scroll: 0.65,
      linger: 0.3,
    },
    mobileMode: 'posters',
    hint: 'scroll to explore',
    diveScroll: 1.3,
    connScroll: 0.8,
    crossfade: 0.08,
    atmosphere: true,
    nav: false,
    sections: CASES.map(scene => ({ ...scene })),
    connectors: [...CONNECTORS],
  };
}

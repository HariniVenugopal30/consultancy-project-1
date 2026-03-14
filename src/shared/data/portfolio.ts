export interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  category: string;
  beforeImage?: string;
  afterImage?: string;
  image: string;
  year: number;
  paints: string[];
}

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 1,
    title: 'Modern Loft Renovation',
    description: 'Complete interior renovation with premium matte finish in contemporary grey palette',
    category: 'Residential',
    image: '/portfolio/loft-renovation.svg',
    year: 2024,
    paints: ['Premium Interior Matte', 'Gloss Trim Paint'],
  },
  {
    id: 2,
    title: 'Victorian Home Restoration',
    description: 'Authentic exterior restoration using heritage colors and weather-resistant coatings',
    category: 'Residential',
    image: '/portfolio/victorian-restoration.svg',
    year: 2024,
    paints: ['Gloss Exterior Pro'],
  },
  {
    id: 3,
    title: 'Commercial Office Space',
    description: 'Large-scale corporate office painting with accent walls and professional finish',
    category: 'Commercial',
    image: '/portfolio/office-makeover.svg',
    year: 2024,
    paints: ['Premium Interior Matte', 'Satin Semi-Gloss'],
  },
  {
    id: 4,
    title: 'Suburban Family Home',
    description: 'Fresh exterior and interior update creating a warm, welcoming family home',
    category: 'Residential',
    image: '/portfolio/suburban-home.svg',
    year: 2023,
    paints: ['Gloss Exterior Pro', 'Premium Interior Matte'],
  },
  {
    id: 5,
    title: 'Deck Restoration Project',
    description: 'Complete deck restoration with protective stain and sealant application',
    category: 'Outdoor',
    image: '/portfolio/deck-restoration.svg',
    year: 2023,
    paints: ['Deck & Patio Stain'],
  },
  {
    id: 6,
    title: 'Retail Store Makeover',
    description: 'Bold and vibrant colors to attract customers and create memorable shopping experience',
    category: 'Commercial',
    image: '/portfolio/retail-makeover.svg',
    year: 2023,
    paints: ['Premium Interior Matte', 'Gloss Exterior Pro'],
  },
];

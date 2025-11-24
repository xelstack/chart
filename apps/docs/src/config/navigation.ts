export interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/getting-started' },
      { title: 'Installation', href: '/getting-started/installation' },
      { title: 'Quick Start', href: '/getting-started/quick-start' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'createChart', href: '/api/create-chart' },
      { title: 'ChartHandle', href: '/api/chart-handle' },
      { title: 'Types', href: '/api/types' },
      { title: 'Utilities', href: '/api/utilities' },
    ],
  },
  {
    title: 'Chart Types',
    items: [
      { title: 'Line Chart', href: '/charts/line' },
      { title: 'Bar Chart', href: '/charts/bar' },
      { title: 'Pie Chart', href: '/charts/pie' },
      { title: 'Scatter Chart', href: '/charts/scatter' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Configuration', href: '/guides/configuration' },
      { title: 'Functional Programming', href: '/guides/functional-programming' },
      { title: 'Performance', href: '/guides/performance' },
      { title: 'Migration', href: '/guides/migration' },
    ],
  },
  {
    title: 'Examples',
    items: [
      {
        title: 'Basic',
        href: '/examples/basic',
        children: [
          { title: 'Simple Line', href: '/examples/basic/simple-line' },
          { title: 'Simple Bar', href: '/examples/basic/simple-bar' },
          { title: 'Simple Pie', href: '/examples/basic/simple-pie' },
          { title: 'Simple Scatter', href: '/examples/basic/simple-scatter' },
        ],
      },
      {
        title: 'Advanced',
        href: '/examples/advanced',
        children: [
          { title: 'Realtime Data', href: '/examples/advanced/realtime-data' },
          { title: 'Large Dataset', href: '/examples/advanced/large-dataset' },
          { title: 'Custom Styling', href: '/examples/advanced/custom-styling' },
          { title: 'Responsive Charts', href: '/examples/advanced/responsive-charts' },
        ],
      },
      {
        title: 'Interaction',
        href: '/examples/interaction',
        children: [
          { title: 'Zoom & Pan', href: '/examples/interaction/zoom-pan' },
          { title: 'Tooltips', href: '/examples/interaction/tooltips' },
          { title: 'Click Events', href: '/examples/interaction/click-events' },
        ],
      },
    ],
  },
];

export const topNav = [
  { title: 'Docs', href: '/getting-started' },
  { title: 'API', href: '/api/create-chart' },
  { title: 'Examples', href: '/examples' },
  { title: 'Playground', href: '/playground' },
  { title: 'GitHub', href: 'https://github.com/xelstack/chart', external: true },
];

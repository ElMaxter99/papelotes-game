import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Papelotes', short_name: 'Papelotes', description: 'Dibuja en papel. La tele lo revela.', start_url: '/', display: 'standalone', background_color: '#F3F6FB', theme_color: '#2F5BEA',
    icons: [{ src: '/brand/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] };
}

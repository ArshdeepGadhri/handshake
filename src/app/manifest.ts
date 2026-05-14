import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iORGANBIO AI CRM',
    short_name: 'iORGANBIO',
    description: 'AI-powered conference networking CRM',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F3F8',
    theme_color: '#4B2A4B',
    icons: [
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}

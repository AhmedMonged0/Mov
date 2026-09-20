// Direct Download Service for Movora (movora.me)
// Provides multi-server, multi-quality direct download streams for movies and TV episodes

/**
 * Generate download links for a movie by TMDB ID
 */
export const getMovieDownloadLinks = (movieId, title = '') => {
  const cleanId = String(movieId || '').split('-')[0];
  if (!cleanId) return [];

  return [
    {
      id: 'fhd-1080p',
      quality: '1080p FHD',
      label: 'جودة فائقة Full HD (سيرفر مباشر 1)',
      resolution: '1920x1080',
      approxSize: '~ 1.8 GB',
      serverName: 'سيرفر موفورا الفائق ⚡️',
      color: '#ff315a',
      url: `https://multiembed.mov/directstream.php?video_id=${cleanId}&tmdb=1`,
      recommended: true
    },
    {
      id: 'hd-720p',
      quality: '720p HD',
      label: 'جودة ممتازة HD (سيرفر سريع 2)',
      resolution: '1280x720',
      approxSize: '~ 900 MB',
      serverName: 'سيرفر التحميل السريع 🚀',
      color: '#38bdf8',
      url: `https://vidlink.pro/movie/${cleanId}`,
      recommended: false
    },
    {
      id: 'sd-480p',
      quality: '480p SD',
      label: 'حجم خفيف للموبايل وباقات النت',
      resolution: '854x480',
      approxSize: '~ 420 MB',
      serverName: 'سيرفر الموبايل الاقتصادي 📱',
      color: '#4ade80',
      url: `https://player.autoembed.cc/embed/movie/${cleanId}`,
      recommended: false
    },
    {
      id: 'mirror-backup',
      quality: 'سيرفر احتياطي',
      label: 'رابط احتياطي متعدد الجودات',
      resolution: 'تلقائي',
      approxSize: 'حسب الجودة',
      serverName: 'سيرفر احتياطي (VidSrc)',
      color: '#facc15',
      url: `https://vidsrc.me/embed/movie?tmdb=${cleanId}`,
      recommended: false
    }
  ];
};

/**
 * Generate download links for a TV episode
 */
export const getEpisodeDownloadLinks = (seriesId, season = 1, episode = 1, title = '') => {
  const cleanId = String(seriesId || '').split('-')[0];
  if (!cleanId) return [];

  return [
    {
      id: 'ep-fhd-1080p',
      quality: '1080p FHD',
      label: `الحلقة ${episode} بجودة Full HD 1080p`,
      resolution: '1920x1080',
      approxSize: '~ 650 MB',
      serverName: 'سيرفر موفورا المباشر ⚡️',
      color: '#ff315a',
      url: `https://multiembed.mov/directstream.php?video_id=${cleanId}&tmdb=1&s=${season}&e=${episode}`,
      recommended: true
    },
    {
      id: 'ep-hd-720p',
      quality: '720p HD',
      label: `الحلقة ${episode} بجودة HD 720p`,
      resolution: '1280x720',
      approxSize: '~ 380 MB',
      serverName: 'سيرفر التحميل السريع 🚀',
      color: '#38bdf8',
      url: `https://vidlink.pro/tv/${cleanId}/${season}/${episode}`,
      recommended: false
    },
    {
      id: 'ep-sd-480p',
      quality: '480p SD',
      label: `الحلقة ${episode} بحجم خفيف للموبايل`,
      resolution: '854x480',
      approxSize: '~ 190 MB',
      serverName: 'سيرفر الموبايل الاقتصادي 📱',
      color: '#4ade80',
      url: `https://player.autoembed.cc/embed/tv/${cleanId}/${season}/${episode}`,
      recommended: false
    },
    {
      id: 'ep-mirror',
      quality: 'سيرفر احتياطي',
      label: `سيرفر بديل لتحميل الحلقة ${episode}`,
      resolution: 'تلقائي',
      approxSize: 'حسب الجودة',
      serverName: 'سيرفر VidSrc البديل',
      color: '#facc15',
      url: `https://vidsrc.me/embed/tv?tmdb=${cleanId}&sea=${season}&epi=${episode}`,
      recommended: false
    }
  ];
};

/**
 * Handle direct download click
 */
export const openDownloadLink = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

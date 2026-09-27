import React, { useState, useEffect, useRef } from 'react';
import { 
  Share2, 
  X, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Film, 
  Tv,
  Star, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Video,
  Play,
  Square,
  Upload,
  Download,
  Trash2,
  Scissors,
  Radio,
  Clapperboard
} from 'lucide-react';
import { 
  fetchTrendingMovies, 
  fetchTrendingSeries, 
  searchMovies, 
  searchSeries, 
  fetchMovieVideos,
  fetchSeriesVideos,
  getPosterUrl 
} from '../../services/tmdb';
import '../../styles/FacebookPublisher.css';

const DEFAULT_PAGE_ID = '1251912034679695';
const DEFAULT_ACCESS_TOKEN = 'EAASdtnZCltswBSsnleYp8ZApe4uWZCasngcWivi9rE45NWlxZB7vilEJGipH9fMo412hXEpzPBi90Tkw2gGdN7x3lwDTaZBTw3ZCPlrExNGW7MT683OOHnLx5O3wYQzNygms59Y8L15pFxRG6C3RUmefADbwJu7IXI7JkVWmp3tgbEd3e48Y6oY9EYa4BZA4ZAjgvEleDbBwO8mJIXPcnpk2EMuZA0Jjm2zAF48n5qmj1N0aC5F1Tma6ZCUh3t2RAZD';

// Hooks for Trailer Mode
const TRAILER_HOOKS = [
  '🎬 الإعلان الرسمي المشوق لفيلم سهرة الليلة.. لا يفوتك!',
  '🔥 شاهد التريلر الرسمي للعمل المنتظر.. متوفر الآن بجودة 4K!',
  '⚡️ الإعلان الترويجي الحصري.. فيلم يستحق المشاهدة سهرة اليوم!',
  '🍿 إعلان الفيلم الأكثر طلباً هذا الأسبوع على موفورا',
  '⭐️ تريلر حصري لواحد من أقوى إنتاجات السينما العالمية'
];

// Hooks for Movie Scene Clip Mode
const CLIP_HOOKS = [
  '🔥 مشهد يحبس الأنفاس من فيلم سهرة الليلة لا يفوتك!',
  '😱 الصدمة في الدقيقة الأخيرة من اللقطة دي.. شوف للنهاية!',
  '🍿 أقوى لقطة أكشن من الفيلم الأسطوري.. روعة!',
  '⚡️ مشهد للتاريخ بجودة فائقة 1080p.. لن تصدق ما حدث!',
  '🎬 لقطة مميزة من أقوى أفلام السينما لعام 2025'
];

export default function FacebookPublisherModal({ onClose, initialQuery = '' }) {
  // Mode Selection: 'trailer' (نشر التريلر) | 'clip' (نشر لقطة من فيلم)
  const [publishMode, setPublishMode] = useState('trailer');

  // Facebook Page Credentials
  const [pageId, setPageId] = useState(() => {
    const saved = localStorage.getItem('movora_fb_page_id');
    return (saved && saved.trim().length > 3) ? saved : DEFAULT_PAGE_ID;
  });
  const [accessToken, setAccessToken] = useState(() => {
    const saved = localStorage.getItem('movora_fb_access_token');
    if (!saved || !saved.includes('BSsnleY') || saved.trim().length < 15) {
      localStorage.setItem('movora_fb_access_token', DEFAULT_ACCESS_TOKEN);
      return DEFAULT_ACCESS_TOKEN;
    }
    return saved;
  });
  const [showToken, setShowToken] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Filter & Media Selection
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // 'all' | 'movie' | 'tv'
  const [trendingItems, setTrendingItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() => initialQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Trailer State
  const [trailerKey, setTrailerKey] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  // Clip State (Upload / Quick Capture)
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Caption Customization
  const [selectedHook, setSelectedHook] = useState(TRAILER_HOOKS[0]);
  const [customSynopsis, setCustomSynopsis] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  // Status & Feedback
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  // Refs
  const searchTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Determine if TV series
  const isTv = selectedMedia?.media_type === 'tv' || Boolean(
    selectedMedia?.first_air_date || (selectedMedia && !selectedMedia?.release_date && selectedMedia?.name)
  );

  // Update hook when mode changes
  useEffect(() => {
    if (publishMode === 'trailer') {
      setSelectedHook(TRAILER_HOOKS[0]);
    } else {
      setSelectedHook(CLIP_HOOKS[0]);
    }
  }, [publishMode]);

  // Load trending items on mount
  useEffect(() => {
    const loadTrending = async () => {
      setLoadingTrending(true);
      try {
        const [movies, series] = await Promise.all([
          fetchTrendingMovies('day').catch(() => []),
          fetchTrendingSeries('day').catch(() => [])
        ]);

        const taggedMovies = (movies || []).map(m => ({ ...m, media_type: 'movie' }));
        const taggedSeries = (series || []).map(s => ({ ...s, media_type: 'tv' }));

        const mixed = [];
        const maxLen = Math.max(taggedMovies.length, taggedSeries.length);
        for (let i = 0; i < maxLen; i++) {
          if (taggedMovies[i]) mixed.push(taggedMovies[i]);
          if (taggedSeries[i]) mixed.push(taggedSeries[i]);
        }

        setTrendingItems(mixed);
        if (mixed.length > 0 && !selectedMedia) {
          selectItem(mixed[0]);
        }
      } catch (e) {
        console.error('Failed to load trending items:', e);
      } finally {
        setLoadingTrending(false);
      }
    };

    loadTrending();
  }, []);

  // Update item selection & fetch trailer
  const selectItem = (item) => {
    setSelectedMedia(item);
    const itemIsTv = item.media_type === 'tv' || Boolean(item.first_air_date || (!item.release_date && item.name));
    const title = itemIsTv 
      ? (item.name || item.original_name) 
      : (item.title || item.original_title);
    
    setCustomTitle(title || '');
    setCustomSynopsis(item.overview || 'قصة سينمائية مشوقة وأحداث درامية ومثيرة تحبس الأنفاس.');

    // Fetch trailer for movie or series
    setLoadingTrailer(true);
    const fetchFunc = itemIsTv ? fetchSeriesVideos(item.id) : fetchMovieVideos(item.id);
    fetchFunc.then(videos => {
      const tr = (videos || []).find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
                 (videos || []).find(v => v.site === 'YouTube') ||
                 videos?.[0];
      setTrailerKey(tr?.key || null);
    }).catch(() => setTrailerKey(null)).finally(() => setLoadingTrailer(false));
  };

  // Search input handler with debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const [movieRes, tvRes] = await Promise.all([
          searchMovies(val).catch(() => []),
          searchSeries(val).catch(() => [])
        ]);

        const taggedM = (movieRes || []).map(m => ({ ...m, media_type: 'movie' }));
        const taggedT = (tvRes || []).map(t => ({ ...t, media_type: 'tv' }));
        const combined = [...taggedM, ...taggedT];

        setSearchResults(combined);
        if (combined.length > 0) {
          selectItem(combined[0]);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // -------------------------------------------------------------
  // Clip Studio: Recording & File Upload
  // -------------------------------------------------------------
  const startRecording = async () => {
    try {
      setFeedback(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'never', frameRate: 30 },
        audio: true
      });

      mediaStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setRecordingSeconds(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        stream.getTracks().forEach(t => t.stop());
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 60) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.warn('Recording cancelled:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setFeedback({ type: 'error', text: 'يرجى اختيار ملف فيديو صالح (MP4, WebM, MKV).' });
      return;
    }

    setVideoBlob(file);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setFeedback(null);
  };

  const clearVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadRecordedClip = () => {
    if (!videoBlob) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    const cleanTitle = (customTitle || 'movora-clip').replace(/\s+/g, '-');
    a.download = `${cleanTitle}-scene-clip.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // -------------------------------------------------------------
  // Content & Caption Generation
  // -------------------------------------------------------------
  const buildCaption = () => {
    if (!selectedMedia) return '';
    const itemIsTv = selectedMedia.media_type === 'tv' || Boolean(selectedMedia.first_air_date || (!selectedMedia.release_date && selectedMedia.name));
    const title = customTitle || (itemIsTv ? (selectedMedia.name || selectedMedia.original_name) : (selectedMedia.title || selectedMedia.original_title));
    const year = (itemIsTv ? selectedMedia.first_air_date : selectedMedia.release_date)?.split('-')[0] || '2025';
    const rating = selectedMedia.vote_average ? Number(selectedMedia.vote_average).toFixed(1) : '8.2';
    const synopsis = customSynopsis || selectedMedia.overview || '';
    const watchUrl = itemIsTv 
      ? `https://movora.me/series/${selectedMedia.id}` 
      : `https://movora.me/movie/${selectedMedia.id}`;

    if (publishMode === 'trailer') {
      return `${selectedHook}\n` +
        `🎬 تريلر: ${title} (${year})\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `⭐ التقييم: ${rating} / 10 | 📅 سنة الإصدار: ${year}\n` +
        `🎙️ الصوت: إنجليزي أصلي | 📝 الترجمة: عربية مدمجة\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `📖 قصة العمل:\n${synopsis}\n\n` +
        `👇 لمشاهدة العمل كاملاً وبجودة فائقة 1080p و 4K بدون إعلانات مزعجة:\n` +
        `🔗 ${watchUrl}\n\n` +
        `#تريلر #أفلام #سينما #افلام_اجنبية #موفورا #movies #Trailer #اكسبلور`;
    }

    return `${selectedHook}\n` +
      `🔥 لقطة من: ${title} (${year})\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `⭐ التقييم: ${rating} / 10 | 📅 سنة الإصدار: ${year}\n` +
      `🎙️ الصوت: أصلي | 📝 الترجمة: عربية مدمجة\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📖 قصة العمل:\n${synopsis}\n\n` +
      `👇 لمشاهدة العمل كاملاً بجودة فائقة 1080p و 4K بدون إعلانات مزعجة:\n` +
      `🔗 ${watchUrl}\n\n` +
      `#أفلام #لقطات_أفلام #سينما #موفورا #Reels #فيلم_السهرة #movies #Explore #اكسبلور`;
  };

  const handleCopyText = () => {
    const text = buildCaption();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -------------------------------------------------------------
  // Facebook Direct API Publishing
  // -------------------------------------------------------------
  const handlePublishFacebook = async () => {
    if (!pageId.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال معرف صفحة فيسبوك (Facebook Page ID) أولاً.' });
      return;
    }
    if (!accessToken.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال رمز Page Access Token من Meta Developers أولاً.' });
      return;
    }
    if (!selectedMedia) {
      setFeedback({ type: 'error', text: 'يرجى اختيار فيلم أو مسلسل للنشر.' });
      return;
    }

    localStorage.setItem('movora_fb_page_id', pageId.trim());
    localStorage.setItem('movora_fb_access_token', accessToken.trim());

    setIsPublishing(true);
    setFeedback(null);

    const fullCaption = buildCaption();
    const itemTitle = customTitle || selectedMedia.title || selectedMedia.name || 'Movora Cinema';

    try {
      if (publishMode === 'clip' && videoBlob) {
        // Upload clip video
        const formData = new FormData();
        formData.append('access_token', accessToken.trim());
        formData.append('title', itemTitle);
        formData.append('description', fullCaption);
        formData.append('source', videoBlob, 'movora-scene.webm');

        const uploadRes = await fetch(`https://graph-video.facebook.com/v19.0/${pageId.trim()}/videos`, {
          method: 'POST',
          body: formData
        });

        const data = await uploadRes.json();
        if (data.error) throw new Error(data.error.message);

        setFeedback({ 
          type: 'success', 
          text: `تم نشر لقطة الفيديو بنجاح على صفحتك في فيسبوك! (ID: ${data.id}) 🚀` 
        });
      } else {
        // Publish post with poster and trailer/watch link
        const posterUrl = selectedMedia.poster_path 
          ? getPosterUrl(selectedMedia.poster_path, 'w780') 
          : null;

        if (posterUrl) {
          const photoParams = new URLSearchParams();
          photoParams.append('access_token', accessToken.trim());
          photoParams.append('url', posterUrl);
          photoParams.append('caption', fullCaption);

          const postRes = await fetch(`https://graph.facebook.com/v19.0/${pageId.trim()}/photos`, {
            method: 'POST',
            body: photoParams
          });

          const data = await postRes.json();
          if (data.error) throw new Error(data.error.message);

          setFeedback({ 
            type: 'success', 
            text: `تم نشر البوست والبوستر بدقة فائقة بنجاح على صفحة «سينما بالعربي»! (Post ID: ${data.post_id || data.id}) 🚀` 
          });
        } else {
          const feedParams = new URLSearchParams();
          feedParams.append('access_token', accessToken.trim());
          feedParams.append('message', fullCaption);
          feedParams.append('link', watchUrl);

          const postRes = await fetch(`https://graph.facebook.com/v19.0/${pageId.trim()}/feed`, {
            method: 'POST',
            body: feedParams
          });

          const data = await postRes.json();
          if (data.error) throw new Error(data.error.message);

          setFeedback({ 
            type: 'success', 
            text: `تم نشر المنشور بنجاح على صفحة «سينما بالعربي»! (Post ID: ${data.id}) 🚀` 
          });
        }
      }
    } catch (err) {
      console.error('Facebook publish error:', err);
      setFeedback({ 
        type: 'error', 
        text: `خطأ في النشر: ${err.message}. يرجى مراجعة الصلاحيات (pages_manage_posts).` 
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const rawList = searchResults.length > 0 ? searchResults : trendingItems;
  const displayList = rawList.filter(item => {
    const itemIsTv = item.media_type === 'tv' || Boolean(item.first_air_date || (!item.release_date && item.name));
    if (mediaTypeFilter === 'movie') return !itemIsTv;
    if (mediaTypeFilter === 'tv') return itemIsTv;
    return true;
  });

  const watchUrl = selectedMedia 
    ? (isTv ? `https://movora.me/series/${selectedMedia.id}` : `https://movora.me/movie/${selectedMedia.id}`)
    : 'https://movora.me';

  return (
    <div className="fb-publisher-overlay" onClick={onClose} dir="rtl">
      <div className="fb-publisher-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="fb-modal-header">
          <div className="fb-header-title-group">
            <div className="fb-icon-wrap">
              <Share2 size={22} />
            </div>
            <div>
              <h2 className="fb-modal-title">أداة النشر لفيسبوك: نشر التريلر أو لقطة من العمل 🎬📱</h2>
              <p className="fb-modal-sub">اختر نشر الإعلان الرسمي المشوق (تلقائي بدون تسجيل) أو نشر لقطة مميزة من الفيلم</p>
            </div>
          </div>

          <div className="fb-header-actions">
            <button 
              type="button" 
              className="fb-help-btn"
              onClick={() => setShowHelp(!showHelp)}
              title="كيفية الحصول على Page ID والـ Token"
            >
              <HelpCircle size={16} />
              <span>طريقة الربط؟</span>
            </button>

            <button type="button" className="fb-close-btn" onClick={onClose} title="إغلاق">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Setup Help Guide Dropdown */}
        {showHelp && (
          <div className="fb-setup-guide">
            <h4>طرق استخراج معرف الصفحة (Page ID) والـ Token بسهولة:</h4>
            <ol>
              <li>
                <strong>أسهل طريقة لمعرفة Page ID:</strong> ادخل على موقع <a href="https://findmyfbid.in" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 'bold' }}>findmyfbid.in ↗</a> وضع رابط صفحتك وهيطلعهولك في ثانية، أو من صفحتك ⬅️ الإعدادات ⬅️ تجربة الصفحات الجديدة / معلومات الصفحة.
              </li>
              <li>
                <strong>استخراج Page Access Token:</strong> ادخل على أداة <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 'bold' }}>Graph API Explorer ↗</a>.
              </li>
              <li>
                اختر صفحتك من قائمة <strong>User or Page</strong>، وفعّل الصلاحيات: <code>pages_manage_posts</code> و <code>pages_read_engagement</code>.
              </li>
              <li>
                يمكنك أيضاً معرفة الـ ID من شاشة Graph Explorer بكتابة <code>me?fields=id,name</code> والضغط على <strong>Submit</strong>.
              </li>
              <li>
                انسخ الـ <strong>Page ID</strong> والـ <strong>Page Access Token</strong> وضعهما في الخانتين بالأسفل (يُحفظان تلقائياً في جهازك للأبد).
              </li>
            </ol>
          </div>
        )}

        {/* Credentials Bar */}
        <div className="fb-credentials-bar">
          <div className="fb-input-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>معرف صفحة فيسبوك (Page ID):</span>
              <a 
                href="https://findmyfbid.in" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#facc15', fontSize: '11px', textDecoration: 'underline', fontWeight: 600 }}
                title="استخرج رقم ID صفحتك بوضع رابط الصفحة فقط"
              >
                مش عارف الـ ID؟ اضغط هنا ↗
              </a>
            </label>
            <input 
              type="text" 
              value={pageId} 
              onChange={(e) => {
                const v = e.target.value;
                setPageId(v);
                localStorage.setItem('movora_fb_page_id', v.trim());
              }} 
              placeholder="مثال: 104829104829104 (اختياري للنشر التلقائي)"
              dir="ltr"
            />
          </div>

          <div className="fb-input-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>رمز Page Access Token:</span>
              <span style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 700 }}>✓ يُحفظ تلقائياً في المتصفح</span>
            </label>
            <div className="fb-token-wrap">
              <input 
                type={showToken ? 'text' : 'password'} 
                value={accessToken} 
                onChange={(e) => {
                  const v = e.target.value;
                  setAccessToken(v);
                  localStorage.setItem('movora_fb_access_token', v.trim());
                }} 
                placeholder="EAA... (اختياري للنشر التلقائي)" 
                dir="ltr"
              />
              <button 
                type="button" 
                className="fb-toggle-token" 
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="fb-workspace-grid">
          
          {/* Left Column */}
          <div className="fb-left-col">
            
            {/* Mode Switcher Tabs */}
            <div className="fb-mode-tabs-container">
              <button 
                type="button" 
                className={`fb-mode-tab-btn ${publishMode === 'trailer' ? 'active' : ''}`}
                onClick={() => setPublishMode('trailer')}
              >
                <Clapperboard size={15} />
                <span>1. نشر التريلر (تلقائي 🎬)</span>
              </button>

              <button 
                type="button" 
                className={`fb-mode-tab-btn ${publishMode === 'clip' ? 'active' : ''}`}
                onClick={() => setPublishMode('clip')}
              >
                <Video size={15} />
                <span>2. نشر لقطة من الفيلم 📱</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="fb-search-bar">
              <Search size={16} className="fb-search-icon" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={handleSearchChange} 
                placeholder="ابحث عن الفيلم أو المسلسل (مثال: Inception, Oppenheimer, أرطغرل)..." 
                dir="rtl"
              />
              {isSearching && <Loader2 size={16} className="fb-spinner" />}
              {searchQuery && (
                <button 
                  type="button" 
                  className="fb-clear-search" 
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Media Filter Tabs */}
            <div className="fb-media-filter-row">
              <button 
                type="button"
                className={`fb-media-filter-btn ${mediaTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMediaTypeFilter('all')}
              >
                الكل 🎬📺
              </button>
              <button 
                type="button"
                className={`fb-media-filter-btn ${mediaTypeFilter === 'movie' ? 'active' : ''}`}
                onClick={() => setMediaTypeFilter('movie')}
              >
                أفلام فقط 🎬
              </button>
              <button 
                type="button"
                className={`fb-media-filter-btn ${mediaTypeFilter === 'tv' ? 'active' : ''}`}
                onClick={() => setMediaTypeFilter('tv')}
              >
                مسلسلات فقط 📺
              </button>
            </div>

            {/* Movies Selector Carousel */}
            <div className="fb-movies-selector">
              <div className="fb-list-header">
                {searchResults.length > 0 ? (
                  <span>نتائج البحث ({displayList.length}):</span>
                ) : (
                  <span>اختر العمل السينمائي المطلوب:</span>
                )}
              </div>

              <div className="fb-movies-scroll">
                {loadingTrending ? (
                  <div style={{ color: '#94a3b8', fontSize: '12px', padding: '10px' }}>جاري تحميل الأعمال...</div>
                ) : (
                  displayList.map(item => {
                    const isSelected = selectedMedia?.id === item.id;
                    const poster = getPosterUrl(item.poster_path, 'w185');
                    const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : null;
                    const itemTitle = item.title || item.name;

                    return (
                      <div 
                        key={`${item.media_type || 'm'}-${item.id}`} 
                        className={`fb-movie-thumb-card ${isSelected ? 'active' : ''}`}
                        onClick={() => selectItem(item)}
                      >
                        <div className="fb-thumb-img-wrap">
                          {poster ? (
                            <img src={poster} alt={itemTitle} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                              <Film size={24} />
                            </div>
                          )}
                          {rating && (
                            <div className="fb-badge-overlay">
                              <Star size={10} fill="#facc15" />
                              <span>{rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="fb-thumb-title" title={itemTitle}>{itemTitle}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ================= OPTION 1: TRAILER MODE (AUTO NO-RECORD) ================= */}
            {publishMode === 'trailer' && (
              <div className="fb-video-studio-card">
                <div className="fb-studio-header">
                  <div className="fb-studio-title">
                    <Clapperboard size={18} style={{ color: '#facc15' }} />
                    <span>الإعلان الرسمي المشوق (Trailer) • تلقائي 100% بدون تسجيل</span>
                  </div>
                  <div className="fb-studio-badge" style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.35)' }}>
                    {trailerKey ? '✓ تم جلب التريلر الرسمي' : 'جاري البحث عن التريلر...'}
                  </div>
                </div>

                {loadingTrailer ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    <Loader2 size={24} className="fb-spinner" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <span>جاري جلب الإعلان الترويجي الرسمي...</span>
                  </div>
                ) : trailerKey ? (
                  <div className="fb-trailer-player-card">
                    {/* Embedded 16:9 Responsive Trailer Player */}
                    <div className="fb-trailer-frame-wrap">
                      <iframe 
                        src={`https://www.youtube-nocookie.com/embed/${trailerKey}?rel=0&modestbranding=1&enablejsapi=1`} 
                        title="Official Trailer" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen 
                      />
                    </div>

                    <div className="fb-trailer-bottom-bar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4ade80', fontWeight: 700 }}>
                        <CheckCircle2 size={14} />
                        <span>الإعلان جاهز للنشر مع البوستر والقصة والرابط</span>
                      </div>

                      <div className="fb-trailer-links-group">
                        <a 
                          href={`https://www.youtube.com/watch?v=${trailerKey}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="fb-studio-btn trailer"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <ExternalLink size={13} />
                          <span>فتح على يوتيوب ↗</span>
                        </a>

                        <a 
                          href={`https://cobalt.tools/#https://www.youtube.com/watch?v=${trailerKey}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="fb-studio-btn upload"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          title="تحميل فيديو التريلر بصيغة MP4 لرفعه كفيديو على فيسبوك"
                        >
                          <Download size={13} />
                          <span>تحميل MP4 📥</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                    لم يتم العثور على إعلان ترويجي رسمي لهذا العمل، سيتم نشر البوستر بجودة فائقة مع القصة ورابط المشاهدة.
                  </div>
                )}
              </div>
            )}

            {/* ================= OPTION 2: MOVIE CLIP MODE ================= */}
            {publishMode === 'clip' && (
              <div className="fb-video-studio-card">
                <div className="fb-studio-header">
                  <div className="fb-studio-title">
                    <Video size={18} style={{ color: '#1877f2' }} />
                    <span>نشر لقطة من الفيلم (Movie Scene Clip)</span>
                  </div>
                  <div className="fb-studio-badge">
                    {videoBlob ? '✓ اللقطة جاهزة' : 'ارفع لقطة أو سجل من المشغل'}
                  </div>
                </div>

                <div className="fb-video-actions-row">
                  <button 
                    type="button" 
                    className="fb-studio-btn upload"
                    onClick={() => fileInputRef.current?.click()}
                    title="رفع مقطع جاهز من جهازك"
                  >
                    <Upload size={14} />
                    <span>رفع لقطة من جهازك 📁</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="video/*" 
                    style={{ display: 'none' }} 
                  />

                  {!isRecording ? (
                    <button 
                      type="button" 
                      className="fb-studio-btn record"
                      onClick={startRecording}
                      title="تسجيل لقطة من 30 إلى 60 ثانية من المشغل لمن يرغب"
                    >
                      <Radio size={14} />
                      <span>تسجيل لقطة من المشغل (اختياري) 🔴</span>
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="fb-studio-btn record recording"
                      onClick={stopRecording}
                      title="إيقاف التسجيل واعتماد المقطع"
                    >
                      <Square size={13} fill="#fff" />
                      <span>إيقاف التسجيل ({recordingSeconds} ثانية) ⏹️</span>
                    </button>
                  )}
                </div>

                {videoUrl ? (
                  <div className="fb-video-preview-box">
                    <video src={videoUrl} controls autoPlay muted playsInline />
                    <div className="fb-video-bar-meta">
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>
                        ✓ تم تجهيز اللقطة بنجاح للنشر كفيديو أو ريلز
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          type="button" 
                          className="fb-download-clip-btn" 
                          onClick={downloadRecordedClip}
                          title="تنزيل اللقطة إلى جهازك بصيغة WebM / MP4"
                        >
                          <Download size={13} />
                          <span>تنزيل</span>
                        </button>
                        <button 
                          type="button" 
                          className="fb-delete-video-btn" 
                          onClick={clearVideo}
                          title="حذف المقطع الحالي"
                        >
                          <Trash2 size={13} />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '12.5px',
                    color: '#94a3b8'
                  }}>
                    اسحب مقطع لقطة الفيلم من جهازك عبر زر <strong>«رفع لقطة من جهازك 📁»</strong>، أو سجل لقطة سريعة من المشغل.
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: AI Caption Generator, Editor & Facebook Mock Card */}
          <div className="fb-right-col">
            
            <div className="fb-editor-card">
              
              {/* Hook Selector */}
              <div>
                <label className="fb-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={14} style={{ color: '#60a5fa' }} />
                    <span>عنوان الجذب والتشويق (Viral Hook):</span>
                  </span>
                </label>
                <select 
                  className="fb-hook-select" 
                  value={selectedHook} 
                  onChange={(e) => setSelectedHook(e.target.value)}
                >
                  {(publishMode === 'trailer' ? TRAILER_HOOKS : CLIP_HOOKS).map((hook, idx) => (
                    <option key={idx} value={hook}>{hook}</option>
                  ))}
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="fb-field-label">اسم العمل الفني:</label>
                <input 
                  type="text" 
                  className="fb-hook-select"
                  value={customTitle} 
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="عنوان الفيلم أو المسلسل..."
                />
              </div>

              {/* Caption / Synopsis Textarea */}
              <div>
                <label className="fb-field-label">
                  <span>الوصف والقصة (محرر النص قبل النشر):</span>
                  <span style={{ fontSize: '11px', color: '#60a5fa' }}>يمكنك التعديل والإضافة براحتك</span>
                </label>
                <textarea 
                  className="fb-caption-textarea"
                  value={customSynopsis} 
                  onChange={(e) => setCustomSynopsis(e.target.value)}
                  placeholder="ملخص القصة المشوقة..."
                  rows={4}
                />
              </div>

              {/* Facebook Mock Post Preview */}
              <div>
                <label className="fb-field-label">
                  معاينة المنشور على فيسبوك ({publishMode === 'trailer' ? 'منشور تريلر' : 'منشور لقطة'}):
                </label>
                <div className="fb-mock-card">
                  <div className="fb-mock-header">
                    <div className="fb-mock-avatar">M</div>
                    <div>
                      <div className="fb-mock-page-name">موفورا سينما - Movora Cinema</div>
                      <div className="fb-mock-time">منذ دقيقة واحدة • 🌍</div>
                    </div>
                  </div>
                  <div className="fb-mock-body-text">
                    {buildCaption()}
                  </div>
                </div>
              </div>

            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div className={`fb-feedback-banner ${feedback.type}`}>
                {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{feedback.text}</span>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="fb-modal-footer">
          <div className="fb-footer-left">
            <button 
              type="button" 
              className="fb-secondary-btn"
              onClick={handleCopyText}
              title="نسخ البوست والهاشتاغات والرابط إلى الحافظة"
            >
              {copied ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
              <span>{copied ? 'تم نسخ البوست!' : 'نسخ النص والهاشتاغات'}</span>
            </button>

            <a 
              href="https://business.facebook.com/latest/composer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="fb-secondary-btn"
              title="فتح استوديو فيسبوك (Meta Business Suite) للنشر اليدوي"
            >
              <ExternalLink size={15} />
              <span>فتح Meta Business Suite 🌐</span>
            </a>

            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(watchUrl)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="fb-secondary-btn"
              title="مشاركة سريعة على فيسبوك"
            >
              <Share2 size={15} />
              <span>مشاركة سريعة 🔗</span>
            </a>
          </div>

          <button 
            type="button" 
            className="fb-primary-publish-btn"
            onClick={handlePublishFacebook}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 size={16} className="fb-spinner" />
                <span>جاري النشر على فيسبوك...</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>نشر المنشور في صفحة فيسبوك الآن 🚀</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

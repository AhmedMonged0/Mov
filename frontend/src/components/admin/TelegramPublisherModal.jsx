import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
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
  Loader2 
} from 'lucide-react';
import { 
  fetchTrendingMovies, 
  fetchTrendingSeries, 
  searchMovies, 
  searchSeries, 
  getPosterUrl 
} from '../../services/tmdb';
import '../../styles/TelegramPublisher.css';

const DEFAULT_CHANNEL = '@movora_me';
const DEFAULT_BOT_TOKEN = '8961203516:AAFVsKyB-9VHLOhy5BqBS3-87xun8WZ46EQ';

const MOVIE_HOOKS = [
  '🍿 فيلم سهرة الليلة',
  '🔥 متاح الآن للمشاهدة الحصرية',
  '🎬 فيلم جديد ومميز أضيف للموقع',
  '⭐️ من أقوى وأفضل أفلام السينما',
  '⚡️ حصرياً بجودة فائقة 1080p'
];

const SERIES_HOOKS = [
  '📺 مسلسل سهرة الليلة',
  '🔥 متاح الآن للمشاهدة الحصرية (جميع الحلقات)',
  '⚡️ حلقات جديدة ومترجمة بدقة عالية 1080p',
  '⭐️ من أقوى وأعلى المسلسلات تقييماً',
  '🍿 مسلسل درامي مميز أضيف للموقع'
];

export default function TelegramPublisherModal({ onClose, initialQuery = '' }) {
  const [botToken, setBotToken] = useState(() => localStorage.getItem('movora_tg_bot_token') || DEFAULT_BOT_TOKEN);
  const [channelId, setChannelId] = useState(() => localStorage.getItem('movora_tg_channel') || DEFAULT_CHANNEL);
  const [showToken, setShowToken] = useState(false);

  // Filter & Media Selection
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // 'all' | 'movie' | 'tv'
  const [trendingItems, setTrendingItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() => initialQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Caption Customization
  const [selectedHook, setSelectedHook] = useState(MOVIE_HOOKS[0]);
  const [customSynopsis, setCustomSynopsis] = useState('');

  // Status & Feedback
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const searchTimerRef = useRef(null);

  // Determine if current selected media is TV series
  const isTv = selectedMedia?.media_type === 'tv' || Boolean(
    selectedMedia?.first_air_date || (selectedMedia && !selectedMedia?.release_date && selectedMedia?.name)
  );

  // Ensure token and channel are permanently cached on mount
  useEffect(() => {
    localStorage.setItem('movora_tg_bot_token', botToken.trim() || DEFAULT_BOT_TOKEN);
    localStorage.setItem('movora_tg_channel', channelId.trim() || DEFAULT_CHANNEL);
  }, []);

  // Load trending movies AND TV series on mount
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

        // Interleave top movies and series for variety
        const mixed = [];
        const maxLen = Math.max(taggedMovies.length, taggedSeries.length);
        for (let i = 0; i < maxLen; i++) {
          if (taggedMovies[i]) mixed.push(taggedMovies[i]);
          if (taggedSeries[i]) mixed.push(taggedSeries[i]);
        }

        setTrendingItems(mixed.slice(0, 24));
        if (mixed.length > 0 && !initialQuery) {
          setSelectedMedia(mixed[0]);
        }
      } catch (err) {
        console.error('Failed to load trending for Telegram publisher:', err);
      } finally {
        setLoadingTrending(false);
      }
    };
    loadTrending();
  }, []);

  // Auto search both Movies & Series if initialQuery passed (e.g. from requested movies)
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setIsSearching(true);
      const query = initialQuery.trim();
      Promise.all([
        searchMovies(query, 1).catch(() => []),
        searchSeries(query, 1).catch(() => [])
      ])
        .then(([movies, series]) => {
          const taggedMovies = (movies || []).map(m => ({ ...m, media_type: 'movie' }));
          const taggedSeries = (series || []).map(s => ({ ...s, media_type: 'tv' }));
          const combined = [...taggedSeries, ...taggedMovies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          if (combined.length > 0) {
            setSearchResults(combined);
            setSelectedMedia(combined[0]);
          }
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, [initialQuery]);

  // Sync synopsis and appropriate hook when media changes
  useEffect(() => {
    if (selectedMedia) {
      const itemIsTv = selectedMedia.media_type === 'tv' || Boolean(selectedMedia.first_air_date || (!selectedMedia.release_date && selectedMedia.name));
      const defaultDesc = itemIsTv 
        ? 'مسلسل مميز وشيق متاح للمشاهدة الآن بجميع حلقاته على منصة موفورا بجودة عالية.'
        : 'فيلم مميز يستحق المشاهدة الآن على منصة موفورا بجودة فائقة.';
      
      setCustomSynopsis(selectedMedia.overview || defaultDesc);

      // Pick suitable hook
      if (itemIsTv) {
        if (!SERIES_HOOKS.includes(selectedHook)) {
          setSelectedHook(SERIES_HOOKS[0]);
        }
      } else {
        if (!MOVIE_HOOKS.includes(selectedHook)) {
          setSelectedHook(MOVIE_HOOKS[0]);
        }
      }
    }
  }, [selectedMedia]);

  // Debounced search for BOTH Movies & Series
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const query = q.trim();
        const [movies, series] = await Promise.all([
          searchMovies(query, 1).catch(() => []),
          searchSeries(query, 1).catch(() => [])
        ]);

        const taggedMovies = (movies || []).map(m => ({ ...m, media_type: 'movie' }));
        const taggedSeries = (series || []).map(s => ({ ...s, media_type: 'tv' }));

        // Combine and prioritize high popularity
        const combined = [...taggedSeries, ...taggedMovies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        setSearchResults(combined.slice(0, 16));
        if (combined.length > 0) {
          setSelectedMedia(combined[0]);
        }
      } catch (err) {
        console.error('Search error in publisher:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Build the Telegram formatted message
  const buildCaption = () => {
    if (!selectedMedia) return '';
    const itemIsTv = selectedMedia.media_type === 'tv' || Boolean(selectedMedia.first_air_date || (!selectedMedia.release_date && selectedMedia.name));
    const title = itemIsTv 
      ? (selectedMedia.name || selectedMedia.original_name || 'مسلسل')
      : (selectedMedia.title || selectedMedia.original_title || 'فيلم سينمائي');
    const year = (itemIsTv ? selectedMedia.first_air_date : selectedMedia.release_date)?.split('-')[0] || '2025';
    const rating = selectedMedia.vote_average ? Number(selectedMedia.vote_average).toFixed(1) : '8.0';
    const synopsis = customSynopsis.length > 280 ? customSynopsis.slice(0, 275) + '...' : customSynopsis;
    const watchUrl = itemIsTv 
      ? `https://movora.me/series/${selectedMedia.id}` 
      : `https://movora.me/movie/${selectedMedia.id}`;
    const channelDisplay = channelId.startsWith('@') ? channelId : `@${channelId}`;

    if (itemIsTv) {
      return `<b>${selectedHook}: ${title} (${year})</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `⭐️ <b>التقييم:</b> ${rating} / 10 | 📅 <b>السنة:</b> ${year}\n` +
        `🎙️ <b>الصوت:</b> أصلي مترجم | 📺 <b>جميع المواسم والحلقات</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `📖 <b>القصة:</b>\n${synopsis}\n\n` +
        `👇 <b>رابط مشاهدة جميع حلقات المسلسل بجودة 1080p:</b>\n` +
        `🔗 ${watchUrl}\n\n` +
        `🍿 <b>انضم لقناة موفورا:</b> ${channelDisplay}\n` +
        `#مسلسلات #موفورا #مسلسل #Series`;
    }

    return `<b>${selectedHook}: ${title} (${year})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `⭐️ <b>التقييم:</b> ${rating} / 10 | 📅 <b>السنة:</b> ${year}\n` +
      `🎙️ <b>الصوت:</b> إنجليزي أصلي | 📝 <b>الترجمة:</b> عربية مدمجة\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📖 <b>القصة:</b>\n${synopsis}\n\n` +
      `👇 <b>رابط المشاهدة المباشر بجودة 1080p و 4K:</b>\n` +
      `🔗 ${watchUrl}\n\n` +
      `🍿 <b>انضم لقناة موفورا:</b> ${channelDisplay}\n` +
      `#أفلام #موفورا #سينما #Movies`;
  };

  // Build Plain Text for Copying
  const buildPlainText = () => {
    return buildCaption().replace(/<[^>]+>/g, '');
  };

  // Copy caption to clipboard
  const handleCopyCaption = () => {
    const text = buildPlainText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send to Telegram Channel via Telegram Bot API
  const handlePublish = async () => {
    if (!botToken.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال رمز Bot Token من @BotFather أولاً.' });
      return;
    }
    if (!channelId.trim()) {
      setFeedback({ type: 'error', text: 'يرجى تحديد معرف أو يوزر القناة (مثال: @movora_me).' });
      return;
    }
    if (!selectedMedia) {
      setFeedback({ type: 'error', text: 'يرجى اختيار فيلم أو مسلسل للنشر.' });
      return;
    }

    // Save credentials to localStorage
    localStorage.setItem('movora_tg_bot_token', botToken.trim());
    localStorage.setItem('movora_tg_channel', channelId.trim());

    setIsPublishing(true);
    setFeedback(null);

    const itemIsTv = selectedMedia.media_type === 'tv' || Boolean(selectedMedia.first_air_date || (!selectedMedia.release_date && selectedMedia.name));
    const title = itemIsTv 
      ? (selectedMedia.name || selectedMedia.original_name)
      : (selectedMedia.title || selectedMedia.original_title);
    const watchUrl = itemIsTv 
      ? `https://movora.me/series/${selectedMedia.id}` 
      : `https://movora.me/movie/${selectedMedia.id}`;
    const watchButtonLabel = itemIsTv 
      ? '▶️ مشاهدة حلقات المسلسل كاملة بجودة 1080p' 
      : '▶️ مشاهدة الفيلم كامل بجودة 1080p';

    try {
      const posterUrl = selectedMedia.poster_path 
        ? getPosterUrl(selectedMedia.poster_path, 'w780') 
        : 'https://movora.me/favicon.svg';

      const channelClean = channelId.startsWith('@') ? channelId.slice(1) : channelId;
      const channelUrl = `https://t.me/${channelClean}`;

      const payload = {
        chat_id: channelId.trim(),
        photo: posterUrl,
        caption: buildCaption(),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: watchButtonLabel, url: watchUrl }
            ],
            [
              { text: '🍿 انضم لقناة موفورا الرسمية', url: channelUrl }
            ]
          ]
        }
      };

      const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData.ok) {
        setFeedback({ 
          type: 'success', 
          text: `تم نشر ${itemIsTv ? 'المسلسل' : 'الفيلم'} "${title}" في قناتك بنجاح! 🚀`,
          messageId: resData.result?.message_id
        });
      } else {
        let errorMsg = resData.description || 'حدث خطأ أثناء الاتصال بتليجرام.';
        if (errorMsg.includes('chat not found')) {
          errorMsg = 'لم يتم العثور على القناة. تأكد من صحة يوزر القناة وأنه مسبوق بـ @ (مثال: @movora_me).';
        } else if (errorMsg.includes('bot was blocked') || errorMsg.includes('bot is not a member') || errorMsg.includes('not enough rights')) {
          errorMsg = 'تأكد من إضافة البوت كأدمن (Admin) في قناتك ومنحه صلاحية نشر الرسائل (Post Messages).';
        } else if (errorMsg.includes('Unauthorized')) {
          errorMsg = 'رمز Bot Token غير صالح. تأكد من نسخه بدقة من @BotFather.';
        }
        setFeedback({ type: 'error', text: errorMsg });
      }
    } catch (err) {
      console.error('Publish error:', err);
      setFeedback({ type: 'error', text: 'فشل إرسال الطلب. تحقق من اتصال الإنترنت وصلاحيات البوت.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const currentPoster = selectedMedia?.poster_path 
    ? getPosterUrl(selectedMedia.poster_path, 'w500') 
    : null;

  // Filter items by media type tabs
  const rawList = searchResults.length > 0 ? searchResults : trendingItems;
  const displayList = rawList.filter(item => {
    const itemIsTv = item.media_type === 'tv' || Boolean(item.first_air_date || (!item.release_date && item.name));
    if (mediaTypeFilter === 'movie') return !itemIsTv;
    if (mediaTypeFilter === 'tv') return itemIsTv;
    return true;
  });

  return (
    <div className="tg-publisher-overlay" onClick={onClose} dir="rtl">
      <div className="tg-publisher-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="tg-modal-header">
          <div className="tg-header-title-group">
            <div className="tg-icon-wrap">
              <Send size={20} />
            </div>
            <div>
              <h2 className="tg-modal-title">أداة النشر الذكي على تليجرام 📢</h2>
              <p className="tg-modal-sub">نشر الأفلام والمسلسلات تلقائياً ببوستراتها وأزرار المشاهدة المباشرة في قناتك</p>
            </div>
          </div>

          <div className="tg-header-actions">
            <button 
              type="button" 
              className="tg-help-btn"
              onClick={() => setShowHelp(!showHelp)}
              title="طريقة الربط السريعة"
            >
              <HelpCircle size={17} />
              <span>كيفية الإعداد؟</span>
            </button>

            <button type="button" className="tg-close-btn" onClick={onClose} title="إغلاق">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Setup Help Guide Dropdown */}
        {showHelp && (
          <div className="tg-setup-guide">
            <h4>خطوات الربط في دقيقتين:</h4>
            <ol>
              <li>افتح تطبيق تليجرام وابحث عن بوت <strong>@BotFather</strong> الرسمي.</li>
              <li>أرسل له الأمر <code>/newbot</code> واختر اسماً ويوزراً لبوتك لتحصل على رمز <strong>Bot Token</strong>.</li>
              <li>افتح قناتك (<strong>@movora_me</strong>) واضغط على إدارة القناة -&gt; <strong>المشرفون (Administrators)</strong> -&gt; <strong>إضافة مشرف</strong>.</li>
              <li>ابحث عن يوزر بوتك وأضفه مع تفعيل صلاحية <strong>نشر الرسائل (Post Messages)</strong>.</li>
              <li>ضع الـ Token في الخانة أدناه واضغط نشر في القناة الآن!</li>
            </ol>
          </div>
        )}

        {/* Credentials Bar */}
        <div className="tg-credentials-bar">
          <div className="tg-input-group">
            <label>يوزر القناة (Channel):</label>
            <input 
              type="text" 
              value={channelId} 
              onChange={(e) => {
                const v = e.target.value;
                setChannelId(v);
                localStorage.setItem('movora_tg_channel', v.trim());
              }} 
              placeholder="@movora_me"
              dir="ltr"
            />
          </div>

          <div className="tg-input-group token-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>رمز Bot Token:</span>
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>✓ محفوظ وجاهز للنشر دائماً</span>
            </label>
            <div className="token-input-wrap">
              <input 
                type={showToken ? 'text' : 'password'} 
                value={botToken} 
                onChange={(e) => {
                  const v = e.target.value;
                  setBotToken(v);
                  localStorage.setItem('movora_tg_bot_token', v.trim());
                }} 
                placeholder="1234567890:AAHq..." 
                dir="ltr"
              />
              <button 
                type="button" 
                className="toggle-token-btn" 
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="tg-workspace-grid">
          
          {/* Left Column: Media Picker & Controls */}
          <div className="tg-left-col">
            
            {/* Search Bar */}
            <div className="tg-search-bar">
              <Search size={16} className="tg-search-icon" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={handleSearchChange} 
                placeholder="ابحث عن أي فيلم أو مسلسل (مثال: ارطغرل، الهيبة، Oppenheimer)..." 
                dir="rtl"
              />
              {isSearching && <Loader2 size={16} className="tg-spinner" />}
              {searchQuery && (
                <button 
                  type="button" 
                  className="tg-clear-search" 
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Media Type Filter Pills (الكل / أفلام / مسلسلات) */}
            <div className="tg-media-filter-row">
              <button 
                type="button"
                className={`tg-media-filter-btn ${mediaTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMediaTypeFilter('all')}
              >
                الكل 🎬📺
              </button>
              <button 
                type="button"
                className={`tg-media-filter-btn ${mediaTypeFilter === 'movie' ? 'active' : ''}`}
                onClick={() => setMediaTypeFilter('movie')}
              >
                أفلام فقط 🎬
              </button>
              <button 
                type="button"
                className={`tg-media-filter-btn ${mediaTypeFilter === 'tv' ? 'active' : ''}`}
                onClick={() => setMediaTypeFilter('tv')}
              >
                مسلسلات فقط 📺
              </button>
            </div>

            {/* Movies & Series List / Selector */}
            <div className="tg-movies-selector">
              <div className="tg-list-header">
                {searchResults.length > 0 ? (
                  <span>نتائج البحث ({displayList.length}):</span>
                ) : (
                  <span>أقوى الأعمال الرائجة اليوم (أفلام ومسلسلات):</span>
                )}
              </div>

              <div className="tg-movies-scroll">
                {loadingTrending ? (
                  <div className="tg-loading-state">جاري تحميل الأعمال الفنية...</div>
                ) : displayList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
                    لا توجد نتائج مطابقة لبحثك.
                  </div>
                ) : displayList.map(item => {
                  const isSelected = selectedMedia?.id === item.id;
                  const poster = item.poster_path ? getPosterUrl(item.poster_path, 'w92') : null;
                  const itemIsTv = item.media_type === 'tv' || Boolean(item.first_air_date || (!item.release_date && item.name));
                  const title = itemIsTv ? (item.name || item.original_name) : (item.title || item.original_title);
                  const year = (itemIsTv ? item.first_air_date : item.release_date)?.split('-')[0] || '';
                  const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : null;

                  return (
                    <div 
                      key={`${item.id}-${item.media_type || 'media'}`} 
                      className={`tg-movie-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMedia(item)}
                    >
                      <div className="tg-item-poster">
                        {poster ? (
                          <img src={poster} alt={title} />
                        ) : itemIsTv ? (
                          <Tv size={18} />
                        ) : (
                          <Film size={18} />
                        )}
                      </div>
                      <div className="tg-item-info">
                        <div className="tg-item-title">{title}</div>
                        <div className="tg-item-meta">
                          <span className={itemIsTv ? 'tg-badge-tv' : 'tg-badge-movie'}>
                            {itemIsTv ? 'مسلسل 📺' : 'فيلم 🎬'}
                          </span>
                          {year && <span>{year}</span>}
                          {rating && (
                            <span className="tg-item-rating">
                              <Star size={11} fill="currentColor" /> {rating}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <span className="tg-check-badge"><Check size={13} /></span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Hook Selector */}
            <div className="tg-hook-selector">
              <label>عنوان / صيغة الجذب (Post Hook):</label>
              <select 
                value={selectedHook} 
                onChange={(e) => setSelectedHook(e.target.value)}
              >
                {(isTv ? SERIES_HOOKS : MOVIE_HOOKS).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Synopsis Editor */}
            <div className="tg-synopsis-editor">
              <label>{isTv ? 'قصة المسلسل المشوقة (قابلة للتعديل):' : 'قصة الفيلم المشوقة (قابلة للتعديل):'}</label>
              <textarea 
                rows={3} 
                value={customSynopsis} 
                onChange={(e) => setCustomSynopsis(e.target.value)} 
                placeholder="اكتب ملخصاً مشوقاً..."
                dir="rtl"
              />
            </div>
          </div>

          {/* Right Column: Live Telegram Message Preview Mockup */}
          <div className="tg-right-col">
            <div className="tg-preview-title-row">
              <span>معاينة البوست على تليجرام (Live Preview):</span>
              <button 
                type="button" 
                className="tg-copy-btn" 
                onClick={handleCopyCaption}
                title="نسخ نص البوست مع الرابط"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص والرابط'}</span>
              </button>
            </div>

            {/* Telegram Channel Post Bubble Mockup */}
            <div className="tg-mockup-bubble">
              <div className="tg-mockup-channel-header">
                <div className="tg-mockup-avatar">M</div>
                <div className="tg-mockup-channel-info">
                  <strong>موفورا | Movora Cinema</strong>
                  <small>{channelId}</small>
                </div>
              </div>

              {/* Poster Image */}
              <div className="tg-mockup-poster">
                {currentPoster ? (
                  <img src={currentPoster} alt="Poster" />
                ) : (
                  <div className="tg-poster-placeholder">
                    {isTv ? <Tv size={36} /> : <Film size={36} />}
                    <span>اختر عملاً للمعاينة</span>
                  </div>
                )}
              </div>

              {/* Caption Text */}
              <div className="tg-mockup-caption">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: buildCaption().replace(/\n/g, '<br/>') 
                  }} 
                />
              </div>

              {/* Inline Action Buttons */}
              <div className="tg-mockup-buttons">
                <div className="tg-mockup-btn primary-watch">
                  <span>{isTv ? '▶️ مشاهدة حلقات المسلسل كاملة 1080p' : '▶️ مشاهدة الفيلم كامل بجودة 1080p'}</span>
                  <ExternalLink size={12} />
                </div>
                <div className="tg-mockup-btn secondary-channel">
                  <span>🍿 انضم لقناة موفورا الرسمية</span>
                  <ExternalLink size={12} />
                </div>
              </div>
            </div>

            {/* Action Feedback Notification */}
            {feedback && (
              <div className={`tg-feedback-banner ${feedback.type}`}>
                {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{feedback.text}</span>
                {feedback.messageId && (
                  <a 
                    href={`https://t.me/${channelId.replace('@', '')}/${feedback.messageId}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="tg-view-post-link"
                  >
                    عرض في تليجرام ↗️
                  </a>
                )}
              </div>
            )}

            {/* Submit Publish Button */}
            <div className="tg-publish-action-area">
              <button 
                type="button" 
                className="tg-main-publish-btn"
                onClick={handlePublish}
                disabled={isPublishing || !selectedMedia}
              >
                {isPublishing ? (
                  <>
                    <Loader2 size={18} className="tg-spinner" />
                    <span>جاري الإرسال والنشر في تليجرام...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>{isTv ? 'نشر المسلسل في القناة الآن 📢' : 'نشر الفيلم في القناة الآن 📢'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

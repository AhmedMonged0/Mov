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
  Star, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { fetchTrendingMovies, searchMovies, getPosterUrl } from '../../services/tmdb';
import '../../styles/TelegramPublisher.css';

const DEFAULT_CHANNEL = '@movora_me';
const DEFAULT_BOT_TOKEN = '8961203516:AAFVsKyB-9VHLOhy5BqBS3-87xun8WZ46EQ';

const HOOKS = [
  '🍿 فيلم سهرة الليلة',
  '🔥 متاح الآن للمشاهدة الحصرية',
  '🎬 فيلم جديد ومميز أضيف للموقع',
  '⭐️ من أقوى وأفضل أفلام السينما',
  '⚡️ حصرياً بجودة فائقة 1080p'
];

export default function TelegramPublisherModal({ onClose }) {
  const [botToken, setBotToken] = useState(() => localStorage.getItem('movora_tg_bot_token') || DEFAULT_BOT_TOKEN);
  const [channelId, setChannelId] = useState(() => localStorage.getItem('movora_tg_channel') || DEFAULT_CHANNEL);
  const [showToken, setShowToken] = useState(false);

  // Movie Selection
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Caption Customization
  const [selectedHook, setSelectedHook] = useState(HOOKS[0]);
  const [customSynopsis, setCustomSynopsis] = useState('');

  // Status & Feedback
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const searchTimerRef = useRef(null);

  // Ensure token and channel are permanently cached on mount
  useEffect(() => {
    localStorage.setItem('movora_tg_bot_token', botToken.trim() || DEFAULT_BOT_TOKEN);
    localStorage.setItem('movora_tg_channel', channelId.trim() || DEFAULT_CHANNEL);
  }, []);

  // Load trending movies on mount
  useEffect(() => {
    const loadTrending = async () => {
      setLoadingTrending(true);
      try {
        const list = await fetchTrendingMovies('day');
        if (Array.isArray(list) && list.length > 0) {
          setTrendingMovies(list.slice(0, 12));
          setSelectedMovie(list[0]);
        }
      } catch (err) {
        console.error('Failed to load trending for Telegram publisher:', err);
      } finally {
        setLoadingTrending(false);
      }
    };
    loadTrending();
  }, []);

  // Sync synopsis when movie changes
  useEffect(() => {
    if (selectedMovie) {
      setCustomSynopsis(selectedMovie.overview || 'فيلم مميز يستحق المشاهدة الآن على منصة موفورا بجودة فائقة.');
    }
  }, [selectedMovie]);

  // Debounced search
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
        const results = await searchMovies(q.trim(), 1);
        setSearchResults(Array.isArray(results) ? results.slice(0, 8) : []);
      } catch (err) {
        console.error('Search error in publisher:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Build the Telegram formatted message
  const buildCaption = () => {
    if (!selectedMovie) return '';
    const title = selectedMovie.title || selectedMovie.original_title || 'فيلم سينمائي';
    const year = selectedMovie.release_date ? selectedMovie.release_date.split('-')[0] : '2025';
    const rating = selectedMovie.vote_average ? Number(selectedMovie.vote_average).toFixed(1) : '8.0';
    const synopsis = customSynopsis.length > 280 ? customSynopsis.slice(0, 275) + '...' : customSynopsis;
    const movieUrl = `https://movora.me/movie/${selectedMovie.id}`;
    const channelDisplay = channelId.startsWith('@') ? channelId : `@${channelId}`;

    return `<b>${selectedHook}: ${title} (${year})</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `⭐️ <b>التقييم:</b> ${rating} / 10 | 📅 <b>السنة:</b> ${year}\n` +
      `🎙️ <b>الصوت:</b> إنجليزي أصلي | 📝 <b>الترجمة:</b> عربية مدمجة\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📖 <b>القصة:</b>\n${synopsis}\n\n` +
      `👇 <b>رابط المشاهدة المباشر بجودة 1080p و 4K:</b>\n` +
      `🔗 ${movieUrl}\n\n` +
      `🍿 <b>انضم لقناة موفورا:</b> ${channelDisplay}\n` +
      `#أفلام #موفورا #سينما #Movies`;
  };

  // Build Plain Text for Copying
  const buildPlainText = () => {
    return buildCaption()
      .replace(/<[^>]+>/g, '');
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
    if (!selectedMovie) {
      setFeedback({ type: 'error', text: 'يرجى اختيار فيلم للنشر.' });
      return;
    }

    // Save credentials to localStorage
    localStorage.setItem('movora_tg_bot_token', botToken.trim());
    localStorage.setItem('movora_tg_channel', channelId.trim());

    setIsPublishing(true);
    setFeedback(null);

    try {
      const posterUrl = selectedMovie.poster_path 
        ? getPosterUrl(selectedMovie.poster_path, 'w780') 
        : 'https://movora.me/favicon.svg';

      const movieUrl = `https://movora.me/movie/${selectedMovie.id}`;
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
              { text: '▶️ مشاهدة الفيلم كامل بجودة 1080p', url: movieUrl }
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
          text: `تم نشر الفيلم "${selectedMovie.title || selectedMovie.original_title}" في قناتك بنجاح! 🚀`,
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

  const currentPoster = selectedMovie?.poster_path 
    ? getPosterUrl(selectedMovie.poster_path, 'w500') 
    : null;

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
              <p className="tg-modal-sub">نشر الأفلام تلقائياً ببوستراتها وأزرار المشاهدة المباشرة في قناتك</p>
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
          
          {/* Left Column: Movie Picker & Controls */}
          <div className="tg-left-col">
            
            {/* Search Bar */}
            <div className="tg-search-bar">
              <Search size={16} className="tg-search-icon" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={handleSearchChange} 
                placeholder="ابحث عن أي فيلم بالاسم..." 
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

            {/* Movies List / Selector */}
            <div className="tg-movies-selector">
              <div className="tg-list-header">
                {searchResults.length > 0 ? (
                  <span>نتائج البحث ({searchResults.length}):</span>
                ) : (
                  <span>أقوى الأفلام الرائجة اليوم في السينما:</span>
                )}
              </div>

              <div className="tg-movies-scroll">
                {loadingTrending ? (
                  <div className="tg-loading-state">جاري تحميل الأفلام...</div>
                ) : (searchResults.length > 0 ? searchResults : trendingMovies).map(movie => {
                  const isSelected = selectedMovie?.id === movie.id;
                  const poster = movie.poster_path ? getPosterUrl(movie.poster_path, 'w92') : null;
                  const year = movie.release_date ? movie.release_date.split('-')[0] : '';
                  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;

                  return (
                    <div 
                      key={movie.id} 
                      className={`tg-movie-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMovie(movie)}
                    >
                      <div className="tg-item-poster">
                        {poster ? <img src={poster} alt={movie.title} /> : <Film size={18} />}
                      </div>
                      <div className="tg-item-info">
                        <div className="tg-item-title">{movie.title || movie.original_title}</div>
                        <div className="tg-item-meta">
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
                {HOOKS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Synopsis Editor */}
            <div className="tg-synopsis-editor">
              <label>قصة الفيلم المشوقة (قابلة للتعديل):</label>
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
                    <Film size={36} />
                    <span>اختر فيلماً للمعاينة</span>
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
                  <span>▶️ مشاهدة الفيلم كامل بجودة 1080p</span>
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
                disabled={isPublishing || !selectedMovie}
              >
                {isPublishing ? (
                  <>
                    <Loader2 size={18} className="tg-spinner" />
                    <span>جاري الإرسال والنشر في تليجرام...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>نشر الفيلم في القناة الآن 📢</span>
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

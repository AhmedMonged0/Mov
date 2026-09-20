import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  HardDrive, 
  Sparkles, 
  ShieldCheck, 
  FileVideo, 
  HelpCircle,
  Tv,
  Film
} from 'lucide-react';
import '../../styles/DownloadHub.css';

export default function DownloadHub({ 
  title = '', 
  links = [], 
  mediaType = 'movie', 
  season = null, 
  episode = null 
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | '1080p' | '720p' | '480p'

  const handleCopy = (url, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const isTv = mediaType === 'tv';
  const headingTitle = isTv 
    ? `روابط تحميل الحلقة ${episode} (الموسم ${season}) 📥`
    : `روابط التحميل المباشر لفيلم ${title} 📥`;

  return (
    <div className="download-hub-section" dir="rtl">
      <div className="download-hub-card">
        {/* Header */}
        <div className="download-hub-header">
          <div className="download-hub-title-group">
            <div className="download-icon-wrap">
              <Download size={24} />
            </div>
            <div>
              <div className="download-hub-badge">
                <Sparkles size={12} />
                <span>تحميل مباشر فائق السرعة • متعدد الجودات</span>
              </div>
              <h3 className="download-hub-title">{headingTitle}</h3>
              <p className="download-hub-sub">
                اختر الجودة والسيرفر المناسب لسرعة اتصالك وسعة جهازك للمشاهدة بدون إنترنت
              </p>
            </div>
          </div>

          <div className="download-protection-pill">
            <ShieldCheck size={14} />
            <span>روابط فحصها آمن 100% 🛡️</span>
          </div>
        </div>

        {/* Download Grid Cards */}
        <div className="download-links-grid">
          {links.map((link) => {
            const isCopied = copiedId === link.id;

            return (
              <div 
                key={link.id} 
                className={`download-link-card ${link.recommended ? 'recommended' : ''}`}
              >
                {link.recommended && (
                  <div className="download-recommended-ribbon">
                    الأعلى جودة وسرعة ⭐
                  </div>
                )}

                <div className="download-card-top">
                  <div className="download-quality-pill" style={{ borderColor: link.color, color: link.color }}>
                    <FileVideo size={14} />
                    <span>{link.quality}</span>
                  </div>
                  <span className="download-size-tag">
                    <HardDrive size={12} />
                    <span>{link.approxSize}</span>
                  </span>
                </div>

                <div className="download-card-body">
                  <h4 className="download-server-name">{link.serverName}</h4>
                  <p className="download-card-desc">{link.label}</p>
                  <span className="download-res-badge">{link.resolution}</span>
                </div>

                <div className="download-card-actions">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-action-btn primary-dl"
                    title="تحميل مباشر الآن"
                  >
                    <Download size={15} />
                    <span>تحميل الآن 🚀</span>
                  </a>

                  <button
                    type="button"
                    className={`download-action-btn copy-btn ${isCopied ? 'copied' : ''}`}
                    onClick={() => handleCopy(link.url, link.id)}
                    title="نسخ الرابط لبرامج التحميل مثل IDM و 1DM"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        <span>تم النسخ! ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips & Instructions Footer */}
        <div className="download-hub-footer">
          <div className="download-tip-item">
            <HelpCircle size={16} className="tip-icon" />
            <span>
              <strong>نصيحة لتحميل أسرع وأسهل:</strong> يمكنك الضغط على <strong>"نسخ الرابط"</strong> ولصقه في برامج التحميل السريعة مثل <strong>(Internet Download Manager للكمبيوتر أو 1DM / ADM للموبايل)</strong> للتحميل بأقصى سرعة واستكمال التحميل إذا انقطع النت.
            </span>
          </div>
          <div className="download-tip-item" style={{ marginTop: '8px' }}>
            <Sparkles size={16} className="tip-icon" />
            <span>
              إذا بدأ الفيديو في العمل داخل المتصفح مباشرة، اضغط كليك يمين على الفيديو أو علامة الثلاث نقاط <strong>(⋮)</strong> في شريط المشغل واختر <strong>"تنزيل الفيديو / Download Video"</strong> لحفظه فوراً على هاتفك أو حاسوبك.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

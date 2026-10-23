import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Check, Search, X, ChevronDown, Sparkles } from 'lucide-react';
import { playSketchClick } from '../utils/audio';
import { applyDOMTranslation } from '../utils/translationService';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  popular?: boolean;
}

// Top gamer languages followed by extensive 100+ languages list
export const ALL_LANGUAGES: LanguageOption[] = [
  // Major Popular Gamer Languages
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', popular: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', popular: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', popular: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', popular: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', popular: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', popular: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', popular: true },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', popular: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', popular: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', popular: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', popular: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', popular: true },
  { code: 'tl', name: 'Tagalog (Filipino)', nativeName: 'Tagalog', flag: '🇵🇭', popular: true },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', popular: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', popular: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', popular: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', popular: true },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', popular: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', popular: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', popular: true },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', popular: true },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', popular: true },

  // Additional 100+ Worldwide Languages
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Bisaya', flag: '🇵🇭' },
  { code: 'co', name: 'Corsican', nativeName: 'Corsu', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌐' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'fy', name: 'Frisian', nativeName: 'Frysk', flag: '🇳🇱' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob', flag: '🌐' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', nativeName: 'Ásụ̀sụ́ Ìgbò', flag: '🇳🇬' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '🇮🇶' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🇻🇦' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол хэл', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာစာ', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'ny', name: 'Nyanja (Chichewa)', nativeName: 'Chichewa', flag: '🇲🇼' },
  { code: 'or', name: 'Odia (Oriya)', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', flag: '🇼🇸' },
  { code: 'gd', name: 'Scots Gaelic', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaaliga', flag: '🇸🇴' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татар теле', flag: '🇷🇺' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', flag: '🇨🇳' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', flag: '🇮🇱' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
];

export function LanguageTranslator() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Aggressively clear and remove any Google Translate cookies, scripts, frames, and popups
  const purgeGoogleTranslateArtifacts = () => {
    try {
      // 1. Clear all possible googtrans cookies across current and parent hostnames and paths
      const host = window.location.hostname;
      const hostParts = host.split('.');
      const domains = ['', host, `.${host}`];
      if (hostParts.length > 2) {
        domains.push(`.${hostParts.slice(-2).join('.')}`);
      }
      
      const paths = ['/', '/app', ''];
      domains.forEach((d) => {
        paths.forEach((p) => {
          const domainStr = d ? `; domain=${d}` : '';
          const pathStr = p ? `; path=${p}` : '; path=/';
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pathStr}${domainStr}`;
          document.cookie = `googtrans=; max-age=0${pathStr}${domainStr}`;
        });
      });

      // 2. Remove any Google Translate script tags
      document.querySelectorAll('script[src*="translate.google.com"], #google-translate-script').forEach((s) => {
        s.remove();
      });

      // 3. Remove any Google Translate containers, elements, iframes, tooltips, and balloon frames
      const selectors = [
        '#google_translate_element',
        '.goog-te-banner-frame',
        '.goog-te-balloon-frame',
        '.goog-te-banner',
        '#goog-gt-tt',
        '.skiptranslate',
        'iframe[id*=":1.container"]',
        'iframe[id*=":2.container"]',
        'iframe.goog-te-banner-frame',
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((node) => node.remove());
      });

      // 4. Reset body styling that Google Translate alters
      if (document.body) {
        document.body.style.top = '0px';
        document.body.style.position = 'static';
      }
    } catch {
      // Ignore cleanup error
    }
  };

  // Initialize and check saved language
  useEffect(() => {
    // Purge any lingering Google Translate artifacts on mount
    purgeGoogleTranslateArtifacts();

    const saved = localStorage.getItem('squadup_preferred_lang');
    if (saved && saved !== 'en') {
      setSelectedLang(saved);
      setTimeout(() => {
        applyDOMTranslation(saved);
      }, 250);
    }

    // Set interval to kill any rogue Google popup that tries to re-render in the background
    const cleanupInterval = setInterval(() => {
      const banner = document.querySelector('.goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame');
      if (banner) {
        banner.remove();
        if (document.body) {
          document.body.style.top = '0px';
          document.body.style.position = 'static';
        }
      }
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Apply language translation cleanly in-app without Google external popups
  const handleSelectLanguage = async (code: string) => {
    playSketchClick();
    setSelectedLang(code);
    setIsTranslating(true);
    setIsOpen(false);
    localStorage.setItem('squadup_preferred_lang', code);

    // Keep Google artifacts purged
    purgeGoogleTranslateArtifacts();

    // Instant React DOM in-app translation for all words
    try {
      await applyDOMTranslation(code);
    } catch (err) {
      console.warn('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const currentOption = ALL_LANGUAGES.find((l) => l.code === selectedLang) || ALL_LANGUAGES[0];

  const filteredLanguages = ALL_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Compact trigger button - Small, neat, unobtrusive in the header banner */}
      <button
        id="language-translator-btn"
        type="button"
        data-no-translate="true"
        onClick={() => {
          playSketchClick();
          setIsOpen(true);
        }}
        className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 h-6 sm:h-6.5 bg-[#020a05] hover:bg-[#06170c] border border-green-500/60 hover:border-green-400 rounded-lg text-[10px] sm:text-[11px] font-sketch text-slate-200 hover:text-green-300 transition-all cursor-pointer shadow-[0_0_8px_rgba(34,197,94,0.25)] flex-shrink-0 hover:scale-105 active:scale-95"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        title={`Translate app (Active: ${currentOption.name}) • 100+ languages`}
        aria-label="Translate app language"
      >
        <Globe className={`w-3 h-3 text-green-400 flex-shrink-0 ${isTranslating ? 'animate-spin' : ''}`} />
        <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-green-300">
          {currentOption.flag} {currentOption.code.toUpperCase()}
        </span>
        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
      </button>

      {/* Language Selector Modal Dialog - Mounted to document.body via Portal to escape header containing block */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="language-translator-modal"
          data-no-translate="true"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
          className="notranslate fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[#020704] text-slate-100 rounded-2xl border-2 border-green-400 p-3 sm:p-4 shadow-[0_0_45px_rgba(34,197,94,0.45)] my-auto flex flex-col max-h-[88vh] select-none cursor-default overflow-hidden"
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-green-500/25">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-green-950/80 border border-green-400/50 shadow flex-shrink-0">
                  <Globe className="w-4 h-4 text-green-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold font-display text-white tracking-wide truncate">
                    Translate LobbyBazaar
                  </h3>
                  <p className="text-[10px] font-mono text-green-300/80 truncate">
                    100+ Worldwide Languages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                title="Close [Esc]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="my-2.5 relative flex-shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language (e.g. Spanish, Japanese, Arabic)..."
                className="w-full pl-9 pr-8 py-2 bg-black/70 border border-green-500/40 rounded-xl text-xs font-sketch text-white placeholder-slate-400 focus:outline-none focus:border-green-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Reset to English Banner */}
            {selectedLang !== 'en' && !searchQuery && (
              <div className="mb-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className="w-full p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-left text-xs font-sketch text-amber-200 flex items-center justify-between transition-colors cursor-pointer shadow"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <span>🇺🇸</span>
                    <span>Reset to English (Default)</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold uppercase">
                    RESET
                  </span>
                </button>
              </div>
            )}

            {/* Languages List (Scrollable, mobile-optimized touch targets) */}
            <div className="overflow-y-auto flex-1 divide-y divide-green-500/10 pr-0.5 max-h-[50vh] sm:max-h-[52vh]">
              {filteredLanguages.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-sketch">
                  No matching language found for "{searchQuery}".
                </div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full px-2.5 py-1.5 flex items-center justify-between text-left text-xs transition-colors rounded-lg font-sketch cursor-pointer ${
                        isSelected
                          ? 'bg-green-900/70 text-green-100 font-bold border border-green-400/60 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                          : 'hover:bg-green-950/50 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm flex-shrink-0">{lang.flag}</span>
                        <div className="truncate min-w-0">
                          <span className="text-slate-100">{lang.name}</span>
                          {lang.nativeName !== lang.name && (
                            <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                              ({lang.nativeName})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {lang.popular && (
                          <span className="text-[9px] font-mono text-green-400 bg-green-950/90 px-1 py-0.2 rounded border border-green-500/30">
                            HOT
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-green-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 mt-2 border-t border-green-500/20 text-[10px] font-mono text-slate-400 flex items-center justify-between flex-shrink-0">
              <span className="text-green-300 font-bold">
                {ALL_LANGUAGES.length} Languages Available
              </span>
              <span className="text-slate-400">Tap to translate instantly</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

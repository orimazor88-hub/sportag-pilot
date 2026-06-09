import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detect if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone;
      
    if (isStandalone) {
      return; // Already installed, do not show banner
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // iOS doesn't support beforeinstallprompt, show custom guide
      setShowBanner(true);
      return;
    }

    // Android/Chrome support
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="glass-card mb-6 animate-slide-up"
      style={{
        border: '1px solid rgba(8, 145, 178, 0.4)',
        background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
        position: 'relative'
      }}
    >
      <button 
        onClick={handleClose} 
        style={{
          position: 'absolute', top: 12, left: 12,
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer'
        }}
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-3">
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-lg)',
          background: 'rgba(8, 145, 178, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-teal-light)', flexShrink: 0
        }}>
          <Download size={22} />
        </div>
        
        <div style={{ flex: 1, paddingLeft: 16 }}>
          <h4 className="font-semibold text-sm mb-1">התקן את Physio-AI Pro בטלפון! 📱</h4>
          {isIos ? (
            <p className="text-xs text-secondary" style={{ lineHeight: 1.4 }}>
              לחץ על לחצן <strong>שיתוף <Share size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></strong> בדפדפן ספארי ובחר ב-<strong>"הוסף למסך הבית"</strong>.
            </p>
          ) : (
            <p className="text-xs text-secondary" style={{ lineHeight: 1.4 }}>
              התקן את האפליקציה למסך הבית לגישה מהירה וחווית משתמש מלאה.
            </p>
          )}
        </div>

        {!isIos && (
          <button className="btn btn-teal btn-sm" onClick={handleInstallClick}>
            התקן
          </button>
        )}
      </div>
    </div>
  );
}

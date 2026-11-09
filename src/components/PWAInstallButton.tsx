import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, Check, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed and running as standalone PWA, hide install trigger
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Ambient/Desktop fallback modal for browsers where prompt isn't yet fired
      setShowIOSGuide(true);
    }
  };

  // Render variant: Header pill
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          title="App auf Tablet oder Desktop installieren"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-semibold transition-all border border-emerald-600/40 shadow-xs cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-300" />
          <span>App installieren</span>
        </button>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Render variant: Card (prominent on homescreen)
  if (variant === 'card') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/30 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>KIZ Anamnese als App installieren</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-mono font-bold">PWA</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Direkt auf dem Tablet-Homescreen oder Arbeitsplatz-PC ohne Browserleiste öffnen.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Jetzt installieren</span>
          </button>
        </div>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Default button
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer ${className}`}
      >
        {justInstalled ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Installiert!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-emerald-400" />
            <span>App installieren</span>
          </>
        )}
      </button>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

interface IOSInstallModalProps {
  onClose: () => void;
  isIOS: boolean;
}

const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
              {isIOS ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
            </div>
            <h3 className="text-base font-bold text-white">
              {isIOS ? 'Auf iPad / iPhone installieren' : 'App auf Gerät installieren'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Apple iOS unterstützt die Installation direkt über den Safari-Browser:
            </p>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5 font-medium text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">1</span>
                <span>Tippen Sie unten auf das <strong className="text-emerald-400">Teilen-Symbol</strong></span>
                <Share2 className="w-4 h-4 text-emerald-400 inline ml-1" />
              </div>
              <div className="flex items-center gap-2.5 font-medium text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">2</span>
                <span>Wählen Sie <strong className="text-emerald-400">„Zum Home-Bildschirm“</strong></span>
                <PlusSquare className="w-4 h-4 text-emerald-400 inline ml-1" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Die App verhält sich danach wie eine native Tablet-App im Vollbildmodus.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              In Chrome, Edge oder Android können Sie die App direkt installieren:
            </p>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5 font-medium text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">1</span>
                <span>Klicken Sie auf das Installationssymbol rechts in der Adressleiste oder im Browsermenü</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">2</span>
                <span>Bestätigen Sie mit <strong className="text-emerald-400">„Installieren“</strong></span>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
};

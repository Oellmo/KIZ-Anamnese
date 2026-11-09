import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 border border-amber-400 text-white px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
      <div>
        <span className="font-bold">Offline-Modus aktiv:</span>
        <span className="text-amber-100 ml-1">Lokale Bogenbearbeitung läuft weiter.</span>
      </div>
      <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0 ml-1" />
    </div>
  );
};

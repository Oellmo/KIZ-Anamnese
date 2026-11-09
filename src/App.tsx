/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KizFormData, AuthorizedAdmin } from './types/anamnese';
import { 
  CHAPTERS, 
  createEmptyFormData, 
  createDemoFormData,
  EINRICHTUNG_OPTIONS
} from './data/kizFormStructure';
import { TabletHeader } from './components/TabletHeader';
import { ChapterContainer } from './components/ChapterContainer';
import { TabletBottomBar } from './components/TabletBottomBar';
import { SummaryEvaluationView } from './components/SummaryEvaluationView';
import { AdminDashboard } from './components/AdminDashboard';
import { HomeScreen } from './components/HomeScreen';
import { PrintReportView } from './components/PrintReportView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { computeFormStatistics } from './utils/exportHelpers';
import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuth, 
  subscribeToUserCases, 
  subscribeToAuthorizedAdmins,
  subscribeToFacilities,
  saveFacilitiesToFirestore,
  saveCaseToFirestore, 
  deleteCaseFromFirestore,
  isUserAdmin,
  sanitizeCaseForOrganization 
} from './lib/firebase';
import { User } from 'firebase/auth';
import { FolderOpen } from 'lucide-react';

const ACTIVE_CASE_SESSION_KEY = 'kiz_active_case_session_id';

export default function App() {
  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('offline');

  // Cases are stored exclusively in Firebase Firestore (no unencrypted local storage)
  const [cases, setCases] = useState<KizFormData[]>(() => {
    // Purge any residual legacy localStorage data to comply with strict DSGVO requirements
    try {
      localStorage.removeItem('kiz_anamnese_cases_v1');
      localStorage.removeItem('kiz_active_case_id_v1');
    } catch {
      // ignore
    }
    return [];
  });

  const [activeCaseId, setActiveCaseId] = useState<string>(() => {
    let saved = '';
    try {
      saved = sessionStorage.getItem(ACTIVE_CASE_SESSION_KEY) || '';
    } catch {
      // ignore
    }
    return saved;
  });

  // Navigation views: 'home' | 'questionnaire' | 'admin'
  const [viewMode, setViewMode] = useState<'home' | 'questionnaire' | 'admin'>('home');
  const [currentChapterId, setCurrentChapterId] = useState<number>(0);

  const saveTimeoutRef = useRef<any>(null);

  const [authorizedAdmins, setAuthorizedAdmins] = useState<AuthorizedAdmin[]>([]);
  const [facilities, setFacilities] = useState<string[]>(EINRICHTUNG_OPTIONS);

  // Listen for configurable facilities/groups from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToFacilities((items) => {
      if (Array.isArray(items)) {
        setFacilities(items);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveFacilities = async (updatedFacilities: string[]) => {
    setFacilities(updatedFacilities);
    try {
      await saveFacilitiesToFirestore(updatedFacilities, currentUser?.email || 'Admin');
    } catch (e) {
      console.error('Failed to save facilities to Firestore:', e);
    }
  };

  // Find the active case (null if cases is empty)
  const activeCase = cases.find((c) => c.id === activeCaseId) || (cases.length > 0 ? cases[0] : null);
  const isAdmin = isUserAdmin(currentUser, authorizedAdmins);

  // Listen for Authorized Admins Whitelist changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthorizedAdmins((admins) => {
      setAuthorizedAdmins(admins);
    });
    return () => unsubscribe();
  }, []);

  // 1. Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (!user) {
        setCloudSyncStatus('offline');
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time sync with Firebase Firestore when logged in (authoritative source of truth)
  useEffect(() => {
    if (!currentUser) return;
    setCloudSyncStatus('synced');

    const unsubscribe = subscribeToUserCases(
      currentUser,
      (cloudCases) => {
        // cloudCases is the authoritative list of cases from Firestore (may be [] if all deleted)
        const sanitizedList = cloudCases.map((c) => {
          const { caseData, changed } = sanitizeCaseForOrganization(c);
          if (changed) {
            saveCaseToFirestore(caseData, currentUser?.uid).catch(console.warn);
          }
          return caseData;
        });
        setCases(sanitizedList);
      },
      (err) => {
        console.error('Cloud sync listener error:', err);
        setCloudSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Store only the active case ID in sessionStorage for current tab navigation continuity (no sensitive case data in localStorage)
  useEffect(() => {
    try {
      sessionStorage.setItem(ACTIVE_CASE_SESSION_KEY, activeCaseId);
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [activeCaseId]);

  // Keep lastChapterId updated on activeCase so resuming always continues where left off
  useEffect(() => {
    if (viewMode === 'questionnaire' && activeCase && activeCase.lastChapterId !== currentChapterId) {
      setCases((prev) =>
        prev.map((c) =>
          c.id === activeCase.id
            ? { ...c, lastChapterId: currentChapterId, updatedAt: new Date().toISOString() }
            : c
        )
      );
    }
  }, [currentChapterId, activeCase?.id, viewMode]);

  // Trigger cloud saving with debouncing to avoid excessive writes
  const triggerCloudSave = useCallback((caseToSave: KizFormData) => {
    setCloudSyncStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveCaseToFirestore(caseToSave, currentUser?.uid);
        setCloudSyncStatus('synced');
      } catch (e) {
        console.error('Failed to save case to Firestore:', e);
        setCloudSyncStatus('error');
      }
    }, 500);
  }, [currentUser]);

  // Handler for case updates
  const handleCaseChange = useCallback((updatedCase: KizFormData) => {
    setCases((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
    );
    triggerCloudSave(updatedCase);
  }, [triggerCloudSave]);

  // Handler for starting a new case (no login required)
  const handleStartNewCase = async () => {
    const fresh = createEmptyFormData(cases);
    if (currentUser) {
      fresh.ownerId = currentUser.uid;
    }
    setCases((prev) => [fresh, ...prev]);
    setActiveCaseId(fresh.id);
    setCurrentChapterId(0);
    setViewMode('questionnaire');

    try {
      setCloudSyncStatus('saving');
      await saveCaseToFirestore(fresh, currentUser?.uid);
      setCloudSyncStatus('synced');
    } catch (e) {
      console.error('Failed to create case in Firestore:', e);
    }
  };

  // Handler for resuming an existing case by Chiffre or direct selection
  const handleResumeCase = (caseId: string, targetChapterId: number, loadedCase?: KizFormData) => {
    if (loadedCase) {
      setCases((prev) => {
        if (!prev.some((c) => c.id === loadedCase.id)) {
          return [loadedCase, ...prev];
        }
        return prev;
      });
    }
    setActiveCaseId(caseId);
    setCurrentChapterId(targetChapterId);
    setViewMode('questionnaire');
  };

  // Handler for duplicating a case
  const handleDuplicateCase = async (caseToDup: KizFormData) => {
    const duplicated: KizFormData = {
      ...caseToDup,
      id: 'case_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ownerId: currentUser?.uid,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastChapterId: caseToDup.lastChapterId ?? 0,
      stammdaten: {
        ...caseToDup.stammdaten,
        chiffre: `${caseToDup.stammdaten.chiffre} (Kopie)`,
        datum: new Date().toISOString().split('T')[0],
      },
    };
    setCases((prev) => [duplicated, ...prev]);
    setActiveCaseId(duplicated.id);

    try {
      setCloudSyncStatus('saving');
      await saveCaseToFirestore(duplicated, currentUser?.uid);
      setCloudSyncStatus('synced');
    } catch (e) {
      console.error('Failed to save duplicated case in Firestore:', e);
      setCloudSyncStatus('error');
    }
  };

  // Handler for deleting a case (allows deleting the very last case without re-generating a dummy)
  const handleDeleteCase = async (id: string) => {
    const targetCase = cases.find((c) => c.id === id);
    const remaining = cases.filter((c) => c.id !== id);
    setCases(remaining);
    if (activeCaseId === id) {
      setActiveCaseId(remaining.length > 0 ? remaining[0].id : '');
    }
    if (currentUser) {
      try {
        await deleteCaseFromFirestore(id, targetCase?.stammdaten?.chiffre);
      } catch (e) {
        console.error('Failed to delete case from Firestore:', e);
      }
    }
  };

  // Sync all existing cases to Firebase
  const handleSyncAllToFirebase = async () => {
    let user = currentUser;
    if (!user) {
      user = await loginWithGoogle();
    }
    if (!user) return;
    setCloudSyncStatus('saving');
    for (const c of cases) {
      await saveCaseToFirestore(c, user.uid);
    }
    setCloudSyncStatus('synced');
  };

  const mainRef = React.useRef<HTMLElement>(null);
  const topAnchorRef = React.useRef<HTMLDivElement>(null);

  // Instantly scroll to top of chapter whenever chapter changes on tablets
  useEffect(() => {
    if (viewMode === 'questionnaire') {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      topAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
      window.scrollTo(0, 0);

      const frameId = requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = 0;
        }
        topAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.scrollTo(0, 0);
      });

      const timer = setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = 0;
        }
        topAnchorRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.scrollTo(0, 0);
      }, 40);

      return () => {
        cancelAnimationFrame(frameId);
        clearTimeout(timer);
      };
    }
  }, [currentChapterId, viewMode]);

  // Stepper Navigation
  const handleNextChapter = () => {
    if (currentChapterId < 9) {
      setCurrentChapterId((prev) => prev + 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterId > 0) {
      setCurrentChapterId((prev) => prev - 1);
    }
  };

  const handleSelectChapter = (id: number) => {
    setCurrentChapterId(id);
  };

  const handlePrint = () => {
    window.print();
  };

  const { totalMarkedCount } = activeCase ? computeFormStatistics(activeCase) : { totalMarkedCount: 0 };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-100/70 text-slate-800 antialiased font-sans flex flex-col overflow-hidden">
      {/* Interactive Tablet Screen Layout (hidden during print) */}
      <div className="print:hidden flex flex-col h-full overflow-hidden">
        {viewMode === 'home' ? (
          /* HOMESCREEN VIEW */
          <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4">
            <HomeScreen
              onStartNewCase={handleStartNewCase}
              onResumeCase={handleResumeCase}
              onOpenAdmin={() => setViewMode('admin')}
              cases={cases}
            />
          </main>
        ) : viewMode === 'admin' ? (
          /* DEDICATED FULL-SCREEN ADMIN DASHBOARD VIEW */
          <div className="flex-1 min-h-0 overflow-y-auto">
            <AdminDashboard
              cases={cases}
              activeCaseId={activeCaseId}
              currentUser={currentUser}
              isAdmin={isAdmin}
              cloudSyncStatus={cloudSyncStatus}
              onBackToHome={() => setViewMode('home')}
              onOpenCase={(id) => {
                const c = cases.find((x) => x.id === id);
                handleResumeCase(id, c?.lastChapterId ?? 0);
              }}
              onNewCase={handleStartNewCase}
              onDeleteCase={handleDeleteCase}
              onDuplicateCase={handleDuplicateCase}
              onImportCase={async (c) => {
                if (currentUser) {
                  c.ownerId = currentUser.uid;
                }
                setCases((prev) => [c, ...prev]);
                handleResumeCase(c.id, c.lastChapterId ?? 0);
                if (currentUser) {
                  try {
                    await saveCaseToFirestore(c, currentUser.uid);
                  } catch (err) {
                    console.error('Failed to save imported case to Firestore:', err);
                  }
                }
              }}
              onPrintCase={(caseData) => {
                setActiveCaseId(caseData.id);
                setTimeout(() => handlePrint(), 80);
              }}
              onLogin={loginWithGoogle}
              onLogout={logoutUser}
              onSyncAllToFirebase={handleSyncAllToFirebase}
              facilities={facilities}
              onSaveFacilities={handleSaveFacilities}
            />
          </div>
        ) : !activeCase ? (
          /* NO ACTIVE CASE SELECTED FALLBACK */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Keine aktive Fallakte vorhanden</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Es ist aktuell keine Fallakte geladen. Sie können eine neue Anamnese starten oder zur Übersicht zurückkehren.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('home')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Zur Startseite
                </button>
                <button
                  type="button"
                  onClick={handleStartNewCase}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Neue Anamnese anlegen
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* QUESTIONNAIRE EDITING VIEW */
          <>
            <TabletHeader
              currentChapterId={currentChapterId}
              onSelectChapter={handleSelectChapter}
              formData={activeCase}
              onOpenAdmin={() => setViewMode('admin')}
              onGoHome={() => setViewMode('home')}
              cloudSyncStatus={cloudSyncStatus}
            />

            {/* Main Tablet Content Area - Scrollable with min-h-0 so Footer is ALWAYS docked at bottom */}
            <main
              ref={mainRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 sm:py-6"
            >
              {/* Scroll anchor placed at the very top */}
              <div ref={topAnchorRef} className="h-0 w-full opacity-0 pointer-events-none" />

              {currentChapterId === 9 ? (
                <SummaryEvaluationView
                  key="summary"
                  formData={activeCase}
                  onEditChapter={handleSelectChapter}
                  onSubmitCase={async () => {
                    if (activeCase) {
                      setCloudSyncStatus('saving');
                      try {
                        await saveCaseToFirestore(activeCase, currentUser?.uid);
                        setCloudSyncStatus('synced');
                      } catch (err) {
                        console.error('Failed to save to Firestore on submit:', err);
                        setCloudSyncStatus('error');
                      }
                    }
                  }}
                  onGoHome={() => setViewMode('home')}
                  onOpenAdmin={() => setViewMode('admin')}
                  onOpenShareModal={() => setViewMode('admin')}
                  onPrint={handlePrint}
                />
              ) : (
                <ChapterContainer
                  key={currentChapterId}
                  currentChapterId={currentChapterId}
                  formData={activeCase}
                  onChange={handleCaseChange}
                  onGoToSummary={() => handleSelectChapter(9)}
                  existingCases={cases}
                  facilities={facilities}
                />
              )}
            </main>

            {/* Fixed Tablet Bottom Bar with Thumb Controls */}
            <TabletBottomBar
              currentChapterId={currentChapterId}
              onPrev={handlePrevChapter}
              onNext={handleNextChapter}
              onGoToSummary={() => handleSelectChapter(9)}
              totalFlaggedCount={totalMarkedCount}
            />
          </>
        )}
      </div>

      {/* Offline connectivity indicator */}
      <OfflineIndicator />

      {/* Clean Printable Report Layout (rendered only when user prints or saves PDF and activeCase exists) */}
      {activeCase && <PrintReportView formData={activeCase} />}
    </div>
  );
}

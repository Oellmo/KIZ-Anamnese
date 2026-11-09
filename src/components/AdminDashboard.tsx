import React, { useState, useMemo, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  Shield, 
  FolderOpen, 
  BarChart3, 
  Search, 
  Filter, 
  PlusCircle, 
  Trash2, 
  Copy, 
  Printer, 
  Download, 
  Upload, 
  ExternalLink, 
  LogOut, 
  LogIn, 
  RefreshCw, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Clock, 
  FileText, 
  Eye, 
  X, 
  SlidersHorizontal,
  TrendingUp,
  AlertOctagon,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  UserPlus,
  UserCheck,
  Mail,
  Lock,
  EyeOff,
  Send,
  HelpCircle,
  Building2,
  Plus,
  Edit2,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { KizFormData, AuthorizedAdmin } from '../types/anamnese';
import { CHAPTERS, EINRICHTUNG_OPTIONS } from '../data/kizFormStructure';
import { computeAggregatedAnalytics, generateCsvExport, ItemStatistic } from '../utils/analyticsHelpers';
import { computeFormStatistics, downloadJsonFile } from '../utils/exportHelpers';
import { 
  ADMIN_EMAIL, 
  subscribeToAuthorizedAdmins, 
  addAuthorizedAdminToFirestore, 
  removeAuthorizedAdminFromFirestore,
  loginWithEmail,
  registerAuthorizedUserWithEmail,
  resetPasswordForEmail
} from '../lib/firebase';
import { ClientRadarChart } from './ClientRadarChart';
import { PWAInstallButton } from './PWAInstallButton';
import { LegalNoticeModal, LegalTab } from './LegalNoticeModal';

/**
 * Normalizes user input for facility / group creation.
 * If user enters "Haus im Feld #Gruppe Gelb", it formats it as "Haus im Feld – Gruppe Gelb".
 * Also supports "-" or "–" separators.
 */
export function formatFacilityInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.includes('#')) {
    const parts = trimmed.split('#').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const parent = parts[0];
      const child = parts.slice(1).join(' – ');
      return `${parent} – ${child}`;
    }
    if (parts.length === 1) {
      return parts[0];
    }
  }
  if (trimmed.includes(' - ') && !trimmed.includes(' – ')) {
    const parts = trimmed.split(' - ').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} – ${parts.slice(1).join(' – ')}`;
    }
  }
  return trimmed;
}

/**
 * Extracts parent facility / house name for categorization (e.g. "Haus im Feld" or "Pilgerhaus Weinheim").
 */
export function getFacilityParent(name: string): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (trimmed.includes(' – ')) {
    return trimmed.split(' – ')[0].trim();
  }
  if (trimmed.includes('#')) {
    return trimmed.split('#')[0].trim();
  }
  if (trimmed.includes(' - ')) {
    return trimmed.split(' - ')[0].trim();
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('haus im feld')) {
    return 'Haus im Feld';
  }
  if (lower.startsWith('pilgerhaus weinheim')) {
    return 'Pilgerhaus Weinheim';
  }
  if (lower.startsWith('peter-koch-schule')) {
    return 'Peter-Koch-Schule';
  }
  return null;
}

/**
 * Extracts the sub-group name (e.g. "Gruppe Gelb" from "Haus im Feld – Gruppe Gelb").
 */
export function getFacilitySubname(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.includes(' – ')) {
    return trimmed.split(' – ').slice(1).join(' – ').trim();
  }
  if (trimmed.includes('#')) {
    return trimmed.split('#').slice(1).join(' – ').trim();
  }
  if (trimmed.includes(' - ')) {
    return trimmed.split(' - ').slice(1).join(' – ').trim();
  }
  return trimmed;
}

/**
 * Returns distinct styling (background, text, and border) for each Hauptgruppe.
 * Guarantees that every Hauptgruppe gets its own consistent, high-contrast color.
 */
export function getParentBadgeStyle(parentName: string): { bg: string; text: string; border: string } {
  if (!parentName) return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
  const lower = parentName.toLowerCase();

  // Curated color themes for prominent standard facilities
  if (lower.includes('haus im feld')) {
    return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' };
  }
  if (lower.includes('pilgerhaus')) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' };
  }
  if (lower.includes('peter-koch') || lower.includes('schule')) {
    return { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300' };
  }
  if (lower.includes('ambulant')) {
    return { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' };
  }
  if (lower.includes('tagesgruppe')) {
    return { bg: 'bg-teal-100', text: 'text-teal-900', border: 'border-teal-300' };
  }

  // Deterministic palette mapping for any custom Hauptgruppe
  const PALETTES = [
    { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300' },
    { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
    { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300' },
    { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-300' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-900', border: 'border-fuchsia-300' },
    { bg: 'bg-lime-100', text: 'text-lime-900', border: 'border-lime-300' },
    { bg: 'bg-violet-100', text: 'text-violet-900', border: 'border-violet-300' },
  ];
  let hash = 0;
  for (let i = 0; i < parentName.length; i++) {
    hash = (hash << 5) - hash + parentName.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

interface AdminDashboardProps {
  cases: KizFormData[];
  activeCaseId: string;
  currentUser: User | null;
  isAdmin: boolean;
  cloudSyncStatus: 'synced' | 'saving' | 'offline' | 'error';
  onBackToHome: () => void;
  onOpenCase: (caseId: string) => void;
  onNewCase: () => void;
  onDeleteCase: (caseId: string) => Promise<void> | void;
  onDuplicateCase: (caseToDup: KizFormData) => void;
  onImportCase: (newCase: KizFormData) => void;
  onPrintCase: (caseData: KizFormData) => void;
  onLogin: () => Promise<User | null | void>;
  onLogout: () => Promise<void>;
  onSyncAllToFirebase: () => Promise<void>;
  facilities?: string[];
  onSaveFacilities?: (updatedFacilities: string[]) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  cases,
  activeCaseId,
  currentUser,
  isAdmin,
  cloudSyncStatus,
  onBackToHome,
  onOpenCase,
  onNewCase,
  onDeleteCase,
  onDuplicateCase,
  onImportCase,
  onPrintCase,
  onLogin,
  onLogout,
  onSyncAllToFirebase,
  facilities,
  onSaveFacilities,
}) => {
  // Navigation tabs within Admin Dashboard
  const [activeTab, setActiveTab] = useState<'cases' | 'analytics' | 'facilities' | 'whitelist'>('cases');
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);

  // Authorized Admins Whitelist state
  const [authorizedAdmins, setAuthorizedAdmins] = useState<AuthorizedAdmin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'chef' | 'kollege' | 'admin'>('kollege');
  const [newAdminNotes, setNewAdminNotes] = useState('');
  const [adminActionFeedback, setAdminActionFeedback] = useState<string | null>(null);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AuthorizedAdmin | null>(null);

  // Subscribe to whitelist of authorized email addresses
  React.useEffect(() => {
    const unsubscribe = subscribeToAuthorizedAdmins((admins) => {
      setAuthorizedAdmins(admins);
    });
    return () => unsubscribe();
  }, []);

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAdminActionFeedback('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    try {
      setIsSavingAdmin(true);
      await addAuthorizedAdminToFirestore({
        email: cleanEmail,
        name: newAdminName.trim() || cleanEmail,
        role: newAdminRole,
        notes: newAdminNotes.trim(),
      }, currentUser?.email || ADMIN_EMAIL);
      setAdminActionFeedback(`E-Mail ${cleanEmail} erfolgreich in Firebase autorisiert.`);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminNotes('');
      setTimeout(() => setAdminActionFeedback(null), 3500);
    } catch (err: any) {
      console.error('Failed to add authorized admin:', err);
      setAdminActionFeedback('Fehler beim Autorisieren der E-Mail.');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      setIsSavingAdmin(true);
      await removeAuthorizedAdminFromFirestore(adminToDelete.email);
      setAdminActionFeedback(`Autorisierung für ${adminToDelete.email} wurde erfolgreich widerrufen.`);
      setAdminToDelete(null);
      setTimeout(() => setAdminActionFeedback(null), 3500);
    } catch (err: any) {
      console.error('Failed to revoke admin:', err);
      setAdminActionFeedback('Fehler beim Widerrufen der Autorisierung.');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  // Active facility list: allows empty array, and sorts alphabetically by default
  const activeFacilities = useMemo(() => {
    const list = facilities !== undefined ? facilities : EINRICHTUNG_OPTIONS;
    return [...list].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true }));
  }, [facilities]);

  // Facilities management state
  const [newFacilityName, setNewFacilityName] = useState('');
  const [editingFacilityIndex, setEditingFacilityIndex] = useState<number | null>(null);
  const [editingFacilityName, setEditingFacilityName] = useState('');
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);
  const [facilityActionFeedback, setFacilityActionFeedback] = useState<string | null>(null);
  const [isSavingFacility, setIsSavingFacility] = useState(false);

  // Add a new facility (automatically sorted alphabetically)
  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formatFacilityInput(newFacilityName);
    if (!cleanName) return;

    if (activeFacilities.includes(cleanName)) {
      setFacilityActionFeedback('Dieser Bereich existiert bereits in der Liste.');
      setTimeout(() => setFacilityActionFeedback(null), 3000);
      return;
    }

    const updated = [...activeFacilities, cleanName].sort((a, b) =>
      a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true })
    );

    try {
      setIsSavingFacility(true);
      if (onSaveFacilities) {
        await onSaveFacilities(updated);
      }
      setNewFacilityName('');
      setFacilityActionFeedback(`Bereich „${cleanName}“ erfolgreich hinzugefügt.`);
      setTimeout(() => setFacilityActionFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to add facility:', err);
      setFacilityActionFeedback('Fehler beim Speichern des Bereichs.');
    } finally {
      setIsSavingFacility(false);
    }
  };

  // Delete a facility (allows deleting down to empty list)
  const handleConfirmDeleteFacility = async () => {
    if (!facilityToDelete) return;
    const target = facilityToDelete;
    const updated = activeFacilities.filter((f) => f !== target);
    try {
      setIsSavingFacility(true);
      if (onSaveFacilities) {
        await onSaveFacilities(updated);
      }
      setFacilityToDelete(null);
      setFacilityActionFeedback(`Bereich „${target}“ wurde gelöscht.`);
      setTimeout(() => setFacilityActionFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to delete facility:', err);
      setFacilityActionFeedback('Fehler beim Löschen des Bereichs.');
    } finally {
      setIsSavingFacility(false);
    }
  };

  // Clear all facilities (empties list)
  const handleClearAllFacilities = async () => {
    if (confirm('Möchten Sie wirklich alle Bereiche aus der Liste löschen? Die Liste wird dann vollständig geleert.')) {
      try {
        setIsSavingFacility(true);
        if (onSaveFacilities) {
          await onSaveFacilities([]);
        }
        setFacilityActionFeedback('Alle Bereiche wurden gelöscht. Die Liste ist nun leer.');
        setTimeout(() => setFacilityActionFeedback(null), 3500);
      } catch (err) {
        console.error('Failed to clear facilities:', err);
        setFacilityActionFeedback('Fehler beim Leeren der Liste.');
      } finally {
        setIsSavingFacility(false);
      }
    }
  };

  // Sort facilities alphabetically (A-Z)
  const handleSortFacilitiesAlphabetically = async () => {
    const sorted = [...activeFacilities].sort((a, b) =>
      a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true })
    );
    try {
      setIsSavingFacility(true);
      if (onSaveFacilities) {
        await onSaveFacilities(sorted);
      }
      setFacilityActionFeedback('Bereiche alphabetisch von A bis Z sortiert.');
      setTimeout(() => setFacilityActionFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to sort facilities:', err);
    } finally {
      setIsSavingFacility(false);
    }
  };

  // Save renamed facility (re-sorted alphabetically)
  const handleSaveEditFacility = async (index: number) => {
    const cleanName = formatFacilityInput(editingFacilityName);
    if (!cleanName || index < 0 || index >= activeFacilities.length) {
      setEditingFacilityIndex(null);
      return;
    }
    const updated = activeFacilities
      .map((f, i) => (i === index ? cleanName : f))
      .sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true }));

    try {
      setIsSavingFacility(true);
      if (onSaveFacilities) {
        await onSaveFacilities(updated);
      }
      setEditingFacilityIndex(null);
      setFacilityActionFeedback(`Bereich umbenannt in „${cleanName}“.`);
      setTimeout(() => setFacilityActionFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to update facility:', err);
      setFacilityActionFeedback('Fehler beim Aktualisieren des Bereichs.');
    } finally {
      setIsSavingFacility(false);
    }
  };

  // Move facility position up or down (for manual reordering if desired)
  const handleMoveFacility = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeFacilities.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...activeFacilities];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    try {
      setIsSavingFacility(true);
      if (onSaveFacilities) {
        await onSaveFacilities(updated);
      }
    } catch (err) {
      console.error('Failed to reorder facilities:', err);
    } finally {
      setIsSavingFacility(false);
    }
  };

  // Reset to default Pilgerhaus groups
  const handleResetFacilitiesToDefault = async () => {
    if (confirm('Möchten Sie die Liste der Bereiche wirklich auf den offiziellen Pilgerhaus-Standard zurücksetzen?')) {
      try {
        setIsSavingFacility(true);
        if (onSaveFacilities) {
          await onSaveFacilities(EINRICHTUNG_OPTIONS);
        }
        setFacilityActionFeedback('Bereiche auf Pilgerhaus-Standard zurückgesetzt.');
        setTimeout(() => setFacilityActionFeedback(null), 3500);
      } catch (err) {
        console.error('Failed to reset facilities:', err);
      } finally {
        setIsSavingFacility(false);
      }
    }
  };

  // Case table filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft'>('all');
  const [tableFacilityFilter, setTableFacilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'chiffre'>('date-desc');

  // Analytics filters
  const [analyticsFacilityFilter, setAnalyticsFacilityFilter] = useState<string>('all');
  const [analyticsChapterFilter, setAnalyticsChapterFilter] = useState<number | 'all'>('all');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [expandedChiffrenCodes, setExpandedChiffrenCodes] = useState<Record<string, boolean>>({});

  // Deletion modal state
  const [caseToDelete, setCaseToDelete] = useState<KizFormData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail preview modal state
  const [previewCase, setPreviewCase] = useState<KizFormData | null>(null);

  // Cloud sync feedback
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Authentication UI state
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'login' | 'first-time' | 'reset'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordConfirmInput, setPasswordConfirmInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Distinct parent houses (e.g. "Haus im Feld", "Pilgerhaus Weinheim")
  const distinctParents = useMemo(() => {
    const parents = new Set<string>();
    activeFacilities.forEach((f) => {
      const p = getFacilityParent(f);
      if (p) parents.add(p);
    });
    if (activeFacilities.some((f) => f.toLowerCase().includes('haus im feld'))) {
      parents.add('Haus im Feld');
    }
    return Array.from(parents);
  }, [activeFacilities]);

  // Universal case matching for cohort filtering (supports "all", "parent:...", "haus_im_feld_all", or specific group)
  const isCaseMatchingFacilityFilter = useCallback(
    (caseItem: KizFormData, filterValue: string): boolean => {
      if (filterValue === 'all') return true;

      const rawEinr = caseItem.stammdaten?.einrichtung || '';
      const lowerEinr = rawEinr.toLowerCase();

      // Overarching parent filter (e.g. "parent:Haus im Feld" or legacy "haus_im_feld_all")
      if (filterValue.startsWith('parent:')) {
        const parentTarget = filterValue.replace('parent:', '').toLowerCase();
        return lowerEinr.includes(parentTarget);
      }
      if (filterValue === 'haus_im_feld_all') {
        return lowerEinr.includes('haus im feld');
      }

      // Exact match with configured name
      if (rawEinr === filterValue) return true;

      // Match sub-group name (e.g. "Gruppe Gelb" matches "Haus im Feld – Gruppe Gelb")
      const targetSub = getFacilitySubname(filterValue);
      if (targetSub && (lowerEinr === targetSub.toLowerCase() || lowerEinr.endsWith(targetSub.toLowerCase()))) {
        return true;
      }
      if (filterValue.toLowerCase().includes(lowerEinr) && lowerEinr.length > 2) {
        return true;
      }
      return false;
    },
    []
  );

  // Filtered cases specifically for the statistical evaluation & radar profile
  const analyticsCases = useMemo(() => {
    if (analyticsFacilityFilter === 'all') return cases;
    return cases.filter((c) => isCaseMatchingFacilityFilter(c, analyticsFacilityFilter));
  }, [cases, analyticsFacilityFilter, isCaseMatchingFacilityFilter]);

  // Compute analytics across filtered cohort cases
  const analytics = useMemo(() => computeAggregatedAnalytics(analyticsCases), [analyticsCases]);
  const activeCase = useMemo(() => cases.find((c) => c.id === activeCaseId) || (cases.length > 0 ? cases[0] : undefined), [cases, activeCaseId]);

  // Handle manual sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await onSyncAllToFirebase();
      setSyncFeedback('Erfolgreich mit Firebase Firestore synchronisiert!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (e) {
      setSyncFeedback('Fehler beim Synchronisieren.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle CSV export of all items
  const handleExportCsv = () => {
    const csvContent = generateCsvExport(analytics, analyticsCases);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filterSuffix = analyticsFacilityFilter !== 'all' ? `_${analyticsFacilityFilter.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    link.setAttribute('download', `kiz_anamnese_auswertung${filterSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle JSON export of all cases
  const handleExportAllJson = () => {
    downloadJsonFile(cases, `kiz_alle_fallakten_${new Date().toISOString().split('T')[0]}.json`);
  };

  // Handle JSON import
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => onImportCase(c));
        } else if (parsed && parsed.stammdaten) {
          onImportCase({
            ...parsed,
            id: 'imported_' + Date.now(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm and execute case deletion
  const handleConfirmDelete = async () => {
    if (!caseToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteCase(caseToDelete.id);
      setCaseToDelete(null);
    } catch (err) {
      console.error('Failed to delete case:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort cases
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        const query = searchQuery.trim().toLowerCase();
        if (query) {
          const chMatch = c.stammdaten.chiffre?.toLowerCase().includes(query);
          const kostMatch = c.stammdaten.kostentraeger?.toLowerCase().includes(query);
          const einrMatch = c.stammdaten.einrichtung?.toLowerCase().includes(query);
          const datMatch = c.stammdaten.datum?.toLowerCase().includes(query);
          if (!chMatch && !kostMatch && !einrMatch && !datMatch) return false;
        }

        const isCompleted = (c.lastChapterId ?? 0) >= 8 || !!c.ergaenzungen?.paedagogischeEinschaetzung;
        if (statusFilter === 'completed' && !isCompleted) return false;
        if (statusFilter === 'draft' && isCompleted) return false;

        // Table facility filter
        if (tableFacilityFilter !== 'all') {
          if (!isCaseMatchingFacilityFilter(c, tableFacilityFilter)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        }
        if (sortBy === 'chiffre') {
          return (a.stammdaten.chiffre || '').localeCompare(b.stammdaten.chiffre || '');
        }
        return 0;
      });
  }, [cases, searchQuery, statusFilter, tableFacilityFilter, sortBy]);

  // Filter analytics items
  const filteredAnalyticsItems = useMemo(() => {
    return analytics.allItems.filter((item) => {
      if (analyticsChapterFilter !== 'all' && item.chapterId !== analyticsChapterFilter) {
        return false;
      }
      if (analyticsSearchQuery.trim()) {
        const q = analyticsSearchQuery.toLowerCase();
        const codeMatch = item.code.toLowerCase().includes(q);
        const labelMatch = item.label.toLowerCase().includes(q);
        const secMatch = item.sectionTitle?.toLowerCase().includes(q);
        if (!codeMatch && !labelMatch && !secMatch) return false;
      }
      return true;
    });
  }, [analytics.allItems, analyticsChapterFilter, analyticsSearchQuery]);

  // -------------------------------------------------------------
  // 1. AUTHENTICATION GATE: Prompt login if not authenticated
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
        {/* Top bar with back to home */}
        <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zur Startseite</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Öffentlicher Fragebogen ohne Login aktiv</span>
          </div>
        </div>

        {/* Central Login Card */}
        <div className="max-w-md w-full mx-auto bg-slate-800/95 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-2.5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/30">
              <Shield className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              Pilgerhaus Weinheim • Interner Zugang
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              KIZ Admin-Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Anmeldung für Mitarbeitende und Leitung des Pilgerhauses (z. B. <span className="text-emerald-300 font-mono">name@pilgerhaus.de</span>).
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('login');
                setLoginError(null);
                setLoginSuccessMessage(null);
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg transition-all cursor-pointer text-center ${
                loginMode === 'login'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('first-time');
                setLoginError(null);
                setLoginSuccessMessage(null);
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg transition-all cursor-pointer text-center ${
                loginMode === 'first-time'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Passwort festlegen
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('reset');
                setLoginError(null);
                setLoginSuccessMessage(null);
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg transition-all cursor-pointer text-center ${
                loginMode === 'reset'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Passwort vergessen
            </button>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{loginError}</p>
                {loginError.includes('Firebase Console') && (
                  <p className="text-[11px] text-amber-300">
                    Aktivieren Sie in der Firebase Console unter Authentication den Anbieter &quot;E-Mail/Passwort&quot;.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {loginSuccessMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="font-semibold">{loginSuccessMessage}</p>
            </div>
          )}

          {/* MODE 1: Standard Email & Password Login */}
          {loginMode === 'login' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isLoggingIn) return;
                setIsLoggingIn(true);
                setLoginError(null);
                setLoginSuccessMessage(null);
                try {
                  await loginWithEmail(emailInput, passwordInput);
                } catch (err: any) {
                  const msg = err?.message?.replace('Error: ', '') || 'Anmeldung fehlgeschlagen.';
                  setLoginError(msg);
                } finally {
                  setIsLoggingIn(false);
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-Mail-Adresse (@pilgerhaus.de)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@pilgerhaus.de"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Passwort
                  </label>
                  <button
                    type="button"
                    onClick={() => setLoginMode('reset')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Vergessen?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ihr Passwort"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 px-4 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Anmeldung läuft...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Mit Pilgerhaus-Konto anmelden</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setLoginMode('first-time')}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Neu im Team? Hier erstmalig Passwort für freigeschaltete E-Mail festlegen →
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: First-Time Setup / Password Activation */}
          {loginMode === 'first-time' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isLoggingIn) return;
                if (passwordInput !== passwordConfirmInput) {
                  setLoginError('Die beiden Passwörter stimmen nicht überein.');
                  return;
                }
                if (passwordInput.length < 6) {
                  setLoginError('Das Passwort muss mindestens 6 Zeichen lang sein.');
                  return;
                }
                setIsLoggingIn(true);
                setLoginError(null);
                setLoginSuccessMessage(null);
                try {
                  await registerAuthorizedUserWithEmail(emailInput, passwordInput, nameInput);
                  setLoginSuccessMessage('Konto erfolgreich aktiviert! Sie werden direkt eingeloggt...');
                } catch (err: any) {
                  const msg = err?.message?.replace('Error: ', '') || 'Aktivierung fehlgeschlagen.';
                  setLoginError(msg);
                } finally {
                  setIsLoggingIn(false);
                }
              }}
              className="space-y-3.5"
            >
              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Erstmalige Passwort-Aktivierung</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Gilt für Kolleginnen, Kollegen und Leitung, deren E-Mail vorab in der internen Whitelist eingetragen wurde.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ihre freigeschaltete Pilgerhaus-E-Mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@pilgerhaus.de"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ihr Name (optional)
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="z. B. Vorname Nachname"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Neues Passwort vergeben (mind. 6 Zeichen) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Passwort bestätigen *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordConfirmInput}
                    onChange={(e) => setPasswordConfirmInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 px-4 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Konto wird aktiviert...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Konto aktivieren & Passwort speichern</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setLoginMode('login')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Bereits ein Passwort vergeben? Zurück zur Anmeldung
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: Reset Password */}
          {loginMode === 'reset' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isLoggingIn) return;
                setIsLoggingIn(true);
                setLoginError(null);
                setLoginSuccessMessage(null);
                try {
                  await resetPasswordForEmail(emailInput);
                  setLoginSuccessMessage(
                    `Ein Link zum Zurücksetzen des Passworts wurde an ${emailInput} gesendet. Bitte prüfen Sie Ihr E-Mail-Postfach.`
                  );
                } catch (err: any) {
                  const msg = err?.message?.replace('Error: ', '') || 'Passwort-Zurücksetzen fehlgeschlagen.';
                  setLoginError(msg);
                } finally {
                  setIsLoggingIn(false);
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ihre freigeschaltete Pilgerhaus-E-Mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@pilgerhaus.de"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 px-4 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Wird gesendet...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Link zum Zurücksetzen senden</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setLoginMode('login')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Zurück zur Anmeldung
                </button>
              </div>
            </form>
          )}

          {/* Alternative Google Sign-in */}
          <div className="mt-5 pt-4 border-t border-slate-700/60">
            <div className="relative flex items-center justify-center mb-3">
              <span className="bg-slate-800 px-2 text-[11px] text-slate-500 uppercase tracking-wider">
                Oder mit Google anmelden
              </span>
            </div>

            <button
              type="button"
              disabled={isLoggingIn}
              onClick={async () => {
                if (isLoggingIn) return;
                setIsLoggingIn(true);
                setLoginError(null);
                try {
                  const res = await onLogin();
                  if (!res) return;
                } catch (err: unknown) {
                  const errorObj = err as { code?: string; message?: string };
                  if (
                    errorObj?.code === 'auth/cancelled-popup-request' ||
                    errorObj?.code === 'auth/popup-closed-by-user'
                  ) {
                    return;
                  }
                  if (errorObj?.code === 'auth/popup-blocked') {
                    setLoginError('Pop-ups wurden im Browser blockiert. Bitte erlauben Sie Pop-ups für diese Seite.');
                  } else if (
                    errorObj?.code === 'auth/unauthorized-whitelist-email' ||
                    (err as any)?.message?.includes('ZUGRIFF_VERWEIGERT')
                  ) {
                    setLoginError(
                      (err as any)?.message?.replace('Error: ', '') ||
                      'Zugriff verweigert: Diese E-Mail-Adresse ist nicht in der Firebase-Whitelist freigeschaltet.'
                    );
                  } else {
                    setLoginError('Google-Anmeldung fehlgeschlagen.');
                  }
                } finally {
                  setIsLoggingIn(false);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Google-Konto verwenden</span>
            </button>
          </div>

          {/* DSGVO Privacy Note */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Datenschutz & Zugangsschutz (DSGVO / DSG-EKD)</span>
            </div>
            <p className="leading-relaxed">
              Aus Datenschutzgründen ist eine Selbstregistrierung für Dritte gesperrt. Nur vom Pilgerhaus autorisierte Adressen können sich anmelden oder ihr Kennwort aktivieren.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 text-center">
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Abbrechen und zurück zur Startseite
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          KIZ Pädagogische Anamnese • Pilgerhaus Weinheim • DSGVO-konforme Speicherung
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHORIZATION CHECK: User is logged in but not admin
  // -------------------------------------------------------------
  const userIsAuthorized =
    isAdmin ||
    (currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    authorizedAdmins.some((a) => a.email.toLowerCase() === currentUser?.email?.toLowerCase());

  if (!userIsAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
        <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zur Startseite</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abmelden</span>
          </button>
        </div>

        <div className="max-w-md w-full mx-auto bg-slate-800/95 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Zugriff verweigert (Datenschutz)</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sie sind angemeldet als <span className="font-semibold text-rose-300">{currentUser.email}</span>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diese E-Mail-Adresse ist nicht in der Firebase-Whitelist für das zentrale Fallregister freigeschaltet. Eine Selbstregistrierung ist aus Datenschutzgründen gesperrt. Bitte wenden Sie sich an die Einrichtungsleitung des Pilgerhauses.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={async () => {
                await onLogout();
                await onLogin();
              }}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Mit anderem Konto anmelden</span>
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Zurück zur Startseite</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          KIZ Pädagogische Anamnese • Sicherheitsrichtlinie
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. FULL ADMIN DASHBOARD VIEW (Authenticated & Authorized)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">KIZ Admin-Dashboard</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Admin aktiv
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Zentrale Fallverwaltung & Item-Gesamtauswertung
              </div>
            </div>
          </div>

          {/* Right Controls: Zur Startseite, Sync, User, Ausloggen */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
            {/* Back to Home Button (links neben Firebase Sync) */}
            <button
              type="button"
              onClick={onBackToHome}
              title="Zur Startseite wechseln"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Zur Startseite</span>
            </button>

            {/* Sync Button */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Alle Fälle mit Firebase synchronisieren"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Firebase Sync</span>
              <span className="sm:hidden">Sync</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton variant="button" />

            {/* User pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-400"></div>
              <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[200px]" title={currentUser.email || ''}>
                {currentUser.email}
              </span>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={onLogout}
              title="Vom Admin-Bereich abmelden"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              aria-label="Abmelden"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>Ausloggen</span>
            </button>
          </div>
        </div>

        {/* Sync notification message banner if active */}
        {syncFeedback && (
          <div className="bg-emerald-800 text-emerald-100 text-xs py-1.5 px-4 text-center font-medium animate-in fade-in duration-200">
            {syncFeedback}
          </div>
        )}

        {/* Main Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex gap-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('cases')}
            title="Fallakten & Einträge anzeigen"
            className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cases'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Fallakten & Einträge</span>
            <span className="sm:hidden">Akten</span>
            <span className="text-[11px] opacity-80">({cases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            title="Statistische Gesamtauswertung der Items"
            className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Gesamtauswertung (Items)</span>
            <span className="sm:hidden">Auswertung</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            title="Bereiche & Wohngruppen des Pilgerhauses verwalten"
            className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'facilities'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Bereiche & Wohngruppen</span>
            <span className="sm:hidden">Bereiche</span>
            <span className="text-[11px] opacity-80">({activeFacilities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whitelist')}
            title="Zugriffsberechtigte E-Mail-Adressen verwalten"
            className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'whitelist'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Zugriff & Whitelist</span>
            <span className="sm:hidden">Whitelist</span>
            <span className="text-[11px] opacity-80">({authorizedAdmins.length})</span>
            <span className="hidden lg:inline-flex px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
              Datenschutz
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-6">

        {/* ============================================================ */}
        {/* TAB 1: FALLAKTEN VERWALTEN (Cases & Deletion)                 */}
        {/* ============================================================ */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gesamtzahl Akten</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{cases.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Zentral in Firebase Firestore gesichert</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Abgeschlossen</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{analytics.completedCasesCount}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {analytics.completionRate}% aller Fälle
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Bearbeitung</div>
                <div className="text-2xl font-black text-blue-700 mt-1">
                  {cases.length - analytics.completedCasesCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Jederzeit fortsetzbar per Chiffre</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cloud-Status</div>
                <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-lg">Online</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={`Admin: Pilgerhaus Weinheim (${currentUser.email})`}>
                  Admin: Pilgerhaus Weinheim
                </div>
              </div>
            </div>

            {/* Actions Bar: Search, Filters, New Case */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              {/* Left search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suche nach Chiffre, Kostenträger, Einrichtung, Datum..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="all">Alle Status</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="draft">In Bearbeitung</option>
                </select>

                <select
                  value={tableFacilityFilter}
                  onChange={(e) => setTableFacilityFilter(e.target.value)}
                  className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
                  title="Nach Einrichtung oder Wohngruppe filtern"
                >
                  <option value="all">Alle Gruppen & Häuser ({cases.length})</option>
                  {distinctParents.length > 0 && (
                    <optgroup label="Übergeordnete Häuser (alle Gruppen)">
                      {distinctParents.map((parent) => {
                        const count = cases.filter((c) =>
                          (c.stammdaten?.einrichtung || '').toLowerCase().includes(parent.toLowerCase())
                        ).length;
                        return (
                          <option key={`parent:${parent}`} value={`parent:${parent}`}>
                            ⭐ {parent} (Gesamt / Alle Gruppen) ({count})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <optgroup label="Spezifische Gruppen & Bereiche">
                    {activeFacilities.map((fac) => {
                      const count = cases.filter((c) => isCaseMatchingFacilityFilter(c, fac)).length;
                      return (
                        <option key={fac} value={fac}>
                          {fac} ({count})
                        </option>
                      );
                    })}
                  </optgroup>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="date-desc">Neueste</option>
                  <option value="date-asc">Älteste</option>
                  <option value="chiffre">Chiffre (A-Z)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onNewCase}
                  title="Neue Fallakte anlegen"
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Neue Akte</span>
                  <span className="sm:hidden">Neu</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="JSON-Fallakte importieren"
                  className="p-2 sm:px-3 sm:py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJsonFile}
                  accept=".json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleExportAllJson}
                  title="Alle Fallakten als JSON-Archiv sichern"
                  className="p-2 sm:px-3 sm:py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">JSON Backup</span>
                  <span className="sm:hidden">Backup</span>
                </button>
              </div>
            </div>

            {/* Cases Container: Responsive Layout */}
            {/* 1. MOBILE VIEW (< md): Touch-friendly, fully visible Action Cards */}
            <div className="block md:hidden space-y-3">
              {filteredCases.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-700">
                    {cases.length === 0 ? 'Keine Fallakten in der Datenbank vorhanden' : 'Keine Fallakten gefunden'}
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {cases.length === 0
                      ? 'Alle Akten wurden gelöscht. Sie können jederzeit eine neue Fallakte anlegen oder ein JSON-Archiv importieren.'
                      : 'Es wurden keine Fallakten gefunden, die den eingegebenen Filter- oder Suchkriterien entsprechen.'}
                  </p>
                  {cases.length === 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onNewCase}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Neue Akte anlegen</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredCases.map((c) => {
                  const stats = computeFormStatistics(c);
                  const isCompleted = (c.lastChapterId ?? 0) >= 8 || !!c.ergaenzungen?.paedagogischeEinschaetzung;
                  const lastDate = new Date(c.updatedAt || c.createdAt).toLocaleDateString('de-DE');

                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5 transition-all"
                    >
                      {/* Top Row: Chiffre & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-emerald-900 font-mono font-bold text-sm tracking-wider">
                              {c.stammdaten.chiffre}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Erfasst: <span className="text-slate-600 font-medium">{c.stammdaten.datum || 'Ohne Datum'}</span> • Geändert: {lastDate}
                          </div>
                        </div>

                        <div>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Abgeschlossen</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>In Bearbeitung</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stammdaten</div>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {c.stammdaten.geschlecht || 'k. A.'}
                            {c.stammdaten.alterInJahren ? ` • ${c.stammdaten.alterInJahren} J.` : ''}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate" title={c.stammdaten.kostentraeger || c.stammdaten.einrichtung || 'Kein Kostenträger'}>
                            {c.stammdaten.kostentraeger || c.stammdaten.einrichtung || 'Kein Kostenträger'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fortschritt</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{stats.totalMarkedCount} Items</div>
                          <div className="text-[11px] text-slate-500">Kapitel {c.lastChapterId ?? 0}/9</div>
                        </div>
                      </div>

                      {/* Bottom Action Bar: Always 100% visible and accessible on mobile screens */}
                      <div className="space-y-2 pt-1">
                        {/* Primary & Preview Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenCase(c.id)}
                            className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0" />
                            <span>Akte öffnen</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewCase(c)}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4 shrink-0" />
                            <span>Vorschau</span>
                          </button>
                        </div>

                        {/* Secondary Action Row: Drucken, Kopieren, Löschen */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => onPrintCase(c)}
                            className="py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Fallbericht drucken / PDF"
                          >
                            <Printer className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                            <span>Drucken</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDuplicateCase(c)}
                            className="py-2 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Fallakte duplizieren"
                          >
                            <Copy className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                            <span>Kopieren</span>
                          </button>

                          {/* Mobile Delete Button - Highlighted in rose red, 100% on-screen */}
                          <button
                            type="button"
                            onClick={() => setCaseToDelete(c)}
                            className="py-2 px-2 rounded-xl border border-rose-200 bg-rose-50/90 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Fallakte unwiderruflich löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span>Löschen</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. DESKTOP & TABLET VIEW (>= md): Full Table with Sticky Action Column */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-2 lg:px-3.5">Chiffre</th>
                      <th className="py-2.5 px-2 lg:px-3.5">Datum</th>
                      <th className="py-2.5 px-2 lg:px-3.5">Stammdaten</th>
                      <th className="py-2.5 px-2 lg:px-3.5 whitespace-nowrap">Fortschritt</th>
                      <th className="py-2.5 px-2 lg:px-3.5 whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-2 lg:px-3.5 text-right whitespace-nowrap">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FolderOpen className="w-8 h-8 text-slate-300" />
                            <span className="font-semibold text-slate-600">
                              {cases.length === 0
                                ? 'Keine Fallakten in der Datenbank vorhanden.'
                                : 'Keine Fallakten gefunden, die den Suchkriterien entsprechen.'}
                            </span>
                            {cases.length === 0 && (
                              <button
                                type="button"
                                onClick={onNewCase}
                                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Erste Fallakte anlegen</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((c) => {
                        const stats = computeFormStatistics(c);
                        const isCompleted = (c.lastChapterId ?? 0) >= 8 || !!c.ergaenzungen?.paedagogischeEinschaetzung;
                        const lastDate = new Date(c.updatedAt || c.createdAt).toLocaleDateString('de-DE');

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Chiffre */}
                            <td className="py-2.5 lg:py-3.5 px-2 lg:px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-emerald-800 text-xs tracking-wide">
                                {c.stammdaten.chiffre}
                              </span>
                            </td>

                            {/* Datum */}
                            <td className="py-2.5 lg:py-3.5 px-2 lg:px-3.5 text-slate-600 whitespace-nowrap">
                              <div className="font-semibold text-slate-800 text-xs">{c.stammdaten.datum || 'Ohne Datum'}</div>
                              <div className="text-[10px] text-slate-400">Geänd.: {lastDate}</div>
                            </td>

                            {/* Stammdaten */}
                            <td className="py-2.5 lg:py-3.5 px-2 lg:px-3.5 text-slate-600">
                              <div className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                                {c.stammdaten.geschlecht || 'k. A.'}
                                {c.stammdaten.alterInJahren ? ` (${c.stammdaten.alterInJahren} J.)` : ''}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[100px] md:max-w-[120px] lg:max-w-[160px]" title={c.stammdaten.kostentraeger || c.stammdaten.einrichtung || 'Kein Kostenträger'}>
                                {c.stammdaten.kostentraeger || c.stammdaten.einrichtung || 'Kein Kostenträger'}
                              </div>
                            </td>

                            {/* Fortschritt */}
                            <td className="py-2.5 lg:py-3.5 px-2 lg:px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1 lg:gap-1.5">
                                <span className="font-semibold text-slate-700 text-xs">
                                  {stats.totalMarkedCount} Items
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-500">
                                  Kap. {c.lastChapterId ?? 0}/9
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 lg:py-3.5 px-2 lg:px-3.5 whitespace-nowrap">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold whitespace-nowrap shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Abgeschlossen</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold whitespace-nowrap shrink-0">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>In Bearbeitung</span>
                                </span>
                              )}
                            </td>

                            {/* Actions column */}
                            <td className="py-2.5 lg:py-3.5 px-2 lg:px-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-0.5 lg:gap-1">
                                <button
                                  type="button"
                                  onClick={() => onOpenCase(c.id)}
                                  title="Akte öffnen & weiter bearbeiten"
                                  className="p-1 lg:p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPreviewCase(c)}
                                  title="Detailübersicht anzeigen"
                                  className="p-1 lg:p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onPrintCase(c)}
                                  title="Fallbericht drucken / PDF"
                                  className="p-1 lg:p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDuplicateCase(c)}
                                  title="Fallakte duplizieren"
                                  className="p-1 lg:p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCaseToDelete(c)}
                                  title="Fallakte unwiderruflich löschen"
                                  className="p-1 lg:p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: GESAMTAUSWERTUNG (Cross-Case Item Analytics)           */}
        {/* ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Header with Title and Export Actions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                  Statistische Kohorten-Analyse
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Gesamtauswertung aller Items über alle Fallakten
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Aggregierte Häufigkeiten, Verteilungen und statistische Auffälligkeiten über die ausgewertete Kohorte (N = {analytics.totalCases}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>CSV-Report exportieren</span>
                </button>
              </div>
            </div>

            {/* Filter Bar for Auswertung: Einrichtung / Gruppe */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span>Auswertung nach Einrichtung / Gruppe filtern</span>
                    {analyticsFacilityFilter !== 'all' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Aktiv: {analyticsCases.length} {analyticsCases.length === 1 ? 'Fall' : 'Fälle'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Analysieren Sie gezielt Teil-Kohorten (z. B. Kinder aus der Gruppe „Haus im Feld“).
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={analyticsFacilityFilter}
                  onChange={(e) => setAnalyticsFacilityFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 cursor-pointer shadow-2xs"
                >
                  <option value="all">📊 Gesamtauswertung (Alle Gruppen & Häuser) ({cases.length} Fälle)</option>
                  {distinctParents.length > 0 && (
                    <optgroup label="Übergeordnete Häuser (alle Gruppen des Hauses)">
                      {distinctParents.map((parent) => {
                        const count = cases.filter((c) =>
                          (c.stammdaten?.einrichtung || '').toLowerCase().includes(parent.toLowerCase())
                        ).length;
                        return (
                          <option key={`parent:${parent}`} value={`parent:${parent}`}>
                            ⭐ {parent} (alle Gruppen des Hauses) ({count} {count === 1 ? 'Fall' : 'Fälle'})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <optgroup label="Spezifische Gruppen & Bereiche">
                    {activeFacilities.map((fac) => {
                      const count = cases.filter((c) => isCaseMatchingFacilityFilter(c, fac)).length;
                      return (
                        <option key={fac} value={fac}>
                          {fac} ({count} {count === 1 ? 'Fall' : 'Fälle'})
                        </option>
                      );
                    })}
                  </optgroup>
                </select>

                {analyticsFacilityFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setAnalyticsFacilityFilter('all')}
                    className="px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Filter aufheben</span>
                  </button>
                )}
              </div>
            </div>

            {analyticsCases.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
                <Building2 className="w-12 h-12 text-amber-600 mx-auto" />
                <h3 className="text-base font-bold text-amber-900">Keine Fallakten für diese Gruppe gefunden</h3>
                <p className="text-xs text-amber-800 max-w-md mx-auto">
                  Für die gewählte Einrichtung oder Wohngruppe liegen im aktuellen Datenbestand noch keine Kinder vor.
                </p>
                <button
                  type="button"
                  onClick={() => setAnalyticsFacilityFilter('all')}
                  className="px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-bold hover:bg-amber-900 cursor-pointer"
                >
                  Alle Einrichtungen & Wohngruppen anzeigen
                </button>
              </div>
            ) : (
              <>
                {/* High Level KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluierte Fälle</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">{analytics.totalCases}</div>
                    <div className="text-xs text-emerald-700 font-medium mt-1">
                      {analytics.completedCasesCount} abgeschlossen ({analytics.completionRate}%)
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items / Fall (Ø)</div>
                    <div className="text-3xl font-black text-blue-700 mt-1">{analytics.averageItemsPerCase}</div>
                    <div className="text-xs text-slate-500 mt-1">Dokumentierte Kriterien</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top-Kategorie</div>
                    <div className="text-xl font-black text-slate-900 mt-1 truncate">
                      {analytics.chapterFrequencies.sort((a, b) => b.totalItemsSelected - a.totalItemsSelected)[0]?.title || '–'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Häufigste Problembereiche</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Häufigstes Item</div>
                    <div className="text-base font-bold text-slate-900 mt-1 truncate" title={analytics.topItems[0]?.label || ''}>
                      {analytics.topItems[0]?.label || 'Keine Daten'}
                    </div>
                    <div className="text-xs text-rose-600 font-semibold mt-1">
                      {analytics.topItems[0] ? `${analytics.topItems[0].percentage}% aller Fälle (${analytics.topItems[0].totalOccurrences}x)` : '–'}
                    </div>
                  </div>
                </div>

                {/* Radar Chart: Klienten-Belastungsprofil für gewählte Gruppe */}
                <ClientRadarChart cases={analyticsCases} activeCase={activeCase} />
              </>
            )}

            {/* Top 10 Most Frequent Issues across all cases */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>Top 10 Häufigste Problembereiche & Indikatoren</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Die am häufigsten dokumentierten Items aus allen Kapiteln
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {analytics.topItems.slice(0, 10).map((item, idx) => (
                  <div key={item.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-emerald-800 text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className="truncate max-w-[280px] sm:max-w-md" title={item.label}>
                          {item.label}
                        </span>
                        <span className="text-slate-400 text-[11px] hidden sm:inline">
                          ({item.chapterTitle})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{item.totalOccurrences} von {analytics.totalCases}</span>
                        <span className="w-12 text-right font-black text-emerald-700">{item.percentage}%</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demographics & Special Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Age Cohorts Distribution */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Altersverteilung</span>
                  </h3>
                  {analytics.averageAge !== undefined && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Ø {analytics.averageAge} J.
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 pt-1">
                  {analytics.ageDistribution.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center">Keine Altersdaten erfasst.</div>
                  ) : (
                    analytics.ageDistribution.map((a) => (
                      <div key={a.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700">{a.label}</span>
                          <span className="font-bold text-slate-900">{a.count} ({a.percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${a.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Gender Distribution */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Geschlechterverteilung</span>
                </h3>
                <div className="space-y-2.5 pt-1">
                  {analytics.genderDistribution.map((g) => (
                    <div key={g.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700">{g.label}</span>
                        <span className="font-bold text-slate-900">{g.count} ({g.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${g.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sorgerecht Distribution */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Sorgerechtsverhältnisse</span>
                </h3>
                <div className="space-y-2.5 pt-1">
                  {analytics.sorgerechtDistribution.map((s) => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 truncate max-w-[170px]" title={s.label}>{s.label}</span>
                        <span className="font-bold text-slate-900">{s.count} ({s.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IQ Levels Distribution */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Intelligenzniveau (Kapitel 5)</span>
                </h3>
                <div className="space-y-2.5 pt-1">
                  {analytics.iqDistribution.map((iq) => (
                    <div key={iq.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 truncate max-w-[170px]" title={iq.label}>{iq.label}</span>
                        <span className="font-bold text-slate-900">{iq.count} ({iq.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${iq.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complete Item Analysis Table with Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Vollständiger Item-Katalog & Häufigkeiten
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detaillierte Analyse jedes standardisierten KIZ-Items über alle {analytics.totalCases} Akten
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Chapter Filter */}
                  <select
                    value={analyticsChapterFilter}
                    onChange={(e) => setAnalyticsChapterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="all">Alle Kapitel</option>
                    <option value={2}>Kapitel 2: Vorangegangene Hilfen</option>
                    <option value={3}>Kapitel 3: Schulsituation</option>
                    <option value={4}>Kapitel 4: Psychosoziale Umstände</option>
                    <option value={5}>Kapitel 5: Entwicklungsstand & IQ</option>
                    <option value={6}>Kapitel 6: Symptomatik</option>
                    <option value={7}>Kapitel 7: Somatische Ursachen</option>
                  </select>

                  {/* Search within items */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={analyticsSearchQuery}
                      onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                      placeholder="Item durchsuchen..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Kapitel / Rubrik</th>
                      <th className="py-2.5 px-3">Bezeichnung des Items</th>
                      <th className="py-2.5 px-3 text-center">Häufigkeit</th>
                      <th className="py-2.5 px-3">Anteil in Kohorte</th>
                      <th className="py-2.5 px-3 text-right">Fälle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAnalyticsItems.map((item) => {
                      const isExpanded = !!expandedChiffrenCodes[item.code];
                      return (
                        <React.Fragment key={item.code}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                                {item.code}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              <div className="font-medium text-slate-700">{item.chapterTitle}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.sectionTitle}</div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              <div>{item.label}</div>
                              {item.optionsFrequencies && item.optionsFrequencies.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item.optionsFrequencies.map((opt) => (
                                    <span
                                      key={opt.option}
                                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-mono ${
                                        opt.count > 0 
                                          ? 'bg-purple-50 text-purple-900 border border-purple-200 font-bold' 
                                          : 'bg-slate-50 text-slate-400 border border-slate-200/60'
                                      }`}
                                      title={`${opt.count} von ${item.totalOccurrences} Fällen (${opt.percentageOfAffected}% der Betroffenen)`}
                                    >
                                      <span>{opt.option}:</span>
                                      <span className="font-extrabold">{opt.count}</span>
                                      <span className="opacity-75">({opt.percentage}%)</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                              {item.totalOccurrences}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.percentage > 40 ? 'bg-rose-500' : item.percentage > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-700 min-w-[32px] text-right">
                                  {item.percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {item.totalOccurrences > 0 || (item.optionsFrequencies && item.optionsFrequencies.length > 0) ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedChiffrenCodes((prev) => ({
                                      ...prev,
                                      [item.code]: !prev[item.code],
                                    }))
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                                >
                                  <span>{item.casesWithItem.length} Chiffren</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              ) : (
                                <span className="text-slate-300 text-[11px]">–</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Chiffren & Options row */}
                          {isExpanded && (
                            <tr className="bg-emerald-50/40">
                              <td colSpan={6} className="py-3 px-4 text-xs text-slate-700 space-y-3">
                                {item.casesWithItem.length > 0 && (
                                  <div>
                                    <span className="font-bold text-emerald-900 mr-2">Betroffene Chiffren ({item.casesWithItem.length}):</span>
                                    <div className="inline-flex flex-wrap gap-1.5 mt-1">
                                      {item.casesWithItem.map((chiffre, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 rounded bg-white border border-emerald-200 font-mono text-emerald-800 text-[11px] font-bold shadow-2xs"
                                        >
                                          {chiffre}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {item.optionsFrequencies && item.optionsFrequencies.length > 0 && (
                                  <div className="bg-white p-3 rounded-xl border border-purple-200/80 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                                      <span>Differenzierte Dropdown-Ausprägungen ({item.optionsFrequencies.length} Optionen):</span>
                                      <span className="text-[11px] font-normal text-slate-500">
                                        N = {analytics.totalCases} Gesamtfälle
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {item.optionsFrequencies.map((opt) => (
                                        <div
                                          key={opt.option}
                                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                                        >
                                          <div className="flex justify-between font-bold text-[11px] text-slate-800">
                                            <span className="truncate pr-1">{opt.option}</span>
                                            <span className="text-purple-800 font-mono shrink-0">
                                              {opt.count} ({opt.percentage}%)
                                            </span>
                                          </div>
                                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                              className="h-full bg-purple-600 rounded-full"
                                              style={{ width: `${Math.max(opt.percentage, 4)}%` }}
                                            />
                                          </div>
                                          <div className="text-[10px] text-slate-500 flex justify-between">
                                            <span>{opt.percentageOfAffected}% der Betroffenen</span>
                                            {opt.casesWithOption.length > 0 && (
                                              <span className="font-mono">{opt.casesWithOption.join(', ')}</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: BEREICHE & WOHNGRUPPEN (Facilities Management)        */}
        {/* ============================================================ */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Einrichtungs- & Wohngruppen-Verwaltung</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Bereiche des Pilgerhauses Weinheim konfigurieren
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
                    Hier können Sie flexibel neue Wohngruppen, Tagesgruppen oder Standorte anlegen, umbenennen oder die Reihenfolge anpassen. Änderungen werden in Echtzeit in Firebase Firestore synchronisiert und stehen allen Pädagogen direkt im Erfassungsbogen (Kapitel 1) sowie in den Auswertungs-Filtern zur Verfügung.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetFacilitiesToDefault}
                    disabled={isSavingFacility}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Auf Standard-Einrichtungen des Pilgerhauses zurücksetzen"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pilgerhaus-Standard laden</span>
                  </button>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs">
                    {activeFacilities.length} Bereiche aktiv
                  </span>
                </div>
              </div>

              {facilityActionFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in duration-150">
                  {facilityActionFeedback}
                </div>
              )}
            </div>

            {/* Form: Add New Facility / Residential Group */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Neuen Bereich oder neue Wohngruppe hinzufügen</span>
              </h3>

              <form onSubmit={handleAddFacility} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      required
                      value={newFacilityName}
                      onChange={(e) => setNewFacilityName(e.target.value)}
                      placeholder='z. B. "Haus im Feld #Gruppe Gelb" oder "Wohngruppe Sonnenblume"'
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingFacility || !newFacilityName.trim()}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingFacility ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Bereich anlegen</span>
                  </button>
                </div>

                {/* Live Preview for automatic hashtag syntax & pill formatting */}
                {newFacilityName.trim() && (
                  <div className="flex items-center gap-2 text-xs bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-emerald-950 flex-wrap animate-in fade-in">
                    <span className="font-semibold text-emerald-800">Vorschau:</span>
                    {(() => {
                      const formatted = formatFacilityInput(newFacilityName);
                      const parent = getFacilityParent(formatted);
                      const sub = getFacilitySubname(formatted);
                      const hasSub = Boolean(parent && sub && parent.toLowerCase() !== sub.toLowerCase());
                      const style = parent ? getParentBadgeStyle(parent) : null;
                      return hasSub && style && parent ? (
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${style.bg} ${style.text} ${style.border}`}>
                            {parent}
                          </span>
                          <span className="font-bold text-slate-900">{sub}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900">{formatted}</span>
                      );
                    })()}
                  </div>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Tipp:</strong> Geben Sie einfach z. B. <code>Haus im Feld #Gruppe Gelb</code> ein. Das System speichert automatisch <em>"Haus im Feld – Gruppe Gelb"</em> mit der Zuordnungs-Pill <em>"Haus im Feld"</em> für gemeinsame Kohorten-Auswertungen.
                </p>
              </form>
            </div>

            {/* Configured Facilities List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aktuell konfigurierte Bereiche ({activeFacilities.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alphabetisch von A bis Z sortiert für eine einheitliche Dropdown-Auswahl.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeFacilities.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSortFacilitiesAlphabetically}
                      disabled={isSavingFacility}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Liste alphabetisch von A bis Z sortieren"
                    >
                      <span>A–Z sortieren</span>
                    </button>
                  )}

                  {activeFacilities.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearAllFacilities}
                      disabled={isSavingFacility}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Alle Bereiche aus der Liste entfernen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Alle löschen (Liste leeren)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetFacilitiesToDefault}
                      disabled={isSavingFacility}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Pilgerhaus-Standard wiederherstellen"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Standard wiederherstellen</span>
                    </button>
                  )}
                </div>
              </div>

              {activeFacilities.length === 0 ? (
                <div className="p-8 sm:p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Die Liste der Bereiche ist aktuell leer</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Sie haben alle Bereiche gelöscht. Sie können nun oben neue individuelle Bereiche anlegen (z. B. mit <code>Haus im Feld #Gruppe Gelb</code>) oder bei Bedarf die Pilgerhaus-Standardbereiche wiederherstellen.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetFacilitiesToDefault}
                      disabled={isSavingFacility}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pilgerhaus-Standard wiederherstellen</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeFacilities.map((facName, index) => {
                    const assignedCount = cases.filter((c) => isCaseMatchingFacilityFilter(c, facName)).length;
                    const isEditing = editingFacilityIndex === index;
                    const parentName = getFacilityParent(facName);
                    const subName = getFacilitySubname(facName);
                    const hasSubgroup = Boolean(parentName && subName && parentName.toLowerCase() !== subName.toLowerCase());
                    const badgeStyle = parentName ? getParentBadgeStyle(parentName) : null;

                    return (
                      <div
                        key={facName}
                        className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                          {/* Order badge */}
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 max-w-md">
                              <input
                                type="text"
                                value={editingFacilityName}
                                onChange={(e) => setEditingFacilityName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-emerald-500 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditFacility(index)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title="Speichern"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFacilityIndex(null)}
                                className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Abbrechen"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                                {hasSubgroup && badgeStyle && parentName ? (
                                  <>
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs shrink-0 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                                    >
                                      {parentName}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900">
                                      {subName}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-bold text-slate-900">
                                    {facName}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {assignedCount > 0 ? (
                                  <span className="text-emerald-700 font-semibold">
                                    ✓ {assignedCount} {assignedCount === 1 ? 'Fallakte' : 'Fallakten'} zugeordnet
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Aktuell keine Fälle</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Move up */}
                            <button
                              type="button"
                              onClick={() => handleMoveFacility(index, 'up')}
                              disabled={index === 0 || isSavingFacility}
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
                              title="Nach oben verschieben"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>

                            {/* Move down */}
                            <button
                              type="button"
                              onClick={() => handleMoveFacility(index, 'down')}
                              disabled={index === activeFacilities.length - 1 || isSavingFacility}
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer transition-colors"
                              title="Nach unten verschieben"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>

                            {/* Rename */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFacilityIndex(index);
                                setEditingFacilityName(facName);
                              }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors ml-1"
                              title="Bereich umbenennen"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setFacilityToDelete(facName)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
                              title="Bereich löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal for Facility */}
            {facilityToDelete && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Bereich löschen?</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Möchten Sie den Bereich <strong className="text-rose-700">„{facilityToDelete}“</strong> wirklich aus den Auswahloptionen entfernen?
                    </p>
                    {cases.filter((c) => c.stammdaten?.einrichtung === facilityToDelete).length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
                        ⚠️ <strong>Hinweis:</strong> Diesem Bereich sind aktuell{' '}
                        <strong>{cases.filter((c) => c.stammdaten?.einrichtung === facilityToDelete).length} Fälle</strong> zugeordnet. Der Text bleibt in den bestehenden Akten erhalten, wird aber bei Neuanlagen nicht mehr zur Auswahl angeboten.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setFacilityToDelete(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteFacility}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      Unwiderruflich löschen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ADMIN-ZUGÄNGE & WHITELIST (Datenschutz nach Art. 32)  */}
        {/* ============================================================ */}
        {activeTab === 'whitelist' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Datenschutz & Zugriffskontrolle (Art. 32 DSGVO)</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Autorisierte E-Mail-Adressen (Admin-Whitelist)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
                    Aus Datenschutzgründen ist eine freie Registrierung für das Fallregister gesperrt. Nur die hier in Firebase hinterlegten E-Mail-Adressen Ihrer Kollegen und Ihres Chefs erhalten nach dem Google-Login Zugriff auf den Admin-Bereich.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                    {authorizedAdmins.length} {authorizedAdmins.length === 1 ? 'Konto' : 'Konten'} freigeschaltet
                  </span>
                </div>
              </div>

              {/* Zero-Trust Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Zero-Trust-Prinzip:</strong> Jeder Anmeldeversuch mit einer nicht in dieser Liste geführten E-Mail-Adresse wird von Firebase sofort abgewiesen und automatisch abgemeldet.
                </div>
              </div>

              {adminActionFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in duration-150">
                  {adminActionFeedback}
                </div>
              )}
            </div>

            {/* Form: Add New Authorized Admin / Colleague / Chef */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Neues Konto (Kollege oder Chef) autorisieren</span>
              </h3>

              <form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilgerhaus E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="name@pilgerhaus.de"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name / Vorname *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="z. B. Uwe Gerbich-Demmer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rolle im Pilgerhaus *
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="chef">Chef / Einrichtungsleitung</option>
                    <option value="kollege">Kollege / Pädagogische Fachkraft</option>
                    <option value="admin">Systemadministrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notiz / Gruppe (optional)
                  </label>
                  <input
                    type="text"
                    value={newAdminNotes}
                    onChange={(e) => setNewAdminNotes(e.target.value)}
                    placeholder="z. B. Gruppe 1 / KIZ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSavingAdmin}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>E-Mail in Firebase autorisieren</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Whitelisted Accounts */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Aktive Freigaben in Firebase
                  </h3>
                  <p className="text-xs text-slate-500">
                    Diese Konten können sich mit ihrer @pilgerhaus.de E-Mail und Kennwort im Admin-Dashboard anmelden
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                    <tr>
                      <th className="py-3 px-4">Name / Person</th>
                      <th className="py-3 px-4">E-Mail-Adresse</th>
                      <th className="py-3 px-4">Rolle</th>
                      <th className="py-3 px-4">Zusatz / Notiz</th>
                      <th className="py-3 px-4 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {authorizedAdmins.map((adm) => {
                      const isMaster = adm.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                      return (
                        <tr key={adm.email} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                                {adm.name.charAt(0).toUpperCase()}
                              </span>
                              <span>{adm.name}</span>
                              {isMaster && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                  Haupt-Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">
                            {adm.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                adm.role === 'chef'
                                  ? 'bg-purple-100 text-purple-800'
                                  : adm.role === 'admin'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {adm.role === 'chef'
                                ? 'Chef / Einrichtungsleitung'
                                : adm.role === 'admin'
                                ? 'Administrator'
                                : 'Pädagogische Fachkraft'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">
                            {adm.notes || '–'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isMaster ? (
                              <span className="text-[11px] text-slate-400 italic">Geschützt</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAdminToDelete(adm)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors cursor-pointer"
                                title="Autorisierung widerrufen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL: DELETE CONFIRMATION                                   */}
      {/* ============================================================ */}
      {caseToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fallakte endgültig löschen?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Möchten Sie die Akte mit der Chiffre <span className="font-mono font-bold text-rose-600">{caseToDelete.stammdaten.chiffre}</span> wirklich unwiderruflich löschen?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/60 text-xs text-rose-800 space-y-1">
              <div className="font-bold">Achtung: Unwiderruflich</div>
              <p>Der Eintrag wird aus der Firebase Firestore Cloud-Datenbank vollständig und unwiderruflich entfernt.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCaseToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Endgültig löschen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REVOKE ADMIN AUTHORIZATION CONFIRMATION               */}
      {/* ============================================================ */}
      {adminToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Autorisierung widerrufen?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Möchten Sie den Zugriff für <span className="font-semibold text-rose-600">{adminToDelete.email}</span> ({adminToDelete.name}) wirklich widerrufen?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="font-bold">Auswirkung</div>
              <p>Die Person kann sich ab sofort nicht mehr im Admin-Bereich anmelden oder gespeicherte Fallakten einsehen.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                disabled={isSavingAdmin}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAdmin}
                disabled={isSavingAdmin}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSavingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Autorisierung entziehen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DETAIL PREVIEW OF A CASE                               */}
      {/* ============================================================ */}
      {previewCase && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-base bg-emerald-700/80 px-2.5 py-0.5 rounded-lg text-emerald-100">
                  {previewCase.stammdaten.chiffre}
                </span>
                <div>
                  <h3 className="text-sm font-bold">Fallübersicht</h3>
                  <div className="text-xs text-slate-400">
                    Erfasst am {previewCase.stammdaten.datum} • {previewCase.stammdaten.geschlecht}{previewCase.stammdaten.alterInJahren ? ` (${previewCase.stammdaten.alterInJahren} Jahre)` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: summary of items */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Stammdaten Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Stammdaten</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Alter des Kindes:</span> <span className="font-semibold">{previewCase.stammdaten.alterInJahren ? `${previewCase.stammdaten.alterInJahren} Jahre` : 'k. A.'}</span></div>
                  <div><span className="text-slate-500">Kostenträger:</span> <span className="font-semibold">{previewCase.stammdaten.kostentraeger || 'k. A.'}</span></div>
                  <div><span className="text-slate-500">Einrichtung:</span> <span className="font-semibold">{previewCase.stammdaten.einrichtung || 'k. A.'}</span></div>
                  <div><span className="text-slate-500">Fachkraft:</span> <span className="font-semibold">{previewCase.stammdaten.fachkraft || 'k. A.'}</span></div>
                </div>
              </div>

              {/* Items summary */}
              {(() => {
                const stats = computeFormStatistics(previewCase);
                return (
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Dokumentierte Befunde & Items ({stats.totalMarkedCount})
                    </div>
                    {stats.chapterStats.length === 0 ? (
                      <div className="text-xs text-slate-400 py-3 text-center">Bisher keine spezifischen Items dokumentiert.</div>
                    ) : (
                      stats.chapterStats.map((cs) => (
                        <div key={cs.chapterId} className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                          <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                            <span>{cs.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                              {cs.count} Items
                            </span>
                          </div>
                          <ul className="divide-y divide-slate-100 text-xs">
                            {cs.items.map((it, idx) => (
                              <li key={idx} className="py-1.5 flex flex-col gap-0.5">
                                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                    {it.code}
                                  </span>
                                  <span>{it.label}</span>
                                </div>
                                {it.dauer && <div className="text-[11px] text-slate-500">Dauer: {it.dauer}</div>}
                                {it.beschreibung && <div className="text-[11px] text-slate-600 bg-slate-50 p-1 rounded mt-0.5">Notiz: {it.beschreibung}</div>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onPrintCase(previewCase);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Drucken</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCase(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Schließen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = previewCase.id;
                    setPreviewCase(null);
                    onOpenCase(id);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  In Fragebogen bearbeiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Legal, Privacy & Impressum Modal */}
      <LegalNoticeModal
        isOpen={!!legalModalTab}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'datenschutz'}
      />
    </div>
  );
};

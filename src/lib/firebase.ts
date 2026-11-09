import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { KizFormData, AuthorizedAdmin } from '../types/anamnese';
import { EINRICHTUNG_OPTIONS } from '../data/kizFormStructure';

// 1. Initialize Firebase App and Services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// 2. Validate Connection to Firestore on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// 3. Mandatory Firestore Error Handler conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Authentication helpers
// 4. Authentication & Whitelist helpers
export const ADMIN_DISPLAY_NAME = 'Pilgerhaus Weinheim';
export const ADMIN_EMAIL = 'stefanbareis@gmail.com';

// In-memory cache of authorized email addresses
let cachedAuthorizedEmails = new Set<string>([ADMIN_EMAIL.toLowerCase()]);

export function updateCachedAuthorizedEmails(emails: string[]) {
  cachedAuthorizedEmails = new Set([
    ADMIN_EMAIL.toLowerCase(),
    ...emails.map((e) => e.trim().toLowerCase())
  ]);
}

/**
 * Checks if an email is authorized in the whitelist
 */
export async function isEmailAuthorizedAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const cleaned = email.trim().toLowerCase();
  if (cleaned === ADMIN_EMAIL.toLowerCase()) return true;
  if (cachedAuthorizedEmails.has(cleaned)) return true;

  try {
    const snap = await getDocFromServer(doc(db, 'authorized_admins', cleaned));
    if (snap.exists()) {
      cachedAuthorizedEmails.add(cleaned);
      return true;
    }
  } catch (err) {
    console.warn('Could not check whitelist in Firestore:', err);
  }
  return false;
}

export function isUserAdmin(user: User | null, authorizedList?: AuthorizedAdmin[]): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase();
  if (email === ADMIN_EMAIL.toLowerCase()) return true;
  if (authorizedList && authorizedList.some((a) => a.email.toLowerCase() === email)) return true;
  return cachedAuthorizedEmails.has(email);
}

/**
 * Real-time subscription to the whitelist of authorized colleagues & leadership
 */
export function subscribeToAuthorizedAdmins(
  onAdminsUpdated: (admins: AuthorizedAdmin[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'authorized_admins';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: AuthorizedAdmin[] = [];
      let masterPresent = false;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AuthorizedAdmin;
        list.push(data);
        if (data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          masterPresent = true;
        }
      });

      // Always ensure master admin is represented in the list
      if (!masterPresent) {
        list.unshift({
          email: ADMIN_EMAIL.toLowerCase(),
          name: 'Stefan Bareis (Systemadministrator)',
          role: 'admin',
          addedAt: '2026-01-01T00:00:00.000Z',
          addedBy: 'System',
          notes: 'Haupt-Administrator (Pilgerhaus)'
        });
      }

      // Keep cache synced
      updateCachedAuthorizedEmails(list.map((a) => a.email));
      onAdminsUpdated(list);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Error subscribing to authorized_admins:', err);
    }
  );
}

/**
 * Add or update an authorized colleague or chef email in Firestore
 */
export async function addAuthorizedAdminToFirestore(
  admin: {
    email: string;
    name: string;
    role: 'chef' | 'kollege' | 'admin';
    notes?: string;
  },
  addedBy?: string
): Promise<void> {
  const cleanEmail = admin.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Ungültige E-Mail-Adresse.');
  }
  const path = `authorized_admins/${cleanEmail}`;
  try {
    const payload: AuthorizedAdmin = {
      email: cleanEmail,
      name: admin.name.trim() || cleanEmail,
      role: admin.role,
      addedAt: new Date().toISOString(),
      addedBy: addedBy || auth.currentUser?.email || ADMIN_EMAIL,
      notes: admin.notes?.trim() || '',
    };
    await setDoc(doc(db, 'authorized_admins', cleanEmail), sanitizeForFirestore(payload), { merge: true });
    cachedAuthorizedEmails.add(cleanEmail);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Remove an authorized colleague from Firestore (master admin is protected)
 */
export async function removeAuthorizedAdminFromFirestore(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Der Haupt-Administrator kann nicht entfernt werden.');
  }
  const path = `authorized_admins/${cleanEmail}`;
  try {
    await deleteDoc(doc(db, 'authorized_admins', cleanEmail));
    cachedAuthorizedEmails.delete(cleanEmail);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let activeLoginPromise: Promise<User | null> | null = null;

export async function loginWithGoogle(): Promise<User | null> {
  if (activeLoginPromise) {
    return activeLoginPromise;
  }

  activeLoginPromise = (async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = cred.user.email?.toLowerCase();

      // Strict Whitelist Check: Block arbitrary registrations for privacy protection
      const isAuthorized = await isEmailAuthorizedAdmin(email);
      if (!isAuthorized) {
        await signOut(auth);
        const err = new Error(
          `ZUGRIFF_VERWEIGERT: Die E-Mail-Adresse "${cred.user.email}" ist nicht in der Firebase-Whitelist für den internen Admin-Bereich freigeschaltet. Eine Selbstregistrierung ist aus Datenschutzgründen gesperrt.`
        );
        (err as any).code = 'auth/unauthorized-whitelist-email';
        throw err;
      }

      return cred.user;
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (
        firebaseError?.code === 'auth/cancelled-popup-request' ||
        firebaseError?.code === 'auth/popup-closed-by-user'
      ) {
        console.info('Google Sign-In popup closed or cancelled by user.');
        return null;
      }
      if (firebaseError?.code === 'auth/popup-blocked') {
        console.warn('Google Sign-In popup blocked by browser.');
        throw err;
      }
      if (firebaseError?.code === 'auth/unauthorized-whitelist-email') {
        throw err;
      }
      console.error('Google Sign-In failed:', err);
      throw err;
    } finally {
      activeLoginPromise = null;
    }
  })();

  return activeLoginPromise;
}

/**
 * Log in using corporate/email and password (e.g. name@pilgerhaus.de)
 * Checks the whitelist before & after authentication.
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse (z. B. name@pilgerhaus.de) angeben.');
  }
  if (!password) {
    throw new Error('Bitte Ihr Passwort eingeben.');
  }

  // Pre-check whitelist
  const isAuthorized = await isEmailAuthorizedAdmin(cleanEmail);
  if (!isAuthorized) {
    const err = new Error(
      `ZUGRIFF_VERWEIGERT: Die E-Mail-Adresse "${email}" ist nicht in der Mitarbeiter-Whitelist des Pilgerhauses freigeschaltet. Eine Selbstregistrierung ist aus Datenschutzgründen gesperrt. Bitte wenden Sie sich an die Einrichtungsleitung.`
    );
    (err as any).code = 'auth/unauthorized-whitelist-email';
    throw err;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const postCheckAuthorized = await isEmailAuthorizedAdmin(cred.user.email);
    if (!postCheckAuthorized) {
      await signOut(auth);
      const err = new Error(
        `ZUGRIFF_VERWEIGERT: Die E-Mail-Adresse "${cred.user.email}" ist nicht in der Mitarbeiter-Whitelist des Pilgerhauses freigeschaltet. Eine Selbstregistrierung ist aus Datenschutzgründen gesperrt.`
      );
      (err as any).code = 'auth/unauthorized-whitelist-email';
      throw err;
    }
    return cred.user;
  } catch (err: any) {
    console.error('Email login failed:', err);
    if (
      err?.code === 'auth/invalid-credential' || 
      err?.code === 'auth/wrong-password' || 
      err?.code === 'auth/user-not-found'
    ) {
      const friendlyErr = new Error('E-Mail-Adresse oder Passwort ist nicht korrekt. Falls Sie Ihr Kennwort noch nicht eingerichtet haben, nutzen Sie bitte "Erstmaliges Passwort festlegen".');
      (friendlyErr as any).code = err?.code;
      throw friendlyErr;
    }
    if (err?.code === 'auth/operation-not-allowed') {
      const friendlyErr = new Error('Die E-Mail/Passwort-Anmeldung muss einmalig in der Firebase Console aktiviert werden (Authentication -> Sign-in-Methode -> E-Mail/Passwort aktivieren).');
      (friendlyErr as any).code = err?.code;
      throw friendlyErr;
    }
    throw err;
  }
}

/**
 * First-time activation: sets initial password for a colleague or chef pre-authorized in the whitelist.
 */
export async function registerAuthorizedUserWithEmail(
  email: string, 
  password: string, 
  displayName?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse angeben.');
  }
  if (!password || password.length < 6) {
    throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein.');
  }

  // Strict whitelist check
  const isAuthorized = await isEmailAuthorizedAdmin(cleanEmail);
  if (!isAuthorized) {
    const err = new Error(
      `ZUGRIFF_VERWEIGERT: Die E-Mail-Adresse "${email}" ist nicht in der Mitarbeiter-Whitelist des Pilgerhauses hinterlegt. Nur vorab autorisierte Kollegen oder der Chef können ein Konto aktivieren.`
    );
    (err as any).code = 'auth/unauthorized-whitelist-email';
    throw err;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    const postCheckAuthorized = await isEmailAuthorizedAdmin(cred.user.email);
    if (!postCheckAuthorized) {
      await signOut(auth);
      const err = new Error(
        `ZUGRIFF_VERWEIGERT: Die E-Mail-Adresse "${cred.user.email}" ist nicht in der Mitarbeiter-Whitelist hinterlegt.`
      );
      (err as any).code = 'auth/unauthorized-whitelist-email';
      throw err;
    }
    return cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      const friendlyErr = new Error('Für diese E-Mail-Adresse existiert bereits ein Login. Bitte melden Sie sich an oder nutzen Sie "Passwort vergessen".');
      (friendlyErr as any).code = err?.code;
      throw friendlyErr;
    }
    if (err?.code === 'auth/operation-not-allowed') {
      const friendlyErr = new Error('Die E-Mail/Passwort-Anmeldung muss einmalig in der Firebase Console aktiviert werden (Authentication -> Sign-in-Methode -> E-Mail/Passwort aktivieren).');
      (friendlyErr as any).code = err?.code;
      throw friendlyErr;
    }
    throw err;
  }
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse angeben.');
  }

  const isAuthorized = await isEmailAuthorizedAdmin(cleanEmail);
  if (!isAuthorized) {
    throw new Error(`Die E-Mail-Adresse "${email}" ist nicht im System freigeschaltet.`);
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (err: any) {
    if (err?.code === 'auth/operation-not-allowed') {
      throw new Error('E-Mail/Passwort ist in Firebase noch nicht aktiviert.');
    }
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Logout failed:', err);
    throw err;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sanitizes any existing case entries: replaces any occurrence of 'stefanbareis@gmail.com'
 * or 'stefanbareis' with 'Pilgerhaus Weinheim' across all strings and nested objects.
 */
export function sanitizeCaseForOrganization(caseData: KizFormData): { caseData: KizFormData; changed: boolean } {
  let changed = false;
  let jsonStr = JSON.stringify(caseData);
  if (/stefanbareis(@gmail\.com)?/i.test(jsonStr)) {
    jsonStr = jsonStr
      .replace(/stefanbareis@gmail\.com/gi, 'Pilgerhaus Weinheim')
      .replace(/stefanbareis/gi, 'Pilgerhaus Weinheim');
    changed = true;
  }
  const parsed = JSON.parse(jsonStr) as KizFormData;
  if (!parsed.stammdaten) {
    parsed.stammdaten = {} as any;
  }
  if (!parsed.stammdaten.einrichtung || parsed.stammdaten.einrichtung.trim() === '') {
    parsed.stammdaten.einrichtung = 'Pilgerhaus Weinheim';
    changed = true;
  }
  return { caseData: parsed, changed };
}

/**
 * Recursively cleans an object/array by stripping keys with undefined values,
 * since Firestore strictly rejects any field whose value is undefined.
 */
export function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as unknown as T;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (val instanceof Date) {
    return val.toISOString() as unknown as T;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      cleaned[k] = sanitizeForFirestore(v);
    }
  }
  return cleaned as unknown as T;
}

// 5. Case operations in Firestore
export async function saveCaseToFirestore(caseData: KizFormData, userId?: string): Promise<void> {
  const path = `cases/${caseData.id}`;
  try {
    const { caseData: sanitizedCase } = sanitizeCaseForOrganization(caseData);
    const sanitizedChiffre = (sanitizedCase.stammdaten?.chiffre || 'UNBEKANNT').slice(0, 16);
    const rawDocData = {
      ...sanitizedCase,
      id: sanitizedCase.id,
      ownerId: sanitizedCase.ownerId || userId || 'guest',
      chiffre: sanitizedChiffre,
      updatedAt: sanitizedCase.updatedAt || new Date().toISOString(),
      createdAt: sanitizedCase.createdAt || new Date().toISOString(),
      lastChapterId: typeof sanitizedCase.lastChapterId === 'number' ? sanitizedCase.lastChapterId : 0,
      iqSelectedCode: sanitizedCase.iqSelectedCode || '',
      iqNotiz: sanitizedCase.iqNotiz || '',
    };
    const cleanedData = sanitizeForFirestore(rawDocData);
    await setDoc(doc(db, 'cases', sanitizedCase.id), cleanedData, { merge: true });

    // Also update chiffre lookup index so any educator can resume the case by 8-character Chiffre from any device without local storage
    if (sanitizedChiffre && sanitizedChiffre !== 'UNBEKANNT') {
      try {
        await setDoc(doc(db, 'chiffres', sanitizedChiffre), {
          chiffre: sanitizedChiffre,
          caseId: sanitizedCase.id,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn('Chiffre index sync error:', e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getCaseFromFirestore(caseId: string): Promise<KizFormData | null> {
  const path = `cases/${caseId}`;
  try {
    const docSnap = await getDocFromServer(doc(db, 'cases', caseId));
    if (docSnap.exists()) {
      return docSnap.data() as KizFormData;
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch case from Firestore:', error);
    return null;
  }
}

export async function getCaseByChiffreFromFirestore(chiffre: string): Promise<KizFormData | null> {
  const cleaned = chiffre.trim().toUpperCase();
  if (!cleaned) return null;
  try {
    const lookupSnap = await getDocFromServer(doc(db, 'chiffres', cleaned));
    if (lookupSnap.exists()) {
      const data = lookupSnap.data();
      if (data?.caseId) {
        return getCaseFromFirestore(data.caseId);
      }
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch case by chiffre:', error);
    return null;
  }
}

export async function deleteCaseFromFirestore(caseId: string, chiffre?: string): Promise<void> {
  const path = `cases/${caseId}`;
  try {
    await deleteDoc(doc(db, 'cases', caseId));
    if (chiffre && chiffre.trim()) {
      try {
        await deleteDoc(doc(db, 'chiffres', chiffre.trim().toUpperCase()));
      } catch (err) {
        console.warn('Could not delete chiffre lookup:', err);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserCases(
  user: User,
  onCasesUpdated: (cases: KizFormData[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'cases';
  const isAdmin = isUserAdmin(user);
  
  // Admin can list all cases, regular user lists only their own cases as enforced by firestore.rules
  const q = isAdmin 
    ? query(collection(db, path))
    : query(collection(db, path), where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const result: KizFormData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as KizFormData;
        result.push(data);
      });
      // Sort newest updated first
      result.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      onCasesUpdated(result);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// 6. Configurable Facilities & Residential Groups (Bereiche & Wohngruppen)
export function subscribeToFacilities(
  onUpdated: (facilities: string[]) => void,
  onError?: (err: unknown) => void
) {
  const path = 'settings/facilities';
  return onSnapshot(
    doc(db, 'settings', 'facilities'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.items)) {
          // Respect user-saved list even when empty
          onUpdated(data.items as string[]);
          return;
        }
      }
      // If not yet set up in Firestore, fallback to default Pilgerhaus groups
      onUpdated(EINRICHTUNG_OPTIONS);
    },
    (err) => {
      if (onError) onError(err);
      console.warn('Error subscribing to settings/facilities, using fallback:', err);
      onUpdated(EINRICHTUNG_OPTIONS);
    }
  );
}

export async function saveFacilitiesToFirestore(facilities: string[], adminEmail?: string): Promise<void> {
  const path = 'settings/facilities';
  try {
    const cleaned = facilities.map((f) => f.trim()).filter((f) => f.length > 0);
    // remove duplicates while preserving order
    const unique = Array.from(new Set(cleaned));
    await setDoc(doc(db, 'settings', 'facilities'), {
      items: unique,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'Admin',
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}


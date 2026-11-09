# Security Specification: KIZ Anamnese Firestore Rules

## 1. Data Invariants
1. **Identity & Ownership**: A case document (`/cases/{caseId}`) must have `ownerId == request.auth.uid` upon creation.
2. **Immutability of Ownership & Creation**: During any update, `ownerId` and `createdAt` must remain unchanged (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`).
3. **Path Hardening**: Document ID `caseId` must be a valid alphanumeric/hyphen/underscore identifier not exceeding 64 characters.
4. **Anonymization & PII Safety**: Cases must contain only pseudonymized records (chiffre). No unauthorized users may read or write cases.
5. **No Blanket Reads**: Listing cases requires the client query to filter by `resource.data.ownerId == request.auth.uid` unless the caller is verified administrator (`stefanbareis@gmail.com`).
6. **Strict Role Access**: Non-authenticated requests are universally denied. Admin override is enabled for `stefanbareis@gmail.com` with `email_verified == true`.

## 2. The "Dirty Dozen" Payloads
The following 12 attack payloads must be rejected by Firestore Security Rules:

1. **Unauthenticated Read**: Attempting to read `/cases/case_123` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unauthenticated Create**: Attempting to create a case without logging in -> `PERMISSION_DENIED`.
3. **Spoofed Owner ID on Create**: User A (`auth.uid == "userA"`) attempts to create a case with `ownerId: "userB"` -> `PERMISSION_DENIED`.
4. **ID Poisoning / Path Mismatch**: Writing to `/cases/case_123` with a payload where `id` is `"case_999"` or contains junk characters -> `PERMISSION_DENIED`.
5. **Owner Hijack on Update**: User A attempts to modify `ownerId` of an existing case to `"userA"` or another user -> `PERMISSION_DENIED`.
6. **Cross-Tenant Unauthorized Read**: User B attempts to read `/cases/{caseId}` owned by User A -> `PERMISSION_DENIED`.
7. **Blanket Query Scraping**: User B executes `collection('cases').getDocs()` without `where('ownerId', '==', 'userB')` -> `PERMISSION_DENIED`.
8. **Unverified Admin Email Spoofing**: Caller presents email `stefanbareis@gmail.com` but with `email_verified == false` -> `PERMISSION_DENIED`.
9. **Tampering with Immutable Creation Timestamp**: User attempts an update that changes `createdAt` -> `PERMISSION_DENIED`.
10. **Oversized String / Resource Exhaustion**: Payload containing `chiffre` or `id` exceeding defined maxLength constraints -> `PERMISSION_DENIED`.
11. **Missing Required Fields**: Attempting to create a case missing mandatory master data (`stammdaten`) -> `PERMISSION_DENIED`.
12. **Unauthorized Document Deletion**: User B attempts to delete `/cases/{caseId}` owned by User A -> `PERMISSION_DENIED`.

# מערכת ניהול מעשרות ותרומות למשק בית

אפליקציית PWA בעברית (RTL) לניהול הכנסות, חישוב מעשר (10%), תרומות קבועות וחד-פעמיות, חוב מעשר, זיכוי מעשר (אופציונלי), דוחות חודשיים וייצוא.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui (Radix), React Router, TanStack Query & Table, React Hook Form + Zod, Recharts
- **Backend:** Firebase Auth (Google only), Firestore, Storage
- **Hosting:** Cloudflare Pages
- **PWA:** vite-plugin-pwa + Workbox

## התחלה מהירה

```bash
cd household-tithing
npm install
cp .env.example .env
# מלאו את משתני Firebase ב-.env
npm run dev
```

## משתני סביבה

| משתנה | תיאור |
|--------|--------|
| `VITE_FIREBASE_API_KEY` | מפתח API |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | מזהה פרויקט |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

## Firebase Setup

1. צרו פרויקט Firebase והפעילו **Google Sign-In** בלבד (ללא email/password).
2. צרו Firestore ו-Storage.
3. פרסמו כללים:

```bash
firebase deploy --only firestore:rules,storage
firebase deploy --only firestore:indexes
```

4. בקונסולת Firebase הוסיפו את דומיין Cloudflare Pages ל-Authorized domains.

### סכמת אוספים (Firestore)

| אוסף | שדות עיקריים |
|------|----------------|
| `households` | id, name, createdAt, createdBy |
| `householdMembers` | householdId, userId, role (owner \| member), email, displayName |
| `householdSettings` | householdId |
| `householdInvites` | householdId, code, expiresAt |
| `monthlyReports` | householdId, year, month, memberIncomes, donations, applyCreditFromPrevious, computed totals (agorot) |
| `fixedDonations` | householdId, name, amount, start/end month |
| `auditLogs` | householdId, userId, actionType, entityType, before/after state |
| `userProfiles` | uid, activeHouseholdId |

**כל הסכומים נשמרים כ-agorot (מספרים שלמים).**

## לוגיקה פיננסית

```
סה"כ הכנסות = משכורת בעל + משכורת אישה + הכנסות נוספות
חובת מעשר = 10% מסה"כ הכנסות (עיגול למספר שלם)
חובת מעשר מותאמת = חובת מעשר + חוב מעשר מחודשים קודמים - זיכוי מחודש קודם (רק אם המשתמש בוחר להחיל)
יתרה לתשלום = חובת מעשר מותאמת - תרומות קבועות - תרומות חד-פעמיות
```

חוב מעשר תמיד מועבר אוטומטית. זיכוי מעשר נשמר לפי חודש ומוחל רק בבחירה מפורשת בדוח החודשי.

## פריסה ל-Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist
```

או חברו את ה-repo ל-Cloudflare Pages:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- הגדירו משתני סביבה בלוח הבקרה

קובץ `public/_headers` מגדיר caching: assets עם `max-age=31536000`, `index.html` עם `no-cache`.

## מבנה תיקיות

```
src/
  components/   # UI + layout
  features/     # report editor, calculations
  pages/        # route pages
  services/     # Firebase + demo store
  hooks/        # React Query wrappers
  lib/          # firebase, hebrew labels, constants
  types/        # TypeScript interfaces
  schemas/      # Zod validation
  utils/        # finance, currency, export, dates
  seed/         # demo seed data
```

## פקודות

| פקודה | תיאור |
|--------|--------|
| `npm run dev` | שרת פיתוח |
| `npm run build` | בניית production |
| `npm run preview` | תצוגה מקומית של build |
| `npm test` | בדיקות יחידה (Vitest) |

## רישיון

פרטי / שימוש משפחתי.

# Long Ledger

PWA personal 5-in-1 (Finance, Investment, Subscription, Watchlist, Contacts)
untuk pencatatan pribadi sehari-hari, dipakai berdua (shared account).

**Versi saat ini:** 0.2.0
**Status:** Development

---

## 1. Tentang Long Ledger

Long Ledger menggabungkan lima kebutuhan pencatatan pribadi yang biasanya
tersebar di banyak app terpisah — keuangan harian, portofolio investasi,
langganan berulang, daftar tontonan/bacaan, dan kontak penting — jadi satu
tempat. Prinsipnya: **satu tempat, tercatat lengkap**, bukan lima app kecil
yang harus dibuka bergantian.

Penggunanya adalah sepasang suami-istri yang berbagi satu akun login (bukan
multi-akun dengan role terpisah). Setiap data menampilkan micro-indicator
"terakhir diubah oleh" supaya app ini terasa seperti ruang berdua, bukan
tool generik single-user.

## 2. Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 |
| Backend/DB | Firebase (Firestore, Auth, Storage) |
| Hosting | Vercel |
| Font | Fraunces (display/serif) + Geist (body/sans) via `next/font/google` |

## 3. Design System

Arah visual: **dark ink navy premium**, bukan hitam pekat — layering depth
dengan dua aksen redup (emerald untuk positif/fokus, amber untuk urgent).
Semua token warna, type scale (12/14/16/20/28/40px), radius, dan spacing
didefinisikan sebagai CSS variable di `app/globals.css` — jangan hardcode
hex/px baru di komponen, selalu pakai token yang sudah ada di sana.

Signature element WAJIB di setiap card data: `LastEditedBy` (avatar inisial
kecil berwarna, lihat `components/shared/LastEditedBy.tsx`). Item urgent
(renewal ≤7 hari, reminder overdue, investasi mendekati target) diberi
`.halo-amber` — border tipis amber, bukan badge merah.

## 4. Arsitektur — Single Source of Truth (SSOT)

Setiap modul data mengikuti pola 3 lapis yang sama, supaya dashboard dan
halaman modul tidak pernah menghitung ulang logic yang berbeda:

1. **`lib/types/<modul>.ts`** — definisi TypeScript interface, satu-satunya
   sumber bentuk data.
2. **`lib/repositories/<modul>Repo.ts`** — satu-satunya lapisan yang bicara
   ke Firestore untuk modul itu (CRUD + `onSnapshot` real-time listener).
   Komponen React TIDAK PERNAH import `firebase/firestore` langsung.
3. **`lib/selectors/<modul>Selectors.ts`** — satu-satunya tempat logic
   agregasi/turunan (total, breakdown, filter, near-target, dll). Dashboard
   card dan halaman modul memanggil fungsi yang SAMA dari sini.
4. **`lib/hooks/use<Modul>.ts`** — consume repository lewat `onSnapshot`,
   expose `{ data, loading, error }` ke komponen.

**Pola tambah fitur baru:** kalau perlu turunan data baru, tambahkan fungsi
baru di selector modul terkait — jangan hitung inline di komponen. Kalau
perlu field baru di skema, update `lib/types/<modul>.ts` dan section 5 di
README ini di turn yang sama.

Firestore data converters (`lib/firebase/converters.ts`) menstrip/menyisipkan
`id` secara otomatis — dipakai lewat `.withConverter()` di setiap repository.

## 5. Skema Data Firestore

```
users/{userId}/
  ├── transactions/{transactionId}
  │     type: "income" | "expense"
  │     amount: number
  │     category: string          // free text, autocomplete dari meta
  │     note: string
  │     date: Timestamp
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │
  ├── investments/{investmentId}
  │     type: "deposito" | "saham_id" | "saham_global" | "emas" | "crypto"
  │           | "reksadana" | "obligasi" | "sun" | "properti"
  │     name: string
  │     status: "active" | "sold" | "matured"
  │     purchaseDate: Timestamp
  │     purchasePrice, purchaseQty, purchaseTotal: number
  │     currentPrice: number | null
  │     currentPriceUpdatedAt: Timestamp | null
  │     targetSellPrice, targetBuybackPrice: number | null
  │     note: string
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │     // hanya SATU dari field berikut terisi, sesuai `type`:
  │     depositoDetail?: { bank, interestRate, maturityDate, tenor, autoRollover }
  │     sahamDetail?: { exchange, ticker, lot, broker }
  │     emasDetail?: { form, purity, weightGram, storageLocation }
  │     cryptoDetail?: { network, wallet, walletType }
  │     reksadanaDetail?: { manager, fundType, nav }
  │     obligasiDetail?: { issuer, couponRate, maturityDate, paymentFrequency }
  │     sunDetail?: { series, couponRate, maturityDate, isSyariah }
  │     propertiDetail?: { location, landAreaM2, buildingAreaM2,
  │                        certificateType, certificateStatus, monthlyIncome }
  │
  ├── subscriptions/{subscriptionId}
  │     name: string
  │     amount: number
  │     billingCycle: "monthly" | "yearly" | "weekly"
  │     nextRenewalDate: Timestamp
  │     category: string          // free text, autocomplete dari meta
  │     status: "active" | "paused" | "cancelled"
  │     reminderDaysBefore: number
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │
  ├── watchlistItems/{itemId}
  │     title: string
  │     type: "book" | "movie" | "series" | "article"
  │     status: "planned" | "in_progress" | "completed"
  │     rating: number | null      // 1-5, diisi saat status completed
  │     note: string
  │     startedAt: Timestamp | null    // auto-set saat status → in_progress
  │     completedAt: Timestamp | null  // auto-set saat status → completed
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │
  ├── contacts/{contactId}
  │     name: string
  │     phones: Array<{ label: string, number: string }>
  │     relationship: string        // free text, deskriptif single-value
  │     tags: string[]              // multi-select, custom
  │     note: string
  │     lastContacted: Timestamp | null   // update MANUAL via tombol aksi cepat
  │     reminderDate: Timestamp | null
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │
  └── meta/app
        categories: { finance: string[], subscription: string[] }
        tags: string[]              // daftar tag kontak yang pernah dipakai
```

**Catatan skema:**
- `category`/`tags` di semua modul bersifat free text/custom, bukan enum
  kaku — `users/{userId}/meta/app` cuma menyimpan daftar untuk autocomplete.
- `relationship` (deskriptif, single value) vs `tags` (grouping, multi-value)
  di Contact sengaja dipisah, jangan digabung.
- Semua timestamp pakai Firestore `Timestamp`, bukan string.
- `lastContacted` di-update manual lewat tombol "Tandai baru saja
  dihubungi" di `/contacts/[id]`, bukan auto-detect.
- Menulis field nested (`categories.finance`, `categories.subscription`)
  WAJIB pakai dot-notation path di `setDoc(..., {merge:true})`
  (`"categories.finance": arrayUnion(...)`), bukan nested object literal —
  literal akan replace seluruh objek `categories` dan menghapus field
  saudaranya. Lihat komentar di `lib/repositories/metaRepo.ts`.

## 6. Struktur Folder

```
app/
├── layout.tsx              # Font, AuthProvider, AuthGuard, AppShell
├── page.tsx                 # Dashboard home
├── login/page.tsx
├── settings/page.tsx
├── finance/{page.tsx, new/page.tsx, [id]/page.tsx}
├── investments/{page.tsx, new/page.tsx, [id]/page.tsx}
├── subscriptions/{page.tsx, new/page.tsx, [id]/page.tsx}
├── watchlist/{page.tsx, new/page.tsx, [id]/page.tsx}
└── contacts/{page.tsx, new/page.tsx, [id]/page.tsx}

components/
├── layout/        # Sidebar, TopBar, AppShell, SidebarNavItem
├── dashboard/      # SummaryCard (base) + 5 card turunan per modul
├── shared/         # LastEditedBy, EmptyState, CurrencyInput, TagInput,
│                    # ConfirmDialog, Sparkline, RatingStars,
│                    # PhoneListInput, DynamicDetailFields,
│                    # <Modul>ListItem × 5, AuthGuard
└── ui/             # Card, Badge, icons.tsx (icon set inline SVG)

lib/
├── firebase/       # config.ts (init tunggal), converters.ts
├── types/          # 1 file per modul + shared.ts (AppMeta)
├── repositories/   # 1 file per modul + metaRepo.ts
├── selectors/       # 1 file per modul
├── hooks/          # useAuth, use<Modul> × 5, useAppMeta
├── format.ts        # formatIDR, formatDateID, formatDateShortID
└── investmentFieldConfig.ts   # config field conditional per jenis instrumen
                                # (di luar 4 lapis SSOT resmi — lihat catatan
                                # di bawah)

firestore.rules
firestore.indexes.json
public/manifest.json
public/icons/       # 6 file: 192, 512, maskable 192/512, apple-touch, favicon
```

**Penyimpangan dari brief:** `lib/investmentFieldConfig.ts` bukan salah satu
dari 4 lapis SSOT resmi (types/repo/selectors/hooks) — ini config UI murni
(daftar field + tipe input per 9 jenis instrumen investasi), dipakai bareng
oleh form `/investments/new`, halaman edit `/investments/[id]`, dan komponen
`DynamicDetailFields`. Ditaruh terpisah supaya field detail per instrumen
cukup didaftarkan sekali, tidak duplikasi antara form dan tampilan detail.

## 7. Versioning

Mengikuti Semantic Versioning (`MAJOR.MINOR.PATCH`).

| Bagian | Kapan naik |
|---|---|
| **MAJOR (x)** | Perubahan breaking: restrukturisasi skema Firestore yang tidak backward-compatible, ubah total design system/token, ubah model akses data. |
| **MINOR (y)** | Fitur baru yang backward-compatible: modul baru, field baru non-breaking. |
| **PATCH (z)** | Bug fix, polish kecil, tanpa perubahan skema/fitur. |

Versi awal development dimulai dari `0.1.0`. Naik ke `1.0.0` saat kelima
modul inti + Dashboard sudah lengkap sesuai Definition of Done.

## 8. Status & Progress

**Update terakhir:** 2026-08-22

### Selesai
- [x] Setup fondasi (Firebase config, design tokens, font)
- [x] Auth (login page + AuthGuard di root layout)
- [x] Layout shell (Sidebar hamburger + auto-collapse, TopBar, AppShell)
- [x] Modul Finance (types, repo, selectors, hooks, list/new/detail, dashboard card)
- [x] Modul Investment (9 jenis instrumen, form step-based conditional, dashboard card)
- [x] Modul Subscription (normalisasi spend bulanan, halo amber ≤7 hari, dashboard card)
- [x] Modul Watchlist (auto-timestamp startedAt/completedAt, rating bintang, dashboard card)
- [x] Modul Contacts (search prominent, phones array, tombol "tandai dihubungi", dashboard card)
- [x] Dashboard Home (5 card lengkap, greeting dinamis, grid 1/2 kolom responsive)
- [x] Settings (kelola kategori/tag autocomplete + hapus dari daftar saran)
- [x] Polish pass (loading skeleton di semua list/detail page, empty state dengan CTA,
      grid form disesuaikan breakpoint mobile, `prefers-reduced-motion` di globals.css)
- [x] PWA manifest + 6 file icon (192/512/maskable 192/maskable 512/apple-touch/favicon)
- [x] `firestore.rules` + `firestore.indexes.json`

### Sedang dikerjakan
Tidak ada — kesepuluh langkah Bagian 8 brief sudah selesai satu putaran.

### Next steps
- Setup project Firebase baru di Firebase Console (belum dibuat — lihat
  section 10 & 11 di bawah), isi `.env.local` dari kredensial asli.
- Deploy `firestore.rules` dan `firestore.indexes.json` via Firebase CLI.
- Buat repo GitHub baru terpisah, push project ini.
- Uji end-to-end dengan akun Firebase Auth asli (login flow saat ini baru
  tervalidasi lewat build/lint, belum dites dengan Firebase project hidup).
- Setelah lolos smoke test manual, naikkan versi ke `1.0.0`.

### Catatan penting / penyimpangan dari brief awal
- **Sidebar 6 item, bukan 5.** Bagian 3.4 brief menyebutkan "5 item +
  Settings", tapi struktur folder resmi di Bagian 5 mencantumkan
  `investments/` sebagai modul kelima terpisah dari Finance — sidebar
  final berisi Dashboard, Finance, Investasi, Langganan, Watchlist, Kontak
  (6 item) + Settings terpisah di bawah. Diikuti struktur folder karena itu
  spesifikasi paling detail/eksplisit.
- **Bug nested-merge di `metaRepo.ts` ditemukan & diperbaiki saat membangun
  Settings page**: menulis `categories.finance`/`categories.subscription`
  sebagai nested object literal dalam `setDoc(merge:true)` akan meng-replace
  seluruh objek `categories`, menghapus field saudaranya. Diperbaiki pakai
  dot-notation path. Lihat komentar di file terkait.
- **`lib/investmentFieldConfig.ts`** ditaruh di luar 4 lapis SSOT resmi —
  lihat penjelasan di section 6 di atas.
- Font Google (Fraunces, Geist) tidak bisa divalidasi via `next build` di
  sandbox development (tidak ada akses ke `fonts.googleapis.com`) — kode
  sudah benar dan akan resolve normal saat build di Vercel yang punya akses
  internet penuh. Divalidasi dengan font di-stub sementara untuk cek error
  struktural/TypeScript, lalu dikembalikan ke font asli setiap kali.

## 9. Changelog

### [0.2.0] - 2026-08-22
#### Changed
- Login diganti dari email/password menjadi **Google Sign-In**
  (`signInWithPopup` + `GoogleAuthProvider`). Halaman `/login` sekarang
  satu tombol "Masuk dengan Google", bukan form.
- Tambah whitelist `NEXT_PUBLIC_ALLOWED_EMAILS` di `useAuth.tsx` — akun
  Google di luar daftar ini otomatis di-sign-out dengan pesan error,
  supaya akun shared tetap terbatas cuma untuk pemilik. Kosongkan env var
  ini untuk mengizinkan semua akun Google (tidak disarankan).
- `resolveEditorName` di semua form kini lebih andal karena Google selalu
  menyediakan `displayName` asli (sebelumnya fallback ke potongan email
  untuk akun email/password tanpa nama).

#### Removed
- Field `email`/`password` dan fungsi `signIn(email, password)` dari
  `useAuth.tsx`.

### [0.1.0] - 2026-08-22
#### Added
- Setup awal project (Next.js App Router + TypeScript + Tailwind v4),
  Firebase config (`lib/firebase/config.ts`) dengan Firestore offline
  persistence, design token system lengkap di `globals.css`.
- Auth: `useAuth` hook + provider, `AuthGuard`, halaman `/login`.
- Layout shell: `Sidebar` (hamburger + auto-collapse desktop, overlay
  mobile), `TopBar`, `AppShell`.
- Modul Finance lengkap: types, `transactionRepo`, `financeSelectors` (6
  fungsi), `useTransactions`, halaman list/new/detail, `FinanceSummaryCard`.
- Modul Investment lengkap: 9 jenis instrumen dengan field conditional
  (`investmentFieldConfig.ts`), `investmentRepo`, `investmentSelectors` (5
  fungsi wajib + 2 helper), form step-based (pilih jenis → field dinamis),
  update `currentPrice` manual dengan `currentPriceUpdatedAt`,
  `InvestmentSummaryCard` dengan halo amber near-target/maturity.
- Modul Subscription lengkap: `subscriptionRepo`, `subscriptionSelectors`
  (normalisasi spend bulanan lintas siklus, urgent renewal ≤7 hari),
  `SubscriptionSummaryCard`.
- Modul Watchlist lengkap: `watchlistRepo`, `watchlistSelectors`,
  auto-timestamp `startedAt`/`completedAt` saat transisi status,
  `RatingStars` component, `WatchlistProgressCard`.
- Modul Contacts lengkap: `contactRepo` (termasuk `markContactedNow`),
  `contactSelectors` (search lintas field, reminder overdue/upcoming),
  search bar prominent di `/contacts`, `PhoneListInput`,
  `ContactReminderCard`.
- Dashboard Home: 5 summary card, greeting dinamis, grid responsive.
- Settings page: kelola kategori/tag autocomplete (`metaRepo` dengan fungsi
  `remove*`), fix bug nested-merge yang ditemukan saat membangun halaman
  ini.
- Polish pass: grid form disesuaikan breakpoint mobile
  (`grid-cols-4`→`grid-cols-2 sm:grid-cols-4` di watchlist,
  `text-lg`→`text-sm sm:text-lg` di summary finance).
- PWA: `manifest.json` + 6 file icon lengkap (dibuat dari 1024px source:
  192, 512, maskable 192/512, apple-touch-icon flat 180×180 tanpa
  transparency, favicon.ico multi-size 16/32/48).
- `firestore.rules` (shared-account access rule) dan
  `firestore.indexes.json` (4 composite index).

## 10. Setup & Development

### Prasyarat
- Node.js 20+ dan npm
- Project Firebase baru (lihat section 11 di bawah untuk setup)

### Environment variables
Salin `.env.local.example` jadi `.env.local`, isi dari Firebase Console
(Project Settings → General → Your apps → SDK setup and configuration).
Isi juga `NEXT_PUBLIC_ALLOWED_EMAILS` dengan email Google kalian berdua,
dipisah koma — tanpa ini, siapa saja dengan akun Google bisa login.

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ALLOWED_EMAILS=
```

**Wajib untuk Google Sign-In:** tambahkan domain tempat app di-deploy
(`localhost` sudah otomatis termasuk; domain Vercel HARUS ditambah manual)
ke Firebase Console → Authentication → Settings → Authorized domains —
tanpa ini popup login Google akan gagal dengan error
`auth/unauthorized-domain`.

### Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Login pakai akun Google — pastikan emailnya
ada di `NEXT_PUBLIC_ALLOWED_EMAILS` (lihat `.env.local.example`), kalau
tidak, login akan otomatis ditolak.

### Build & lint

```bash
npm run build
npx eslint app lib components
```

### Deploy
Project ini didesain untuk Vercel (lihat section 2, Tech Stack). Hubungkan
repo GitHub ke Vercel, set environment variables yang sama seperti
`.env.local` di dashboard Vercel, deploy otomatis dari branch utama.

## 11. Firebase Setup

### Membuat project Firebase baru
1. Buka [Firebase Console](https://console.firebase.google.com), buat
   project baru khusus Long Ledger (terpisah dari project lain).
2. Aktifkan **Authentication** → Sign-in method → **Google**.
3. Aktifkan **Firestore Database** (mode production).
4. Aktifkan **Storage** (untuk kebutuhan upload gambar di masa depan).
5. Tambah Web App di Project Settings, salin config ke `.env.local`.

### Deploy security rules & indexes
Rules (`firestore.rules`) memastikan hanya user yang login yang bisa akses
datanya sendiri — akun shared, jadi tidak perlu rule cross-user:

```javascript
match /users/{userId}/{collection}/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

Composite indexes (`firestore.indexes.json`) dibutuhkan untuk 4 query:
transactions (date + category), investments (type + status), subscriptions
(status + nextRenewalDate), contacts (reminderDate).

Deploy keduanya via Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pilih project Firebase yang baru dibuat
firebase deploy --only firestore:rules,firestore:indexes
```

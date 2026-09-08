# Long Ledger

PWA personal 5-in-1 (Finance, Investment, Subscription, Watchlist, Contacts)
untuk pencatatan pribadi sehari-hari, dipakai berdua (shared account).

**Versi saat ini:** 1.1.0
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
  │     type: "income" | "expense" | "transfer"
  │     amount: number
  │     category: string          // free text, autocomplete dari meta
  │     note: string
  │     date: Timestamp
  │     accountType: "cash" | "bank"
  │     owner: "suami" | "istri"
  │     transferToAccountType: "cash" | "bank" | null   // hanya utk type "transfer"
  │     transferPairId: string | null   // id dokumen pasangan transfer
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │     deletedAt: Timestamp | null   // soft-delete, null = aktif
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
  │     deletedAt: Timestamp | null
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
  │     owner: "suami" | "istri"
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │     deletedAt: Timestamp | null
  │
  ├── watchlistItems/{itemId}
  │     title: string
  │     type: "book" | "movie" | "series" | "article"
  │     status: "planned" | "in_progress" | "completed"
  │     rating: number | null      // 1-5, diisi saat status completed
  │     note: string
  │     startedAt: Timestamp | null    // auto-set saat status → in_progress,
  │                                     // bisa dikoreksi manual di form edit
  │     completedAt: Timestamp | null  // auto-set saat status → completed,
  │                                     // bisa dikoreksi manual di form edit
  │     lastEditedBy: string
  │     createdAt, updatedAt: Timestamp
  │     deletedAt: Timestamp | null
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
  │     deletedAt: Timestamp | null
  │
  ├── activityLog/{logId}
  │     module: "finance" | "investment" | "subscription" | "watchlist" | "contact"
  │     action: "create" | "update" | "delete" | "restore"
  │     targetId: string           // id dokumen yang terpengaruh
  │     targetLabel: string        // label saat kejadian, tetap terbaca
  │                                 // meski dokumen sudah dihapus permanen
  │     actorName: string
  │     createdAt: Timestamp
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
- **Soft-delete (Recycle Bin)**: setiap dokumen di 5 collection utama punya
  `deletedAt`. Hapus dari UI TIDAK PERNAH memanggil `deleteDoc()` langsung
  — selalu `softDeleteX()` yang cuma set `deletedAt`. Hapus permanen
  (`deleteDoc()` sungguhan) hanya terjadi di `lib/repositories/trashRepo.ts`,
  dipanggil dari halaman `/trash`, atau otomatis oleh auto-purge (30 hari).
- **Transfer (finance)**: satu aksi transfer tunai↔bank menghasilkan DUA
  dokumen `transactions` (asal & tujuan) yang saling merujuk lewat
  `transferPairId`, ditulis atomic pakai `writeBatch`. Transfer SELALU
  dikecualikan dari perhitungan total income/expense di `financeSelectors`.
  Soft-delete/restore salah satu sisi transfer otomatis memproses
  pasangannya juga — transfer selalu diperlakukan sebagai satu peristiwa
  utuh, tidak pernah setengah.
- **Activity Log**: dicatat otomatis dari dalam setiap repository (bukan
  dari komponen UI) setiap kali create/update/delete/restore terjadi, lewat
  `lib/repositories/activityLogRepo.ts`. Ditampilkan di halaman `/activity`.

## 6. Struktur Folder

```
app/
├── layout.tsx              # Font, AuthProvider, AuthGuard, AppShell
├── page.tsx                 # Dashboard home (greeting variatif + nama akun)
├── login/page.tsx           # Google Sign-In
├── settings/page.tsx        # 4 section: Akun, Data, Tampilan, Tentang
├── trash/page.tsx           # Recycle Bin lintas 5 modul
├── activity/page.tsx        # Log Aktivitas lintas 5 modul
├── finance/{page.tsx, new/page.tsx, [id]/page.tsx}
├── investments/{page.tsx, new/page.tsx, [id]/page.tsx}
├── subscriptions/{page.tsx, new/page.tsx, [id]/page.tsx}
├── watchlist/{page.tsx, new/page.tsx, [id]/page.tsx}
└── contacts/{page.tsx, new/page.tsx, [id]/page.tsx}

components/
├── layout/        # Sidebar, TopBar, AppShell, SidebarNavItem
├── dashboard/      # SummaryCard (base) + 5 card turunan per modul
├── shared/         # LastEditedBy (nama teks, BUKAN avatar-only — lihat
│                    # catatan di bawah), EmptyState, CurrencyInput,
│                    # TagInput/MultiTagInput, ConfirmDialog, Sparkline,
│                    # RatingStars, PhoneListInput, DynamicDetailFields,
│                    # QuickActions, QuickViewModal, AppVersion,
│                    # <Modul>ListItem × 5 (masing-masing dengan aksi
│                    # cepat Lihat/Edit/Hapus + modal), AuthGuard
└── ui/             # Card, Badge, icons.tsx (icon set inline SVG)

lib/
├── firebase/       # config.ts (init tunggal), converters.ts
├── types/          # 1 file per modul + shared.ts (AppMeta) +
│                    # activityLog.ts
├── repositories/   # 1 file per modul + metaRepo.ts + activityLogRepo.ts +
│                    # trashRepo.ts (hapus permanen generik) +
│                    # trashActions.ts (dispatcher restore/hapus per modul)
├── selectors/       # 1 file per modul + trashSelectors.ts (normalisasi
│                    # 5 modul jadi satu bentuk seragam untuk /trash)
├── hooks/          # useAuth (Google Sign-In + whitelist email),
│                    # use<Modul> × 5 (masing-masing split aktif/
│                    # terhapus), useAppMeta, useActivityLog
├── format.ts        # formatIDR, formatDateID, formatDateShortID
├── greeting.ts       # getGreeting (variatif per waktu, stabil per hari),
│                     # getFirstName
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

**Catatan desain penting — `LastEditedBy` tanpa avatar-only:** komponen ini
SENGAJA tidak punya mode avatar-bulat-tanpa-nama. Untuk pasangan pengguna
nyata aplikasi ini (nama depan sama-sama berinisial "A"), avatar inisial
saja gagal membedakan siapa yang mengedit — jadi nama selalu ditampilkan
sebagai teks (dengan titik warna kecil sebagai aksen), di semua ukuran dan
konteks (list item, dashboard card, halaman detail). Jangan tambahkan mode
"tampilkan inisial saja" tanpa mempertimbangkan ulang masalah ini.

## 7. Versioning

Mengikuti Semantic Versioning (`MAJOR.MINOR.PATCH`).

| Bagian | Kapan naik |
|---|---|
| **MAJOR (x)** | Perubahan breaking: restrukturisasi skema Firestore yang tidak backward-compatible, ubah total design system/token, ubah model akses data. |
| **MINOR (y)** | Fitur baru yang backward-compatible: modul baru, field baru non-breaking. |
| **PATCH (z)** | Bug fix, polish kecil, tanpa perubahan skema/fitur. |

Versi naik ke `1.0.0` setelah kelima modul inti + Dashboard + Settings +
Recycle Bin + Activity Log lengkap dan lolos build/lint — dianggap
production-ready untuk penggunaan sehari-hari (rilis 2026-08-24).

## 8. Status & Progress

**Update terakhir:** 2026-09-08

### Selesai
- [x] Setup fondasi (Firebase config, design tokens, font)
- [x] Auth — **Google Sign-In** (bukan email/password) dengan whitelist
      `NEXT_PUBLIC_ALLOWED_EMAILS`, akun di luar daftar otomatis ditolak
- [x] Layout shell (Sidebar hamburger + auto-collapse, TopBar, AppShell)
- [x] Modul Finance — termasuk **tunai/bank per pemilik (suami/istri)** dan
      **transfer tunai↔bank** sebagai aksi atomic (dua dokumen sekaligus,
      dikecualikan dari income/expense), saldo per akun di halaman list,
      **selector bulan & tahun** di `/finance` (v1.1.0) yang mengontrol
      card ringkasan DAN daftar transaksi sekaligus, dengan bulan kalender
      berjalan sebagai default
- [x] Modul Investment (9 jenis instrumen, form step-based conditional,
      UI target jual/beli dirapikan, dashboard card)
- [x] Modul Subscription — termasuk **per pemilik (suami/istri)**,
      breakdown spend per orang, normalisasi spend bulanan, halo amber
      ≤7 hari
- [x] Modul Watchlist — auto-timestamp startedAt/completedAt **dengan opsi
      koreksi manual**, tanggal tampil di list item, rating bintang
- [x] Modul Contacts (search prominent, phones array, tombol "tandai
      dihubungi", dashboard card)
- [x] Dashboard Home — **greeting variatif** (4 pilihan kalimat per slot
      waktu, stabil per hari) **+ nama depan dari akun Google**, 5 card
      lengkap, grid responsive
- [x] **Aksi cepat** (Lihat/Edit/Hapus) di semua 5 list item — modal
      quick-view read-only tanpa harus masuk halaman detail dulu
- [x] **Recycle Bin** (`/trash`) — soft-delete di 5 modul, gabungan lintas
      modul dalam satu halaman, auto-purge 30 hari, transfer selalu
      dihapus/dipulihkan sepasang
- [x] **Log Aktivitas** (`/activity`) — siapa membuat/mengubah/menghapus/
      memulihkan apa, dicatat otomatis dari repository, filter per modul
- [x] Settings — **4 section** (Akun dengan foto profil Google, Data
      dengan link ke Trash/Activity + kelola kategori/tag, Tampilan,
      Tentang dengan nomor versi app)
- [x] **Nama editor selalu tampil sebagai teks** (bukan avatar inisial
      saja) di semua card/list — lihat catatan penting di section 6
- [x] Kunci zoom (pinch & double-tap) di seluruh app
- [x] Audit & konsistensi token font (satu penyimpangan ditemukan &
      diperbaiki)
- [x] Nomor versi app ditampilkan di Settings, satu sumber dari
      `package.json` lewat `next.config.ts`
- [x] Polish pass (loading skeleton di semua list/detail page, empty state
      dengan CTA, grid form disesuaikan breakpoint mobile,
      `prefers-reduced-motion` di globals.css)
- [x] PWA manifest + 6 file icon (192/512/maskable 192/maskable 512/apple-touch/favicon)
- [x] `firestore.rules` + `firestore.indexes.json` (kosong — lihat section 11)

### Sedang dikerjakan
Tidak ada — seluruh permintaan revisi besar (versioning, anti-zoom,
konsistensi font, greeting variatif, nama editor, aksi cepat, Recycle Bin,
Activity Log, finance tunai/bank/transfer per pemilik, UI target investasi,
subscription per pemilik, tanggal watchlist, Settings diperkaya, dua akun
Google) sudah selesai satu putaran dan lolos build+lint.

### Next steps
- Setup project Firebase baru di Firebase Console (kalau belum), isi
  `.env.local` / environment variables Vercel dari kredensial asli.
- Aktifkan **Google** di Firebase Console → Authentication → Sign-in
  method (BUKAN Email/Password — app sudah pindah ke Google Sign-In).
- Isi `NEXT_PUBLIC_ALLOWED_EMAILS` dengan email Google kalian berdua.
- Tambahkan domain Vercel ke Firebase Console → Authentication → Settings
  → Authorized domains (wajib untuk Google Sign-In, kalau lupa akan error
  `auth/unauthorized-domain`).
- Deploy `firestore.rules` via Firebase CLI atau manual lewat Console.
- Uji end-to-end dengan kedua akun Google asli — terutama alur transfer
  finance, soft-delete + restore, dan Recycle Bin auto-purge (yang terakhir
  ini sulit diuji cepat karena ambangnya 30 hari — cukup pastikan
  perhitungan `daysLeft` di `/trash` masuk akal).
- Pertimbangkan: apakah breakdown `getBreakdownByOwner()` (finance, sudah
  ada di selector tapi belum ditampilkan di UI manapun) perlu ditambahkan
  ke halaman `/finance` atau dashboard.

### Catatan penting / penyimpangan dari brief awal
- **Sidebar 6 item modul inti + 3 utility.** Bagian 3.4 brief awal
  menyebutkan "5 item + Settings", tapi struktur folder resmi di Bagian 5
  mencantumkan `investments/` sebagai modul kelima terpisah dari Finance —
  sidebar final berisi Dashboard, Finance, Investasi, Langganan, Watchlist,
  Kontak (6 item modul inti) + Log Aktivitas, Recycle Bin, Pengaturan (3
  utility) terpisah di bawah.
- **Bug nested-merge di `metaRepo.ts`** ditemukan & diperbaiki saat
  membangun Settings page: menulis `categories.finance`/
  `categories.subscription` sebagai nested object literal dalam
  `setDoc(merge:true)` akan meng-replace seluruh objek `categories`,
  menghapus field saudaranya. Diperbaiki pakai dot-notation path.
- **Bug transfer-sebagai-expense di `financeSelectors.ts`** ditemukan &
  diperbaiki saat menambahkan tipe transaksi `transfer`: `getMonthlyTotal`
  sebelumnya pakai if/else biner (income vs bukan-income) yang akan salah
  menghitung transfer sebagai pengeluaran. Diperbaiki dengan pengecualian
  eksplisit `if (tx.type === "transfer") return acc;` di semua fungsi
  agregasi finance yang relevan.
- **Bug type error di `createTransfer()`** (Firestore converter
  mengharapkan field `id` untuk `batch.set()` dengan collection
  ber-`.withConverter()`) — diperbaiki dengan memakai collection reference
  mentah (tanpa converter) khusus untuk operasi batch write transfer.
- **`lib/investmentFieldConfig.ts`** ditaruh di luar 4 lapis SSOT resmi —
  lihat penjelasan di section 6 di atas.
- **`LastEditedBy` tanpa mode avatar-only** — lihat catatan penting di
  section 6 di atas; ini keputusan desain permanen, bukan keterbatasan
  sementara.
- **Composite index Firestore tidak dibutuhkan** — lihat section 11.
- Font Google (Fraunces, Geist) tidak bisa divalidasi via `next build` di
  sandbox development (tidak ada akses ke `fonts.googleapis.com`) — kode
  sudah benar dan akan resolve normal saat build di Vercel yang punya akses
  internet penuh. Divalidasi dengan font di-stub sementara untuk cek error
  struktural/TypeScript, lalu dikembalikan ke font asli setiap kali.


## 9. Changelog

### [1.1.0] - 2026-09-08
#### Added — selector bulan & tahun di `/finance`
Latar belakang: v1.0.2 hanya menambah teks penjelasan ("Belum ada transaksi
bulan ini") saat card Pemasukan/Pengeluaran/Net menampilkan Rp 0 karena
transaksi yang ada jatuh di bulan lain — tapi teks kecil itu masih mudah
terlewat dan ambigu (user tetap harus percaya teksnya, tidak bisa
memverifikasi sendiri dengan lihat bulan lain). Solusinya: beri kendali
langsung ke user, bukan sekadar penjelasan.

- **Selector bulan** (dropdown) di `/finance`, di atas card ringkasan.
  Daftar bulan dihasilkan dari `getAvailableMonths()` (baru,
  `financeSelectors.ts`): setiap bulan yang benar-benar punya transaksi,
  ditambah bulan kalender berjalan walau kosong, diurut terbaru→terlama.
  Default: bulan kalender saat ini (perilaku lama, tidak berubah kalau
  user tidak menyentuh selector-nya).
- Memilih bulan mengubah **dua hal sekaligus** supaya tidak ada lagi celah
  antara "angka ringkasan bilang apa" vs "daftar transaksi menunjukkan
  apa": (1) card Pemasukan/Pengeluaran/Net (`getMonthlyTotal()`) dihitung
  untuk bulan yang dipilih, (2) daftar transaksi di bawahnya ikut
  terfilter ke bulan yang sama (`filterByMonth()`, baru — disusun sebelum
  filter tipe/kategori/pemilik yang sudah ada).
- Empty state daftar transaksi sekarang menyebut nama bulan yang dipilih
  ("Belum ada transaksi di Agustus 2026. Coba pilih bulan lain di atas.")
  kalau kekosongan itu murni karena bulan yang dipilih, bukan filter
  tipe/kategori/pemilik.
- **Saldo Tunai/Saldo Bank tetap TIDAK terpengaruh selector bulan** —
  keduanya sengaja tetap saldo berjalan dari seluruh histori
  (`getBalanceByAccount()`, tidak diubah), karena itu representasi "uang
  yang benar-benar ada sekarang", bukan angka per-periode.
- Teks penjelasan "Belum ada transaksi bulan ini" di `/finance` dari
  v1.0.2 **dihapus** — sudah tidak relevan begitu ada selector eksplisit
  (bulan yang ditampilkan sekarang selalu jelas dari dropdown-nya
  sendiri). Versi Dashboard (`FinanceSummaryCard`) dari label yang sama
  **tetap dipertahankan** — card Dashboard sengaja tidak diberi selector
  (ringkasan sekilas, bukan tempat kontrol detail), jadi teks penjelasan
  itu masih relevan di sana.

#### Fixed — bug batas atas bulan di 3 fungsi selector
Ditemukan saat membangun fitur di atas: `getMonthlyTotal()`,
`getExpenseByCategory()`, dan `getBreakdownByOwner()` selama ini hanya
memfilter transaksi yang **lebih lama** dari bulan target
(`txDate < monthStart`), tanpa batas atas. Selama `referenceDate` selalu
"sekarang" (tidak pernah ada transaksi bertanggal di masa depan), bug ini
tidak pernah kelihatan. Begitu selector bulan memungkinkan user memilih
bulan LAMA sementara transaksi bulan-bulan setelahnya juga ada, ketiga
fungsi itu akan ikut menjumlah transaksi dari bulan-bulan setelah target
— salah hitung, bukan cuma salah tampil. Diperbaiki dengan menambah
`endOfMonth()` (awal bulan berikutnya, dipakai sebagai batas eksklusif)
di ketiganya, plus di `hasTransactionsThisMonth()` untuk konsistensi.

### [1.0.2] - 2026-09-08
#### Fixed — Pemasukan/Pengeluaran/Net finance tampil Rp 0 padahal data ada
Di Dashboard dan `/finance`, card "Pemasukan", "Pengeluaran", dan "Net"
menampilkan Rp 0 meski transaksi sudah tercatat (terlihat benar di
"Saldo Tunai"/"Saldo Bank" dan di daftar transaksi terbaru). Bukan data
hilang — `getMonthlyTotal()` (`lib/selectors/financeSelectors.ts`) memang
sengaja hanya menghitung transaksi bulan BERJALAN, sementara
`getBalanceByAccount()` menjumlah seluruh histori tanpa filter bulan.
Begitu kalender berganti bulan, transaksi bulan lalu otomatis tidak ikut
terhitung di ketiga card itu — perilaku ini sebenarnya benar untuk laporan
"bulan ini", tapi UI tidak memberi konteks apapun sehingga Rp 0 terlihat
seperti bug.

**Perbaikan**: tambah `hasTransactionsThisMonth()` di `financeSelectors.ts`
(selector baru, logic `getMonthlyTotal()` sendiri tidak diubah — sudah
benar). `FinanceSummaryCard.tsx` dan `app/finance/page.tsx` sekarang
menampilkan catatan "Belum ada transaksi bulan ini" saat kondisi itu
terjadi (ada transaksi di histori, tapi tidak ada yang jatuh di bulan
berjalan), alih-alih menampilkan Rp 0 tanpa penjelasan — pola yang sama
dengan empty state "Belum ada investasi tercatat." yang sudah ada di
Dashboard.

### [1.0.1] - 2026-08-27
#### Fixed — insiden kritis: data lama "hilang" pasca-upgrade ke v1.0.0
Setelah v1.0.0 dipakai dengan akun asli (`angga131095@gmail.com`), transaksi
finance yang dicatat SEBELUM v1.0.0 tidak lagi tampil di `/finance`, dan
halaman `/trash` gagal dimuat total ("This page couldn't load"). Data
**tidak hilang dari Firestore** (terkonfirmasi via Firebase Console) — akar
masalah murni di lapisan baca:
- Dokumen lama dibuat sebelum field `deletedAt`, `accountType`, `owner`
  (dan field serupa di modul lain) ditambahkan ke skema. Field itu bukan
  `null` di dokumen lama, melainkan **tidak ada key-nya sama sekali** —
  terbaca sebagai `undefined` oleh converter yang lama.
- `undefined !== null` bernilai `true` di JavaScript, jadi dokumen itu
  gagal filter "aktif" (`deletedAt === null`) TAPI secara teknis lolos
  filter "di trash" (`deletedAt !== null`) — pindah ke Recycle Bin tanpa
  diminta.
- Di halaman `/trash`, kode memanggil `item.deletedAt.toDate()` — untuk
  dokumen yang field-nya benar-benar `undefined` (bukan Timestamp valid),
  ini melempar exception dan menjatuhkan seluruh halaman.

**Perbaikan** (`lib/firebase/converters.ts`): setiap converter sekarang
menerima parameter `defaults` — field yang tidak ada di dokumen Firestore
lama otomatis diisi nilai default aman saat dibaca (`deletedAt: null`,
`accountType: "cash"`, `owner: "suami"`, dst.), SEBELUM data itu sampai ke
komponen manapun. Ditambah pengaman defense-in-depth di `/trash` (skip
item dengan `deletedAt` tidak valid alih-alih men-crash seluruh halaman).

**Pelajaran untuk pengembangan selanjutnya**: setiap kali field BARU
ditambahkan ke skema modul yang sudah punya data produksi, WAJIB
menambahkan default-nya di `makeConverter()` pada saat yang sama — jangan
asumsikan field itu ada di semua dokumen yang sudah pernah ditulis.

#### Changed
- Settings: hapus link duplikat ke Log Aktivitas & Recycle Bin dari
  section Data — keduanya sudah ada permanen di sidebar, tidak perlu
  diulang di Settings.

### [1.0.0] - 2026-08-24
#### Added
- **Auth**: ganti dari email/password ke **Google Sign-In**, tambah
  whitelist `NEXT_PUBLIC_ALLOWED_EMAILS`.
- **Anti-zoom**: kunci pinch-zoom & double-tap zoom di seluruh app
  (`viewport` meta + `touch-action: manipulation`).
- **Greeting dashboard variatif**: 4 pilihan kalimat per slot waktu,
  stabil per hari, plus nama depan dari akun Google (`lib/greeting.ts`).
- **Nama editor selalu tampil sebagai teks** di `LastEditedBy` — dirombak
  dari avatar-inisial-bulat (masalah: dua nama pengguna nyata sama-sama
  berinisial "A") jadi titik warna kecil + nama penuh, konsisten di semua
  list item, dashboard card, dan halaman detail.
- **Aksi cepat** (`QuickActions`, `QuickViewModal`): tombol Lihat/Edit/
  Hapus langsung dari list item tanpa masuk halaman detail dulu, di semua
  5 modul.
- **Recycle Bin** (`/trash`): soft-delete (`deletedAt`) di 5 modul,
  `trashRepo.ts` + `trashActions.ts` + `trashSelectors.ts`, auto-purge 30
  hari, transfer finance selalu dihapus/dipulihkan sepasang.
- **Log Aktivitas** (`/activity`): `activityLogRepo.ts`, dicatat otomatis
  dari setiap repository saat create/update/delete/restore, kalimat
  naratif per entri, filter per modul.
- **Finance — tunai/bank per pemilik + transfer** (Poin 9): field
  `accountType` (cash/bank) dan `owner` (suami/istri) di setiap transaksi,
  tipe transaksi baru `transfer` dengan `createTransfer()` atomic
  (`writeBatch`, dua dokumen saling merujuk lewat `transferPairId`), saldo
  per akun di halaman `/finance`.
- **Subscription per pemilik** (Poin 11): field `owner`, breakdown spend
  bulanan per orang (`getMonthlySpendByOwner`), filter pemilik.
- **Watchlist — koreksi tanggal manual** (Poin 12): form edit sekarang
  punya field tanggal mulai/selesai yang bisa dikoreksi manual, selain
  auto-timestamp saat transisi status.
- **Settings 4 section** (Poin 13): Akun (foto profil + email Google),
  Data (link ke Trash/Activity + kelola kategori/tag), Tampilan
  (placeholder tema), Tentang (nomor versi app via `AppVersion.tsx`).
- Nomor versi app: `next.config.ts` inject `NEXT_PUBLIC_APP_VERSION` dari
  `package.json` — satu sumber, tidak hardcode dua tempat.

#### Changed
- **UI target investasi dirapikan** (Poin 10): label "(opsional)" yang
  berulang dipindah jadi satu header section, grid target jual/beli
  sekarang sejajar tinggi.
- Grid form disesuaikan breakpoint mobile lebih lanjut.

#### Fixed
- **Bug transfer-sebagai-expense** di `financeSelectors.ts` — lihat
  section 8 "Catatan penting" untuk detail.
- **Bug type error** di `createTransfer()` (Firestore converter vs batch
  write) — lihat section 8 "Catatan penting" untuk detail.

### [0.2.1] - 2026-08-23
#### Fixed
- `firestore.indexes.json` sebelumnya berisi 4 composite index yang
  **tidak dibutuhkan** — seluruh query di repository hanya `orderBy()`
  single-field tanpa `where()`, jadi tidak pernah butuh composite index.
  Ketahuan saat mencoba input manual index `contacts` di Firebase Console
  dan muncul pesan "This index is not necessary, configure using single
  field index controls". Dikosongkan jadi `"indexes": []`, README section
  11 diperbarui dengan penjelasan kapan index composite baru benar-benar
  dibutuhkan.

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
  `firestore.indexes.json` (kosong — semua query saat ini single-field,
  lihat section 11 untuk penjelasan).

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

Composite indexes: **tidak ada yang dibutuhkan saat ini.** Semua query
Firestore di repository (`transactionRepo`, `investmentRepo`,
`subscriptionRepo`, `watchlistRepo`, `contactRepo`, `activityLogRepo`)
hanya pakai satu `orderBy()` single-field (plus `limit()` untuk activity
log — bukan `where()`, tetap single-field) — filter kategori/tipe/status/
pemilik dilakukan di client lewat selectors, bukan di query Firestore.
Single-field index sudah otomatis tersedia untuk semua field, tidak perlu
dibuat manual.

`firestore.indexes.json` sengaja dikosongkan (`"indexes": []`) untuk
mencerminkan ini. Kalau nanti ada query baru yang menggabungkan `where()` +
`orderBy()` field berbeda (misalnya memindahkan filter dari client ke
server-side untuk efisiensi saat data sudah besar), Firestore akan
menunjukkan error di browser console berisi link otomatis untuk membuat
index yang dibutuhkan — pakai link itu, atau tambahkan manual lewat
Firebase Console → Firestore Database → Indexes → Composite.

Deploy keduanya via Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pilih project Firebase yang baru dibuat
firebase deploy --only firestore:rules,firestore:indexes
```

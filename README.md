# Library Management System

A modern, role-based library management system. Frontend uses Next.js (App Router, TypeScript, Tailwind, shadcn/ui), backend uses Express.js with Supabase (Auth + Postgres).

## Deskripsi Proyek
Aplikasi ini memfasilitasi pengelolaan perpustakaan untuk tiga peran: Admin, Librarian (Pustakawan), dan Member (Anggota). Guest dapat menjelajah katalog; pengguna terautentikasi mendapatkan dashboard sesuai perannya. Backend menyediakan API autentikasi terintegrasi Supabase dan endpoint read-only untuk daftar pengguna.

## Fitur Utama (Sistem)
- Autentikasi: Sign Up, Sign In (JWT aplikasi), sesi di frontend via context
- Role-based UI: Admin, Librarian, Member (dashboard berbeda)
- Katalog buku: pencarian, filter (mock data di frontend)
- Endpoint backend:
  - POST `/api/auth/signup` (buat akun + profil di Supabase)
  - POST `/api/auth/login` (sign-in + kembalikan JWT aplikasi)
  - GET  `/api/auth/me` (cek token)
  - GET  `/api/auth/users` (tanpa token; demo; field sensitif disembunyikan by default)
  - GET  `/api/auth/users/:id` (tanpa token; demo; field sensitif disembunyikan by default)

> Catatan: Untuk produksi, endpoint users sebaiknya dibatasi (JWT + RBAC) dan hanya expose field yang diperlukan.

## Stack Teknologi
- Frontend: Next.js 13+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Sonner
- Backend: Node.js, Express.js, Helmet, CORS, Morgan, JWT
- Database/Auth: Supabase (Postgres + Supabase Auth)

## Struktur Proyek
```
Library-Management/
├─ project/                 # Frontend (Next.js)
│  ├─ app/                  # Routes & pages (auth, catalog, dashboard/*)
│  ├─ components/           # UI components (shadcn/ui) & layout
│  ├─ hooks/ lib/           # use-toast, auth-context, utils
│  └─ ...
├─ backend/                 # Backend (Express)
│  ├─ src/
│  │  ├─ lib/supabase.js    # Supabase Admin client (dotenv load)
│  │  ├─ services/          # Business logic (authService.js)
│  │  └─ routes/            # Routes (auth.js)
│  ├─ sql/                  # Migrasi Supabase
│  │  └─ 001_create_app_users.sql
│  └─ package.json
└─ .gitignore               # Mengabaikan semua .env di seluruh folder
```

## Persiapan Lingkungan
Buat file `backend/.env` (jangan commit):
```
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000

SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # sangat sensitif

JWT_SECRET=<random-long-secret>
JWT_TTL=7d
```
- Dapatkan nilai Supabase di Project Settings → API.
- Gunakan key `service_role` untuk server, bukan `anon`.

## Migrasi Database (Supabase)
Jalankan SQL di `backend/sql/001_create_app_users.sql` via SQL Editor Supabase atau psql. Ini membuat:
- Type enum `user_role` (admin|librarian|member)
- Tabel `public/users` (profil 1:1 dengan `auth.users`)
- Trigger `updated_at`
- RLS + policies (select/insert/update milik sendiri)

## Menjalankan Aplikasi
Backend (Express):
```
cd backend
npm install
npm run dev
```
Health check: `http://localhost:4000/api/health`

Frontend (Next.js):
```
cd project
npm install
npm run dev
```
Akses: `http://localhost:3000`

## Contoh Penggunaan API (Postman)
- Sign Up (member/librarian):
```
POST http://localhost:4000/api/auth/signup
Content-Type: application/json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "member"
}
```
- Login:
```
POST http://localhost:4000/api/auth/login
Content-Type: application/json
{
  "email": "john@example.com",
  "password": "secret123"
}
```
- Me (perlu token):
```
GET http://localhost:4000/api/auth/me
Authorization: Bearer <token>
```
- List Users (demo, tanpa token):
```
GET http://localhost:4000/api/auth/users?limit=50&offset=0&includeEmail=false
```
- Get User by ID (demo, tanpa token):
```
GET http://localhost:4000/api/auth/users/<user_id>?includeEmail=false
```

## Alur Sistem (Ringkas)
- Guest → Sign Up/Sign In → diarahkan ke `/dashboard/{role}` sesuai peran.
- Member: buku dipinjam, progres, histori, rekomendasi (mock di UI)
- Librarian: operasi perpustakaan (mock di UI)
- Admin: overview & manajemen (mock di UI)

## Keamanan & Catatan Produksi
- Jangan pernah commit file `.env` (root `.gitignore` sudah mengabaikan semua `.env`).
- Lindungi endpoint users dengan JWT + role admin di produksi.
- Tambahkan rate limiting, validasi input, dan logging terstruktur bila dibutuhkan.

## Lisensi
Untuk keperluan pembelajaran/portofolio. Silakan sesuaikan lisensi jika diperlukan.

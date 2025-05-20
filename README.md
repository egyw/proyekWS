# 🍽️ Foodify API - Web Service Makanan & Gaya Hidup Sehat

## 👥 Daftar Nama Kelompok:
1. CHRISTOPHANI GREGORIUS PHILLIP WONGES - 223117073
2. EGBERT WANGARRY - 223117080 
3. GIVEN LEE - 223117082
4. KENJI KRISNA KHOHARI - 223117092

---

## 📖 Deskripsi Proyek

**Foodify API** adalah layanan web (Web Service) yang menyediakan berbagai fitur seputar makanan, resep, dan gaya hidup sehat. Proyek ini dikembangkan untuk memenuhi tugas kuliah Web Service.

### API Eksternal yang Digunakan:
- 🔗 [TheMealDB API](https://www.themealdb.com/)
- 🤖 [Gemini AI Studio API](https://aistudio.google.com/)

### 🔑 Fitur Utama:
- Melihat daftar makanan (berdasarkan kategori, diet, popularitas, dll)
- Rekomendasi makanan berdasarkan preferensi pengguna
- Detail resep dan langkah memasak
- CRUD untuk resep dan cara masak buatan sendiri (dengan `multer` untuk upload gambar makanan)
- Komentar & review pada makanan
- Subscription untuk akun premium
- Fitur eksklusif untuk **premium**:
  - AI chatbot: saran makanan berdasarkan preferensi pribadi
  - Diet plan mingguan
  - Pencarian bahan alternatif dari resep tertentu
- Email notifikasi saat makanan milik user dikomentari
- Kalkulator kalori untuk makanan buatan sendiri atau dari database

---

## 🗃️ Struktur Database (MongoDB)

Berikut adalah gambaran koleksi (collections) utama dalam basis data:

### `accounts`
- `_id`
- `email`
- `username`
- `password`
- `role` (user, premium, admin)
- `subscriptionStatus` (free / premium)
- `preferences` (vegan, halal, dll)
- `dietHistory` (array makanan yang pernah dilihat/dikonsumsi)

### `foods`
- `_id`
- `title`
- `description`
- `category` (snack, main course, etc)
- `dietType` (vegan, keto, etc)
- `image` (link/file upload)
- `ingredients` (array of strings)
- `steps` (array of step-by-step instruction)
- `calories` (number)
- `createdBy` (user id)
- `reviews` (array of user comments)

### `reviews`
- `_id`
- `userId`
- `foodId`
- `comment`
- `rating`
- `createdAt`

### `subscriptions`
- `_id`
- `userId`
- `type` (monthly, yearly)
- `startDate`
- `endDate`
- `paymentStatus`

### `notifications`
- `_id`
- `userId`
- `message`
- `read` (boolean)
- `createdAt`

### `chat_sessions` (untuk fitur chatbot AI)
- `_id`
- `userId`
- `messages`: array of {
  - `sender` (user/ai)
  - `message`
  - `timestamp`
}

---

## ⚙️ Endpoint API (Singkat)

| Method | Endpoint                  | Deskripsi                               |
|--------|---------------------------|-----------------------------------------|
| GET    | `/api/foods`              | Menampilkan semua makanan               |
| GET    | `/api/foods/:id`          | Detail makanan                          |
| POST   | `/api/foods`              | Buat resep baru                         |
| POST   | `/api/review/:foodId`     | Tambah komentar                         |
| GET    | `/api/recommendation`     | Rekomendasi makanan                     |
| POST   | `/api/auth/register`      | Daftar akun                             |
| POST   | `/api/auth/login`         | Login akun                              |
| POST   | `/api/subscribe`          | Berlangganan akun premium               |
| GET    | `/api/chat`               | Fitur AI chatbot                        |
| GET    | `/api/calories`           | Kalkulasi kalori dari bahan             |


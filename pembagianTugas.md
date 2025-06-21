👤 Anggota 1 – User Management + Notification + Komentar (kompleksitas: sedang)
Fokus pada otentikasi, manajemen akun, dan komentar.

POST /api/register – Register user (Joi)

POST /api/login – Login (JWT)

GET /api/users/profile – Lihat profil (JWT required)

PUT /api/users/profile – Edit profil (JWT + Joi)

GET /api/users/:id/notifications – Notifikasi (transaksi dengan komentar)

🔧 Tantangan:

Implementasi JWT

Joi Validation

Query notifikasi berdasarkan komentar yang masuk

------------------------------------------------------------------------------------

🍲 Anggota 2 – Recipe CRUD + Upload Gambar (kompleksitas: tinggi)
Fokus di fitur resep buatan user, termasuk upload gambar (pakai Multer).

POST /api/recipes – Tambah resep (Multer, JWT, validasi)

GET /api/recipes – Ambil semua resep

GET /api/recipes/:id – Detail resep

PUT /api/recipes/:id – Edit resep (JWT)

DELETE /api/recipes/:id – Hapus resep (JWT, only owner)

🔧 Tantangan:

Upload file

Validasi input resep

Cek kepemilikan resep

Image handling & storage

------------------------------------------------------------------------------------

💬 Anggota 3 – Review + AI + Kalori (kompleksitas: tinggi)
Menangani komentar + fitur premium (3rd party API Gemini & Spoonacular).

POST /api/recipes/:id/reviews – Tambah komentar (JWT, transaksi)

GET /api/recipes/:id/reviews – List komentar

POST /api/ai/food-suggestion – Gunakan Gemini API (premium only)

GET /api/ai/history – Lihat history pertanyaan ke AI

GET /api/calories?query=makanan – Hitung kalori (Spoonacular API)

🔧 Tantangan:

Integrasi 2 API pihak ketiga

Cek role user (premium)

Relasi komentar ke resep

Logging history AI

-----------------------------------------------------------------------------------

💳 Anggota 4 – Subscription + Payment + Rekomendasi (kompleksitas: tinggi)
Fokus ke sistem berlangganan dan rekomendasi dengan API eksternal.

POST /api/subscribe – Beli langganan (JWT)

GET /api/subscription/status – Cek status akun premium

GET /api/recommendations – Rekomendasi makanan (Spoonacular)

GET /api/ingredients/alternative?item=susu – Cari bahan pengganti (Spoonacular)

🔧 Tantangan:

Simulasi payment + webhook

Cek status premium

Rekomendasi makanan personalisasi

API eksternal dengan fallback
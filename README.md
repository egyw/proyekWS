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
- 🔗 [Spoonacular API](https://spoonacular.com/food-api) - Data resep, nutrisi, dan rekomendasi makanan
- 🤖 [Gemini AI Studio API](https://aistudio.google.com/) - AI chatbot untuk saran makanan dan diet
- ☁️ [Cloudinary API](https://cloudinary.com/) - Cloud storage untuk gambar dan video resep
- 📧 [Resend API](https://resend.com/) - Email service untuk notifikasi dan OTP

### 🔑 Fitur Utama:
- **Manajemen User**: Registration, login dengan OTP, profile management dengan foto profil, role-based access
- **Resep Makanan**: CRUD resep dengan upload gambar & video (multer/cloudinary), pencarian berdasarkan ingredients/nutrients
- **Review & Rating**: Komentar dan rating pada resep makanan
- **Subscription Premium**: Berlangganan tahunan dengan pembayaran menggunakan saldo
- **Shopping Cart**: Sistem keranjang belanja untuk membeli bahan makanan
- **Transaction System**: Pembelian item, top-up saldo, riwayat transaksi
- **Fitur Premium Eksklusif**:
  - AI chatbot untuk saran makanan menggunakan Gemini AI
  - Rekomendasi makanan dari Spoonacular API
  - Pencarian bahan alternatif untuk resep
- **Security Features**: Rate limiting, IP ban system, failed login tracking
- **Export Features**: Export data ke PDF dan Excel
- **Real-time Notifications**: Email notifications untuk interaksi resep

---

## 🗃️ Struktur Database (MongoDB)

Berikut adalah gambaran koleksi (collections) utama dalam basis data:

### `users`
- `_id`
- `profilePicture` (default: 'null')
- `username` (unique)
- `email` (unique)
- `password` (hashed)
- `role` (enum: 'user', 'admin', default: 'user')
- `isPremium` (boolean, default: false)
- `saldo` (number, default: 0)
- `refreshToken`
- `pendingEmail`
- `otp`
- `otpExpiresAt`
- `createdAt`
- `updatedAt` 

### `recipes`
- `_id`
- `title`
- `servings`
- `readyInMinutes`
- `preparationMinutes`
- `cookingMinutes`
- `ingredients` (array of objects with name & measure)
- `dishTypes`
- `tags`
- `area`
- `instructions`
- `video`
- `createdByUser` (ObjectId ref to User)
- `dateModified`
- `image`
- `healthScore`
- `summary`
- `weightWatcherSmartPoints`
- `calories`
- `carbs`
- `fat`
- `protein`
- `createdAt`
- `updatedAt`
- `deleted` (soft delete with mongoose-delete)

### `reviews`
- `_id`
- `recipeId` (ObjectId ref to Recipe)
- `recipeTitle`
- `commentedBy` (ObjectId ref to User)
- `commentedByUsername` 
- `comment`
- `rating`
- `createdAt`
- `updatedAt`

### `subscriptions`
- `_id`
- `userId` (ObjectId ref to User)
- `startDate`
- `endDate`
- `paymentStatus` (enum: 'pending', 'completed', 'cancelled')
- `status` (enum: 'active', 'expired', 'cancelled')
- `createdAt`
- `updatedAt`

### `aiQueries` 
- `_id`
- `userId` (ObjectId ref to User)
- `prompt`
- `response`
- `createdAt`
- `updatedAt`

### `transactions` 
- `_id`
- `date`
- `user_id` (ObjectId ref to User)
- `type` (enum: 'item', 'premium')
- `total_amount`
- `createdAt`
- `updatedAt`

### `detail_trans` 
- `_id`
- `transaction_id` (ObjectId ref to Transaction)
- `item_name`
- `quantity`
- `price`
- `createdAt`
- `updatedAt`

### `carts`
- `_id`
- `user` (ObjectId ref to User)
- `item_name`
- `price`
- `quantity`

### `logs`
- `_id`
- `userId` (ObjectId ref to User)
- `action` (enum: 'REGISTER', 'LOGIN_OTP_DIKIRIM', 'LOGIN_GAGAL', 'LOGIN_BERHASIL', 'LOGOUT', 'GANTI_PASSWORD', 'GANTI_EMAIL_REQUEST', 'GANTI_EMAIL_GAGAL', 'GANTI_EMAIL_BERHASIL', 'REFRESH_TOKEN', 'UPDATE_ROLE')
- `status` (enum: 'BERHASIL', 'GAGAL')
- `ipAddress`
- `details`
- `createdAt`
- `updatedAt`

### `failedLoginAttempts`
- `_id` 
- `identifier`
- `ipAddress`
- `timestamps` (array of dates)
- `lockUntil`
- `createdAt`
- `updatedAt`

### `ipBan`
- `_id`
- `ipAddress` (unique)
- `isBanned` (boolean, default: false)
- `timeoutHistory` (array of dates)
- `reason` (default: 'Terlalu banyak percobaan login gagal.')
- `createdAt`
- `updatedAt`


---

## ⚙️ Endpoint API

### 👤 User Management
| Method | Endpoint                           | Deskripsi                                    | Auth Required |
|--------|------------------------------------|----------------------------------------------|---------------|
| GET    | `/api/v1/user/getAllUsers`         | Mendapatkan semua user (admin only)         | ✓ (Admin)     |
| POST   | `/api/v1/user/register`            | Registrasi user baru                         | ✗             |
| POST   | `/api/v1/user/login`               | Login user dengan rate limiting              | ✗             |
| POST   | `/api/v1/user/verifyLoginOtp`      | Verifikasi OTP login                         | ✗             |
| GET    | `/api/v1/user/token`               | Refresh access token                         | ✗             |
| DELETE | `/api/v1/user/logout`              | Logout user                                  | ✗             |
| GET    | `/api/v1/user/profile`             | Mendapatkan profil user                      | ✓             |
| PATCH  | `/api/v1/user/profile/password`    | Update password user                         | ✓             |
| POST   | `/api/v1/user/profile/email`       | Request perubahan email                      | ✓             |
| POST   | `/api/v1/user/profile/verifyEmailOtp` | Verifikasi OTP perubahan email            | ✓             |
| GET    | `/api/v1/user/profile/picture/multer` | Mendapatkan foto profil (multer)          | ✓             |
| GET    | `/api/v1/user/profile/picture/cloud` | Mendapatkan foto profil (cloudinary)       | ✓             |
| POST   | `/api/v1/user/profile/upload/multer` | Upload foto profil (multer)                | ✓             |
| POST   | `/api/v1/user/profile/upload/cloud` | Upload foto profil (cloudinary)             | ✓             |
| DELETE | `/api/v1/user/profile/picture/multer` | Hapus foto profil (multer)                | ✓             |
| DELETE | `/api/v1/user/profile/picture/cloud` | Hapus foto profil (cloudinary)             | ✓             |
| GET    | `/api/v1/user/logs/:userId`        | Mendapatkan log user (admin only)           | ✓ (Admin)     |
| PATCH  | `/api/v1/user/role/:userId`        | Update role user (admin only)               | ✓ (Admin)     |

### 🍽️ Recipe Management  
| Method | Endpoint                           | Deskripsi                                    | Auth Required |
|--------|------------------------------------|----------------------------------------------|---------------|
| GET    | `/api/v1/recipes/getAllRecipes`    | Mendapatkan semua resep                      | ✗             |
| GET    | `/api/v1/recipes/getDetailRecipe/:id` | Detail resep berdasarkan ID               | ✗             |
| GET    | `/api/v1/recipes/getRecipeByUser`  | Mendapatkan resep milik user                 | ✓             |
| GET    | `/api/v1/recipes/getRecipeByIngredients` | Pencarian resep berdasarkan bahan        | ✗             |
| GET    | `/api/v1/recipes/getRecipeByNutrients` | Pencarian resep berdasarkan nutrisi        | ✗             |
| POST   | `/api/v1/recipes/insertRecipeWithCloud` | Buat resep baru (cloudinary)            | ✓             |
| POST   | `/api/v1/recipes/insertRecipeWithMulter` | Buat resep baru (multer)               | ✓             |
| PUT    | `/api/v1/recipes/updateRecipeWithCloud/:id` | Update resep (cloudinary)           | ✓             |
| PUT    | `/api/v1/recipes/updateRecipeWithMulter/:id` | Update resep (multer)              | ✓             |
| DELETE | `/api/v1/recipes/deleteRecipe/:id` | Hapus resep (soft delete)                    | ✓             |

### 💬 Review & AI Features
| Method | Endpoint                           | Deskripsi                                    | Auth Required |
|--------|------------------------------------|----------------------------------------------|---------------|
| POST   | `/api/v1/reviews/addComentar/:id`  | Tambah komentar pada resep                   | ✓             |
| GET    | `/api/v1/reviews/:id`              | Mendapatkan review resep                     | ✓             |
| POST   | `/api/v1/reviews/ai/food-suggestion` | AI food suggestion (premium only)         | ✓ (Premium)   |
| GET    | `/api/v1/reviews/ai/history`       | Riwayat AI queries                           | ✓             |
| GET    | `/api/v1/reviews/ai/history/export` | Export AI history ke PDF                   | ✓             |
| GET    | `/api/v1/reviews/ai/calory/:title` | Hitung kalori makanan                        | ✓             |
| GET    | `/api/v1/reviews/spoonExcel/information` | Export info spoonacular ke Excel        | ✓             |

### 💳 Transaction & Subscription
| Method | Endpoint                           | Deskripsi                                    | Auth Required |
|--------|------------------------------------|----------------------------------------------|---------------|
| POST   | `/api/v1/transaction/subscribe`    | Buat subscription baru                       | ✓             |
| POST   | `/api/v1/transaction/paySubscription` | Bayar subscription                        | ✓             |
| GET    | `/api/v1/transaction/subscription/status` | Cek status subscription               | ✓             |
| DELETE | `/api/v1/transaction/unsubscribe`  | Cancel subscription                          | ✓             |
| POST   | `/api/v1/transaction/topup`        | Top up saldo user                            | ✓             |

### 🛒 Shopping Cart & Items  
| Method | Endpoint                           | Deskripsi                                    | Auth Required |
|--------|------------------------------------|----------------------------------------------|---------------|
| GET    | `/api/v1/transaction/item/details` | Mendapatkan semua item details               | ✓             |
| GET    | `/api/v1/transaction/item/details/:name` | Detail item berdasarkan nama           | ✓             |
| POST   | `/api/v1/transaction/cart/add`     | Tambah item ke cart                          | ✓             |
| GET    | `/api/v1/transaction/cart/view`    | Lihat isi cart                               | ✓             |
| DELETE | `/api/v1/transaction/cart/remove`  | Hapus item dari cart                         | ✓             |
| DELETE | `/api/v1/transaction/cart/removeAll` | Hapus semua item dari cart                 | ✓             |
| POST   | `/api/v1/transaction/item/buy`     | Checkout/beli semua item di cart             | ✓             |

### 🏆 Premium Features
| Method | Endpoint                           | Deskripsi                                    | Auth Required |
|--------|------------------------------------|----------------------------------------------|---------------|
| GET    | `/api/v1/transaction/recommendations` | Mendapatkan rekomendasi makanan           | ✓ (Premium)   |
| GET    | `/api/v1/transaction/ingredients/alternative` | Pencarian bahan alternatif        | ✓ (Premium)   |

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcrypt** - Password hashing
- **Rate Limiting** - Login attempt protection
- **OTP System** - Two-factor authentication

### File Management
- **Multer** - File upload middleware
- **Cloudinary** - Cloud storage for images/videos
- **Sharp** - Image processing and resizing

### External APIs
- **Spoonacular API** - Recipe and food data
- **Gemini AI** - AI-powered food suggestions
- **Resend** - Email notifications

### Additional Libraries
- **Joi** - Data validation
- **Faker.js** - Test data generation
- **node-cron** - Task scheduling
- **ExcelJS** - Excel file generation
- **PDFKit** - PDF document generation
- **Chart.js** - Data visualization

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm atau yarn

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
SPOONACULAR_API_KEY=your_spoonacular_api_key
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RESEND_API_KEY=your_resend_api_key
```

### Installation Steps
```bash
# Clone the repository
git clone <repository-url>
cd proyekWS

# Install dependencies
npm install

# Run database migration
npm run migrate

# Seed database with sample data
npm run seeder

# Start the server
npm start
```

### Development
```bash
# Run in development mode
npm run dev

# Run seeder for additional test data
npm run seeder2
```

---

## 📊 Features Detail

### Security Features
- **Rate Limiting**: Maximum 5 login attempts per 15 minutes
- **IP Banning**: Automatic IP ban after repeated failed attempts
- **OTP Authentication**: Email-based OTP for secure login
- **Password Hashing**: bcrypt encryption for user passwords
- **JWT Tokens**: Secure access and refresh token system

### File Upload Options
- **Multer**: Local file storage with automatic resizing
- **Cloudinary**: Cloud-based storage with optimization
- **Supported formats**: Images (JPG, PNG, WebP), Videos (MP4, MOV)

### Premium Features
- AI-powered food suggestions using Gemini API
- Advanced recipe recommendations from Spoonacular
- Alternative ingredient suggestions
- Priority customer support

### Export & Reporting
- **PDF Export**: AI query history and reports
- **Excel Export**: Spoonacular data and analytics
- **Chart Generation**: Nutritional data visualization

---



# 🌉 FoodBridge

> Connecting surplus food from donors with NGOs that distribute it to those in need.

---

## 📁 Project Structure

```
FoodBridge/
├── backend/                  # Node.js + Express + MongoDB API
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth middleware
│   ├── models/               # Mongoose models
│   ├── routes/               # Express routes
│   ├── .env                  # Environment variables
│   ├── package.json
│   └── server.js
│
└── mobile/                   # React Native (Expo) App
    ├── src/
    │   ├── api/              # API client
    │   ├── components/       # Reusable UI components
    │   ├── context/          # React Context (auth state)
    │   ├── navigation/       # React Navigation setup
    │   ├── screens/          # All app screens
    │   └── utils/            # Theme, helpers
    ├── App.js
    ├── app.json
    └── package.json
```

---

## ⚙️ Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android) — or an emulator

---

## 🚀 Backend Setup

```bash
cd FoodBridge/backend
npm install
```

### Configure Environment

Edit `.env` (already created):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foodbridge
JWT_SECRET=foodbridge_super_secret_key_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

> **Using MongoDB Atlas?** Replace `MONGODB_URI` with your Atlas connection string.

### Start Backend

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

### Create an Admin User

After starting the server, register a user via the app and then manually set their role in MongoDB:

```js
// In MongoDB shell or Compass:
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## 📱 Mobile App Setup

```bash
cd FoodBridge/mobile
npm install
```

### Configure API URL

Open `src/api/index.js` and set `BASE_URL` to match your machine:

```js
// Physical device on same WiFi:
export const BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
// e.g. 'http://192.168.1.100:5000/api'

// Android Emulator:
export const BASE_URL = 'http://10.0.2.2:5000/api';

// iOS Simulator:
export const BASE_URL = 'http://localhost:5000/api';
```

> Find your IP: `ipconfig` (Windows) / `ifconfig` (Mac/Linux)

### Start App

```bash
npx expo start
```

- Scan the QR code with **Expo Go** on your phone
- Press `a` for Android emulator
- Press `i` for iOS simulator

---

## 👥 User Roles

| Role    | Can Do |
|---------|--------|
| **Donor** | Create food listings, approve/reject NGO pickup requests |
| **NGO**   | Browse available listings, request pickups, mark food as collected |
| **Admin** | View all users and listings, activate/deactivate users |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| PUT  | `/api/auth/profile` | Update profile |

### Listings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/listings` | All | Get available listings |
| GET  | `/api/listings/mine` | Donor | Get my listings |
| GET  | `/api/listings/:id` | All | Get single listing |
| POST | `/api/listings` | Donor | Create listing |
| PUT  | `/api/listings/:id` | Donor | Update listing |
| DELETE | `/api/listings/:id` | Donor | Delete listing |

### Requests
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/requests/listing/:listingId` | NGO | Request pickup |
| GET  | `/api/requests/donor` | Donor | My incoming requests |
| GET  | `/api/requests/ngo` | NGO | My outgoing requests |
| PUT  | `/api/requests/:id/approve` | Donor | Approve request |
| PUT  | `/api/requests/:id/reject` | Donor | Reject request |
| PUT  | `/api/requests/:id/collect` | NGO | Mark as collected |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform stats |
| GET | `/api/admin/users` | Admin | All users |
| GET | `/api/admin/listings` | Admin | All listings |
| PUT | `/api/admin/users/:id/toggle` | Admin | Toggle user status |

---

## 🗄️ Database Models

### User
```
name, email, password (hashed), role (donor/ngo/admin),
phone, address, organizationName, isActive
```

### Listing
```
donor (ref), title, description, foodType, quantity, servings,
expiresAt, pickupAddress, status, images, allergens
```

### Request
```
listing (ref), ngo (ref), donor (ref), message, status,
pickupTime, collectedAt, rejectionReason
```

---

## 🎨 App Screens

### Donor
- **Dashboard** — stats, recent listings, pending requests alert
- **Create Listing** — post surplus food with type, quantity, expiry
- **Pickup Requests** — approve or reject NGO requests
- **Profile** — edit info, logout

### NGO
- **Browse Food** — filter by type, see available listings
- **Listing Detail** — view full details, request pickup with message
- **My Requests** — track status, mark as collected
- **Profile** — edit info, logout

### Admin
- **Dashboard** — platform stats: users, listings, requests, collections
- **Users** — list all users, activate/deactivate accounts
- **Profile** — logout

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to API | Check `BASE_URL` in `src/api/index.js` matches your IP |
| MongoDB not connecting | Ensure MongoDB is running: `mongod` |
| Expo won't start | Run `npx expo doctor` to check setup |
| JWT errors | Clear app storage and re-login |

---

## 🏆 Hackathon Demo Flow

1. Register as **Donor** → post a food listing
2. Register as **NGO** → browse and request pickup
3. Login as Donor → approve the request
4. Login as NGO → mark as collected
5. Login as **Admin** → view stats and users

---

Built with ❤️ for FoodBridge Hackathon

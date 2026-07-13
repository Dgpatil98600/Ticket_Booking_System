# 🎟️ TicketMaster – Full-Stack Ticket Booking System

A production-quality, real-time ticket booking system built as a B.Tech final project using the **MERN stack** (MongoDB, Express.js, React, Node.js). The system simulates a complete, professional-grade booking ecosystem with concurrent seat management, real-time synchronization, role-based access control, automated email ticketing, and waitlist management.

---

## 📸 Application Preview

### Events Homepage – Browse & Search

![Events Homepage – Discover Amazing Events](user_dashboard_view1.png)

*The homepage displays all published events in a responsive card grid. Customers can search by name or city and filter by event type (Movies, Concerts, Sports, Theater, Other).*

![Events filtered by Movies category](user_dashboard_view2.png)

*Category filters update the event list instantly. Each card shows availability (% booked), remaining seats, and starting price.*

---

## 🌟 Core Features

### 👥 Role-Based Access Control (3 Roles)

| Role | Capabilities |
|------|-------------|
| **Admin** | Create/manage venues with custom seat layouts and categories, manage all users, view system-wide dashboard analytics, cancel any booking |
| **Organizer** | Create and edit events for assigned venues, set per-category ticket pricing, view event-specific booking analytics via organizer dashboard |
| **Customer** | Browse events, select seats via interactive visual seat map, hold and checkout seats, manage bookings, join/track waitlists |

Authentication is implemented using **JWT (Access + Refresh tokens)**. A special `ADMIN_SECRET` is required during admin registration to prevent unauthorized admin account creation.

---

### 🗺️ Interactive Visual Seat Map

![Event Detail page with full interactive seat map](Event_Room_View1.png)

*The seat map renders every seat in the venue as a grid. Seats are colour-coded: 🔴 Booked (Red), 🟡 Premium Available (Yellow), 🔵 Standard Available (Blue), 🟢 Economy Available (Green). The right panel shows pricing per category and venue details.*

![Scrolled lower seat section showing category legend and user dropdown](Event_Room_View2.png)

*The bottom of the seat map displays a live colour legend (Available / Selected / On Hold / Booked and Category labels). The user dropdown gives quick access to My Bookings, My Waitlists, and Logout.*

- Built entirely with **React + CSS Grid** — no external charting or canvas libraries.
- Displays a full grid of individual seats, colour-coded by category:
  - 🟡 **Premium** (Gold/Yellow)
  - 🔴 **Booked** (Red)
  - 🔵 **Standard** (Blue/Purple)
  - 🟢 **Economy** (Green)
  - 🩵 **Selected by You** (Cyan highlight)
  - ⬛ **Held by Others** (Dimmed)
- **Real-time updates via Socket.io**: When another user holds, books, or releases a seat, every other viewer's seat map updates instantly without a page refresh.
- A dynamic colour **legend** is displayed alongside the seat map.

---

### ⏱️ Seat Hold System (Concurrency Safe)

- When a customer selects seats, they are **temporarily held** for a configurable duration (default: 5 minutes, controlled by `SEAT_HOLD_TTL_MINUTES` in `.env`).
- Holds are stored in the database with a `holdExpiresAt` timestamp.
- A **Node.js Cron Job** (`seatHoldRelease.job.js`) runs every minute to automatically release expired holds, freeing them for other customers.
- MongoDB atomic `findOneAndUpdate` with a `status: 'available'` guard ensures **no double-booking** is possible under concurrent traffic.

---

### 🔖 Booking & Checkout

![Checkout page with order summary, seat breakdown, convenience fee, and confirm button](chechout.png)

*The Checkout page displays the complete order summary: selected seats with category tags, subtotal, 2% convenience fee, and total amount. A live countdown timer (top-right) shows the remaining hold time. The user's info is confirmed before payment.*

- Checkout validates that all selected seats are still in `held` status by the requesting user, and that none have expired.
- On confirmation, a booking record is created with:
  - Subtotal (sum of seat prices)
  - **Convenience Fee (2%)** calculated automatically
  - Final amount (subtotal + fee)
  - Unique `bookingRef` (format: `TKT-XXXXXXXX`)
- Individual seat records are atomically updated to `booked` status.

---

### 🎫 Booking Confirmation & QR Code Ticket

![Booking confirmed screen with QR code and full ticket details](QR_WITH_confirm_book_view.png)

*After confirming a booking, the user sees a full booking summary with a scannable QR code. The booking reference, event details, seats, subtotal, convenience fee, and total paid are all shown. The QR code links to the public verification endpoint for use by venue staff.*

- Upon booking confirmation, a **QR code** is auto-generated using the `qrcode` library.
- The QR code encodes a public verification URL: `{SERVER_URL}/api/bookings/verify/{bookingRef}`.
- Venue staff can scan the QR code to instantly verify ticket validity via the public API endpoint.

---

### 📋 My Bookings

![My Bookings page showing confirmed booking history with cancel option](user_bookings.png)

*Customers can view all past and current bookings. Each entry shows the event name, booking reference, date, time, venue, seat numbers, and total paid. Confirmed bookings have View QR Ticket and Cancel buttons.*

---

### 📧 Email Notifications (Nodemailer)

![Booking confirmation email in Gmail showing header, booking ref, and event details](mail_2.png)

![Full booking confirmation email body showing seat table, subtotal, convenience fee, total, and QR code](mail_1.png)

*The booking confirmation email is sent automatically after every booking. It includes the booking reference, event details, a per-seat breakdown table, subtotal, convenience fee (2%), total paid, and the QR code ticket embedded directly in the email (visible on all clients — Gmail, Outlook, and mobile).*

- **Booking Confirmation**: Sent automatically after every successful booking. Includes:
  - Event details (title, date, time, venue)
  - Seat breakdown table (seat number, category, price per seat)
  - Subtotal, Convenience Fee (2%), and Total Paid
  - QR Code ticket (embedded as an inline attachment via `Content-ID` for compatibility with Gmail, Outlook, and mobile clients)
  - Unique booking reference number
- **Waitlist Offer**: Notifies the next person in queue when a seat becomes available, with a time-limited claim link.
- **Cancellation Confirmation**: Sent when a booking is cancelled.
- Uses table-based HTML layout with inline styles for maximum cross-client rendering compatibility.

---

### 📋 Waitlist System

![My Waitlists page showing an active waitlist entry with queue position](user_waitlist_view.png)

*Customers can see all their active waitlist entries. Each entry shows the event, date, venue, category, and their current position in the queue.*

![Waitlist seat available email header showing "Seat Available!" with offer details](waitlist_mail1.png)

![Waitlist email showing expiry warning, "Claim Your Seat Now" button, and fallback link](waitlist_mail2.png)

*When a seat becomes available, the next person in the waitlist queue receives a time-limited email. The email shows the event details, a red expiry warning ("This offer expires in 15 minutes!"), a "Claim Your Seat Now" button, and a fallback URL for clients where buttons may not render.*

- Customers can join a **category-specific waitlist** (Premium / Standard / Economy) for sold-out events.
- When any booking is cancelled, the backend automatically:
  1. Detects affected categories.
  2. Finds the next customer in line for that category.
  3. Sends a **secure, time-limited offer email** with a JWT-signed claim link.
  4. The claim token expires after a configurable duration (`WAITLIST_OFFER_TTL_MINUTES`).
- A separate **Waitlist Expiry Cron Job** runs every 2 minutes to clean up expired offers.

---

### 📊 Dashboards

#### Organizer Dashboard

![Organizer Dashboard showing stats, events table with bookings, revenue, and occupancy](organiser_dashboard_1.png)

*The Organizer Dashboard provides a quick summary (Total Events, Published, Total Bookings, Total Revenue) and a detailed per-event analytics table showing bookings count, seats booked, remaining seats, occupancy percentage, and revenue. Organizers can create events directly from this page.*

#### Organizer – Create / Edit Event

![Create New Event form with all fields including per-category pricing](create_event.png)

*The event creation form allows organizers to enter all event details: title, type, venue, date, time, description, per-category pricing (Premium, Standard, Economy), image URL, and status (Draft / Published). The pricing fields are context-aware — categories not present in the selected venue are automatically disabled.*

#### Admin Dashboard

![Admin Dashboard showing platform-wide users, events, venues, revenue stats and recent bookings table](admin_dashboardView.png)

*The Admin Dashboard shows platform-wide metrics: Total Users, Events, Venues, and Total Revenue from sold tickets. It includes a Users by Role breakdown, Monthly Revenue chart, Recent Users table (with roles and join dates), and an Event-wise Earnings table.*

---

### 🎪 Venue Management (Admin Only)

![Venue Management page showing existing venue cards with seat categories](admin_venue_management.png)

*The Venue Management page displays all registered venues as cards, each showing the venue name, location, total capacity (rows × cols), and the seat category assignments (which rows are Premium, Standard, or Economy). Venues can be edited from this view.*

![Create New Venue form with grid dimensions and seat category row assignments](venue_addView.png)

*The Add Venue form lets admins define a venue name, address, grid dimensions (Total Rows × Seats per Row), and map row letters to categories (e.g., A,B = Premium · C,D,E,F = Standard · G,H,I,J = Economy). The total capacity is automatically calculated.*

- Create venues with:
  - Name and full address (street, city, state, country, pincode)
  - Grid dimensions (`totalRows` × `totalCols`)
  - `totalCapacity` is auto-calculated on save.
  - Seat categories (Premium / Standard / Economy) with assigned **row labels** (e.g., rows A–C = Premium, D–G = Standard, H–L = Economy).
  - Optional amenities list.

---

### 🔔 Real-time Notifications (Socket.io)

- A persistent Socket.io connection is maintained throughout the user session via a React `SocketContext`.
- Events emitted:
  - `seat:held` – when a seat is held by any user
  - `seat:booked` – when a seat is confirmed
  - `seat:released` – when a hold expires or is cancelled
  - `booking:cancelled` – for real-time UI updates on cancellations

---

## 🛠️ Technology Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | v5 | HTTP API server |
| `mongoose` | v8 | MongoDB ODM |
| `socket.io` | v4 | Real-time WebSocket events |
| `jsonwebtoken` | v9 | JWT auth (access + refresh tokens) |
| `bcryptjs` | v3 | Password hashing |
| `nodemailer` | v9 | Transactional email |
| `qrcode` | v1.5 | QR code generation |
| `node-cron` | v4 | Scheduled jobs (hold release, waitlist expiry) |
| `express-validator` | v7 | Input validation |
| `helmet` | v8 | HTTP security headers |
| `morgan` | v1 | HTTP request logging |
| `compression` | v1 | Response compression |
| `uuid` | v14 | Booking reference generation |
| `nodemon` | v3 | Dev auto-restart |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | v19 | UI framework |
| `react-router-dom` | v7 | Client-side routing |
| `axios` | v1 | HTTP API client |
| `socket.io-client` | v4 | Real-time socket connection |
| `react-hook-form` | v7 | Form state & validation |
| `react-hot-toast` | v2 | Toast notifications |
| `react-icons` | v5 | Icon library |
| `vite` | v5 | Build tool & dev server |

---

## 📂 Project Structure

```
Ticket_Booking_System/
│
├── backend/
│   ├── src/
│   │   ├── config/           # MongoDB connection, Socket.io setup
│   │   ├── controllers/      # Route handlers (auth, booking, event, seat, venue, waitlist, dashboard)
│   │   ├── jobs/             # Cron jobs
│   │   │   ├── seatHoldRelease.job.js    # Runs every 1 min – releases expired holds
│   │   │   └── waitlistExpiry.job.js     # Runs every 2 min – expires stale waitlist offers
│   │   ├── middlewares/      # JWT auth guard, role guard, error handler, validators
│   │   ├── models/           # Mongoose schemas
│   │   │   ├── User.js       # name, email, password, role (admin/organizer/customer)
│   │   │   ├── Venue.js      # Grid layout, categories, capacity
│   │   │   ├── Event.js      # Title, type, date, time, pricing per category, status
│   │   │   ├── Seat.js       # seatNumber, row, col, category, status, heldBy, holdExpiresAt
│   │   │   ├── Booking.js    # bookingRef, seats snapshot, amounts, QR code, status
│   │   │   └── Waitlist.js   # user, event, category, status, offerToken, offerExpiresAt
│   │   ├── routes/           # Express routers (auth, bookings, events, seats, venues, waitlist, dashboard)
│   │   ├── services/         # Core business logic (decoupled from controllers)
│   │   │   ├── booking.service.js
│   │   │   ├── seat.service.js
│   │   │   └── waitlist.service.js
│   │   └── utils/
│   │       ├── apiResponse.js   # Standardised success/error response helpers
│   │       ├── emailUtils.js    # Nodemailer email templates (booking, waitlist, cancellation)
│   │       ├── qrUtils.js       # QR code generation (PNG + SVG)
│   │       └── tokenUtils.js    # JWT sign/verify helpers
│   ├── server.js             # App entry point, middleware registration, cron start
│   ├── .env.example          # Environment variable template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js          # Axios instance with JWT interceptor & refresh token logic
    │   │   └── services.js       # API service functions (authAPI, eventsAPI, bookingsAPI, etc.)
    │   ├── components/
    │   │   ├── EventCard/        # Event listing card component
    │   │   ├── Navbar/           # Responsive top navigation bar
    │   │   ├── ProtectedRoute/   # Role-aware route guard component
    │   │   └── SeatMap/          # Interactive visual seat map with real-time sync
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Global auth state (user, login, logout, refresh)
    │   │   ├── SocketContext.jsx # Socket.io connection management
    │   │   └── ToastContext.jsx  # Global toast notification system
    │   ├── pages/
    │   │   ├── Auth/             # Login & Register pages
    │   │   ├── Events/           # Event browsing & search (homepage)
    │   │   ├── EventDetail/      # Event detail + seat map + hold flow
    │   │   ├── Checkout/         # Order summary + booking confirmation
    │   │   ├── Bookings/         # Booking history list + booking detail page
    │   │   ├── Dashboard/        # Organizer dashboard + Admin dashboard
    │   │   ├── Organizer/        # Create / Edit event form
    │   │   ├── Admin/            # Venue management UI
    │   │   └── Waitlist/         # Waitlist history + claim page
    │   ├── App.jsx               # Root router, layout wrapper
    │   ├── main.jsx              # React DOM entry point
    │   └── index.css             # Global design system (CSS variables, tokens, utilities)
    ├── index.html
    └── package.json
```

---

## ⚙️ Setup and Installation

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local instance or MongoDB Atlas)
- A **Gmail account** with an App Password for email (or any SMTP provider)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Dgpatil98600/Ticket_Booking_System.git
cd Ticket_Booking_System
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (copy from `.env.example`):

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/ticketmaster

JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Required to register an Admin account
ADMIN_SECRET=your_admin_registration_secret

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=TicketMaster <your_gmail@gmail.com>

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Seat hold duration in minutes (default: 5)
SEAT_HOLD_TTL_MINUTES=5

# Waitlist offer link validity in minutes (default: 15)
WAITLIST_OFFER_TTL_MINUTES=15
```

> **Gmail App Password**: Generate one at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). Do NOT use your actual Gmail password.

Start the backend:

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

The backend will start on `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`.

---

## 🔑 API Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user (customer/organizer/admin) |
| POST | `/api/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/events` | Public | List all published events |
| GET | `/api/events/:id` | Public | Get event details |
| POST | `/api/events` | Organizer/Admin | Create event |
| PUT | `/api/events/:id` | Organizer/Admin | Update event |
| GET | `/api/events/:id/seats` | Auth | Get seat map for event |
| POST | `/api/seats/hold` | Customer | Hold selected seats |
| DELETE | `/api/seats/release` | Customer | Release held seats |
| POST | `/api/bookings` | Customer | Confirm booking from held seats |
| GET | `/api/bookings/my` | Customer | Get own booking history |
| GET | `/api/bookings/:id` | Auth | Get booking details |
| DELETE | `/api/bookings/:id` | Auth | Cancel booking |
| GET | `/api/bookings/verify/:bookingRef` | Public | Verify QR ticket (for venue staff) |
| GET | `/api/venues` | Auth | List all venues |
| POST | `/api/venues` | Admin | Create venue |
| PUT | `/api/venues/:id` | Admin | Update venue |
| POST | `/api/waitlist/join` | Customer | Join event category waitlist |
| GET | `/api/waitlist/my` | Customer | Get own waitlist entries |
| POST | `/api/waitlist/claim/:token` | Customer | Claim a waitlist seat offer |
| GET | `/api/dashboard/organizer` | Organizer/Admin | Organizer analytics |
| GET | `/api/dashboard/admin` | Admin | Admin system analytics |

---

## 💡 System Design Highlights

1. **Service Layer Architecture**: Business logic is strictly separated into `services/` (e.g., `booking.service.js`, `seat.service.js`), keeping controllers thin and logic highly testable.

2. **Atomic Seat Reservations**: The seat hold and book operations use MongoDB `findOneAndUpdate` with a `status: 'available'` or `status: 'held'` + `heldBy: userId` filter, guaranteeing race-condition safety without needing Redis or distributed locks.

3. **Optimistic Real-time UI**: The seat map immediately reflects the user's own selections, while simultaneously listening to Socket.io events (`seat:held`, `seat:booked`, `seat:released`) to keep all viewers in sync — no polling required.

4. **JWT Refresh Token Flow**: The frontend Axios interceptor automatically detects `401` responses and silently attempts a token refresh before retrying the original request, keeping users logged in across browser sessions.

5. **Email-Client-Safe Emails**: All email templates use a table-based layout with full inline CSS, ensuring consistent rendering across Gmail (web + mobile app), Outlook, and other clients. QR codes are attached as inline `cid:` attachments rather than `data:` URI strings, which Gmail strips.

6. **Configurable Timers**: The seat hold duration and waitlist offer expiry are fully configurable via `.env` variables (`SEAT_HOLD_TTL_MINUTES`, `WAITLIST_OFFER_TTL_MINUTES`), requiring no code changes for deployment.

---

## 📄 License

This project was developed as part of a B.Tech academic project.

---

*TicketMaster – A complete, scalable full-stack ticket booking ecosystem.*

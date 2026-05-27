# Nexora – Discover Events Around You

![TypeScript](https://img.shields.io/badge/TypeScript-93.8%25-3178c6?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14.0-000000?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-38bdf8?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Nexora** is a modern event discovery platform designed for college students. Discover hackathons, tech fests, cultural nights, workshops, and campus events—all in one place. Built with Next.js, TypeScript, and modern web technologies.

🌐 **Live Demo:** [https://nexora-v2-taupe.vercel.app/](https://nexora-v2-taupe.vercel.app/)

---

## ✨ Key Features

- **Event Discovery**: Browse 500+ active events across 200+ partner colleges
- **Smart Search & Filtering**: Search events by keywords or filter by category
- **Event Management**: Create and manage your own campus events
- **User Authentication**: Secure sign-in with Clerk
- **Geolocation Support**: Find events near you with Mapbox integration
- **Responsive Design**: Beautiful UI optimized for all devices
- **File Uploads**: Easily upload event posters and media with UploadThing
- **Payment Integration**: Stripe support for paid events
- **Modern Animations**: Smooth interactions with Framer Motion and GSAP

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://greensock.com/gsap/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Maps**: [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) & [React Map GL](https://visgl.github.io/react-map-gl/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)

### Backend & Services
- **Database**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **File Storage**: [UploadThing](https://uploadthing.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **Webhooks**: [Svix](https://www.svix.com/)
- **Utilities**: [Query String](https://github.com/sindresorhus/query-string), [React DatePicker](https://reactdatepicker.com/), [Sonner](https://sonner.emilkowal.ski/) (toasts)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB database connection
- Clerk account (for authentication)
- Stripe account (for payments)
- UploadThing account (for file uploads)
- Mapbox account (for maps)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Zeny1303/NexoraV2.git
   cd NexoraV2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret

   # MongoDB
   MONGODB_URI=your_mongodb_connection_string

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # UploadThing
   UPLOADTHING_SECRET=your_uploadthing_secret
   UPLOADTHING_APP_ID=your_uploadthing_app_id

   # Mapbox
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

   # Webhooks
   WEBHOOK_SECRET=your_webhook_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage

### Exploring Events

1. Visit the homepage to see featured events
2. Use the search bar to find events by name or keyword
3. Filter events by category (Hackathon, Tech Fest, Workshop, etc.)
4. Click on an event card to view details
5. Register for events with a single click

### Creating an Event

1. Click **"Host an Event"** on the homepage
2. Fill in event details (name, date, location, category, description)
3. Upload event poster/media
4. Set event details and pricing (if applicable)
5. Submit to publish your event

### Managing Events

Organizers can:
- Edit event details before the event date
- Update attendee list
- View analytics and engagement metrics
- Promote events on the platform

---

## 📁 Project Structure

```
NexoraV2/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (root)/              # Main application routes
│   ├── api/                 # API routes & webhooks
│   ├── layout.tsx           # Root layout with Clerk provider
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── shared/             # Shared components
│   └── animations/         # Animation components
├── lib/                     # Utility functions
│   └── actions/            # Server actions
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
├── middleware.ts            # Clerk authentication middleware
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

---

## 🔧 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## 🔐 Authentication & Security

- **Clerk Integration**: Secure authentication with email, social login, and multi-factor authentication support
- **Middleware Protection**: API routes are protected via `middleware.ts`
- **Webhook Verification**: Clerk webhooks are verified using Svix for account synchronization

---

## 🗺️ Key Integrations

| Service | Purpose |
|---------|---------|
| **Clerk** | User authentication & management |
| **MongoDB** | Event and user data storage |
| **Stripe** | Payment processing for ticketed events |
| **UploadThing** | Secure image/file uploads for posters |
| **Mapbox** | Interactive maps showing event locations |
| **Svix** | Webhook event routing |

---

## 📝 Contributing

We welcome contributions! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows our TypeScript and Tailwind CSS conventions.

---

## 📚 Resources & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Stripe API Docs](https://stripe.com/docs/api)

---

## 🐛 Support & Issues

Have a question or found a bug? 

- **Report Issues**: [GitHub Issues](https://github.com/Zeny1303/NexoraV2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Zeny1303/NexoraV2/discussions)
- **Email**: Contact the maintainers directly

---

## 👤 Maintainer

**Zeny** – [@Zeny1303](https://github.com/Zeny1303)

---

## 📄 License

This project is licensed under the MIT License – see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful, accessible components
- **Next.js** team for an amazing framework
- All contributors and the open-source community

---

## 📊 Project Stats

- **Active Events**: 500+
- **Partner Colleges**: 200+
- **Students**: 10,000+
- **Code**: 93.8% TypeScript, 6.1% CSS, 0.1% JavaScript

---

**Happy Exploring! 🎉**

For the latest updates, visit [Nexora Live](https://nexora-v2-taupe.vercel.app/)

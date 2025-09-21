# 🔧 KTS Locksmith Management System

**Sistem complet de management pentru servicii de lăcătușărie cu sincronizare în timp real**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-green)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://www.postgresql.org/)

## 🚀 Demo Live

**🌐 [Vezi Demo Live](https://your-deployment-url.vercel.app)**

### 🔑 Credențiale Demo:
- **Admin**: `admin@kts.com` / `admin123`
- **Worker**: `robert@kts.com` / `worker123`

## ✨ Features

### 👔 **Admin Dashboard**
- ➕ Creare și gestionare jobs
- 🔄 Reatribuire lucrători în timp real
- 📊 Rapoarte financiare săptămânale
- 🔔 Sistem de notificări live
- 📍 Tracking locație lucrători
- ✅ Aprobări plăți bank transfer

### 🔧 **Worker Dashboard**
- 📱 Dashboard mobile-first
- ⚡ Sincronizare cross-browser instantanee
- 🗺️ Integrare Google Maps pentru navigație
- 💰 Tracking câștiguri și rapoarte
- 📷 Upload poze pentru finalizare jobs
- 🔔 Notificări push în timp real

### 🌐 **Cross-Browser Sync**
- 🔄 Sincronizare instantanee între browsere diferite
- 📡 Multiple sisteme de backup (BroadcastChannel + localStorage + API polling)
- ⚡ Updates în sub 3 secunde între utilizatori
- 🛡️ Sistem robust cu fallback mechanisms

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon for production)
- **Real-time**: BroadcastChannel API + localStorage events + HTTP polling
- **Authentication**: NextAuth.js ready
- **Deployment**: Vercel + Neon DB
- **Mobile**: Responsive design, PWA ready

## 🚀 Quick Start

### 1️⃣ **Clone & Install**
```bash
git clone https://github.com/yourusername/kts-website.git
cd kts-website
npm install
```

### 2️⃣ **Database Setup**
```bash
# Local PostgreSQL
createdb kts_db

# Copy environment variables
cp .env.local.example .env.local
```

### 3️⃣ **Configure Environment**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kts_db"
NEXT_PUBLIC_USE_REAL_API=false  # false for local dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### 4️⃣ **Initialize Database**
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5️⃣ **Start Development**
```bash
npm run dev
```

🎉 **Open**: http://localhost:3000

## 🌍 Production Deployment

### **Vercel + Neon DB (Recommended)**

**📋 Full guide**: [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)

1. **Database**: Create free Neon PostgreSQL
2. **Hosting**: Deploy to Vercel 
3. **Environment**: Configure production variables
4. **Domain**: Add custom domain (optional)

**💰 Cost: $0/month** (free tiers)

## 📱 Cross-Browser Testing

Testează sincronizarea în timp real:

1. **Browser 1**: Login admin → Create job cu "🌍 Test Cross-Browser"
2. **Browser 2**: Login worker → Job apare automat în 2-3 secunde
3. **Mobile**: Testează pe telefon - funcționalitate completă

## 🔧 Development

### **Commands**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run db:studio    # Prisma database GUI
npm run db:seed      # Reset & seed database
```

### **Debug Tools**
```javascript
// Browser console
window.debugKTS.syncStatus()      // Check sync status
window.debugKTS.testCrossBrowser() // Test cross-browser sync
```

## 🎯 Key Features Demo

### **Real-time Sync**
- Create job in admin → appears instantly in worker dashboard
- Cross-browser tested: Chrome, Firefox, Edge, Safari
- Mobile responsive with same functionality

### **Notification System**
- In-app toast notifications
- Job assignment alerts
- Status change notifications
- Urgent job indicators

### **Financial Tracking**  
- Weekly earnings calculation
- Bank transfer vs cash tracking
- Commission calculations
- Automated reports

## 🚨 Troubleshooting

### **Build Issues**
```bash
npm run build  # Test locally first
```

### **Database Issues**
```bash
npx prisma db push  # Force schema sync
npx prisma studio   # Visual database inspection
```

### **Sync Issues**
- Check browser console for errors
- Verify environment variables
- Test with `window.debugKTS.syncStatus()`

## 📜 License

MIT License - see [LICENSE](LICENSE) file.

---

## 🎉 **Ready to Deploy!**

**⭐ Star this repo if it helped you!**

[🚀 Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kts-website)

---

*Built with ❤️ for efficient locksmith service management*

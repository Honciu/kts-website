# 🚀 GHID COMPLET DEPLOYMENT KTS pe VERCEL

## Pas 1: Pregătire Locală

### 1.1 Creează .env.local
```bash
cp .env.local.example .env.local
```

Completează cu:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL="postgresql://postgres:password@localhost:5432/kts_db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key
```

### 1.2 Instalează PostgreSQL local (optional pentru development)
```bash
# Windows (cu Chocolatey)
choco install postgresql

# sau descarcă de la: https://www.postgresql.org/download/
```

### 1.3 Rulează migrațiile Prisma
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 1.4 Seed-uiește baza cu date inițiale
```bash
npx prisma db seed
```

## Pas 2: Configurare Neon DB (PostgreSQL Cloud)

### 2.1 Creează cont pe Neon.tech
- Merge la: https://neon.tech
- Sign up gratuit
- Creează un nou proiect "KTS-Production"

### 2.2 Obține Connection String
- Copiază DATABASE_URL din dashboard
- Va arăta ceva ca: `postgresql://user:pass@ep-xxx.neon.tech/neondb`

## Pas 3: Deploy pe Vercel

### 3.1 Creează cont Vercel
- Merge la: https://vercel.com
- Sign up cu GitHub

### 3.2 Conectează repository
- New Project -> Import from GitHub
- Selectează repository-ul kts-website

### 3.3 Configurează Environment Variables
În Vercel Dashboard -> Settings -> Environment Variables:

```
DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech/neondb
NEXTAUTH_URL = https://your-domain.vercel.app
NEXTAUTH_SECRET = your-production-secret-key-here
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
NEXT_PUBLIC_API_URL = https://your-domain.vercel.app/api
```

### 3.4 Deploy
- Apasă "Deploy"
- Vercel va rula build-ul automat
- Primești URL-ul live în ~2 minute

## Pas 4: Configurare Domeniu Custom (optional)

### 4.1 Cumpără domeniu
- Namecheap, GoDaddy, sau CloudFlare

### 4.2 Adaugă în Vercel
- Project Settings -> Domains
- Add domain
- Configurează DNS records

## Pas 5: Rulează migrațiile în producție

```bash
# Local - conectat la producție
DATABASE_URL="postgresql://production-url" npx prisma migrate deploy
```

## Pas 6: Test complet

✅ Testează:
- Login admin/worker
- Crearea joburilor
- Sincronizare cross-browser
- Notificări
- Responsive design

## Comenzi Utile

### Development
```bash
npm run dev          # Dezvoltare locală
npx prisma studio    # Database GUI
npx prisma migrate dev # Migrații locale
```

### Production  
```bash
npm run build        # Build pentru producție
npm start           # Pornește production server
```

### Database
```bash
npx prisma generate  # Regenerează client
npx prisma db push   # Push schema fără migrații
npx prisma db seed   # Populează cu date
```

## Troubleshooting

### Problema 1: Database connection failed
- Verifică DATABASE_URL în environment variables
- Asigură-te că Neon DB este activ

### Problema 2: Build failed
```bash
npm run build        # Test build local
```

### Problema 3: Environment variables nu sunt citite
- Restart deployment în Vercel
- Verifică că toate sunt setate

## Costuri Estimate

### Vercel Free Tier
- ✅ 100GB bandwidth
- ✅ Serverless Functions
- ✅ SSL certificates
- ✅ Preview deployments

### Neon Free Tier  
- ✅ 0.5GB storage
- ✅ 1 database
- ✅ Compute time included

**Total Cost: $0/lună pentru început!**

Când traficul crește:
- Vercel Pro: $20/lună
- Neon Scale: $19/lună
- **Total: ~$40/lună pentru aplicația completă**
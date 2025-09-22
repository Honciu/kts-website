# 🚀 Setup Rapid KTS - Bază de Date Online

## Pasul 1: Configurează Supabase (2 minute)

### 1.1 Creează cont Supabase
1. Mergi pe **https://supabase.com**
2. Click pe **"Start your project"** 
3. Sign up cu GitHub sau email
4. Creează un **New Project**:
   - Name: `kts-locksmith`
   - Password: alege o parolă sigură (salvează-o!)
   - Region: `Central EU` (Frankfurt)

### 1.2 Obține Connection String
1. În dashboard-ul Supabase, mergi la **Settings** → **Database**
2. Scroll down la **Connection string**
3. Selectează **URI** format
4. Copiază string-ul (va arăta ca: `postgresql://postgres:[PASSWORD]@...`)

## Pasul 2: Configurează Aplicația (1 minut)

### 2.1 Actualizează .env local
Deschide fișierul `.env` și înlocuiește:
```env
DATABASE_URL="postgresql://postgres:[TU_PAROLA]@db.[PROJECT_REF].supabase.co:5432/postgres"
NEXTAUTH_SECRET="kts-super-secret-key-minimum-32-characters-long-12345"
NEXTAUTH_URL="http://localhost:3000"
```

### 2.2 Configurează Vercel pentru Producție
1. Mergi pe **https://vercel.com/dashboard**
2. Selectează proiectul `kts-website`
3. Mergi la **Settings** → **Environment Variables**
4. Adaugă următoarele variabile:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Connection string-ul de la Supabase |
| `NEXTAUTH_SECRET` | `kts-super-secret-key-minimum-32-characters-long-12345` |
| `NEXTAUTH_URL` | URL-ul aplicației tale (ex: `https://kts-website.vercel.app`) |

## Pasul 3: Implementează Baza de Date (2 minute)

### 3.1 Rulează migrările local (pentru test)
```bash
npx prisma migrate dev --name complete_schema
npm run db:seed
```

### 3.2 Testează local
```bash
npm run dev
```
Mergi pe http://localhost:3000 și testează cu:
- **Admin**: admin@kts.com / admin123
- **Worker**: robert@kts.com / worker123

### 3.3 Deploy în producție
```bash
git add .
git commit -m "Configure production database"  
git push
```

### 3.4 Rulează migrările în producție
După ce Vercel a făcut deploy:

Opțiunea 1 - Din Vercel Dashboard:
1. Mergi la **Vercel Dashboard** → **Settings** → **Functions**
2. În **Build Command**, schimbă la:
   ```
   npx prisma migrate deploy && npx prisma db seed && npm run build
   ```

Opțiunea 2 - Din terminal (dacă ai Vercel CLI):
```bash
npx vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

## Pasul 4: Verifică Funcționalitatea (1 minut)

### 4.1 Testează Producția
1. Accesează aplicația pe Vercel: `https://your-app.vercel.app`
2. Login cu: **admin@kts.com** / **admin123**
3. Verifică:
   - ✅ Dashboard-ul afișează statistici reale
   - ✅ Pagina Employees arată lucrătorii din baza de date
   - ✅ Pagina Partners funcționează
   - ✅ Toate API-urile returnează date reale, nu mock

### 4.2 Verifică pe Mobil
- Accesează aplicația de pe telefon/tabletă
- Login și testează toate funcțiunile

## 🎉 Gata! Aplicația este LIVE!

### Credențiale pentru teste:
- **Admin**: admin@kts.com / admin123
- **Worker**: robert@kts.com / worker123

### URL-ul aplicației:
**https://your-vercel-url.vercel.app**

---

## Troubleshooting Rapid

### Eroare: "Can't reach database server"
- Verifică că DATABASE_URL este corect în .env și Vercel
- Verifică că parola din connection string este corectă

### Eroare: "Table doesn't exist"
- Rulează: `npx prisma migrate deploy` în producție
- Sau adaugă comanda în Vercel Build Command

### API returnează erori 500
- Verifică Vercel Function Logs pentru erori specifice
- Asigură-te că toate environment variables sunt configurate

### Need Help?
1. Check Vercel Function Logs
2. Check Supabase Dashboard → Logs
3. Run local cu `npm run dev` și verifică consolele
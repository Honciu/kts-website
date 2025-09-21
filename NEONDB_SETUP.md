# 🗄️ Configurarea NeonDB pentru Aplicația KTS

Acest ghid te va ajuta să conectezi aplicația Next.js la NeonDB (PostgreSQL cloud).

## 📋 Prerechizite

- Cont pe [Neon.tech](https://neon.tech)
- Node.js și npm instalate local
- Aplicația KTS clonată local

## 🎯 Pașii de configurare

### 1. Crearea bazei de date pe NeonDB

1. **Înregistrează-te pe Neon.tech:**
   - Mergi la https://neon.tech
   - Creează un cont gratuit (500MB storage gratuit)

2. **Creează un nou proiect:**
   - Click pe "Create a project"
   - Numele proiectului: `kts-website`
   - Regiunea: `Europe West` (cea mai apropiată de România)
   - PostgreSQL versiunea: `15` (cea mai recentă disponibilă)

3. **Obține connection string-ul:**
   - După crearea proiectului, vei vedea dashboard-ul
   - Click pe "Connection string"
   - Copiază string-ul care arată așa:
     ```
     postgresql://username:password@host.neon.tech:5432/dbname?sslmode=require
     ```

### 2. Configurarea locală

1. **Completează fișierul .env.local:**
   ```bash
   # Editează fișierul .env.local din rădăcina proiectului
   DATABASE_URL="postgresql://your-user:your-password@your-host.neon.tech:5432/your-db?sslmode=require"
   NEXTAUTH_SECRET="generează-un-string-aleatoriu-lung-aici"
   NEXTAUTH_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

2. **Generează un NEXTAUTH_SECRET securizat:**
   Rulează în terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### 3. Instalarea dependențelor Prisma

```bash
# Instalează Prisma CLI global (dacă nu e deja instalat)
npm install -g prisma

# Instalează dependențele din proiect
npm install
```

### 4. Rularea migrațiilor

```bash
# Generează clientul Prisma
npx prisma generate

# Rulează migrațiile pentru a crea tabelele în NeonDB
npx prisma migrate deploy

# SAU dacă e prima dată, poți folosi:
npx prisma migrate dev --name init
```

### 5. Verificarea conexiunii

```bash
# Verifică conexiunea la baza de date
npx prisma studio
```

Acest lucru va deschide Prisma Studio în browser la `http://localhost:5555` unde poți vedea tabelele create.

### 6. Seed-area bazei de date (opțional)

Dacă ai un script de seed, poți rula:
```bash
npx prisma db seed
```

## 🧪 Testarea conexiunii

1. **Pornește aplicația local:**
   ```bash
   npm run dev
   ```

2. **Verifică în consolă:**
   - Nu ar trebui să vezi erori de conexiune la baza de date
   - API-urile ar trebui să funcționeze fără erori

3. **Testează prin browser:**
   - Mergi la `http://localhost:3000`
   - Încearcă să creezi un job nou
   - Verifică dacă datele sunt salvate în NeonDB prin Prisma Studio

## 🚀 Configurarea pentru producție

Pentru deployment pe Vercel:

1. **Pe Vercel Dashboard:**
   - Mergi la Settings → Environment Variables
   - Adaugă aceleași variabile ca în `.env.local`
   - `DATABASE_URL` = connection string-ul de la NeonDB
   - `NEXTAUTH_SECRET` = același string securizat
   - `NEXTAUTH_URL` = URL-ul domeniului tău (ex: `https://yourdomain.com`)

2. **Rulează migrațiile pe producție:**
   ```bash
   # În terminal local, cu DATABASE_URL setat pentru producție:
   npx prisma migrate deploy
   ```

## ⚠️ Troubleshooting

### Eroare de conexiune
- Verifică că connection string-ul e corect în `.env.local`
- Asigură-te că ai `?sslmode=require` la final
- Verifică că baza de date e activă pe NeonDB dashboard

### Erori la migrare
- Șterge directorul `prisma/migrations` și rulează din nou
- Sau resetează baza de date: `npx prisma migrate reset`

### Performanță lentă
- NeonDB gratuit are limite (500MB, sleep după inactivitate)
- Pentru producție, consideră un plan plătit

## 📞 Suport

- [Documentația NeonDB](https://neon.tech/docs)
- [Documentația Prisma](https://www.prisma.io/docs)
- [Next.js + Prisma Tutorial](https://nextjs.org/learn/dashboard-app)
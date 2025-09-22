# Configurare Bază de Date Online pentru KTS

## Opțiunea 1: Supabase (Recomandat - Gratuit)

### 1. Creează cont și proiect pe Supabase
1. Mergi pe [supabase.com](https://supabase.com)
2. Creează cont gratuit
3. Creează un proiect nou numit "kts-locksmith"

### 2. Configurează variabilele de mediu
1. În dashboard-ul Supabase, mergi la Settings → Database
2. Copiază CONNECTION STRING (URI format)
3. În proiectul local, actualizează fișierul `.env`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Pentru Vercel (Production)
În dashboard-ul Vercel, adaugă aceste Environment Variables:
- `DATABASE_URL`: Connection string-ul de la Supabase
- `NEXTAUTH_SECRET`: Aceeași cheie secretă
- `NEXTAUTH_URL`: URL-ul aplicației tale (ex: https://your-app.vercel.app)

## Opțiunea 2: Neon Database (Alternative gratuită)

### 1. Creează cont pe Neon
1. Mergi pe [neon.tech](https://neon.tech)
2. Creează cont gratuit
3. Creează o bază de date nouă

### 2. Copiază connection string-ul
În dashboard-ul Neon, găsești CONNECTION STRING și îl folosești la fel ca la Supabase.

## Opțiunea 3: Railway (Alternative)

### 1. Creează cont pe Railway
1. Mergi pe [railway.app](https://railway.app)
2. Creează cont gratuit
3. Deploy PostgreSQL database

### 2. Configurează conexiunea
Railway îți va da CONNECTION STRING similar cu celelalte servicii.

## Pași pentru implementare:

### 1. Configurează .env local
```bash
# Actualizează .env cu connection string-ul tău
DATABASE_URL="postgresql://..."
```

### 2. Rulează migrările
```bash
npx prisma migrate reset --force
npx prisma migrate dev
```

### 3. Populează baza de date
```bash
npm run db:seed
```

### 4. Configurează Vercel
În dashboard-ul Vercel:
1. Mergi la Project Settings → Environment Variables
2. Adaugă `DATABASE_URL` cu connection string-ul tău
3. Adaugă `NEXTAUTH_SECRET` cu o cheie secretă
4. Adaugă `NEXTAUTH_URL` cu URL-ul aplicației

### 5. Deploy în producție
```bash
git add .
git commit -m "Configure online database"
git push
```

### 6. Rulează migrările în producție
După deploy, rulează în terminal:
```bash
npx prisma migrate deploy
```
Sau adaugă în Vercel Build Command:
```
npx prisma migrate deploy && npm run build
```

## Testare funcționalitate

### Local
```bash
npm run dev
# Aplicația va rula pe http://localhost:3000
```

### Production
- Accesează URL-ul Vercel
- Testează login cu: admin@kts.com / admin123
- Verifică dacă toate paginile se încarcă corect

## Credențiale de test

După seed, vei avea următorii utilizatori:
- **Admin**: admin@kts.com / admin123  
- **Worker**: robert@kts.com / worker123

## Verificare
- Dashboard-ul afișează statistici financiare reale
- Pagina de employees arată lucrătorii din baza de date
- API-urile returnează date din baza de date, nu mock data
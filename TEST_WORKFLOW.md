# 🧪 EXPERT WORKFLOW TESTING GUIDE

Acest ghid descrie cum să testezi întregul ciclu de viață al unui job în sistemul de management al lucrătorilor experți.

## 🎯 Obiectivul Testării

Verificarea completă a funcționalității:
- ✅ Creare job prin admin
- ✅ Atribuire automată către Robert (expert)
- ✅ Acceptare job de către worker
- ✅ Finalizare job cu poze și detalii
- ✅ Calcul corect al câștigurilor și comisioanelor
- ✅ Sincronizare în timp real între toate componentele

## 🚀 Metode de Testare

### 1. Test Automatizat (Recomandat)

Rulează scriptul de testare completă:

```bash
# Test complet automatizat
npm run test:workflow

# Test cu debugging detaliat
npm run test:workflow:verbose
```

**Ce face testul automatizat:**
1. 🧪 Creează un job de test cu date mock
2. 📋 Verifică că jobul apare în admin dashboard
3. 👷 Simulează acceptarea jobului de către Robert
4. ✅ Simulează finalizarea cu poze și evaluare
5. 💰 Verifică calculul corect al câștigurilor (85% pentru Robert)
6. 📊 Confirmă sincronizarea în toate componentele

### 2. Test Manual prin Interface

#### A. Test prin Admin Panel

1. **Accesează Admin Jobs**: http://localhost:3000/admin/jobs
2. **Creează Test Job**: Click pe butonul "🧪 Test Job"
3. **Confirmă crearea**: Vei primi o alertă cu detalii
4. **Verifică în tab-ul "Current"**: Jobul ar trebui să apară imediat

#### B. Test prin Worker Interface

1. **Accesează Worker Dashboard**: http://localhost:3000/worker/dashboard
2. **Login ca Robert**: Folosește credențialele pentru Robert
3. **Acceptă jobul**: Ar trebui să vezi jobul de test în lista disponibilă
4. **Finalizează jobul**: Adaugă poze mock și completează

#### C. Verificare Earnings

1. **Accesează Earnings**: http://localhost:3000/worker/earnings
2. **Verifică calculele**: 
   - Job de 500 RON → 425 RON pentru Robert (85%)
   - 75 RON comision pentru companie (15%)

### 3. Verificare Endpoints API Direct

Poți testa manual și endpoint-urile API:

```bash
# Creare job de test
curl -X POST http://localhost:3000/api/admin/create-test-job \
  -H "Content-Type: application/json"

# Verificare joburi
curl http://localhost:3000/api/jobs

# Verificare earnings pentru Robert
curl http://localhost:3000/api/workers/cmfudasin0001v090qs1frclc/earnings

# Verificare joburi completate pentru Robert
curl http://localhost:3000/api/workers/cmfudasin0001v090qs1frclc/completed-jobs
```

## 🔍 Ce să Verifici

### ✅ Criterii de Succes

1. **Job Creation**:
   - Job apare în admin dashboard în tab "Current"
   - Robert primește notificare
   - Status = "assigned"

2. **Job Acceptance**:
   - Status se schimbă în "accepted"
   - Jobul apare în worker dashboard

3. **Job Completion**:
   - Status = "completed"
   - Poze sunt salvate și vizibile
   - Data completării este înregistrată
   - Jobul se mută în tab "Past Jobs" din admin

4. **Earnings Calculation**:
   - Câștigul total pentru Robert crește cu 85% din valoarea jobului
   - Comisionul companiei: 15% din valoarea jobului
   - Numărul de joburi completate crește cu 1

5. **Real-time Sync**:
   - Schimbările sunt vizibile instantaneu în toate interfețele
   - Nu e nevoie de refresh manual

### ❌ Semne de Probleme

- Job-ul nu apare în admin după creare
- Statusul nu se actualizează
- Pozele nu se încarcă sau dau eroare 404
- Câștigurile nu se calculează corect
- Sincronizarea nu funcționează în timp real

## 🛠️ Debugging

### Server Logs

Verifică logurile din consolă pentru:
```bash
🧪 ADMIN TEST: Creating test job...
✅ Test job created successfully
📋 Admin Jobs: REAL API success
💰 Earnings calculated for worker
```

### Browser Console

În browser, verifică pentru:
- Errori de API (red în Network tab)
- Probleme de autentificare
- Erori JavaScript în Console

### Database

Verifică în Prisma Studio:
```bash
npm run db:studio
```

Tabele de verificat:
- `Job` - pentru joburi create
- `Worker` - pentru Robert
- `Notification` - pentru notificări

## 🏆 Rezultat Așteptat

După test complet, ar trebui să ai:

```
🎉 WORKFLOW TEST COMPLETED SUCCESSFULLY! 🎉
==================================================
✅ All components are working correctly:
  • Job creation ✓
  • Admin dashboard sync ✓
  • Worker job acceptance ✓
  • Job completion with photos ✓
  • Earnings calculation ✓
  • Real-time data synchronization ✓

🏆 SISTEM EXPERT FUNCTIONAL 100%! 🏆
```

## 📞 Support

În caz de probleme:
1. Verifică că serverul rulează pe http://localhost:3000
2. Confirmă că baza de date este conectată
3. Rulează `npm run db:migrate` dacă e nevoie
4. Verifică că Robert există în baza de date cu ID-ul corect
5. Contactează echipa de dezvoltare pentru debugging avansat

---

**🚀 Ready to test? Rulează `npm run test:workflow` și hai să vedem magia!**
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Curăță datele existente
  await prisma.notification.deleteMany()
  await prisma.jobUpdate.deleteMany()
  await prisma.job.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Creează utilizatori
  const adminPassword = await bcrypt.hash('admin123', 12)
  const workerPassword = await bcrypt.hash('worker123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@kts.com',
      name: 'Administrator KTS',
      phone: '+40721000000',
      type: 'ADMIN',
      password: adminPassword,
      isActive: true
    }
  })

  const worker1 = await prisma.user.create({
    data: {
      email: 'robert@kts.com', 
      name: 'Robert',
      phone: '+40721111111',
      type: 'WORKER',
      password: workerPassword,
      isActive: true
    }
  })

  const worker2 = await prisma.user.create({
    data: {
      email: 'demo@kts.com',
      name: 'Demo User', 
      phone: '+40721222222',
      type: 'WORKER',
      password: workerPassword,
      isActive: true
    }
  })

  const worker3 = await prisma.user.create({
    data: {
      email: 'lacatus01@kts.com',
      name: 'Lacatus 01',
      phone: '+40721333333', 
      type: 'WORKER',
      password: workerPassword,
      isActive: true
    }
  })

  console.log('✅ Users created:')
  console.log(`  👔 Admin: ${admin.email} / admin123`)
  console.log(`  🔧 Worker 1: ${worker1.email} / worker123`)  
  console.log(`  🔧 Worker 2: ${worker2.email} / worker123`)
  console.log(`  🔧 Worker 3: ${worker3.email} / worker123`)

  // Creează joburi sample
  const jobs = [
    {
      clientName: 'Ion Popescu',
      clientPhone: '+40721123456',
      address: 'Str. Aviatorilor nr. 15, Sector 1',
      serviceName: 'Deblocare ușă',
      serviceDescription: 'Ușa de la apartament s-a blocat și nu se deschide cu cheia',
      specialInstructions: 'Apelează înainte de sosire, apartament la etajul 3',
      assignedEmployeeId: worker1.id,
      assignedEmployeeName: worker1.name,
      status: 'ASSIGNED',
      priority: 'URGENT',
      createdById: admin.id
    },
    {
      clientName: 'Maria Ionescu', 
      clientPhone: '+40731112233',
      address: 'Bd. Unirii nr. 45',
      serviceName: 'Schimbare yală',
      serviceDescription: 'Yala veche nu mai funcționează',
      assignedEmployeeId: worker2.id,
      assignedEmployeeName: worker2.name,
      status: 'COMPLETED',
      priority: 'NORMAL',
      createdById: admin.id,
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ore în urmă
      completionData: {
        paymentMethod: 'bank_transfer',
        totalAmount: 80,
        workerCommission: 80,
        bankAccount: 'KTS',
        onlyTravelFee: true,
        workDescription: 'Client nu era acasă. Am încasat doar deplasarea.',
        photos: ['/mock-photo-1.jpg'],
      }
    },
    {
      clientName: 'Andrei Popescu',
      clientPhone: '+40744555666', 
      address: 'Str. Florilor nr. 12',
      serviceName: 'Montare broască',
      assignedEmployeeId: worker1.id,
      assignedEmployeeName: worker1.name,
      status: 'COMPLETED', 
      priority: 'NORMAL',
      createdById: admin.id,
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 zi în urmă
      completionData: {
        paymentMethod: 'card',
        totalAmount: 200,
        workerCommission: 60,
        onlyTravelFee: false,
        workDescription: 'Am montat broasca nouă și am testat funcționarea.',
        photos: ['/mock-photo-2.jpg', '/mock-photo-3.jpg'],
      }
    },
    {
      clientName: 'Elena Vasile',
      clientPhone: '+40755777888',
      address: 'Calea Victoriei nr. 85', 
      serviceName: 'Deblocare ușă metalică',
      assignedEmployeeId: worker3.id,
      assignedEmployeeName: worker3.name,
      status: 'COMPLETED',
      priority: 'HIGH',
      createdById: admin.id,
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 zile în urmă
      completionData: {
        paymentMethod: 'cash',
        totalAmount: 180,
        workerCommission: 54,
        onlyTravelFee: false,
        workDescription: 'Ușă metalică blocată, am deblocat și lubrifiat.',
        photos: ['/mock-photo-4.jpg'],
      }
    }
  ]

  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: jobData as any
    })

    // Creează notificare pentru fiecare job assignat
    if (job.status === 'ASSIGNED') {
      await prisma.notification.create({
        data: {
          type: 'JOB_ASSIGNED',
          title: '🆕 Job Nou Assignat',
          message: `Ați primit o nouă lucrare: ${job.serviceName} pentru ${job.clientName}`,
          jobId: job.id,
          workerId: job.assignedEmployeeId,
          urgent: job.priority === 'URGENT'
        }
      })
    }

    console.log(`  📋 Job created: ${job.serviceName} for ${job.clientName}`)
  }

  // Creează notificări sample pentru admin
  await prisma.notification.create({
    data: {
      type: 'JOB_COMPLETED',
      title: '🎉 Job Finalizat',
      message: 'Robert a finalizat lucrarea #1002 - Schimbare yală',
      urgent: false
    }
  })

  console.log('✅ Sample notifications created')
  console.log('🌱 Database seed completed!')
  console.log('')
  console.log('🚀 Ready to start application:')
  console.log('  npm run dev')
  console.log('')
  console.log('🔑 Login credentials:')
  console.log('  Admin: admin@kts.com / admin123')
  console.log('  Worker: robert@kts.com / worker123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
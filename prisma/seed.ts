import { PrismaClient, Role, LoanStatus, ParticipantRole, UnitStatus, ItemCondition } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  try {
    // Clear existing data (optional - hati-hati di production)
    // await clearDatabase()

    // Seed dalam urutan yang benar untuk menghindari foreign key constraint
    await seedCategories()
    await seedUsers()
    await seedProducts()
    await seedProductUnits()
    await seedLoans()
    await seedLoanItems()
    await seedLoanParticipants()
    await seedLoanRequestItems()
    await seedReports()

    console.log('✅ All seeding completed!')
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...')
  const tables = [
    'Report',
    'LoanRequestItem', 
    'LoanParticipant',
    'LoanItem',
    'Loan',
    'ProductUnit',
    'Product',
    'User',
    'Category'
  ]

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`)
  }
}

async function seedCategories() {
  console.log('📁 Seeding categories...')
  
  const categories = [
    {
      category_id: "cat-1",
      category_name: "Elektronik",
      createdAt: new Date("2025-01-15 10:00:00"),
      updatedAt: new Date("2025-01-15 10:00:00"),
    },
    {
      category_id: "cat-2",
      category_name: "Peralatan Kantor", 
      createdAt: new Date("2025-01-15 10:00:00"),
      updatedAt: new Date("2025-01-15 10:00:00"),
    },
    {
      category_id: "cat-3",
      category_name: "Furnitur",
      createdAt: new Date("2025-01-15 10:00:00"),
      updatedAt: new Date("2025-01-15 10:00:00"),
    },
    {
      category_id: "cat-4", 
      category_name: "ATK",
      createdAt: new Date("2025-01-15 10:00:00"),
      updatedAt: new Date("2025-01-15 10:00:00"),
    },
    {
      category_id: "cat-5",
      category_name: "Kendaraan",
      createdAt: new Date("2025-01-15 10:00:00"),
      updatedAt: new Date("2025-01-15 10:00:00"),
    },
    {
      category_id: "cat-6",
      category_name: "Alat Laboratorium",
      createdAt: new Date("2025-01-15 10:00:00"),
      updatedAt: new Date("2025-01-15 10:00:00"),
    }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { category_id: category.category_id },
      update: {},
      create: category,
    })
  }
  console.log(`✅ Seeded ${categories.length} categories`)
}

async function seedUsers() {
  console.log('👥 Seeding users...')
  
  // Password: "password123" yang sudah di-hash
  const hashedPassword = await hash('password123', 10)
  
  const users = [
    // Admin users
    {
      user_id: "user-admin-1",
      name: "Admin Utama",
      username: "admin",
      password: hashedPassword,
      role: Role.ADMIN,
      email: "admin@wimas.app",
      noHandphone: "081234567890",
      status: null,
      createdAt: new Date("2025-01-01 09:00:00"),
      updatedAt: new Date("2025-01-01 09:00:00"),
    },
    {
      user_id: "user-admin-2",
      name: "Manager Inventory",
      username: "manager",
      password: hashedPassword,
      role: Role.ADMIN,
      email: "manager@wimas.app",
      noHandphone: "081234567891",
      status: null,
      createdAt: new Date("2025-01-01 09:00:00"),
      updatedAt: new Date("2025-01-01 09:00:00"),
    },
    // Borrower users
    {
      user_id: "user-borrower-1", 
      name: "Budi Santoso",
      username: "budi.santoso",
      password: hashedPassword,
      role: Role.BORROWER,
      email: "budi.santoso@company.com",
      noHandphone: "081234567892",
      status: null,
      createdAt: new Date("2025-01-02 10:00:00"),
      updatedAt: new Date("2025-01-02 10:00:00"),
    },
    {
      user_id: "user-borrower-2",
      name: "Siti Rahayu", 
      password: hashedPassword,
      username: "siti.rahayu",
      role: Role.BORROWER,
      email: "siti.rahayu@company.com",
      noHandphone: "081234567893",
      status: null,
      createdAt: new Date("2025-01-02 10:00:00"),
      updatedAt: new Date("2025-01-02 10:00:00"),
    },
    {
      user_id: "user-borrower-3",
      name: "Ahmad Fauzi",
      username: "ahmad.fauzi",
      password: hashedPassword,
      role: Role.BORROWER,
      email: "ahmad.fauzi@company.com",
      noHandphone: "081234567894",
      status: LoanStatus.APPROVED,
      createdAt: new Date("2025-01-03 11:00:00"),
      updatedAt: new Date("2025-01-10 15:00:00"),
    },
    {
      user_id: "user-borrower-4",
      name: "Maya Sari",
      username: "maya.sari",
      password: hashedPassword,
      role: Role.BORROWER,
      email: "maya.sari@company.com",
      noHandphone: "081234567895",
      status: LoanStatus.REQUESTED,
      createdAt: new Date("2025-01-04 12:00:00"),
      updatedAt: new Date("2025-01-05 14:00:00"),
    }
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { user_id: user.user_id },
      update: {},
      create: user,
    })
  }
  console.log(`✅ Seeded ${users.length} users`)
}

async function seedProducts() {
  console.log('📦 Seeding products...')
  
  const products = [
    // Elektronik
    {
      product_id: "prod-laptop-1",
      product_name: "Laptop Dell XPS 13",
      product_image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      quantity: 5,
      product_avaible: 3,
      category_id: "cat-1",
      createdAt: new Date("2025-01-10 09:00:00"),
      updatedAt: new Date("2025-01-20 16:00:00"),
    },
    {
      product_id: "prod-laptop-2",
      product_name: "MacBook Pro 14-inch", 
      product_image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
      quantity: 3,
      product_avaible: 1,
      category_id: "cat-1",
      createdAt: new Date("2025-01-10 09:00:00"),
      updatedAt: new Date("2025-01-25 14:00:00"),
    },
    {
      product_id: "prod-projector-1",
      product_name: "Proyektor Epson EB-U05",
      product_image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400",
      quantity: 2,
      product_avaible: 2,
      category_id: "cat-1",
      createdAt: new Date("2025-01-11 10:00:00"),
      updatedAt: new Date("2025-01-11 10:00:00"),
    },
    // Peralatan Kantor
    {
      product_id: "prod-printer-1",
      product_name: "Printer Canon PIXMA",
      product_image: "https://images.unsplash.com/photo-1558756520-22cfe5d382ca?w=400",
      quantity: 4,
      product_avaible: 4,
      category_id: "cat-2",
      createdAt: new Date("2025-01-12 11:00:00"),
      updatedAt: new Date("2025-01-12 11:00:00"),
    },
    // Furnitur
    {
      product_id: "prod-desk-1",
      product_name: "Meja Kantor Executive",
      product_image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      quantity: 10,
      product_avaible: 8,
      category_id: "cat-3",
      createdAt: new Date("2025-01-13 12:00:00"),
      updatedAt: new Date("2025-01-22 13:00:00"),
    },
    {
      product_id: "prod-chair-1",
      product_name: "Kursi Ergonomis", 
      product_image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
      quantity: 15,
      product_avaible: 12,
      category_id: "cat-3",
      createdAt: new Date("2025-01-13 12:00:00"),
      updatedAt: new Date("2025-01-24 15:00:00"),
    },
    // ATK
    {
      product_id: "prod-whiteboard-1",
      product_name: "Whiteboard Magnetic 120x90cm",
      product_image: null,
      quantity: 6,
      product_avaible: 5,
      category_id: "cat-4",
      createdAt: new Date("2025-01-14 13:00:00"),
      updatedAt: new Date("2025-01-19 11:00:00"),
    }
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { product_id: product.product_id },
      update: {},
      create: product,
    })
  }
  console.log(`✅ Seeded ${products.length} products`)
}

async function seedProductUnits() {
  console.log('🔢 Seeding product units...')
  
  const units = [
    // Laptop Dell XPS 13 units
    {
      unit_id: "unit-laptop-dell-1",
      product_id: "prod-laptop-1",
      serialNumber: "DLXPS13001",
      status: UnitStatus.AVAILABLE,
      condition: ItemCondition.GOOD,
      note: "Baru, kondisi perfect",
      createdAt: new Date("2025-01-10 09:00:00"),
      updatedAt: new Date("2025-01-10 09:00:00"),
    },
    {
      unit_id: "unit-laptop-dell-2",
      product_id: "prod-laptop-1",
      serialNumber: "DLXPS13002",
      status: UnitStatus.LOANED,
      condition: ItemCondition.GOOD,
      note: "Sedang dipinjam",
      createdAt: new Date("2025-01-10 09:00:00"),
      updatedAt: new Date("2025-01-18 14:00:00"),
    },
    {
      unit_id: "unit-laptop-dell-3",
      product_id: "prod-laptop-1",
      serialNumber: "DLXPS13003",
      status: UnitStatus.AVAILABLE,
      condition: ItemCondition.GOOD,
      note: null,
      createdAt: new Date("2025-01-10 09:00:00"),
      updatedAt: new Date("2025-01-10 09:00:00"),
    },
    // MacBook Pro units
    {
      unit_id: "unit-macbook-1",
      product_id: "prod-laptop-2",
      serialNumber: "MBP14001",
      status: UnitStatus.LOANED,
      condition: ItemCondition.GOOD,
      note: "Dipinjam untuk presentasi",
      createdAt: new Date("2025-01-10 09:00:00"),
      updatedAt: new Date("2025-01-22 10:00:00"),
    },
    {
      unit_id: "unit-macbook-2",
      product_id: "prod-laptop-2",
      serialNumber: "MBP14002",
      status: UnitStatus.AVAILABLE,
      condition: ItemCondition.GOOD,
      note: null,
      createdAt: new Date("2025-01-10 09:00:00"),
      updatedAt: new Date("2025-01-10 09:00:00"),
    },
    // Proyektor units
    {
      unit_id: "unit-projector-1",
      product_id: "prod-projector-1",
      serialNumber: "EPSEBU05001",
      status: UnitStatus.AVAILABLE,
      condition: ItemCondition.GOOD,
      note: "Ready untuk meeting",
      createdAt: new Date("2025-01-11 10:00:00"),
      updatedAt: new Date("2025-01-11 10:00:00"),
    },
    // Printer units
    {
      unit_id: "unit-printer-1",
      product_id: "prod-printer-1",
      serialNumber: "CANPIX001",
      status: UnitStatus.AVAILABLE,
      condition: ItemCondition.GOOD,
      note: null,
      createdAt: new Date("2025-01-12 11:00:00"),
      updatedAt: new Date("2025-01-12 11:00:00"),
    }
  ]

  for (const unit of units) {
    await prisma.productUnit.upsert({
      where: { unit_id: unit.unit_id },
      update: {},
      create: unit,
    })
  }
  console.log(`✅ Seeded ${units.length} product units`)
}

async function seedLoans() {
  console.log('📋 Seeding loans...')
  
  const loans = [
    {
      loan_id: "loan-1",
      borrower_id: "user-borrower-1",
      status: LoanStatus.APPROVED,
      created_at: new Date("2025-01-18 14:00:00"),
      updated_at: new Date("2025-01-19 09:00:00"),
    },
    {
      loan_id: "loan-2",
      borrower_id: "user-borrower-2",
      status: LoanStatus.REQUESTED,
      created_at: new Date("2025-01-20 10:00:00"),
      updated_at: new Date("2025-01-20 10:00:00"),
    },
    {
      loan_id: "loan-3",
      borrower_id: "user-borrower-3",
      status: LoanStatus.RETURNED,
      created_at: new Date("2025-01-15 08:00:00"),
      updated_at: new Date("2025-01-22 16:00:00"),
    },
    {
      loan_id: "loan-4",
      borrower_id: "user-borrower-1",
      status: LoanStatus.DONE,
      created_at: new Date("2025-01-10 11:00:00"),
      updated_at: new Date("2025-01-17 14:00:00"),
    }
  ]

  for (const loan of loans) {
    await prisma.loan.upsert({
      where: { loan_id: loan.loan_id },
      update: {},
      create: loan,
    })
  }
  console.log(`✅ Seeded ${loans.length} loans`)
}

async function seedLoanItems() {
  console.log('🎯 Seeding loan items...')
  
  const loanItems = [
    {
      loan_item_id: "loan-item-1",
      loan_id: "loan-1",
      product_id: "prod-laptop-1",
      unit_id: "unit-laptop-dell-2",
    },
    {
      loan_item_id: "loan-item-2",
      loan_id: "loan-1",
      product_id: "prod-projector-1", 
      unit_id: "unit-projector-1",
    },
    {
      loan_item_id: "loan-item-3",
      loan_id: "loan-3",
      product_id: "prod-laptop-2",
      unit_id: "unit-macbook-1",
    }
  ]

  for (const item of loanItems) {
    await prisma.loanItem.upsert({
      where: { loan_item_id: item.loan_item_id },
      update: {},
      create: item,
    })
  }
  console.log(`✅ Seeded ${loanItems.length} loan items`)
}

async function seedLoanParticipants() {
  console.log('👥 Seeding loan participants...')
  
  const participants = [
    {
      id: "participant-1",
      loan_id: "loan-1",
      user_id: "user-borrower-1",
      role: ParticipantRole.OWNER,
      created_at: new Date("2025-01-18 14:00:00"),
    },
    {
      id: "participant-2", 
      loan_id: "loan-1",
      user_id: "user-borrower-2",
      role: ParticipantRole.INVITED,
      created_at: new Date("2025-01-18 15:00:00"),
    },
    {
      id: "participant-3",
      loan_id: "loan-2", 
      user_id: "user-borrower-2",
      role: ParticipantRole.OWNER,
      created_at: new Date("2025-01-20 10:00:00"),
    },
    {
      id: "participant-4",
      loan_id: "loan-3",
      user_id: "user-borrower-3", 
      role: ParticipantRole.OWNER,
      created_at: new Date("2025-01-15 08:00:00"),
    }
  ]

  for (const participant of participants) {
    await prisma.loanParticipant.upsert({
      where: { id: participant.id },
      update: {},
      create: participant,
    })
  }
  console.log(`✅ Seeded ${participants.length} loan participants`)
}

async function seedLoanRequestItems() {
  console.log('📝 Seeding loan request items...')
  
  const requestItems = [
    {
      id: "request-item-1",
      loan_id: "loan-2",
      product_id: "prod-chair-1",
      quantity: 2,
    },
    {
      id: "request-item-2",
      loan_id: "loan-2",
      product_id: "prod-desk-1", 
      quantity: 1,
    },
    {
      id: "request-item-3",
      loan_id: "loan-4",
      product_id: "prod-whiteboard-1",
      quantity: 1,
    }
  ]

  for (const item of requestItems) {
    await prisma.loanRequestItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    })
  }
  console.log(`✅ Seeded ${requestItems.length} loan request items`)
}

async function seedReports() {
  console.log('📊 Seeding reports...')
  
  const reports = [
    {
      report_id: "report-1",
      loan_id: "loan-4",
      spt_file: "https://example.com/spt/spt-001.pdf",
      spt_number: "SPT/WMAS/2025/001",
      destination: "Meeting Client PT. ABC",
      place_of_execution: "Kantor Pusat PT. ABC",
      start_date: new Date("2025-01-12 09:00:00"),
      end_date: new Date("2025-01-12 17:00:00"),
      created_at: new Date("2025-01-13 10:00:00"),
      updated_at: new Date("2025-01-13 10:00:00"),
    },
    {
      report_id: "report-2", 
      loan_id: "loan-3",
      spt_file: null,
      spt_number: "SPT/WMAS/2025/002",
      destination: "Training Internal",
      place_of_execution: "Ruang Training Lantai 5",
      start_date: new Date("2025-01-16 08:00:00"),
      end_date: new Date("2025-01-17 16:00:00"),
      created_at: new Date("2025-01-18 09:00:00"),
      updated_at: new Date("2025-01-18 09:00:00"),
    }
  ]

  for (const report of reports) {
    await prisma.report.upsert({
      where: { report_id: report.report_id },
      update: {},
      create: report,
    })
  }
  console.log(`✅ Seeded ${reports.length} reports`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
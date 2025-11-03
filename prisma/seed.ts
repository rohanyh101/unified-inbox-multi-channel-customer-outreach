import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com', 
      name: 'Regular User',
      role: 'EDITOR',
    },
  })

  console.log('👤 Created users:', { user1: user1.email, user2: user2.email })

  // Create sample contacts
  const contact1 = await prisma.contact.upsert({
    where: { id: 'contact-1' },
    update: {},
    create: {
      id: 'contact-1',
      name: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com',
      socialHandles: {
        twitter: '@johndoe',
        linkedin: 'johndoe',
      },
      createdBy: user1.id,
    },
  })

  const contact2 = await prisma.contact.upsert({
    where: { id: 'contact-2' },
    update: {},
    create: {
      id: 'contact-2',
      name: 'Jane Smith',
      phone: '+1987654321',
      email: 'jane@example.com',
      socialHandles: {
        instagram: '@janesmith',
      },
      createdBy: user1.id,
    },
  })

  const contact3 = await prisma.contact.upsert({
    where: { id: 'contact-3' },
    update: {},
    create: {
      id: 'contact-3',
      name: 'Mike Johnson',
      phone: '+1555123456',
      email: 'mike@example.com',
      createdBy: user2.id,
    },
  })

  console.log('📞 Created contacts:', { 
    contact1: contact1.name, 
    contact2: contact2.name,
    contact3: contact3.name
  })

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        contactId: contact1.id,
        content: 'Hi there! I saw your product demo and I\'m interested in learning more.',
        channel: 'SMS',
        direction: 'INBOUND',
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    }),
    prisma.message.create({
      data: {
        contactId: contact1.id,
        content: 'Thanks for reaching out! I\'d be happy to help you learn more about our product.',
        channel: 'SMS',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        authorId: user1.id,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), // 1h 55m ago
      },
    }),
    prisma.message.create({
      data: {
        contactId: contact1.id,
        content: 'That sounds great! Could you tell me more about the pricing?',
        channel: 'SMS',
        direction: 'INBOUND',
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    }),
    prisma.message.create({
      data: {
        contactId: contact2.id,
        content: 'Hello! When would be a good time for a demo call?',
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      },
    }),
    prisma.message.create({
      data: {
        contactId: contact3.id,
        content: 'Thank you for your interest in our services. Here\'s some additional information...',
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        status: 'SENT',
        authorId: user2.id,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
    }),
  ])

  console.log('💬 Created messages:', messages.length)

  // Create sample notes
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        contactId: contact1.id,
        authorId: user1.id,
        content: 'Very interested prospect. Works at a tech company with 100+ employees.',
        isPrivate: false,
      },
    }),
    prisma.note.create({
      data: {
        contactId: contact2.id,
        authorId: user1.id,
        content: 'Prefers WhatsApp communication. Timezone: PST.',
        isPrivate: true,
      },
    }),
  ])

  console.log('📝 Created notes:', notes.length)

  // Create sample scheduled messages
  const scheduledMessages = await Promise.all([
    prisma.scheduledMessage.create({
      data: {
        contactId: contact1.id,
        authorId: user1.id,
        content: 'Hi John! Just following up on our conversation about pricing.',
        channel: 'SMS',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'PENDING',
      },
    }),
    prisma.scheduledMessage.create({
      data: {
        contactId: contact2.id,
        authorId: user1.id,
        content: 'Thanks for your interest! Here\'s the calendar link for our demo.',
        channel: 'WHATSAPP',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
        status: 'PENDING',
      },
    }),
  ])

  console.log('⏰ Created scheduled messages:', scheduledMessages.length)

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { prisma } from '../lib/prisma'

/**
 * Setup script to create an admin user
 * Run this with: npx tsx scripts/setup-admin.ts user@example.com
 * Or without email to make the first user admin: npx tsx scripts/setup-admin.ts
 */

async function setupAdmin() {
  try {
    // Get email from command line argument
    const targetEmail = process.argv[2]

    // Check if any admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email)
      console.log('💡 If you want to change admin, first demote the current admin in the database.')
      return
    }

    let targetUser = null

    if (targetEmail) {
      // Find user by email
      console.log(`🔍 Looking for user with email: ${targetEmail}`)
      targetUser = await prisma.user.findUnique({
        where: { email: targetEmail }
      })

      if (!targetUser) {
        console.log(`❌ User with email "${targetEmail}" not found.`)
        console.log('💡 Make sure the user has signed up first, or check the email spelling.')
        return
      }
    } else {
      // Fallback: Get the first user and make them admin
      console.log('📧 No email provided, looking for the first user...')
      targetUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' }
      })

      if (!targetUser) {
        console.log('❌ No users found. Please sign up first, then run this script.')
        console.log('💡 Usage: npx tsx scripts/setup-admin.ts user@example.com')
        return
      }
    }

    // Check if user is already admin
    if (targetUser.role === 'ADMIN') {
      console.log('✅ User is already an admin:', targetUser.email)
      return
    }

    // Update user to admin
    const adminUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: 'ADMIN' }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', adminUser.email)
    console.log('👤 Name:', adminUser.name || 'Not set')
    console.log('🔑 Previous Role:', targetUser.role)
    console.log('🔑 New Role:', adminUser.role)
    console.log('')
    console.log('🎯 Next steps:')
    console.log('  1. Login with this email: ' + adminUser.email)
    console.log('  2. Access admin dashboard at: /dashboard/admin')
    console.log('  3. Start managing user roles!')
    console.log('')
    console.log('⚠️  Remember to delete /app/api/setup-admin/route.ts for security')

  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()

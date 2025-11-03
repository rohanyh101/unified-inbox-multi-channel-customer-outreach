import { prisma } from '../lib/prisma'

/**
 * Demote admin script to demote an admin user to editor role
 * Run this with: npx tsx scripts/demote-admin.ts user@example.com
 */

async function demoteAdmin() {
  try {
    // Get email from command line argument
    const targetEmail = process.argv[2]

    if (!targetEmail) {
      console.log('❌ Please provide an email address')
      console.log('💡 Usage: npx tsx scripts/demote-admin.ts user@example.com')
      return
    }

    // Find user by email
    console.log(`🔍 Looking for user with email: ${targetEmail}`)
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    })

    if (!targetUser) {
      console.log(`❌ User with email "${targetEmail}" not found.`)
      console.log('💡 Make sure the email is correct and the user exists.')
      return
    }

    // Check if user is currently an admin
    if (targetUser.role !== 'ADMIN') {
      console.log(`ℹ️  User "${targetEmail}" is not currently an admin.`)
      console.log(`🔑 Current role: ${targetUser.role}`)
      console.log('💡 Nothing to demote.')
      return
    }

    // Check if this is the only admin
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    if (adminCount === 1) {
      console.log('⚠️  Warning: This is the only admin user!')
      console.log('💡 Consider promoting another user to admin first to maintain system access.')
      console.log('💡 Use the setup-admin.ts script to promote another user.')
      
      // Ask for confirmation (in a real scenario, you might want to add interactive confirmation)
      console.log('')
      console.log('🤔 If you still want to proceed, this will leave the system without any admin users.')
      console.log('💡 You can re-run setup-admin.ts later to create a new admin.')
      console.log('')
      console.log('⚠️  Proceeding with demotion...')
    }

    // Update user role to EDITOR
    const demotedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: 'EDITOR' }
    })

    console.log('✅ User successfully demoted!')
    console.log('📧 Email:', demotedUser.email)
    console.log('👤 Name:', demotedUser.name || 'Not set')
    console.log('🔑 Previous Role:', targetUser.role)
    console.log('🔑 New Role:', demotedUser.role)
    console.log('')
    
    const remainingAdmins = await prisma.user.count({
      where: { role: 'ADMIN' }
    })
    
    console.log(`📊 Remaining admin users: ${remainingAdmins}`)
    
    if (remainingAdmins === 0) {
      console.log('')
      console.log('⚠️  No admin users remain!')
      console.log('🎯 To create a new admin, run: npx tsx scripts/setup-admin.ts user@example.com')
    }

  } catch (error) {
    console.error('❌ Error demoting admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

demoteAdmin()

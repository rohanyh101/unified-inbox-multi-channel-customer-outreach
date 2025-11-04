import { prisma } from '../lib/prisma'

/**
 * Setup script to promote a user to EDITOR role
 * Run this with: npx tsx scripts/setup-editor.ts user@example.com
 * Or without email to make the first user an editor: npx tsx scripts/setup-editor.ts
 */

async function setupEditor() {
  try {
    // Get email from command line argument
    const targetEmail = process.argv[2]
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
      // Fallback: Get the first user and make them editor
      console.log('📧 No email provided, looking for the first user...')
      targetUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' }
      })

      if (!targetUser) {
        console.log('❌ No users found. Please sign up first, then run this script.')
        console.log('💡 Usage: npx tsx scripts/setup-editor.ts user@example.com')
        return
      }
    }

    // Check current role
    console.log(`👤 Current user: ${targetUser.name} (${targetUser.email})`)
    console.log(`🏷️  Current role: ${targetUser.role}`)

    if (targetUser.role === 'EDITOR') {
      console.log('✅ User is already an EDITOR!')
      return
    }

    if (targetUser.role === 'ADMIN') {
      console.log('✅ User is already an ADMIN (which includes EDITOR permissions)!')
      return
    }

    // Promote to EDITOR
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: 'EDITOR' },
    })

    console.log('🎉 Success! User promoted to EDITOR role.')
    console.log(`👤 ${updatedUser.name} (${updatedUser.email}) is now an EDITOR`)
    console.log('✅ They can now create and edit notes!')

  } catch (error) {
    console.error('❌ Error promoting user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupEditor()

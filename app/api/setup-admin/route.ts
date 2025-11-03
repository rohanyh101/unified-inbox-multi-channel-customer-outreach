import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Temporary setup endpoint to create admin user
 * DELETE THIS FILE after setting up your admin!
 */
export async function POST(request: NextRequest) {
  try {
    // Check if any admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        email: existingAdmin.email
      })
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Please login first' }, { status: 401 })
    }

    // Make current user admin
    const adminUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' }
    })

    return NextResponse.json({
      message: 'You are now an admin!',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    })
  } catch (error) {
    console.error('Error setting up admin:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin' },
      { status: 500 }
    )
  }
}

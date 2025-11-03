/**
 * Utility functions for role-based permissions
 */

export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN'

export const permissions = {
  /**
   * Check if user can view content
   */
  canView: (userRole: UserRole): boolean => {
    return ['VIEWER', 'EDITOR', 'ADMIN'].includes(userRole)
  },

  /**
   * Check if user can create/edit content (messages, notes, contacts)
   */
  canEdit: (userRole: UserRole): boolean => {
    return ['EDITOR', 'ADMIN'].includes(userRole)
  },

  /**
   * Check if user has admin privileges
   */
  canAdmin: (userRole: UserRole): boolean => {
    return userRole === 'ADMIN'
  },

  /**
   * Check if user can mention others in notes
   */
  canMention: (userRole: UserRole): boolean => {
    return ['EDITOR', 'ADMIN'].includes(userRole)
  },

  /**
   * Check if user can create private notes
   */
  canCreatePrivateNotes: (userRole: UserRole): boolean => {
    return ['EDITOR', 'ADMIN'].includes(userRole)
  },

  /**
   * Check if user can schedule messages
   */
  canScheduleMessages: (userRole: UserRole): boolean => {
    return ['EDITOR', 'ADMIN'].includes(userRole)
  },

  /**
   * Check if user can export analytics
   */
  canExportAnalytics: (userRole: UserRole): boolean => {
    return ['EDITOR', 'ADMIN'].includes(userRole)
  },

  /**
   * Check if user can manage other users' roles
   */
  canManageUsers: (userRole: UserRole): boolean => {
    return userRole === 'ADMIN'
  },

  /**
   * Check if user can view all contacts or only their own
   */
  canViewAllContacts: (userRole: UserRole): boolean => {
    // Currently all users can only see their own contacts
    // This could be changed for ADMIN users if needed
    return false
  },

  /**
   * Check if user can delete content
   */
  canDelete: (userRole: UserRole, isOwner: boolean = false): boolean => {
    // Users can delete their own content, admins can delete anything
    return isOwner || userRole === 'ADMIN'
  }
}

/**
 * Get role display information
 */
export const getRoleInfo = (role: UserRole) => {
  const roleConfig = {
    VIEWER: {
      name: 'Viewer',
      description: 'Can view contacts, messages, and notes but cannot create or edit',
      color: 'gray',
      permissions: [
        'View contacts and messages',
        'Read notes and comments',
        'Access analytics dashboard'
      ],
      restrictions: [
        'Cannot create or edit content',
        'Cannot send messages',
        'Cannot manage users'
      ]
    },
    EDITOR: {
      name: 'Editor',
      description: 'Can create and edit messages, notes, and contacts',
      color: 'blue',
      permissions: [
        'All viewer permissions',
        'Create and edit notes',
        'Send messages and schedule',
        'Add and manage contacts',
        'Export analytics reports',
        'Mention team members'
      ],
      restrictions: [
        'Cannot manage user roles',
        'Cannot access admin features'
      ]
    },
    ADMIN: {
      name: 'Admin',
      description: 'Full access including user management and admin features',
      color: 'red',
      permissions: [
        'All editor permissions',
        'Manage user roles',
        'Access admin dashboard',
        'Delete any content',
        'Manage system settings'
      ],
      restrictions: []
    }
  }

  return roleConfig[role]
}

/**
 * Middleware function to check permissions in API routes
 */
export const requirePermission = (
  userRole: UserRole | undefined,
  permission: keyof typeof permissions,
  ...args: any[]
): boolean => {
  if (!userRole) return false
  
  const permissionFn = permissions[permission] as Function
  return permissionFn(userRole, ...args)
}

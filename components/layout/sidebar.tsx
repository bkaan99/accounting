'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Settings,
  Building2,
  Shield,
  UserCog,
  BarChart3,
  HelpCircle,
} from 'lucide-react'

const getUserMenuItems = (userRole?: string) => {
  const baseItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Müşteriler',
      href: '/clients',
      icon: Users,
    },
    {
      title: 'Faturalar',
      href: '/invoices',
      icon: FileText,
    },
    {
      title: 'İşlemler',
      href: '/transactions',
      icon: TrendingUp,
    },
    {
      title: 'Ayarlar',
      href: '/settings',
      icon: Settings,
    },
    {
      title: 'Yardım',
      href: '/help',
      icon: HelpCircle,
    },
  ]

  // Süperadmin için ek menüler
  if (userRole === 'SUPERADMIN') {
    baseItems.splice(
      -1,
      0,
      ...[
        {
          title: 'Kullanıcı Yönetimi',
          href: '/admin/users',
          icon: UserCog,
        },
        {
          title: 'Global İstatistikler',
          href: '/admin/stats',
          icon: BarChart3,
        },
        {
          title: 'Sistem Yönetimi',
          href: '/admin/system',
          icon: Shield,
        },
      ]
    )
  }

  return baseItems
}

interface SidebarProps {
  isCollapsed?: boolean
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const menuItems = getUserMenuItems(session?.user?.role)

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Muhasebe
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uygulaması
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

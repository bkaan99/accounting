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
  Sparkles,
} from 'lucide-react'

const getUserMenuItems = (userRole?: string) => {
  const baseItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Müşteriler',
      href: '/clients',
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Faturalar',
      href: '/invoices',
      icon: FileText,
      gradient: 'from-purple-500 to-violet-500',
    },
    {
      title: 'İşlemler',
      href: '/transactions',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Raporlar',
      href: '/reports',
      icon: BarChart3,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Ayarlar',
      href: '/settings',
      icon: Settings,
      gradient: 'from-gray-500 to-slate-500',
    },
    {
      title: 'Yardım',
      href: '/help',
      icon: HelpCircle,
      gradient: 'from-pink-500 to-rose-500',
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
          gradient: 'from-indigo-500 to-blue-500',
        },
        {
          title: 'Şirketler',
          href: '/admin/companies',
          icon: Building2,
          gradient: 'from-green-500 to-emerald-500',
        },
        {
          title: 'Global İstatistikler',
          href: '/admin/stats',
          icon: BarChart3,
          gradient: 'from-teal-500 to-cyan-500',
        },
        {
          title: 'Sistem Yönetimi',
          href: '/admin/system',
          icon: Shield,
          gradient: 'from-amber-500 to-yellow-500',
        },
      ]
    )
  }

  // Admin (şirket sahibi) için ek menüler
  if (userRole === 'ADMIN') {
    baseItems.splice(
      -1,
      0,
      ...[
        {
          title: 'Çalışan Yönetimi',
          href: '/admin/employees',
          icon: UserCog,
          gradient: 'from-green-500 to-emerald-500',
        },
        {
          title: 'Şirket İstatistikleri',
          href: '/admin/company-stats',
          icon: BarChart3,
          gradient: 'from-blue-500 to-indigo-500',
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
        'flex flex-col h-full modern-sidebar transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Muhasebe
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>Uygulaması</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white hover:shadow-md'
              )}
            >
              {/* Gradient background for active item */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl" />
              )}
              
              {/* Icon with gradient background */}
              <div className={cn(
                'relative p-2 rounded-lg transition-all duration-300',
                isActive 
                  ? `bg-gradient-to-r ${item.gradient} shadow-lg`
                  : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
              )}>
                <Icon className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                )} />
              </div>
              
              {!isCollapsed && (
                <span className="relative z-10 font-medium">{item.title}</span>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section with user info */}
      {!isCollapsed && session?.user && (
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/30">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 backdrop-blur-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {session.user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

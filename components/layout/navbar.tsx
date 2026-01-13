'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, LogOut, User, Building2, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavbarProps {
  onToggleSidebar?: () => void
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { data: session } = useSession()
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  // Logo bilgisini ayrı olarak al
  useEffect(() => {
    const fetchLogo = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setCompanyLogo(data.companyLogo || null)
        }
      } catch (error) {
        console.error('Logo alınırken hata:', error)
      }
    }

    fetchLogo()

    // Logo güncelleme eventini dinle
    const handleLogoUpdate = () => {
      fetchLogo()
    }

    window.addEventListener('logoUpdated', handleLogoUpdate)
    
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate)
    }
  }, [session?.user?.id])

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/login',
      redirect: true,
    })
  }

  return (
    <header className="h-16 modern-navbar flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden modern-button hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Şirket Logosu" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold gradient-text flex items-center space-x-3">
                <span>Hoşgeldiniz, {session?.user?.name}</span>
                {session?.user?.role === 'SUPERADMIN' && (
                  <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg">
                    Süperadmin
                  </span>
                )}
              </h2>
              {session?.user?.company && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                  <span>📍</span>
                  <span>{session.user.company}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {session?.user?.id && (
          <NotificationDropdown userId={session.user.id} />
        )}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            >
              <User className="h-4 w-4" />
              <span>{session?.user?.email}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                {session?.user?.company && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.company}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

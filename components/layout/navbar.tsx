'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { LogOut, User, Building2, ChevronDown, HelpCircle, Search, FileText, Users, DollarSign, Wallet, X, Settings, Sparkles } from 'lucide-react'
import { AppLogo } from '@/components/ui/app-logo'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface NavbarProps {
  onToggleSidebar?: () => void
  sidebarCollapsed?: boolean
}

interface SearchResult {
  invoices: Array<{
    id: string
    number: string
    amount: number
    status: string
    clientName: string
    type: 'invoice'
  }>
  clients: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    type: 'client'
  }>
  transactions: Array<{
    id: string
    transactionType: string
    category: string
    amount: number
    description?: string
    date: string
    type: 'transaction'
  }>
  cashAccounts: Array<{
    id: string
    name: string
    accountType: string
    balance: number
    description?: string
    type: 'cashAccount'
  }>
}

export function Navbar({ onToggleSidebar, sidebarCollapsed = false }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

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

  // ⌘K kısayolu için
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"][placeholder*="Ara"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Arama fonksiyonu
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length < 2) {
      setSearchResults(null)
      setIsSearchOpen(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data)
          setIsSearchOpen(true)
        }
      } catch (error) {
        console.error('Arama hatası:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/login',
      redirect: true,
    })
  }

  const handleResultClick = (type: string, id: string) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    if (type === 'invoice') {
      router.push(`/invoices/${id}`)
    } else if (type === 'client') {
      router.push(`/clients`)
    } else if (type === 'transaction') {
      router.push(`/transactions`)
    } else if (type === 'cashAccount') {
      router.push(`/cash-accounts/${id}`)
    }
  }

  const getTotalResults = () => {
    if (!searchResults) return 0
    return (
      searchResults.invoices.length +
      searchResults.clients.length +
      searchResults.transactions.length +
      searchResults.cashAccounts.length
    )
  }

  return (
    <>
      {/* Ana Navbar - Glass Effect */}
      <header className="h-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200/30 dark:border-gray-700/30 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 shadow-sm supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60">
        <div className="flex items-center space-x-6 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt="Şirket Logosu" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <AppLogo size={32} className="text-white" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">
                  Muhasebe
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Uygulaması</span>
                </p>
              </div>
            </Link>
          </div>

          {/* Arama Çubuğu - Sidebar bitişinden başlıyor */}
          <div 
            className="relative flex-1 max-w-2xl transition-all duration-300" 
            ref={searchRef}
            style={{ marginLeft: sidebarCollapsed ? '64px' : '256px' }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Ara (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.length >= 2 && searchResults) {
                    setIsSearchOpen(true)
                  }
                }}
                className="pl-10 pr-20 h-10 w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setIsSearchOpen(false)
                      setSearchResults(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Arama Sonuçları */}
            {isSearchOpen && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Aranıyor...
                  </div>
                ) : getTotalResults() === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Sonuç bulunamadı
                  </div>
                ) : (
                  <div className="p-2">
                    {/* Faturalar */}
                    {searchResults?.invoices && searchResults.invoices.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Faturalar ({searchResults.invoices.length})
                        </div>
                        {searchResults.invoices.map((invoice) => (
                          <button
                            key={invoice.id}
                            onClick={() => handleResultClick('invoice', invoice.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {invoice.number}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {invoice.clientName}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                              {formatCurrency(invoice.amount)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tedarikçiler */}
                    {searchResults?.clients && searchResults.clients.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Tedarikçiler ({searchResults.clients.length})
                        </div>
                        {searchResults.clients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => handleResultClick('client', client.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2 group"
                          >
                            <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {client.name}
                              </div>
                              {client.email && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {client.email}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* İşlemler */}
                    {searchResults?.transactions && searchResults.transactions.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          İşlemler ({searchResults.transactions.length})
                        </div>
                        {searchResults.transactions.map((transaction) => (
                          <button
                            key={transaction.id}
                            onClick={() => handleResultClick('transaction', transaction.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <DollarSign className={`h-4 w-4 flex-shrink-0 ${
                                transaction.transactionType === 'INCOME' ? 'text-green-500' : 'text-red-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {transaction.description || transaction.category}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(transaction.date)}
                                </div>
                              </div>
                            </div>
                            <div className={`text-sm font-medium ml-2 ${
                              transaction.transactionType === 'INCOME' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.transactionType === 'INCOME' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Kasalar */}
                    {searchResults?.cashAccounts && searchResults.cashAccounts.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Kasalar ({searchResults.cashAccounts.length})
                        </div>
                        {searchResults.cashAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => handleResultClick('cashAccount', account.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Wallet className="h-4 w-4 text-purple-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {account.name}
                                </div>
                                {account.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {account.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                              {formatCurrency(account.balance)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Taraf - Kullanıcı ve İkonlar */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {session?.user?.id && (
            <NotificationDropdown userId={session.user.id} />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/help')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Yardım"
            title="Yardım"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          
          {/* Kullanıcı Profili */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1.5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                  {session?.user?.company && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.company}</p>
                  )}
                  {session?.user?.role === 'SUPERADMIN' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                      Süperadmin
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span>Ayarlar</span>
              </DropdownMenuItem>
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
    </>
  )
}

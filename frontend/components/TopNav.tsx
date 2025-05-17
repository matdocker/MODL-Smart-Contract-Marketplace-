'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Moon, Sun, Menu, PlusCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useDarkMode } from '../theme/ThemeProvider'
import { RegisterTemplateModal } from '@/components/RegisterTemplateModal'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/templates', label: 'Templates' },
]

export default function TopNav() {
  const pathname = usePathname()
  const { address } = useAccount()
  const [open, setOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useDarkMode()
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('modulr-dark-mode')
    if (saved === 'true') setDarkMode(true)
  }, [])

  // Toggle & persist dark mode
  useEffect(() => {
    localStorage.setItem('modulr-dark-mode', darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <>
    <nav className="w-full fixed top-0 left-0 z-50 flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b shadow-md">
    {/* Brand + Nav */}
        <div className="flex items-center gap-6">
          <h1 className="font-bold text-lg tracking-wide text-gray-800 dark:text-white">MODULR</h1>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium hover:text-blue-600 transition',
                  pathname === item.href
                    ? 'text-blue-600 underline'
                    : 'text-gray-700 dark:text-gray-300'
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Register Template Button (desktop) */}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
            >
              <PlusCircle size={16} /> Register Template
            </button>
          </div>
        </div>

        {/* Wallet + Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {address && (
            <p className="hidden md:block text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
              {address.slice(0, 6)}…{address.slice(-4)}
            </p>
          )}

          <div className="hidden md:block">
            <ConnectButton />
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile drawer (animated) */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-14 left-0 w-full bg-white dark:bg-gray-900 border-t shadow-md md:hidden z-10 px-4 pb-3"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'text-blue-600'
                      : 'text-gray-700 dark:text-gray-300'
                  )}
                >
                  {item.label}
                </Link>
              ))}

              {/* Register Template Button (mobile) */}
              <button
                onClick={() => {
                  setShowRegisterModal(true)
                  setOpen(false)
                }}
                className="block w-full py-2 text-sm font-medium text-green-600 hover:text-green-700"
              >
                <PlusCircle size={16} className="inline mr-1" /> Register Template
              </button>

              <div className="mt-3">
                <ConnectButton />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Register Template Modal */}
      {showRegisterModal && (
        <RegisterTemplateModal onClose={() => setShowRegisterModal(false)} />
      )}
    </>
  )
}

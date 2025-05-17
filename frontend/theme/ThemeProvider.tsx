'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useThemeSync } from '@/hooks/useThemeSync'

type ThemeContextType = {
  darkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false)
  const mounted = useThemeSync()

  useEffect(() => {
    const saved = localStorage.getItem('modulr-dark-mode')
    if (saved === 'true') setDarkMode(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('modulr-dark-mode', darkMode.toString())
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode((prev) => !prev)

  if (!mounted) return null // ✅ Prevent hydration mismatch

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useDarkMode = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useDarkMode must be used within ThemeProvider')
  return context
}

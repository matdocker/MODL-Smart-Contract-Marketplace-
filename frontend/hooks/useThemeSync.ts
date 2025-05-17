'use client'

import { useState, useEffect } from 'react'

export const useThemeSync = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

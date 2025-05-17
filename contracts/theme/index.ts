// theme/index.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const overrides = {
  config,
  colors: {
    brand: {
      50: '#f5fee5',
      100: '#e1fbb2',
      // …
      900: '#1a202c',
    },
  },
}

const theme = extendTheme(overrides)
export default theme

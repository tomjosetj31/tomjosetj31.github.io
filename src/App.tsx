import { useCallback, useState } from 'react'
import { AuroraField } from './components/layout/AuroraField'
import { Footer } from './components/layout/Footer'
import { Grain } from './components/layout/Grain'
import { Nav } from './components/layout/Nav'
import { CommandPalette } from './components/palette/CommandPalette'
import { Contact } from './components/sections/Contact'
import { Credentials } from './components/sections/Credentials'
import { Hero } from './components/sections/Hero'
import { Infrastructure } from './components/sections/Infrastructure'
import { Products } from './components/sections/Products'
import { ProofStrip } from './components/sections/ProofStrip'
import { Teaching } from './components/sections/Teaching'
import { Writing } from './components/sections/Writing'
import { uiCopy } from './content/ui'
import { usePaletteShortcut } from './hooks/usePaletteShortcut'

export function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  usePaletteShortcut(openPalette)

  return (
    <>
      <a href="#main" className="skip-link">
        {uiCopy.skipToContent}
      </a>

      <AuroraField />
      <Grain />

      <div className="relative z-10">
        <Nav onOpenPalette={openPalette} />

        <main id="main">
          <Hero />
          <ProofStrip />
          <Infrastructure />
          <Products />
          <Writing />
          <Teaching />
          <Credentials />
          <Contact />
        </main>

        <Footer />
      </div>

      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </>
  )
}

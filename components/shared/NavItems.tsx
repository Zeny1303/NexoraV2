'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Home',     href: '/' },
  { label: 'Events',   href: '/events' },
  { label: 'Colleges', href: '/colleges' },
]

const NavItems = () => {
  const pathname = usePathname()

  return (
    <>
      {navLinks.map(({ label, href }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${isActive
                ? 'bg-white text-black'
                : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}

export default NavItems
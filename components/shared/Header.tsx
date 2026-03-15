import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"
import NavItems from "./NavItems"
import MobileNav from "./MobileNav"

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between
                      rounded-full border border-white/10 bg-black/40
                      backdrop-blur-md px-3 py-2 shadow-lg shadow-black/20">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 group pl-2">
          
          <span className="text-white text-sm font-semibold tracking-[0.15em] uppercase hidden sm:block">
            Nexora
          </span>
        </Link>
          
        {/* ── Center nav (desktop, signed-in only) ── */}
        <SignedIn>
          <nav className="hidden md:flex items-center gap-1
                          rounded-full border border-white/15 bg-white/8 px-2 py-1">
            <NavItems />
          </nav>
        </SignedIn>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2 pr-1">
          <SignedIn>
            <div className="flex items-center rounded-full border border-white/10 bg-white/10 px-2 py-1.5">
              <UserButton afterSignOutUrl="/" />
            </div>
            <MobileNav />
          </SignedIn>

          <SignedOut>
            <Button
              asChild
              size="sm"
              className="rounded-full border border-white/20 bg-white/10
                         px-5 text-white hover:bg-white hover:text-black
                         transition-colors backdrop-blur-md"
            >
              <Link href="/sign-in">Login</Link>
            </Button>
          </SignedOut>
        </div>

      </div>
    </header>
  )
}

export default Header
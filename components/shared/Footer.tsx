import Image from "next/image"
import Link from "next/link"

const footerLinks = {
  Platform: [
    { label: "Browse Events", href: "/events" },
    { label: "Colleges", href: "/colleges" },
    { label: "Create Event", href: "/events/create" },
    { label: "My Profile", href: "/profile" },
  ],
  Categories: [
    { label: "Hackathons", href: "/events?category=hackathon" },
    { label: "Tech Fests", href: "/events?category=tech" },
    { label: "Workshops", href: "/events?category=workshop" },
    { label: "Cultural Fests", href: "/events?category=cultural" },
  ],
}

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black/90 backdrop-blur-md text-white">

      {/* Main footer grid */}
      <div className="wrapper py-14 grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">

        {/* Brand column */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <Image
              src="/assets/images/logo.svg"
              alt="Nexora logo"
              width={28}
              height={28}
              className="invert brightness-200"
            />
            <span className="text-sm font-semibold tracking-[0.15em] uppercase text-white">
              Nexora
            </span>
          </Link>

          <p className="text-sm text-white/50 leading-relaxed max-w-[220px]">
            Discover hackathons, fests, workshops and campus events happening near you.
          </p>
        </div>

        {/* Platform links */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30">
            Platform
          </h3>
          <ul className="flex flex-col gap-2.5">
            {footerLinks.Platform.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-sm text-white/55 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories links */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30">
            Categories
          </h3>
          <ul className="flex flex-col gap-2.5">
            {footerLinks.Categories.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-sm text-white/55 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Builder / contact column */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30">
            Built by
          </h3>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-white">Sneha </p>
            <p className="text-xs text-white/40">Designer & Developer</p>
          </div>

          <ul className="flex flex-col gap-3 mt-1">
            {/* Email */}
            <li>
              <a
                href="mailto:snehakashyap9920@gmail.com"
                className="flex items-start gap-2.5 group"
              >
                <span className="mt-0.5 text-[10px] tracking-widest uppercase text-white/25 w-14 shrink-0 pt-0.5">
                  Email
                </span>
                <span className="text-xs text-white/55 group-hover:text-white transition-colors break-all">
                  snehakashyap9920@gmail.com
                </span>
              </a>
            </li>

            {/* GitHub */}
            <li>
              <a
                href="https://github.com/Zeny1303"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 group"
              >
                <span className="text-[10px] tracking-widest uppercase text-white/25 w-14 shrink-0">
                  GitHub
                </span>
                <span className="text-xs text-white/55 group-hover:text-white transition-colors">
                  Zeny1303
                </span>
              </a>
            </li>

            {/* LinkedIn */}
            <li>
              <a
                href="https://linkedin.com/in/sneha-kashyap1309"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 group"
              >
                <span className="text-[10px] tracking-widest uppercase text-white/25 w-14 shrink-0">
                  LinkedIn
                </span>
                <span className="text-xs text-white/55 group-hover:text-white transition-colors">
                  sneha-kashyap1309
                </span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8 wrapper py-5 flex flex-col sm:flex-row
                      items-center justify-between gap-3">
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} Nexora. Designed & built by Sneha .
        </p>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Terms of Use
          </Link>
        </div>
      </div>

    </footer>
  )
}

export default Footer
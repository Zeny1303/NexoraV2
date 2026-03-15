import CategoryFilter from '@/components/shared/CategoryFilter';
import Collection from '@/components/shared/Collection';
import Search from '@/components/shared/Search';
import { getAllEvents } from '@/lib/actions/event.actions';
import { SearchParamProps } from '@/types';
import Link from 'next/link';

export default async function Home({ searchParams }: SearchParamProps) {
  const page = Number(searchParams?.page) || 1;
  const searchText = (searchParams?.query as string) || '';
  const category = (searchParams?.category as string) || '';

  const events = await getAllEvents({
    query: searchText,
    category,
    page,
    limit: 6,
  });

  return (
    <main className="bg-[#0a0a0f] min-h-screen">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO — full viewport, video bg
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative h-screen w-full overflow-hidden">

        {/* Video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 h-full w-full object-cover scale-105"
        >
          <source src="/videos/dj-night.mp4" type="video/mp4" />
        </video>

        {/* Layered overlays for depth */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/40" />

        {/* Centered hero content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6 gap-8">

          {/* Eyebrow pill */}
          <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm
                           px-4 py-1.5 text-xs font-medium tracking-[0.2em] uppercase text-white/80">
            500+ Events · 200+ Colleges · 10k+ Students
          </span>

          {/* Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl md:text-[88px] font-bold
                         leading-[1.0] tracking-tight max-w-4xl">
            Discover Every
            <br />
            Event Around
            <br />
            <span className="italic text-purple-200">You.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base md:text-lg text-white/60 max-w-xl leading-relaxed">
            Hackathons, tech fests, cultural nights and workshops —
            all campus events in one place.
          </p>

          {/* CTA row */}
          <div className="flex items-center gap-4 flex-wrap justify-center mt-2">
            <Link
              href="#events"
              className="flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5
                         text-black font-semibold text-sm hover:bg-purple-100
                         transition-colors shadow-xl shadow-black/30"
            >
              Explore Events
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
            </Link>
            <Link
              href="/events/create"
              className="flex items-center gap-2 rounded-full border border-white/25
                         bg-white/10 backdrop-blur-sm px-8 py-3.5 text-white
                         font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Host an Event
            </Link>
          </div>
        </div>

        {/* Bottom fade into page bg */}
        <div className="absolute bottom-0 left-0 right-0 h-32
                        bg-gradient-to-t from-[#0a0a0f] to-transparent" />
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STATS ROW
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="wrapper py-8 grid grid-cols-3 divide-x divide-white/10">
          {[
            { num: '500+', label: 'Active Events' },
            { num: '200+', label: 'Partner Colleges' },
            { num: '10k+', label: 'Students Joined' },
          ].map(({ num, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-4">
              <span className="text-3xl md:text-4xl font-bold text-white">{num}</span>
              <span className="text-xs tracking-widest uppercase text-white/40">{label}</span>
            </div>
          ))}
        </div>
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          EVENTS SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="events" className="wrapper py-16 flex flex-col gap-10">

        {/* Section header */}
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.2em] uppercase text-purple-400 font-medium">
            What's happening
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Campus Events Near You
          </h2>
        </div>

        {/* Filters */}
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <div className="flex-1 [&_input]:bg-white/5 [&_input]:border-white/10
                          [&_input]:text-white [&_input]:placeholder:text-white/30
                          [&_input]:rounded-xl [&_input]:backdrop-blur-sm">
            <Search />
          </div>
          <div className="md:w-64 [&_select]:bg-white/5 [&_select]:border-white/10
                          [&_select]:text-white [&_select]:rounded-xl">
            <CategoryFilter />
          </div>
        </div>

        {/* Cards */}
        <Collection
          data={events?.data}
          emptyTitle="No Events Found"
          emptyStateSubtext="Check back later for upcoming campus events"
          collectionType="All_Events"
          limit={6}
          page={page}
          totalPages={events?.totalPages}
        />
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BOTTOM CTA BANNER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="wrapper py-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03]
                        backdrop-blur-sm p-10 md:p-16 flex flex-col md:flex-row
                        items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-lg">
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Organising a campus event?
            </h3>
            <p className="text-white/50 text-sm leading-relaxed">
              List your hackathon, fest, workshop or club drive on Nexora
              and reach thousands of students across India.
            </p>
          </div>
          <Link
            href="/events/create"
            className="shrink-0 rounded-full bg-white px-8 py-4 text-black
                       font-semibold text-sm hover:bg-purple-100 transition-colors
                       shadow-xl shadow-black/30"
          >
            Create Event →
          </Link>
        </div>
      </section>

    </main>
  );
}
import Collection from '@/components/shared/Collection'
import { getEventById, getRelatedEventsByCategory } from '@/lib/actions/event.actions'
import { formatDateTime } from '@/lib/utils'
import { SearchParamProps } from '@/types'
import Image from 'next/image'
import Link from 'next/link'

const EventDetails = async ({ params: { id }, searchParams }: SearchParamProps) => {
  const event = await getEventById(id)

  const relatedEvents = await getRelatedEventsByCategory({
    categoryId: event.category._id,
    eventId:    event._id,
    page:       searchParams.page as string,
  })

  const startDate = formatDateTime(event.startDateTime)
  const endDate   = formatDateTime(event.endDateTime)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-[80px]">

      {/* ── Hero ── */}
      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 'calc(45vh + 80px)', paddingTop: '80px' }}>
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-6 left-6">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold
                           bg-violet-500/20 border border-violet-500/40 text-violet-300
                           backdrop-blur-sm">
            {event.category?.name}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-4xl px-4 md:px-8 -mt-16 relative z-10 pb-20">

        {/* Title + Posted By */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            {event.title}
          </h1>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <span>Posted by</span>
            <span className="text-violet-400 font-medium">
              {event.organizer?.firstName} {event.organizer?.lastName}
            </span>
            {event.postedBy && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                ${event.postedBy === 'admin'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : event.postedBy === 'student'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                {event.postedBy}
              </span>
            )}
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

          {/* Date & Time */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Date & Time</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Image src="/assets/icons/calendar.svg" alt="calendar" width={16} height={16} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {startDate.dateOnly} · {startDate.timeOnly}
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  to {endDate.dateOnly} · {endDate.timeOnly}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Location</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Image src="/assets/icons/location.svg" alt="location" width={16} height={16} />
              </div>
              <p className="text-white text-sm font-medium leading-snug">{event.location}</p>
            </div>
          </div>

        </div>

        {/* Description */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 mb-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">About this Event</p>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>

        {/* External Link */}
        {event.url && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Event Link</p>
            <Link
              href={event.url}
              target="_blank"
              className="text-violet-400 hover:text-violet-300 text-sm underline underline-offset-4
                         transition-colors break-all"
            >
              {event.url}
            </Link>
          </div>
        )}

        {/* Organizer / Student Contact Info */}
        {event.organizerInfo?.name && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 mb-8">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-4">
              {event.postedBy === 'student' ? 'Student Contact' : 'Organizer Contact'}
            </p>
            <div className="flex flex-col gap-3">
              {/* Name */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center
                                text-violet-300 font-semibold text-sm shrink-0">
                  {event.organizerInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{event.organizerInfo.name}</p>
                  <p className="text-white/40 text-xs">{event.organizerInfo.email}</p>
                </div>
              </div>

              {/* Social links */}
              <div className="flex gap-3 mt-1">
                {event.organizerInfo.instagram && (
                  <Link
                    href={`https://instagram.com/${event.organizerInfo.instagram.replace('@','')}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               bg-pink-500/10 border border-pink-500/20
                               text-pink-400 text-xs font-medium hover:bg-pink-500/20
                               transition-colors"
                  >
                    Instagram @{event.organizerInfo.instagram.replace('@','')}
                  </Link>
                )}
                {event.organizerInfo.linkedin && (
                  <Link
                    href={event.organizerInfo.linkedin}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               bg-blue-500/10 border border-blue-500/20
                               text-blue-400 text-xs font-medium hover:bg-blue-500/20
                               transition-colors"
                  >
                    LinkedIn
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Register Button */}
        {event.url && (
          <Link
            href={event.url}
            target="_blank"
            className="flex items-center justify-center w-full h-14 rounded-2xl
                       bg-gradient-to-r from-violet-600 to-indigo-600
                       hover:from-violet-500 hover:to-indigo-500
                       text-white font-semibold text-base
                       shadow-[0_4px_32px_rgba(124,58,237,0.35)]
                       hover:shadow-[0_4px_40px_rgba(124,58,237,0.55)]
                       transition-all duration-300 mb-12"
          >
            Register for this Event →
          </Link>
        )}

        {/* Related Events */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Related Events</h2>
          <Collection
            data={relatedEvents?.data}
            emptyTitle="No Events Found"
            emptyStateSubtext="Come back later"
            collectionType="All_Events"
            limit={3}
            page={searchParams.page as string}
            totalPages={relatedEvents?.totalPages}
          />
        </div>
      </div>
    </div>
  )
}

export default EventDetails
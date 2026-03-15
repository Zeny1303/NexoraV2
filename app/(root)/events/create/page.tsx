import EventForm from "@/components/shared/EventForm"
import { auth } from "@clerk/nextjs"

const CreateEvent = () => {
  const { sessionClaims } = auth()
  const userId = sessionClaims?.userId as string

  return (
    <>
      {/* Page header */}
      <section className="relative overflow-hidden py-10 md:py-14">
        {/* Glow blob */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2
                        h-40 w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="wrapper relative z-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            Nexora Events
          </p>
          <h1 className="h2-bold text-white">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Create an Event
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Fill in the details below to publish your campus event
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="pb-20">
        <EventForm userId={userId} type="Create" />
      </div>
    </>
  )
}

export default CreateEvent
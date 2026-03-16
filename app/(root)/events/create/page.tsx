import EventForm from "@/components/shared/EventForm";
import { auth } from "@clerk/nextjs";
import { ParticleField } from "@/components/animations/ParticleField";
import { BlurReveal } from "@/components/animations/TextReveal";
import { FadeIn } from "@/components/animations/FadeIn";

const CreateEvent = () => {
  const { sessionClaims } = auth();
  const userId = sessionClaims?.userId as string;

  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-10 md:py-14">

        {/* Ambient glow blob — unchanged */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2
                        h-40 w-[600px] rounded-full bg-violet-600/10 blur-3xl" />

        {/* Floating particles behind the header */}
        <ParticleField count={22} className="absolute inset-0 pointer-events-none z-0" />

        <div className="wrapper relative z-10 text-center">

          {/* "Nexora Events" label — fades down */}
          <FadeIn direction="down" delay={0.05}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Nexora Events
            </p>
          </FadeIn>

          {/* "Create an Event" — word blur reveal */}
          <BlurReveal
            text="Create an Event"
            className="h2-bold text-white"
            delay={0.15}
            stagger={0.06}
          />

          {/* Subtitle — fades up */}
          <FadeIn direction="up" delay={0.45}>
            <p className="mt-2 text-sm text-white/40">
              Fill in the details below to publish your campus event
            </p>
          </FadeIn>

        </div>
      </section>

      {/* ── Form — slides up after header settles ─────────────────────────── */}
      <FadeIn direction="up" delay={0.55} duration={0.65}>
        <div className="pb-20">
          <EventForm userId={userId} type="Create" />
        </div>
      </FadeIn>
    </>
  );
};

export default CreateEvent;
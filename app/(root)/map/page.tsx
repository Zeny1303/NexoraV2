import EventMap from "@/components/shared/EventMap";
import { getMapEvents } from "@/lib/actions/event.actions";

export default async function MapPage() {
  const events = await getMapEvents();

  return (
    <main className="h-screen w-screen">
      <EventMap events={events} />
    </main>
  );
}
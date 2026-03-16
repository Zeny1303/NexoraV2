"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Search, MapPin, User, CalendarDays, Ticket } from "lucide-react";
import "./events.css";

// ── Animation imports ──────────────────────────────────────────────────────────
import { motion, AnimatePresence, useInView } from "framer-motion";

type EventType = {
  _id: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  startDateTime: string;
  category: { _id: string; name: string };
  organizer: { _id: string; firstName: string; lastName: string; photo: string };
  organizerInfo?: { name?: string };
};

// ── Reusable animation variants ───────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const cardVariants = {
  hidden:  { opacity: 0, y: 32, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: (i % 9) * 0.07, // stagger within view batches of 9
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

// ── Tilt + glow card wrapper ──────────────────────────────────────────────────
function AnimatedCard({
  children,
  index,
  href,
}: {
  children: React.ReactNode;
  index: number;
  href: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  // Tilt tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const nx = ((e.clientX - box.left) / box.width  - 0.5) * 14; // -7 to 7 deg
    const ny = ((e.clientY - box.top)  / box.height - 0.5) * -14;
    el.style.transform = `perspective(700px) rotateX(${ny}deg) rotateY(${nx}deg) scale(1.03)`;

    // Move glow with cursor
    const glow = el.querySelector(".card-glow") as HTMLElement | null;
    if (glow) {
      glow.style.background = `radial-gradient(circle at ${
        ((e.clientX - box.left) / box.width) * 100
      }% ${
        ((e.clientY - box.top) / box.height) * 100
      }%, rgba(124,58,237,0.35) 0%, transparent 65%)`;
      glow.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
    const glow = el.querySelector(".card-glow") as HTMLElement | null;
    if (glow) glow.style.opacity = "0";
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      custom={index}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="event-card"
      style={{ transition: "transform 0.18s ease, box-shadow 0.18s ease", transformStyle: "preserve-3d", display: "block" }}
    >
      {/* Glow overlay */}
      <div
        className="card-glow"
        style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          pointerEvents: "none", opacity: 0,
          transition: "opacity 0.3s ease",
          zIndex: 1,
        }}
      />
      {children}
    </motion.a>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events?limit=1000");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setEvents(data.events || []);
        const uniqueCategories = new Set<string>();
        data.events?.forEach((e: EventType) => {
          if (e.category?.name) uniqueCategories.add(e.category.name);
        });
        setCategories(["All", ...Array.from(uniqueCategories)]);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || event.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="events-page">

      {/* ── Header — words blur in one by one ─────────────────────────────── */}
      <header className="events-header">
        <h1 className="events-title">
          {"Discover ".split("").map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, filter: "blur(8px)", y: 8 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.03, ease: "easeOut" }}
              style={{ display: "inline-block" }}
            >
              {_ === " " ? "\u00A0" : _}
            </motion.span>
          ))}
          <motion.span
            className="events-title-accent"
            initial={{ opacity: 0, filter: "blur(12px)", x: -10 }}
            animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
            style={{ display: "inline-block" }}
          >
            Events
          </motion.span>
        </h1>

        <motion.p
          className="events-subtitle"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.65, ease: "easeOut" }}
        >
          Find the best hackathons, cultural nights, and tech workshops happening near you.
        </motion.p>
      </header>

      {/* ── Search + Filters ───────────────────────────────────────────────── */}
      <section className="events-filters-container">
        <motion.div
          className="events-search"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75, ease: "easeOut" }}
        >
          <Search className="events-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by title, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        <AnimatePresence>
          {!isLoading && categories.length > 1 && (
            <motion.div
              className="events-categories"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.85 }}
            >
              {categories.map((cat, i) => (
                <motion.button
                  key={cat}
                  className={`events-category-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.9 + i * 0.06 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  {cat}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main>
        {isLoading ? (
          // Skeleton — pulse animation via CSS (unchanged)
          <div className="events-grid">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="skeleton-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="skeleton skeleton-img"></div>
                <div className="skeleton-content">
                  <div className="skeleton skeleton-text short"></div>
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text medium"></div>
                  <div className="skeleton skeleton-text medium"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          // ── Event cards — staggered tilt cards ──────────────────────────
          <AnimatePresence mode="popLayout">
            <motion.div
              className="events-grid"
              key={`${searchQuery}-${selectedCategory}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {filteredEvents.map((event, index) => (
                <AnimatedCard key={event._id} index={index} href={`/events/${event._id}`}>
                  <div className="event-card-img-wrap">
                    <Image
                      src={event.imageUrl}
                      alt={event.title}
                      fill
                      className="event-card-img"
                    />
                    {event.category?.name && (
                      <span className="event-category-pill">{event.category.name}</span>
                    )}
                  </div>

                  <div className="event-card-content">
                    <div className="event-date">
                      <CalendarDays size={16} />
                      {formatDateTime(new Date(event.startDateTime)).dateTime}
                    </div>
                    <h3 className="event-title">{event.title}</h3>
                    <div className="event-meta">
                      <div className="event-meta-item">
                        <User size={16} className="event-meta-icon" />
                        <span>
                          {event.organizerInfo?.name ||
                            (event.organizer
                              ? `${event.organizer.firstName} ${event.organizer.lastName}`
                              : "Unknown Organizer")}
                        </span>
                      </div>
                      {event.location && (
                        <div className="event-meta-item">
                          <MapPin size={16} className="event-meta-icon" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          // ── Empty state ──────────────────────────────────────────────────
          <motion.div
            className="events-empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Ticket size={48} className="events-empty-icon" />
            <h3 className="events-empty-title">No events found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const MAP_HOTSPOTS = [
  {
    id: "profile",
    label: "PROFILE",
    title: "Castle",
    href: "#about",
    x: 57,
    y: 18,
    w: 18,
    h: 22,
    command: "STATUS",
    description: "Current focus, operating style, and what I am building.",
  },
  {
    id: "career",
    label: "CAREER",
    title: "Mountain Trail",
    href: "#career",
    x: 42,
    y: 42,
    w: 22,
    h: 22,
    command: "JOURNEY",
    description: "Career path, leadership history, and platform operations experience.",
  },
  {
    id: "projects",
    label: "PROJECTS",
    title: "Blacksmith",
    href: "#projects",
    x: 23,
    y: 57,
    w: 20,
    h: 23,
    command: "QUESTS",
    description: "AI tools, automation workflows, dashboards, and practical experiments.",
  },
  {
    id: "resources",
    label: "RESOURCES",
    title: "Library",
    href: "#resources",
    x: 62,
    y: 59,
    w: 19,
    h: 22,
    command: "ITEMS",
    description: "Books, tools, people, media, and useful references.",
  },
  {
    id: "contact",
    label: "CONTACT",
    title: "Castle Gate",
    href: "#contact",
    x: 78,
    y: 67,
    w: 15,
    h: 20,
    command: "MESSAGE",
    description: "Email, LinkedIn, and simple ways to connect.",
  },
];

const WORLDS = [
  {
    id: "about",
    command: "STATUS",
    title: "Profile",
    image: "/images/nes/castle.png",
    alt: "Pixel art castle hall for the profile section",
    body: "Technology leader, AI explorer, and builder of systems. I like practical tools, capable teams, clear thinking, and work that improves how people operate.",
    items: [
      "Current focus: AI agents and automation",
      "Operating style: calm, structured, practical",
      "Direction: better systems for work and life",
    ],
  },
  {
    id: "career",
    command: "JOURNEY",
    title: "Career Path",
    image: "/images/nes/mountain-trail.png",
    alt: "Pixel art mountain trail for the career section",
    body: "20+ years leading global platform operations, cloud platforms, and high-performing teams at scale. The trail runs through infrastructure, operations, leadership, and transformation.",
    items: [
      "Global platform operations",
      "Cloud and infrastructure leadership",
      "Team building through complex change",
    ],
  },
  {
    id: "projects",
    command: "QUESTS",
    title: "Projects",
    image: "/images/nes/blacksmith.png",
    alt: "Pixel art blacksmith workshop for the projects section",
    body: "This is where rough ideas get forged into working systems. The current bench includes AI assistants, automation workflows, health tools, and commerce experiments.",
    items: [
      "AI Coach and personal operating systems",
      "Comments Clinic GPT and creator tools",
      "Automation, dashboards, and practical experiments",
    ],
  },
  {
    id: "resources",
    command: "ITEMS",
    title: "Resources",
    image: "/images/nes/library.png",
    alt: "Pixel art library shelves for the resources section",
    body: "A curated inventory of books, tools, people, and media that sharpen judgment, creativity, systems thinking, and health.",
    items: ["Books", "Tools", "People", "Media"],
  },
];

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jasonweaver/", short: "in" },
  { label: "X", href: "https://x.com/weaverswigglers", short: "X" },
  { label: "Email", href: "mailto:emailweaver@gmail.com", short: "@" },
];

function PixelButton({ href, children, variant = "gold" }: { href: string; children: React.ReactNode; variant?: "gold" | "blue" }) {
  const variantClass =
    variant === "gold"
      ? "border-[#f6d365] bg-[#3b250a] text-[#fff5bf] hover:bg-[#5a390f] focus-visible:ring-[#f6d365]"
      : "border-[#8ec5ff] bg-[#102a56] text-[#dff1ff] hover:bg-[#183d78] focus-visible:ring-[#8ec5ff]";

  return (
    <Link
      href={href}
      className={`pixel-button inline-flex min-h-11 items-center justify-center border-2 px-5 py-3 text-xs font-bold tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] ${variantClass}`}
    >
      {children}
    </Link>
  );
}

function DialogueBox({ command, title, children }: { command: string; title: string; children: React.ReactNode }) {
  return (
    <div className="nes-panel border-4 border-[#f8f4d8] bg-[#07101f]/95 p-5 text-[#fff8d8] shadow-[0_0_0_4px_#101828,0_16px_0_rgba(0,0,0,0.35)] md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#f8f4d8]/40 pb-3">
        <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#f6d365]">{command}</p>
        <p className="font-mono text-[10px] tracking-[0.14em] text-[#8ec5ff]">A: SELECT&nbsp;&nbsp;B: BACK</p>
      </div>
      <h2 className="pixel-heading mb-4 text-2xl leading-tight text-white md:text-4xl">{title}</h2>
      {children}
    </div>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onStart();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStart]);

  return (
    <button
      type="button"
      onClick={onStart}
      className="group relative flex min-h-[100dvh] w-full cursor-pointer items-center justify-center overflow-hidden bg-[#050816] px-4 py-10 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#f6d365]"
      aria-label="Press Enter or click to start the website"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,110,180,0.35),transparent_42%),linear-gradient(180deg,#060a18,#03040a)]" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="relative mx-auto aspect-[4/3] overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <img
            src="/images/nes/title-screen.png"
            alt="WEAVER NES title screen with Jason's hero sprite facing a distant castle"
            className="h-full w-full object-cover pixel-art"
          />
          <div className="absolute inset-x-0 bottom-[9%] text-center">
            <p className="pixel-heading animate-pulse text-xl leading-none text-[#fff5bf] drop-shadow-[0_3px_0_#111827] md:text-4xl">
              PRESS START
            </p>
            <p className="mt-3 font-mono text-[10px] tracking-[0.18em] text-[#d9e8ff] md:text-xs">
              CLICK ANYWHERE OR PRESS ENTER
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function MapHub() {
  return (
    <section id="hub" className="min-h-screen scroll-mt-0 bg-[#050816] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#f6d365] md:text-xs">WORLD MAP</p>
            <h1 className="pixel-heading mt-2 text-3xl leading-none text-white md:text-6xl">Choose Your World</h1>
          </div>
          <p className="max-w-md font-mono text-xs leading-5 text-[#9fb4c7] md:text-sm">
            Hover, focus, or tap a landmark. Each object is a real link into the site.
          </p>
        </div>

        <div className="relative overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <img src="/images/nes/village.png" alt="Interactive pixel art village world map" className="block aspect-[4/3] w-full object-cover pixel-art" />

          {MAP_HOTSPOTS.map((spot) => (
            <Link
              key={spot.id}
              href={spot.href}
              aria-label={`${spot.label}: ${spot.description}`}
              className="group absolute rounded-sm border-2 border-[#f6d365]/0 bg-[#f6d365]/0 outline-none transition-all duration-150 hover:border-[#f6d365] hover:bg-[#f6d365]/15 focus-visible:border-[#f6d365] focus-visible:bg-[#f6d365]/20 focus-visible:ring-4 focus-visible:ring-[#f6d365]/40"
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
            >
              <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-[#f6d365] bg-[#07101f]/85 font-mono text-[10px] font-bold text-[#fff5bf] shadow-[0_0_0_2px_#101828] md:h-9 md:w-9">
                !
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-56 -translate-x-1/2 border-4 border-[#f8f4d8] bg-[#07101f]/95 p-3 text-left opacity-100 shadow-[0_0_0_3px_#101828,0_10px_0_rgba(0,0,0,0.35)] transition md:w-72 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                <span className="mb-1 block font-mono text-[10px] font-bold tracking-[0.16em] text-[#f6d365]">{spot.command}</span>
                <span className="pixel-heading mb-1 block text-sm text-white md:text-base">{spot.label}: {spot.title}</span>
                <span className="block text-xs leading-5 text-[#d9e8ff] md:text-sm">{spot.description}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:hidden">
          {MAP_HOTSPOTS.map((spot) => (
            <Link key={spot.id} href={spot.href} className="border-2 border-[#496895] bg-[#101a33] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]">
              <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#f6d365]">{spot.command}</p>
              <p className="mt-1 font-bold text-white">{spot.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#c5d9ff]">{spot.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorldSection({ world, reverse = false }: { world: (typeof WORLDS)[number]; reverse?: boolean }) {
  return (
    <section id={world.id} className="scroll-mt-8 px-5 py-14 md:px-10 md:py-24 lg:px-16">
      <div className={`mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="scene-frame aspect-[4/3] w-full overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_18px_0_rgba(0,0,0,0.35)]">
          <img src={world.image} alt={world.alt} className="h-full w-full object-cover pixel-art" />
        </div>
        <DialogueBox command={world.command} title={world.title}>
          <p className="mb-5 max-w-[64ch] text-base leading-7 text-[#f4e7bd] md:text-lg">{world.body}</p>
          <ul className="mb-6 grid gap-2 text-sm leading-6 text-[#d9e8ff] md:text-base">
            {world.items.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-[#f6d365]">&gt;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <PixelButton href="#hub">BACK TO MAP</PixelButton>
        </DialogueBox>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <footer id="contact" className="scroll-mt-8 px-5 py-16 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <DialogueBox command="SEND MESSAGE" title="Castle Gate">
          <p className="mb-6 text-base leading-7 text-[#f4e7bd] md:text-lg">
            If you want to compare notes, talk about a role, discuss a project, or send a signal flare, this is the right door.
          </p>
          <div className="flex flex-wrap gap-3">
            <PixelButton href="mailto:emailweaver@gmail.com">EMAIL</PixelButton>
            <PixelButton href="https://www.linkedin.com/in/jasonweaver/" variant="blue">LINKEDIN</PixelButton>
            <PixelButton href="https://x.com/weaverswigglers" variant="blue">X</PixelButton>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#f8f4d8]/30 pt-5">
            <p className="font-mono text-xs tracking-[0.12em] text-[#8ca6d9]">© 2026 JASON WEAVER</p>
            <Link href="#hub" className="font-mono text-xs font-bold tracking-[0.14em] text-[#f6d365] hover:text-white">
              BACK TO MAP
            </Link>
          </div>
        </DialogueBox>
      </div>
    </footer>
  );
}

export default function Home() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) {
      window.requestAnimationFrame(() => {
        document.getElementById("hub")?.focus({ preventScroll: true });
        document.getElementById("hub")?.scrollIntoView({ block: "start" });
      });
    }
  }, [started]);

  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <MapHub />
      {WORLDS.map((world, index) => (
        <WorldSection key={world.id} world={world} reverse={index % 2 === 1} />
      ))}
      <ContactSection />
    </main>
  );
}

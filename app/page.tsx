"use client";

import { useEffect, useState } from "react";

type ScreenId = "status" | "journey" | "quests" | "library" | "contact";
type ViewState = "start" | "map" | ScreenId;

type Hotspot = {
  id: ScreenId;
  label: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  description: string;
};

type World = {
  id: ScreenId;
  title: string;
  image: string;
  alt: string;
  panelPosition: string;
  body: string;
  items: string[];
};

const MAP_HOTSPOTS: Hotspot[] = [
  {
    id: "status",
    label: "CASTLE",
    title: "CASTLE",
    x: 50,
    y: 24,
    w: 15,
    h: 15,
    description: "Current focus, operating style, and what I am building.",
  },
  {
    id: "journey",
    label: "JOURNEY",
    title: "JOURNEY",
    x: 47,
    y: 34,
    w: 16,
    h: 23,
    description: "Career path, leadership history, and platform operations experience.",
  },
  {
    id: "quests",
    label: "BLACKSMITH",
    title: "BLACKSMITH",
    x: 70,
    y: 42,
    w: 22,
    h: 35,
    description: "AI tools, automation workflows, dashboards, and practical experiments.",
  },
  {
    id: "library",
    label: "VILLAGE LIBRARY",
    title: "VILLAGE LIBRARY",
    x: 5,
    y: 39,
    w: 18,
    h: 39,
    description: "Books, tools, people, media, and useful references.",
  },
  {
    id: "contact",
    label: "WEAVER'S HOUSE",
    title: "WEAVER'S HOUSE",
    x: 24,
    y: 36,
    w: 19,
    h: 36,
    description: "Email, LinkedIn, and simple ways to connect.",
  },
];

const WORLDS: World[] = [
  {
    id: "status",
    title: "STATUS",
    image: "/images/nes/castle.png",
    alt: "Pixel art castle hall for the status section",
    panelPosition: "md:bottom-8 md:right-8",
    body: "Technology leader, AI explorer, and builder of systems. I like practical tools, capable teams, clear thinking, and work that improves how people operate.",
    items: [
      "Current focus: AI agents and automation",
      "Operating style: calm, structured, practical",
      "Direction: better systems for work and life",
    ],
  },
  {
    id: "journey",
    title: "JOURNEY",
    image: "/images/nes/mountain-trail.png",
    alt: "Pixel art mountain trail for the journey section",
    panelPosition: "md:bottom-8 md:left-8",
    body: "20+ years leading global platform operations, cloud platforms, and high-performing teams at scale. The trail runs through infrastructure, operations, leadership, and transformation.",
    items: [
      "Global platform operations",
      "Cloud and infrastructure leadership",
      "Team building through complex change",
    ],
  },
  {
    id: "quests",
    title: "QUESTS",
    image: "/images/nes/blacksmith.png",
    alt: "Pixel art blacksmith workshop for the quests section",
    panelPosition: "md:bottom-8 md:right-8",
    body: "This is where rough ideas get forged into working systems. The current bench includes AI assistants, automation workflows, health tools, and commerce experiments.",
    items: [
      "AI Coach and personal operating systems",
      "Comments Clinic GPT and creator tools",
      "Automation, dashboards, and practical experiments",
    ],
  },
  {
    id: "library",
    title: "LIBRARY",
    image: "/images/nes/library.png",
    alt: "Pixel art library shelves for the library section",
    panelPosition: "md:bottom-8 md:left-8",
    body: "A curated inventory of books, tools, people, and media that sharpen judgment, creativity, systems thinking, and health.",
    items: ["Books", "Tools", "People", "Media"],
  },
  {
    id: "contact",
    title: "WEAVER'S HOUSE",
    image: "/images/nes/weavers-house.png",
    alt: "Pixel art interior of Weaver's House for the contact section",
    panelPosition: "md:bottom-8 md:right-8",
    body: "If you want to compare notes, talk about a role, discuss a project, or send a signal flare, this is the right room.",
    items: ["Email: emailweaver@gmail.com", "LinkedIn: jasonweaver", "X: @weaverswigglers"],
  },
];

function PixelLink({ href, children, variant = "gold" }: { href: string; children: React.ReactNode; variant?: "gold" | "blue" }) {
  const variantClass =
    variant === "gold"
      ? "border-[#f6d365] bg-[#3b250a] text-[#fff5bf] hover:bg-[#5a390f] focus-visible:ring-[#f6d365]"
      : "border-[#8ec5ff] bg-[#102a56] text-[#dff1ff] hover:bg-[#183d78] focus-visible:ring-[#8ec5ff]";

  return (
    <a
      href={href}
      className={`pixel-button inline-flex min-h-11 items-center justify-center border-2 px-5 py-3 text-xs font-bold tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] ${variantClass}`}
    >
      {children}
    </a>
  );
}

function PixelAction({ href, children, onNavigate }: { href: string; children: React.ReactNode; onNavigate?: () => void }) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      className="pixel-button inline-flex min-h-11 items-center justify-center border-2 border-[#f6d365] bg-[#3b250a] px-5 py-3 text-xs font-bold tracking-[0.16em] text-[#fff5bf] transition-colors hover:bg-[#5a390f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
    >
      {children}
    </a>
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
        <div className="relative mx-auto aspect-[4/3] w-[min(100%,calc((100dvh-5rem)*4/3))] overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <img
            src="/images/nes/title-screen.png"
            alt="WEAVER NES title screen with Jason's hero sprite facing a distant castle"
            className="h-full w-full object-cover pixel-art"
          />
          <div className="absolute inset-x-0 bottom-[5.5%] text-center">
            <p className="press-start-text press-start-flash text-3xl leading-none text-white md:text-[3.35rem]">
              PRESS START
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function MapHub({ onSelect }: { onSelect: (screen: ScreenId) => void }) {
  return (
    <section className="screen-stage bg-[#050816] px-4 py-5 md:px-8 md:py-8">
      <div className="screen-transition mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-7xl flex-col justify-center md:min-h-[calc(100dvh-4rem)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="pixel-heading text-3xl leading-none text-white md:text-6xl">EXPLORE MY WORLD</h1>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-[min(100%,calc((100dvh-12rem)*4/3))] overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <img src="/images/nes/village.png" alt="Interactive pixel art village world map" className="block h-full w-full object-cover pixel-art" />
          <p className="pointer-events-none absolute bottom-5 left-1/2 max-w-72 -translate-x-1/2 text-center font-mono text-[10px] font-bold leading-4 tracking-[0.1em] text-[#fff8d8]/95 drop-shadow-[0_2px_0_rgba(0,0,0,0.95)] md:bottom-6 md:max-w-md md:text-[13px]">
            Hover, focus, or tap a landmark.
          </p>

          {MAP_HOTSPOTS.map((spot) => (
            <button
              type="button"
              key={spot.id}
              onClick={() => onSelect(spot.id)}
              aria-label={`${spot.label}: ${spot.description}`}
              className="group absolute rounded-sm outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#f8f4d8]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
            >
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-56 -translate-x-1/2 border-4 border-[#f8f4d8] bg-[#07101f]/95 p-3 text-left opacity-0 shadow-[0_0_0_3px_#101828,0_10px_0_rgba(0,0,0,0.35)] transition group-hover:opacity-100 group-focus-visible:opacity-100 md:w-72">
                <span className="pixel-heading mb-2 block text-lg leading-none text-[#f6d365] md:text-2xl">{spot.title}</span>
                <span className="block text-xs leading-5 text-[#d9e8ff] md:text-sm">{spot.description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:hidden">
          {MAP_HOTSPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => onSelect(spot.id)}
              className="border-2 border-[#496895] bg-[#101a33] p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]"
            >
              <p className="pixel-heading text-base text-white">{spot.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#c5d9ff]">{spot.description}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorldScreen({ world, onBack }: { world: World; onBack: () => void }) {
  return (
    <section className="screen-stage bg-[#050816] px-4 py-5 md:px-8 md:py-8">
      <div className="screen-transition mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-7xl items-center md:min-h-[calc(100dvh-4rem)]">
        <div className="relative mx-auto aspect-[4/3] w-[min(100%,calc((100dvh-2.5rem)*4/3))] overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <img src={world.image} alt={world.alt} className="block h-full w-full object-cover pixel-art" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(3,4,10,0.72)_100%)] md:bg-[radial-gradient(circle_at_78%_78%,rgba(3,4,10,0.76),transparent_44%),linear-gradient(180deg,transparent_45%,rgba(3,4,10,0.45)_100%)]" />

          <div className={`relative z-10 md:absolute ${world.panelPosition} md:w-[min(43rem,48%)]`}>
            <div className="nes-panel border-t-4 border-[#f8f4d8] bg-[#07101f]/95 p-5 text-[#fff8d8] shadow-[0_-4px_0_#101828] md:border-4 md:p-7 md:shadow-[0_0_0_4px_#101828,0_16px_0_rgba(0,0,0,0.35)]">
              <h2 className="pixel-heading mb-4 text-3xl leading-tight text-white md:text-5xl">{world.title}</h2>
              <p className="mb-5 max-w-[64ch] text-base leading-7 text-[#f4e7bd] md:text-lg">{world.body}</p>
              <ul className="mb-6 grid gap-2 text-sm leading-6 text-[#d9e8ff] md:text-base">
                {world.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[#f6d365]">&gt;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {world.id === "contact" ? (
                <div className="mb-6 flex flex-wrap gap-3">
                  <PixelLink href="mailto:emailweaver@gmail.com">EMAIL</PixelLink>
                  <PixelLink href="https://www.linkedin.com/in/jasonweaver/" variant="blue">LINKEDIN</PixelLink>
                  <PixelLink href="https://x.com/weaverswigglers" variant="blue">X</PixelLink>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#f8f4d8]/30 pt-5">
                <PixelAction href="#map" onNavigate={onBack}>RETURN TO VILLAGE</PixelAction>
                {world.id === "contact" ? (
                  <p className="font-mono text-xs tracking-[0.12em] text-[#8ca6d9]">© 2026 JASON WEAVER</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [view, setView] = useState<ViewState>("start");

  useEffect(() => {
    function readHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash === "map") {
        setView("map");
        return;
      }

      if (WORLDS.some((world) => world.id === hash)) {
        setView(hash as ScreenId);
      }
    }

    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  function goTo(nextView: Exclude<ViewState, "start">) {
    window.location.hash = nextView;
    setView(nextView);
  }

  const activeWorld = WORLDS.find((world) => world.id === view);

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      {view === "start" ? <StartScreen onStart={() => goTo("map")} /> : null}
      {view === "map" ? <MapHub onSelect={goTo} /> : null}
      {activeWorld ? <WorldScreen key={activeWorld.id} world={activeWorld} onBack={() => goTo("map")} /> : null}
    </main>
  );
}

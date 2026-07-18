"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

type VillagePoint = { x: number; y: number };

const VILLAGE_START: VillagePoint = { x: 50.5, y: 78 };

const WALK_ROUTES: Record<ScreenId, VillagePoint[]> = {
  status: [
    { x: 53, y: 70 },
    { x: 55, y: 58 },
    { x: 56, y: 44 },
  ],
  journey: [
    { x: 52, y: 69 },
    { x: 51, y: 59 },
    { x: 52, y: 48 },
  ],
  quests: [
    { x: 62, y: 76 },
    { x: 75, y: 75 },
    { x: 88, y: 69 },
  ],
  library: [
    { x: 42, y: 77 },
    { x: 29, y: 76 },
    { x: 16, y: 70 },
  ],
  contact: [
    { x: 44, y: 76 },
    { x: 38, y: 73 },
    { x: 36, y: 69 },
  ],
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
    title: "CASTLE",
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
    title: "BLACKSMITH",
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
    items: ["Email: emailweaver@gmail.com", "LinkedIn: jasonweaver"],
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

function RaisedSwordOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="title-raised-sword"
      viewBox="0 0 64 168"
      preserveAspectRatio="xMidYMax meet"
    >
      <g className="title-sword-sprite">
        <path d="M28 147h16v12H28z" fill="#251512" />
        <path d="M24 139h24v10H24z" fill="#f6d365" />
        <path d="M29 133h14v7H29z" fill="#1c2444" />
        <path d="M34 8h8v125h-8z" fill="#f8f4d8" />
        <path d="M42 16h5v117h-5z" fill="#a9c9ed" />
        <path d="M29 16h5v117h-5z" fill="#ffffff" />
        <path d="M34 0h8v8h-8z" fill="#ffffff" />
        <path d="M42 8h5v8h-5z" fill="#d7dbea" />
        <path d="M24 149h24v7H24z" fill="#8e5528" />
        <path d="M28 156h16v12H28z" fill="#4b2a1c" />
      </g>
      <g className="title-sword-sparkles" fill="#fffde3">
        <path d="M38 4l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        <path d="M12 48l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <path d="M57 43l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
      </g>
    </svg>
  );
}

function StartScreen({ onEnter }: { onEnter: () => void }) {
  const [isStarting, setIsStarting] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    startButtonRef.current?.focus();
  }, []);

  function begin() {
    if (isStarting) return;

    setIsStarting(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(onEnter, reducedMotion ? 0 : 680);
  }

  return (
    <section className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#050816] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,110,180,0.35),transparent_42%),linear-gradient(180deg,#060a18,#03040a)]" />
      <div className="relative z-10 w-full max-w-6xl">
        <div
          className={`title-scene relative mx-auto aspect-[4/3] w-[min(100%,calc((100dvh-5rem)*4/3))] overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)] ${isStarting ? "is-starting" : ""}`}
        >
          <img
            src="/images/nes/title-screen.png"
            alt="WEAVER title screen: Jason stands before a distant castle."
            className="h-full w-full object-cover pixel-art"
          />
          <RaisedSwordOverlay />
          <div className="title-gleam" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-[5.5%] text-center">
            <button
              type="button"
              ref={startButtonRef}
              onClick={begin}
              autoFocus
              disabled={isStarting}
              className="press-start-text press-start-flash min-h-11 px-5 text-3xl leading-none text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f8f4d8] disabled:cursor-wait disabled:opacity-0 md:text-[3.35rem]"
              aria-describedby="start-help"
            >
              PRESS START
            </button>
            <p id="start-help" className="sr-only">
              Press Enter, Space, or activate this button to enter Jason Weaver&apos;s portfolio.
            </p>
          </div>
          <p className="sr-only" aria-live="polite">
            {isStarting ? "Jason raises his sword. Entering the village." : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

function VillageJason({ point, isWalking }: { point: VillagePoint; isWalking: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`village-jason ${isWalking ? "is-walking" : ""}`}
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <Image
        src="/images/nes/jason-village-sprite.png"
        alt=""
        width={76}
        height={95}
        sizes="8vw"
        className="block h-auto w-full pixel-art"
      />
    </div>
  );
}

function MapHub({ onSelect }: { onSelect: (screen: ScreenId) => void }) {
  const [destination, setDestination] = useState<ScreenId | null>(null);
  const [routeStep, setRouteStep] = useState(0);
  const [wellIsActive, setWellIsActive] = useState(false);
  const route = destination ? WALK_ROUTES[destination] : null;
  const isTravelling = route !== null;
  const point = route ? route[Math.min(routeStep, route.length - 1)] : VILLAGE_START;

  useEffect(() => {
    if (!destination || !route) return;

    const cancelTravelIfHashChanges = () => {
      if (window.location.hash !== `#${destination}`) {
        setDestination(null);
        setRouteStep(0);
      }
    };
    window.addEventListener("hashchange", cancelTravelIfHashChanges);

    if (routeStep < route.length - 1) {
      const timer = window.setTimeout(() => setRouteStep((current) => current + 1), 280);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("hashchange", cancelTravelIfHashChanges);
      };
    }

    const timer = window.setTimeout(() => onSelect(destination), 360);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", cancelTravelIfHashChanges);
    };
  }, [destination, onSelect, route, routeStep]);

  function travelTo(screen: ScreenId) {
    if (isTravelling) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onSelect(screen);
      return;
    }

    window.history.replaceState(null, "", `#${screen}`);
    setDestination(screen);
    setRouteStep(0);
  }

  function drawWater() {
    if (isTravelling) return;
    setWellIsActive(true);
    window.setTimeout(() => setWellIsActive(false), 1100);
  }

  return (
    <section className="screen-stage bg-[#050816] px-4 py-5 md:px-8 md:py-8">
      <div className="screen-transition mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-7xl flex-col justify-center md:min-h-[calc(100dvh-4rem)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="pixel-heading text-3xl leading-none text-white md:text-6xl">EXPLORE MY WORLD</h1>
            <p className="mt-3 text-sm text-[#c5d9ff]" aria-live="polite">
              {destination ? `Jason is travelling to ${MAP_HOTSPOTS.find((spot) => spot.id === destination)?.label}.` : "Choose a landmark and Jason will lead the way."}
            </p>
          </div>
        </div>

        <div className="village-scene relative mx-auto aspect-[4/3] w-[min(100%,calc((100dvh-12rem)*4/3))] overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <img src="/images/nes/village.png" alt="Interactive pixel art village world map" className="block h-full w-full object-cover pixel-art" />
          <div className="ambient-cloud ambient-cloud-one" aria-hidden="true" />
          <div className="ambient-cloud ambient-cloud-two" aria-hidden="true" />
          <div className="chimney-smoke" aria-hidden="true"><i /><i /><i /></div>
          <div className="castle-flag" aria-hidden="true" />
          <div className="forge-glow" aria-hidden="true" />
          <div className="torch-glow torch-library" aria-hidden="true" />
          <div className="torch-glow torch-blacksmith" aria-hidden="true" />
          <VillageJason point={point} isWalking={isTravelling} />

          <button
            type="button"
            onClick={drawWater}
            disabled={isTravelling}
            aria-label="Draw water from the village well"
            className={`well-interaction ${wellIsActive ? "is-drawing" : ""}`}
          >
            <span className="sr-only">{wellIsActive ? "The bucket lowers and returns with water." : "Draw water from the village well."}</span>
            <span aria-hidden="true" className="well-bucket" />
          </button>

          {MAP_HOTSPOTS.map((spot) => (
            <button
              type="button"
              key={spot.id}
              onClick={() => travelTo(spot.id)}
              disabled={isTravelling}
              aria-label={`${spot.label}: ${spot.description}`}
              className="group absolute rounded-sm outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#f8f4d8]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] disabled:cursor-wait"
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
              disabled={isTravelling}
              onClick={() => travelTo(spot.id)}
              className="border-2 border-[#496895] bg-[#101a33] p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365] disabled:cursor-wait disabled:opacity-60"
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
          {world.id === "quests" ? <div className="forge-interior-embers" aria-hidden="true"><i /><i /><i /></div> : null}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(3,4,10,0.72)_100%)] md:bg-[radial-gradient(circle_at_78%_78%,rgba(3,4,10,0.76),transparent_44%),linear-gradient(180deg,transparent_45%,rgba(3,4,10,0.45)_100%)]" />

          <div className={`relative z-10 md:absolute ${world.panelPosition} md:w-[min(43rem,48%)]`}>
            <div className="nes-panel dialogue-panel border-t-4 border-[#f8f4d8] bg-[#07101f]/95 p-5 text-[#fff8d8] shadow-[0_-4px_0_#101828] md:border-4 md:p-7 md:shadow-[0_0_0_4px_#101828,0_16px_0_rgba(0,0,0,0.35)]">
              <div className="dialogue-titlebar mb-4 flex items-center justify-between gap-3 text-[0.65rem] font-bold tracking-[0.18em] text-[#f6d365]">
                <span>LOCATION DOSSIER</span>
                <span aria-hidden="true">◆</span>
              </div>
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
      {view === "start" ? <StartScreen onEnter={() => goTo("map")} /> : null}
      {view === "map" ? <MapHub onSelect={goTo} /> : null}
      {activeWorld ? <WorldScreen key={activeWorld.id} world={activeWorld} onBack={() => goTo("map")} /> : null}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

import { LIBRARY_BOOKS, SHELF_ORDER } from "./data/library";
import villageGlows from "./data/village-glows.json";
import villageSky from "./data/village-sky.json";

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

type BookEntry = {
  title: string;
  author: string;
  note: string;
};

type BookSection = {
  heading: string;
  books: BookEntry[];
};

// The Library shelves are built from app/data/library.json, which mirrors the
// `Show on site` rows of the Infinite Bookshelf sheet. Shelves stay in
// SHELF_ORDER; an empty shelf is dropped rather than rendered as a bare heading.
const LIBRARY_SECTIONS: BookSection[] = SHELF_ORDER.map((heading) => ({
  heading,
  books: LIBRARY_BOOKS.filter((book) => book.shelf === heading).map((book) => ({
    title: book.title,
    author: book.author,
    note: book.why,
  })),
})).filter((section) => section.books.length > 0);

type World = {
  id: ScreenId;
  title: string;
  image: string;
  alt: string;
  panelPosition: string;
  body: string;
  items?: string[];
  sections?: BookSection[];
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
    image: "/images/nes/castle.webp",
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
    image: "/images/nes/mountain-trail.webp",
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
    image: "/images/nes/blacksmith.webp",
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
    image: "/images/nes/library.webp",
    alt: "Pixel art library shelves for the library section",
    panelPosition: "md:bottom-8 md:left-8",
    body: "Books worth your time, organized by what they're good for. Tools, people, and media are coming soon.",
    sections: LIBRARY_SECTIONS,
  },
  {
    id: "contact",
    title: "WEAVER'S HOUSE",
    image: "/images/nes/weavers-house.webp",
    alt: "Pixel art interior of Weaver's House for the contact section",
    panelPosition: "md:bottom-8 md:right-8",
    body: "If you want to compare notes, talk about a role, discuss a project, or send a signal flare, this is the right room.",
    items: ["Email: emailweaver@gmail.com", "LinkedIn: jasonweaver"],
  },
];

const TITLE_SWORD_SEQUENCE = [
  "/images/nes/title-scene/sword-raise/sword-raise-0.webp", // sword lowered
  "/images/nes/title-scene/sword-raise/raise-mid-1.webp", // low raise
  "/images/nes/title-scene/sword-raise/raise-mid-2.webp", // high raise
  "/images/nes/title-scene/sword-raise/sword-raise-2.webp", // apex
  "/images/nes/title-scene/sword-raise/sword-raise-4.webp", // apex + gleam
  "/images/nes/title-scene/sword-raise/sword-raise-5.webp", // apex + full gleam
  // The raised sword makes the name shine: a highlight sweeps L→R over the gold.
  "/images/nes/title-scene/gold-sweep/gold-sweep-0.webp",
  "/images/nes/title-scene/gold-sweep/gold-sweep-1.webp",
  "/images/nes/title-scene/gold-sweep/gold-sweep-2.webp",
  "/images/nes/title-scene/gold-sweep/gold-sweep-3.webp",
  "/images/nes/title-scene/gold-sweep/gold-sweep-4.webp",
  "/images/nes/title-scene/gold-sweep/gold-sweep-5.webp",
  "/images/nes/title-scene/gold-sweep/gold-sweep-6.webp",
  "/images/nes/title-scene/gold-sweep/gold-sweep-7.webp", // shine gone, held
] as const;

// Quick raise (down → low → high → apex), a readable gleam, a beat on the
// gleaming sword, then a fast shine sweeping across the WEAVER gold, then a
// held beat before entering. Per-frame milliseconds.
const TITLE_SWORD_FRAME_DURATIONS = [
  130, 130, 130, 150, 120, 300, 70, 70, 70, 70, 70, 70, 70, 900,
] as const;

// Ambient idle loop shown before PRESS START: the river shimmers (the flag is
// left crisp and static). Frame 0 is the calm baseline used as the LCP image.
const TITLE_AMBIENT_SEQUENCE = [
  "/images/nes/title-scene/ambient/ambient-0.webp",
  "/images/nes/title-scene/ambient/ambient-1.webp",
  "/images/nes/title-scene/ambient/ambient-2.webp",
  "/images/nes/title-scene/ambient/ambient-3.webp",
  "/images/nes/title-scene/ambient/ambient-4.webp",
  "/images/nes/title-scene/ambient/ambient-5.webp",
] as const;
const TITLE_AMBIENT_FRAME_MS = 170;

// Baked bottom band (prompt + credit), authored by scripts/build_title_prompt_band.py
// at the artwork's native 1448px width. Compositing it as one more `pixel-art`
// layer keeps the type on the same pixel grid as the scene frames at every
// viewport, which DOM text over pixel art can never be.
const TITLE_PROMPT_BAND = "/images/nes/title-scene/prompt-band/prompt-band.webp";
const TITLE_PROMPT_BAND_DIM = "/images/nes/title-scene/prompt-band/prompt-band-dim.webp";

// The prompt blinks the way it always did: a two-state pulse, half the cycle
// lit and half dim. Both states are baked bands that differ only in the ink of
// the PRESS START line, so the credit, the ground and the dithered top edge
// never move — and because they are stacked layers we cross-cut them by
// opacity, exactly like the scene frames, rather than filtering type at runtime.
const TITLE_PROMPT_BLINK_MS = 450;

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReducedMotion(motionPreference.matches);
    syncMotionPreference();
    motionPreference.addEventListener("change", syncMotionPreference);
    return () => motionPreference.removeEventListener("change", syncMotionPreference);
  }, []);

  return reducedMotion;
}

// Ambient glow loops on the village map. Each one is a small rebuilt patch of
// the painting rather than a whole new field, so several can run at once for a
// few KB each. Both the frames and this manifest come out of
// scripts/build_village_ambient.py in one pass: the patches are measured off
// the artwork, so their placement has to be written by whatever cut them
// rather than copied here by hand. `box` is a percentage of the painting,
// which is exact because the painting and the frame share one 4:3 ratio.
type AmbientGlow = {
  name: string;
  frames: number;
  frameMs: number;
  box: { left: string; top: string; width: string; height: string };
};

const VILLAGE_GLOWS = villageGlows as AmbientGlow[];

// The sky's moving parts. The artwork is drawn with an empty sky and empty
// chimneys on purpose, so nothing has to be cut out of it and nothing has to
// be painted over: the clouds are sprites laid on top, and the smoke is drawn
// from scratch. Placements come from scripts/build_village_clouds.py and
// scripts/build_village_smoke.py. The smoke rides the same frame-loop
// component as the forge and the lanterns.
type DriftingCloud = {
  name: string;
  seconds: number;
  box: { left: string; top: string; width: string; height: string };
};

const VILLAGE_CLOUDS = villageSky.clouds as DriftingCloud[];
const VILLAGE_SMOKE = villageSky.smoke as AmbientGlow[];

function DriftingCloudLayer({ cloud }: { cloud: DriftingCloud }) {
  // Two copies, one painting-width apart, inside a box that slides exactly one
  // painting width per cycle: as the leading copy leaves on the right its twin
  // arrives on the left, so the loop has no seam and no snap-back. The slide
  // is stepped once per artwork pixel rather than run smoothly, which keeps
  // the cloud on the pixel grid instead of smearing across it.
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="cloud-drift absolute inset-0" style={{ animationDuration: `${cloud.seconds}s` }}>
        <img src={`/images/nes/village-scene/${cloud.name}.webp`} alt="" className="absolute pixel-art" style={cloud.box} decoding="async" />
        <img
          src={`/images/nes/village-scene/${cloud.name}.webp`}
          alt=""
          className="absolute pixel-art"
          style={{ ...cloud.box, left: `calc(${cloud.box.left} - 100%)` }}
          decoding="async"
        />
      </div>
    </div>
  );
}

function glowFrameSrc(name: string, index: number) {
  return `/images/nes/village-scene/${name}-${index}.webp`;
}

function AmbientGlowLayer({ glow }: { glow: AmbientGlow }) {
  const [frame, setFrame] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % glow.frames);
    }, glow.frameMs);
    return () => window.clearInterval(timer);
  }, [reducedMotion, glow.frames, glow.frameMs]);

  // Every frame is rendered as its own stacked layer and switched by opacity,
  // the same way the title sequence works: swapping one <img>'s src would show
  // a blank gap on the first pass through the loop while the next frame
  // decodes. Frame 0 is the painting's own light, so a visitor who never sees
  // the loop start sees exactly what was painted.
  return (
    <div className="pointer-events-none absolute" style={glow.box} aria-hidden="true">
      {Array.from({ length: glow.frames }, (_, index) => (
        <img
          key={index}
          src={glowFrameSrc(glow.name, index)}
          alt=""
          className="absolute inset-0 h-full w-full pixel-art"
          style={{ opacity: (reducedMotion ? 0 : frame) === index ? 1 : 0 }}
          decoding="async"
        />
      ))}
    </div>
  );
}

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
  const [sequenceFrame, setSequenceFrame] = useState<number | null>(null);
  const [ambientFrame, setAmbientFrame] = useState(0);
  const [promptLit, setPromptLit] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const isEntering = sequenceFrame !== null;
  // Hold the prompt lit whenever it is not pulsing, so a paused blink always
  // rests on the readable state rather than wherever the timer left it.
  const promptIsLit = promptLit || reducedMotion || isEntering;

  useEffect(() => {
    // Nothing animates under reduced motion, so there is nothing to preload.
    // Otherwise fetch AND decode every frame (ambient loop + sword sequence) up
    // front: the frames render as stacked layers, so once decoded, switching
    // which one is visible is instant with no load/decode flash.
    if (reducedMotion) return;

    const images = [...TITLE_AMBIENT_SEQUENCE, ...TITLE_SWORD_SEQUENCE, TITLE_PROMPT_BAND_DIM].map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });
    void Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  }, [reducedMotion]);

  useEffect(() => {
    // Gently loop the ambient title frames until the sword sequence begins.
    if (reducedMotion || isEntering) return;
    const timer = window.setInterval(() => {
      setAmbientFrame((frame) => (frame + 1) % TITLE_AMBIENT_SEQUENCE.length);
    }, TITLE_AMBIENT_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, isEntering]);

  useEffect(() => {
    // Pulse the prompt while the title waits. Once the sword is raising, the
    // visitor has already pressed start, so the prompt holds lit (see
    // `promptIsLit`) rather than nagging through the sequence.
    if (reducedMotion || isEntering) return;
    const timer = window.setInterval(() => {
      setPromptLit((lit) => !lit);
    }, TITLE_PROMPT_BLINK_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, isEntering]);

  useEffect(() => {
    if (sequenceFrame === null) return;
    const timer = window.setTimeout(() => {
      if (sequenceFrame === TITLE_SWORD_SEQUENCE.length - 1) {
        onStart();
        return;
      }
      setSequenceFrame(sequenceFrame + 1);
    }, TITLE_SWORD_FRAME_DURATIONS[sequenceFrame]);
    return () => window.clearTimeout(timer);
  }, [onStart, sequenceFrame]);

  function enterWorld() {
    if (isEntering) return;
    if (reducedMotion) {
      onStart();
      return;
    }
    setSequenceFrame(0);
  }

  return (
    <button
      type="button"
      onClick={enterWorld}
      disabled={isEntering}
      className="group relative flex min-h-[100dvh] w-full cursor-pointer items-center justify-center overflow-hidden bg-[#050816] px-0 py-10 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#f6d365] disabled:cursor-wait sm:px-4"
      aria-label={isEntering ? "Jason raises his sword" : "Press Enter or click to start the website"}
    >
      {/* Surround light, anchored to the artwork rather than to the viewport.
          The frame is centred in this box (items-center + mx-auto), so
          `at 50% 50%` is the frame's own centre: the light radiates out of the
          picture and falls off symmetrically above and below it. The old
          `at 50% 20%` put the brightest thing on a phone screen ~120px above
          the frame and left the bottom third of the viewport dead black, while
          on desktop its whole radius sat behind the opaque frame and did
          nothing at all. The base gradient is symmetric about the same
          centreline so the two halves of the surround match. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_62%_at_50%_50%,rgba(56,110,180,0.38),rgba(45,86,142,0.20)_45%,rgba(56,110,180,0)_100%),linear-gradient(180deg,#03040a,#070c1c_50%,#03040a)]" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="relative mx-auto aspect-[4/3] w-[min(100%,calc((100dvh-5rem)*4/3))] overflow-hidden border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          {/* Ambient title loop (before start): waving flag + shimmering river.
              Only the active frame is opaque, and only while not entering. */}
          {TITLE_AMBIENT_SEQUENCE.map((ambientSrc, index) => (
            <img
              key={ambientSrc}
              src={ambientSrc}
              alt={index === 0 ? "WEAVER NES title screen with Jason's hero sprite facing a distant castle" : ""}
              aria-hidden={index === 0 ? undefined : true}
              className="absolute inset-0 h-full w-full object-cover pixel-art"
              style={{ opacity: !isEntering && ambientFrame === index ? 1 : 0 }}
              fetchPriority={index === 0 ? "high" : "low"}
              decoding="async"
            />
          ))}
          {/* Sword-raise frames stacked on top; only the active one is opaque.
              No src swapping means no blank flash between frames. */}
          {TITLE_SWORD_SEQUENCE.map((frameSrc, index) => (
            <img
              key={frameSrc}
              src={frameSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover pixel-art"
              style={{ opacity: sequenceFrame === index ? 1 : 0 }}
              decoding="async"
            />
          ))}
          {/* Credit + prompt, stacked last so the type sits above every scene
              frame. It is a full-field transparent layer, registered to the
              same box as the art, carrying nothing but the two lines and the
              halo they stand on — no ground, so the river keeps shimmering
              underneath. The type itself never moves; only the PRESS START ink
              alternates between the two baked variants, and the dim layer sits
              under the lit one so fading the lit one out reveals it without
              ever letting the halo thin. The button supplies the accessible
              name, so these layers are decorative. */}
          <img
            src={TITLE_PROMPT_BAND_DIM}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover pixel-art"
            decoding="async"
          />
          <img
            src={TITLE_PROMPT_BAND}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover pixel-art"
            style={{ opacity: promptIsLit ? 1 : 0 }}
            fetchPriority="high"
            decoding="async"
          />
          <p className="sr-only" aria-live="polite">
            {isEntering ? "Jason raises his sword." : ""}
          </p>
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
          <img src="/images/nes/village.webp" alt="Interactive pixel art village world map" className="block h-full w-full object-cover pixel-art" decoding="async" />

          {VILLAGE_CLOUDS.map((cloud) => (
            <DriftingCloudLayer key={cloud.name} cloud={cloud} />
          ))}

          {/* Then the things that stay put but move in place: smoke leaving
              the two chimneys, the forge fire, the two door lanterns. All
              under the hotspots so their tooltips still win. Decorative —
              the map's meaning is in the buttons. */}
          {VILLAGE_SMOKE.map((smoke) => (
            <AmbientGlowLayer key={smoke.name} glow={smoke} />
          ))}
          {VILLAGE_GLOWS.map((glow) => (
            <AmbientGlowLayer key={glow.name} glow={glow} />
          ))}

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
        <div className="relative mx-auto w-[min(100%,calc((100dvh-2.5rem)*4/3))] border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img src={world.image} alt={world.alt} className="block h-full w-full object-cover pixel-art" loading="lazy" decoding="async" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(3,4,10,0.72)_100%)] md:bg-[radial-gradient(circle_at_78%_78%,rgba(3,4,10,0.76),transparent_44%),linear-gradient(180deg,transparent_45%,rgba(3,4,10,0.45)_100%)]" />
          </div>

          <div className={`relative z-10 md:absolute ${world.panelPosition} md:w-[min(43rem,48%)]`}>
            <div className="nes-panel border-t-4 border-[#f8f4d8] bg-[#07101f]/95 p-5 text-[#fff8d8] shadow-[0_-4px_0_#101828] md:border-4 md:p-7 md:shadow-[0_0_0_4px_#101828,0_16px_0_rgba(0,0,0,0.35)]">
              <h2 className="pixel-heading mb-4 text-3xl leading-tight text-white md:text-5xl">{world.title}</h2>
              <p className="mb-5 max-w-[64ch] text-base leading-7 text-[#f4e7bd] md:text-lg">{world.body}</p>
              {world.sections ? (
                <div className="pixel-scroll mb-6 max-h-[38vh] overflow-y-auto pr-2">
                  {world.sections.map((section) => (
                    <div key={section.heading} className="mb-4 last:mb-0">
                      <p className="pixel-heading mb-2 text-xs tracking-[0.1em] text-[#f6d365] md:text-sm">
                        {section.heading}
                      </p>
                      <ul className="grid gap-3 text-sm leading-6 text-[#d9e8ff] md:text-base">
                        {section.books.map((book) => (
                          <li key={book.title} className="flex gap-3">
                            <span className="text-[#f6d365]">&gt;</span>
                            <span>
                              <span className="font-semibold text-white">{book.title}</span>
                              <span className="text-[#c5d9ff]"> — {book.author}</span>
                              <br />
                              <span className="text-xs text-[#a9bde3] md:text-sm">{book.note}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : world.items ? (
                <ul className="mb-6 grid gap-2 text-sm leading-6 text-[#d9e8ff] md:text-base">
                  {world.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="text-[#f6d365]">&gt;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
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
      {view === "start" ? <StartScreen onStart={() => goTo("map")} /> : null}
      {view === "map" ? <MapHub onSelect={goTo} /> : null}
      {activeWorld ? <WorldScreen key={activeWorld.id} world={activeWorld} onBack={() => goTo("map")} /> : null}
    </main>
  );
}

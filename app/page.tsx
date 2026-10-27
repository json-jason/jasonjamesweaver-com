"use client";

import { useEffect, useState } from "react";

import { FORGE_PROJECTS } from "./data/forge";
import { JOURNEY_STOPS, JOURNEY_SUMMIT } from "./data/journey";
import { LIBRARY_BOOKS, SHELF_ORDER } from "./data/library";
import villageGlows from "./data/village-glows.json";
import villageSky from "./data/village-sky.json";

const CONTACT_EMAIL = "emailweaver@gmail.com";

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
  buyLink?: string;
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
    buyLink: book.buyLink,
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
    description: "Follow my trail from college to the summit.",
  },
  {
    id: "quests",
    label: "BLACKSMITH",
    title: "BLACKSMITH",
    x: 70,
    y: 42,
    w: 22,
    h: 35,
    description: "The AI tools and agents I have forged.",
  },
  {
    id: "library",
    label: "VILLAGE LIBRARY",
    title: "VILLAGE LIBRARY",
    x: 5,
    y: 39,
    w: 18,
    h: 39,
    description: "Books that shaped how I think, lead, and work.",
  },
  {
    id: "contact",
    label: "WEAVER'S HOUSE",
    title: "WEAVER'S HOUSE",
    x: 24,
    y: 36,
    w: 19,
    h: 36,
    description: "Come in! The door is always open.",
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
    body: "Every hero starts somewhere. Mine was college in Reno. Follow the signposts up the trail to see where it led.",
  },
  {
    id: "quests",
    title: "BLACKSMITH",
    image: "/images/nes/blacksmith.webp",
    alt: "Pixel art blacksmith workshop for the quests section",
    panelPosition: "md:bottom-8 md:right-8",
    body: "This is where I hammer rough ideas into working tools. Explore the glowing objects to see what I have built.",
  },
  {
    id: "library",
    title: "LIBRARY",
    image: "/images/nes/library.webp",
    alt: "Pixel art library shelves for the library section",
    panelPosition: "md:bottom-8 md:left-8",
    body: "My shelf of books worth your time, sorted by what they're good for.",
    sections: LIBRARY_SECTIONS,
  },
  {
    id: "contact",
    title: "WEAVER'S HOUSE",
    image: "/images/nes/weavers-house.webp",
    alt: "Pixel art interior of Weaver's House for the contact section",
    panelPosition: "md:bottom-8 md:right-8",
    body: "Ah, a visitor! Hiring a hero, or starting a quest of your own? Choose your path below.",
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

// The castle's pennant is in the distance, behind the weather, so it is
// drawn before the clouds. Everything else that moves in place — the forge,
// the two door lanterns — is village, and is drawn after the rooftops.
const ALL_GLOWS = villageGlows as AmbientGlow[];
const DISTANT_GLOWS = ALL_GLOWS.filter((glow) => glow.name === "flag");
const VILLAGE_GLOWS = ALL_GLOWS.filter((glow) => glow.name !== "flag");

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

// The village's rooftops, cut out of the painting by
// scripts/build_village_foreground.py and laid back over the clouds so the
// clouds pass behind them. The middle of the picture is deliberately not in
// it: the castle and its hills stay behind the weather, so a cloud drifts
// across them.
const VILLAGE_FOREGROUND = "/images/nes/village-scene/foreground.webp";
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

function PixelLink({
  href,
  children,
  variant = "gold",
  newTab = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "gold" | "blue";
  newTab?: boolean;
}) {
  const variantClass =
    variant === "gold"
      ? "border-[#f6d365] bg-[#3b250a] text-[#fff5bf] hover:bg-[#5a390f] focus-visible:ring-[#f6d365]"
      : "border-[#8ec5ff] bg-[#102a56] text-[#dff1ff] hover:bg-[#183d78] focus-visible:ring-[#8ec5ff]";

  return (
    <a
      href={href}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`pixel-button inline-flex min-h-11 items-center justify-center border-2 px-5 py-3 text-xs font-bold tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] ${variantClass}`}
    >
      {children}
    </a>
  );
}

// The EMAIL button relies on a mail app being set up, which many desktops lack,
// so the address can also be copied straight to the clipboard.
function CopyEmail() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      // Some browsers refuse clipboard access; show the address to select instead.
      setStatus("failed");
    }
  }

  return (
    <p className="mt-3 text-xs leading-5 text-[#a9bde3] md:text-sm">
      No mail app?{" "}
      <button
        type="button"
        onClick={copy}
        className="font-semibold text-white underline decoration-[#f6d365]/60 underline-offset-4 hover:text-[#f6d365] hover:decoration-[#f6d365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]"
      >
        Copy my email
      </button>
      <span aria-live="polite" className="ml-2 text-[#f6d365]">
        {status === "copied" ? "Copied!" : null}
        {status === "failed" ? <span className="select-all text-white">{CONTACT_EMAIL}</span> : null}
      </span>
    </p>
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

          {/* Distant movement, under the weather: the castle pennant. A cloud
              crossing the castle should cross its flag too. */}
          {DISTANT_GLOWS.map((glow) => (
            <AmbientGlowLayer key={glow.name} glow={glow} />
          ))}

          {VILLAGE_CLOUDS.map((cloud) => (
            <DriftingCloudLayer key={cloud.name} cloud={cloud} />
          ))}

          {/* Rooftops back on top, so the clouds drift behind the village but
              still in front of the castle. Anchored to the top of the frame
              rather than stretched over it: the cut only covers the sky band,
              and below that the painting already shows through. */}
          <img
            src={VILLAGE_FOREGROUND}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-auto w-full pixel-art"
            decoding="async"
          />

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

          {MAP_HOTSPOTS.map((spot) => {
            // Centred tooltips under buildings near the map's edge get clipped
            // by the frame, so those anchor to the building's outer side.
            const centre = spot.x + spot.w / 2;
            const tooltipAnchor =
              centre < 25 ? "left-0" : centre > 75 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
            <button
              type="button"
              key={spot.id}
              onClick={() => onSelect(spot.id)}
              aria-label={`${spot.label}: ${spot.description}`}
              className="group absolute rounded-sm outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#f8f4d8]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]"
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
            >
              <span className={`pointer-events-none absolute ${tooltipAnchor} top-full z-20 mt-3 w-56 border-4 border-[#f8f4d8] bg-[#07101f]/95 p-3 text-left opacity-0 shadow-[0_0_0_3px_#101828,0_10px_0_rgba(0,0,0,0.35)] transition group-hover:opacity-100 group-focus-visible:opacity-100 md:w-72`}>
                <span className="pixel-heading mb-2 block text-lg leading-none text-[#f6d365] md:text-2xl">{spot.title}</span>
                <span className="block text-xs leading-5 text-[#d9e8ff] md:text-sm">{spot.description}</span>
              </span>
            </button>
            );
          })}
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
                              {book.buyLink ? (
                                <a
                                  href={book.buyLink}
                                  target="_blank"
                                  rel="sponsored noopener noreferrer"
                                  className="font-semibold text-white underline decoration-[#f6d365]/60 underline-offset-4 hover:text-[#f6d365] hover:decoration-[#f6d365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]"
                                >
                                  {book.title}
                                </a>
                              ) : (
                                <span className="font-semibold text-white">{book.title}</span>
                              )}
                              <span className="text-[#c5d9ff]"> — {book.author}</span>
                              <br />
                              <span className="text-xs text-[#a9bde3] md:text-sm">{book.note}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {world.sections.some((section) => section.books.some((book) => book.buyLink)) ? (
                    <p className="mt-4 border-t-2 border-[#f8f4d8]/20 pt-3 text-xs leading-5 text-[#a9bde3]">
                      Book links go to Bookshop.org, which supports independent bookstores. I earn a small commission if you buy through them.
                    </p>
                  ) : null}
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
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3">
                    <PixelLink href={`mailto:${CONTACT_EMAIL}`}>EMAIL</PixelLink>
                    <PixelLink href="https://www.linkedin.com/in/jasonweaver/" variant="blue" newTab>
                      LINKEDIN
                    </PixelLink>
                  </div>
                  <CopyEmail />
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

// The Journey room swaps the usual copy panel for numbered signposts on the
// trail. Choosing one opens its chapter in a dialog box, which sits in the sky
// on wide screens and under the picture on phones.
function JourneyScreen({ world, onBack, onCastle }: { world: World; onBack: () => void; onCastle: () => void }) {
  const [stop, setStop] = useState(-1);
  const chapter = stop >= 0 ? JOURNEY_STOPS[stop] : null;
  const isLast = stop === JOURNEY_STOPS.length - 1;

  return (
    <section className="screen-stage bg-[#050816] px-4 py-5 md:px-8 md:py-8">
      <div className="screen-transition mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-7xl items-center md:min-h-[calc(100dvh-4rem)]">
        <div className="relative mx-auto w-[min(100%,calc((100dvh-2.5rem)*4/3))] border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img src={world.image} alt={world.alt} className="block h-full w-full object-cover pixel-art" loading="lazy" decoding="async" />

            {JOURNEY_STOPS.map((item, index) => {
              const active = index === stop;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStop(index)}
                  aria-label={`Stop ${index + 1}: ${item.title}, ${item.when}`}
                  aria-pressed={active}
                  className={`pixel-heading absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 text-sm leading-none shadow-[0_3px_0_rgba(0,0,0,0.55)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:h-10 md:w-10 md:border-4 md:text-xl ${
                    active
                      ? "border-white bg-[#f6d365] text-[#2a1a05]"
                      : "border-[#f6d365] bg-[#3b250a] text-[#fff5bf] hover:bg-[#5a390f]"
                  } ${stop === -1 && index === 0 ? "animate-bounce" : ""}`}
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                >
                  {index + 1}
                </button>
              );
            })}

            <a
              href="#status"
              onClick={onCastle}
              aria-label="Summit: continue to the Castle"
              className="pixel-heading absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 border-2 border-white bg-[#102a56] px-2 py-1 text-[10px] leading-none tracking-[0.12em] text-white shadow-[0_3px_0_rgba(0,0,0,0.55)] hover:bg-[#183d78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:border-4 md:px-3 md:py-2 md:text-sm"
              style={{ left: `${JOURNEY_SUMMIT.x}%`, top: `${JOURNEY_SUMMIT.y}%` }}
            >
              ▲ CASTLE
            </a>
          </div>

          <div className="relative z-20 md:absolute md:left-4 md:top-4 md:w-[min(38rem,52%)] lg:left-6 lg:top-6">
            <div className="nes-panel border-t-4 border-[#f8f4d8] bg-[#07101f]/95 p-5 text-[#fff8d8] shadow-[0_-4px_0_#101828] md:border-4 md:p-4 md:shadow-[0_0_0_4px_#101828,0_16px_0_rgba(0,0,0,0.35)] lg:p-6">
              {chapter ? (
                <div aria-live="polite">
                  <p className="pixel-heading mb-1 text-xs tracking-[0.14em] text-[#8ca6d9]">
                    STOP {stop + 1} OF {JOURNEY_STOPS.length} · {chapter.when}
                  </p>
                  <h2 className="pixel-heading mb-1 text-2xl leading-tight text-[#f6d365] lg:text-3xl">{chapter.title}</h2>
                  <p className="mb-3 text-xs tracking-[0.06em] text-[#c5d9ff] md:text-sm">{chapter.where}</p>
                  <p className="mb-4 text-sm leading-6 text-[#f4e7bd] lg:mb-5 lg:text-base lg:leading-7">{chapter.story}</p>
                </div>
              ) : (
                <div aria-live="polite">
                  <h2 className="pixel-heading mb-3 text-3xl leading-tight text-white md:text-4xl">{world.title}</h2>
                  <p className="mb-5 text-sm leading-6 text-[#f4e7bd] md:text-base md:leading-7">{world.body}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t-2 border-[#f8f4d8]/30 pt-3 lg:pt-4">
                {stop > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStop(stop - 1)}
                    className="pixel-button inline-flex min-h-11 items-center justify-center border-2 border-[#8ec5ff] bg-[#102a56] px-4 py-3 text-xs font-bold tracking-[0.16em] text-[#dff1ff] transition-colors hover:bg-[#183d78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5ff]"
                  >
                    ◀ BACK
                  </button>
                ) : null}
                {isLast ? (
                  <PixelAction href="#status" onNavigate={onCastle}>TO THE CASTLE ▶</PixelAction>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStop(stop + 1)}
                    className="pixel-button inline-flex min-h-11 items-center justify-center border-2 border-[#f6d365] bg-[#3b250a] px-4 py-3 text-xs font-bold tracking-[0.16em] text-[#fff5bf] transition-colors hover:bg-[#5a390f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]"
                  >
                    {stop === -1 ? "BEGIN ▶" : "NEXT ▶"}
                  </button>
                )}
                <a
                  href="#map"
                  onClick={onBack}
                  className="ml-auto text-xs tracking-[0.12em] text-[#8ca6d9] underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]"
                >
                  RETURN TO VILLAGE
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// The Blacksmith room: each project is an object in the forge. Objects glow
// on hover and open their story in a dialog box, which sits over the empty
// workbench corner on wide screens and under the picture on phones.
function ForgeScreen({ world, onBack }: { world: World; onBack: () => void }) {
  const [pick, setPick] = useState(-1);
  const project = pick >= 0 ? FORGE_PROJECTS[pick] : null;
  const isLast = pick === FORGE_PROJECTS.length - 1;

  return (
    <section className="screen-stage bg-[#050816] px-4 py-5 md:px-8 md:py-8">
      <div className="screen-transition mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-7xl items-center md:min-h-[calc(100dvh-4rem)]">
        <div className="relative mx-auto w-[min(100%,calc((100dvh-2.5rem)*4/3))] border-4 border-[#f8f4d8] bg-black shadow-[0_0_0_4px_#101828,0_24px_0_rgba(0,0,0,0.45)]">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img src={world.image} alt={world.alt} className="block h-full w-full object-cover pixel-art" loading="lazy" decoding="async" />

            {FORGE_PROJECTS.map((item, index) => {
              const active = index === pick;
              const labelBelow = item.box.y < 20;
              return (
                <button
                  key={item.object}
                  type="button"
                  onClick={() => setPick(index)}
                  aria-label={`${item.object}: ${item.title}`}
                  aria-pressed={active}
                  className={`group absolute z-10 border-2 transition-[border-color,box-shadow,background-color] duration-150 focus-visible:outline-none ${
                    active
                      ? "border-[#f6d365] bg-[#f6d365]/15 shadow-[0_0_0_2px_rgba(0,0,0,0.6),0_0_18px_rgba(246,211,101,0.75)]"
                      : "border-dashed border-[#f8f4d8]/40 hover:border-solid hover:border-[#f6d365] hover:bg-[#f6d365]/10 hover:shadow-[0_0_0_2px_rgba(0,0,0,0.6),0_0_18px_rgba(246,211,101,0.6)] focus-visible:border-solid focus-visible:border-[#f6d365] focus-visible:shadow-[0_0_18px_rgba(246,211,101,0.6)]"
                  }`}
                  style={{ left: `${item.box.x}%`, top: `${item.box.y}%`, width: `${item.box.w}%`, height: `${item.box.h}%` }}
                >
                  <span
                    className={`pixel-heading pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap border-2 border-[#f8f4d8] bg-[#07101f]/95 px-2 py-1 text-xs leading-none tracking-[0.1em] text-[#f6d365] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:block ${
                      labelBelow ? "top-full mt-2" : "bottom-full mb-2"
                    }`}
                  >
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative z-20 md:absolute md:bottom-3 md:left-3 md:w-[min(34rem,42%)] roomy:bottom-6 roomy:left-6">
            <div className="nes-panel border-t-4 border-[#f8f4d8] bg-[#07101f]/95 p-5 text-[#fff8d8] shadow-[0_-4px_0_#101828] md:border-4 md:p-4 md:shadow-[0_0_0_4px_#101828,0_16px_0_rgba(0,0,0,0.35)] roomy:p-6">
              {project ? (
                <div aria-live="polite">
                  <p className="pixel-heading mb-1 text-xs tracking-[0.14em] text-[#8ca6d9]">
                    {project.object} · {project.tag}
                  </p>
                  <h2 className="pixel-heading mb-2 text-xl leading-tight text-[#f6d365] roomy:mb-3 roomy:text-3xl">{project.title}</h2>
                  <p className="mb-3 text-[13px] leading-5 text-[#f4e7bd] roomy:mb-5 roomy:text-base roomy:leading-7">{project.story}</p>
                </div>
              ) : (
                <div aria-live="polite">
                  <h2 className="pixel-heading mb-3 text-3xl leading-tight text-white md:text-4xl">{world.title}</h2>
                  <p className="mb-5 text-sm leading-6 text-[#f4e7bd] md:text-base md:leading-7">{world.body}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t-2 border-[#f8f4d8]/30 pt-3 roomy:pt-4">
                {pick > 0 ? (
                  <button
                    type="button"
                    onClick={() => setPick(pick - 1)}
                    className="pixel-button inline-flex min-h-11 items-center justify-center border-2 border-[#8ec5ff] bg-[#102a56] px-4 py-3 text-xs font-bold tracking-[0.16em] text-[#dff1ff] transition-colors hover:bg-[#183d78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5ff]"
                  >
                    ◀ BACK
                  </button>
                ) : null}
                {!isLast ? (
                  <button
                    type="button"
                    onClick={() => setPick(pick + 1)}
                    className="pixel-button inline-flex min-h-11 items-center justify-center border-2 border-[#f6d365] bg-[#3b250a] px-4 py-3 text-xs font-bold tracking-[0.16em] text-[#fff5bf] transition-colors hover:bg-[#5a390f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]"
                  >
                    {pick === -1 ? "BEGIN ▶" : "NEXT ▶"}
                  </button>
                ) : null}
                <a
                  href="#map"
                  onClick={onBack}
                  className="ml-auto text-xs tracking-[0.12em] text-[#8ca6d9] underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d365]"
                >
                  RETURN TO VILLAGE
                </a>
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
      {activeWorld?.id === "quests" ? (
        <ForgeScreen world={activeWorld} onBack={() => goTo("map")} />
      ) : activeWorld?.id === "journey" ? (
        <JourneyScreen world={activeWorld} onBack={() => goTo("map")} onCastle={() => goTo("status")} />
      ) : activeWorld ? (
        <WorldScreen key={activeWorld.id} world={activeWorld} onBack={() => goTo("map")} />
      ) : null}
    </main>
  );
}

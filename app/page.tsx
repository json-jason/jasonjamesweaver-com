import Image from "next/image";
import Link from "next/link";

/* ── Navigation & Social data ──────────────────────────── */

const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Career", href: "#career" },
  { label: "Projects", href: "#projects" },
  { label: "Resources", href: "#resources" },
  { label: "Notes", href: "#notes" },
  { label: "Contact", href: "#contact" },
];

const SOCIALS = [
  { label: "X", href: "https://x.com/jasonjweaver", short: "X" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/jasonjweaver",
    short: "in",
  },
  { label: "GitHub", href: "https://github.com/json-jason", short: "GH" },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@jasonjweaver",
    short: "YT",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/jasonjweaver",
    short: "IG",
  },
  { label: "Email", href: "mailto:hello@jasonjweaver.com", short: "@" },
];

/* ── Sub-component: Card used across sections ──────────── */

function Card({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-white/[0.03] border border-white/[0.06] rounded-lg p-6 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200">
      <h4 className="text-base font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

/* ── Section heading helper ────────────────────────────── */

function SectionHeading({
  tag,
  accent,
  title,
}: {
  tag: string;
  accent: "amber" | "blue";
  title: string;
}) {
  const accentClass =
    accent === "amber" ? "text-amber-400/70" : "text-blue-400/70";
  return (
    <>
      <h2 className={`text-xs uppercase tracking-[0.2em] ${accentClass} mb-3`}>
        {tag}
      </h2>
      <h3 className="text-3xl md:text-4xl font-bold mb-12">{title}</h3>
    </>
  );
}

/* ── Page ──────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ================================================================
          DESKTOP SIDEBAR
          ================================================================ */}
      <aside className="hidden md:flex fixed left-0 top-0 w-60 h-screen bg-black z-50 flex-col border-r border-white/[0.04]">
        <div className="flex flex-col h-full p-8">
          {/* Wordmark — clean single line */}
          <Link href="/" className="block mb-14">
            <span className="text-lg font-bold tracking-tight text-white">
              Jason Weaver
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-col space-y-0.5">
            {NAV_ITEMS.map((item, idx) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center py-2 text-xs uppercase tracking-[0.18em] transition-colors duration-200 ${
                  idx === 0
                    ? "text-amber-400/90"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {idx === 0 && (
                  <span className="absolute -left-8 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-amber-400 rounded-full" />
                )}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Spacer pushes socials to bottom */}
          <div className="flex-1 min-h-8" />

          {/* Social links — tighter spacing */}
          <div className="space-y-1.5 pb-1">
            {SOCIALS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 group cursor-pointer no-underline"
              >
                <span className="w-5 h-5 flex items-center justify-center border border-white/10 rounded-[3px] text-[8px] font-medium text-gray-500 group-hover:border-white/30 group-hover:text-white transition-all duration-200">
                  {s.short}
                </span>
                <span className="text-[11px] uppercase tracking-[0.1em] text-gray-500 group-hover:text-white transition-colors duration-200">
                  {s.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* ================================================================
          MOBILE HEADER
          ================================================================ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Jason Weaver
          </Link>
          <details className="group relative">
            <summary className="list-none cursor-pointer text-xs uppercase tracking-wider text-gray-400 hover:text-white select-none">
              Menu
            </summary>
            <nav className="absolute right-0 top-full mt-2 w-52 bg-black/95 backdrop-blur-sm border border-white/[0.08] rounded-md p-4 space-y-2 shadow-xl">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-1.5 text-sm text-gray-400 hover:text-amber-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-white/10 space-y-1.5">
                {SOCIALS.map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    <span className="w-5 h-5 flex items-center justify-center border border-white/10 rounded-[2px] text-[8px]">
                      {s.short}
                    </span>
                    {s.label}
                  </a>
                ))}
              </div>
            </nav>
          </details>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT (offset for sidebar on desktop)
          ================================================================ */}
      <div className="md:ml-60">
        {/* ================================================================
            HERO SECTION — full-screen image with overlay text
            ================================================================ */}
        <section id="home" className="relative h-dvh w-full overflow-hidden">
          <Image
            src="/images/jason-hero.jpeg"
            alt="Jason Weaver on the beach"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, calc(100vw - 240px)"
          />
          {/* Stronger dark gradient on left, natural fade on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/65 via-40% to-transparent to-75%" />

          {/* Hero text — shifted leftward and lower */}
          <div className="absolute inset-0 flex items-end pb-16 md:pb-24 lg:pb-32">
            <div className="pl-6 pr-12 md:pl-10 md:pr-16 lg:pl-14 lg:pr-20 w-full max-w-lg">
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-none tracking-tight">
                <span className="block">JASON</span>
                <span className="block mt-0.5">WEAVER</span>
              </h1>
              <p className="text-base md:text-lg text-gray-300 mt-6 font-light tracking-wide">
                Technology Leader
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1.5 tracking-[0.08em] uppercase">
                AI Explorer · Builder of Systems
              </p>
              <p className="text-sm md:text-base text-gray-400 mt-5 max-w-lg leading-relaxed">
                20+ years leading global platform operations, cloud platforms,
                and high-performing teams at scale. Exploring the power of AI
                and automation to build better systems for work and life.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href="#projects"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-7 py-3 rounded-md transition-colors duration-200"
                >
                  View My Work
                </Link>
                <Link
                  href="#contact"
                  className="inline-flex items-center border border-white/20 hover:border-white/60 text-white text-sm font-medium px-7 py-3 rounded-md transition-colors duration-200"
                >
                  Contact Me
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            CURRENT FOCUS
            ================================================================ */}
        <section id="about" className="py-20 md:py-28 px-8 md:px-16 lg:px-20">
          <SectionHeading tag="Focus" accent="amber" title="Current Focus" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card
              title="AI & Automation"
              description="Building and learning with AI agents, tools and systems."
            />
            <Card
              title="Career Evolution"
              description="Finding my next leadership role where I can make the biggest impact."
            />
            <Card
              title="Health & Longevity"
              description="Training, nutrition, recovery and performance."
            />
            <Card
              title="Adventure"
              description="Mountains, trails, endurance and exploration."
            />
            <Card
              title="Lifelong Learning"
              description="Books, ideas and curiosity fueling everything I do."
            />
          </div>
        </section>

        {/* ================================================================
            FEATURED PROJECTS
            ================================================================ */}
        <section
          id="projects"
          className="py-20 md:py-28 px-8 md:px-16 lg:px-20 bg-white/[0.01] border-y border-white/[0.03]"
        >
          <SectionHeading
            tag="Work"
            accent="blue"
            title="Featured Projects"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card
              title="AI Coach (Claude Skill)"
              description="A personal AI coaching assistant built as a Claude skill, focused on clarity, accountability and better thinking."
            />
            <Card
              title="Comments Clinic GPT"
              description="A custom GPT built to help creators and businesses turn rough ideas into sharper comments, feedback and engagement."
            />
          </div>
        </section>

        {/* ================================================================
            RESOURCES I RECOMMEND
            ================================================================ */}
        <section
          id="resources"
          className="py-20 md:py-28 px-8 md:px-16 lg:px-20"
        >
          <SectionHeading
            tag="Recommendations"
            accent="amber"
            title="Resources I Recommend"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card
              title="Books"
              description="Curated reading list to broaden perspectives."
            />
            <Card
              title="Tools"
              description="Software and frameworks that accelerate innovation."
            />
            <Card
              title="People"
              description="Thought leaders and mentors who inspire."
            />
            <Card
              title="Media"
              description="Articles, podcasts and videos worth exploring."
            />
          </div>
        </section>

        {/* ================================================================
            CONTACT / FOOTER
            ================================================================ */}
        <footer
          id="contact"
          className="py-20 px-8 md:px-16 lg:px-20 border-t border-white/[0.04]"
        >
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Let&rsquo;s Connect
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Building systems. Empowering people. Creating impact that lasts.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="mailto:hello@jasonjamesweaver.com"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-6 py-3 rounded-md transition-colors duration-200"
              >
                Get in Touch
              </a>
              <a
                href="https://www.linkedin.com/in/jasonjweaver"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border border-white/20 hover:border-white/60 text-white text-sm font-medium px-6 py-3 rounded-md transition-colors duration-200"
              >
                LinkedIn
              </a>
            </div>
            <p className="text-xs text-gray-600 mt-12">
              &copy; 2026 Jason Weaver
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
// The Blacksmith room's projects. Each one lives on an object in
// blacksmith.webp; `box` outlines that object as percentages of the artwork
// (left, top, width, height). Keep private details out of these stories:
// no health data, injuries, or places Jason trains, and nothing about Black
// Belt Cybersecurity that its own site does not say (no monitoring or incident
// response).
export type ForgeProject = {
  object: string;
  title: string;
  tag: string;
  story: string;
  box: { x: number; y: number; w: number; h: number };
};

export const FORGE_PROJECTS: ForgeProject[] = [
  {
    object: "THE FORGE",
    title: "This website",
    tag: "Next.js · built with AI",
    story:
      "I designed this whole village from my own ideas and built it with AI as my partner. It went through many versions before it felt like me. Every bit of motion, from the chimney smoke to this fire, is generated from the pixel art itself.",
    box: { x: 75.3, y: 49.7, w: 15.2, h: 17.1 },
  },
  {
    object: "THE SHIELD",
    title: "The Common Sense Clinic",
    tag: "Custom GPT",
    story:
      "A custom GPT I built as my personal health advisory board. It weighs views from experts like Peter Attia, Layne Norton, Andy Galpin and Matthew Walker, puts strong evidence and the basics first, and separates settled science from speculation. It makes health information clearer. It does not replace a doctor.",
    box: { x: 59.9, y: 26.2, w: 8.3, h: 11.1 },
  },
  {
    object: "THE ANVIL",
    title: "Smitty, my AI coach",
    tag: "Claude skill",
    story:
      "Named for Mark \"Smitty\" Smith, my late high school track coach in Reno, and built on Claude to coach the way he did: direct accountability backed by real care. Each morning it reads my sleep and recovery from Apple Health, gives a verdict, and sets the day's training.",
    box: { x: 61.3, y: 68.6, w: 17.3, h: 16.6 },
  },
  {
    object: "THE GEARS",
    title: "My AI agent",
    tag: "OpenClaw → Hermes",
    story:
      "A personal AI agent I built on OpenClaw, then moved to Hermes. It does real work across my projects. For one, it helped me build a private dashboard of years of doctor visits and lab results, so I can spot trends at a glance. That data stays private.",
    box: { x: 22.4, y: 27.2, w: 15.2, h: 9.4 },
  },
  {
    object: "THE BLADES",
    title: "A security agent for Black Belt",
    tag: "Security AI agent",
    story:
      "For Black Belt Cybersecurity, I built a specialized security AI agent that helps analyze the logs from each home assessment, so potential vulnerabilities surface faster and land in the client's report. The business itself waits at the Castle.",
    box: { x: 44.9, y: 17, w: 11.4, h: 19.8 },
  },
  {
    object: "THE CHEST",
    title: "The code chest",
    tag: "GitHub · coming soon",
    story:
      "Locked for now. I am getting this website's code ready to share, so anyone can see how the village was built. Check back soon.",
    box: { x: 27.6, y: 15, w: 6, h: 6.9 },
  },
];

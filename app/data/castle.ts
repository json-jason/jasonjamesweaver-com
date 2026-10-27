// The Castle room: the business side of Black Belt Cybersecurity. Each story
// lives on an object in castle.webp; `box` uses the same percentages as
// forge.ts. Every claim here must match blackbeltcybersecurity.com: the
// assessment covers only the computers in the home it is installed on; no
// monitoring, subscriptions, SOC, or incident response; Corey's FBI service is
// former employment only; invent no clients, numbers, or proof.
import type { ForgeProject } from "./forge";

export const CASTLE_ROOMS: ForgeProject[] = [
  {
    object: "THE WINDOW",
    title: "Why it exists",
    tag: "The gap",
    story:
      "Walk through a well-protected home in Los Angeles: cameras, a gate, a monitored alarm, good locks. Then ask when anyone last checked the computers inside. The answer is almost always never. It is nobody's job. So we are making it ours.",
    box: { x: 3.5, y: 8, w: 7.8, h: 32 },
  },
  {
    object: "THE FIRST BANNER",
    title: "What we check",
    tag: "One visit",
    story:
      "We come to the home and check the computers the family chooses. Three questions: what is out of date, what is switched off or left open, and who still holds the keys.",
    box: { x: 16.5, y: 14.5, w: 5, h: 35.5 },
  },
  {
    object: "THE SECOND BANNER",
    title: "A report you can read",
    tag: "The report",
    story:
      "The family gets a plain-language report, ranked by what matters, and we walk through it together. Then we can talk about fixing what we found ourselves, or working with their IT provider.",
    box: { x: 33.4, y: 20, w: 4.4, h: 30 },
  },
  {
    object: "THE CREST",
    title: "About the name",
    tag: "Real black belts",
    story:
      "Yes, we have real black belts: one in Tae Kwon Do, one in Jiu-Jitsu. They are not security credentials. To us, a black belt means the basics drilled so well that you spot the opening before someone uses it. That is the whole job.",
    box: { x: 85.2, y: 15, w: 6.4, h: 11.5 },
  },
  {
    object: "THE DOOR",
    title: "Enter Black Belt",
    tag: "blackbeltcybersecurity.com",
    story:
      "This is the business I am building now. If your family, or a family you advise, wants a careful look at the computers at home, the door is open.",
    box: { x: 82.6, y: 31, w: 11.5, h: 30 },
    link: { href: "https://blackbeltcybersecurity.com", label: "VISIT BLACK BELT ▶" },
  },
];

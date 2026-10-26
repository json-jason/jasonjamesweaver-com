// The Journey room's signposts, from the trailhead up to the summit. Facts
// come from Jason's resume and LinkedIn experience; where the two disagree on
// a date, the resume wins. `x` and `y` place each sign on the path in
// mountain-trail.webp, as a percentage of the artwork.
export type JourneyStop = {
  title: string;
  when: string;
  where: string;
  story: string;
  x: number;
  y: number;
};

export const JOURNEY_STOPS: JourneyStop[] = [
  {
    title: "THE TRAILHEAD",
    when: "2000–2005",
    where: "Reno, NV · Cape Coral, FL",
    story:
      "Every hero starts somewhere. Mine was licensing operations at Microsoft, then a 24/7 support desk at Bally Technologies. Next came a year running IT for small businesses in Florida at Stakely Technical Solutions.",
    x: 6,
    y: 72,
  },
  {
    title: "FIRST QUESTS",
    when: "2006–2011",
    where: "Reno, NV",
    story:
      "Back to Bally as a Senior Product Engineer, setting up a photo-recognition system for casino table games and training the people who ran it. In 2008 I joined IGT as a Systems Engineer, rolling out software releases across multi-site customers.",
    x: 15.8,
    y: 70,
  },
  {
    title: "ACROSS THE SEA",
    when: "2012–2016",
    where: "Amsterdam, The Netherlands",
    story:
      "IGT sent me to Amsterdam. I led first deployments in Austria, Slovenia, Iceland and France, and built local caching so content could reach sites on slow connections.",
    x: 29.7,
    y: 68.6,
  },
  {
    title: "INTO THE CLOUDS",
    when: "2017–2020",
    where: "Remote · New York City",
    story:
      "I architected IGT's first AWS cloud deployment for enterprise customers, moved the platform from OpenStack to AWS, and led the first cloud rollouts in the UK and Europe. The caching design grew into $1M+ in savings every year.",
    x: 55.2,
    y: 71.8,
  },
  {
    title: "RAISING THE PARTY",
    when: "2020–2022",
    where: "Engineering Manager · Reno, NV",
    story:
      "Now leading engineers across the U.S., LATAM and EMEA. We doubled IGT's cloud footprint, saved about 30% a year by moving customers onto shared AWS environments, and helped found IGT's Cloud Center of Excellence.",
    x: 76.7,
    y: 63.5,
  },
  {
    title: "LEADING THE GUILD",
    when: "2022–2025",
    where: "Senior Engineering Manager",
    story:
      "4 managers, about 30 engineers, 7 enterprise products, 861 sites in 16 countries. I built the dashboards leadership steered by, and cut Floor Manager deployment timelines 7x in North America.",
    x: 62.2,
    y: 50.6,
  },
  {
    title: "THE NEXT PEAK",
    when: "2025–now",
    where: "Santa Monica, CA",
    story:
      "After 17+ years at IGT, a new climb. I have been building AI tools and agents by hand and studying how organizations can adopt AI responsibly. What I am building now waits at the Castle.",
    x: 84.5,
    y: 39.1,
  },
];

// The flag at the top of the trail, which leads on to the Castle room.
export const JOURNEY_SUMMIT = { x: 63.5, y: 26 };

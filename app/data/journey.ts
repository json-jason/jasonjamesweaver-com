// The Journey room's signposts, from the trailhead up to the summit. Facts
// come from Jason's resume and LinkedIn experience; where the two disagree on
// a date, the resume wins. Jason's own corrections (Oct 2026) override both. `x` and `y` place each sign on the path in
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
    when: "Class of 2002",
    where: "University of Nevada, Reno",
    story:
      "I started out in electrical engineering, but my love of computers kept pulling me another way. I followed it into Computer Information Systems and earned my B.S. Along the way, I worked in licensing operations at Microsoft in Reno.",
    x: 6,
    y: 72,
  },
  {
    title: "FIRST QUESTS",
    when: "2002–2007",
    where: "Reno, NV · Fort Myers, FL",
    story:
      "I joined Bally Technologies (now Light & Wonder) on its 24/7 support desk, then co-founded an IT company in Fort Myers for small businesses. Back at Bally as a Senior Product Engineer, I set up a photo-recognition system for casino table games.",
    x: 15.8,
    y: 70,
  },
  {
    title: "ACROSS THE SEA",
    when: "2008–2016",
    where: "Reno, NV · Amsterdam, The Netherlands",
    story:
      "I joined IGT in Reno as a Systems Engineer in 2008. Then I went after a role in Amsterdam, applied, and won it. From there I led first deployments in Austria, Slovenia, Iceland and France, and built local caching so content could reach sites on slow connections.",
    x: 29.7,
    y: 68.6,
  },
  {
    title: "INTO THE CLOUDS",
    when: "2017–2020",
    where: "Remote · Venice, CA · Boston, MA · Brooklyn, NY",
    story:
      "I architected IGT's first AWS cloud deployment for enterprise customers, moved the platform from OpenStack to AWS, and led the first cloud rollouts in the UK and Europe. The caching design grew into $1M+ in savings every year.",
    x: 55.2,
    y: 71.8,
  },
  {
    title: "GATHERING THE PARTY",
    when: "2020–2022",
    where: "Engineering Manager · Reno, NV",
    story:
      "I built and led a team of engineers across the U.S., LATAM and EMEA. Together we doubled IGT's cloud footprint, saved about 30% a year by moving customers onto shared AWS environments, and helped found IGT's Cloud Center of Excellence.",
    x: 76.7,
    y: 63.5,
  },
  {
    title: "LEADING THE GUILD",
    when: "2022–2025",
    where: "Senior Engineering Manager",
    story:
      "4 managers, 30 engineers, 7 enterprise products, 861 sites in 16 countries. I built the dashboards leadership steered by, and cut Floor Manager deployment timelines 7x in North America.",
    x: 62.2,
    y: 50.6,
  },
  {
    title: "THE NEXT PEAK",
    when: "2025–now",
    where: "Santa Monica, CA",
    story:
      "After nearly 18 years at IGT, a new climb. I have been building AI tools and agents by hand and studying how organizations can adopt AI responsibly. What I am building now waits at the Castle.",
    x: 84.5,
    y: 39.1,
  },
];

// The flag at the top of the trail, which leads on to the Castle room.
export const JOURNEY_SUMMIT = { x: 63.5, y: 26 };

import Image from 'next/image';
import Link from 'next/link';

/**
 * Draft implementation for the Jason Weaver homepage (version 0.1).
 *
 * This file demonstrates how to structure the landing page using the Next.js
 * App Router and Tailwind CSS. It adheres to the dark, minimalist aesthetic
 * described in the project brief while remaining relatively simple and
 * self‑contained. All sections live within one component to avoid adding
 * unnecessary dependencies or complexity at this early stage.
 */
export default function Home() {
  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="md:w-64 w-full p-6 flex flex-col justify-between bg-neutral-900">
        <div>
          <h1 className="text-3xl font-bold mb-8">Jason&nbsp;Weaver</h1>
          <nav className="flex flex-col space-y-4 font-medium">
            <Link href="#" className="hover:text-blue-500">Home</Link>
            <Link href="#about" className="hover:text-blue-500">About</Link>
            <Link href="#career" className="hover:text-blue-500">Career</Link>
            <Link href="#projects" className="hover:text-blue-500">Projects</Link>
            <Link href="#resources" className="hover:text-blue-500">Resources</Link>
            <Link href="#notes" className="hover:text-blue-500">Notes</Link>
            <Link href="#contact" className="hover:text-blue-500">Contact</Link>
          </nav>
        </div>
        <div className="mt-12">
          <ul className="flex flex-col space-y-2 text-sm">
            <li>
              <a
                href="https://www.linkedin.com/in/jasonjweaver"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://github.com/json-jason"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href="https://x.com/jasonjweaver"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500"
              >
                X
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@jasonjweaver"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500"
              >
                YouTube
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/jasonjweaver"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@jasonjamesweaver.com"
                className="hover:text-blue-500"
              >
                Email
              </a>
            </li>
          </ul>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Hero section */}
        <section className="flex flex-col lg:flex-row items-center gap-8 min-h-screen" id="home">
          <div className="lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-6xl lg:text-7xl font-bold leading-tight">
              Jason<br />
              Weaver
            </h2>
            <p className="text-xl text-gray-400 mt-4">
              Technology&nbsp;Leader
              <br />
              AI&nbsp;Explorer&nbsp;•&nbsp;Builder&nbsp;of&nbsp;Systems
            </p>
            <p className="text-gray-300 mt-6 max-w-md">
              20+&nbsp;years leading global platform operations, cloud
              platforms and high‑performing teams at scale. Exploring the
              power of AI and automation to build better systems for work
              and life.
            </p>
            <div className="mt-8 flex space-x-4">
              <Link
                href="#projects"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                View&nbsp;My&nbsp;Work
              </Link>
              <Link
                href="#contact"
                className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-black py-2 px-4 rounded"
              >
                Contact&nbsp;Me
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 relative h-80 lg:h-[70vh] w-full">
            <Image
              src="/images/jason-hero.jpeg"
              alt="Jason Weaver hero"
              fill
              priority
              className="object-cover rounded-lg"
            />
          </div>
        </section>

        {/* Current focus section */}
        <section id="focus" className="py-16">
          <h3 className="text-3xl font-bold mb-8">Current Focus</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">AI&nbsp;&amp;&nbsp;Automation</h4>
              <p className="text-gray-400">Building and learning with AI agents, tools and systems.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Career&nbsp;Evolution</h4>
              <p className="text-gray-400">Finding my next leadership role where I can make the biggest impact.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Health&nbsp;&amp;&nbsp;Longevity</h4>
              <p className="text-gray-400">Training, nutrition, recovery and performance.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Adventure</h4>
              <p className="text-gray-400">Mountains, trails, endurance and exploration.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Lifelong&nbsp;Learning</h4>
              <p className="text-gray-400">Books, ideas and curiosity fueling everything I do.</p>
            </div>
          </div>
        </section>

        {/* Featured projects section */}
        <section id="projects" className="py-16">
          <h3 className="text-3xl font-bold mb-8">Featured Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">AI&nbsp;Coach&nbsp;(Claude&nbsp;Skill)</h4>
              <p className="text-gray-400">A personal AI coaching assistant built as a Claude skill, focused on clarity, accountability and better thinking.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Comments&nbsp;Clinic&nbsp;GPT</h4>
              <p className="text-gray-400">A custom GPT built to help creators and businesses turn rough ideas into sharper comments, feedback and engagement.</p>
            </div>
          </div>
        </section>

        {/* Resources section */}
        <section id="resources" className="py-16">
          <h3 className="text-3xl font-bold mb-8">Resources I Recommend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Books</h4>
              <p className="text-gray-400">Curated reading list to broaden perspectives.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Tools</h4>
              <p className="text-gray-400">Software and frameworks that accelerate innovation.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">People</h4>
              <p className="text-gray-400">Thought leaders and mentors who inspire.</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded">
              <h4 className="text-xl font-semibold mb-2">Media</h4>
              <p className="text-gray-400">Articles, podcasts and videos worth exploring.</p>
            </div>
          </div>
        </section>

        {/* Footer / Contact section */}
        <footer id="contact" className="py-12 border-t border-neutral-800 text-center">
          <p className="text-gray-400 mb-4">
            Building systems. Empowering people. Creating impact that lasts.
          </p>
          <a
            href="mailto:hello@jasonjamesweaver.com"
            className="text-blue-600 hover:underline"
          >
            Get&nbsp;in&nbsp;touch
          </a>
        </footer>
      </div>
    </main>
  );
}
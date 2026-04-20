import { motion } from "framer-motion";

const pillars = [
  "Operational clarity over technical complexity",
  "Model-backed decisions with complete human control",
  "Enterprise-grade security and production-minded design",
];

const AboutPage = () => {
  return (
    <div className="relative min-h-screen bg-blue-50 px-4 pb-32 pt-32 sm:px-8">
      <motion.section
        className="relative mx-auto max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <p className="workspace-kicker">Our Philosophy</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
          Designed for practical <span className="text-blue-600 italic font-accent font-normal">retention</span> work.
        </h1>
        <p className="mt-8 text-xl font-bold leading-8 text-black">
          RetainQ combines a high-performance operating surface with dedicated AI inference services, allowing Customer Success teams to move quickly without compromising on technical rigor.
        </p>

        <motion.div 
          className="mt-16 rounded-[2.5rem] border border-blue-200 bg-white p-10 shadow-premium"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-extrabold text-black">What we optimize for</h2>
          <ul className="mt-8 space-y-4">
            {pillars.map((item) => (
              <li key={item} className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                <span className="text-[15px] font-bold text-black">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="p-8 rounded-[2rem] border border-blue-100 bg-white shadow-sm transition-hover">
            <h3 className="text-lg font-extrabold text-black">Modern Architecture</h3>
            <p className="mt-4 text-sm font-bold leading-7 text-black">
              Built on a distributed stack that ensures low-latency predictions and high availability for enterprise workloads.
            </p>
          </div>
          <div className="p-8 rounded-[2rem] border border-blue-100 bg-white shadow-sm transition-hover">
            <h3 className="text-lg font-extrabold text-black">Human Centered</h3>
            <p className="mt-4 text-sm font-bold leading-7 text-black">
              We focus on the daily experience of the CS Manager, making retention work feel effortless and organized.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export default AboutPage;

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const heroMetrics = [
  { label: "Precision", value: "99.9%", detail: "Model accuracy" },
  { label: "Scoring", value: "0.5s", detail: "Realtime latency" },
  { label: "Impact", value: "10x", detail: "Retention speed" }
];

const features = [
  {
    title: "Operating Surface",
    text: "Review risk, assign follow-ups, and track success from one focused dashboard designed for daily execution.",
    accent: "bg-blue-600"
  },
  {
    title: "Retention Logic",
    text: "Convert scores into action plans. Use built-in playbooks or customize follow-ups based on risk bands.",
    accent: "bg-blue-500"
  },
  {
    title: "ML Traceability",
    text: "Understand every score. Gemini-powered signals explain why a customer is at risk in plain business language.",
    accent: "bg-blue-400"
  }
];

const pillars = [
  "Operational clarity over technical complexity",
  "Model-backed decisions with complete human control",
  "Enterprise-grade security and production-minded design",
];

const cases = [
  { company: "Enterprise Telco X", lift: "+9.4%", summary: "Prioritized high-risk month-to-month contracts and reduced cycle time for proactive outreach." },
  { company: "Growth SaaS Platform", lift: "+7.1%", summary: "Linked churn risk directly to onboarding plateaus and reduced early stage cancellations." },
  { company: "B2B Logistics Global", lift: "+11.8%", summary: "Mapped overall account health to renewal workflows to prevent high-value drop-off." },
];

const integrations = [
  { name: "CSV / Excel Imports", detail: "Fast, reliable file ingestion for teams without direct engineering data pipelines." },
  { name: "Native REST APIs", detail: "Programmatic hooks for customer ingest, advanced scoring, and action orchestration." },
  { name: "Inference Engine", detail: "Dedicated FastAPI service layer for model lifecycle and prediction metadata." },
  { name: "Entity Synchronization", detail: "High-performance persistence layer for users, predictions, and operational logging." },
];

const plans = [
  { name: "Starter", price: "$39", cadence: "/mo", detail: "Small teams", points: ["10k customers/mo", "Single workspace", "Email support"] },
  { name: "Growth", price: "$129", cadence: "/mo", detail: "Scaling retention teams", points: ["100k customers/mo", "Batch scoring API", "Role-based access"], featured: true },
  { name: "Scale", price: "Custom", cadence: "", detail: "Enterprise deployment", points: ["Unlimited volume", "Custom infra", "Priority SLA"] }
];

const faqs = [
  {
    q: "Can we use RetainQ beyond telco datasets?",
    a: "Yes. While our starting templates are telco-optimized, the underlying architecture is designed to support any subscription-based or transactional business model with custom feature mapping.",
  },
  {
    q: "Is the AI service separated from administrative logic?",
    a: "Yes. Our FastAPI-based induction system handles LLM and predictive inference independently, while the Node.js core manages authentication, entity relationships, and operational governance.",
  },
  {
    q: "Can non-technical teams operate the platform?",
    a: "That is our primary goal. RetainQ's experience is built around clear operational steps: import, analyze, prioritize, and action—making advanced ML accessible to every success leader.",
  },
  {
    q: "How do we move to production environment safely?",
    a: "We provide environment-specific configurations, strict secrets management, health checks, and role-based access control (RBAC) to ensure your data stays protected at scale.",
  },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);

  return (
    <div className="bg-blue-50 selection:bg-blue-200 selection:text-black">
      {/* Hero Section */}
      <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center sm:px-8">
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-[120px]" />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600 shadow-sm ring-1 ring-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              RetainQ for B2B Teams
            </span>
            <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-black sm:text-7xl lg:text-8xl">
              Retention, <span className="text-blue-600 italic font-accent font-normal underline underline-offset-[12px] decoration-blue-100/80">simplified</span>.
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-[17px] font-bold leading-8 text-black sm:text-lg">
              Transform churn prediction into a daily operating advantage. One workspace to score, prioritize, and act on at-risk customers.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Link to={isAuthenticated ? "/app/dashboard" : "/signup"} className="btn-primary px-8 py-4 text-base shadow-blue-200">
                {isAuthenticated ? "Open workspace" : "Get Started Free"}
              </Link>
              <a href="#features" className="btn-secondary px-8 py-4 text-base">
                View features
              </a>
            </div>
          </motion.div>

          <motion.div 
            className="mt-20 grid grid-cols-3 gap-8 border-t border-blue-200 pt-16"
            style={{ y: y1 }}
          >
            {heroMetrics.map((item, index) => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-black sm:text-4xl">{item.value}</p>
                <p className="mt-1 text-xs font-bold text-blue-700">{item.detail}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:px-8">
        <div className="mb-20 text-center">
          <p className="workspace-kicker">Capabilities</p>
          <h2 className="mt-4 text-4xl font-bold text-black sm:text-5xl">Built for operations.</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group rounded-[2.5rem] bg-white p-10 border border-blue-100 transition-all duration-500 hover:shadow-premium hover:-translate-y-2 hover:border-blue-200"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className={`h-12 w-12 rounded-2xl ${feature.accent} shadow-lg shadow-blue-100`} />
              <h3 className="mt-8 text-2xl font-bold text-black">{feature.title}</h3>
              <p className="mt-4 text-[15px] font-bold leading-7 text-black">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Philosophy Section (About) */}
      <section id="why-us" className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="workspace-kicker">Our Philosophy</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-black sm:text-6xl">
              Designed for practical <span className="text-blue-600 italic font-accent font-normal">retention</span> work.
            </h2>
            <p className="mt-8 text-lg font-bold leading-8 text-black">
              RetainQ combines a high-performance operating surface with dedicated AI inference services, allowing Customer Success teams to move quickly without compromising on technical rigor.
            </p>
          </motion.div>

          <div className="space-y-4">
            {pillars.map((item, index) => (
              <motion.div 
                key={item}
                className="flex items-start gap-4 p-6 rounded-[2rem] bg-white border border-blue-200 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                <span className="text-[15px] font-bold text-black">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories (Case Studies) */}
      <section id="testimonials" className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:px-8 text-center">
        <p className="workspace-kicker">Success Stories</p>
        <h2 className="mt-4 text-4xl font-extrabold text-black sm:text-6xl">Outcomes proven in practice.</h2>
        
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {cases.map((item, index) => (
            <motion.article 
              key={item.company} 
              className="group rounded-[2.5rem] border border-blue-200 bg-white p-8 text-left shadow-premium transition-all hover:-translate-y-2 hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">{item.company}</p>
              <p className="mt-4 text-4xl font-extrabold text-black">{item.lift}</p>
              <div className="mt-6 h-px w-full bg-blue-100" />
              <p className="mt-6 text-[14px] font-bold leading-7 text-black">{item.summary}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Connectivity (Integrations) */}
      <section id="resources" className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:px-8">
        <div className="text-center mb-16">
          <p className="workspace-kicker">Connectivity</p>
          <h2 className="mt-4 text-4xl font-extrabold text-black sm:text-6xl">Connect to your stack.</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map((item, index) => (
            <motion.article 
              key={item.name} 
              className="rounded-[2.5rem] border border-blue-200 bg-white p-10 shadow-premium transition-all hover:bg-white/80"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100 mb-8">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-black">{item.name}</h2>
              <p className="mt-4 text-[15px] font-bold leading-7 text-black">{item.detail}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:px-8">
        <div className="text-center mb-16">
          <p className="workspace-kicker">Pricing</p>
          <h2 className="mt-4 text-4xl font-extrabold text-black sm:text-6xl">Plans for every stage.</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article 
              key={plan.name} 
              className={[
                "relative rounded-[2.5rem] border p-8 shadow-premium transition-all hover:-translate-y-2",
                plan.featured ? "border-blue-300 bg-white shadow-xl scale-105 z-10" : "border-blue-200 bg-white"
              ].join(" ")}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {plan.featured && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Most Popular
                </span>
              )}
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900">{plan.detail}</p>
              <h2 className="mt-3 text-3xl font-extrabold text-black">{plan.name}</h2>
              <div className="mt-6 flex items-baseline gap-1">
                <p className="text-5xl font-extrabold tracking-tight text-black">{plan.price}</p>
                <p className="text-sm font-bold text-blue-600">{plan.cadence}</p>
              </div>
              
              <ul className="mt-10 space-y-4">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-[13px] font-bold text-black">
                    <svg className="h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link
                  to="/signup"
                  className={[
                    "flex w-full items-center justify-center rounded-full py-4 text-xs font-extrabold uppercase tracking-widest transition-all",
                    plan.featured 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700" 
                      : "border border-blue-200 bg-white text-black hover:bg-blue-50"
                  ].join(" ")}
                >
                  Choose {plan.name}
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 mx-auto max-w-4xl px-6 py-32 sm:px-8">
        <div className="text-center mb-16">
          <p className="workspace-kicker">Knowledge Base</p>
          <h2 className="mt-4 text-4xl font-extrabold text-black sm:text-6xl">FAQ.</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <motion.details 
              key={item.q} 
              className="group rounded-3xl border border-blue-200 bg-white p-6 shadow-sm transition-all hover:shadow-md open:shadow-premium"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold text-black">
                <span>{item.q}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-open:rotate-180">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                </span>
              </summary>
              <div className="mt-6 border-t border-blue-50 pt-4">
                <p className="text-[14px] font-bold leading-7 text-black/80">{item.a}</p>
              </div>
            </motion.details>
          ))}
        </div>
      </section>

      {/* Quote / Highlight */}
      <section className="bg-black px-6 py-40 sm:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p 
            className="text-3xl font-bold leading-[1.4] text-white sm:text-5xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            "We moved from weekly spreadsheet reviews to <span className="text-blue-400 italic font-accent font-normal underline underline-offset-8 decoration-blue-500">daily retention action</span>. The team finally knew exactly who to call first."
          </motion.p>
          <p className="mt-10 text-sm font-bold uppercase tracking-widest text-blue-400">
            VP Customer Success, Waveform Cloud
          </p>
        </div>
      </section>

      {/* CTA Footer */}
      <section id="contact" className="px-6 py-32 sm:px-8 relative z-10">
        <div className="mx-auto max-w-5xl rounded-[3rem] bg-white border-2 border-black px-10 py-20 text-center shadow-premium">
          <h2 className="text-4xl font-bold sm:text-6xl text-black">Ready for better retention?</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-bold text-black">
            Ship your first scoring cycle in minutes, not months. Join the teams turning churn into growth.
          </p>
          <div className="mt-12">
            <Link to="/signup" className="rounded-full bg-blue-600 px-10 py-4 text-base font-bold text-white transition-transform hover:scale-105 inline-block">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

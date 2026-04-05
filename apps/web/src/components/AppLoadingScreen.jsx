import { motion } from "framer-motion";

const AppLoadingScreen = ({
  title = "Preparing your workspace",
  message = "Restoring your session, workspace context, and the next best screen for you."
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-white">
      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-7 shadow-soft"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <div className="pointer-events-none absolute -left-8 top-0 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            />
          </div>
          <div>
            <p className="workspace-kicker">ChurnFlow</p>
            <h2 className="mt-1 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              {title}
            </h2>
          </div>
        </div>

        <p className="relative z-10 mt-4 text-sm leading-7 text-slate-300/78">
          {message}
        </p>

        <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
          <div className="workspace-stat">
            <p className="workspace-kicker">Session</p>
            <div className="skeleton mt-3 h-4 w-16" />
          </div>
          <div className="workspace-stat">
            <p className="workspace-kicker">Workspace</p>
            <div className="skeleton mt-3 h-4 w-20" />
          </div>
          <div className="workspace-stat">
            <p className="workspace-kicker">Flow</p>
            <div className="skeleton mt-3 h-4 w-14" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AppLoadingScreen;

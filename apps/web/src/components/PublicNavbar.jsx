import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItemVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.34, delay: 0.08 + index * 0.05, ease: "easeOut" }
  })
};

const drawerVariants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { duration: 0.34, ease: "easeOut" } },
  exit: { x: "100%", transition: { duration: 0.28, ease: "easeInOut" } }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28 } },
  exit: { opacity: 0, transition: { duration: 0.22 } }
};

const MenuToggleIcon = ({ open }) => {
  return (
    <span className="relative block h-4 w-4">
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-4 rounded-full bg-current"
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-4 rounded-full bg-current"
        animate={open ? { opacity: 0, scaleX: 0.3 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-4 rounded-full bg-current"
        animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
      />
    </span>
  );
}

const ArrowRight = () => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PublicNavbar = ({ onOpenAuth, navItems = [] }) => {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  }

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: scrolled ? "rgba(9,9,11,0.88)" : "rgba(9,9,11,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid transparent"
        }}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="group flex items-center gap-2 no-underline" onClick={closeMenu}>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/90">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L6 2l4 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.5 7h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[13px] font-medium tracking-[0.14em] text-[#fafafa]">CHURNFLOW</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={`/${item.href}`}
                className="rounded-full px-3 py-1.5 text-[11px] font-normal uppercase tracking-[0.1em] text-white/40 transition-colors duration-200 hover:bg-white/[0.04] hover:text-white/75 no-underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <>
                <Link
                  to="/app/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#fafafa] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] no-underline transition-all duration-200 hover:-translate-y-px hover:bg-[#e4e4e7]"
                >
                  Open App
                  <ArrowRight />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-[11px] font-normal uppercase tracking-[0.1em] text-white/50 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04] hover:text-white/80"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth("login")}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-[11px] font-normal uppercase tracking-[0.1em] text-white/50 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04] hover:text-white/80"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth("signup")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#fafafa] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition-all duration-200 hover:-translate-y-px hover:bg-[#e4e4e7]"
                >
                  Start Free
                  <ArrowRight />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/90 lg:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <MenuToggleIcon open={menuOpen} />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] lg:hidden"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeMenu}
              aria-hidden="true"
            />

            <motion.aside
              className="fixed right-0 top-0 z-[70] flex h-screen w-[78%] max-w-[300px] flex-col border-l border-white/10 bg-[#0d0d10]/95 lg:hidden"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)"
              }}
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-hidden={!menuOpen}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <Link to="/" className="flex items-center gap-2 no-underline" onClick={closeMenu}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/90">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 10L6 2l4 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.5 7h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="text-[12px] font-medium tracking-[0.14em] text-[#fafafa]">CHURNFLOW</span>
                </Link>

                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <MenuToggleIcon open />
                </button>
              </div>

              {navItems.length > 0 && (
                <nav className="px-3 pb-2 pt-4">
                  <p className="mb-2 px-3 text-[9px] uppercase tracking-[0.15em] text-white/20">Navigation</p>
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      custom={index}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Link
                        to={`/${item.href}`}
                        onClick={closeMenu}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[12px] uppercase tracking-widest text-white/45 no-underline transition-all duration-150 hover:bg-white/5 hover:text-white/80"
                      >
                        {item.label}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-30">
                          <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              )}

              <div className="mx-5 my-2 h-px bg-white/5" />

              <div className="flex flex-col gap-2 px-4 pb-6 pt-2">
                <p className="mb-1 px-1 text-[9px] uppercase tracking-[0.15em] text-white/20">Account</p>
                {isAuthenticated ? (
                  <motion.div custom={navItems.length + 1} variants={menuItemVariants} initial="hidden" animate="visible">
                    <div className="grid gap-2">
                      <Link
                        to="/app/dashboard"
                        onClick={closeMenu}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fafafa] px-4 py-2.5 text-[11px] font-medium uppercase tracking-widest text-[#09090b] no-underline transition hover:bg-[#e4e4e7]"
                      >
                        Open App
                        <ArrowRight />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          logout();
                        }}
                        className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-[11px] font-normal uppercase tracking-widest text-white/55 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white/80"
                      >
                        Logout
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <motion.button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        onOpenAuth("login");
                      }}
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-[11px] font-normal uppercase tracking-widest text-white/55 transition hover:border-white/20 hover:bg-white/4 hover:text-white/80"
                      custom={navItems.length + 1}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      Login
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        onOpenAuth("signup");
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fafafa] px-4 py-2.5 text-[11px] font-medium uppercase tracking-widest text-[#09090b] transition hover:bg-[#e4e4e7]"
                      custom={navItems.length + 2}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      Start Free
                      <ArrowRight />
                    </motion.button>
                  </>
                )}
              </div>

              <div className="mt-auto border-t border-white/5 px-5 py-4">
                <p className="text-[10px] text-white/18">(c) 2026 ChurnFlow | B2B Retention Platform</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default PublicNavbar;

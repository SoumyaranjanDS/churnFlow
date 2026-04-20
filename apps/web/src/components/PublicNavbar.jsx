import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLockup from "./BrandLockup";

const menuItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.1 + index * 0.05, ease: [0.215, 0.61, 0.355, 1] }
  })
};

const MenuToggleIcon = ({ open }) => {
  return (
    <span className="relative block h-4 w-4">
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-4 rounded-full bg-black"
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-4 rounded-full bg-black"
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-4 rounded-full bg-black"
        animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </span>
  );
}

const PublicNavbar = ({ onOpenAuth, navItems = [] }) => {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);



  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 sm:px-6">
      <motion.div
        className="flex w-full max-w-6xl items-center justify-between rounded-full border border-blue-200 bg-white/90 px-5 py-2.5 shadow-premium backdrop-blur-xl transition-all duration-500"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <Link to="/" className="no-underline">
          <BrandLockup size="sm" showSubtitle={false} titleClassName="tracking-tight transition-all text-base" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={`/${item.href}`}
              className="rounded-full px-4 py-2 text-[12px] font-bold text-black transition-colors hover:bg-blue-50 hover:text-blue-600 no-underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/app/dashboard"
                className="btn-primary px-5 py-2 text-[11px]! no-underline"
              >
                Go to Workspace
              </Link>
              <button
                type="button"
                onClick={logout}
                className="btn-secondary border-none bg-transparent px-4 py-2 text-[11px]! transition-colors hover:bg-blue-50 hover:text-blue-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="text-[12px] font-bold text-black transition-colors hover:text-blue-600"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth("signup")}
                className="btn-primary px-5 py-2.5 text-[11px]!"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white shadow-premium transition-transform hover:scale-105 lg:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <MenuToggleIcon open={menuOpen} />
        </button>
      </motion.div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 top-0 left-0 z-40 bg-white"
            initial={{ clipPath: "circle(0% at 90% 5%)" }}
            animate={{ clipPath: "circle(150% at 90% 5%)" }}
            exit={{ clipPath: "circle(0% at 90% 5%)" }}
            transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <div className="flex h-full flex-col p-8 pt-24">
              <button 
                type="button" 
                onClick={() => setMenuOpen(false)}
                className="absolute top-8 right-8 flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white shadow-premium text-black hover:bg-blue-50 z-50 transition-transform active:scale-95"
                aria-label="Close menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <nav className="flex flex-col gap-6">
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
                      onClick={() => setMenuOpen(false)}
                      className="text-4xl font-bold tracking-tight text-black no-underline"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-4 border-t border-blue-100 pt-8">
                {isAuthenticated ? (
                  <Link to="/app/dashboard" className="btn-primary w-full py-4 text-sm no-underline">
                    Workspace
                  </Link>
                ) : (
                  <>
                    <button onClick={() => onOpenAuth("signup")} className="btn-primary w-full py-4 text-sm">
                      Get Started
                    </button>
                    <button onClick={() => onOpenAuth("login")} className="btn-secondary w-full py-4 text-sm">
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default PublicNavbar;

import { Suspense, lazy, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./components/AuthModal";
import AppLoadingScreen from "./components/AppLoadingScreen";
import PublicNavbar from "./components/PublicNavbar";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteAnalyticsTracker from "./components/RouteAnalyticsTracker";
import { useAuth } from "./context/AuthContext";
const ActionCenterPage = lazy(() => import("./pages/App/ActionCenterPage"));
const AnalyzeCustomersPage = lazy(() => import("./pages/App/AnalyzeCustomersPage"));
const AppDashboardPage = lazy(() => import("./pages/App/AppDashboardPage"));
const AtRiskCustomersPage = lazy(() => import("./pages/App/AtRiskCustomersPage"));
const CustomOnboardingPage = lazy(() => import("./pages/App/CustomOnboardingPage"));
const CustomersPage = lazy(() => import("./pages/App/CustomersPage"));
const ResultsPage = lazy(() => import("./pages/App/ResultsPage"));
const TrainingPage = lazy(() => import("./pages/App/TrainingPage"));
const UploadCustomersPage = lazy(() => import("./pages/App/UploadCustomersPage"));
const CheckoutPage = lazy(() => import("./pages/Public/CheckoutPage"));
const LandingPage = lazy(() => import("./pages/Public/LandingPage"));
const PrivacyPage = lazy(() => import("./pages/Public/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/Public/TermsPage"));

const appNavItems = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/customers", label: "Customers" },
  { to: "/app/upload", label: "1. Upload" },
  { to: "/app/analyze", label: "2. Analyze" },
  { to: "/app/at-risk", label: "3. At-Risk" },
  { to: "/app/actions", label: "4. Actions" },
  { to: "/app/results", label: "5. Results" },
  { to: "/app/custom-setup", label: "Custom Setup" },
  { to: "/app/training", label: "Training" }
];

const siteNavItems = [
  { href: "#hero", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#why-us", label: "Why Us" },
  { href: "#testimonials", label: "Stories" },
  { href: "#resources", label: "Resources" },
  { href: "#faq", label: "FAQ" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" }
];

const routeFallback = (title, message) => (
  <AppLoadingScreen title={title} message={message} />
);

const HashScrollManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const id = location.hash.slice(1);

    const scrollToSection = () => {
      const element = document.getElementById(id);
      if (!element) return false;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }

    if (scrollToSection()) return undefined;

    const timeoutId = window.setTimeout(scrollToSection, 80);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.hash]);

  return null;
}

const PublicFooter = () => {
  return (
    <motion.footer
      className="border-t border-white/10 bg-[#0b0b0d]"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="grid gap-8 border-b border-white/8 pb-6 md:grid-cols-[1.35fr_repeat(4,1fr)]">
          <div>
            <p className="font-display text-sm tracking-[0.16em] text-[#fafafa]">CHURNFLOW</p>
            <p className="mt-3 max-w-xs text-xs leading-6 text-white/45">
              Churn prediction and retention operations platform for modern B2B teams.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Product</p>
            <ul className="mt-3 space-y-2 text-xs text-white/45">
              <li><Link to="/#features" className="hover:text-white/80">Features</Link></li>
              <li><Link to="/#pricing" className="hover:text-white/80">Pricing</Link></li>
              <li><Link to="/#resources" className="hover:text-white/80">Resources</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Company</p>
            <ul className="mt-3 space-y-2 text-xs text-white/45">
              <li><Link to="/#why-us" className="hover:text-white/80">Why Us</Link></li>
              <li><Link to="/#testimonials" className="hover:text-white/80">Stories</Link></li>
              <li><Link to="/#contact" className="hover:text-white/80">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Support</p>
            <ul className="mt-3 space-y-2 text-xs text-white/45">
              <li><Link to="/#faq" className="hover:text-white/80">FAQ</Link></li>
              <li><Link to="/login" className="hover:text-white/80">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white/80">Sign Up</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Legal</p>
            <ul className="mt-3 space-y-2 text-xs text-white/45">
              <li><Link to="/privacy" className="hover:text-white/80">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-white/80">Terms</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 text-center text-[11px] text-white/35 sm:px-8">
        (c) {new Date().getFullYear()} ChurnFlow
      </div>
    </motion.footer>
  );
}

const PublicSiteLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const authParam = params.get("auth") || "";
  const validAuthModes = ["login", "signup", "verify", "forgot", "reset"];
  const isAuthModalOpen = validAuthModes.includes(authParam);
  const authMode = validAuthModes.includes(authParam) ? authParam : "login";
  const selectedPlan = params.get("plan") || "";
  const selectedBilling = params.get("billing") || "";
  const redirectTo = location.state?.from || "/app/dashboard";
  const prefillEmail = params.get("email") || location.state?.email || "";
  const prefillToken = params.get("token") || location.state?.token || "";
  const notice = location.state?.notice || "";

  const updateAuthQuery = (mode, options = {}) => {
    const nextParams = new URLSearchParams(location.search);
    if (mode) {
      nextParams.set("auth", mode);
    } else {
      nextParams.delete("auth");
    }
    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : ""
      },
      options
    );
  }

  const openAuth = (mode) => {
    updateAuthQuery(mode, { state: null });
  }

  const setAuthMode = (mode) => {
    updateAuthQuery(mode, { replace: true, state: location.state });
  }

  const closeAuth = () => {
    updateAuthQuery(null, { replace: true, state: location.state });
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      <HashScrollManager />
      <PublicNavbar onOpenAuth={openAuth} navItems={siteNavItems} />
      <main>
        <Suspense fallback={routeFallback("Opening page", "Loading the next screen and preparing the right layout.")}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<Navigate to="/#features" replace />} />
            <Route path="/why-us" element={<Navigate to="/#why-us" replace />} />
            <Route path="/stories" element={<Navigate to="/#testimonials" replace />} />
            <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/resources" element={<Navigate to="/#resources" replace />} />
            <Route path="/faq" element={<Navigate to="/#faq" replace />} />
            <Route path="/contact" element={<Navigate to="/#contact" replace />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <PublicFooter />
      {!isAuthenticated && (
        <AuthModal
          isOpen={isAuthModalOpen}
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={closeAuth}
          redirectTo={redirectTo}
          prefillEmail={prefillEmail}
          prefillToken={prefillToken}
          notice={notice}
          selectedPlan={selectedPlan}
          selectedBilling={selectedBilling}
        />
      )}
    </div>
  );
}

const AuthRouteRedirect = ({ mode }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set("auth", mode);
  return <Navigate to={`/?${params.toString()}`} replace state={location.state} />;
}

const WorkspaceLayout = () => {
  const { user, logout } = useAuth();
  const isCustomJourney = user?.currentTenant?.industryType === "custom";
  const onboardingStatus = user?.currentTenant?.onboardingStatus || "prediction_ready";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="relative min-h-screen bg-[#0a0b10] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_35%_at_15%_0%,rgba(99,102,241,0.14),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(35%_25%_at_85%_0%,rgba(236,72,153,0.12),transparent_65%)]" />
      <PublicNavbar onOpenAuth={() => {}} navItems={siteNavItems} />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="workspace-hero mb-6">
          <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)]" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="workspace-kicker">Workspace</p>
              <h1 className="mt-3 text-3xl text-white sm:text-[2.4rem]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Retention operations, organized for daily execution.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300/80">
                Review the queue, score new customers, assign follow-ups, and capture outcome proof from one calm operating surface.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-sm lg:justify-end">
              <div className="workspace-stat min-w-[150px]">
                <p className="workspace-kicker">Signed in</p>
                <p className="mt-2 text-sm text-white">{user?.name || "-"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{user?.role || "-"}</p>
              </div>
              <div className="workspace-stat min-w-[150px]">
                <p className="workspace-kicker">Workspace</p>
                <p className="mt-2 text-sm text-white">{user?.currentTenant?.name || "Telecom workspace"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{user?.currentTenant?.industryType || "telecom"}</p>
              </div>
              <div className="workspace-stat flex min-w-[150px] items-center justify-between gap-4">
                <div>
                  <p className="workspace-kicker">Session</p>
                  <p className="mt-2 text-sm text-white">Workspace active</p>
                </div>
                <button type="button" onClick={logout} className="btn-secondary border-white/18 bg-white/6 px-3! py-2! text-[11px] text-white hover:bg-white/10">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {isCustomJourney && onboardingStatus !== "active" && (
          <div className="mb-6 rounded-[1.7rem] border border-sky-300/20 bg-sky-500/10 p-5 text-sky-50">
            <p className="workspace-kicker text-sky-100/70">Custom model path</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg text-white">Your workspace is on the custom-model journey.</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50/80">
                  Finish dataset setup, review Gemini&apos;s guesses, and train the first tenant model. After deployment, this workspace will behave like the daily scoring flow.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/app/custom-setup" className="btn-primary">
                  Open Custom Setup
                </Link>
                <Link to="/app/training" className="btn-secondary">
                  Open Training
                </Link>
              </div>
            </div>
          </div>
        )}

        <nav className="hide-scrollbar mb-7 overflow-x-auto rounded-full border border-white/12 bg-white/[0.04] p-2 shadow-soft">
          <div className="flex min-w-max gap-2">
            {appNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-4 py-2 text-xs font-medium transition",
                    isActive
                      ? "bg-[linear-gradient(135deg,rgba(244,244,245,1),rgba(228,228,231,0.95))] text-slate-900"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <Suspense fallback={routeFallback("Opening workspace", "Loading the next workflow step for this workspace.")}>
          <Routes>
            <Route path="/dashboard" element={<AppDashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/upload" element={<UploadCustomersPage />} />
            <Route path="/analyze" element={<AnalyzeCustomersPage />} />
            <Route path="/at-risk" element={<AtRiskCustomersPage />} />
            <Route path="/actions" element={<ActionCenterPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/custom-setup" element={<CustomOnboardingPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </div>
  );
}

const App = () => {
  return (
    <>
      <RouteAnalyticsTracker />
      <Routes>
        <Route path="/app/*" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>} />
        <Route path="/login" element={<AuthRouteRedirect mode="login" />} />
        <Route path="/signup" element={<AuthRouteRedirect mode="signup" />} />
        <Route path="/verify-email" element={<AuthRouteRedirect mode="verify" />} />
        <Route path="/forgot-password" element={<AuthRouteRedirect mode="forgot" />} />
        <Route path="/reset-password" element={<AuthRouteRedirect mode="reset" />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/*" element={<PublicSiteLayout />} />
      </Routes>
    </>
  );
}

export default App;














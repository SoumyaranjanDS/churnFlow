import { Suspense, lazy, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Lenis from "lenis";
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
  { to: "/app/dashboard", label: "Overview" },
  { to: "/app/customers", label: "Directory" },
  { to: "/app/upload", label: "Import" },
  { to: "/app/analyze", label: "Analyze" },
  { to: "/app/at-risk", label: "Risk Queue" },
  { to: "/app/actions", label: "Actions" },
  { to: "/app/results", label: "Outcomes" },
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

const ScrollManager = () => {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    }
  }, []);

  useEffect(() => {
    if (!location.hash) {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0 });
      }
      return;
    }

    const id = location.hash.slice(1);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.pathname, location.hash]);

  return null;
}

const PublicFooter = () => {
  return (
    <footer className="border-t border-blue-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <div className="grid gap-10 border-b border-blue-100 pb-10 md:grid-cols-5">
          <div className="col-span-2">
            <p className="font-display text-base font-bold tracking-tight text-black">RETAINQ</p>
            <p className="mt-4 max-w-xs text-sm leading-7 text-black">
              Transforming churn prediction into a daily operating advantage for modern B2B teams.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black">Product</p>
            <ul className="mt-4 space-y-3 text-sm text-black font-medium">
              <li><Link to="/#features" className="hover:text-blue-600">Features</Link></li>
              <li><Link to="/#pricing" className="hover:text-blue-600">Pricing</Link></li>
              <li><Link to="/#resources" className="hover:text-blue-600">Resources</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-black font-medium">
              <li><Link to="/#why-us" className="hover:text-blue-600">Why Us</Link></li>
              <li><Link to="/#testimonials" className="hover:text-blue-600">Stories</Link></li>
              <li><Link to="/#contact" className="hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black">Legal</p>
            <ul className="mt-4 space-y-3 text-sm text-black font-medium">
              <li><Link to="/privacy" className="hover:text-blue-600">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 text-center text-xs font-bold text-black">
          (c) {new Date().getFullYear()} RetainQ. All rights reserved.
        </div>
      </div>
    </footer>
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
    <div className="flex min-h-screen flex-col bg-blue-50 text-black">
      <ScrollManager />
      <PublicNavbar onOpenAuth={openAuth} navItems={siteNavItems} />
      <main className="flex-1">
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
    <div className="flex min-h-screen flex-col bg-blue-50 text-black">
      <ScrollManager />
      <PublicNavbar onOpenAuth={() => {}} navItems={siteNavItems} />

      <motion.div
        className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="workspace-hero mb-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="workspace-kicker">Workspace</p>
              <h1 className="mt-4 text-4xl text-black sm:text-5xl">
                Retention operations, <span className="text-blue-500 italic font-accent font-normal">organized</span> for execution.
              </h1>
              <p className="mt-4 max-w-lg text-[15px] leading-7 text-black font-medium">
                Review the queue, score customers, and assign follow-ups from one calm operating surface.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap lg:max-w-sm lg:justify-end">
              <div className="workspace-stat min-w-[160px]">
                <p className="workspace-kicker">Team Member</p>
                <p className="mt-2 text-sm font-bold text-black">{user?.name || "-"}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-black font-bold">{user?.role || "Staff"}</p>
              </div>
              <div className="workspace-stat min-w-[160px]">
                <p className="workspace-kicker">Environment</p>
                <p className="mt-2 text-sm font-bold text-black">{user?.currentTenant?.name || "Workspace"}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-black font-bold">{user?.currentTenant?.industryType || "standard"}</p>
              </div>
              <div className="workspace-stat flex min-w-[160px] items-center justify-between gap-4">
                <div>
                  <p className="workspace-kicker">Daily Rhythm</p>
                  <p className="mt-2 text-sm font-bold text-black">Active</p>
                </div>
                <button type="button" onClick={logout} className="rounded-full border border-blue-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {isCustomJourney && onboardingStatus !== "active" && (
          <div className="mb-8 rounded-[2rem] border border-blue-200 bg-white p-6 shadow-premium">
            <p className="workspace-kicker text-blue-600">Custom model path</p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xl font-bold text-black">Your workspace is on the custom-model journey.</p>
                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-black font-medium">
                  Finish dataset setup, review Gemini&apos;s guesses, and train the first tenant model. After deployment, this workspace will unlock daily scoring.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/app/custom-setup" className="btn-primary px-5 py-2.5 text-[11px]!">
                  Open Custom Setup
                </Link>
                <Link to="/app/training" className="btn-secondary px-5 py-2.5 text-[11px]!">
                  Open Training
                </Link>
              </div>
            </div>
          </div>
        )}

        <nav className="hide-scrollbar mb-8 overflow-x-auto">
          <div className="flex min-w-max gap-6 border-b border-blue-200">
            {appNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "relative pb-4 text-[13px] font-bold transition-colors",
                    isActive
                      ? "text-blue-600 after:absolute after:bottom-[-1px] after:left-0 after:h-0.5 after:w-full after:bg-blue-600"
                      : "text-black/60 hover:text-black"
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

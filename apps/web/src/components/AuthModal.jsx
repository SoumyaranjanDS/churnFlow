
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getPlanById } from "../content/pricing";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { trackProductEvent } from "../services/analytics";

const MODES = {
  LOGIN: "login",
  SIGNUP: "signup",
  VERIFY: "verify",
  FORGOT: "forgot",
  RESET: "reset"
};

const WORKSPACE_OPTIONS = {
  telecom: {
    label: "Use telecom starter",
    eyebrow: "Fastest launch",
    helper: "Start with the built-in telecom churn model and move straight into upload, analysis, queue, and follow-up.",
    nextSteps: ["Create telecom workspace", "Upload customer records", "Start scoring immediately"]
  },
  custom: {
    label: "Build custom model",
    eyebrow: "Flexible setup",
    helper: "Start with your own dataset, confirm Gemini's guesses, train a tenant model, and then run predictions on your own schema.",
    nextSteps: ["Create custom workspace", "Open Custom Setup", "Train and deploy your model"]
  }
};

const RECOVERY_COPY = {
  forgot: {
    eyebrow: "Password help",
    title: "Reset access without losing your workspace",
    body: "Enter the email tied to your account. We will send a reset link, and in local development we will also surface the token directly so you can keep moving.",
    tips: ["Request a reset email", "Open the reset screen", "Set a new password and continue"]
  },
  reset: {
    eyebrow: "Secure return",
    title: "Set your new password",
    body: "Use the token from the email, choose a new password, and we will take you back into the correct workspace flow automatically.",
    tips: ["Confirm the email", "Paste the reset token", "Choose a fresh password"]
  }
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "case", label: "Uppercase and lowercase", test: (value) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { id: "number", label: "At least one number", test: (value) => /\d/.test(value) },
  { id: "symbol", label: "At least one symbol", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

const isVerificationError = (message) => {
  if (!message) return false;
  return message.toLowerCase().includes("not verified");
};

const getWorkspaceRedirect = ({ redirectTo = "/app/dashboard", user = null, fallbackIntent = "telecom" }) => {
  if (redirectTo && redirectTo !== "/app/dashboard") {
    return redirectTo;
  }

  const industryType = user?.currentTenant?.industryType || fallbackIntent;
  const onboardingStatus = user?.currentTenant?.onboardingStatus || "";

  if (industryType === "custom") {
    return onboardingStatus === "active" ? "/app/dashboard" : "/app/custom-setup";
  }

  return "/app/dashboard";
};

const getModeTitle = (mode) => {
  if (mode === MODES.LOGIN) return "Welcome back";
  if (mode === MODES.SIGNUP) return "Choose your starting path";
  if (mode === MODES.VERIFY) return "Verify your workspace access";
  if (mode === MODES.FORGOT) return RECOVERY_COPY.forgot.title;
  return RECOVERY_COPY.reset.title;
};

const getModeBody = (mode) => {
  if (mode === MODES.LOGIN) return "Sign in to continue with the workspace, model, and retention flow you were already building.";
  if (mode === MODES.SIGNUP) return "Create a workspace that matches how you want to start: instant telecom scoring or a custom-model build path.";
  if (mode === MODES.VERIFY) return "One quick verification step and we will send you to the right workspace flow automatically.";
  return RECOVERY_COPY[mode]?.body || "";
};

const getPlanPriceLabel = (plan, billing) => {
  if (!plan) return "";
  if (billing === "yearly") return plan.yearlyPrice;
  return `${plan.monthlyPrice}/month`;
};

const getPasswordHealth = (password = "") => {
  const checks = PASSWORD_REQUIREMENTS.map((rule) => ({
    ...rule,
    passed: rule.test(String(password || ""))
  }));
  const passedCount = checks.filter((item) => item.passed).length;

  if (!password) {
    return {
      checks,
      passedCount,
      label: "Start with a strong password",
      helper: "Use a password your team can trust on a work account.",
      accent: "from-slate-500/60 to-slate-300/30",
      border: "border-white/10 bg-white/[0.04]",
      meter: 0
    };
  }

  if (passedCount <= 1) {
    return {
      checks,
      passedCount,
      label: "Needs work",
      helper: "Add more variety so the account is harder to guess.",
      accent: "from-red-400/80 to-orange-300/60",
      border: "border-red-300/20 bg-red-500/10",
      meter: 1
    };
  }

  if (passedCount <= 3) {
    return {
      checks,
      passedCount,
      label: "Good start",
      helper: "One or two stronger details will make this much better.",
      accent: "from-amber-300/80 to-fuchsia-300/60",
      border: "border-amber-300/20 bg-amber-500/10",
      meter: 2
    };
  }

  return {
    checks,
    passedCount,
    label: "Strong password",
    helper: "This looks ready for a work account.",
    accent: "from-emerald-300/80 to-sky-300/60",
    border: "border-emerald-300/20 bg-emerald-500/10",
    meter: 4
  };
};

const PasswordStrengthPanel = ({ password, confirmPassword = "", showConfirm = false }) => {
  const health = getPasswordHealth(password);
  const confirmState = showConfirm
    ? !confirmPassword
      ? {
          label: "Re-enter the password once to confirm it.",
          className: "text-slate-400"
        }
      : password === confirmPassword
        ? {
            label: "Passwords match.",
            className: "text-emerald-200"
          }
        : {
            label: "The confirmation password still does not match.",
            className: "text-red-200"
          }
    : null;

  return (
    <div className={`mt-3 rounded-[1.25rem] border px-4 py-4 ${health.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Password strength</p>
          <p className="mt-2 text-sm text-white">{health.label}</p>
          <p className="mt-1 text-xs leading-6 text-slate-300/70">{health.helper}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/74">
          {health.passedCount}/{PASSWORD_REQUIREMENTS.length}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={[
              "h-1.5 rounded-full transition",
              index < health.meter ? `bg-gradient-to-r ${health.accent}` : "bg-white/10"
            ].join(" ")}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {health.checks.map((check) => (
          <div key={check.id} className="flex items-center gap-2 text-xs text-slate-200/80">
            <span
              className={[
                "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                check.passed ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-white/6 text-slate-400"
              ].join(" ")}
            >
              {check.passed ? "OK" : "..."}
            </span>
            <span>{check.label}</span>
          </div>
        ))}
      </div>
      {confirmState ? <p className={`mt-4 text-xs leading-6 ${confirmState.className}`}>{confirmState.label}</p> : null}
    </div>
  );
};

const AuthModal = ({
  isOpen,
  mode,
  onModeChange,
  onClose,
  redirectTo = "/app/dashboard",
  prefillEmail = "",
  prefillToken = "",
  notice = "",
  selectedPlan = "",
  selectedBilling = ""
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, register, verifyEmailToken, resendVerificationEmail, forgotPassword, resetPasswordToken } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: prefillEmail, password: "", rememberMe: true });
  const [signupForm, setSignupForm] = useState({ name: "", email: prefillEmail, password: "", workspaceIntent: "telecom" });
  const [verifyForm, setVerifyForm] = useState({ email: prefillEmail, token: prefillToken, workspaceIntent: "telecom" });
  const [forgotForm, setForgotForm] = useState({ email: prefillEmail });
  const [resetForm, setResetForm] = useState({ email: prefillEmail, token: prefillToken, password: "", confirmPassword: "" });
  const [passwordVisibility, setPasswordVisibility] = useState({ login: false, signup: false, reset: false, confirmReset: false });
  const [state, setState] = useState({ loading: false, error: "", notice });

  const selectedPlanDetails = selectedPlan ? getPlanById(selectedPlan) : null;
  const billingLabel = selectedBilling === "yearly" ? "Yearly" : "Monthly";
  const signupIntent = signupForm.workspaceIntent || "telecom";
  const activeWorkspace = WORKSPACE_OPTIONS[mode === MODES.SIGNUP ? signupIntent : verifyForm.workspaceIntent || signupIntent || "telecom"];
  const recoveryCopy = RECOVERY_COPY[mode];
  const showingAuthTabs = ![MODES.VERIFY, MODES.FORGOT, MODES.RESET].includes(mode);
  const activePrice = useMemo(() => getPlanPriceLabel(selectedPlanDetails, selectedBilling), [selectedBilling, selectedPlanDetails]);
  const resetPasswordHealth = useMemo(() => getPasswordHealth(resetForm.password), [resetForm.password]);
  const loginEmailHint = loginForm.email.trim()
    ? EMAIL_PATTERN.test(loginForm.email.trim())
      ? "Looks right. We will restore the workspace tied to this email."
      : "Enter a valid email address so we can find the correct workspace."
    : "Use the email tied to your workspace.";
  const signupEmailHint = signupForm.email.trim()
    ? EMAIL_PATTERN.test(signupForm.email.trim())
      ? "We will use this for verification, recovery, and workspace updates."
      : "Add a valid email address so the verification link reaches you."
    : "Use the work email where you want verification and reset links.";
  const forgotEmailHint = forgotForm.email.trim()
    ? EMAIL_PATTERN.test(forgotForm.email.trim())
      ? "If the account exists, the reset link will go here."
      : "Enter the same email you used when creating the account."
    : "Enter the email tied to the workspace you want to recover.";

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!prefillEmail) return;
    setLoginForm((prev) => ({ ...prev, email: prefillEmail }));
    setSignupForm((prev) => ({ ...prev, email: prefillEmail }));
    setVerifyForm((prev) => ({ ...prev, email: prefillEmail }));
    setForgotForm({ email: prefillEmail });
    setResetForm((prev) => ({ ...prev, email: prefillEmail }));
  }, [prefillEmail]);

  useEffect(() => {
    if (!prefillToken) return;
    setVerifyForm((prev) => ({ ...prev, token: prefillToken }));
    setResetForm((prev) => ({ ...prev, token: prefillToken }));
  }, [prefillToken]);

  useEffect(() => {
    if (!notice) return;
    setState((prev) => ({ ...prev, notice, error: "" }));
  }, [notice]);

  const openDestination = (user, fallbackIntent) => {
    navigate(getWorkspaceRedirect({ redirectTo, user, fallbackIntent }), { replace: true });
  };

  const togglePassword = (key) => {
    setPasswordVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const selectWorkspaceIntent = (value) => {
    setSignupForm((prev) => ({ ...prev, workspaceIntent: value }));
    trackProductEvent(
      "signup_path_choice",
      {
        workspaceIntent: value
      },
      {
        route: "/signup",
        pathGroup: "auth"
      }
    );
  };
  const submitLogin = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", notice: "" });

    const email = loginForm.email.trim();
    try {
      const response = await login({ email, password: loginForm.password }, { rememberMe: loginForm.rememberMe });
      toast.success("Signed in", "Your workspace is ready.");
      openDestination(response?.data?.user, response?.data?.user?.currentTenant?.industryType || "telecom");
      return;
    } catch (error) {
      if (isVerificationError(error.message)) {
        setVerifyForm((prev) => ({ ...prev, email, token: "" }));
        onModeChange(MODES.VERIFY);
        setState({ loading: false, error: "", notice: "Please verify your email before logging in." });
        toast.info("Email verification needed", "Check your inbox or resend the token from the verify screen.");
        return;
      }

      setState({ loading: false, error: error.message, notice: "" });
      toast.error("Could not sign in", error.message);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", notice: "" });

    try {
      const payload = {
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        workspaceIntent: signupIntent
      };
      const response = await register(payload);

      if (response?.data?.verificationRequired) {
        setVerifyForm({ email: payload.email, token: response?.data?.verifyToken || "", workspaceIntent: payload.workspaceIntent });
        onModeChange(MODES.VERIFY);
        const nextNotice = response?.data?.verifyToken
          ? `Verification email sent. Dev token: ${response.data.verifyToken}`
          : "Account created. Check your inbox for verification.";
        setState({ loading: false, error: "", notice: nextNotice });
        toast.success("Account created", "Verify your email to enter the workspace.");
        return;
      }

      toast.success("Workspace created", signupIntent === "custom" ? "Opening Custom Setup." : "Opening your telecom dashboard.");
      openDestination(response?.data?.user, payload.workspaceIntent);
    } catch (error) {
      setState({ loading: false, error: error.message, notice: "" });
      toast.error("Could not create account", error.message);
    }
  };

  const submitVerify = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", notice: "" });

    try {
      const response = await verifyEmailToken({ email: verifyForm.email.trim(), token: verifyForm.token.trim() });
      toast.success("Email verified", "Your workspace is ready.");
      openDestination(response?.data?.user, verifyForm.workspaceIntent || "telecom");
    } catch (error) {
      setState({ loading: false, error: error.message, notice: "" });
      toast.error("Could not verify email", error.message);
    }
  };

  const onResendVerification = async () => {
    if (!verifyForm.email.trim()) {
      setState({ loading: false, error: "Please enter your email.", notice: "" });
      toast.error("Email required", "Add your email before requesting a new verification token.");
      return;
    }

    setState({ loading: true, error: "", notice: "" });
    try {
      const response = await resendVerificationEmail({ email: verifyForm.email.trim() });
      const devToken = response?.data?.verifyToken || "";
      setVerifyForm((prev) => ({ ...prev, token: devToken || prev.token }));
      setState({ loading: false, error: "", notice: devToken ? `Verification resent. Dev token: ${devToken}` : "Verification email resent." });
      toast.success("Verification sent again", devToken ? "The dev token has been filled in for you." : "Check your inbox for the new link.");
    } catch (error) {
      setState({ loading: false, error: error.message, notice: "" });
      toast.error("Could not resend verification", error.message);
    }
  };

  const submitForgotPassword = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", notice: "" });

    try {
      const response = await forgotPassword({ email: forgotForm.email.trim() });
      const resetToken = response?.data?.resetToken || "";
      setResetForm((prev) => ({ ...prev, email: forgotForm.email.trim(), token: resetToken || prev.token, password: "", confirmPassword: "" }));
      onModeChange(MODES.RESET);
      setState({
        loading: false,
        error: "",
        notice: resetToken ? `Reset email sent. Dev token: ${resetToken}` : "If that account exists, a password reset email has been sent."
      });
      toast.success("Reset instructions sent", resetToken ? "The local dev token is already ready below." : "Check the inbox for the reset link.");
    } catch (error) {
      setState({ loading: false, error: error.message, notice: "" });
      toast.error("Could not start reset", error.message);
    }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();

    if (resetForm.password !== resetForm.confirmPassword) {
      const mismatchMessage = "The new password and confirm password fields do not match.";
      setState({ loading: false, error: mismatchMessage, notice: "" });
      toast.error("Passwords do not match", mismatchMessage);
      return;
    }

    setState({ loading: true, error: "", notice: "" });

    try {
      const response = await resetPasswordToken({ email: resetForm.email.trim(), token: resetForm.token.trim(), password: resetForm.password });
      toast.success("Password updated", "You are signed in and ready to continue.");
      openDestination(response?.data?.user, response?.data?.user?.currentTenant?.industryType || signupIntent);
    } catch (error) {
      setState({ loading: false, error: error.message, notice: "" });
      toast.error("Could not reset password", error.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#0d0e14] shadow-soft"
            onClick={(event) => event.stopPropagation()}
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[0.94fr_1.06fr]">
              <div
                className="relative overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-8"
                style={{
                  background:
                    "radial-gradient(circle at 18% 0%, rgba(192,132,252,0.22), transparent 34%), radial-gradient(circle at 100% 10%, rgba(99,102,241,0.18), transparent 34%), linear-gradient(180deg, rgba(20,21,32,0.98), rgba(12,13,20,0.98))"
                }}
              >
                <div className="pointer-events-none absolute -left-6 top-8 h-32 w-32 rounded-full bg-fuchsia-500/18 blur-3xl" />
                <div className="pointer-events-none absolute -right-6 bottom-0 h-32 w-32 rounded-full bg-indigo-500/14 blur-3xl" />
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">ChurnFlow Access</p>
                  <h2 className="mt-4 text-4xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                    {getModeTitle(mode)}
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/52">{getModeBody(mode)}</p>
                  {[MODES.LOGIN, MODES.SIGNUP, MODES.VERIFY].includes(mode) ? (
                    <motion.div className="mt-7 rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Workspace path</p>
                          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                            {activeWorkspace.label}
                          </h3>
                        </div>
                        <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-white/72">{activeWorkspace.eyebrow}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/50">{activeWorkspace.helper}</p>
                      <div className="mt-4 space-y-2 text-sm text-white/72">
                        {activeWorkspace.nextSteps.map((item) => (
                          <div key={item} className="flex items-center gap-2 rounded-[1rem] border border-white/10 bg-black/20 px-3 py-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] text-white/70">+</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div className="mt-7 rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Recovery flow</p>
                          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                            {recoveryCopy.title}
                          </h3>
                        </div>
                        <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-white/72">{recoveryCopy.eyebrow}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/50">{recoveryCopy.body}</p>
                      <div className="mt-4 space-y-2 text-sm text-white/72">
                        {recoveryCopy.tips.map((item) => (
                          <div key={item} className="flex items-center gap-2 rounded-[1rem] border border-white/10 bg-black/20 px-3 py-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[10px] text-white/70">+</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {selectedPlanDetails && (
                    <motion.div className="mt-5 rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Selected plan</p>
                          <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>{selectedPlanDetails.name}</h3>
                        </div>
                        <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-white/72">{billingLabel}</span>
                      </div>
                      <p className="mt-3 text-sm text-white/50">{selectedPlanDetails.detail}</p>
                      {activePrice ? (
                        <div className="mt-4 flex items-end justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Pricing</p>
                            <p className="mt-2 text-xl text-white">{activePrice}</p>
                          </div>
                          {selectedBilling === "yearly" ? <p className="text-xs text-white/55">{selectedPlanDetails.yearlyMonthlyEquivalent} effective monthly</p> : null}
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/28">Secure access</p>
                    <p className="mt-2 text-sm text-white/52">
                      {mode === MODES.LOGIN
                        ? "Sign in and we will restore your saved workspace context."
                        : mode === MODES.SIGNUP
                          ? "Create your account, choose a path, and land in the right onboarding flow."
                          : mode === MODES.VERIFY
                            ? "Confirm ownership and continue into your chosen workspace flow."
                            : mode === MODES.FORGOT
                              ? "We will send a reset link without disrupting the rest of your workspace settings."
                              : "Choose a fresh password and continue right where you left off."}
                    </p>
                  </div>
                  <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/10">
                    Close
                  </button>
                </div>

                {showingAuthTabs && (
                  <div className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-white/12 bg-white/[0.04] p-1">
                    <button
                      type="button"
                      className={`rounded-full px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] transition ${mode === MODES.LOGIN ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                      onClick={() => onModeChange(MODES.LOGIN)}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] transition ${mode === MODES.SIGNUP ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                      onClick={() => onModeChange(MODES.SIGNUP)}
                    >
                      Sign up
                    </button>
                  </div>
                )}

                <div className="mb-5 flex flex-wrap gap-2">
                  {["Encrypted workspace session", "Email-first recovery", "Built for B2B teams"].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/56">
                      {item}
                    </span>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {mode === MODES.LOGIN && (
                    <motion.form key="login" className="space-y-3.5" onSubmit={submitLogin} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
                      <label>
                        <span className="field-label">Email</span>
                        <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))} className="field-input" required />
                        <p className="mt-2 text-xs leading-6 text-slate-400">{loginEmailHint}</p>
                      </label>

                      <label className="block">
                        <span className="field-label">Password</span>
                        <div className="relative">
                          <input type={passwordVisibility.login ? "text" : "password"} value={loginForm.password} onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))} className="field-input pr-20" required />
                          <button type="button" onClick={() => togglePassword("login")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.12em] text-slate-400 transition hover:text-white">
                            {passwordVisibility.login ? "Hide" : "Show"}
                          </button>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-slate-400">Use the password already tied to this workspace. If you are unsure, use the reset flow below.</p>
                      </label>

                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input type="checkbox" checked={loginForm.rememberMe} onChange={(event) => setLoginForm((prev) => ({ ...prev, rememberMe: event.target.checked }))} className="h-3.5 w-3.5 rounded border-white/20 bg-white/10" />
                          <span>Remember this device</span>
                        </label>
                        <button type="button" className="text-[11px] uppercase tracking-[0.12em] text-slate-300 transition hover:text-white" onClick={() => onModeChange(MODES.FORGOT)}>
                          Forgot password?
                        </button>
                      </div>

                      <button type="submit" className="inline-flex w-full justify-center rounded-full bg-[#fafafa] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition hover:bg-[#e4e4e7]" disabled={state.loading}>
                        {state.loading ? "Signing in..." : "Sign in"}
                      </button>
                    </motion.form>
                  )}

                  {mode === MODES.SIGNUP && (
                    <motion.form key="signup" className="space-y-3.5" onSubmit={submitSignup} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
                      <label>
                        <span className="field-label">Name</span>
                        <input type="text" value={signupForm.name} onChange={(event) => setSignupForm((prev) => ({ ...prev, name: event.target.value }))} className="field-input" required />
                        <p className="mt-2 text-xs leading-6 text-slate-400">Use the name teammates will recognize inside the workspace.</p>
                      </label>

                      <label>
                        <span className="field-label">Email</span>
                        <input type="email" value={signupForm.email} onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))} className="field-input" required />
                        <p className="mt-2 text-xs leading-6 text-slate-400">{signupEmailHint}</p>
                      </label>

                      <label className="block">
                        <span className="field-label">Password</span>
                        <div className="relative">
                          <input type={passwordVisibility.signup ? "text" : "password"} value={signupForm.password} onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))} className="field-input pr-20" required />
                          <button type="button" onClick={() => togglePassword("signup")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.12em] text-slate-400 transition hover:text-white">
                            {passwordVisibility.signup ? "Hide" : "Show"}
                          </button>
                        </div>
                        <PasswordStrengthPanel password={signupForm.password} />
                      </label>

                      <div>
                        <span className="field-label">How do you want to start?</span>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries(WORKSPACE_OPTIONS).map(([value, option]) => {
                            const isActive = signupIntent === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => selectWorkspaceIntent(value)}
                                className={[
                                  "rounded-[1.5rem] border p-4 text-left transition",
                                  isActive ? "border-fuchsia-300/35 bg-white/[0.08]" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                                ].join(" ")}
                              >
                                <p className="workspace-kicker">{option.eyebrow}</p>
                                <p className="mt-2 text-base text-white">{option.label}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-400">{option.helper}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                        <p className="workspace-kicker">What happens right after signup</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {signupIntent === "custom"
                            ? "You will land in Custom Setup so you can upload a sample dataset, confirm Gemini's guesses, and prepare training."
                            : "You will land in the app dashboard so you can upload telecom customers and start scoring immediately."}
                        </p>
                      </div>

                      <button type="submit" className="inline-flex w-full justify-center rounded-full bg-[#fafafa] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition hover:bg-[#e4e4e7]" disabled={state.loading}>
                        {state.loading ? "Creating workspace..." : "Create account"}
                      </button>
                    </motion.form>
                  )}

                  {mode === MODES.VERIFY && (
                    <motion.form key="verify" className="space-y-3.5" onSubmit={submitVerify} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
                      <p className="text-xs text-slate-400">Enter the verification token we sent you. After this, we will send you straight to your selected workspace flow.</p>

                      <label>
                        <span className="field-label">Email</span>
                        <input type="email" value={verifyForm.email} onChange={(event) => setVerifyForm((prev) => ({ ...prev, email: event.target.value }))} className="field-input" required />
                      </label>

                      <label>
                        <span className="field-label">Verification token</span>
                        <input type="text" value={verifyForm.token} onChange={(event) => setVerifyForm((prev) => ({ ...prev, token: event.target.value }))} className="field-input" required />
                      </label>

                      <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-300">
                        Next stop: <span className="text-white">{verifyForm.workspaceIntent === "custom" ? "Custom Setup" : "Dashboard"}</span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button type="submit" className="inline-flex w-full justify-center rounded-full bg-[#fafafa] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition hover:bg-[#e4e4e7]" disabled={state.loading}>
                          {state.loading ? "Verifying..." : "Verify"}
                        </button>
                        <button type="button" className="inline-flex w-full justify-center rounded-full border border-white/15 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/[0.05] hover:text-white" onClick={onResendVerification} disabled={state.loading}>
                          Resend
                        </button>
                      </div>

                      <button type="button" className="w-full rounded-full px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/10" onClick={() => onModeChange(MODES.LOGIN)}>
                        Back to login
                      </button>
                    </motion.form>
                  )}
                  {mode === MODES.FORGOT && (
                    <motion.form key="forgot" className="space-y-3.5" onSubmit={submitForgotPassword} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
                      <label>
                        <span className="field-label">Email</span>
                        <input type="email" value={forgotForm.email} onChange={(event) => setForgotForm({ email: event.target.value })} className="field-input" required />
                        <p className="mt-2 text-xs leading-6 text-slate-400">{forgotEmailHint}</p>
                      </label>

                      <button type="submit" className="inline-flex w-full justify-center rounded-full bg-[#fafafa] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition hover:bg-[#e4e4e7]" disabled={state.loading}>
                        {state.loading ? "Sending reset link..." : "Send reset link"}
                      </button>

                      <button type="button" className="w-full rounded-full px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/10" onClick={() => onModeChange(MODES.LOGIN)}>
                        Back to login
                      </button>
                    </motion.form>
                  )}

                  {mode === MODES.RESET && (
                    <motion.form key="reset" className="space-y-3.5" onSubmit={submitResetPassword} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
                      <label>
                        <span className="field-label">Email</span>
                        <input type="email" value={resetForm.email} onChange={(event) => setResetForm((prev) => ({ ...prev, email: event.target.value }))} className="field-input" required />
                      </label>

                      <label>
                        <span className="field-label">Reset token</span>
                        <input type="text" value={resetForm.token} onChange={(event) => setResetForm((prev) => ({ ...prev, token: event.target.value }))} className="field-input" required />
                        <p className="mt-2 text-xs leading-6 text-slate-400">Paste the full token from the reset email. In local development, we also surface it directly after you request a reset.</p>
                      </label>

                      <label className="block">
                        <span className="field-label">New password</span>
                        <div className="relative">
                          <input type={passwordVisibility.reset ? "text" : "password"} value={resetForm.password} onChange={(event) => setResetForm((prev) => ({ ...prev, password: event.target.value }))} className="field-input pr-20" required />
                          <button type="button" onClick={() => togglePassword("reset")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.12em] text-slate-400 transition hover:text-white">
                            {passwordVisibility.reset ? "Hide" : "Show"}
                          </button>
                        </div>
                      </label>

                      <label className="block">
                        <span className="field-label">Confirm new password</span>
                        <div className="relative">
                          <input type={passwordVisibility.confirmReset ? "text" : "password"} value={resetForm.confirmPassword} onChange={(event) => setResetForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} className="field-input pr-20" required />
                          <button type="button" onClick={() => togglePassword("confirmReset")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.12em] text-slate-400 transition hover:text-white">
                            {passwordVisibility.confirmReset ? "Hide" : "Show"}
                          </button>
                        </div>
                      </label>

                      <PasswordStrengthPanel password={resetForm.password} confirmPassword={resetForm.confirmPassword} showConfirm />

                      <div className={`rounded-[1.2rem] border px-4 py-4 ${resetPasswordHealth.border}`}>
                        <p className="text-xs leading-6 text-slate-200/84">
                          {resetForm.confirmPassword && resetForm.password !== resetForm.confirmPassword
                            ? "The new password and confirmation must match before the reset can finish."
                            : "Once this is saved, we will sign you in and restore the correct workspace flow automatically."}
                        </p>
                      </div>

                      <button type="submit" className="inline-flex w-full justify-center rounded-full bg-[#fafafa] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-[#09090b] transition hover:bg-[#e4e4e7]" disabled={state.loading}>
                        {state.loading ? "Updating password..." : "Reset password"}
                      </button>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button type="button" className="rounded-full border border-white/15 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/[0.05] hover:text-white" onClick={() => onModeChange(MODES.FORGOT)}>
                          Back to reset email
                        </button>
                        <button type="button" className="rounded-full px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={() => onModeChange(MODES.LOGIN)}>
                          Back to login
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {state.notice && (
                  <div className="mt-4 rounded-[1.2rem] border border-emerald-300/20 bg-emerald-500/10 px-4 py-4 text-xs leading-6 text-emerald-100">
                    <p className="workspace-kicker text-emerald-100/70">Status</p>
                    <p className="mt-2">{state.notice}</p>
                  </div>
                )}
                {state.error && (
                  <div className="mt-4 rounded-[1.2rem] border border-red-300/20 bg-red-500/10 px-4 py-4 text-xs leading-6 text-red-100">
                    <p className="workspace-kicker text-red-100/70">Needs attention</p>
                    <p className="mt-2">{state.error}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;

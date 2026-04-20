import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import BrandLockup from "./BrandLockup";

const MODES = {
  LOGIN: "login",
  SIGNUP: "signup",
  VERIFY: "verify",
  FORGOT: "forgot",
  RESET: "reset"
};

const AuthModal = ({
  isOpen,
  mode,
  onModeChange,
  onClose,
  redirectTo = "/app/dashboard",
  prefillEmail = "",
  prefillToken = "",
  notice = ""
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, register, verifyEmailToken, resendVerificationEmail, forgotPassword, resetPasswordToken } = useAuth();

  const [form, setForm] = useState({ 
    email: prefillEmail, 
    password: "", 
    name: "", 
    token: prefillToken,
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(prev => ({ ...prev, email: prefillEmail, token: prefillToken }));
  }, [isOpen, prefillEmail, prefillToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === MODES.LOGIN) {
        await login({ email: form.email, password: form.password });
        toast.success("Success", "Welcome back.");
        navigate(redirectTo);
      } else if (mode === MODES.SIGNUP) {
        await register({ name: form.name, email: form.email, password: form.password });
        onModeChange(MODES.VERIFY);
        toast.success("Account created", "Please verify your email.");
      } else if (mode === MODES.VERIFY) {
        await verifyEmailToken({ email: form.email, token: form.token });
        toast.success("Verified", "Your account is ready.");
        navigate(redirectTo);
      } else if (mode === MODES.FORGOT) {
        await forgotPassword({ email: form.email });
        onModeChange(MODES.RESET);
        toast.success("Reset sent", "Check your inbox for a token.");
      } else if (mode === MODES.RESET) {
        if (form.password !== form.confirmPassword) throw new Error("Passwords do not match");
        await resetPasswordToken({ email: form.email, token: form.token, password: form.password });
        toast.success("Updated", "Sign in with your new password.");
        onModeChange(MODES.LOGIN);
      }
    } catch (err) {
      toast.error("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-900/10 p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-premium sm:p-10"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <BrandLockup size="md" className="justify-center" showSubtitle={false} />
              <h2 className="mt-8 text-3xl font-bold tracking-tight text-black">
                {mode === MODES.LOGIN ? "Sign in" : mode === MODES.SIGNUP ? "Create account" : "Continue"}
              </h2>
              <p className="mt-2 text-sm text-black font-medium">
                {mode === MODES.LOGIN ? "Access your workspace to continue." : "Start your retention journey today."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              {mode === MODES.SIGNUP && (
                <label className="block">
                  <span className="field-label">Name</span>
                  <input 
                    type="text" 
                    required 
                    className="field-input" 
                    placeholder="Full name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </label>
              )}

              <label className="block">
                <span className="field-label">Email Address</span>
                <input 
                  type="email" 
                  required 
                  className="field-input" 
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </label>

              {(mode === MODES.LOGIN || mode === MODES.SIGNUP || mode === MODES.RESET) && (
                <label className="block">
                  <span className="field-label">Password</span>
                  <input 
                    type="password" 
                    required 
                    className="field-input" 
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                </label>
              )}

              {mode === MODES.RESET && (
                <label className="block">
                  <span className="field-label">Confirm Password</span>
                  <input 
                    type="password" 
                    required 
                    className="field-input" 
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </label>
              )}

              {(mode === MODES.VERIFY || mode === MODES.RESET) && (
                <label className="block">
                  <span className="field-label">Verification Token</span>
                  <input 
                    type="text" 
                    required 
                    className="field-input" 
                    placeholder="Enter code"
                    value={form.token}
                    onChange={e => setForm({ ...form, token: e.target.value })}
                  />
                </label>
              )}

              <button 
                type="submit" 
                className="btn-primary w-full py-4 text-sm font-bold shadow-blue-200"
                disabled={loading}
              >
                {loading ? "..." : mode === MODES.LOGIN ? "Sign in to workspace" : mode === MODES.SIGNUP ? "Create my account" : "Verify account"}
              </button>
            </form>

            <div className="mt-8 text-center text-[13px] text-black">
              {mode === MODES.LOGIN ? (
                <p className="font-medium">
                  New here?{" "}
                  <button onClick={() => onModeChange(MODES.SIGNUP)} className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
                    Create account
                  </button>
                </p>
              ) : (
                <p className="font-medium">
                  Already have an account?{" "}
                  <button onClick={() => onModeChange(MODES.LOGIN)} className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
                    Sign in
                  </button>
                </p>
              )}
              {mode === MODES.LOGIN && (
                <button onClick={() => onModeChange(MODES.FORGOT)} className="mt-5 block w-full text-xs font-bold text-black hover:text-blue-600">
                  Forgot your password?
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;

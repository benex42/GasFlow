import { useState } from "react";
import { authApi } from "./api";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

const Field = ({ label, icon: Icon, ...props }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-bold text-[#344052]">
      {label}
    </span>
    <span className="flex items-center rounded-xl border border-[#dfe6e9] bg-white px-3.5 shadow-[0_2px_8px_rgba(15,32,48,.025)] transition focus-within:border-[#15925d] focus-within:ring-4 focus-within:ring-[#15925d]/10">
      <Icon
        size={16}
        strokeWidth={2}
        className="mr-2.5 shrink-0 text-[#8290a0]"
      />
      <input
        {...props}
        className="h-11 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#172132] outline-none placeholder:font-normal placeholder:text-[#a0aab5]"
      />
    </span>
  </label>
);

function AuthPage({ initialMode = "login", resetToken = "", onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetRequested, setResetRequested] = useState(Boolean(resetToken));
  const [resetCode, setResetCode] = useState(resetToken);
  const isLogin = mode === "login";
  const isReset = mode === "reset";

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSubmitted(false);
    setSubmittedMessage("");
    setError("");
    if (nextMode !== "reset") {
      setResetRequested(false);
      setResetCode("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setSubmitted(false);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      if (isReset) {
        if (!resetRequested) {
          const result = await authApi.requestPasswordReset(formData.get("email"));
          setResetRequested(true);
          setResetCode(result.developmentCode || "");
          setSubmittedMessage(result.developmentCode
            ? "Development reset code created. Choose a new password below."
            : result.message);
          setSubmitted(true);
          return;
        }
        const password = formData.get("password");
        if (password !== formData.get("confirmPassword")) {
          setError("Your new passwords do not match.");
          return;
        }
        const result = await authApi.resetPassword({ token: resetCode, password });
        setMode("login");
        setResetRequested(false);
        setResetCode("");
        setSubmittedMessage(result.message);
        setSubmitted(true);
        return;
      }
      const credentials = {
        email: formData.get("email"),
        password: formData.get("password"),
        ...(isLogin ? {} : { name: formData.get("name") }),
      };
      const session = isLogin ? await authApi.login(credentials) : await authApi.register(credentials);
      setSubmittedMessage(isLogin ? "Signed in successfully. Opening your workspace…" : "Account created successfully. Opening your workspace…");
      setSubmitted(true);
      onSuccess?.(session);
    } catch (requestError) {
      setError(requestError.message || "We could not complete your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6faf8] px-5 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1120px] overflow-hidden rounded-[24px] bg-white shadow-[0_22px_55px_rgba(20,47,38,.10)] sm:min-h-[calc(100vh-4rem)]">
        <section className="relative hidden w-[46%] overflow-hidden bg-[#111e2f] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[38px] border-[#15925d]/30" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border-[46px] border-white/[.045]" />
          <a
            href="/"
            className="relative mt-4 text-[23px] font-extrabold tracking-[-.06em]"
          >
            GasFlow <span className="text-[#36ca8b]">•</span>
          </a>
          <div className="relative my-auto max-w-[360px]">
            <img
              src="/assets/gasflow-logo-primary.png"
              alt="GasFlow"
              className="h-11 w-11 rounded-xl shadow-[0_10px_25px_rgba(21,146,93,.25)]"
            />
            <h1 className="mt-6 text-4xl font-extrabold leading-[.98] tracking-[-.065em]">
              Run every sale with confidence.
            </h1>
            <p className="mt-4 text-[13px] leading-relaxed text-[#aebbc8]">
              GasFlow brings your depot's sales, stock, payments, and shift
              reconciliation into one dependable workspace.
            </p>
            <ul className="mt-8 space-y-3.5 text-[12px] font-medium text-[#dbe5eb]">
              {[
                "Live cylinder inventory tracking",
                "Secure Mobile Money settlement",
                "Works reliably, even offline",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={17} className="shrink-0 text-[#36ca8b]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-[10px] text-[#8393a5]">
            Trusted infrastructure for modern LPG retailers.
          </p>
        </section>

        <section className="flex min-w-0 flex-1 flex-col px-6 py-7 sm:px-12 sm:py-10 lg:px-16">
          <div className="lg:hidden">
            <a href="/" className="text-[20px] font-extrabold tracking-[-.06em]">
              GasFlow <span className="text-[#15925d]">•</span>
            </a>
          </div>
          <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-center py-10 lg:py-0">
            <div className="rounded-xl bg-[#f1f6f4] p-1">
              <div className="grid grid-cols-2 gap-1 text-center text-[11px] font-bold">
                <button
                  onClick={() => changeMode("login")}
                  className={`rounded-lg py-2.5 transition ${isLogin ? "bg-white text-[#172132] shadow-sm" : "text-[#728092] hover:text-[#344052]"}`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => changeMode("register")}
                  className={`rounded-lg py-2.5 transition ${mode === "register" ? "bg-white text-[#172132] shadow-sm" : "text-[#728092] hover:text-[#344052]"}`}
                >
                  Create account
                </button>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-bold tracking-[.13em] text-[#15925d]">
                {isReset ? "ACCOUNT RECOVERY" : isLogin ? "WELCOME BACK" : "GET STARTED"}
              </p>
              <h2 className="mt-2 text-[30px] font-extrabold tracking-[-.06em] text-[#172132]">
                {isReset ? "Reset your password" : isLogin ? "Sign in to GasFlow" : "Create your account"}
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[#758193]">
                {isReset
                  ? resetRequested
                    ? resetCode
                      ? "Choose a new password for your account."
                      : "Check your email for a reset link, then open it to choose a new password."
                    : "Enter your work email and we’ll send a secure reset link."
                  : isLogin
                  ? "Enter your details to access your depot workspace."
                  : "Set up your GasFlow workspace in just a few moments."}
              </p>
            </div>
            <form onSubmit={submit} className="mt-7 space-y-4">
              {isReset && !resetRequested && (
                <Field
                  label="Work email"
                  icon={Mail}
                  type="email"
                  name="email"
                  placeholder="you@yourdepot.com"
                  autoComplete="email"
                  required
                />
              )}
              {!isReset && !isLogin && (
                <Field
                  label="Full name"
                  icon={UserRound}
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              )}
              {!isReset && <Field
                label="Work email"
                icon={Mail}
                type="email"
                name="email"
                placeholder="you@yourdepot.com"
                autoComplete="email"
                required
              />}
              {(!isReset || resetCode) && <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-[#344052]">
                  {isReset ? "New password" : "Password"}{" "}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => changeMode("reset")}
                      className="font-semibold text-[#15925d] hover:text-[#117d4f]"
                    >
                      Forgot password?
                    </button>
                  )}
                </span>
                <span className="flex items-center rounded-xl border border-[#dfe6e9] bg-white px-3.5 shadow-[0_2px_8px_rgba(15,32,48,.025)] transition focus-within:border-[#15925d] focus-within:ring-4 focus-within:ring-[#15925d]/10">
                  <LockKeyhole
                    size={16}
                    strokeWidth={2}
                    className="mr-2.5 shrink-0 text-[#8290a0]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={isReset ? "Choose a new password" : "Enter your password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    minLength="8"
                    className="h-11 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#172132] outline-none placeholder:font-normal placeholder:text-[#a0aab5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="ml-2 rounded p-1 text-[#8290a0] hover:text-[#172132]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>}
              {isReset && resetCode && (
                <Field
                  label="Confirm new password"
                  icon={LockKeyhole}
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                  minLength="8"
                />
              )}
              {!isLogin && !isReset && (
                <label className="flex cursor-pointer items-start gap-2.5 pt-0.5 text-[10px] leading-relaxed text-[#718093]">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 h-3.5 w-3.5 accent-[#15925d]"
                  />
                  I agree to GasFlow's{" "}
                  <a href="#terms" className="font-bold text-[#15925d]">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#privacy" className="font-bold text-[#15925d]">
                    Privacy Policy
                  </a>
                  .
                </label>
              )}
              <button
                type="submit"
                disabled={isSubmitting || (isReset && resetRequested && !resetCode)}
                className="w-full rounded-full bg-[#15925d] px-5 py-3 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(21,146,93,.20)] transition hover:-translate-y-0.5 hover:bg-[#117d4f]"
              >
                {isSubmitting
                  ? "Please wait…"
                  : isReset
                  ? !resetRequested
                    ? "Send reset link"
                    : resetCode
                      ? "Save new password"
                      : "Check your email for the reset link"
                  : isLogin
                  ? "Sign in to your workspace"
                  : "Create my GasFlow account"}
              </button>
            </form>
            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-[#f0c4b8] bg-[#fff4f0] px-3.5 py-3 text-[11px] font-semibold text-[#a23f2b]">
                {error}
              </p>
            )}
            {submitted && (
              <div className="mt-4 flex gap-2.5 rounded-xl border border-[#b9e6d0] bg-[#effaf4] px-3.5 py-3 text-[11px] leading-relaxed text-[#176b49]">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                {submittedMessage}
              </div>
            )}
            <p className="mt-6 text-center text-[11px] text-[#7c8898]">
              {isReset ? "Remembered your password?" : isLogin ? "New to GasFlow?" : "Already have an account?"}{" "}
              <button
                onClick={() => changeMode(isReset ? "login" : isLogin ? "register" : "login")}
                className="font-bold text-[#15925d] hover:text-[#117d4f]"
              >
                {isReset ? "Sign in instead" : isLogin ? "Create an account" : "Sign in instead"}
              </button>
            </p>
          </div>
          <p className="text-center text-[9px] text-[#98a2af]">
            Protected by secure, encrypted authentication.
          </p>
        </section>
      </div>
    </main>
  );
}

export default AuthPage;

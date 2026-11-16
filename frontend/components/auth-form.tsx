"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Workflow } from "@/components/animated-icons";
import { IconHover } from "@/components/icon-hover";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/app/auth-provider";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBackendHealth } from "@/hooks/use-backend-health";

type AuthMode = "login" | "register";

const credentialsSchema = z.object({
  name: z.string().optional(),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

type AuthValues = z.infer<typeof credentialsSchema>;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { user, isLoading, signIn, signUp } = useAuth();
  const { status: healthStatus, error: healthError, isReady, retryConnection } =
    useBackendHealth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const authRequestInFlight = useRef(false);
  const schema = useMemo(
    () =>
      isRegister
        ? credentialsSchema.extend({
            name: z.string().trim().min(2, "Enter your name").max(80),
          })
        : credentialsSchema,
    [isRegister],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  async function onSubmit(values: AuthValues) {
    if (!isReady) return;
    setFormError(null);
    try {
      if (isRegister) {
        await signUp({
          name: values.name ?? "",
          email: values.email,
          password: values.password,
        });
      } else {
        await signIn({ email: values.email, password: values.password });
      }
      router.replace("/dashboard");
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isReady || authRequestInFlight.current) {
      event.preventDefault();
      return;
    }

    authRequestInFlight.current = true;
    void handleSubmit(onSubmit)(event).finally(() => {
      authRequestInFlight.current = false;
    });
  }

  const connectionMessage =
    healthStatus === "ready"
      ? "Backend connected. You can securely sign in."
      : healthStatus === "timeout"
        ? "The backend is still unavailable. You can try connecting again."
        : healthStatus === "error"
          ? "The backend is temporarily unreachable. Retrying every 4 seconds."
          : "Connecting to the backend. Your form is ready while it wakes up.";

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#090909] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-36 -top-32 size-[520px] rounded-full border border-white/[0.08]" />
        <div className="absolute -right-16 -top-12 size-[340px] rounded-full border border-white/[0.08]" />
        <IconHover>
          <Link href="/" className="relative z-10 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-black">
              <Workflow size={21} />
            </span>
            <span className="text-lg font-semibold">TaskFlow</span>
          </Link>
        </IconHover>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-neutral-300">
            <span className="size-1.5 rounded-full bg-neutral-400" />
            A calmer way to move work forward
          </div>
          <h1 className="text-4xl font-semibold leading-[1.14] tracking-tight xl:text-[52px]">
            Make space for
            <br />
            <span className="text-white">meaningful work.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-neutral-300">
            Plan together, keep priorities clear, and see every project make
            progress — one focused task at a time.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">This week</span>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] text-emerald-200">
                On track
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Product launch", progress: "78%" },
                { label: "Website refresh", progress: "54%" },
                { label: "Customer research", progress: "91%" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-xs text-neutral-300">
                    <span>{item.label}</span>
                    <span>{item.progress}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-neutral-300"
                      style={{ width: item.progress }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-neutral-400">
          Thoughtful planning. Better teamwork.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[410px]">
          <IconHover>
            <Link
              href="/"
              className="mb-12 inline-flex items-center gap-2.5 lg:hidden"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-black text-white">
                <Workflow size={19} />
              </span>
              <span className="text-base font-semibold">TaskFlow</span>
            </Link>
          </IconHover>

          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-brand">
              {isRegister ? "Start with a clear plan" : "Welcome back"}
            </p>
            <h2 className="text-[30px] font-semibold tracking-tight text-foreground">
              {isRegister ? "Create your account" : "Sign in to TaskFlow"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isRegister
                ? "Set up your workspace and bring your team along."
                : "Pick up where you and your team left off."}
            </p>
          </div>

          <div className="mb-5 rounded-xl border border-border bg-surface-secondary/60 px-4 py-3 motion-safe:transition-colors motion-reduce:transition-none">
            <p
              className="text-sm font-medium text-foreground"
              role="status"
              aria-live="polite"
            >
              {connectionMessage}
            </p>
            {healthError && healthStatus !== "ready" ? (
              <p className="mt-1 text-xs text-muted">{healthError}</p>
            ) : null}
            {healthStatus === "timeout" ? (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                type="button"
                onClick={retryConnection}
              >
                Retry connection
              </Button>
            ) : null}
          </div>

          <form className="space-y-5" onSubmit={handleFormSubmit}>
            {isRegister ? (
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-foreground"
                  htmlFor="name"
                >
                  Full name
                </label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="mt-1.5 text-xs text-danger-foreground">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <label
                className="mb-2 block text-sm font-medium text-foreground"
                htmlFor="email"
              >
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1.5 text-xs text-danger-foreground">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="password"
                >
                  Password
                </label>
                {!isRegister ? (
                  <span className="text-xs text-muted">
                    Secure account access
                  </span>
                ) : null}
              </div>
              <IconHover>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    placeholder={
                      isRegister
                        ? "At least 12 characters"
                        : "Enter your password"
                    }
                    aria-invalid={Boolean(errors.password)}
                    className="pr-12"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </IconHover>
              {errors.password ? (
                <p className="mt-1.5 text-xs text-danger-foreground">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {formError ? (
              <p
                role="alert"
                className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm text-danger-foreground"
              >
                {formError}
              </p>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={!isReady || isSubmitting}
            >
              {isSubmitting
                ? "Please wait…"
                : !isReady
                  ? "Waiting for backend…"
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              {isReady && !isSubmitting ? <ArrowRight size={17} /> : null}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            {isRegister ? "Already have an account?" : "New to TaskFlow?"}{" "}
            <Link
              className="font-semibold text-brand hover:underline"
              href={isRegister ? "/login" : "/register"}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="mt-8 text-center text-[11px] leading-5 text-muted">
            By continuing, you agree to use TaskFlow responsibly and keep your
            account credentials private.
          </p>
        </div>
      </section>
    </div>
  );
}

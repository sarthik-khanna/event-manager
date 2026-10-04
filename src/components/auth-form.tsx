"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/misc";
import { api, ApiClientError } from "@/lib/client";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validations";

type Mode = "login" | "register";

const copy = {
  login: { title: "Welcome back", subtitle: "Log in to continue learning.", submit: "Log in" },
  register: { title: "Create your account", subtitle: "Join as a student and start learning today.", submit: "Sign up" },
};

const demoAccounts = [
  { label: "Student demo", email: "student@learnhub.dev", password: "Student@123" },
  { label: "Admin demo", email: "admin@learnhub.dev", password: "Admin@123" },
];

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const schema = mode === "login" ? loginSchema : registerSchema;
  const [values, setValues] = useState<Record<string, string>>(
    mode === "login" ? { email: "", password: "" } : { name: "", email: "", password: "", confirmPassword: "" },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(v = values) {
    const result = schema.safeParse(v);
    return result.success ? {} : fieldErrors(result.error);
  }

  function update(name: string, value: string) {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    if (touched[name]) setErrors(validate(nextValues));
  }

  function blur(name: string) {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const errs = validate();
    setErrors(errs);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { user } = await api<{ user: { role: "student" | "admin" } }>(`/api/auth/${mode}`, {
        method: "POST",
        json: values,
      });
      const home = user.role === "admin" ? "/admin" : "/student";
      const safeNext = next?.startsWith(home) ? next : home;
      router.push(safeNext);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        if (err.details) setErrors(err.details);
      } else setFormError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const fields =
    mode === "login"
      ? [
          { name: "email", label: "Email address", type: "email", placeholder: "you@example.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", placeholder: "••••••••", autoComplete: "current-password" },
        ]
      : [
          { name: "name", label: "Full name", type: "text", placeholder: "Jane Doe", autoComplete: "name" },
          { name: "email", label: "Email address", type: "email", placeholder: "you@example.com", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "••••••••",
            autoComplete: "new-password",
            hint: "At least 8 characters, including a letter and a number.",
          },
          { name: "confirmPassword", label: "Confirm password", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
        ];

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-black p-6 md:p-8">
      <h1 className="text-2xl font-bold text-neutral-100">{copy[mode].title}</h1>
      <p className="mt-2 text-sm text-neutral-400">{copy[mode].subtitle}</p>

      <form className="my-8 space-y-4" onSubmit={onSubmit} noValidate>
        {formError && <ErrorAlert title={mode === "login" ? "Could not log you in" : "Could not create your account"}>{formError}</ErrorAlert>}
        {fields.map((f) => (
          <Field key={f.name} label={f.label} htmlFor={f.name} error={touched[f.name] ? errors[f.name] : undefined} hint={f.hint}>
            <Input
              id={f.name}
              name={f.name}
              type={f.type}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              value={values[f.name]}
              onChange={(e) => update(f.name, e.target.value)}
              onBlur={() => blur(f.name)}
              aria-invalid={Boolean(touched[f.name] && errors[f.name])}
              aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
            />
          </Field>
        ))}
        <Button type="submit" variant="gradient" className="h-11 w-full" loading={loading}>
          {copy[mode].submit} &rarr;
        </Button>
      </form>

      {mode === "login" && (
        <div className="mb-6">
          <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
          <p className="mb-3 text-xs tracking-wide text-neutral-500 uppercase">Try a demo account</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((d) => (
              <Button
                key={d.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setValues({ email: d.email, password: d.password });
                  setErrors({});
                }}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-neutral-400">
        {mode === "login" ? "New to LearnHub? " : "Already have an account? "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-medium text-indigo-400 hover:text-indigo-300">
          {mode === "login" ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}

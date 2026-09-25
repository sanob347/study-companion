"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Step =
  | { id: string; title: string; type: "single"; options: string[] }
  | { id: string; title: string; type: "text"; placeholder?: string }
  | { id: string; title: string; type: "number"; placeholder?: string }
  | { id: string; title: string; type: "date" };

const STEPS: Step[] = [
  {
    id: "exam",
    title: "Which exam are you preparing for?",
    type: "single",
    options: ["SSC", "HSC", "Admission test", "O-Level", "A-Level", "Other"],
  },
  { id: "exam_other", title: "What's the exam called?", type: "text", placeholder: "e.g. BUET admission" },
  { id: "exam_date", title: "When is the exam?", type: "date" },
  { id: "strong_subjects", title: "Which subjects are you strong in?", type: "text", placeholder: "e.g. Math, English" },
  { id: "weak_subjects", title: "Which subjects are you weak in?", type: "text", placeholder: "e.g. Physics, Biology" },
  {
    id: "hard_concept",
    title: "You have to learn a hard concept. What helps most?",
    type: "single",
    options: [
      "A step-by-step explanation",
      "A diagram or visual example",
      "Reading it a few times",
      "Solving practice examples",
      "A mix of these",
    ],
  },
  {
    id: "revision_style",
    title: "When you're revising, you prefer...",
    type: "single",
    options: ["Flashcards", "Rewriting summaries", "Practice questions", "Re-reading notes"],
  },
  {
    id: "topic_approach",
    title: "How do you usually approach a new topic?",
    type: "single",
    options: [
      "Understand the concept first",
      "Memorize key facts first",
      "Jump straight into solving problems",
    ],
  },
  {
    id: "session_length",
    title: "How long can you focus in one study session?",
    type: "single",
    options: ["Under 25 min", "25–45 min", "45–60 min", "60+ min"],
  },
  {
    id: "best_time",
    title: "When do you focus best?",
    type: "single",
    options: ["Morning", "Afternoon", "Evening", "Night"],
  },
  {
    id: "main_struggle",
    title: "What's your biggest struggle right now?",
    type: "single",
    options: ["Staying consistent", "Procrastination", "Losing focus", "Understanding concepts", "Running out of time"],
  },
  { id: "study_hours", title: "How many hours a day can you realistically study?", type: "number", placeholder: "e.g. 3" },
  { id: "goal", title: "What's your goal?", type: "text", placeholder: "e.g. Get A+ in HSC" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setCheckedAuth(true);
    });
  }, [router]);

  const visibleSteps = STEPS.filter((s) => s.id !== "exam_other" || answers.exam === "Other");
  const current = visibleSteps[step];

  function set(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  async function next() {
    if (step < visibleSteps.length - 1) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    setError("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/login");
      return;
    }
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(answers),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong. Try again.");
      return;
    }
    router.push("/dashboard");
  }

  if (!checkedAuth) return null;

  const answer = answers[current.id] || "";
  const canContinue = answer.trim().length > 0;

  return (
    <main>
      <div className="progress">
        <div
          className="progress-fill"
          style={{ width: `${((step + 1) / visibleSteps.length) * 100}%` }}
        />
      </div>

      <div className="q">
        <label className="qtitle">{current.title}</label>

        {current.type === "single" && (
          <div className="opts">
            {current.options.map((opt) => (
              <div
                key={opt}
                className={"opt" + (answer === opt ? " selected" : "")}
                onClick={() => set(current.id, opt)}
              >
                {opt}
              </div>
            ))}
          </div>
        )}

        {current.type === "text" && (
          <input
            type="text"
            placeholder={current.placeholder}
            value={answer}
            onChange={(e) => set(current.id, e.target.value)}
          />
        )}

        {current.type === "number" && (
          <input
            type="number"
            placeholder={current.placeholder}
            value={answer}
            onChange={(e) => set(current.id, e.target.value)}
          />
        )}

        {current.type === "date" && (
          <input
            type="date"
            value={answer}
            onChange={(e) => set(current.id, e.target.value)}
          />
        )}
      </div>

      <button className="primary" onClick={next} disabled={!canContinue || submitting}>
        {submitting
          ? "Building your profile..."
          : step === visibleSteps.length - 1
          ? "Finish"
          : "Continue"}
      </button>
      {error && <p className="error">{error}</p>}
    </main>
  );
}

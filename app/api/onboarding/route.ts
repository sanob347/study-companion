import { NextRequest, NextResponse } from "next/server";
import { supabaseAsUser } from "../../../lib/supabaseServer";

const SYSTEM_PROMPT = `You are an academic profiling assistant. Given a student's onboarding answers, output ONLY valid JSON matching this shape, nothing else — no markdown, no backticks, no commentary:

{
  "strong_subjects": string[],
  "weak_subjects": string[],
  "learning_approach": string,
  "retention_style": string,
  "preferred_session_minutes": number,
  "best_time": string,
  "main_struggle": string,
  "goal": string,
  "summary": string
}

"summary" is 2-3 sentences, human-readable, supportive and non-judgmental in tone (e.g. "Physics is currently a weaker area — let's work on it" rather than "bad at Physics").`;

const SESSION_MINUTES: Record<string, number> = {
  "Under 25 min": 20,
  "25–45 min": 35,
  "45–60 min": 50,
  "60+ min": 70,
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = supabaseAsUser(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const userId = userData.user.id;

  const answers = await req.json();

  const { error: usageErr } = await supabase.rpc("increment_ai_usage");
  if (usageErr) {
    return NextResponse.json(
      { error: "Daily AI usage limit reached. Try again tomorrow." },
      { status: 429 }
    );
  }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(answers) },
      ],
    }),
  });

  if (!groqRes.ok) {
    const detail = await groqRes.text();
    console.error("Groq error:", detail);
    return NextResponse.json({ error: "AI profile generation failed" }, { status: 502 });
  }

  const groqData = await groqRes.json();
  let profile;
  try {
    profile = JSON.parse(groqData.choices[0].message.content);
  } catch {
    return NextResponse.json({ error: "AI returned an unreadable profile" }, { status: 502 });
  }

  const { error: profileErr } = await supabase.from("profiles").upsert({
    id: userId,
    exam: answers.exam === "Other" ? answers.exam_other : answers.exam,
    exam_date: answers.exam_date || null,
    target: answers.goal || null,
  });
  if (profileErr) {
    console.error(profileErr);
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
  }

  const { error: lpErr } = await supabase.from("learning_profiles").upsert({
    user_id: userId,
    self_reported: {
      ...answers,
      preferred_session_minutes: SESSION_MINUTES[answers.session_length] ?? 40,
    },
    observed: {},
    summary: profile.summary,
  });
  if (lpErr) {
    console.error(lpErr);
    return NextResponse.json({ error: "Could not save learning profile" }, { status: 500 });
  }

  const strong = (answers.strong_subjects || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const weak = (answers.weak_subjects || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const subjectRows = [
    ...strong.map((name: string) => ({ user_id: userId, name, level: "strong", priority: 2 })),
    ...weak.map((name: string) => ({ user_id: userId, name, level: "weak", priority: 3 })),
  ];
  if (subjectRows.length > 0) {
    const { error: subjErr } = await supabase.from("subjects").insert(subjectRows);
    if (subjErr) console.error("subject insert error:", subjErr);
  }

  return NextResponse.json({ ok: true, profile });
}

"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendLink() {
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <main>
        <h1>Check your email</h1>
        <p className="sub">
          We sent a login link to {email}. Open it on this phone to continue.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Sign in</h1>
      <p className="sub">No password needed — we'll email you a link.</p>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <button className="primary" onClick={sendLink} disabled={!email}>
        Send login link
      </button>
      {error && <p className="error">{error}</p>}
    </main>
  );
}

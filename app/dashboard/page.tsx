"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState("");

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("learning_profiles")
        .select("summary")
        .eq("user_id", sessionData.session.user.id)
        .single();
      setSummary(data?.summary || "");
    })();
  }, [router]);

  return (
    <main>
      <h1>Your profile</h1>
      <p className="sub">{summary || "Loading..."}</p>
      <p className="sub">
        Next up: routine creator and AI tutor land here.
      </p>
    </main>
  );
}

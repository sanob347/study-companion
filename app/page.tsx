import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>AI that learns how YOU learn.</h1>
      <p className="sub">
        A study companion that understands your strengths, your schedule and
        your goals before it starts teaching you anything.
      </p>
      <Link href="/login">
        <button className="primary">Get started</button>
      </Link>
    </main>
  );
}

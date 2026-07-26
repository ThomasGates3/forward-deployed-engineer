import Link from "next/link";
import { Nunito } from "next/font/google";
import SupportReplyTool from "./SupportReplyTool";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata = {
  title: "Support Reply Generator",
  description: "Pick a scenario or paste a message and get a clear, on-brand support reply.",
};

export default function Page() {
  return (
    <main
      className={nunito.className}
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 15% -10%, #ffe8d6 0%, rgba(255,232,214,0) 60%), radial-gradient(1000px 500px at 90% 0%, #e7f0ff 0%, rgba(231,240,255,0) 55%), linear-gradient(180deg, #fff9f3 0%, #fdf4ec 100%)",
        color: "#4a3f38",
        padding: "clamp(20px, 4vw, 48px)",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <Link
          href="/"
          data-testid="back-to-portfolio"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: 44,
            padding: "0 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.7)",
            border: "1px solid #f3d9c2",
            color: "#8a6a52",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 6px 18px rgba(217,159,110,0.15)",
          }}
        >
          ← Back to portfolio
        </Link>

        <header style={{ marginTop: 32, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "#fff2e3",
              border: "1px solid #f6dcc4",
              color: "#c9804a",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            💬 Friendly Helpdesk
          </div>
          <h1
            style={{
              margin: "20px 0 12px",
              fontSize: "clamp(30px, 5vw, 46px)",
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#5a4335",
            }}
          >
            Support Reply Generator
          </h1>
          <p style={{ margin: "0 auto", maxWidth: 560, fontSize: 18, color: "#8a7565", lineHeight: 1.5 }}>
            Pick a scenario or paste a message → a clear, on-brand support reply, ready to send with a
            gentle tone &amp; quality check.
          </p>
        </header>

        <div style={{ marginTop: 36 }}>
          <SupportReplyTool />
        </div>
      </div>
    </main>
  );
}

"use client";

export default function Page() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "40px", marginBottom: "12px" }}>
          Corneal Risk Platform
        </h1>
        <p style={{ fontSize: "18px", opacity: 0.85 }}>
          Clinical risk assessment dashboard
        </p>
      </div>
    </div>
  );
}

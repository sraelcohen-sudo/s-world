import Link from "next/link";
import AdminTaxonomyClient from "@/components/admin-taxonomy-client";

export default function TaxonomyAdminPage() {
  return (
    <main
      style={{
        padding: "40px",
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 8px 0",
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: "12px"
            }}
          >
            Admin
          </p>
          <h1
            style={{
              margin: 0,
              color: "#0f2d69",
              fontSize: "36px"
            }}
          >
            Taxonomy Dashboard
          </h1>
          <p
            style={{
              margin: "10px 0 0 0",
              color: "#475569",
              maxWidth: "760px",
              lineHeight: 1.6
            }}
          >
            Manage the educational structure of S World. Start with exam tracks,
            then add disciplines, competencies, and blueprint distributions.
          </p>
        </div>

        <Link
          href="/"
          style={{
            backgroundColor: "#ffffff",
            color: "#0f2d69",
            textDecoration: "none",
            borderRadius: "10px",
            padding: "12px 16px",
            fontWeight: 700,
            border: "1px solid #cbd5e1"
          }}
        >
          Back to Home
        </Link>
      </div>

      <AdminTaxonomyClient />
    </main>
  );
}
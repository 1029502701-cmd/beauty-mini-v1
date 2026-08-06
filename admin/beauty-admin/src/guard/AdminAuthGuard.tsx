import React, { useEffect, useState } from "react";
import type { AdminRole } from "@/types";

/**
 * AdminAuthGuard
 *
 * Checks admin login state (X-Session-Id / KV store on the backend).
 * Currently supports two roles: super_admin and operator.
 * If no session is found, redirects to the login placeholder.
 */

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // TODO: Replace with real session validation against backend KV store
      // e.g. const res = await fetch("/api/admin/auth/verify", {
      //   headers: { "X-Session-Id": getSessionId() },
      // });
      const stored = localStorage.getItem("admin_session");
      if (stored) {
        try {
          const session = JSON.parse(stored) as { role: AdminRole };
          setRole(session.role);
        } catch {
          localStorage.removeItem("admin_session");
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <span>验证登录状态...</span>
      </div>
    );
  }

  if (!role) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ marginBottom: 16 }}>管理后台登录</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            请先登录以访问管理后台
          </p>
          <button style={styles.btn} onClick={handleMockLogin}>
            模拟登录（operator）
          </button>
          <button
            style={{ ...styles.btn, marginLeft: 8, background: "#7c3aed" }}
            onClick={handleMockLoginSuper}
          >
            模拟登录（super_admin）
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function handleMockLogin() {
  localStorage.setItem("admin_session", JSON.stringify({ role: "operator" as AdminRole }));
  window.location.reload();
}

function handleMockLoginSuper() {
  localStorage.setItem("admin_session", JSON.stringify({ role: "super_admin" as AdminRole }));
  window.location.reload();
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: "100vh",
    fontSize: 14,
    color: "#888",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid #e5e7eb",
    borderTopColor: "#f472b6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#fafafa",
  },
  card: {
    background: "#fff",
    padding: "32px 40px",
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    width: 360,
  },
  btn: {
    padding: "10px 20px",
    background: "#f472b6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
};

export default AdminAuthGuard;

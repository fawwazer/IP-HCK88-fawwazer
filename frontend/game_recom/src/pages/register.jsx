import React, { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/register", form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setLoading(false);
      navigate("/login");
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed"
      );
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={{ margin: 0, textAlign: "center" }}>Create account</h2>
        <p style={{ textAlign: "center", color: "#555" }}>
          Start getting personalized recommendations
        </p>

        <form onSubmit={handleRegister} style={styles.form}>
          <label style={styles.label}>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.label}>Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
            type="email"
            required
          />

          <label style={styles.label}>Password</label>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            type="password"
            required
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <small>
            Already have an account? <a href="/login">Sign in</a>
          </small>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "linear-gradient(180deg,#0f172a 0%,#0b1220 100%)",
  },
  card: {
    width: 420,
    padding: 28,
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 10px 40px rgba(2,6,23,0.6)",
  },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 13, color: "#111", fontWeight: 600 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e6e6e6",
    fontSize: 14,
  },
  button: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "#0b5cff",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: { color: "#b00020", marginTop: 6 },
};

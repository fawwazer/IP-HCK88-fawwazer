import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

/*
  Styled Login page
  - Uses your existing endpoints:
    POST http://localhost:3000/login  (email/password)
    POST http://localhost:3000/google-login  (Google tokenId)
  - Initializes Google Identity Services and renders a Google Sign-In button.
  - Stores returned token in localStorage and navigates to '/'.
*/

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await axios.post(
        "https://game.fawwazerweb.site/login",
        form
      );
      // backend expected shape: { token }
      const token =
        data.token || data.Authorization || data.auth || data.access_token;
      if (token) {
        localStorage.setItem("token", token);
        navigate("/");
      } else {
        setError("Login succeeded but no token was returned by server");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // One-click create: register with the provided email (generate a username + password), then login
  const handleOneClickRegister = async () => {
    setError(null);
    if (!form.email)
      return setError("Please enter an email to create an account");
    setLoading(true);
    try {
      // generate a simple username and password
      const username =
        form.email.split("@")[0] + Math.floor(Math.random() * 9000 + 1000);
      const password = Math.random().toString(36).slice(-10);

      await axios.post("https://game.fawwazerweb.site/register", {
        username,
        email: form.email,
        password,
      });

      // login right away
      const { data } = await axios.post("https://game.fawwazerweb.site/login", {
        email: form.email,
        password,
      });
      const token = data.token || data.Authorization || data.auth;
      if (token) {
        localStorage.setItem("token", token);
        navigate("/");
      } else {
        setError("Account created but login failed (no token)");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Create account failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // The backend function in your original code expects tokenId in the POST body
  const handleGoogleLogin = useCallback(
    async (googleData) => {
      setError(null);
      setLoading(true);
      try {
        // googleData may provide 'credential' or 'tokenId'
        const tokenId =
          googleData?.credential || googleData?.tokenId || googleData;
        // backend expects `id_token` in the request body
        const { data } = await axios.post(
          "https://game.fawwazerweb.site/google-login",
          {
            id_token: tokenId,
          }
        );
        const token = data.token || data.Authorization || data.auth;
        if (token) {
          localStorage.setItem("token", token);
          navigate("/");
        } else {
          setError("Google login succeeded but no token returned");
        }
      } catch {
        setError("Google login failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    // load Google Identity Services and render the button
    const id = "gid-script";
    function init() {
      try {
        // Using provided client id directly (from your .env attachment)
        const CLIENT_ID =
          "269168304061-08u3c5k2ohc0ak63ls9p9fnqq18j7s6n.apps.googleusercontent.com";
        if (!CLIENT_ID || !window.google || !window.google.accounts) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleGoogleLogin,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("buttonDiv"),
          { theme: "outline", size: "large" }
        );
      } catch {
        // ignore if google not available
      }
    }

    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.body.appendChild(s);
    } else {
      init();
    }
  }, [handleGoogleLogin]);

  // Trigger the Google one-tap / prompt flow (called when user clicks our custom button)
  const handleGoogleClick = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // This will show the One Tap or other prompt UI if available.
      window.google.accounts.id.prompt();
    } else {
      setError("Google Sign-In not yet ready, please try again in a moment.");
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>GameWorks</h1>
        <p style={styles.subtitle}>
          Sign in to get personalized recommendations
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            required
            style={styles.input}
            placeholder="you@example.com"
          />

          <label style={styles.label}>Password</label>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type="password"
            required
            style={styles.input}
            placeholder="Your password"
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.primary} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            onClick={handleOneClickRegister}
            style={styles.secondary}
            disabled={loading}
          >
            {loading ? "Working..." : "Create account with email"}
          </button>
        </form>

        <div style={styles.orRow}>
          <span style={styles.orLine} />
          <small style={{ margin: "0 8px" }}>or</small>
          <span style={styles.orLine} />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <div id="buttonDiv" />
          <button
            type="button"
            style={styles.googleButton}
            onClick={handleGoogleClick}
          >
            Continue with Google
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <small>
            Don't have an account? <a href="/register">Register</a>
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
    color: "#0b1220",
  },
  title: { margin: 0, fontSize: 28, textAlign: "center" },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    textAlign: "center",
    color: "#555",
  },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 13, color: "#111", fontWeight: 600 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e6e6e6",
    fontSize: 14,
  },
  primary: {
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "#0b5cff",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  orRow: { display: "flex", alignItems: "center", marginTop: 14 },
  orLine: { flex: 1, height: 1, background: "#eee" },
  error: { color: "#b00020", marginTop: 6 },
  secondary: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e6e6e6",
    background: "white",
    color: "#0b1220",
    cursor: "pointer",
  },
  googleButton: {
    marginTop: 8,
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "#ea4335",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
};

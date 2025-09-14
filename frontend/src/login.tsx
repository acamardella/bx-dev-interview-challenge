import { useState } from "react";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event:React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(process.env.PUBLIC_API_BASE + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("email", email);
        localStorage.setItem("token", data.token);
        window.location.href = "/upload";
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage(`❌ Errore: ${err}`);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 5 }}>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br/>
        <button type="submit" disabled={loading}>
          {loading ? (
            <span
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #fff",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 1s linear infinite"
              }}
            />
          ) : (
            "Entra"
          )}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

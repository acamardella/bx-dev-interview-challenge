import { useState } from "react";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event:React.FormEvent) => {
    event.preventDefault();

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
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Login</h1>
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
        <button type="submit">Entra</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

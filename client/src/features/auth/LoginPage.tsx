import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { useAuth } from "./AuthContext";
import { landingPathForRole } from "./roleAccess";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // The signed-in user's role (derived from their account/email) decides
      // where they land — e.g. a Driver goes straight to the trips board.
      const user = await login(email, password);
      navigate(landingPathForRole(user.role), { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-appbg px-4 relative overflow-hidden">
      {/* Soft ambient background glow — the kind of subtle detail premium SaaS login pages have */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          className="flex items-center justify-center gap-2 mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ rotate: -20, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <Truck className="text-primary" size={32} />
          </motion.div>
          <span className="text-2xl font-bold text-text-primary">TransitOps</span>
        </motion.div>

        <motion.form
          onSubmit={submit}
          className="card space-y-4"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <div>
            <h1 className="text-xl font-bold text-text-primary">Sign in</h1>
            <p className="text-sm text-text-secondary mt-1">Smart Transport Operations Platform</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-btn bg-danger/10 text-danger text-sm px-3 py-2"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <motion.button
            className="btn-primary w-full"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Signing in...
              </motion.span>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}

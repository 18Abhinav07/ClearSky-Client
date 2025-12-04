/**
 * Simple Landing Page - NO CDP
 * For debugging purposes
 */

export default function LandingSimple() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Welcome to ClearSky</h1>
          <p style={styles.subtitle}>
            CDP is temporarily disabled for debugging
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Debug Mode</h2>
          <p style={styles.cardDescription}>
            If you can see this page, the React app is working correctly.
          </p>
          <div style={styles.infoBox}>
            <p>✅ React Router: Working</p>
            <p>✅ Vite Dev Server: Running</p>
            <p>⚠️ CDP SDK: Temporarily disabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    minWidth: "100vw",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  content: {
    maxWidth: "900px",
    width: "100%",
  },
  hero: {
    textAlign: "center" as const,
    marginBottom: "40px",
    color: "white",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "16px",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  subtitle: {
    fontSize: "20px",
    opacity: 0.9,
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    marginBottom: "40px",
    textAlign: "center" as const,
  },
  cardTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#333",
  },
  cardDescription: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "32px",
  },
  infoBox: {
    background: "#f5f5f5",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "left" as const,
  },
};

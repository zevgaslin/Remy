import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8080";

// Placeholder sections for the features in docs/requirements.md.
// Each becomes its own component/page as that part of the app is built.
const SECTIONS = ["Pantry", "Recipes", "Weekly Plan", "Login"];

function App() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [backendStatus, setBackendStatus] = useState("checking...");

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("unreachable"));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Remy</h1>
        <nav>
          {SECTIONS.map((section) => (
            <button
              key={section}
              className={section === activeSection ? "active" : ""}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <p>Backend status: {backendStatus}</p>
        <h2>{activeSection}</h2>
        <p>TODO: build the {activeSection} view here.</p>
      </main>
    </div>
  );
}

export default App;

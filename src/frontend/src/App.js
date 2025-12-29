// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";

// LOCAL : "http://localhost:3000/api"
// AWS   : "http://<ALB-DNS-NAME>/api"
const API_BASE_URL = "http://localhost:3000/api";

function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
  const [users, setUsers] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState("");

  // Charger la liste des users au démarrage
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const resp = await fetch(`${API_BASE_URL}/users`);
      const data = await resp.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError("");
    if (!username || !email) {
      setError("Username et email sont obligatoires.");
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      if (!resp.ok) {
        throw new Error("Erreur lors de la création de l'utilisateur.");
      }

      const data = await resp.json();
      setCurrentUserId(String(data.id));
      setUsername("");
      setEmail("");
      await fetchUsers();
    } catch (e) {
      console.error(e);
      setError("Impossible de créer l'utilisateur.");
    }
  }

  async function handleLoadTasks() {
    setError("");
    if (!currentUserId) {
      setError("Choisis ou saisis un ID utilisateur.");
      return;
    }
    setLoadingTasks(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/users/${currentUserId}/tasks`);
      const data = await resp.json();
      setTasks(data);
    } catch (e) {
      console.error(e);
      setError("Erreur lors du chargement des tâches.");
    } finally {
      setLoadingTasks(false);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    setError("");
    if (!currentUserId) {
      setError("Aucun utilisateur sélectionné.");
      return;
    }
    if (!taskTitle.trim()) {
      setError("Le titre de la tâche est vide.");
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/users/${currentUserId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskTitle }),
      });

      if (!resp.ok) {
        throw new Error("Erreur création tâche.");
      }

      setTaskTitle("");
      await handleLoadTasks();
    } catch (e) {
      console.error(e);
      setError("Impossible d'ajouter la tâche.");
    }
  }

  async function toggleTask(taskId, newState) {
    setError("");

    try {
      const resp = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: newState }),
      });

      if (!resp.ok) {
        throw new Error("Erreur mise à jour tâche.");
      }

      await handleLoadTasks();
    } catch (e) {
      console.error(e);
      setError("Impossible de modifier la tâche.");
    }
  }

  return (
    <div className="app-root">
      <div className="app-card">
        <header className="app-header">
          <h1>Todo AWS 3‑tiers</h1>
          <p className="subtitle">
            Démo simple frontend React, backend API, base MySQL.
          </p>
        </header>

        {error && <div className="alert">{error}</div>}

        {/* Création utilisateur */}
        <section className="section">
          <h2>Créer un utilisateur</h2>
          <form className="form-row" onSubmit={handleCreateUser}>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
            />
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn primary">
              Créer
            </button>
          </form>
        </section>

        {/* Sélection utilisateur */}
        <section className="section">
          <h2>Choisir un utilisateur</h2>
          <div className="user-row">
            <select
              className="input select"
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
            >
              <option value="">– choisir –</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.id} – {u.username}
                </option>
              ))}
            </select>
            <span className="or">ou</span>
            <input
              type="number"
              className="input small-input"
              placeholder="ID manuel"
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
            />
            <button className="btn" onClick={handleLoadTasks}>
              Charger tâches
            </button>
          </div>
        </section>

        {/* Ajout tâche */}
        <section className="section">
          <h2>Ajouter une tâche</h2>
          <form className="form-row" onSubmit={handleAddTask}>
            <input
              type="text"
              className="input"
              placeholder="Titre de la tâche"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <button type="submit" className="btn primary">
              Ajouter
            </button>
          </form>
        </section>

        {/* Liste des tâches */}
        <section className="section">
          <h2>Liste des tâches</h2>
          {loadingTasks ? (
            <div className="loading">Chargement des tâches...</div>
          ) : tasks.length === 0 ? (
            <p className="empty">Aucune tâche pour cet utilisateur.</p>
          ) : (
            <ul className="task-list">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className={`task-item ${t.is_done ? "done" : ""}`}
                  onClick={() => toggleTask(t.id, !t.is_done)}
                >
                  <span className="task-title">
                    #{t.id} – {t.title}
                  </span>
                  <span className="task-status">
                    {t.is_done ? "Terminée" : "En cours"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;

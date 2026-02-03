import { useState, useEffect } from "react"; // <--- 1. Import useEffect
import axios from "axios";
import "./App.css";

const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const TASKS_URL = import.meta.env.VITE_TASKS_URL;

function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [token, setToken] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  // --- ACTIONS ---

  const login = async () => {
    try {
      const res = await axios.post(`${AUTH_URL}/login`, { username, password });
      setToken(res.data.token);
      setMessage("Logged in successfully!");
    } catch (err) {
      console.error(err);
      setMessage(
        "Login failed: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const register = async () => {
    try {
      const role = isAdmin ? "admin" : "user";
      await axios.post(`${AUTH_URL}/register`, { username, password, role });
      setMessage("Registration successful! Please log in.");
      setIsRegistering(false);
    } catch (err) {
      console.error(err);
      setMessage(
        "Registration failed: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const fetchTasks = async () => {
    // Safety check: Don't fetch if no token is available yet
    if (!token) return;

    try {
      const res = await axios.get(`${TASKS_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // SORTING: Earliest first (Sort by ID ascending)
      const sortedTasks = res.data.tasks.sort((a, b) => a.id - b.id);

      setTasks(sortedTasks);

      // Resolve Owner Names
      const uniqueOwnerIds = [...new Set(sortedTasks.map((t) => t.owner_id))];
      const missingIds = uniqueOwnerIds.filter((id) => !userMap[id]);

      if (missingIds.length === 0) {
        setMessage(`Loaded ${sortedTasks.length} tasks`);
        return;
      }

      const newMap = { ...userMap };
      let resolvedCount = 0;

      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const userRes = await axios.get(`${AUTH_URL}/users/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            newMap[id] = userRes.data.username;
            resolvedCount++;
          } catch (err) {
            console.warn(`Could not resolve user ${id}`);
            newMap[id] = `Unknown (${id})`;
          }
        }),
      );

      setUserMap(newMap);
      setMessage(
        `Loaded ${sortedTasks.length} tasks (Resolved ${resolvedCount} new owners)`,
      );
    } catch (err) {
      console.error(err);
      setMessage("Fetch failed: " + err.message);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle) return;
    try {
      await axios.post(
        `${TASKS_URL}/tasks`,
        { title: newTaskTitle },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewTaskTitle("");

      // Refresh immediately after adding
      fetchTasks();

      setMessage("Task created!");
    } catch (err) {
      console.error(err);
      setMessage("Create failed: " + err.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${TASKS_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic UI Update: Remove from local list immediately
      setTasks(tasks.filter((t) => t.id !== id));
      setMessage("Task deleted");
    } catch (err) {
      console.error(err);
      setMessage(
        "Delete failed: " + (err.response?.data?.message || err.message),
      );
    }
  };

  // --- RENDER ---

  return (
    <div className="container">
      <h1>
        TaskMaster {token ? "Dashboard" : isRegistering ? "Register" : "Login"}
      </h1>
      <div className="status">{message}</div>

      {!token ? (
        <div className="auth-form">
          <input
            placeholder="Username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            id="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isRegistering && (
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="admin-check"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <label htmlFor="admin-check">Register as Admin?</label>
            </div>
          )}

          {isRegistering ? (
            <button onClick={register} className="btn-success">
              Register
            </button>
          ) : (
            <button onClick={login}>Login</button>
          )}

          <p
            className="switch-mode-link"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setMessage("");
            }}
          >
            {isRegistering
              ? "Already have an account? Login"
              : "Need an account? Register"}
          </p>
        </div>
      ) : (
        <div className="task-list">
          <div className="create-task-container">
            <input
              id="task"
              placeholder="Enter new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button onClick={createTask} className="btn-info">
              Add Task
            </button>
          </div>

          {/* REFRESH BUTTON REMOVED HERE */}

          {tasks.length === 0 && <p>No tasks found.</p>}

          <ul>
            {tasks.map((t) => (
              <li key={t.id}>
                <span className="title">{t.title}</span>
                <div className="task-actions">
                  <span className="owner">
                    {userMap[t.owner_id]
                      ? `User: ${userMap[t.owner_id]}`
                      : `ID: ${t.owner_id}`}
                  </span>
                  <button
                    className="btn-danger-small"
                    onClick={() => deleteTask(t.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              setToken(null);
              setTasks([]);
              setMessage("");
            }}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

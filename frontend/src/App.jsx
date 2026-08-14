import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Carrega as tarefas da API Go assim que a página abre
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:8080/tasks')
      const data = await res.json()
      setTasks(data || [])
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err)
    }
  }

  // Cria uma nova tarefa via POST
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const newTask = { title, description, status: 'todo' }

    try {
      const res = await fetch('http://localhost:8080/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
      if (res.ok) {
        setTitle('')
        setDescription('')
        fetchTasks()
      }
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
    }
  }

  // Atualiza o status da tarefa (Mover de coluna)
  const handleStatusChange = async (task, newStatus) => {
    const updatedTask = { ...task, status: newStatus }

    try {
      const res = await fetch(`http://localhost:8080/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      })
      if (res.ok) {
        fetchTasks()
      }
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err)
    }
  }

  // Deleta uma tarefa
  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/tasks/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchTasks()
      }
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err)
    }
  }

  return (
    <div className="app-container">
      <h1>📋 Mini Kanban (React + Go)</h1>

      {/* Formulário para criar tarefa */}
      <form onSubmit={handleCreateTask} className="task-form">
        <input
          type="text"
          placeholder="Título da tarefa..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Descrição..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Adicionar Tarefa</button>
      </form>

      {/* Quadro Kanban com 3 Colunas */}
      <div className="kanban-board">
        {/* Coluna 1: A Fazer */}
        <div className="kanban-column">
          <h2>📌 A Fazer</h2>
          {tasks
            .filter((t) => t.status === 'todo')
            .map((task) => (
              <div key={task.id} className="task-card">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="card-actions">
                  <button onClick={() => handleStatusChange(task, 'in_progress')}>
                    Mover → Em Progresso
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="btn-delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Coluna 2: Em Progresso */}
        <div className="kanban-column">
          <h2>⚙️ Em Progresso</h2>
          {tasks
            .filter((t) => t.status === 'in_progress')
            .map((task) => (
              <div key={task.id} className="task-card">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="card-actions">
                  <button onClick={() => handleStatusChange(task, 'todo')}>
                    ← A Fazer
                  </button>
                  <button onClick={() => handleStatusChange(task, 'done')}>
                    Concluído →
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="btn-delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Coluna 3: Concluído */}
        <div className="kanban-column">
          <h2>✅ Concluído</h2>
          {tasks
            .filter((t) => t.status === 'done')
            .map((task) => (
              <div key={task.id} className="task-card done">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="card-actions">
                  <button onClick={() => handleStatusChange(task, 'in_progress')}>
                    ← Em Progresso
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="btn-delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default App
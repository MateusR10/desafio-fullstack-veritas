package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
)

type Task struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

var (
	tasks  = []Task{} //lista de tarefas na memória
	nextID = 1        //Um contador que gera o ID a cada nova tarefa
	mu     sync.Mutex //Segurança ao acesso concorrente
)

// Libera o acesso para o front consumir a API
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		//Requisições do tipo OPTIONS são sondagens do navegador respondendo Ok.
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Gerenciador de requisições na rota tasks GET e POST
func tasksHandler(w http.ResponseWriter, r *http.Request) {
	//Avisa qual o tipo de conteúdo que vai ser retornado
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		mu.Lock()
		defer mu.Unlock()
		json.NewEncoder(w).Encode(tasks)

	case http.MethodPost:
		var newTask Task
		//Converte o Json vindo da requisição para a struct task
		if err := json.NewDecoder(r.Body).Decode(&newTask); err != nil {
			http.Error(w, "Dados inválidos", http.StatusBadRequest)
			return
		}

		mu.Lock()
		newTask.ID = nextID
		nextID++
		tasks = append(tasks, newTask)
		mu.Unlock()

		//Responde com código 201 e devolve a tarefa que foi criada com o ID
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(newTask)

	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}

// taskDetail gerencia requisições para uma tarefa específica
func taskDetailHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	//Pega o texto que vem após a tasks
	idStr := r.URL.Path[len("/tasks/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	//Procura o índice da tarefa na lista
	index := -1
	for i, t := range tasks {
		if t.ID == id {
			index = i
			break
		}
	}

	if index == -1 {
		http.Error(w, "Tarefa não encontrada", http.StatusNotFound)
		return
	}

	switch r.Method {
	case http.MethodPut:
		var updatedTask Task
		if err := json.NewDecoder(r.Body).Decode(&updatedTask); err != nil {
			http.Error(w, "Dados inválidos", http.StatusBadRequest)
			return
		}

		updatedTask.ID = id
		tasks[index] = updatedTask
		json.NewEncoder(w).Encode(updatedTask)

	case http.MethodDelete:
		//Remove a tarefa do slice
		tasks = append(tasks[:index], tasks[index+1:]...)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Tarefa deletada"})

	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}

func main() {
	//Adicionando duas tarefas de teste inicial na memória
	tasks = append(tasks, Task{ID: 1, Title: "Estudar Go", Description: "Entender conceitos da linguagem", Status: "todo"})
	tasks = append(tasks, Task{ID: 2, Title: "Criar Front em React", Description: "Fazer a interface do Kankan", Status: "in_progress"})
	nextID = 3

	//Mapeando a rota para o handler protegido
	http.HandleFunc("/tasks", enableCORS(tasksHandler))
	http.HandleFunc("/tasks/", enableCORS(taskDetailHandler))

	fmt.Println("Servidor Backend rodando em http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

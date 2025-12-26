const socket = io();
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const userCount = document.getElementById('count');

let editingIndex = -1;

// Add todo event
addBtn.addEventListener('click', () => {
    const todoText = todoInput.value.trim();
    if (todoText) {
        if (editingIndex === -1) {
            socket.emit('addTodo', todoText);
        } else {
            socket.emit('editTodo', { index: editingIndex, newText: todoText });
            editingIndex = -1;
            addBtn.textContent = 'Tambah';
        }
        todoInput.value = '';
    }
});

// Enter key support
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});

// Update todo list
socket.on('updateTodos', (todos) => {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = 'todo-item';

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo;

        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editTodo(index, todo);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Hapus';
        deleteBtn.onclick = () => socket.emit('removeTodo', index);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(span);
        li.appendChild(actions);
        todoList.appendChild(li);
    });
});

// Edit todo function
function editTodo(index, text) {
    todoInput.value = text;
    editingIndex = index;
    addBtn.textContent = 'Simpan';
    todoInput.focus();
}

// Update user count (this would require server-side tracking)
socket.on('userCount', (count) => {
    userCount.textContent = count;
});

// Initial connection
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

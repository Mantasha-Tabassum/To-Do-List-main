// ============================================
// TASKFLOW - SMART TASK MANAGER
// AUTHENTICATED VERSION
// ============================================

const API_URL = "/api/tasks";

let tasks = [];
let currentFilter = "all";
let currentCategory = "all";
let currentPriority = "all";
let searchText = "";
let currentSort = "newest";

let editingTaskId = null;
let deletingTaskId = null;


// ============================================
// AUTHENTICATION
// ============================================

const token = localStorage.getItem("taskflowToken");
const storedUser = localStorage.getItem("taskflowUser");

// If user is not logged in, send to login
if (!token) {
    window.location.href = "login.html";
}


// ============================================
// AUTHENTICATED REQUEST
// ============================================

async function authenticatedFetch(url, options = {}) {

    const currentToken =
        localStorage.getItem("taskflowToken");

    if (!currentToken) {

        window.location.href = "login.html";

        throw new Error("Authentication required");
    }


    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${currentToken}`
    };


    return fetch(url, {
        ...options,
        headers
    });
}


// ============================================
// DOM ELEMENTS
// ============================================

const taskInput =
    document.getElementById("taskInput");

const prioritySelect =
    document.getElementById("prioritySelect");

const categorySelect =
    document.getElementById("categorySelect");

const dueDateInput =
    document.getElementById("dueDate");

const addTaskBtn =
    document.getElementById("addTask");

const searchInput =
    document.getElementById("searchInput");

const sortSelect =
    document.getElementById("sortSelect");

const categoryFilter =
    document.getElementById("categoryFilter");

const priorityFilter =
    document.getElementById("priorityFilter");

const clearCompletedBtn =
    document.getElementById("clearCompleted");

const taskList =
    document.getElementById("taskList");


const totalCount =
    document.getElementById("totalCount");

const activeCount =
    document.getElementById("activeCount");

const completedCount =
    document.getElementById("completedCount");

const overdueCount =
    document.getElementById("overdueCount");


const progressText =
    document.getElementById("progressText");

const progressPercent =
    document.getElementById("progressPercent");

const progressFill =
    document.getElementById("progressFill");


const themeToggle =
    document.getElementById("themeToggle");


// ============================================
// EDIT MODAL
// ============================================

const editModal =
    document.getElementById("editModal");

const editTaskText =
    document.getElementById("editTaskText");

const editPriority =
    document.getElementById("editPriority");

const editCategory =
    document.getElementById("editCategory");

const editDueDate =
    document.getElementById("editDueDate");

const closeEditModalBtn =
    document.getElementById("closeEditModal");

const cancelEditBtn =
    document.getElementById("cancelEdit");

const saveEditBtn =
    document.getElementById("saveEdit");


// ============================================
// DELETE MODAL
// ============================================

const deleteModal =
    document.getElementById("deleteModal");

const cancelDeleteBtn =
    document.getElementById("cancelDelete");

const confirmDeleteBtn =
    document.getElementById("confirmDelete");


// ============================================
// TOAST
// ============================================

const toast =
    document.getElementById("toast");

const toastIcon =
    document.getElementById("toastIcon");

const toastMessage =
    document.getElementById("toastMessage");


// ============================================
// LOAD TASKS
// ============================================

async function loadTasks() {

    try {

        const response =
            await authenticatedFetch(API_URL);


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Failed to fetch tasks"
            );
        }


        tasks = data;

        renderTasks();

        updateStats();


    } catch (error) {

        console.error(
            "Load tasks error:",
            error
        );

        if (
            error.message !==
            "Authentication required"
        ) {

            showToast(
                "Failed to load tasks",
                "error"
            );
        }
    }
}


// ============================================
// ADD TASK
// ============================================

async function addTask() {

    const text =
        taskInput.value.trim();


    if (!text) {

        showToast(
            "Please enter a task",
            "error"
        );

        taskInput.focus();

        return;
    }


    const taskData = {

        text: text,

        priority:
            prioritySelect.value,

        category:
            categorySelect.value,

        dueDate:
            dueDateInput.value || null
    };


    try {

        const response =
            await authenticatedFetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(taskData)
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to add task"
            );
        }


        tasks.unshift(data);


        taskInput.value = "";

        prioritySelect.value =
            "Medium";

        categorySelect.value =
            "General";

        dueDateInput.value =
            "";


        renderTasks();

        updateStats();


        showToast(
            "Task added successfully"
        );


    } catch (error) {

        console.error(
            "Add task error:",
            error
        );

        showToast(
            error.message ||
            "Could not add task",
            "error"
        );
    }
}


// ============================================
// TOGGLE TASK
// ============================================

async function toggleTask(id) {

    const task =
        tasks.find(
            task => task._id === id
        );


    if (!task) return;


    try {

        const response =
            await authenticatedFetch(
                `${API_URL}/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            completed:
                                !task.completed
                        })
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const updatedTask =
            await response.json();


        if (!response.ok) {

            throw new Error(
                updatedTask.message ||
                "Failed to update task"
            );
        }


        const index =
            tasks.findIndex(
                task => task._id === id
            );


        if (index !== -1) {

            tasks[index] =
                updatedTask;
        }


        renderTasks();

        updateStats();


        showToast(
            updatedTask.completed
                ? "Task completed 🎉"
                : "Task marked active"
        );


    } catch (error) {

        console.error(
            "Toggle task error:",
            error
        );

        showToast(
            "Failed to update task",
            "error"
        );
    }
}


// ============================================
// OPEN EDIT MODAL
// ============================================

function editTask(id) {

    const task =
        tasks.find(
            task => task._id === id
        );


    if (!task) return;


    editingTaskId = id;


    editTaskText.value =
        task.text || "";


    editPriority.value =
        task.priority || "Medium";


    editCategory.value =
        task.category || "General";


    if (task.dueDate) {

        const date =
            new Date(task.dueDate);


        if (!isNaN(date.getTime())) {

            const year =
                date.getFullYear();

            const month =
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    date.getDate()
                ).padStart(2, "0");


            editDueDate.value =
                `${year}-${month}-${day}`;

        } else {

            editDueDate.value = "";
        }

    } else {

        editDueDate.value = "";
    }


    editModal.classList.add("show");


    setTimeout(() => {

        editTaskText.focus();

    }, 100);
}


// ============================================
// SAVE EDITED TASK
// ============================================

async function saveEditTask() {

    if (!editingTaskId) return;


    const text =
        editTaskText.value.trim();


    if (!text) {

        showToast(
            "Task cannot be empty",
            "error"
        );

        editTaskText.focus();

        return;
    }


    const updatedData = {

        text: text,

        priority:
            editPriority.value,

        category:
            editCategory.value,

        dueDate:
            editDueDate.value || null
    };


    try {

        const response =
            await authenticatedFetch(
                `${API_URL}/${editingTaskId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            updatedData
                        )
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to update task"
            );
        }


        const index =
            tasks.findIndex(
                task =>
                    task._id ===
                    editingTaskId
            );


        if (index !== -1) {

            tasks[index] =
                data;
        }


        closeEditModal();

        renderTasks();

        updateStats();


        showToast(
            "Task updated successfully"
        );


    } catch (error) {

        console.error(
            "Save edit error:",
            error
        );

        showToast(
            error.message ||
            "Failed to update task",
            "error"
        );
    }
}


// ============================================
// CLOSE EDIT MODAL
// ============================================

function closeEditModal() {

    editModal.classList.remove("show");

    editingTaskId = null;

    editTaskText.value = "";

    editPriority.value =
        "Medium";

    editCategory.value =
        "General";

    editDueDate.value = "";
}


// ============================================
// OPEN DELETE MODAL
// ============================================

function deleteTask(id) {

    deletingTaskId = id;

    const confirmSetting =
        localStorage.getItem("confirmBeforeDelete");

    // If confirmation is OFF, delete directly
    if (confirmSetting === "false") {

        confirmDelete();

        return;
    }

    // If confirmation is ON, show delete modal
    deleteModal.classList.add("show");
}

// ============================================
// CONFIRM DELETE
// ============================================

async function confirmDelete() {

    if (!deletingTaskId) return;


    try {

        const response =
            await authenticatedFetch(
                `${API_URL}/${deletingTaskId}`,
                {
                    method: "DELETE"
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to delete task"
            );
        }


        tasks =
            tasks.filter(
                task =>
                    task._id !==
                    deletingTaskId
            );


        closeDeleteModal();

        renderTasks();

        updateStats();


        showToast(
            "Task deleted successfully"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        showToast(
            error.message ||
            "Failed to delete task",
            "error"
        );
    }
}


// ============================================
// CLOSE DELETE MODAL
// ============================================

function closeDeleteModal() {

    deleteModal.classList.remove("show");

    deletingTaskId = null;
}


// ============================================
// RENDER TASKS
// ============================================

function renderTasks() {

    taskList.innerHTML = "";


    let filteredTasks =
        [...tasks];


    // FILTER

    if (
        currentFilter ===
        "active"
    ) {

        filteredTasks =
            filteredTasks.filter(
                task =>
                    !task.completed
            );

    } else if (
        currentFilter ===
        "completed"
    ) {

        filteredTasks =
            filteredTasks.filter(
                task =>
                    task.completed
            );
    }

    updateTaskSectionCount();

    // CATEGORY FILTER

if (currentCategory !== "all") {

    filteredTasks =
        filteredTasks.filter(
            task =>
                (task.category || "General") ===
                currentCategory
        );
}


// PRIORITY FILTER

if (currentPriority !== "all") {

    filteredTasks =
        filteredTasks.filter(
            task =>
                (task.priority || "Medium") ===
                currentPriority
        );
}


    // SEARCH

    if (searchText) {

        filteredTasks =
            filteredTasks.filter(
                task =>
                    task.text
                        .toLowerCase()
                        .includes(
                            searchText
                                .toLowerCase()
                        )
            );
    }

    // ============================================
// CATEGORY FILTER
// ============================================

categoryFilter.addEventListener(
    "change",
    () => {

        currentCategory =
            categoryFilter.value;

        renderTasks();
    }
);


// ============================================
// PRIORITY FILTER
// ============================================

priorityFilter.addEventListener(
    "change",
    () => {

        currentPriority =
            priorityFilter.value;

        renderTasks();
    }
);


    // SORT

    filteredTasks.sort(
        (a, b) => {

            if (
                currentSort ===
                "newest"
            ) {

                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );
            }


            if (
                currentSort ===
                "oldest"
            ) {

                return (
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
                );
            }


            if (
                currentSort ===
                "priority"
            ) {

                const priorityValue = {

                    High: 3,

                    Medium: 2,

                    Low: 1
                };


                return (
                    priorityValue[b.priority] -
                    priorityValue[a.priority]
                );
            }


            if (
                currentSort ===
                "dueDate"
            ) {

                if (!a.dueDate)
                    return 1;

                if (!b.dueDate)
                    return -1;


                return (
                    new Date(a.dueDate) -
                    new Date(b.dueDate)
                );
            }


            return 0;
        }
    );


    // EMPTY STATE

    if (
        filteredTasks.length === 0
    ) {

        taskList.innerHTML = `
            <li class="empty-state">

                <div class="empty-state-icon">
                    📝
                </div>

                <h3>
                    No tasks found
                </h3>

                <p>
                    ${
                        searchText
                            ? "Try a different search."
                            : currentFilter === "completed"
                            ? "You don't have any completed tasks yet."
                            : currentFilter === "active"
                            ? "You don't have any active tasks."
                            : "Add your first task to get started."
                    }
                </p>

            </li>
        `;

        return;
    }


    // CREATE TASKS

    filteredTasks.forEach(
        task => {

            const li =
                document.createElement(
                    "li"
                );


            li.className =
                "task-item";


            if (task.completed) {

                li.classList.add(
                    "completed"
                );
            }


            if (isOverdue(task)) {

                li.classList.add(
                    "overdue"
                );
            }


            const formattedDate =
                formatDate(
                    task.dueDate
                );


            li.innerHTML = `

                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${
                        task.completed
                            ? "checked"
                            : ""
                    }
                    aria-label="Complete task"
                >


                <div class="task-content">

                    <div class="task-text">
                        ${escapeHTML(
                            task.text
                        )}
                    </div>


                    <div class="task-meta">

                        <span
                            class="
                                badge
                                priority-${task.priority.toLowerCase()}
                            "
                        >
                            ${getPriorityIcon(
                                task.priority
                            )}

                            ${escapeHTML(
                                task.priority
                            )}
                        </span>


                        <span
                            class="
                                badge
                                category-badge
                            "
                        >
                            ${getCategoryIcon(
                                task.category
                            )}

                            ${escapeHTML(
                                task.category
                            )}
                        </span>


                        ${
                            formattedDate
                                ? `
                                    <span
                                        class="
                                            badge
                                            date-badge
                                        "
                                    >
                                        📅
                                        ${formattedDate}
                                    </span>
                                `
                                : ""
                        }


                        ${
                            isOverdue(task)
                                ? `
                                    <span
                                        class="
                                            badge
                                            overdue-badge
                                        "
                                    >
                                        ⚠️ Overdue
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="task-actions">

                    <button
                        type="button"
                        class="edit-btn"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-btn"
                    >
                        Delete
                    </button>

                </div>
            `;


            // CHECKBOX

            const checkbox =
                li.querySelector(
                    ".task-checkbox"
                );


            checkbox.addEventListener(
                "change",
                () => {

                    toggleTask(
                        task._id
                    );
                }
            );


            // EDIT

            const editBtn =
                li.querySelector(
                    ".edit-btn"
                );


            editBtn.addEventListener(
                "click",
                () => {

                    editTask(
                        task._id
                    );
                }
            );


            // DELETE

            const deleteBtn =
                li.querySelector(
                    ".delete-btn"
                );


            deleteBtn.addEventListener(
                "click",
                () => {

                    deleteTask(
                        task._id
                    );
                }
            );


            taskList.appendChild(li);
        }
    );
}


// ============================================
// FILTER BUTTONS
// ============================================

document
    .querySelectorAll(".filter-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentFilter =
                    button.dataset.filter;


                document
                    .querySelectorAll(
                        ".filter-btn"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );
                    });


                button.classList.add(
                    "active"
                );


                renderTasks();
            }
        );
    });


// ============================================
// SEARCH
// ============================================

searchInput.addEventListener(
    "input",
    () => {

        searchText =
            searchInput.value.trim();

        renderTasks();
    }
);


// ============================================
// SORT
// ============================================

sortSelect.addEventListener(
    "change",
    () => {

        currentSort =
            sortSelect.value;

        renderTasks();
    }
);


// ============================================
// CLEAR COMPLETED
// ============================================

clearCompletedBtn.addEventListener(
    "click",
    async () => {

        const completedTasks =
            tasks.filter(
                task =>
                    task.completed
            );


        if (
            completedTasks.length === 0
        ) {

            showToast(
                "No completed tasks to clear",
                "error"
            );

            return;
        }


        const confirmed =
            confirm(
                `Delete ${completedTasks.length} completed task(s)?`
            );


        if (!confirmed) return;


        try {

            await Promise.all(

                completedTasks.map(
                    task =>

                        authenticatedFetch(
                            `${API_URL}/${task._id}`,
                            {
                                method: "DELETE"
                            }
                        )
                )
            );


            tasks =
                tasks.filter(
                    task =>
                        !task.completed
                );


            renderTasks();

            updateStats();


            showToast(
                "Completed tasks cleared"
            );


        } catch (error) {

            console.error(
                "Clear completed error:",
                error
            );

            await loadTasks();


            showToast(
                "Some completed tasks could not be deleted",
                "error"
            );
        }
    }
);


// ============================================
// ADD BUTTON
// ============================================

addTaskBtn.addEventListener(
    "click",
    addTask
);


// ============================================
// ENTER TO ADD
// ============================================

taskInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            addTask();
        }
    }
);


// ============================================
// EDIT BUTTONS
// ============================================

saveEditBtn.addEventListener(
    "click",
    saveEditTask
);


cancelEditBtn.addEventListener(
    "click",
    closeEditModal
);


closeEditModalBtn.addEventListener(
    "click",
    closeEditModal
);


// ============================================
// ENTER TO SAVE EDIT
// ============================================

editTaskText.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            saveEditTask();
        }
    }
);


// ============================================
// DELETE BUTTONS
// ============================================

confirmDeleteBtn.addEventListener(
    "click",
    confirmDelete
);


cancelDeleteBtn.addEventListener(
    "click",
    closeDeleteModal
);


// ============================================
// MODAL OVERLAY
// ============================================

editModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            editModal
        ) {

            closeEditModal();
        }
    }
);


deleteModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            deleteModal
        ) {

            closeDeleteModal();
        }
    }
);


// ============================================
// ESC KEY
// ============================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                editModal.classList.contains(
                    "show"
                )
            ) {

                closeEditModal();
            }


            if (
                deleteModal.classList.contains(
                    "show"
                )
            ) {

                closeDeleteModal();
            }
        }
    }
);


// ============================================
// STATISTICS
// ============================================

function updateStats() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const active =
        total - completed;


    const overdue =
        tasks.filter(
            task =>
                isOverdue(task)
        ).length;


    totalCount.textContent =
        total;

    activeCount.textContent =
        active;

    completedCount.textContent =
        completed;

    overdueCount.textContent =
        overdue;


    let percentage = 0;


    if (total > 0) {

        percentage =
            Math.round(
                (completed / total) * 100
            );
    }


    progressPercent.textContent =
        `${percentage}%`;


    progressText.textContent =
        `${completed} of ${total} tasks completed`;


    progressFill.style.width =
        `${percentage}%`;

        updateAnalytics();

        updateUpcomingTasks();
}


// ============================================
// OVERDUE
// ============================================

function isOverdue(task) {

    if (
        !task.dueDate ||
        task.completed
    ) {

        return false;
    }


    const dueDate =
        new Date(task.dueDate);


    dueDate.setHours(
        23,
        59,
        59,
        999
    );


    return dueDate < new Date();
}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(dateValue) {

    if (!dateValue) return "";


    const date =
        new Date(dateValue);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ============================================
// PRIORITY ICON
// ============================================

function getPriorityIcon(
    priority
) {

    if (
        priority === "High"
    ) {

        return "🔴";
    }


    if (
        priority === "Medium"
    ) {

        return "🟡";
    }


    return "🟢";
}


// ============================================
// CATEGORY ICON
// ============================================

function getCategoryIcon(
    category
) {

    const icons = {

        General: "📌",

        Study: "📚",

        Work: "💼",

        Coding: "💻",

        Personal: "🏠"
    };


    return (
        icons[category] ||
        "📌"
    );
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;
}


// ============================================
// TOAST
// ============================================

function showToast(
    message,
    type = "success"
) {

    toastMessage.textContent =
        message;


    if (
        type === "error"
    ) {

        toastIcon.textContent =
            "!";

        toastIcon.style.background =
            "#ef4444";

    } else {

        toastIcon.textContent =
            "✓";

        toastIcon.style.background =
            "#22c55e";
    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


// ============================================
// DARK MODE
// ============================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "taskflow-theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

        themeToggle.textContent =
            "☀️";

    } else {

        document.body.classList.remove(
            "dark"
        );

        themeToggle.textContent =
            "🌙";
    }
}


themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        const isDark =
            document.body.classList.contains(
                "dark"
            );


        localStorage.setItem(
            "taskflow-theme",
            isDark
                ? "dark"
                : "light"
        );


        themeToggle.textContent =
            isDark
                ? "☀️"
                : "🌙";
    }
);

// ============================================
// USER INFORMATION
// ============================================

const userNameElement =
    document.getElementById("userName");

const userEmailElement =
    document.getElementById("userEmail");

const userAvatarElement =
    document.getElementById("userAvatar");

const logoutBtn =
    document.getElementById("logoutBtn");


if (storedUser) {

    try {

        const user =
            JSON.parse(storedUser);


        if (userNameElement) {

            userNameElement.textContent =
                user.name || "User";
        }


        if (userEmailElement) {

            userEmailElement.textContent =
                user.email || "";
        }


        if (userAvatarElement) {

            const firstLetter =
                (user.name || "U")
                    .charAt(0)
                    .toUpperCase();

            userAvatarElement.textContent =
                firstLetter;
        }

    } catch (error) {

        console.error(
            "Failed to load user information:",
            error
        );
    }
}


// ============================================
// LOGOUT BUTTON
// ============================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (confirmed) {

                logout();
            }

        }
    );
}

// ============================================
// LOGOUT
// ============================================

function logout() {

    localStorage.removeItem(
        "taskflowToken"
    );

    localStorage.removeItem(
        "taskflowUser"
    );

    window.location.href =
        "login.html";
}


// ============================================
// INITIAL LOAD
// ============================================

loadTheme();

loadTasks();

// ============================================
// ANALYTICS
// ============================================

function updateAnalytics() {

    // ----------------------------------------
    // COMPLETION RATE
    // ----------------------------------------

    const totalTasks = tasks.length;

    const completedTasks =
        tasks.filter(task => task.completed).length;

    const activeTasks =
        tasks.filter(task => !task.completed).length;


    let completionRate = 0;

    if (totalTasks > 0) {

        completionRate =
            Math.round(
                (completedTasks / totalTasks) * 100
            );
    }


    const completionRateElement =
        document.getElementById("completionRate");

    const analyticsActiveElement =
        document.getElementById("analyticsActive");


    if (completionRateElement) {

        completionRateElement.textContent =
            `${completionRate}%`;
    }


    if (analyticsActiveElement) {

        analyticsActiveElement.textContent =
            activeTasks;
    }


    // ----------------------------------------
    // CATEGORY ANALYTICS
    // ----------------------------------------

    const categoryAnalytics =
        document.getElementById(
            "categoryAnalytics"
        );


    if (categoryAnalytics) {

        const categoryCounts = {};


        tasks.forEach(task => {

            const category =
                task.category || "General";


            categoryCounts[category] =
                (categoryCounts[category] || 0) + 1;
        });


        const categories =
            Object.entries(categoryCounts);


        if (categories.length === 0) {

            categoryAnalytics.innerHTML = `
                <div class="analytics-empty">
                    No category data available.
                </div>
            `;

        } else {

            const maxCategoryCount =
                Math.max(
                    ...categories.map(
                        ([, count]) => count
                    )
                );


            categoryAnalytics.innerHTML =
                categories
                    .map(
                        ([category, count]) => {

                            const percentage =
                                Math.round(
                                    (count /
                                        maxCategoryCount) *
                                    100
                                );


                            return `
                                <div class="analytics-row">

                                    <span class="analytics-label">
                                        ${getCategoryIcon(category)}
                                        ${escapeHTML(category)}
                                    </span>

                                    <div class="analytics-bar">

                                        <div
                                            class="analytics-bar-fill"
                                            style="width: ${percentage}%"
                                        ></div>

                                    </div>

                                    <span class="analytics-value">
                                        ${count}
                                    </span>

                                </div>
                            `;
                        }
                    )
                    .join("");
        }
    }


    // ----------------------------------------
    // PRIORITY ANALYTICS
    // ----------------------------------------

    const priorityAnalytics =
        document.getElementById(
            "priorityAnalytics"
        );


    if (priorityAnalytics) {

        const priorityCounts = {

            High: 0,

            Medium: 0,

            Low: 0
        };


        tasks.forEach(task => {

            const priority =
                task.priority || "Medium";


            if (
                priorityCounts[
                    priority
                ] !== undefined
            ) {

                priorityCounts[
                    priority
                ]++;
            }
        });


        const priorities =
            Object.entries(
                priorityCounts
            );


        const maxPriorityCount =
            Math.max(
                ...priorities.map(
                    ([, count]) => count
                ),
                1
            );


        priorityAnalytics.innerHTML =
            priorities
                .map(
                    ([priority, count]) => {

                        const percentage =
                            Math.round(
                                (count /
                                    maxPriorityCount) *
                                100
                            );


                        return `
                            <div class="analytics-row">

                                <span class="analytics-label">
                                    ${getPriorityIcon(priority)}
                                    ${priority}
                                </span>

                                <div class="analytics-bar">

                                    <div
                                        class="analytics-bar-fill"
                                        style="width: ${percentage}%"
                                    ></div>

                                </div>

                                <span class="analytics-value">
                                    ${count}
                                </span>

                            </div>
                        `;
                    }
                )
                .join("");
    }
}

// ============================================
// UPCOMING DEADLINES
// ============================================

function updateUpcomingTasks() {

    const upcomingContainer =
        document.getElementById("upcomingTasks");

    if (!upcomingContainer) return;


    // Only incomplete tasks having a due date
    const upcomingTasks =
        tasks
            .filter(task => {
                return (
                    !task.completed &&
                    task.dueDate
                );
            })
            .sort((a, b) => {
                return (
                    new Date(a.dueDate) -
                    new Date(b.dueDate)
                );
            })
            .slice(0, 5);


    // No upcoming tasks
    if (upcomingTasks.length === 0) {

        upcomingContainer.innerHTML = `
            <div class="upcoming-empty">
                📅 No upcoming deadlines.
            </div>
        `;

        return;
    }


    upcomingContainer.innerHTML =
        upcomingTasks
            .map(task => {

                const dueDate =
                    new Date(task.dueDate);

                const today =
                    new Date();

                today.setHours(
                    0,
                    0,
                    0,
                    0
                );

                const deadline =
                    new Date(dueDate);

                deadline.setHours(
                    0,
                    0,
                    0,
                    0
                );


                const difference =
                    Math.ceil(
                        (
                            deadline -
                            today
                        ) /
                        (1000 * 60 * 60 * 24)
                    );


                let dateClass = "";

                let dateText = "";


                if (difference < 0) {

                    dateClass = "overdue";

                    const daysLate =
                        Math.abs(
                            difference
                        );

                    dateText =
                        daysLate === 1
                            ? "Overdue by 1 day"
                            : `Overdue by ${daysLate} days`;

                } else if (difference === 0) {

                    dateClass = "soon";

                    dateText =
                        "Due today";

                } else if (difference === 1) {

                    dateClass = "soon";

                    dateText =
                        "Due tomorrow";

                } else if (difference <= 3) {

                    dateClass = "soon";

                    dateText =
                        `Due in ${difference} days`;

                } else {

                    dateText =
                        formatDate(
                            task.dueDate
                        );
                }


                const priority =
                    (
                        task.priority ||
                        "Medium"
                    ).toLowerCase();


                return `
                    <div class="upcoming-task">

                        <div class="upcoming-task-left">

                            <div class="upcoming-icon">
                                📅
                            </div>


                            <div class="upcoming-task-info">

                                <div class="upcoming-task-name">
                                    ${escapeHTML(
                                        task.text
                                    )}
                                </div>


                                <div
                                    class="
                                        upcoming-task-date
                                        ${dateClass}
                                    "
                                >
                                    ${dateText}
                                </div>

                            </div>

                        </div>


                        <span
                            class="
                                upcoming-priority
                                ${priority}
                            "
                        >
                            ${getPriorityIcon(
                                task.priority
                            )}

                            ${escapeHTML(
                                task.priority ||
                                "Medium"
                            )}
                        </span>

                    </div>
                `;
            })
            .join("");
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

const sidebarLinks = document.querySelectorAll(".sidebar-link");

sidebarLinks.forEach(link => {

    link.addEventListener("click", function () {

        // Only handle internal section links
        const href = this.getAttribute("href");

        if (href && href.startsWith("#")) {

            // Remove active from all links
            sidebarLinks.forEach(item => {
                item.classList.remove("active");
            });

            // Add active to clicked link
            this.classList.add("active");

        }

    });

});

// ============================================
// MY TASKS COUNT
// ============================================

function updateTaskSectionCount() {

    const countElement =
        document.getElementById("taskSectionCount");

    if (!countElement) return;

    countElement.textContent = tasks.length;
}

// ============================================
// SETTINGS - DARK MODE
// ============================================

const settingsThemeToggle =
    document.getElementById("settingsThemeToggle");

function updateSettingsThemeToggle() {

    if (!settingsThemeToggle) return;

    const isDark =
        document.body.classList.contains("dark-mode");

    if (isDark) {

        settingsThemeToggle.classList.add("active");

    } else {

        settingsThemeToggle.classList.remove("active");

    }
}


if (settingsThemeToggle) {

    updateSettingsThemeToggle();

    settingsThemeToggle.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "dark-mode"
            );

            const isDark =
                document.body.classList.contains(
                    "dark-mode"
                );

            localStorage.setItem(
                "taskflow-dark-mode",
                isDark
            );

            updateSettingsThemeToggle();

        }
    );
}

// ============================================
// SHOW COMPLETED TASKS SETTING
// ============================================

const showCompletedSetting =
    document.getElementById("showCompletedSetting");

if (showCompletedSetting) {

    // Load saved setting
    const savedSetting =
        localStorage.getItem("showCompletedTasks");

    if (savedSetting !== null) {
        showCompletedSetting.checked =
            savedSetting === "true";
    }

    // Change setting
    showCompletedSetting.addEventListener("change", function () {

        localStorage.setItem(
            "showCompletedTasks",
            this.checked
        );

        renderTasks();

    });

}

// ============================================
// CONFIRM BEFORE DELETE SETTING
// ============================================

const confirmDeleteSetting =
    document.getElementById("confirmDeleteSetting");

if (confirmDeleteSetting) {

    // Load saved setting
    const savedConfirmDelete =
        localStorage.getItem("confirmBeforeDelete");

    if (savedConfirmDelete !== null) {
        confirmDeleteSetting.checked =
            savedConfirmDelete === "true";
    }

    // Save setting when changed
    confirmDeleteSetting.addEventListener("change", function () {

        localStorage.setItem(
            "confirmBeforeDelete",
            this.checked
        );

    });

}
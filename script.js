const darkColors = [
    "#1e293b",
    "#064e3b",
    "#4c1d95",
    "#451a03",
    "#27272a"
];

const lightColors = [
    "#FFFFFF",
    "#FAFAFA",
    "#F5F5F5",
    "#F9FAFB",
    "#F3F4F6"
];

let tasks = JSON.parse(localStorage.getItem("myDailyTasks")) || [];
let schedules = JSON.parse(localStorage.getItem("mySchedules")) || [];

let currentEditingId = null;
let currentDetailId = null;
let lastAddedId = null;
let lastClickedCard = null;
let currentFilter = "all";

function saveToLocalStorage() {
    localStorage.setItem("myDailyTasks", JSON.stringify(tasks));
    localStorage.setItem("mySchedules", JSON.stringify(schedules));
}


function calculatePriority(deadlineIso) {

    const now = new Date();
    const deadlineDate = new Date(deadlineIso);

    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0)
        return { level: "overdue", text: "Terlewat" };

    if (diffDays <= 1)
        return { level: "high", text: "Mendesak" };

    if (diffDays <= 3)
        return { level: "medium", text: "Segera" };

    return { level: "low", text: "Santai" };
}


function formatTimeOnly(date) {
    const d = new Date(date);
    return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDateOnly(date) {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID");
}

function setFilter(filter, button) {

    currentFilter = filter;

    document.querySelectorAll(".filter-btn").forEach(btn=>{
        btn.classList.remove("active");
    });

    button.classList.add("active");

    renderTasks();

}

        function renderTasks() {
            const container = document.getElementById('taskContainer');
            container.innerHTML = '';

            updateStatistics();

            if (tasks.length === 0) {
                container.innerHTML = `<div class="empty-state">Belum ada tugas saat ini.<br>Klik tombol <strong>+</strong> di bawah untuk mulai membuat rutinitasmu.</div>`;
                return;
            }

        const searchKeyword =
            document.getElementById("searchInput")?.value.toLowerCase() || "";

            const sortedTasks = tasks
            .map(task => {
                const priorityInfo = calculatePriority(task.deadline);

                return {
                    ...task,
                    priorityLevel: priorityInfo.level,
                    priorityText: priorityInfo.text
                };
            })
            .filter(task => {

                // FILTER PENCARIAN
                const keyword = searchKeyword.trim();

                const matchSearch =
                    task.title.toLowerCase().includes(keyword) ||
                    task.subject.toLowerCase().includes(keyword) ||
                    task.description.toLowerCase().includes(keyword);

                // FILTER PRIORITAS
                const matchFilter =
                currentFilter === "all"
                ? true
                : currentFilter === "active"
                ? !task.completed
                : task.completed;

                return matchSearch && matchFilter;

            })
            .sort((a, b) => {

                const order = {
                    overdue:1,
                    high:2,
                    medium:3,
                    low:4
                };

                return order[a.priorityLevel] - order[b.priorityLevel];

            });

            sortedTasks.forEach(task => {
                const card = document.createElement('div');
                card.className = `task-card ${task.priorityLevel}`;
                 if (task.completed) {
                    card.classList.add('completed');
                }
           const isLight = document.body.classList.contains("light-mode");

                const palette = isLight ? lightColors : darkColors;

                card.style.backgroundColor =
                    palette[task.id % palette.length];
                
                card.onclick = function() { showDetail(task.id, this); };
                
                if (task.id === lastAddedId) card.classList.add('animate-new-task');
                card.innerHTML = `
                <div class="task-title">${task.title}</div>

                <div class="mt-2">
                    ${
                        task.completed
                        ? `<span class="badge bg-success">
                            <i class="bi bi-check-circle-fill"></i> Selesai
                        </span>`
                        : `<span class="badge bg-danger">
                            <i class="bi bi-hourglass-split"></i> Belum Selesai
                        </span>`
                    }
                </div>

                ${task.completed
                    ? `<div class="status-badge status-done">
                        ✅ Selesai
                    </div>`
                    : `<div class="status-badge status-pending">
                        ⏳ Belum Selesai
                    </div>`
                    }
                <p>${task.description}</p>
                <div class="task-subject">${task.subject}</div>
                <div class="time-display">${formatTimeOnly(task.deadline)}</div>
                <div class="priority-label ${task.priorityLevel}-label">
                    ${task.priorityText}
                </div>
            `;

            container.appendChild(card);
            });

            if (lastAddedId) {
                setTimeout(() => {
                    lastAddedId = null;
                }, 600);
            }
            
            }
               function openAddModal(){

    currentEditingId = null;

    document.getElementById("formTitle").innerText = "Tambah Tugas Baru";

    document.getElementById("taskName").value = "";
    document.getElementById("taskSubject").value = "";
    document.getElementById("taskDesc").value = "";
    document.getElementById("taskDeadline").value = "";

    document.getElementById("taskModal").style.display = "flex";

}

function showDetail(id){

    const task = tasks.find(t => t.id === id);

    if(!task) return;

    currentDetailId = id;

    const statusBtn = document.querySelector('[onclick="toggleTaskStatus()"]');

    statusBtn.innerText = task.completed
        ? "Batalkan Selesai"
        : "Tandai Selesai";

    document.getElementById("detailTitle").innerText = task.title;
    document.getElementById("detailDesc").innerText = task.description || "Tidak ada deskripsi.";
    document.getElementById("detailSubject").innerText = task.subject || "-";
    document.getElementById("detailCreated").innerText = formatDateOnly(task.createdAt);
    document.getElementById("detailDate").innerText = formatDateOnly(task.deadline);
    document.getElementById("detailTime").innerText = formatTimeOnly(task.deadline);

    document.getElementById("detailModal").style.display = "flex";

}

function closeActiveModal(modalId){

    document.getElementById(modalId).style.display = "none";

}

function openEditModal(){

    const task = tasks.find(t => t.id === currentDetailId);

    if(!task) return;

    currentEditingId = task.id;

    document.getElementById("formTitle").innerText = "Edit Tugas";

    document.getElementById("taskName").value = task.title;
    document.getElementById("taskSubject").value = task.subject;
    document.getElementById("taskDesc").value = task.description;

    const d = new Date(task.deadline);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());

    document.getElementById("taskDeadline").value =
        d.toISOString().slice(0,16);

    closeActiveModal("detailModal");

    document.getElementById("taskModal").style.display = "flex";

}

function saveTask(){

    const name = document.getElementById("taskName").value.trim();
    const desc = document.getElementById("taskDesc").value.trim();
    const subject = document.getElementById("taskSubject").value.trim();
    const deadlineInput = document.getElementById("taskDeadline").value;

    if(name==="" || subject==="" || deadlineInput===""){
        alert("Mohon isi Nama Tugas, Mata Kuliah, dan Deadline!");
        return;
    }

            if (currentEditingId !== null) {
                const taskIndex = tasks.findIndex(t => t.id === currentEditingId);
                tasks[taskIndex].title = name;
                tasks[taskIndex].subject = subject;
                tasks[taskIndex].description = desc;
                tasks[taskIndex].deadline = new Date(deadlineInput).toISOString();
                lastAddedId = null; 
            } else {
                const newTaskId = Date.now();
                const randomColor =
                darkColors[Math.floor(Math.random()*darkColors.length)];
                tasks.push({
                    
               
                id:newTaskId,
                title:name,
                subject:subject,
                description:desc,
                createdAt:new Date().toISOString(),
                deadline:new Date(deadlineInput).toISOString(),
                completed:false
           
            });
                lastAddedId = newTaskId; 
            }

            saveToLocalStorage();
            closeActiveModal('taskModal');
            renderTasks();
        }
        function deleteTask() {
            if(confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
                tasks = tasks.filter(t => t.id !== currentDetailId);
                saveToLocalStorage();
                closeActiveModal('detailModal');
                renderTasks();
            }
        }
        function toggleTaskStatus() {
            const task = tasks.find(t => t.id === currentDetailId);

            if (!task) return;

            task.completed = !task.completed;

            saveToLocalStorage();
            closeActiveModal('detailModal');
            renderTasks();
}

function updateStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    const today = new Date().toDateString();

    const todaySchedule = schedules.filter(schedule =>
    new Date(schedule.date).toDateString() === today
).length;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("todaySchedule").textContent = todaySchedule;
    document.getElementById("progressPercent").textContent = progress + "%";
    document.getElementById("progressText").textContent = progress + "%";
    document.getElementById("progressFill").style.width = progress + "%";
}

// JADWAL HARIAN


function renderSchedules() {

    const container = document.getElementById("scheduleContainer");

    if (!container) return;

    container.innerHTML = "";

    if (schedules.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada jadwal harian.
            </div>
        `;

        return;

    }

    schedules.forEach(schedule => {

        const card = document.createElement("div");

        card.className = "task-card";

        card.innerHTML = `
            <div class="task-title">${schedule.name}</div>

            <div class="task-subject">
                ${schedule.days.join(", ")}
            </div>

            <div class="time-display">${schedule.time}</div>

            <button class="btn btn-delete"
                onclick="deleteSchedule(${schedule.id})">
                Hapus
            </button>
        `;

        container.appendChild(card);

    });

}
    function deleteSchedule(id){

        if(!confirm("Yakin ingin menghapus jadwal ini?")) return;

        schedules = schedules.filter(schedule => schedule.id !== id);

        saveToLocalStorage();

        renderSchedules();

        updateStatistics();

    }

   function saveSchedule(){

    const name = document.getElementById("scheduleName").value.trim();

    const checkedDays = [...document.querySelectorAll(".days-box input:checked")]
        .map(day => day.value);

    const time = document.getElementById("scheduleTime").value;

    if(name === "" || checkedDays.length === 0 || time === ""){
        alert("Lengkapi data!");
        return;
    }

    schedules.push({
        id: Date.now(),
        name: name,
        days: checkedDays,
        time: time
    });

    saveToLocalStorage();

    closeActiveModal("scheduleModal");

    document.getElementById("scheduleName").value = "";
    document.getElementById("scheduleTime").value = "";

    document.querySelectorAll(".days-box input").forEach(day=>{
        day.checked = false;
    });

    renderSchedules();

    updateStatistics();

}


    // ===== DARK MODE =====

    const themeToggle = document.getElementById("themeToggle");

    // Ambil tema yang tersimpan
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        themeToggle.textContent = "☀️";
    } else {
        themeToggle.textContent = "🌙";
    }

    themeToggle.addEventListener("click", () => {

        document.body.classList.toggle("light-mode");

        if (document.body.classList.contains("light-mode")) {
            localStorage.setItem("theme", "light");
            themeToggle.textContent = "☀️";
        } else {
            localStorage.setItem("theme", "dark");
            themeToggle.textContent = "🌙";
        }
        renderTasks();

    });
    
   const taskTab = document.getElementById("taskTab");
const scheduleTab = document.getElementById("scheduleTab");

const taskSection = document.getElementById("taskSection");
const scheduleSection = document.getElementById("scheduleSection");

const fabButton = document.getElementById("fabButton");

// Default saat pertama buka aplikasi
fabButton.onclick = openAddModal;

taskTab.onclick = function () {

    taskSection.style.display = "block";
    scheduleSection.style.display = "none";

    taskTab.classList.add("active");
    scheduleTab.classList.remove("active");

    fabButton.onclick = openAddModal;

};

scheduleTab.onclick = function () {

    taskSection.style.display = "none";
    scheduleSection.style.display = "block";

    scheduleTab.classList.add("active");
    taskTab.classList.remove("active");

    renderSchedules();

    fabButton.onclick = function () {
        document.getElementById("scheduleModal").style.display = "flex";
    };

};

renderTasks();
renderSchedules();
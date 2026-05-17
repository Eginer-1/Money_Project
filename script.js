// ========== ХРАНИЛИЩЕ ПОЛЬЗОВАТЕЛЕЙ ==========
const USERS_KEY = "fincontrol_users";
const SESSION_KEY = "fincontrol_current_user";

function initUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
        const defaultUser = {
            username: "demo",
            password: "123456",
            operations: [
                { desc: "Продукты", category: "Еда", amount: 850, type: "expense" },
                { desc: "Зарплата", category: "Зарплата", amount: 50000, type: "income" },
                { desc: "Такси", category: "Транспорт", amount: 300, type: "expense" },
                { desc: "Кофе", category: "Еда", amount: 200, type: "expense" }
            ],
            limits: { "Еда": 10000, "Транспорт": 5000 }
        };
        localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    const username = localStorage.getItem(SESSION_KEY);
    if (!username) return null;
    const users = getUsers();
    return users.find(u => u.username === username) || null;
}

function saveCurrentUserData(userData) {
    const users = getUsers();
    const index = users.findIndex(u => u.username === userData.username);
    if (index !== -1) {
        users[index] = userData;
        saveUsers(users);
    }
}

// ========== АВТОРИЗАЦИЯ ==========
function registerUser(username, password) {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        return { success: false, error: "Пользователь уже существует" };
    }
    if (password.length < 4) {
        return { success: false, error: "Пароль должен быть не менее 4 символов" };
    }
    const newUser = {
        username,
        password,
        operations: [],
        limits: {}
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true };
}

function loginUser(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        localStorage.setItem(SESSION_KEY, username);
        return { success: true };
    }
    return { success: false, error: "Неверное имя или пароль" };
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    renderApp();
}

// ========== ОТРИСОВКА UI ==========
let currentView = "dashboard";

function renderApp() {
    const currentUser = getCurrentUser();
    const root = document.getElementById("root");
    
    if (!currentUser) {
        root.innerHTML = renderAuthScreen();
        attachAuthEvents();
    } else {
        root.innerHTML = renderMainApp(currentUser);
        attachAppEvents(currentUser);
    }
}

function renderAuthScreen() {
    return `
        <div class="auth-container">
            <div class="card auth-box" id="authCard">
                <div id="authFormContainer">
                    <h2>🔐 Вход</h2>
                    <div class="input-group">
                        <label>Имя пользователя</label>
                        <input type="text" id="loginUsername" placeholder="demo">
                    </div>
                    <div class="input-group">
                        <label>Пароль</label>
                        <input type="password" id="loginPassword" placeholder="••••">
                    </div>
                    <button class="btn" id="doLoginBtn">Войти</button>
                    <div class="switch-text">
                        Нет аккаунта? <span id="showRegister">Зарегистрироваться</span>
                    </div>
                    <div id="authError" class="error-msg"></div>
                </div>
            </div>
        </div>
    `;
}

function attachAuthEvents() {
    const doLogin = document.getElementById("doLoginBtn");
    const showReg = document.getElementById("showRegister");
    const container = document.getElementById("authFormContainer");

    if (doLogin) {
        doLogin.onclick = () => {
            const username = document.getElementById("loginUsername").value.trim();
            const pwd = document.getElementById("loginPassword").value;
            const res = loginUser(username, pwd);
            if (res.success) {
                renderApp();
            } else {
                document.getElementById("authError").innerText = res.error;
            }
        };
    }
    
    if (showReg) {
        showReg.onclick = () => {
            container.innerHTML = `
                <h2>📝 Регистрация</h2>
                <div class="input-group">
                    <label>Имя пользователя</label>
                    <input type="text" id="regUsername" placeholder="username">
                </div>
                <div class="input-group">
                    <label>Пароль (мин. 4 символа)</label>
                    <input type="password" id="regPassword">
                </div>
                <button class="btn" id="doRegBtn">Создать аккаунт</button>
                <div class="switch-text">
                    Уже есть аккаунт? <span id="showLogin">Войти</span>
                </div>
                <div id="regError" class="error-msg"></div>
            `;
            
            document.getElementById("doRegBtn").onclick = () => {
                const username = document.getElementById("regUsername").value.trim();
                const pwd = document.getElementById("regPassword").value;
                const res = registerUser(username, pwd);
                if (res.success) {
                    alert("Регистрация успешна! Теперь войдите.");
                    renderApp();
                } else {
                    document.getElementById("regError").innerText = res.error;
                }
            };
            
            document.getElementById("showLogin").onclick = () => renderApp();
        };
    }
}

function renderMainApp(user) {
    return `
        <div class="app-container">
            <div class="card">
                <div class="app-header">
                    <div class="logo">Fin<span>Control</span></div>
                    <div class="nav-links">
                        <a data-view="dashboard" class="${currentView === 'dashboard' ? 'active' : ''}">Главная</a>
                        <a data-view="operations" class="${currentView === 'operations' ? 'active' : ''}">Операции</a>
                        <a data-view="limits" class="${currentView === 'limits' ? 'active' : ''}">Лимиты</a>
                    </div>
                    <div class="user-info">
                        👤 ${escapeHtml(user.username)}
                        <button class="btn logout-btn" id="logoutBtn">Выйти</button>
                    </div>
                </div>
                <div id="dynamicContent" class="content"></div>
            </div>
        </div>
    `;
}

function attachAppEvents(user) {
    document.querySelectorAll(".nav-links a").forEach(link => {
        link.onclick = () => {
            const view = link.getAttribute("data-view");
            if (view === "dashboard") currentView = "dashboard";
            else if (view === "operations") currentView = "operations";
            else if (view === "limits") currentView = "limits";
            renderApp();
        };
    });
    
    document.getElementById("logoutBtn").onclick = () => logout();
    
    const contentDiv = document.getElementById("dynamicContent");
    if (currentView === "dashboard") renderDashboardView(user, contentDiv);
    else if (currentView === "operations") renderOperationsView(user, contentDiv);
    else if (currentView === "limits") renderLimitsView(user, contentDiv);
}

// ========== ГЛАВНАЯ (ДАШБОРД) ==========
function renderDashboardView(user, container) {
    const balance = user.operations.reduce((acc, op) => 
        op.type === "income" ? acc + op.amount : acc - op.amount, 0);
    
    const expensesByCategory = {};
    user.operations.forEach(op => {
        if (op.type === "expense") {
            expensesByCategory[op.category] = (expensesByCategory[op.category] || 0) + op.amount;
        }
    });
    
    let statsHtml = "";
    for (const [cat, amount] of Object.entries(expensesByCategory)) {
        statsHtml += `<div style="display:flex; justify-content:space-between; margin:8px 0;">
                        <span>${getCategoryIcon(cat)} ${cat}</span>
                        <span style="color:#f87171;">↓ ${amount.toFixed(2)} ₽</span>
                      </div>`;
    }
    if (!statsHtml) statsHtml = "<p style='color:#6b7280;'>Нет расходов</p>";
    
    let recentHtml = "";
    user.operations.slice(-5).reverse().forEach(op => {
        recentHtml += `
            <tr>
                <td>${escapeHtml(op.desc)}</td>
                <td>${escapeHtml(op.category)}</td>
                <td class="${op.type === 'income' ? 'badge-income' : 'badge-expense'}">
                    ${op.type === 'income' ? '+' : '-'}${op.amount.toFixed(2)} ₽
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = `
        <div class="balance-card">
            <p>💰 Текущий баланс</p>
            <div class="balance">${balance.toFixed(2)} ₽</div>
        </div>
        
        <div class="grid-2col">
            <div class="info-card">
                <h3>➕ Новая операция</h3>
                <form id="quickAddForm">
                    <input type="text" id="desc" placeholder="Описание" required>
                    <input type="number" id="amount" placeholder="Сумма" required step="1">
                    <select id="category">
                        <option>Еда</option>
                        <option>Транспорт</option>
                        <option>Коммунальные</option>
                        <option>Зарплата</option>
                        <option>Развлечения</option>
                    </select>
                    <select id="type">
                        <option value="expense">📉 Расход</option>
                        <option value="income">📈 Доход</option>
                    </select>
                    <button type="submit" class="btn">➕ Добавить</button>
                </form>
            </div>
            <div class="info-card">
                <h3>📊 Расходы по категориям</h3>
                ${statsHtml}
            </div>
        </div>
        
        <div class="info-card">
            <h3>🕘 Последние операции</h3>
            <table>
                <thead><tr><th>Описание</th><th>Категория</th><th>Сумма</th></tr></thead>
                <tbody>${recentHtml || '<tr><td colspan="3">Нет операций</td></tr>'}</tbody>
            </table>
        </div>
    `;
    
    const form = document.getElementById("quickAddForm");
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const desc = document.getElementById("desc").value.trim();
            const amount = parseFloat(document.getElementById("amount").value);
            const category = document.getElementById("category").value;
            const type = document.getElementById("type").value;
            
            if (!desc) { alert("Введите описание"); return; }
            if (isNaN(amount) || amount <= 0) { alert("Введите корректную сумму"); return; }
            
            user.operations.push({ desc, category, amount, type });
            saveCurrentUserData(user);
            
            if (type === "expense") {
                const limit = user.limits[category];
                if (limit) {
                    const spent = user.operations.filter(op => op.category === category && op.type === "expense").reduce((s, op) => s + op.amount, 0);
                    if (spent > limit) alert(`⚠️ Превышен лимит "${category}"!\nЛимит: ${limit} ₽\nПотрачено: ${spent} ₽`);
                }
            }
            renderDashboardView(user, container);
        };
    }
}

// ========== СТРАНИЦА ОПЕРАЦИЙ ==========
function renderOperationsView(user, container) {
    function renderTable() {
        let rows = "";
        if (user.operations.length === 0) {
            rows = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#6b7280;">📭 Нет операций</td></tr>';
        } else {
            user.operations.forEach((op, idx) => {
                rows += `
                    <tr data-index="${idx}">
                        <td>${escapeHtml(op.desc)}</td>
                        <td>${escapeHtml(op.category)}</td>
                        <td class="${op.type === 'income' ? 'badge-income' : 'badge-expense'}">
                            ${op.type === 'income' ? '+' : '-'}${op.amount.toFixed(2)} ₽
                        </td>
                        <td><button class="delete-op" data-index="${idx}">🗑️</button></td>
                    </tr>
                `;
            });
        }
        return rows;
    }
    
    container.innerHTML = `
        <h2>📋 Все операции</h2>
        <button class="btn" id="clearAllBtn">🗑️ Очистить все операции</button>
        <div style="overflow-x:auto; border-radius:16px; border:1px solid #2a2f3f; margin-top:1rem;">
            <table style="width:100%">
                <thead>
                    <tr>
                        <th>Описание</th><th>Категория</th><th>Сумма</th><th></th>
                    </tr>
                </thead>
                <tbody id="allOpsBody">${renderTable()}</tbody>
            </table>
        </div>
    `;
    
    document.querySelectorAll(".delete-op").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute("data-index"));
            if (confirm("Удалить операцию?")) {
                user.operations.splice(idx, 1);
                saveCurrentUserData(user);
                renderOperationsView(user, container);
            }
        };
    });
    
    document.getElementById("clearAllBtn").onclick = () => {
        if (confirm("⚠️ Удалить ВСЕ операции?")) {
            user.operations = [];
            saveCurrentUserData(user);
            renderOperationsView(user, container);
        }
    };
}

// ========== СТРАНИЦА ЛИМИТОВ ==========
function renderLimitsView(user, container) {
    const categories = ["Еда", "Транспорт", "Коммунальные", "Развлечения"];
    
    function renderLimits() {
        let html = '<div id="limitsList">';
        categories.forEach(cat => {
            const currentLimit = user.limits[cat] || "";
            const spent = user.operations.filter(op => op.category === cat && op.type === "expense").reduce((s, op) => s + op.amount, 0);
            const isOver = (currentLimit && spent > currentLimit);
            const percent = currentLimit ? Math.min(100, (spent / currentLimit) * 100) : 0;
            
            html += `
                <div class="info-card" style="${isOver ? 'border-left: 4px solid #f87171;' : ''}">
                    <strong>${getCategoryIcon(cat)} ${cat}</strong>
                    <div style="margin: 0.75rem 0;">
                        <span style="color:#cbd5e1;">📉 Траты за месяц: </span>
                        <strong style="color: ${isOver ? '#f87171' : '#4ade80'};">${spent.toFixed(2)} ₽</strong>
                    </div>
                    ${currentLimit ? `
                        <div class="progress-bar">
                            <div class="progress-fill ${isOver ? 'danger' : ''}" style="width: ${percent}%;"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <span style="color:#94a3b8; font-size:0.7rem;">${percent.toFixed(0)}%</span>
                            <span style="color:#94a3b8; font-size:0.7rem;">Лимит: ${currentLimit} ₽</span>
                        </div>
                    ` : ''}
                    <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid #2a2f3f;">
                        <span style="color:#94a3b8;">🎯 Лимит:</span>
                        <input type="number" id="limit_${cat}" placeholder="не задан" value="${currentLimit}" style="width:140px; margin:0;">
                        <button class="btn" data-cat="${cat}" id="setLimit_${cat}" style="width:auto; padding:8px 20px; margin:0;">💾 Сохранить</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }
    
    container.innerHTML = `<h2>🎯 Месячные лимиты</h2>${renderLimits()}`;
    
    categories.forEach(cat => {
        const btn = document.getElementById(`setLimit_${cat}`);
        if (btn) {
            btn.onclick = () => {
                const input = document.getElementById(`limit_${cat}`);
                let newLimit = parseFloat(input.value);
                if (!isNaN(newLimit) && newLimit > 0) {
                    user.limits[cat] = newLimit;
                    alert(`✅ Лимит "${cat}": ${newLimit.toFixed(2)} ₽`);
                } else {
                    delete user.limits[cat];
                    alert(`❌ Лимит "${cat}" удалён`);
                }
                saveCurrentUserData(user);
                renderLimitsView(user, container);
            };
        }
    });
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getCategoryIcon(cat) {
    const icons = { "Еда": "🍎", "Транспорт": "🚗", "Коммунальные": "💡", "Развлечения": "🎬", "Зарплата": "💼" };
    return icons[cat] || "📌";
}

// ========== ЗАПУСК ==========
initUsers();
renderApp();
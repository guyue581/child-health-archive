/**
 * 童心健康档案 - 主应用逻辑
 * 负责页面路由、全局状态管理、UI通用函数
 */

// 全局状态
const AppState = {
    currentChildId: null,    // 当前选中的孩子ID
    children: [],            // 孩子列表
    currentPage: 'dashboard' // 当前页面
};

// 页面标题映射
const PAGE_TITLES = {
    dashboard: '总览',
    archive: '儿童档案',
    growth: '生长曲线',
    vaccine: '疫苗接种',
    medical: '就诊用药',
    reports: '检测报告',
    agent: 'AI健康助手',
    export: '健康报告'
};

/**
 * 初始化应用
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化数据库
        await initDB();
        
        // 绑定导航事件
        bindNavigation();
        
        // 绑定孩子选择器
        bindChildSelector();
        
        // 绑定弹窗关闭
        bindModalEvents();
        
        // 加载孩子列表
        await loadChildren();
        
        // 渲染总览页
        renderDashboard();
        
        console.log('童心健康档案应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
        showToast('应用初始化失败，请检查浏览器是否支持本地存储', 'error');
    }
});

/**
 * 绑定导航菜单点击事件
 */
function bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault();
            const page = this.dataset.page;
            switchPage(page);
        });
    });
}

/**
 * 切换页面
 * @param {string} pageName - 目标页面名称
 */
function switchPage(pageName) {
    // 更新导航激活状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新页面标题
    document.getElementById('pageTitle').textContent = PAGE_TITLES[pageName] || '总览';
    
    AppState.currentPage = pageName;
    
    // 触发页面渲染
    renderPage(pageName);
}

/**
 * 渲染指定页面
 * @param {string} pageName - 页面名称
 */
function renderPage(pageName) {
    switch (pageName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'archive':
            renderArchivePage();
            break;
        case 'growth':
            renderGrowthPage();
            break;
        case 'vaccine':
            renderVaccinePage();
            break;
        case 'medical':
            renderMedicalPage();
            break;
        case 'reports':
            renderReportsPage();
            break;
        case 'agent':
            renderAgentPage();
            break;
        case 'export':
            renderExportPage();
            break;
    }
}

/**
 * 绑定孩子选择器
 */
function bindChildSelector() {
    const select = document.getElementById('currentChildSelect');
    const addBtn = document.getElementById('addChildBtn');
    
    select.addEventListener('change', function() {
        const childId = this.value ? parseInt(this.value) : null;
        setCurrentChild(childId);
    });
    
    // 添加孩子按钮直接跳转到档案页
    addBtn.addEventListener('click', function() {
        switchPage('archive');
    });
}

/**
 * 加载孩子列表
 */
async function loadChildren() {
    try {
        AppState.children = await getAllChildren();
        refreshChildSelect();
    } catch (error) {
        console.error('加载孩子列表失败:', error);
        showToast('加载孩子列表失败', 'error');
    }
}

/**
 * 刷新孩子选择下拉框
 */
function refreshChildSelect() {
    const select = document.getElementById('currentChildSelect');
    select.innerHTML = '<option value="">请选择孩子</option>';
    
    AppState.children.forEach(child => {
        const option = document.createElement('option');
        option.value = child.id;
        option.textContent = child.name;
        
        if (AppState.currentChildId === child.id) {
            option.selected = true;
        }
        
        select.appendChild(option);
    });
}

/**
 * 设置当前孩子
 * @param {number|null} childId - 孩子ID
 */
function setCurrentChild(childId) {
    AppState.currentChildId = childId;
    
    const childNameEl = document.getElementById('currentChildName');
    const child = AppState.children.find(c => c.id === childId);
    
    childNameEl.textContent = child ? child.name : '未选择孩子';
    
    // 刷新选择器选中状态
    const select = document.getElementById('currentChildSelect');
    select.value = childId || '';
    
    // 刷新当前页面
    renderPage(AppState.currentPage);
}

/**
 * 获取当前孩子信息
 * @returns {Object|null}
 */
function getCurrentChild() {
    if (!AppState.currentChildId) return null;
    return AppState.children.find(c => c.id === AppState.currentChildId) || null;
}

/**
 * 渲染总览页
 */
function renderDashboard() {
    const grid = document.getElementById('dashboardGrid');
    const welcomeCard = document.querySelector('.welcome-card');
    
    if (!AppState.currentChildId) {
        welcomeCard.innerHTML = `
            <h3>欢迎使用童心健康档案</h3>
            <p>请先添加或选择孩子，开始管理孩子的健康成长数据。</p>
            <div style="margin-top: 16px; display: flex; gap: 12px;">
                <button class="btn btn-primary" onclick="showAddChildForm()">+ 添加孩子</button>
                <button class="btn btn-secondary" onclick="loadDemoData()">🎮 加载示例数据</button>
            </div>
        `;
        grid.innerHTML = '';
        return;
    }
    
    const child = getCurrentChild();
    const ageMonths = child ? calculateAgeMonths(child.birthday) : 0;
    const ageText = ageMonths < 12 ? `${ageMonths}个月` : `${Math.floor(ageMonths / 12)}岁${ageMonths % 12}个月`;
    
    welcomeCard.innerHTML = `
        <h3>你好，${child ? child.name : ''}的家长</h3>
        <p>孩子当前 ${ageText}，让我们共同关注孩子的健康成长。</p>
    `;
    
    // 异步加载统计数据
    loadDashboardStats(grid);
}

/**
 * 加载总览统计数据
 * @param {HTMLElement} container - 容器元素
 */
async function loadDashboardStats(container) {
    if (!AppState.currentChildId) {
        container.innerHTML = '';
        return;
    }
    
    try {
        const [growthList, vaccineList, medicalList, reportList] = await Promise.all([
            getDataByChildId('growth', AppState.currentChildId),
            getDataByChildId('vaccines', AppState.currentChildId),
            getDataByChildId('medical', AppState.currentChildId),
            getDataByChildId('reports', AppState.currentChildId)
        ]);

        // 计算待接种疫苗数量（基于疫苗计划，而非原始记录）
        const child = getCurrentChild();
        if (!child) return;
        const ageMonths = calculateAgeMonths(child.birthday);
        const vaccinePlan = generateVaccinePlan(child.birthday, vaccineList, ageMonths);
        const pendingVaccines = vaccinePlan.filter(v => v.status === 'pending' || v.status === 'overdue').length;
        
        // 获取最新生长数据
        const latestGrowth = growthList.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        container.innerHTML = `
            <div class="stat-card">
                <h4>生长记录</h4>
                <div class="value">${growthList.length} 条</div>
            </div>
            <div class="stat-card">
                <h4>待接种疫苗</h4>
                <div class="value">${pendingVaccines} 剂</div>
            </div>
            <div class="stat-card">
                <h4>就诊/用药记录</h4>
                <div class="value">${medicalList.length} 条</div>
            </div>
            <div class="stat-card">
                <h4>检测报告</h4>
                <div class="value">${reportList.length} 份</div>
            </div>
            ${latestGrowth ? `
            <div class="stat-card">
                <h4>最新身高</h4>
                <div class="value">${latestGrowth.height} cm</div>
            </div>
            <div class="stat-card">
                <h4>最新体重</h4>
                <div class="value">${latestGrowth.weight} kg</div>
            </div>
            ` : ''}
        `;
    } catch (error) {
        console.error('加载统计数据失败:', error);
        container.innerHTML = '<p style="color: #999;">加载统计数据失败</p>';
    }
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：success/error/warning
 * @param {number} duration - 显示时长（毫秒）
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

/**
 * 显示弹窗
 * @param {string} title - 弹窗标题
 * @param {string} html - 弹窗内容HTML
 */
function showModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
}

/**
 * 关闭弹窗
 */
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

/**
 * 绑定弹窗事件
 */
function bindModalEvents() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    
    // 点击弹窗背景关闭
    document.getElementById('modal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeModal();
        }
    });
}

/**
 * 检查是否已选择孩子
 * @returns {boolean}
 */
function checkChildSelected() {
    if (!AppState.currentChildId) {
        showToast('请先选择或添加一个孩子', 'warning');
        return false;
    }
    return true;
}

/**
 * 童心健康档案 - 儿童档案管理模块
 * 负责添加、编辑、删除、展示多个孩子的基础信息
 */

/**
 * 渲染儿童档案页面
 */
function renderArchivePage() {
    const container = document.getElementById('archiveContainer');

    container.innerHTML = `
        <div class="card">
            <div class="card-header-with-actions">
                <h3>我的孩子</h3>
                <div class="card-actions">
                    <button class="btn btn-secondary" id="clearDemoBtn" style="display: none;" onclick="clearDemoData()">🗑️ 清除示例数据</button>
                    <button class="btn btn-primary" onclick="showAddChildForm()">+ 添加孩子</button>
                </div>
            </div>
            <div id="childrenList"></div>
        </div>
    `;

    loadChildrenList();
}

/**
 * 加载孩子列表并渲染
 */
async function loadChildrenList() {
    const listContainer = document.getElementById('childrenList');
    
    try {
        // 重新加载最新数据
        AppState.children = await getAllChildren();
        refreshChildSelect();

        // 控制清除示例数据按钮显示
        const clearDemoBtn = document.getElementById('clearDemoBtn');
        if (clearDemoBtn) {
            const demoExists = AppState.children.some(c => c.name === DEMO_CHILD_NAME);
            clearDemoBtn.style.display = demoExists ? 'inline-flex' : 'none';
        }

        if (AppState.children.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">👶</div>
                    <h3>还没有孩子档案</h3>
                    <p>点击右上角"添加孩子"按钮，或加载示例数据快速体验。</p>
                    <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: center;">
                        <button class="btn btn-primary" onclick="showAddChildForm()">+ 添加孩子</button>
                        <button class="btn btn-secondary" onclick="loadDemoData()">🎮 加载示例数据</button>
                    </div>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = '<div class="list"></div>';
        const list = listContainer.querySelector('.list');
        
        AppState.children.forEach(child => {
            const ageMonths = calculateAgeMonths(child.birthday);
            const ageText = ageMonths < 12 ? `${ageMonths}个月` : `${Math.floor(ageMonths / 12)}岁${ageMonths % 12}个月`;
            const genderText = child.gender === 'male' ? '男' : child.gender === 'female' ? '女' : '未知';
            
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-info">
                    <h4>${child.name} <span style="font-weight: normal; color: #999; font-size: 14px;">（${genderText}，${ageText}）</span></h4>
                    <p>生日：${formatDate(child.birthday)} | 血型：${child.bloodType || '未填写'} | 过敏史：${child.allergies || '无'}</p>
                    ${child.medicalHistory ? `<p style="margin-top: 4px;">既往病史：${child.medicalHistory}</p>` : ''}
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-small btn-secondary" onclick="selectChild(${child.id})">选择</button>
                    <button class="btn btn-small btn-secondary" onclick="editChild(${child.id})">编辑</button>
                    <button class="btn btn-small btn-danger" onclick="deleteChild(${child.id})">删除</button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('加载孩子列表失败:', error);
        listContainer.innerHTML = '<p style="color: #999; text-align: center;">加载失败，请刷新页面重试</p>';
    }
}

/**
 * 选择某个孩子为当前孩子
 * @param {number} childId - 孩子ID
 */
function selectChild(childId) {
    setCurrentChild(childId);
    showToast(`已切换到 ${getCurrentChild().name}`, 'success');
}

/**
 * 显示添加孩子表单弹窗
 */
function showAddChildForm() {
    showModal('添加孩子档案', `
        <form id="childForm" onsubmit="handleChildSubmit(event)">
            <input type="hidden" id="childId" value="">
            <div class="form-row">
                <div class="form-group">
                    <label>姓名 <span style="color: red;">*</span></label>
                    <input type="text" id="childName" required placeholder="请输入孩子姓名" maxlength="20">
                </div>
                <div class="form-group">
                    <label>性别 <span style="color: red;">*</span></label>
                    <select id="childGender" required>
                        <option value="">请选择</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>出生日期 <span style="color: red;">*</span></label>
                    <input type="date" id="childBirthday" required>
                </div>
                <div class="form-group">
                    <label>血型</label>
                    <select id="childBloodType">
                        <option value="">未知</option>
                        <option value="A">A型</option>
                        <option value="B">B型</option>
                        <option value="AB">AB型</option>
                        <option value="O">O型</option>
                        <option value="other">其他</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>过敏史</label>
                <textarea id="childAllergies" placeholder="如有药物、食物过敏请填写，没有则留空" maxlength="200"></textarea>
            </div>
            <div class="form-group">
                <label>既往病史</label>
                <textarea id="childMedicalHistory" placeholder="如有重大疾病史请填写" maxlength="500"></textarea>
            </div>
            <div class="form-group">
                <label>备注</label>
                <textarea id="childNotes" placeholder="其他需要记录的信息" maxlength="500"></textarea>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `);
    
    // 限制出生日期不能是未来的日期
    document.getElementById('childBirthday').max = new Date().toISOString().split('T')[0];
}

/**
 * 显示编辑孩子表单
 * @param {number} childId - 孩子ID
 */
async function editChild(childId) {
    try {
        const child = await getDataById('children', childId);
        if (!child) {
            showToast('未找到该孩子档案', 'error');
            return;
        }
        
        showAddChildForm();
        
        // 填充表单数据
        document.getElementById('childId').value = child.id;
        document.getElementById('childName').value = child.name || '';
        document.getElementById('childGender').value = child.gender || '';
        document.getElementById('childBirthday').value = child.birthday || '';
        document.getElementById('childBloodType').value = child.bloodType || '';
        document.getElementById('childAllergies').value = child.allergies || '';
        document.getElementById('childMedicalHistory').value = child.medicalHistory || '';
        document.getElementById('childNotes').value = child.notes || '';
        
        document.getElementById('modalTitle').textContent = '编辑孩子档案';
    } catch (error) {
        console.error('加载孩子档案失败:', error);
        showToast('加载孩子档案失败', 'error');
    }
}

/**
 * 处理孩子表单提交
 * @param {Event} event - 表单提交事件
 */
async function handleChildSubmit(event) {
    event.preventDefault();
    
    // 获取表单数据
    const id = document.getElementById('childId').value;
    const name = document.getElementById('childName').value.trim();
    const gender = document.getElementById('childGender').value;
    const birthday = document.getElementById('childBirthday').value;
    const bloodType = document.getElementById('childBloodType').value;
    const allergies = document.getElementById('childAllergies').value.trim();
    const medicalHistory = document.getElementById('childMedicalHistory').value.trim();
    const notes = document.getElementById('childNotes').value.trim();
    
    // 基础校验
    if (!name) {
        showToast('请输入孩子姓名', 'warning');
        return;
    }
    if (!gender) {
        showToast('请选择性别', 'warning');
        return;
    }
    if (!birthday) {
        showToast('请选择出生日期', 'warning');
        return;
    }
    
    // 校验出生日期不能是未来
    if (new Date(birthday) > new Date()) {
        showToast('出生日期不能是未来日期', 'warning');
        return;
    }
    
    const childData = {
        name,
        gender,
        birthday,
        bloodType,
        allergies,
        medicalHistory,
        notes
    };
    
    try {
        if (id) {
            // 编辑
            childData.id = parseInt(id);
            await updateData('children', childData);
            showToast('孩子档案更新成功', 'success');
        } else {
            // 新增
            const newId = await addData('children', childData);
            // 新增后自动选中该孩子
            AppState.currentChildId = newId;
            showToast('孩子档案添加成功', 'success');
        }
        
        closeModal();
        
        // 重新加载列表
        await loadChildren();
        
        // 刷新当前页面
        renderPage(AppState.currentPage);
    } catch (error) {
        console.error('保存孩子档案失败:', error);
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * 删除孩子档案
 * @param {number} childId - 孩子ID
 */
async function deleteChild(childId) {
    const child = AppState.children.find(c => c.id === childId);
    const childName = child ? child.name : '这个孩子';
    
    if (!confirm(`确定要删除 ${childName} 的档案吗？\n\n注意：删除后将同时删除该孩子的所有生长记录、疫苗记录、就诊记录和检测报告，且无法恢复。`)) {
        return;
    }
    
    try {
        // 删除关联数据
        const stores = ['growth', 'vaccines', 'medical', 'reports'];
        for (const storeName of stores) {
            const items = await getDataByChildId(storeName, childId);
            for (const item of items) {
                await deleteData(storeName, item.id);
            }
        }
        
        // 删除孩子档案
        await deleteData('children', childId);
        
        // 如果删除的是当前选中的孩子，清空选择
        if (AppState.currentChildId === childId) {
            AppState.currentChildId = null;
        }
        
        showToast('档案删除成功', 'success');
        
        // 重新加载
        await loadChildren();
        setCurrentChild(AppState.currentChildId);
        renderPage(AppState.currentPage);
    } catch (error) {
        console.error('删除孩子档案失败:', error);
        showToast('删除失败，请重试', 'error');
    }
}

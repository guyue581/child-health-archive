/**
 * 童心健康档案 - 就诊用药模块
 * 负责就诊记录、用药记录、过敏史的时间轴展示
 */

/**
 * 渲染就诊用药页面
 */
function renderMedicalPage() {
    const container = document.getElementById('medicalContainer');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header-with-actions">
                <h3>就诊与用药记录</h3>
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="showAddMedicalForm('visit')">+ 记录就诊</button>
                    <button class="btn btn-secondary" onclick="showAddMedicalForm('medication')">+ 记录用药</button>
                </div>
            </div>
            <div id="medicalTimeline"></div>
        </div>
    `;
    
    if (!checkChildSelected()) {
        document.getElementById('medicalTimeline').innerHTML = `
            <div class="empty-state">
                <div class="icon">🗓️</div>
                <h3>请先选择孩子</h3>
                <p>选择孩子后，可以查看就诊用药时间轴。</p>
            </div>
        `;
        return;
    }
    
    loadMedicalData();
}

/**
 * 加载就诊用药数据
 */
async function loadMedicalData() {
    try {
        const medicalList = await getDataByChildId('medical', AppState.currentChildId);
        // 按日期倒序排列
        medicalList.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderMedicalTimeline(medicalList);
    } catch (error) {
        console.error('加载就诊用药记录失败:', error);
        showToast('加载就诊用药记录失败', 'error');
    }
}

/**
 * 渲染时间轴
 * @param {Array} medicalList - 就诊用药列表
 */
function renderMedicalTimeline(medicalList) {
    const container = document.getElementById('medicalTimeline');
    
    if (medicalList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🏥</div>
                <h3>还没有就诊或用药记录</h3>
                <p>点击上方按钮，记录孩子的就医和用药情况。</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="timeline"></div>';
    const timeline = container.querySelector('.timeline');
    
    medicalList.forEach(item => {
        const isVisit = item.type === 'visit';
        const icon = isVisit ? '🏥' : '💊';
        const title = isVisit ? '就诊' : '用药';
        
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <div class="timeline-date">${formatDate(item.date)}</div>
            <div class="timeline-title">${icon} ${title}：${item.title}</div>
            <div class="timeline-content">
                ${item.hospital ? `<p>医院/机构：${item.hospital}</p>` : ''}
                ${item.doctor ? `<p>医生：${item.doctor}</p>` : ''}
                ${item.symptoms ? `<p>症状：${item.symptoms}</p>` : ''}
                ${item.diagnosis ? `<p>诊断：${item.diagnosis}</p>` : ''}
                ${item.medicine ? `<p>药品：${item.medicine}</p>` : ''}
                ${item.dosage ? `<p>剂量：${item.dosage}</p>` : ''}
                ${item.notes ? `<p>备注：${item.notes}</p>` : ''}
            </div>
            <div style="margin-top: 10px;">
                <button class="btn btn-small btn-secondary" onclick="editMedicalRecord(${item.id})">编辑</button>
                <button class="btn btn-small btn-danger" onclick="deleteMedicalRecord(${item.id})">删除</button>
            </div>
        `;
        timeline.appendChild(timelineItem);
    });
}

/**
 * 显示添加就诊/用药记录表单
 * @param {string} type - 记录类型：visit（就诊）/ medication（用药）
 * @param {Object} defaultData - 默认数据（编辑时使用）
 */
function showAddMedicalForm(type = 'visit', defaultData = null) {
    if (!checkChildSelected()) return;
    
    const isVisit = type === 'visit';
    const title = defaultData ? '编辑记录' : (isVisit ? '记录就诊' : '记录用药');
    
    showModal(title, `
        <form id="medicalForm" onsubmit="handleMedicalSubmit(event)">
            <input type="hidden" id="medicalRecordId" value="${defaultData ? defaultData.id : ''}">
            <input type="hidden" id="medicalType" value="${type}">
            
            <div class="form-row">
                <div class="form-group">
                    <label>日期 <span style="color: red;">*</span></label>
                    <input type="date" id="medicalDate" required>
                </div>
                <div class="form-group">
                    <label>${isVisit ? '就诊原因' : '用药原因'} <span style="color: red;">*</span></label>
                    <input type="text" id="medicalTitle" required placeholder="例如：感冒发烧" maxlength="50">
                </div>
            </div>
            
            ${isVisit ? `
            <div class="form-row">
                <div class="form-group">
                    <label>医院/机构</label>
                    <input type="text" id="medicalHospital" placeholder="例如：儿童医院" maxlength="50">
                </div>
                <div class="form-group">
                    <label>医生</label>
                    <input type="text" id="medicalDoctor" placeholder="例如：张医生" maxlength="20">
                </div>
            </div>
            <div class="form-group">
                <label>症状</label>
                <textarea id="medicalSymptoms" placeholder="例如：发热、咳嗽" maxlength="200"></textarea>
            </div>
            <div class="form-group">
                <label>诊断结果</label>
                <textarea id="medicalDiagnosis" placeholder="例如：上呼吸道感染" maxlength="200"></textarea>
            </div>
            ` : `
            <div class="form-row">
                <div class="form-group">
                    <label>药品名称</label>
                    <input type="text" id="medicalMedicine" placeholder="例如：布洛芬混悬液" maxlength="50">
                </div>
                <div class="form-group">
                    <label>剂量/用法</label>
                    <input type="text" id="medicalDosage" placeholder="例如：每次5ml，每日3次" maxlength="50">
                </div>
            </div>
            `}
            
            <div class="form-group">
                <label>备注</label>
                <textarea id="medicalNotes" placeholder="其他需要记录的信息" maxlength="500"></textarea>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `);
    
    // 设置默认值
    const dateInput = document.getElementById('medicalDate');
    dateInput.value = defaultData ? defaultData.date : new Date().toISOString().split('T')[0];
    dateInput.max = new Date().toISOString().split('T')[0];
    
    if (defaultData) {
        document.getElementById('medicalTitle').value = defaultData.title || '';
        document.getElementById('medicalNotes').value = defaultData.notes || '';
        
        if (isVisit) {
            document.getElementById('medicalHospital').value = defaultData.hospital || '';
            document.getElementById('medicalDoctor').value = defaultData.doctor || '';
            document.getElementById('medicalSymptoms').value = defaultData.symptoms || '';
            document.getElementById('medicalDiagnosis').value = defaultData.diagnosis || '';
        } else {
            document.getElementById('medicalMedicine').value = defaultData.medicine || '';
            document.getElementById('medicalDosage').value = defaultData.dosage || '';
        }
    }
}

/**
 * 编辑就诊用药记录
 * @param {number} recordId - 记录ID
 */
async function editMedicalRecord(recordId) {
    try {
        const record = await getDataById('medical', recordId);
        if (!record) {
            showToast('未找到记录', 'error');
            return;
        }
        
        showAddMedicalForm(record.type, record);
    } catch (error) {
        console.error('加载就诊用药记录失败:', error);
        showToast('加载记录失败', 'error');
    }
}

/**
 * 处理就诊用药表单提交
 * @param {Event} event - 表单事件
 */
async function handleMedicalSubmit(event) {
    event.preventDefault();
    
    const recordId = document.getElementById('medicalRecordId').value;
    const type = document.getElementById('medicalType').value;
    const date = document.getElementById('medicalDate').value;
    const title = document.getElementById('medicalTitle').value.trim();
    const notes = document.getElementById('medicalNotes').value.trim();
    
    // 校验
    if (!date) {
        showToast('请选择日期', 'warning');
        return;
    }
    if (!title) {
        showToast('请填写原因', 'warning');
        return;
    }
    
    const medicalData = {
        childId: AppState.currentChildId,
        type,
        date,
        title,
        notes
    };
    
    // 根据类型补充字段
    if (type === 'visit') {
        medicalData.hospital = document.getElementById('medicalHospital').value.trim();
        medicalData.doctor = document.getElementById('medicalDoctor').value.trim();
        medicalData.symptoms = document.getElementById('medicalSymptoms').value.trim();
        medicalData.diagnosis = document.getElementById('medicalDiagnosis').value.trim();
    } else {
        medicalData.medicine = document.getElementById('medicalMedicine').value.trim();
        medicalData.dosage = document.getElementById('medicalDosage').value.trim();
    }
    
    try {
        if (recordId) {
            medicalData.id = parseInt(recordId);
            await updateData('medical', medicalData);
            showToast('记录更新成功', 'success');
        } else {
            await addData('medical', medicalData);
            showToast('记录保存成功', 'success');
        }
        
        closeModal();
        loadMedicalData();
    } catch (error) {
        console.error('保存就诊用药记录失败:', error);
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * 删除就诊用药记录
 * @param {number} recordId - 记录ID
 */
async function deleteMedicalRecord(recordId) {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    try {
        await deleteData('medical', recordId);
        showToast('记录已删除', 'success');
        loadMedicalData();
    } catch (error) {
        console.error('删除就诊用药记录失败:', error);
        showToast('删除失败，请重试', 'error');
    }
}

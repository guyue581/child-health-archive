/**
 * 童心健康档案 - 疫苗管理模块
 * 负责疫苗记录管理、接种提醒、国家免疫规划疫苗表
 */

// 国家免疫规划疫苗表（一类疫苗）
// doseMonth: 建议接种月龄（从出生开始算）
const VACCINE_SCHEDULE = [
    { name: '乙肝疫苗第1剂', doseMonth: 0, disease: '乙型肝炎', dose: 1 },
    { name: '卡介苗', doseMonth: 0, disease: '结核病', dose: 1 },
    { name: '乙肝疫苗第2剂', doseMonth: 1, disease: '乙型肝炎', dose: 2 },
    { name: '脊髓灰质炎疫苗第1剂', doseMonth: 2, disease: '脊髓灰质炎', dose: 1 },
    { name: '百白破疫苗第1剂', doseMonth: 3, disease: '百日咳、白喉、破伤风', dose: 1 },
    { name: '脊髓灰质炎疫苗第2剂', doseMonth: 4, disease: '脊髓灰质炎', dose: 2 },
    { name: '百白破疫苗第2剂', doseMonth: 5, disease: '百日咳、白喉、破伤风', dose: 2 },
    { name: '乙肝疫苗第3剂', doseMonth: 6, disease: '乙型肝炎', dose: 3 },
    { name: 'A群流脑多糖疫苗第1剂', doseMonth: 6, disease: 'A群流行性脑脊髓膜炎', dose: 1 },
    { name: '脊髓灰质炎疫苗第3剂', doseMonth: 8, disease: '脊髓灰质炎', dose: 3 },
    { name: '百白破疫苗第3剂', doseMonth: 9, disease: '百日咳、白喉、破伤风', dose: 3 },
    { name: '麻腮风疫苗第1剂', doseMonth: 8, disease: '麻疹、腮腺炎、风疹', dose: 1 },
    { name: '乙脑减毒活疫苗第1剂', doseMonth: 8, disease: '流行性乙型脑炎', dose: 1 },
    { name: 'A群流脑多糖疫苗第2剂', doseMonth: 9, disease: 'A群流行性脑脊髓膜炎', dose: 2 },
    { name: '水痘疫苗', doseMonth: 12, disease: '水痘', dose: 1 },
    { name: '甲肝灭活疫苗第1剂', doseMonth: 18, disease: '甲型肝炎', dose: 1 },
    { name: '百白破疫苗第4剂', doseMonth: 18, disease: '百日咳、白喉、破伤风', dose: 4 },
    { name: '麻腮风疫苗第2剂', doseMonth: 18, disease: '麻疹、腮腺炎、风疹', dose: 2 },
    { name: '甲肝灭活疫苗第2剂', doseMonth: 24, disease: '甲型肝炎', dose: 2 },
    { name: '乙脑减毒活疫苗第2剂', doseMonth: 24, disease: '流行性乙型脑炎', dose: 2 },
    { name: 'A群C群流脑多糖疫苗第1剂', doseMonth: 36, disease: 'A群、C群流行性脑脊髓膜炎', dose: 1 },
    { name: '脊髓灰质炎疫苗第4剂', doseMonth: 48, disease: '脊髓灰质炎', dose: 4 },
    { name: 'A群C群流脑多糖疫苗第2剂', doseMonth: 72, disease: 'A群、C群流行性脑脊髓膜炎', dose: 2 },
    { name: '白破疫苗', doseMonth: 72, disease: '白喉、破伤风', dose: 1 }
];

/**
 * 渲染疫苗管理页面
 */
function renderVaccinePage() {
    const container = document.getElementById('vaccineContainer');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header-with-actions">
                <h3>疫苗接种计划</h3>
                <button class="btn btn-primary" onclick="showAddVaccineForm()">+ 记录接种</button>
            </div>
            <div id="vaccineAlert"></div>
            <div id="vaccineList"></div>
        </div>
    `;
    
    if (!checkChildSelected()) {
        document.getElementById('vaccineList').innerHTML = `
            <div class="empty-state">
                <div class="icon">💉</div>
                <h3>请先选择孩子</h3>
                <p>选择孩子后，可以查看疫苗接种计划。</p>
            </div>
        `;
        return;
    }
    
    loadVaccineData();
}

/**
 * 加载疫苗数据
 */
async function loadVaccineData() {
    try {
        const vaccineRecords = await getDataByChildId('vaccines', AppState.currentChildId);
        const child = getCurrentChild();
        
        if (!child) return;
        
        const ageMonths = calculateAgeMonths(child.birthday);
        const vaccinePlan = generateVaccinePlan(child.birthday, vaccineRecords, ageMonths);
        
        renderVaccineAlert(vaccinePlan);
        renderVaccineList(vaccinePlan);
    } catch (error) {
        console.error('加载疫苗数据失败:', error);
        showToast('加载疫苗数据失败', 'error');
    }
}

/**
 * 生成疫苗计划（合并标准表和实际记录）
 * @param {string} birthday - 生日
 * @param {Array} records - 已接种记录
 * @param {number} ageMonths - 当前月龄
 * @returns {Array}
 */
function generateVaccinePlan(birthday, records, ageMonths) {
    return VACCINE_SCHEDULE.map(vaccine => {
        // 查找是否已接种
        const record = records.find(r => r.vaccineName === vaccine.name);
        
        // 计算建议接种日期
        const plannedDate = new Date(birthday);
        plannedDate.setMonth(plannedDate.getMonth() + vaccine.doseMonth);
        
        // 计算距离建议日期还有多少天
        const daysDiff = Math.floor((plannedDate - new Date()) / (1000 * 60 * 60 * 24));
        
        let status = 'pending';
        let statusText = '待接种';
        
        if (record && record.completed) {
            status = 'completed';
            statusText = '已接种';
        } else if (ageMonths > vaccine.doseMonth && daysDiff < -30) {
            status = 'overdue';
            statusText = '已逾期';
        } else if (daysDiff <= 30 && daysDiff >= -7) {
            status = 'pending';
            statusText = '即将接种';
        }
        
        return {
            ...vaccine,
            plannedDate: plannedDate.toISOString().split('T')[0],
            plannedDateText: formatDate(plannedDate.toISOString().split('T')[0]),
            daysDiff,
            status,
            statusText,
            record: record || null
        };
    });
}

/**
 * 渲染疫苗提醒
 * @param {Array} vaccinePlan - 疫苗计划
 */
function renderVaccineAlert(vaccinePlan) {
    const alertContainer = document.getElementById('vaccineAlert');
    
    const overdueCount = vaccinePlan.filter(v => v.status === 'overdue').length;
    const upcomingCount = vaccinePlan.filter(v => v.status === 'pending' && v.daysDiff <= 30 && v.daysDiff >= -7).length;
    
    if (overdueCount === 0 && upcomingCount === 0) {
        alertContainer.innerHTML = '';
        return;
    }
    
    let alertHtml = '';
    if (overdueCount > 0) {
        alertHtml += `<div style="background: #fed7d7; color: #742a2a; padding: 12px 16px; border-radius: 8px; margin-bottom: 12px;">⚠️ 有 ${overdueCount} 剂疫苗已逾期，请尽快补种。</div>`;
    }
    if (upcomingCount > 0) {
        alertHtml += `<div style="background: #feebc8; color: #7c2d12; padding: 12px 16px; border-radius: 8px; margin-bottom: 12px;">📅 未来30天内有 ${upcomingCount} 剂疫苗需要接种。</div>`;
    }
    
    alertContainer.innerHTML = alertHtml;
}

/**
 * 渲染疫苗列表
 * @param {Array} vaccinePlan - 疫苗计划
 */
function renderVaccineList(vaccinePlan) {
    const container = document.getElementById('vaccineList');
    
    if (vaccinePlan.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">💉</div>
                <h3>暂无疫苗数据</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div id="vaccineItems"></div>';
    const itemsContainer = container.querySelector('#vaccineItems');
    
    vaccinePlan.forEach(vaccine => {
        const item = document.createElement('div');
        item.className = 'vaccine-item';
        item.innerHTML = `
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${vaccine.name}</div>
                <div style="font-size: 13px; color: var(--text-light);">
                    预防：${vaccine.disease} | 建议月龄：${vaccine.doseMonth}个月 | 建议日期：${vaccine.plannedDateText}
                    ${vaccine.record ? `| 实际接种：${formatDate(vaccine.record.actualDate)}` : ''}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="vaccine-status status-${vaccine.status}">${vaccine.statusText}</span>
                ${vaccine.record ? 
                    `<button class="btn btn-small btn-secondary" onclick="editVaccineRecord(${vaccine.record.id})">编辑</button>` :
                    `<button class="btn btn-small btn-primary" onclick="showAddVaccineForm('${vaccine.name}', '${vaccine.plannedDate}')">记录</button>`
                }
            </div>
        `;
        itemsContainer.appendChild(item);
    });
}

/**
 * 显示添加疫苗记录表单
 * @param {string} defaultName - 默认疫苗名称
 * @param {string} defaultDate - 默认接种日期
 */
function showAddVaccineForm(defaultName = '', defaultDate = '') {
    if (!checkChildSelected()) return;
    
    // 生成疫苗选项
    const vaccineOptions = VACCINE_SCHEDULE.map(v => 
        `<option value="${v.name}" ${v.name === defaultName ? 'selected' : ''}>${v.name}</option>`
    ).join('');
    
    showModal('记录疫苗接种', `
        <form id="vaccineForm" onsubmit="handleVaccineSubmit(event)">
            <input type="hidden" id="vaccineRecordId" value="">
            <div class="form-group">
                <label>疫苗名称 <span style="color: red;">*</span></label>
                <select id="vaccineName" required>
                    <option value="">请选择疫苗</option>
                    ${vaccineOptions}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>实际接种日期 <span style="color: red;">*</span></label>
                    <input type="date" id="vaccineActualDate" required>
                </div>
                <div class="form-group">
                    <label>接种部位</label>
                    <select id="vaccineSite">
                        <option value="">未知</option>
                        <option value="左上臂">左上臂</option>
                        <option value="右上臂">右上臂</option>
                        <option value="左大腿">左大腿</option>
                        <option value="右大腿">右大腿</option>
                        <option value="口服">口服</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>接种机构</label>
                <input type="text" id="vaccineInstitution" placeholder="例如：社区卫生服务中心" maxlength="50">
            </div>
            <div class="form-group">
                <label>备注</label>
                <textarea id="vaccineNotes" placeholder="例如：接种后无不良反应" maxlength="200"></textarea>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `);
    
    // 设置默认值
    const actualDateInput = document.getElementById('vaccineActualDate');
    actualDateInput.value = defaultDate || new Date().toISOString().split('T')[0];
    actualDateInput.max = new Date().toISOString().split('T')[0];
}

/**
 * 编辑疫苗记录
 * @param {number} recordId - 记录ID
 */
async function editVaccineRecord(recordId) {
    try {
        const record = await getDataById('vaccines', recordId);
        if (!record) {
            showToast('未找到疫苗记录', 'error');
            return;
        }
        
        showAddVaccineForm(record.vaccineName, record.actualDate);
        document.getElementById('vaccineRecordId').value = record.id;
        document.getElementById('vaccineSite').value = record.site || '';
        document.getElementById('vaccineInstitution').value = record.institution || '';
        document.getElementById('vaccineNotes').value = record.notes || '';
        document.getElementById('modalTitle').textContent = '编辑疫苗记录';
    } catch (error) {
        console.error('加载疫苗记录失败:', error);
        showToast('加载疫苗记录失败', 'error');
    }
}

/**
 * 处理疫苗表单提交
 * @param {Event} event - 表单事件
 */
async function handleVaccineSubmit(event) {
    event.preventDefault();
    
    const recordId = document.getElementById('vaccineRecordId').value;
    const vaccineName = document.getElementById('vaccineName').value;
    const actualDate = document.getElementById('vaccineActualDate').value;
    const site = document.getElementById('vaccineSite').value;
    const institution = document.getElementById('vaccineInstitution').value.trim();
    const notes = document.getElementById('vaccineNotes').value.trim();
    
    // 校验
    if (!vaccineName) {
        showToast('请选择疫苗', 'warning');
        return;
    }
    if (!actualDate) {
        showToast('请选择接种日期', 'warning');
        return;
    }
    
    // 查找疫苗信息
    const vaccineInfo = VACCINE_SCHEDULE.find(v => v.name === vaccineName);
    
    const vaccineData = {
        childId: AppState.currentChildId,
        vaccineName,
        actualDate,
        doseMonth: vaccineInfo ? vaccineInfo.doseMonth : null,
        site,
        institution,
        notes,
        completed: true
    };
    
    try {
        if (recordId) {
            vaccineData.id = parseInt(recordId);
            await updateData('vaccines', vaccineData);
            showToast('疫苗记录更新成功', 'success');
        } else {
            // 检查是否已存在同名记录
            const existingRecords = await getDataByChildId('vaccines', AppState.currentChildId);
            const exists = existingRecords.find(r => r.vaccineName === vaccineName);
            if (exists) {
                if (!confirm('该疫苗已有接种记录，是否覆盖？')) {
                    return;
                }
                vaccineData.id = exists.id;
                await updateData('vaccines', vaccineData);
            } else {
                await addData('vaccines', vaccineData);
            }
            showToast('疫苗记录保存成功', 'success');
        }
        
        closeModal();
        loadVaccineData();
    } catch (error) {
        console.error('保存疫苗记录失败:', error);
        showToast('保存失败，请重试', 'error');
    }
}

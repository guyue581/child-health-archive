/**
 * 童心健康档案 - 健康报告导出模块
 * 负责生成儿童健康报告预览、打印导出PDF、JSON数据备份
 */

// 报告包含模块选项
const REPORT_MODULES = [
    { key: 'profile', label: '儿童档案', default: true },
    { key: 'growth', label: '生长曲线摘要', default: true },
    { key: 'vaccine', label: '疫苗接种情况', default: true },
    { key: 'medical', label: '就诊用药记录', default: true },
    { key: 'reports', label: '检测报告列表', default: true }
];

/**
 * 渲染健康报告页面
 */
function renderExportPage() {
    const container = document.getElementById('exportContainer');

    container.innerHTML = `
        <div class="card export-config-card">
            <div class="card-header-with-actions">
                <h3>生成健康报告</h3>
            </div>
            <p style="color: var(--text-light); margin-bottom: 16px;">选择要包含的内容，生成后可打印为PDF或导出JSON备份。</p>
            
            <div class="form-group">
                <label>报告包含模块</label>
                <div class="module-options" id="moduleOptions"></div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>时间范围</label>
                    <select id="reportTimeRange">
                        <option value="all">全部记录</option>
                        <option value="year">最近一年</option>
                        <option value="6months">最近6个月</option>
                        <option value="3months">最近3个月</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>报告备注（选填）</label>
                    <input type="text" id="reportNotes" placeholder="例如：入园体检用" maxlength="50">
                </div>
            </div>
            
            <div class="export-actions">
                <button class="btn btn-primary" onclick="generateReportPreview()" style="font-size: 15px; padding: 10px 24px;">📋 生成健康报告预览</button>
                <button class="btn btn-secondary" onclick="exportJSON()">📥 导出JSON备份</button>
            </div>
            <div id="reportPreviewActions" class="report-preview-actions" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); gap: 12px;">
                <button class="btn btn-primary" onclick="printReport()">🖨️ 打印/导出PDF</button>
                <button class="btn btn-outline" onclick="clearReportPreview()">清除预览</button>
            </div>
        </div>
        
        <div id="reportPreviewArea"></div>
    `;

    renderModuleOptions();
}

/**
 * 渲染模块选择项
 */
function renderModuleOptions() {
    const container = document.getElementById('moduleOptions');
    if (!container) return;

    container.innerHTML = REPORT_MODULES.map((m, index) => `
        <div class="module-option">
            <input type="checkbox" id="module_${index}" value="${m.key}" ${m.default ? 'checked' : ''}>
            <label for="module_${index}">${m.label}</label>
        </div>
    `).join('');
}

/**
 * 获取用户选中的模块
 * @returns {Array}
 */
function getSelectedModules() {
    const checkboxes = document.querySelectorAll('#moduleOptions input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * 获取时间范围过滤日期
 * @param {string} range - 时间范围
 * @returns {string|null}
 */
function getFilterDate(range) {
    const now = new Date();
    switch (range) {
        case 'year':
            now.setFullYear(now.getFullYear() - 1);
            break;
        case '6months':
            now.setMonth(now.getMonth() - 6);
            break;
        case '3months':
            now.setMonth(now.getMonth() - 3);
            break;
        default:
            return null;
    }
    return now.toISOString().split('T')[0];
}

/**
 * 过滤日期范围内的数据
 * @param {Array} list - 数据列表
 * @param {string|null} minDate - 最早日期
 */
function filterByDateRange(list, minDate) {
    if (!minDate) return list;
    return list.filter(item => item.date >= minDate);
}

/**
 * 生成健康报告预览（不直接打印）
 */
async function generateReportPreview() {
    if (!checkChildSelected()) return;

    const selectedModules = getSelectedModules();
    if (selectedModules.length === 0) {
        showToast('请至少选择一个报告模块', 'warning');
        return;
    }

    try {
        showToast('正在生成报告预览...', 'success');
        const reportData = await buildReportData(selectedModules);
        const html = generateReportHTML(reportData);

        const previewArea = document.getElementById('reportPreviewArea');
        previewArea.innerHTML = html;

        const actionsBar = document.getElementById('reportPreviewActions');
        if (actionsBar) {
            actionsBar.style.display = 'flex';
        }
        
        previewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('生成报告失败:', error);
        showToast('生成报告失败', 'error');
    }
}

/**
 * 打印当前已预览的报告
 */
function printReport() {
    const previewArea = document.getElementById('reportPreviewArea');
    if (!previewArea || !previewArea.querySelector('.report-document')) {
        showToast('请先生成报告预览', 'warning');
        return;
    }
    window.print();
}

/**
 * 清除报告预览
 */
function clearReportPreview() {
    document.getElementById('reportPreviewArea').innerHTML = '';
    const actionsBar = document.getElementById('reportPreviewActions');
    if (actionsBar) {
        actionsBar.style.display = 'none';
    }
}

/**
 * 构建报告数据
 * @param {Array} modules - 选中模块
 * @returns {Object}
 */
async function buildReportData(modules) {
    const child = getCurrentChild();
    const range = document.getElementById('reportTimeRange')?.value || 'all';
    const minDate = getFilterDate(range);
    const notes = document.getElementById('reportNotes')?.value?.trim() || '';

    const data = {
        child,
        generatedAt: new Date().toLocaleString('zh-CN'),
        notes,
        modules
    };

    if (modules.includes('growth')) {
        const growthList = await getDataByChildId('growth', AppState.currentChildId);
        data.growth = filterByDateRange(growthList, minDate).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    if (modules.includes('vaccine')) {
        const vaccineRecords = await getDataByChildId('vaccines', AppState.currentChildId);
        const ageMonths = calculateAgeMonths(child.birthday);
        const plan = generateVaccinePlan(child.birthday, vaccineRecords, ageMonths);
        data.vaccinePlan = plan;
        data.vaccineCompleted = plan.filter(v => v.status === 'completed').length;
        data.vaccinePending = plan.filter(v => v.status === 'pending' || v.status === 'overdue').length;
        data.vaccineOverdue = plan.filter(v => v.status === 'overdue').length;
    }

    if (modules.includes('medical')) {
        const medicalList = await getDataByChildId('medical', AppState.currentChildId);
        data.medical = filterByDateRange(medicalList, minDate).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (modules.includes('reports')) {
        const reportList = await getDataByChildId('reports', AppState.currentChildId);
        data.reports = filterByDateRange(reportList, minDate).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return data;
}

/**
 * 生成报告HTML
 * @param {Object} data - 报告数据
 * @returns {string}
 */
function generateReportHTML(data) {
    const child = data.child;
    const ageMonths = calculateAgeMonths(child.birthday);
    const ageText = ageMonths < 12 ? `${ageMonths}个月` : `${Math.floor(ageMonths / 12)}岁${ageMonths % 12}个月`;

    let html = `
        <div class="report-document" id="printableReport">
            <div class="report-header">
                <h1>童心健康档案报告</h1>
                <p>生成时间：${data.generatedAt}</p>
            </div>
            
            <div class="report-section">
                <h2>一、儿童基本信息</h2>
                <div class="report-info-grid">
                    <div><span>姓名：</span>${child.name}</div>
                    <div><span>性别：</span>${child.gender === 'male' ? '男' : child.gender === 'female' ? '女' : '未知'}</div>
                    <div><span>出生日期：</span>${formatDate(child.birthday)}</div>
                    <div><span>当前年龄：</span>${ageText}</div>
                    ${child.bloodType ? `<div><span>血型：</span>${child.bloodType}</div>` : ''}
                    ${child.allergies ? `<div><span>过敏史：</span>${child.allergies}</div>` : ''}
                    ${child.medicalHistory ? `<div><span>既往病史：</span>${child.medicalHistory}</div>` : ''}
                </div>
                ${child.notes ? `<p class="report-notes"><span>备注：</span>${child.notes}</p>` : ''}
                ${data.notes ? `<p class="report-notes"><span>报告用途：</span>${data.notes}</p>` : ''}
            </div>
    `;

    if (data.modules.includes('growth') && data.growth) {
        html += generateGrowthSection(data.growth);
    }

    if (data.modules.includes('vaccine') && data.vaccinePlan) {
        html += generateVaccineSection(data);
    }

    if (data.modules.includes('medical') && data.medical) {
        html += generateMedicalSection(data.medical);
    }

    if (data.modules.includes('reports') && data.reports) {
        html += generateReportsSection(data.reports);
    }

    html += `
            <div class="report-footer">
                <p>本报告由「童心健康档案」生成，数据仅存储于本地浏览器。</p>
                <p>报告仅供参考，具体诊疗建议请咨询专业医生。</p>
            </div>
        </div>
    `;

    return html;
}

/**
 * 生成生长数据章节
 * @param {Array} growthList - 生长数据
 */
function generateGrowthSection(growthList) {
    if (growthList.length === 0) {
        return `
            <div class="report-section">
                <h2>二、生长曲线摘要</h2>
                <p class="report-empty">暂无生长记录</p>
            </div>
        `;
    }

    const latest = growthList[growthList.length - 1];
    const first = growthList[0];
    const heightDiff = latest.height - first.height;
    const weightDiff = latest.weight - first.weight;

    let rows = growthList.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>${item.height} cm</td>
            <td>${item.weight} kg</td>
            ${item.headCircumference ? `<td>${item.headCircumference} cm</td>` : '<td>-</td>'}
        </tr>
    `).join('');

    const rangeText = growthList.length > 1
        ? `（${formatDate(first.date)} 至 ${formatDate(latest.date)}，身高增长 ${heightDiff.toFixed(1)} cm，体重增长 ${weightDiff.toFixed(1)} kg）`
        : '';

    return `
        <div class="report-section">
            <h2>二、生长曲线摘要</h2>
            <p class="report-summary">共记录 ${growthList.length} 次生长数据。最新身高 ${latest.height} cm，体重 ${latest.weight} kg。${rangeText}</p>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>身高</th>
                        <th>体重</th>
                        <th>头围</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

/**
 * 生成疫苗章节
 * @param {Object} data - 报告数据
 */
function generateVaccineSection(data) {
    const plan = data.vaccinePlan;
    const completedRows = plan.filter(v => v.status === 'completed').map(v => `
        <tr>
            <td>${v.name}</td>
            <td>${v.plannedDateText}</td>
            <td>${v.record ? formatDate(v.record.actualDate) : '-'}</td>
        </tr>
    `).join('');

    const pendingList = plan.filter(v => v.status !== 'completed');
    const pendingRows = pendingList.slice(0, 10).map(v => `
        <tr>
            <td>${v.name}</td>
            <td>${v.plannedDateText}</td>
            <td>${v.statusText}</td>
        </tr>
    `).join('');

    return `
        <div class="report-section">
            <h2>三、疫苗接种情况</h2>
            <p class="report-summary">已完成 ${data.vaccineCompleted} 剂，待接种 ${data.vaccinePending} 剂${data.vaccineOverdue > 0 ? `，其中 ${data.vaccineOverdue} 剂已逾期` : ''}。</p>
            
            <h4>已接种疫苗</h4>
            ${completedRows ? `
                <table class="report-table">
                    <thead><tr><th>疫苗名称</th><th>建议日期</th><th>实际接种日期</th></tr></thead>
                    <tbody>${completedRows}</tbody>
                </table>
            ` : '<p class="report-empty">暂无已接种记录</p>'}
            
            <h4 style="margin-top: 16px;">待接种疫苗（前10项）</h4>
            ${pendingRows ? `
                <table class="report-table">
                    <thead><tr><th>疫苗名称</th><th>建议日期</th><th>状态</th></tr></thead>
                    <tbody>${pendingRows}</tbody>
                </table>
            ` : '<p class="report-empty">暂无待接种项</p>'}
        </div>
    `;
}

/**
 * 生成就诊用药章节
 * @param {Array} medicalList - 就诊记录
 */
function generateMedicalSection(medicalList) {
    if (medicalList.length === 0) {
        return `
            <div class="report-section">
                <h2>四、就诊用药记录</h2>
                <p class="report-empty">暂无就诊用药记录</p>
            </div>
        `;
    }

    const rows = medicalList.slice(0, 20).map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>${item.type === 'visit' ? '就诊' : item.type === 'medication' ? '用药' : '其他'}</td>
            <td>${item.title || item.hospital || '-'}</td>
            <td>${item.symptoms || '-'}</td>
            <td>${item.diagnosis || '-'}</td>
        </tr>
    `).join('');

    return `
        <div class="report-section">
            <h2>四、就诊用药记录</h2>
            <p class="report-summary">共 ${medicalList.length} 条记录，本页显示最近 20 条。</p>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>类型</th>
                        <th>医院/标题</th>
                        <th>症状</th>
                        <th>诊断</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

/**
 * 生成检测报告章节
 * @param {Array} reports - 检测报告
 */
function generateReportsSection(reports) {
    if (reports.length === 0) {
        return `
            <div class="report-section">
                <h2>五、检测报告列表</h2>
                <p class="report-empty">暂无检测报告</p>
            </div>
        `;
    }

    const rows = reports.map(report => {
        const typeLabel = REPORT_TYPES.find(t => t.value === report.reportType)?.label || '其他';
        return `
            <tr>
                <td>${formatDate(report.date)}</td>
                <td>${typeLabel}</td>
                <td>${report.hospital || '-'}</td>
                <td>${report.doctor || '-'}</td>
                <td>${report.summary || '-'}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="report-section">
            <h2>五、检测报告列表</h2>
            <p class="report-summary">共 ${reports.length} 份检测报告。</p>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>类型</th>
                        <th>医院/机构</th>
                        <th>医生</th>
                        <th>摘要</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

/**
 * 导出JSON备份
 */
async function exportJSON() {
    if (!checkChildSelected()) return;

    try {
        const child = getCurrentChild();
        const [growth, vaccines, medical, reports] = await Promise.all([
            getDataByChildId('growth', AppState.currentChildId),
            getDataByChildId('vaccines', AppState.currentChildId),
            getDataByChildId('medical', AppState.currentChildId),
            getDataByChildId('reports', AppState.currentChildId)
        ]);

        const backup = {
            appName: '童心健康档案',
            exportTime: new Date().toISOString(),
            child,
            growth,
            vaccines,
            medical,
            reports
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `童心健康档案_${child.name}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('JSON备份已导出', 'success');
    } catch (error) {
        console.error('导出JSON失败:', error);
        showToast('导出失败，请重试', 'error');
    }
}

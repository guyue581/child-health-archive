/**
 * 童心健康档案 - 检测报告模块
 * 负责检测报告的上传、归档、本地预览
 */

// 报告类型选项
const REPORT_TYPES = [
    { value: 'blood', label: '血常规' },
    { value: 'urine', label: '尿常规' },
    { value: 'stool', label: '便常规' },
    { value: 'liver', label: '肝功能' },
    { value: 'kidney', label: '肾功能' },
    { value: 'xray', label: 'X光/DR' },
    { value: 'ct', label: 'CT' },
    { value: 'ultrasound', label: 'B超' },
    { value: 'ecg', label: '心电图' },
    { value: 'vision', label: '视力检查' },
    { value: 'hearing', label: '听力检查' },
    { value: 'dental', label: '口腔检查' },
    { value: 'physical', label: '体格检查' },
    { value: 'other', label: '其他' }
];

/**
 * 渲染检测报告页面
 */
function renderReportsPage() {
    const container = document.getElementById('reportsContainer');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header-with-actions">
                <h3>检测报告库</h3>
                <button class="btn btn-primary" onclick="showAddReportForm()">+ 上传报告</button>
            </div>
            <div id="reportsList"></div>
        </div>
    `;
    
    if (!checkChildSelected()) {
        document.getElementById('reportsList').innerHTML = `
            <div class="empty-state">
                <div class="icon">📄</div>
                <h3>请先选择孩子</h3>
                <p>选择孩子后，可以上传和管理检测报告。</p>
            </div>
        `;
        return;
    }
    
    loadReportsData();
}

/**
 * 加载检测报告数据
 */
async function loadReportsData() {
    try {
        const reports = await getDataByChildId('reports', AppState.currentChildId);
        // 按日期倒序排列
        reports.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderReportsList(reports);
    } catch (error) {
        console.error('加载检测报告失败:', error);
        showToast('加载检测报告失败', 'error');
    }
}

/**
 * 渲染检测报告列表
 * @param {Array} reports - 检测报告列表
 */
function renderReportsList(reports) {
    const container = document.getElementById('reportsList');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <h3>还没有检测报告</h3>
                <p>点击右上角按钮，上传孩子的检测报告照片或PDF。</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="list"></div>';
    const list = container.querySelector('.list');
    
    reports.forEach(report => {
        const typeLabel = REPORT_TYPES.find(t => t.value === report.reportType)?.label || '其他';
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.style.alignItems = 'flex-start';
        item.innerHTML = `
            <div class="list-item-info" style="flex: 1;">
                <h4>${typeLabel} <span style="font-weight: normal; color: #999; font-size: 14px;">${formatDate(report.date)}</span></h4>
                <p>医院/机构：${report.hospital || '未填写'}</p>
                ${report.doctor ? `<p>医生：${report.doctor}</p>` : ''}
                ${report.summary ? `<p style="margin-top: 4px;">摘要：${report.summary}</p>` : ''}
                ${report.fileData ? `<p style="margin-top: 8px;"><button class="btn btn-small btn-secondary" onclick="previewReport(${report.id})">查看附件</button></p>` : ''}
            </div>
            <div class="list-item-actions">
                <button class="btn btn-small btn-secondary" onclick="editReport(${report.id})">编辑</button>
                <button class="btn btn-small btn-danger" onclick="deleteReportRecord(${report.id})">删除</button>
            </div>
        `;
        list.appendChild(item);
    });
}

/**
 * 显示添加报告表单
 * @param {Object} defaultData - 默认数据
 */
function showAddReportForm(defaultData = null) {
    if (!checkChildSelected()) return;
    
    const typeOptions = REPORT_TYPES.map(t => 
        `<option value="${t.value}" ${defaultData && defaultData.reportType === t.value ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    
    showModal(defaultData ? '编辑检测报告' : '上传检测报告', `
        <form id="reportForm" onsubmit="handleReportSubmit(event)">
            <input type="hidden" id="reportId" value="${defaultData ? defaultData.id : ''}">
            <div class="form-row">
                <div class="form-group">
                    <label>报告类型 <span style="color: red;">*</span></label>
                    <select id="reportType" required>
                        <option value="">请选择报告类型</option>
                        ${typeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>检查日期 <span style="color: red;">*</span></label>
                    <input type="date" id="reportDate" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>医院/机构</label>
                    <input type="text" id="reportHospital" placeholder="例如：儿童医院" maxlength="50">
                </div>
                <div class="form-group">
                    <label>医生</label>
                    <input type="text" id="reportDoctor" placeholder="例如：张医生" maxlength="20">
                </div>
            </div>
            <div class="form-group">
                <label>报告摘要/关键指标</label>
                <textarea id="reportSummary" placeholder="填写关键指标或结论，例如：白细胞 8.2，血红蛋白 125，各项正常" maxlength="500" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label>上传报告图片/PDF</label>
                <input type="file" id="reportFile" accept="image/*,.pdf" onchange="previewReportImage(this)">
                <p style="font-size: 12px; color: #999; margin-top: 4px;">支持 JPG、PNG、PDF，上传后可即时预览</p>
                <div id="reportPreview" style="margin-top: 8px;">
                    ${defaultData && defaultData.fileData && defaultData.fileType && defaultData.fileType.startsWith('image/') 
                        ? `<img src="${defaultData.fileData}" style="max-width: 100%; max-height: 300px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: zoom-in;" onclick="openImageViewer('${defaultData.fileData}')">` 
                        : ''}
                </div>
            </div>
            <div class="form-group">
                <label>备注</label>
                <textarea id="reportNotes" placeholder="其他需要记录的信息" maxlength="300"></textarea>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `);
    
    // 设置默认值
    const dateInput = document.getElementById('reportDate');
    dateInput.value = defaultData ? defaultData.date : new Date().toISOString().split('T')[0];
    dateInput.max = new Date().toISOString().split('T')[0];
    
    if (defaultData) {
        document.getElementById('reportHospital').value = defaultData.hospital || '';
        document.getElementById('reportDoctor').value = defaultData.doctor || '';
        document.getElementById('reportSummary').value = defaultData.summary || '';
        document.getElementById('reportNotes').value = defaultData.notes || '';
    }
}

/**
 * 上传图片后即时预览
 * @param {HTMLInputElement} input - 文件选择框
 */
function previewReportImage(input) {
    const preview = document.getElementById('reportPreview');
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target.result;
                preview.innerHTML = `<img src="${dataUrl}" style="max-width: 100%; max-height: 300px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: zoom-in; object-fit: contain;" onclick="openImageViewer('${dataUrl}')">`;
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            preview.innerHTML = '<p style="font-size: 13px; color: #667eea; padding: 8px 0;">📄 PDF文件已选择，保存后可下载查看</p>';
        }
    } else {
        preview.innerHTML = '';
    }
}

/**
 * 编辑检测报告
 * @param {number} reportId - 报告ID
 */
async function editReport(reportId) {
    try {
        const report = await getDataById('reports', reportId);
        if (!report) {
            showToast('未找到报告', 'error');
            return;
        }
        
        showAddReportForm(report);
    } catch (error) {
        console.error('加载检测报告失败:', error);
        showToast('加载报告失败', 'error');
    }
}

/**
 * 处理报告表单提交
 * @param {Event} event - 表单事件
 */
async function handleReportSubmit(event) {
    event.preventDefault();
    
    const reportId = document.getElementById('reportId').value;
    const reportType = document.getElementById('reportType').value;
    const date = document.getElementById('reportDate').value;
    const hospital = document.getElementById('reportHospital').value.trim();
    const doctor = document.getElementById('reportDoctor').value.trim();
    const summary = document.getElementById('reportSummary').value.trim();
    const notes = document.getElementById('reportNotes').value.trim();
    const fileInput = document.getElementById('reportFile');
    
    // 校验
    if (!reportType) {
        showToast('请选择报告类型', 'warning');
        return;
    }
    if (!date) {
        showToast('请选择检查日期', 'warning');
        return;
    }
    
    try {
        const reportData = {
            childId: AppState.currentChildId,
            reportType,
            date,
            hospital,
            doctor,
            summary,
            notes
        };
        
        // 如果有旧记录且没上传新文件，保留旧文件
        let oldFileData = null;
        let oldFileType = null;
        if (reportId) {
            const oldReport = await getDataById('reports', parseInt(reportId));
            if (oldReport) {
                oldFileData = oldReport.fileData;
                oldFileType = oldReport.fileType;
            }
        }
        
        // 处理文件上传
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // 限制文件大小 10MB
            if (file.size > 10 * 1024 * 1024) {
                showToast('文件大小不能超过10MB', 'warning');
                return;
            }
            
            const base64 = await fileToBase64(file);
            reportData.fileData = base64;
            reportData.fileName = file.name;
            reportData.fileType = file.type;
            reportData.fileSize = file.size;
        } else if (oldFileData) {
            reportData.fileData = oldFileData;
            reportData.fileType = oldFileType;
        }
        
        if (reportId) {
            reportData.id = parseInt(reportId);
            await updateData('reports', reportData);
            showToast('报告更新成功', 'success');
        } else {
            await addData('reports', reportData);
            showToast('报告上传成功', 'success');
        }
        
        closeModal();
        loadReportsData();
    } catch (error) {
        console.error('保存检测报告失败:', error);
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * 文件转Base64
 * @param {File} file - 文件对象
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.onerror = function(event) {
            reject(event.target.error);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * 预览报告附件
 * @param {number} reportId - 报告ID
 */
// 当前预览的报告数据
let _currentPreviewFile = null;

async function previewReport(reportId) {
    try {
        const report = await getDataById('reports', reportId);
        if (!report || !report.fileData) {
            showToast('报告附件不存在', 'error');
            return;
        }
        
        _currentPreviewFile = { src: report.fileData, name: report.fileName, type: report.fileType };
        
        let previewHtml = '';
        if (report.fileType && report.fileType.startsWith('image/')) {
            previewHtml = `<img id="previewImg" src="${report.fileData}" class="report-preview-img" alt="报告图片" title="点击放大查看" style="cursor: zoom-in;">`;
        } else if (report.fileType === 'application/pdf') {
            previewHtml = `<embed src="${report.fileData}" type="application/pdf" width="100%" height="500px">`;
        } else {
            previewHtml = `<p>不支持预览此格式，请下载查看。</p>`;
        }
        
        showModal(report.fileName || '报告预览', `
            <div>${previewHtml}</div>
            <div style="margin-top: 16px; text-align: center; display: flex; gap: 12px; justify-content: center;">
                ${report.fileType && report.fileType.startsWith('image/') ? `<button class="btn btn-secondary" onclick="zoomCurrentImage()">🔍 放大查看</button>` : ''}
                <a href="${report.fileData}" download="${report.fileName}" class="btn btn-primary" style="text-decoration: none; display: inline-block;">📥 下载文件</a>
            </div>
        `);
        
        setTimeout(() => {
            const img = document.getElementById('previewImg');
            if (img) {
                img.addEventListener('click', () => openImageViewer(_currentPreviewFile.src));
            }
        }, 100);
    } catch (error) {
        console.error('预览报告失败:', error);
        showToast('预览失败', 'error');
    }
}

/**
 * 从模态框中放大当前预览图片
 */
function zoomCurrentImage() {
    if (_currentPreviewFile) {
        openImageViewer(_currentPreviewFile.src);
    }
}

/**
 * 打开全屏图片查看器
 * @param {string} src - 图片Base64 URL
 */
function openImageViewer(src) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'image-viewer-overlay';
    overlay.onclick = function() {
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
        document.body.style.overflow = '';
    };
    
    overlay.innerHTML = `
        <button class="image-viewer-close" onclick="this.parentElement.click()">×</button>
        <img src="${src}" alt="报告图片" id="viewerImg" title="点击图片放大/缩小，点击背景关闭">
        <div class="image-viewer-hint">点击图片放大/缩小，滚轮缩放，点击背景关闭</div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        const viewerImg = document.getElementById('viewerImg');
        let scale = 1;
        viewerImg.addEventListener('click', function(e) {
            e.stopPropagation();
            scale = scale === 1 ? 1.8 : 1;
            this.style.transform = `scale(${scale})`;
        });
        overlay.addEventListener('wheel', function(e) {
            e.preventDefault();
            scale += e.deltaY > 0 ? -0.1 : 0.1;
            scale = Math.max(0.5, Math.min(3, scale));
            viewerImg.style.transform = `scale(${scale})`;
        });
    }, 50);
}

/**
 * 删除检测报告
 * @param {number} reportId - 报告ID
 */
async function deleteReportRecord(reportId) {
    if (!confirm('确定要删除这份检测报告吗？')) return;
    
    try {
        await deleteData('reports', reportId);
        showToast('报告已删除', 'success');
        loadReportsData();
    } catch (error) {
        console.error('删除检测报告失败:', error);
        showToast('删除失败，请重试', 'error');
    }
}

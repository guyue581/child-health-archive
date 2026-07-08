/**
 * 童心健康档案 - 生长曲线模块
 * 负责生长数据录入、历史记录展示、WHO标准生长曲线图
 */

// WHO 0-5岁生长标准简化数据（P3, P50, P97百分位）
// 单位为：身高 cm，体重 kg
const WHO_GROWTH_DATA = {
    male: {
        // 月龄: [P3身高, P50身高, P97身高, P3体重, P50体重, P97体重]
        0: [46.3, 49.9, 53.4, 2.5, 3.3, 4.3],
        3: [57.6, 62.0, 66.4, 5.0, 6.4, 8.0],
        6: [63.8, 67.6, 71.5, 6.4, 7.9, 9.6],
        9: [68.5, 72.3, 76.1, 7.4, 9.0, 10.9],
        12: [72.3, 76.1, 79.9, 8.1, 9.9, 11.9],
        18: [78.9, 82.7, 86.5, 9.2, 11.3, 13.5],
        24: [84.1, 87.8, 91.5, 10.1, 12.5, 15.0],
        30: [88.7, 92.4, 96.1, 10.9, 13.5, 16.2],
        36: [92.8, 96.5, 100.2, 11.6, 14.4, 17.3],
        42: [96.4, 100.3, 104.1, 12.2, 15.3, 18.5],
        48: [99.9, 103.9, 107.8, 12.8, 16.1, 19.6],
        54: [103.1, 107.2, 111.2, 13.4, 16.9, 20.7],
        60: [106.2, 110.3, 114.5, 13.9, 17.7, 21.9]
    },
    female: {
        0: [45.6, 49.1, 52.7, 2.4, 3.2, 4.1],
        3: [56.5, 60.6, 64.7, 4.6, 5.8, 7.3],
        6: [62.4, 65.7, 69.1, 5.8, 7.3, 8.9],
        9: [66.9, 70.4, 73.9, 6.8, 8.3, 10.1],
        12: [70.5, 74.0, 77.5, 7.5, 9.2, 11.1],
        18: [77.0, 80.7, 84.4, 8.7, 10.6, 12.8],
        24: [82.5, 86.2, 89.9, 9.6, 11.8, 14.2],
        30: [87.2, 91.0, 94.7, 10.4, 12.8, 15.5],
        36: [91.4, 95.1, 98.9, 11.1, 13.8, 16.8],
        42: [95.2, 99.0, 102.9, 11.8, 14.7, 18.0],
        48: [98.8, 102.7, 106.6, 12.4, 15.6, 19.2],
        54: [102.2, 106.2, 110.1, 13.0, 16.4, 20.3],
        60: [105.3, 109.4, 113.5, 13.5, 17.2, 21.5]
    }
};

// ECharts 图表实例
let heightChart = null;
let weightChart = null;

/**
 * 渲染生长曲线页面
 */
function renderGrowthPage() {
    const container = document.getElementById('growthContainer');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header-with-actions">
                <h3>生长数据记录</h3>
                <button class="btn btn-primary" onclick="showAddGrowthForm()">+ 记录生长数据</button>
            </div>
            <div id="growthList"></div>
        </div>
        
        <div class="card">
            <h3>身高生长曲线</h3>
            <div id="heightChart" style="width: 100%; height: 380px;"></div>
            <div class="percentile-legend" style="padding: 12px 16px; background: #f7fafc; border-radius: 8px; margin-top: 8px; font-size: 13px; color: #666; line-height: 1.8;">
                <strong>📊 图表说明：</strong>
                <strong style="color: #48bb78;">P50</strong>（绿色）= 同龄儿童中位数，代表<strong>平均水平</strong>；
                <span style="color: #cbd5e0;">P3</span> = 第3百分位（<strong>偏矮</strong>参考线，仅3%的孩子低于此线）；
                <span style="color: #cbd5e0;">P97</span> = 第97百分位（<strong>偏高</strong>参考线，仅3%的孩子高于此线）；
                <strong style="color: #667eea;">●</strong> 蓝色点 = 孩子的实际测量值。P3-P97 之间都属于正常范围。
            </div>
        </div>
        
        <div class="card">
            <h3>体重生长曲线</h3>
            <div id="weightChart" style="width: 100%; height: 380px;"></div>
            <div class="percentile-legend" style="padding: 12px 16px; background: #f7fafc; border-radius: 8px; margin-top: 8px; font-size: 13px; color: #666; line-height: 1.8;">
                <strong>📊 图表说明：</strong>
                <strong style="color: #48bb78;">P50</strong>（绿色）= 同龄儿童中位数，代表<strong>平均水平</strong>；
                <span style="color: #cbd5e0;">P3</span> = 第3百分位（<strong>偏轻</strong>参考线）；
                <span style="color: #cbd5e0;">P97</span> = 第97百分位（<strong>偏重</strong>参考线）；
                <strong style="color: #667eea;">●</strong> 蓝色点 = 孩子的实际测量值。P3-P97 之间都属于正常范围。
            </div>
        </div>
    `;
    
    if (!checkChildSelected()) {
        document.getElementById('growthList').innerHTML = `
            <div class="empty-state">
                <div class="icon">📈</div>
                <h3>请先选择孩子</h3>
                <p>选择孩子后，可以记录和查看生长曲线。</p>
            </div>
        `;
        return;
    }
    
    loadGrowthData();
}

/**
 * 加载生长数据
 */
async function loadGrowthData() {
    try {
        const growthList = await getDataByChildId('growth', AppState.currentChildId);
        // 按日期排序
        growthList.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        renderGrowthList(growthList);
        renderGrowthCharts(growthList);
    } catch (error) {
        console.error('加载生长数据失败:', error);
        showToast('加载生长数据失败', 'error');
    }
}

/**
 * 渲染生长数据列表
 * @param {Array} growthList - 生长数据列表
 */
function renderGrowthList(growthList) {
    const container = document.getElementById('growthList');
    
    if (growthList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📏</div>
                <h3>还没有生长记录</h3>
                <p>点击右上角按钮，记录孩子的身高体重。</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="list"></div>';
    const list = container.querySelector('.list');
    
    // 倒序显示，最新的在前面
    [...growthList].reverse().forEach(item => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.innerHTML = `
            <div class="list-item-info">
                <h4>${formatDate(item.date)}</h4>
                <p>身高：${item.height} cm | 体重：${item.weight} kg ${item.headCircumference ? '| 头围：' + item.headCircumference + ' cm' : ''}</p>
                ${item.notes ? `<p style="margin-top: 4px;">备注：${item.notes}</p>` : ''}
            </div>
            <div class="list-item-actions">
                <button class="btn btn-small btn-danger" onclick="deleteGrowthRecord(${item.id})">删除</button>
            </div>
        `;
        list.appendChild(listItem);
    });
}

/**
 * 渲染生长曲线图表
 * @param {Array} growthList - 生长数据列表
 */
function renderGrowthCharts(growthList) {
    const child = getCurrentChild();
    if (!child) return;
    
    const gender = child.gender;
    const whoData = WHO_GROWTH_DATA[gender] || WHO_GROWTH_DATA.male;
    
    // 准备WHO标准曲线数据
    const months = Object.keys(whoData).map(m => parseInt(m)).sort((a, b) => a - b);
    const p3Height = months.map(m => whoData[m][0]);
    const p50Height = months.map(m => whoData[m][1]);
    const p97Height = months.map(m => whoData[m][2]);
    const p3Weight = months.map(m => whoData[m][3]);
    const p50Weight = months.map(m => whoData[m][4]);
    const p97Weight = months.map(m => whoData[m][5]);
    
    // 准备用户数据
    const userHeightData = growthList.map(item => {
        const ageMonths = calculateAgeMonthsAtDate(child.birthday, item.date);
        return [ageMonths, parseFloat(item.height)];
    });
    
    const userWeightData = growthList.map(item => {
        const ageMonths = calculateAgeMonthsAtDate(child.birthday, item.date);
        return [ageMonths, parseFloat(item.weight)];
    });
    
    // 渲染身高图
    renderChart('heightChart', '身高 (cm)', months, [
        { name: 'P3 偏矮参考线', data: p3Height, color: '#cbd5e0', type: 'line' },
        { name: 'P50 平均水平', data: p50Height, color: '#48bb78', type: 'line' },
        { name: 'P97 偏高参考线', data: p97Height, color: '#cbd5e0', type: 'line' },
        { name: '实际身高', data: userHeightData, color: '#667eea', type: 'scatter' }
    ]);
    
    // 渲染体重图
    renderChart('weightChart', '体重 (kg)', months, [
        { name: 'P3 偏轻参考线', data: p3Weight, color: '#cbd5e0', type: 'line' },
        { name: 'P50 平均水平', data: p50Weight, color: '#48bb78', type: 'line' },
        { name: 'P97 偏重参考线', data: p97Weight, color: '#cbd5e0', type: 'line' },
        { name: '实际体重', data: userWeightData, color: '#667eea', type: 'scatter' }
    ]);
}

/**
 * 通用渲染ECharts图表
 * @param {string} containerId - 容器ID
 * @param {string} yAxisName - Y轴名称
 * @param {Array} months - 月龄数组
 * @param {Array} series - 数据系列
 */
function renderChart(containerId, yAxisName, months, series) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 检查ECharts是否加载成功
    if (typeof echarts === 'undefined') {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">图表库加载失败，请检查网络连接。下方表格仍可查看数据。</p>';
        return;
    }

    // 销毁旧实例
    if (containerId === 'heightChart' && heightChart) {
        heightChart.dispose();
    }
    if (containerId === 'weightChart' && weightChart) {
        weightChart.dispose();
    }

    const chart = echarts.init(container);
    
    if (containerId === 'heightChart') heightChart = chart;
    if (containerId === 'weightChart') weightChart = chart;
    
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: series.map(s => s.name),
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            name: '月龄',
            data: months,
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            name: yAxisName
        },
        series: series.map(s => ({
            name: s.name,
            type: s.type,
            data: s.data,
            smooth: true,
            symbolSize: s.type === 'scatter' ? 10 : 4,
            lineStyle: {
                color: s.color,
                width: s.name === 'P50' ? 2 : 1
            },
            itemStyle: {
                color: s.color
            }
        }))
    };
    
    chart.setOption(option);
}

/**
 * 计算指定日期时的月龄
 * @param {string} birthday - 生日
 * @param {string} targetDate - 目标日期
 * @returns {number}
 */
function calculateAgeMonthsAtDate(birthday, targetDate) {
    const birth = new Date(birthday);
    const target = new Date(targetDate);
    
    let months = (target.getFullYear() - birth.getFullYear()) * 12;
    months += target.getMonth() - birth.getMonth();
    
    if (target.getDate() < birth.getDate()) {
        months -= 1;
    }
    
    return Math.max(0, months);
}

/**
 * 显示添加生长数据表单
 */
function showAddGrowthForm() {
    if (!checkChildSelected()) return;
    
    showModal('记录生长数据', `
        <form id="growthForm" onsubmit="handleGrowthSubmit(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>测量日期 <span style="color: red;">*</span></label>
                    <input type="date" id="growthDate" required>
                </div>
                <div class="form-group">
                    <label>身高 (cm) <span style="color: red;">*</span></label>
                    <input type="number" id="growthHeight" required min="30" max="200" step="0.1" placeholder="例如：85.5">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>体重 (kg) <span style="color: red;">*</span></label>
                    <input type="number" id="growthWeight" required min="1" max="100" step="0.1" placeholder="例如：12.5">
                </div>
                <div class="form-group">
                    <label>头围 (cm)</label>
                    <input type="number" id="growthHeadCircumference" min="20" max="60" step="0.1" placeholder="选填">
                </div>
            </div>
            <div class="form-group">
                <label>备注</label>
                <textarea id="growthNotes" placeholder="例如：体检时测量" maxlength="200"></textarea>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `);
    
    // 默认今天
    document.getElementById('growthDate').value = new Date().toISOString().split('T')[0];
    // 限制不能超过今天
    document.getElementById('growthDate').max = new Date().toISOString().split('T')[0];
}

/**
 * 处理生长数据提交
 * @param {Event} event - 表单事件
 */
async function handleGrowthSubmit(event) {
    event.preventDefault();
    
    const date = document.getElementById('growthDate').value;
    const height = parseFloat(document.getElementById('growthHeight').value);
    const weight = parseFloat(document.getElementById('growthWeight').value);
    const headCircumference = document.getElementById('growthHeadCircumference').value;
    const notes = document.getElementById('growthNotes').value.trim();
    
    // 校验
    if (!date) {
        showToast('请选择测量日期', 'warning');
        return;
    }
    if (isNaN(height) || height < 30 || height > 200) {
        showToast('请输入有效的身高（30-200cm）', 'warning');
        return;
    }
    if (isNaN(weight) || weight < 1 || weight > 100) {
        showToast('请输入有效的体重（1-100kg）', 'warning');
        return;
    }
    
    const growthData = {
        childId: AppState.currentChildId,
        date,
        height,
        weight,
        headCircumference: headCircumference ? parseFloat(headCircumference) : null,
        notes
    };
    
    try {
        await addData('growth', growthData);
        showToast('生长数据保存成功', 'success');
        closeModal();
        loadGrowthData();
    } catch (error) {
        console.error('保存生长数据失败:', error);
        showToast('保存失败，请重试', 'error');
    }
}

/**
 * 删除生长记录
 * @param {number} id - 记录ID
 */
async function deleteGrowthRecord(id) {
    if (!confirm('确定要删除这条生长记录吗？')) return;
    
    try {
        await deleteData('growth', id);
        showToast('记录已删除', 'success');
        loadGrowthData();
    } catch (error) {
        console.error('删除生长记录失败:', error);
        showToast('删除失败，请重试', 'error');
    }
}

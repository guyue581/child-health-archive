/**
 * 童心健康档案 - 示例数据模块
 * 提供一键加载示例数据，方便评委和首次用户体验完整功能
 */

// 示例数据标识
const DEMO_CHILD_NAME = '张童童';

/**
 * 加载示例数据
 * 生成一个孩子档案及配套的健康记录
 */
async function loadDemoData() {
    try {
        // 检查是否已存在示例孩子
        const existingChildren = await getAllChildren();
        const existingDemo = existingChildren.find(c => c.name === DEMO_CHILD_NAME);
        
        if (existingDemo) {
            // 如果已存在，直接选中
            setCurrentChild(existingDemo.id);
            showToast('示例数据已存在，已自动选中', 'success');
            renderPage(AppState.currentPage);
            return;
        }

        // 创建示例孩子档案
        const childData = {
            name: DEMO_CHILD_NAME,
            gender: 'female',
            birthday: '2020-05-15',
            bloodType: 'O',
            allergies: '无已知过敏',
            medicalHistory: '2022年患过一次幼儿急疹，已痊愈',
            notes: '示例数据，仅用于体验功能'
        };
        const childId = await addData('children', childData);

        // 并行添加各类示例记录
        await Promise.all([
            addDemoGrowthRecords(childId),
            addDemoVaccineRecords(childId),
            addDemoMedicalRecords(childId),
            addDemoReports(childId)
        ]);

        // 重新加载孩子列表并选中示例孩子
        await loadChildren();
        setCurrentChild(childId);

        showToast('示例数据加载成功', 'success');
        renderPage(AppState.currentPage);
    } catch (error) {
        console.error('加载示例数据失败:', error);
        showToast('加载示例数据失败', 'error');
    }
}

/**
 * 添加示例生长记录
 * @param {number} childId - 孩子ID
 */
async function addDemoGrowthRecords(childId) {
    const records = [
        { date: '2022-05-15', height: 85.5, weight: 11.8, headCircumference: 47.0, notes: '2岁体检' },
        { date: '2023-05-15', height: 95.2, weight: 14.3, headCircumference: 49.0, notes: '3岁体检' },
        { date: '2024-05-15', height: 104.8, weight: 16.5, headCircumference: 50.0, notes: '4岁体检' },
        { date: '2025-05-15', height: 112.3, weight: 18.6, notes: '5岁体检' },
        { date: '2025-12-15', height: 115.8, weight: 19.8, notes: '幼儿园中期体检' },
        { date: '2026-05-15', height: 118.5, weight: 20.8, notes: '6岁体检' }
    ];

    for (const record of records) {
        await addData('growth', { ...record, childId });
    }
}

/**
 * 添加示例疫苗记录
 * @param {number} childId - 孩子ID
 */
async function addDemoVaccineRecords(childId) {
    const records = [
        { vaccineName: '乙肝疫苗第1剂', actualDate: '2020-05-15', site: '右上臂', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '卡介苗', actualDate: '2020-05-15', site: '左上臂', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '乙肝疫苗第2剂', actualDate: '2020-06-15', site: '右上臂', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '脊髓灰质炎疫苗第1剂', actualDate: '2020-07-15', site: '口服', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '百白破疫苗第1剂', actualDate: '2020-08-15', site: '左大腿', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '脊髓灰质炎疫苗第2剂', actualDate: '2020-09-15', site: '口服', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '百白破疫苗第2剂', actualDate: '2020-10-15', site: '右大腿', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '乙肝疫苗第3剂', actualDate: '2020-11-15', site: '右上臂', institution: '社区卫生服务中心', notes: '无不良反应', completed: true },
        { vaccineName: '麻腮风疫苗第1剂', actualDate: '2021-01-15', site: '左上臂', institution: '社区卫生服务中心', notes: '低热1天', completed: true },
        { vaccineName: '乙脑减毒活疫苗第1剂', actualDate: '2021-01-20', site: '右上臂', institution: '社区卫生服务中心', notes: '无不良反应', completed: true }
    ];

    for (const record of records) {
        const vaccineInfo = VACCINE_SCHEDULE.find(v => v.name === record.vaccineName);
        await addData('vaccines', {
            ...record,
            childId,
            doseMonth: vaccineInfo ? vaccineInfo.doseMonth : null
        });
    }
}

/**
 * 添加示例就诊用药记录
 * @param {number} childId - 孩子ID
 */
async function addDemoMedicalRecords(childId) {
    const records = [
        {
            type: 'visit',
            date: '2024-03-10',
            title: '感冒发烧就诊',
            hospital: '市儿童医院',
            doctor: '李医生',
            symptoms: '发热38.5℃，咳嗽，流清涕',
            diagnosis: '急性上呼吸道感染',
            notes: '口服退烧药后体温下降，建议多饮水'
        },
        {
            type: 'medication',
            date: '2024-03-11',
            title: '退烧药用药',
            medicine: '布洛芬混悬液',
            dosage: '每次4ml，体温超过38.5℃时服用',
            notes: '共服用2次，体温恢复正常'
        },
        {
            type: 'visit',
            date: '2025-09-05',
            title: '入园体检',
            hospital: '妇幼保健院',
            doctor: '王医生',
            symptoms: '常规体检，无不适',
            diagnosis: '体格发育正常',
            notes: '视力、听力筛查均正常'
        }
    ];

    for (const record of records) {
        await addData('medical', { ...record, childId });
    }
}

/**
 * 添加示例检测报告
 * @param {number} childId - 孩子ID
 */
async function addDemoReports(childId) {
    const records = [
        {
            reportType: 'blood',
            date: '2024-03-10',
            hospital: '市儿童医院',
            doctor: '李医生',
            summary: '白细胞 8.2×10^9/L，血红蛋白 125g/L，血小板 210×10^9/L，各项指标正常',
            notes: '入园体检血常规'
        },
        {
            reportType: 'physical',
            date: '2025-09-05',
            hospital: '妇幼保健院',
            doctor: '王医生',
            summary: '身高 115cm，体重 20kg，视力 1.0，听力正常',
            notes: '入园体检报告'
        }
    ];

    for (const record of records) {
        await addData('reports', { ...record, childId });
    }
}

/**
 * 清除示例数据
 */
async function clearDemoData() {
    try {
        const children = await getAllChildren();
        const demoChild = children.find(c => c.name === DEMO_CHILD_NAME);
        
        if (!demoChild) {
            showToast('暂无示例数据可清除', 'warning');
            return;
        }

        if (!confirm(`确定要清除 ${DEMO_CHILD_NAME} 的示例数据吗？`)) {
            return;
        }

        // 删除关联数据
        const stores = ['growth', 'vaccines', 'medical', 'reports'];
        for (const storeName of stores) {
            const items = await getDataByChildId(storeName, demoChild.id);
            for (const item of items) {
                await deleteData(storeName, item.id);
            }
        }

        // 删除孩子档案
        await deleteData('children', demoChild.id);

        // 如果当前选中的是示例孩子，清空选择
        if (AppState.currentChildId === demoChild.id) {
            AppState.currentChildId = null;
        }

        await loadChildren();
        setCurrentChild(AppState.currentChildId);
        showToast('示例数据已清除', 'success');
        renderPage(AppState.currentPage);
    } catch (error) {
        console.error('清除示例数据失败:', error);
        showToast('清除示例数据失败', 'error');
    }
}

/**
 * 检查当前是否有示例数据
 * @returns {Promise<boolean>}
 */
async function hasDemoData() {
    const children = await getAllChildren();
    return children.some(c => c.name === DEMO_CHILD_NAME);
}

/**
 * 童心健康档案 - AI健康助手模块
 * 负责对话式健康数据查询、症状分析、科室推荐
 * Demo阶段使用本地规则引擎，不上传数据到外部服务器
 */

// 症状知识库（常见儿童症状 → 可能原因 + 家庭护理建议 + 危险信号）
const SYMPTOM_KNOWLEDGE = {
    '发烧': {
        causes: ['普通感冒', '流感', '幼儿急疹', '扁桃体炎', '尿路感染等'],
        care: ['多喝温水，保持室内通风', '体温超过38.5℃可考虑使用退烧药', '穿着宽松透气的衣物', '保证充足休息'],
        danger: ['3个月以下婴儿发烧', '高烧不退超过3天', '出现抽搐', '精神萎靡、拒绝进食', '呼吸急促或困难']
    },
    '发热': {
        causes: ['普通感冒', '流感', '幼儿急疹', '扁桃体炎', '尿路感染等'],
        care: ['多喝温水，保持室内通风', '体温超过38.5℃可考虑使用退烧药', '穿着宽松透气的衣物', '保证充足休息'],
        danger: ['3个月以下婴儿发烧', '高烧不退超过3天', '出现抽搐', '精神萎靡、拒绝进食', '呼吸急促或困难']
    },
    '咳嗽': {
        causes: ['上呼吸道感染', '支气管炎', '过敏性咳嗽', '哮喘等'],
        care: ['保持空气湿润', '多喝温水', '避免接触烟尘和冷空气刺激', '1岁以上可适量饮用蜂蜜水'],
        danger: ['咳嗽超过2周', '伴有喘息或呼吸困难', '咳血', '口唇发紫']
    },
    '流鼻涕': {
        causes: ['普通感冒', '过敏性鼻炎', '鼻窦炎等'],
        care: ['用生理盐水清洗鼻腔', '保持室内湿度', '多喝温水'],
        danger: ['鼻涕持续超过10天', '鼻涕变黄绿色且伴有高热', '严重鼻塞影响进食和睡眠']
    },
    '腹泻': {
        causes: ['病毒感染（如轮状病毒）', '细菌感染', '饮食不当', '乳糖不耐受等'],
        care: ['少量多次补充口服补液盐或温水', '继续正常饮食，避免油腻和高糖食物', '注意臀部护理'],
        danger: ['腹泻超过3天', '出现脱水症状（尿少、口干、哭无泪）', '大便带血', '持续高热']
    },
    '呕吐': {
        causes: ['胃肠炎', '饮食不当', '肠梗阻（需警惕）', '脑膜炎（需警惕）等'],
        care: ['暂时禁食1-2小时', '之后少量多次喂水', '避免剧烈活动'],
        danger: ['呕吐物带血或胆汁（绿色）', '频繁呕吐无法进食进水', '伴有剧烈腹痛或头痛', '出现脱水症状']
    },
    '皮疹': {
        causes: ['幼儿急疹', '荨麻疹', '湿疹', '手足口病', '水痘等'],
        care: ['避免抓挠', '穿宽松棉质衣物', '保持皮肤清洁干燥'],
        danger: ['皮疹伴有高热', '皮疹迅速扩散', '出现紫癜或瘀斑', '伴有呼吸困难']
    },
    '肚子疼': {
        causes: ['消化不良', '便秘', '肠系膜淋巴结炎', '肠套叠（需警惕）等'],
        care: ['轻柔按摩腹部', '热敷', '避免进食刺激性食物'],
        danger: ['剧烈腹痛', '腹痛伴呕吐且不排气', '腹部僵硬', '右下腹固定压痛']
    },
    '耳朵疼': {
        causes: ['中耳炎', '外耳道炎', '耵聍栓塞等'],
        care: ['避免耳朵进水', '不要自行掏耳'],
        danger: ['伴有高热', '耳朵流脓', '听力明显下降']
    },
    '眼睛红': {
        causes: ['结膜炎', '过敏性结膜炎', '异物刺激等'],
        care: ['注意手部卫生，避免揉眼', '用干净温水清洁眼周'],
        danger: ['视力模糊', '眼睛疼痛剧烈', '大量分泌物', '对光敏感']
    }
};

// 症状 → 推荐科室映射
const SYMPTOM_DEPARTMENT = {
    '发烧': { department: '儿科/儿内科', urgency: '普通门诊', note: '高热或精神差可挂急诊' },
    '发热': { department: '儿科/儿内科', urgency: '普通门诊', note: '高热或精神差可挂急诊' },
    '咳嗽': { department: '儿科/呼吸内科', urgency: '普通门诊', note: '喘息明显可挂急诊' },
    '流鼻涕': { department: '儿科/耳鼻喉科', urgency: '普通门诊', note: '' },
    '腹泻': { department: '儿科/消化内科', urgency: '普通门诊', note: '脱水症状明显可挂急诊' },
    '呕吐': { department: '儿科/消化内科', urgency: '急诊', note: '频繁呕吐建议尽快就诊' },
    '皮疹': { department: '儿科/皮肤科', urgency: '普通门诊', note: '高热伴皮疹可挂急诊' },
    '肚子疼': { department: '儿科/消化内科', urgency: '急诊', note: '剧烈腹痛需排除急腹症' },
    '耳朵疼': { department: '儿科/耳鼻喉科', urgency: '普通门诊', note: '' },
    '眼睛红': { department: '儿科/眼科', urgency: '普通门诊', note: '' },
    '外伤': { department: '儿科/外科/急诊外科', urgency: '急诊', note: '出血不止或骨折需急诊' },
    '骨折': { department: '骨科/急诊外科', urgency: '急诊', note: '尽快就医固定' },
    '抽搐': { department: '儿科/神经内科', urgency: '急诊', note: '立即拨打120或就近急诊' }
};

// 默认科室推荐
const DEFAULT_DEPARTMENT = { department: '儿科/儿内科', urgency: '普通门诊', note: '如症状严重或持续，建议尽早就医' };

// 城市 → 推荐医院（示例数据，实际可扩展）
const HOSPITAL_DATA = {
    '北京': [
        { name: '首都医科大学附属北京儿童医院', type: '儿童专科三甲', address: '西城区南礼士路56号' },
        { name: '北京大学第一医院儿科', type: '三甲综合', address: '西城区西什库大街8号' }
    ],
    '上海': [
        { name: '复旦大学附属儿科医院', type: '儿童专科三甲', address: '闵行区万源路399号' },
        { name: '上海交通大学医学院附属新华医院', type: '三甲综合', address: '杨浦区控江路1665号' }
    ],
    '广州': [
        { name: '广州市妇女儿童医疗中心', type: '儿童专科三甲', address: '天河区金穗路9号' },
        { name: '中山大学附属第一医院儿科', type: '三甲综合', address: '越秀区中山二路58号' }
    ],
    '深圳': [
        { name: '深圳市儿童医院', type: '儿童专科三甲', address: '福田区益田路7019号' },
        { name: '深圳市妇幼保健院', type: '三甲妇幼', address: '福田区红荔路2004号' }
    ],
    '成都': [
        { name: '四川大学华西第二医院', type: '三甲妇幼', address: '武侯区人民南路三段20号' },
        { name: '成都市妇女儿童中心医院', type: '三甲妇幼', address: '青羊区日月大道1617号' }
    ],
    '杭州': [
        { name: '浙江大学医学院附属儿童医院', type: '儿童专科三甲', address: '滨江区滨盛路3333号' }
    ],
    '武汉': [
        { name: '华中科技大学同济医学院附属同济医院儿科', type: '三甲综合', address: '硚口区解放大道1095号' }
    ],
    '西安': [
        { name: '西安市儿童医院', type: '儿童专科三甲', address: '莲湖区西举院巷69号' }
    ]
};

/**
 * 渲染AI健康助手页面
 */
function renderAgentPage() {
    const container = document.getElementById('agentContainer');
    
    container.innerHTML = `
        <div class="card" style="margin-bottom: 16px;">
            <h3>AI健康助手</h3>
            <p style="color: var(--text-light); font-size: 14px;">
                我可以帮你查询孩子的健康记录、分析常见症状、推荐就诊科室。
                <span style="color: var(--danger);">注意：以下建议仅供参考，不能替代医生诊断。</span>
            </p>
        </div>
        
        <div class="chat-container">
            <div class="chat-messages" id="chatMessages">
                <div class="message ai">
                    <div class="message-bubble">
                        你好，我是AI健康助手。请问你想了解孩子的什么健康信息？
                    </div>
                </div>
            </div>
            <div class="quick-questions" id="quickQuestions">
                <span class="quick-question" onclick="sendQuickQuestion('上次感冒/发烧是什么时候？')">上次感冒什么时候</span>
                <span class="quick-question" onclick="sendQuickQuestion('上次血常规什么时候检查的？')">上次血常规</span>
                <span class="quick-question" onclick="sendQuickQuestion('最近半年身高长了多少？')">最近身高变化</span>
                <span class="quick-question" onclick="sendQuickQuestion('还有哪些疫苗没打？')">还差什么疫苗</span>
                <span class="quick-question" onclick="sendQuickQuestion('孩子发烧了怎么办？')">发烧怎么办</span>
                <span class="quick-question" onclick="sendQuickQuestion('推荐附近的儿科医院')">推荐医院</span>
            </div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="输入问题，例如：上次感冒是什么时候？孩子发烧怎么办？" maxlength="200">
                <button class="btn btn-primary" onclick="sendChatMessage()">发送</button>
            </div>
        </div>
    `;
    
    // 绑定回车发送
    const input = document.getElementById('chatInput');
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendChatMessage();
        }
    });
    input.focus();
}

/**
 * 发送快捷问题
 * @param {string} question - 问题文本
 */
function sendQuickQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendChatMessage();
}

/**
 * 发送聊天消息
 */
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const question = input.value.trim();
    
    if (!question) return;
    
    // 添加用户消息
    addChatMessage(question, 'user');
    input.value = '';
    
    // 显示思考中
    const thinkingId = addChatMessage('正在思考中...', 'ai');
    
    try {
        // 分析并生成回复
        const response = await analyzeHealthQuestion(question);
        
        // 替换思考中消息
        updateChatMessage(thinkingId, response);
    } catch (error) {
        console.error('AI助手处理失败:', error);
        updateChatMessage(thinkingId, '抱歉，处理你的问题时出现了错误，请稍后再试。');
    }
}

/**
 * 添加聊天消息
 * @param {string} text - 消息内容
 * @param {string} sender - 发送者：user/ai
 * @returns {string} 消息ID
 */
function addChatMessage(text, sender) {
    const container = document.getElementById('chatMessages');
    const messageId = 'msg-' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.id = messageId;
    messageDiv.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    return messageId;
}

/**
 * 更新聊天消息内容
 * @param {string} messageId - 消息ID
 * @param {string} text - 新内容（支持HTML）
 */
function updateChatMessage(messageId, text) {
    const messageDiv = document.getElementById(messageId);
    if (messageDiv) {
        messageDiv.querySelector('.message-bubble').innerHTML = text;
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    }
}

// 疾病/症状关键词（用于匹配就诊记录查询）
const DISEASE_KEYWORDS = ['感冒', '发烧', '发热', '咳嗽', '流鼻涕', '腹泻', '呕吐', '皮疹', '湿疹', '肚子疼', '腹痛', '耳朵疼', '中耳炎', '眼睛红', '结膜炎', '手足口', '流感', '幼儿急疹', '过敏', '便秘', '积食', '扁桃体炎', '肺炎', '支气管炎', '鼻炎', '外伤', '骨折', '抽搐', '摔'];

// 历史查询触发词
const HISTORY_TRIGGERS = ['上次', '什么时候', '有没有过', '以前', '之前', '上次是', '最近一次', '上次得'];

// 护理建议触发词
const ADVICE_TRIGGERS = ['怎么办', '怎么处理', '如何护理', '怎么护理', '要不要去医院', '要去医院吗', '需要看医生吗', '严重吗', '怎么回事'];

/**
 * 分析健康问题并生成回复
 * @param {string} question - 用户问题
 * @returns {Promise<string>} 回复HTML
 */
async function analyzeHealthQuestion(question) {
    if (!AppState.currentChildId) {
        return '请先选择或添加一个孩子，我才能帮你查询相关健康记录。';
    }
    
    const lowerQuestion = question.toLowerCase();
    const child = getCurrentChild();
    
    // 1. 检测医院推荐（优先级最高的导航类问题）
    if (lowerQuestion.includes('医院') || lowerQuestion.includes('看病') || lowerQuestion.includes('就医')) {
        return recommendHospital(lowerQuestion);
    }
    
    // 2. 检测是否在问某个疾病/症状的就诊历史（如"上次感冒什么时候"）
    const diseaseMatch = DISEASE_KEYWORDS.find(kw => question.includes(kw));
    const isAskingHistory = HISTORY_TRIGGERS.some(t => question.includes(t));
    const isAskingAdvice = ADVICE_TRIGGERS.some(t => question.includes(t));
    
    if (diseaseMatch) {
        // 如果包含历史查询词，优先查就诊记录
        if (isAskingHistory || (question.includes('什么') && question.includes('时候')) || question.includes('记录')) {
            return await queryDiseaseHistory(diseaseMatch);
        }
        // 如果包含护理建议词，给护理建议
        if (isAskingAdvice || lowerQuestion.includes('怎么')) {
            const symptomKey = mapDiseaseToSymptom(diseaseMatch);
            return analyzeSymptom(symptomKey || diseaseMatch);
        }
        // 默认：既查历史记录，也给护理建议
        const historyResult = await queryDiseaseHistory(diseaseMatch);
        const symptomKey = mapDiseaseToSymptom(diseaseMatch);
        const adviceResult = symptomKey && SYMPTOM_KNOWLEDGE[symptomKey] ? analyzeSymptom(symptomKey) : '';
        return historyResult + (adviceResult ? '<br><br>' + adviceResult : '');
    }
    
    // 3. 检测症状分析类问题（不涉及具体疾病名但有症状关键词）
    for (const symptom in SYMPTOM_KNOWLEDGE) {
        if (lowerQuestion.includes(symptom)) {
            return analyzeSymptom(symptom);
        }
    }
    
    // 4. 检测报告查询
    if (lowerQuestion.includes('血常规') || lowerQuestion.includes('尿常规') || lowerQuestion.includes('检查') || lowerQuestion.includes('报告')) {
        return await queryReports(lowerQuestion);
    }
    
    // 5. 生长数据查询
    if (lowerQuestion.includes('身高') || lowerQuestion.includes('体重') || lowerQuestion.includes('长了多少') || lowerQuestion.includes('生长')) {
        return await queryGrowth(lowerQuestion);
    }
    
    // 6. 疫苗查询
    if (lowerQuestion.includes('疫苗') || lowerQuestion.includes('接种')) {
        return await queryVaccines(lowerQuestion);
    }
    
    // 7. 就诊记录查询
    if (lowerQuestion.includes('就诊') || lowerQuestion.includes('看病记录') || lowerQuestion.includes('用药')) {
        return await queryMedical(lowerQuestion);
    }
    
    // 8. 通用健康档案查询
    if (lowerQuestion.includes('档案') || lowerQuestion.includes('信息') || lowerQuestion.includes('怎么样')) {
        return await queryChildProfile();
    }
    
    // 默认回复
    return `抱歉，我暂时无法回答这个问题。你可以尝试问我：<br>
    · 上次感冒/发烧是什么时候？<br>
    · 上次血常规什么时候检查的？<br>
    · 孩子发烧了怎么办？<br>
    · 最近半年身高长了多少？<br>
    · 还有哪些疫苗没打？<br>
    · 推荐附近的儿科医院`;
}

/**
 * 将疾病名映射到症状知识库中的key
 * @param {string} disease - 疾病/症状名
 * @returns {string|null}
 */
function mapDiseaseToSymptom(disease) {
    const map = {
        '发烧': '发烧', '发热': '发热', '感冒': '发烧', '流感': '发烧',
        '咳嗽': '咳嗽', '支气管炎': '咳嗽', '肺炎': '咳嗽',
        '流鼻涕': '流鼻涕', '鼻炎': '流鼻涕',
        '腹泻': '腹泻', '拉肚子': '腹泻',
        '呕吐': '呕吐',
        '皮疹': '皮疹', '湿疹': '皮疹', '幼儿急疹': '皮疹', '手足口': '皮疹',
        '肚子疼': '肚子疼', '腹痛': '肚子疼', '积食': '肚子疼', '便秘': '肚子疼',
        '耳朵疼': '耳朵疼', '中耳炎': '耳朵疼',
        '眼睛红': '眼睛红', '结膜炎': '眼睛红',
        '过敏': '皮疹'
    };
    return map[disease] || null;
}

/**
 * 查询特定疾病的就诊历史
 * @param {string} disease - 疾病/症状关键词
 * @returns {Promise<string>}
 */
async function queryDiseaseHistory(disease) {
    const medicalList = await getDataByChildId('medical', AppState.currentChildId);
    medicalList.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 在就诊记录的title、symptoms、diagnosis、notes中搜索关键词
    const matched = medicalList.filter(m => {
        const text = (m.title || '') + (m.symptoms || '') + (m.diagnosis || '') + (m.notes || '') + (m.medicine || '');
        return text.includes(disease);
    });
    
    if (matched.length === 0) {
        return `<strong>🔍 ${disease}相关记录</strong><br><br>在就诊/用药记录中没有找到与"${disease}"相关的记录。如果之前有相关就诊，你可以到"就诊用药"页面补充记录。`;
    }
    
    const latest = matched[0];
    const typeText = latest.type === 'visit' ? '就诊' : '用药';
    
    let html = `<strong>🔍 ${disease}相关记录</strong><br><br>`;
    html += `最近一次${disease}相关${typeText}：<br>`;
    html += `· 日期：${formatDate(latest.date)}<br>`;
    html += `· ${typeText}原因：${latest.title}<br>`;
    if (latest.hospital) html += `· 医院：${latest.hospital}<br>`;
    if (latest.symptoms) html += `· 症状：${latest.symptoms}<br>`;
    if (latest.diagnosis) html += `· 诊断：${latest.diagnosis}<br>`;
    if (latest.medicine) html += `· 用药：${latest.medicine}<br>`;
    if (latest.dosage) html += `· 用法：${latest.dosage}<br>`;
    if (latest.notes) html += `· 备注：${latest.notes}<br>`;
    
    if (matched.length > 1) {
        html += '<br><strong>历史记录：</strong><br>';
        matched.slice(1, 5).forEach(m => {
            const t = m.type === 'visit' ? '就诊' : '用药';
            html += `· ${formatDate(m.date)} ${t}：${m.title}<br>`;
        });
        if (matched.length > 5) {
            html += `（还有 ${matched.length - 5} 条记录，请在就诊用药页面查看）`;
        }
    }
    
    return html;
}

/**
 * 分析症状
 * @param {string} symptom - 症状关键词
 * @returns {string}
 */
function analyzeSymptom(symptom) {
    const knowledge = SYMPTOM_KNOWLEDGE[symptom];
    if (!knowledge) {
        return '我没有找到这个症状的相关信息，建议咨询专业医生。';
    }
    
    const dept = SYMPTOM_DEPARTMENT[symptom] || DEFAULT_DEPARTMENT;
    
    let html = `<strong>📋 症状分析：${symptom}</strong><br>`;
    html += `可能原因：${knowledge.causes.join('、')}<br><br>`;
    
    html += `<strong>💊 家庭护理建议：</strong><br>`;
    knowledge.care.forEach(item => {
        html += `· ${item}<br>`;
    });
    html += '<br>';
    
    html += `<strong>⚠️ 如出现以下情况请立即就医：</strong><br>`;
    knowledge.danger.forEach(item => {
        html += `· ${item}<br>`;
    });
    html += '<br>';
    
    html += `<strong>🏥 推荐科室：</strong>${dept.department}（${dept.urgency}）`;
    if (dept.note) {
        html += `<br><span style="color: var(--warning);">${dept.note}</span>`;
    }
    
    html += '<br><br><span style="color: var(--danger); font-size: 12px;">以上建议仅供参考，不能替代医生诊断。如孩子症状严重，请及时就医。</span>';
    
    return html;
}

/**
 * 推荐医院
 * @param {string} question - 用户问题
 * @returns {string}
 */
function recommendHospital(question) {
    // 尝试从问题中识别城市
    let city = null;
    for (const c in HOSPITAL_DATA) {
        if (question.includes(c)) {
            city = c;
            break;
        }
    }
    
    if (!city) {
        // 默认展示几个主要城市
        let html = '<strong>🏥 推荐儿童医院</strong><br><br>';
        html += '请告诉我你所在的城市，我可以为你推荐更精确的医院。以下是几个主要城市的推荐：<br><br>';
        
        ['北京', '上海', '广州', '深圳'].forEach(c => {
            html += `<strong>${c}：</strong><br>`;
            HOSPITAL_DATA[c].forEach(h => {
                html += `· ${h.name}（${h.type}）<br>`;
            });
            html += '<br>';
        });
        
        return html;
    }
    
    const hospitals = HOSPITAL_DATA[city] || [];
    if (hospitals.length === 0) {
        return `抱歉，我暂时没有找到${city}的推荐医院数据。`;
    }
    
    let html = `<strong>🏥 ${city}推荐儿童医院</strong><br><br>`;
    hospitals.forEach(h => {
        html += `<strong>${h.name}</strong><br>`;
        html += `类型：${h.type}<br>`;
        html += `地址：${h.address}<br><br>`;
    });
    
    return html;
}

/**
 * 查询检测报告
 * @param {string} question - 用户问题
 * @returns {Promise<string>}
 */
async function queryReports(question) {
    const reports = await getDataByChildId('reports', AppState.currentChildId);
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (reports.length === 0) {
        return '当前孩子还没有上传检测报告。你可以到"检测报告"页面上传。';
    }
    
    // 识别具体报告类型
    let targetType = null;
    const typeMap = {
        '血常规': 'blood',
        '尿常规': 'urine',
        '便常规': 'stool',
        '肝功能': 'liver',
        '肾功能': 'kidney',
        'x光': 'xray',
        'ct': 'ct',
        'b超': 'ultrasound',
        '心电图': 'ecg'
    };
    
    for (const [name, value] of Object.entries(typeMap)) {
        if (question.includes(name)) {
            targetType = value;
            break;
        }
    }
    
    let filteredReports = reports;
    if (targetType) {
        filteredReports = reports.filter(r => r.reportType === targetType);
    }
    
    if (filteredReports.length === 0) {
        return `当前孩子没有${targetType ? REPORT_TYPES.find(t => t.value === targetType)?.label || '该类型' : ''}的检测报告记录。`;
    }
    
    const latest = filteredReports[0];
    const typeLabel = REPORT_TYPES.find(t => t.value === latest.reportType)?.label || '检查';
    
    let html = `<strong>📋 ${typeLabel}记录</strong><br><br>`;
    html += `最新一次${typeLabel}：<br>`;
    html += `· 日期：${formatDate(latest.date)}<br>`;
    html += `· 医院：${latest.hospital || '未填写'}<br>`;
    html += `· 医生：${latest.doctor || '未填写'}<br>`;
    if (latest.summary) {
        html += `· 摘要/指标：${latest.summary}<br>`;
    }
    if (latest.notes) {
        html += `· 备注：${latest.notes}<br>`;
    }
    if (latest.fileData) {
        html += `· 附件：<button class="btn btn-small btn-secondary" onclick="previewReport(${latest.id})">查看报告</button><br>`;
    }
    
    if (filteredReports.length > 1) {
        html += '<br><strong>历史记录：</strong><br>';
        filteredReports.slice(1, 5).forEach(r => {
            const label = REPORT_TYPES.find(t => t.value === r.reportType)?.label || '检查';
            html += `· ${formatDate(r.date)} ${label} ${r.hospital ? '（' + r.hospital + '）' : ''}<br>`;
        });
    }
    
    return html;
}

/**
 * 查询生长数据
 * @param {string} question - 用户问题
 * @returns {Promise<string>}
 */
async function queryGrowth(question) {
    const growthList = await getDataByChildId('growth', AppState.currentChildId);
    growthList.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (growthList.length === 0) {
        return '当前孩子还没有生长数据记录。你可以到"生长曲线"页面添加。';
    }
    
    const child = getCurrentChild();
    const latest = growthList[growthList.length - 1];
    
    let html = `<strong>📈 生长数据</strong><br><br>`;
    html += `最新数据（${formatDate(latest.date)}）：<br>`;
    html += `· 身高：${latest.height} cm<br>`;
    html += `· 体重：${latest.weight} kg<br>`;
    if (latest.headCircumference) {
        html += `· 头围：${latest.headCircumference} cm<br>`;
    }
    
    // 如果问"长了多少"，计算变化
    if (question.includes('长了多少') || question.includes('变化') || question.includes('增长')) {
        // 找半年前的数据作为起点
        const halfYearAgo = new Date();
        halfYearAgo.setMonth(halfYearAgo.getMonth() - 6);

        // 获取半年前的最近一条记录作为对比起点（按日期升序，取最后一条<=半年前的）
        const pastRecord = growthList.filter(g => new Date(g.date) <= halfYearAgo).pop();

        if (pastRecord && pastRecord.id !== latest.id) {
            const heightDiff = (latest.height - pastRecord.height).toFixed(1);
            const weightDiff = (latest.weight - pastRecord.weight).toFixed(1);
            html += `<br>近半年变化（${formatDate(pastRecord.date)} 至 ${formatDate(latest.date)}）：<br>`;
            html += `· 身高增长：${heightDiff} cm<br>`;
            html += `· 体重增长：${weightDiff} kg<br>`;
        } else {
            html += '<br>近半年内的历史对比数据不足，无法准确计算增长量。建议每3-6个月记录一次生长数据。';
        }

        // 评估当前身高在同龄中的位置
        const ageMonths = calculateAgeMonths(child.birthday);
        if (ageMonths >= 0 && ageMonths <= 60) {
            const whoData = WHO_GROWTH_DATA[child.gender] || WHO_GROWTH_DATA.male;
            const nearestMonth = Math.min(60, Math.max(0, Math.round(ageMonths / 6) * 6));
            const p50Height = whoData[nearestMonth] ? whoData[nearestMonth][1] : null;
            if (p50Height) {
                if (latest.height >= p50Height * 0.97 && latest.height <= p50Height * 1.03) {
                    html += `· 身高约处于同龄儿童平均水平（P50），发育正常<br>`;
                } else if (latest.height < p50Height * 0.97) {
                    html += `· 身高略低于同龄平均水平（P50），可继续观察生长趋势<br>`;
                } else {
                    html += `· 身高高于同龄平均水平（P50），发育良好<br>`;
                }
            }
        }
    }

    return html;
}

/**
 * 查询疫苗记录
 * @param {string} question - 用户问题
 * @returns {Promise<string>}
 */
async function queryVaccines(question) {
    const records = await getDataByChildId('vaccines', AppState.currentChildId);
    const child = getCurrentChild();
    const ageMonths = calculateAgeMonths(child.birthday);
    
    const plan = generateVaccinePlan(child.birthday, records, ageMonths);
    const pending = plan.filter(v => v.status !== 'completed');
    const overdue = plan.filter(v => v.status === 'overdue');
    
    if (question.includes('没打') || question.includes('还差') || question.includes('待接种')) {
        if (pending.length === 0) {
            return '太棒了！按照当前年龄，国家免疫规划疫苗已接种完成（实际请以接种本和医生意见为准）。';
        }
        
        let html = `<strong>💉 待接种疫苗（${pending.length}剂）</strong><br><br>`;
        pending.slice(0, 10).forEach(v => {
            html += `· ${v.name}（建议月龄：${v.doseMonth}个月）- ${v.statusText}<br>`;
        });
        if (pending.length > 10) {
            html += `<br>还有 ${pending.length - 10} 剂疫苗待接种，请到疫苗页面查看完整列表。`;
        }
        return html;
    }
    
    // 默认回复接种概况
    let html = `<strong>💉 疫苗接种概况</strong><br><br>`;
    html += `· 已完成：${records.length} 剂<br>`;
    html += `· 待接种：${pending.length} 剂<br>`;
    if (overdue.length > 0) {
        html += `· 已逾期：${overdue.length} 剂（请尽快补种）<br>`;
    }
    html += '<br>你可以问我"还差什么疫苗？"查看详细列表。';
    
    return html;
}

/**
 * 查询就诊用药记录
 * @param {string} question - 用户问题
 * @returns {Promise<string>}
 */
async function queryMedical(question) {
    const medicalList = await getDataByChildId('medical', AppState.currentChildId);
    medicalList.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (medicalList.length === 0) {
        return '当前孩子还没有就诊或用药记录。';
    }
    
    const latest = medicalList[0];
    const typeText = latest.type === 'visit' ? '就诊' : '用药';
    
    let html = `<strong>🗓️ 最近${typeText}记录</strong><br><br>`;
    html += `· 日期：${formatDate(latest.date)}<br>`;
    html += `· ${latest.type === 'visit' ? '就诊' : '用药'}原因：${latest.title}<br>`;
    if (latest.hospital) html += `· 医院：${latest.hospital}<br>`;
    if (latest.doctor) html += `· 医生：${latest.doctor}<br>`;
    if (latest.symptoms) html += `· 症状：${latest.symptoms}<br>`;
    if (latest.diagnosis) html += `· 诊断：${latest.diagnosis}<br>`;
    if (latest.medicine) html += `· 药品：${latest.medicine}<br>`;
    if (latest.dosage) html += `· 用法：${latest.dosage}<br>`;
    if (latest.notes) html += `· 备注：${latest.notes}<br>`;
    
    if (medicalList.length > 1) {
        html += '<br><strong>历史记录：</strong><br>';
        medicalList.slice(1, 5).forEach(m => {
            const t = m.type === 'visit' ? '就诊' : '用药';
            html += `· ${formatDate(m.date)} ${t}：${m.title}<br>`;
        });
    }
    
    return html;
}

/**
 * 查询儿童档案
 * @returns {Promise<string>}
 */
async function queryChildProfile() {
    const child = getCurrentChild();
    const ageMonths = calculateAgeMonths(child.birthday);
    const ageText = ageMonths < 12 ? `${ageMonths}个月` : `${Math.floor(ageMonths / 12)}岁${ageMonths % 12}个月`;
    const genderText = child.gender === 'male' ? '男' : '女';
    
    const [growthList, vaccineRecords, medicalList, reports] = await Promise.all([
        getDataByChildId('growth', AppState.currentChildId),
        getDataByChildId('vaccines', AppState.currentChildId),
        getDataByChildId('medical', AppState.currentChildId),
        getDataByChildId('reports', AppState.currentChildId)
    ]);
    
    let html = `<strong>👤 ${child.name} 的健康档案概览</strong><br><br>`;
    html += `· 性别：${genderText}<br>`;
    html += `· 年龄：${ageText}<br>`;
    html += `· 生日：${formatDate(child.birthday)}<br>`;
    html += `· 血型：${child.bloodType || '未填写'}<br>`;
    html += `· 过敏史：${child.allergies || '无'}<br>`;
    html += `· 既往病史：${child.medicalHistory || '无'}<br><br>`;
    
    html += `<strong>数据汇总：</strong><br>`;
    html += `· 生长记录：${growthList.length} 条<br>`;
    html += `· 已接种疫苗：${vaccineRecords.length} 剂<br>`;
    html += `· 就诊/用药记录：${medicalList.length} 条<br>`;
    html += `· 检测报告：${reports.length} 份<br>`;
    
    return html;
}

/**
 * HTML转义，防止XSS
 * @param {string} text - 原始文本
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

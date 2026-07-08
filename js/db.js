/**
 * 童心健康档案 - IndexedDB 数据层
 * 所有数据存储在浏览器本地，不上传服务器
 */

const DB_NAME = 'ChildHealthDB';
const DB_VERSION = 1;

// 数据库对象
let db = null;

/**
 * 初始化数据库
 * @returns {Promise<IDBDatabase>} 数据库实例
 */
function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        // 数据库首次创建或版本升级时触发
        request.onupgradeneeded = function(event) {
            const database = event.target.result;
            
            // 儿童档案表
            if (!database.objectStoreNames.contains('children')) {
                const childrenStore = database.createObjectStore('children', { keyPath: 'id', autoIncrement: true });
                childrenStore.createIndex('name', 'name', { unique: false });
                childrenStore.createIndex('birthday', 'birthday', { unique: false });
            }
            
            // 生长数据表
            if (!database.objectStoreNames.contains('growth')) {
                const growthStore = database.createObjectStore('growth', { keyPath: 'id', autoIncrement: true });
                growthStore.createIndex('childId', 'childId', { unique: false });
                growthStore.createIndex('date', 'date', { unique: false });
            }
            
            // 疫苗记录表
            if (!database.objectStoreNames.contains('vaccines')) {
                const vaccineStore = database.createObjectStore('vaccines', { keyPath: 'id', autoIncrement: true });
                vaccineStore.createIndex('childId', 'childId', { unique: false });
                vaccineStore.createIndex('vaccineName', 'vaccineName', { unique: false });
            }
            
            // 就诊用药记录表
            if (!database.objectStoreNames.contains('medical')) {
                const medicalStore = database.createObjectStore('medical', { keyPath: 'id', autoIncrement: true });
                medicalStore.createIndex('childId', 'childId', { unique: false });
                medicalStore.createIndex('date', 'date', { unique: false });
                medicalStore.createIndex('type', 'type', { unique: false });
            }
            
            // 检测报告表
            if (!database.objectStoreNames.contains('reports')) {
                const reportStore = database.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
                reportStore.createIndex('childId', 'childId', { unique: false });
                reportStore.createIndex('date', 'date', { unique: false });
                reportStore.createIndex('reportType', 'reportType', { unique: false });
            }
        };
        
        request.onsuccess = function(event) {
            db = event.target.result;
            resolve(db);
        };
        
        request.onerror = function(event) {
            console.error('数据库初始化失败:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * 通用添加数据
 * @param {string} storeName - 表名
 * @param {Object} data - 要添加的数据
 * @returns {Promise<number>} 新增数据的ID
 */
function addData(storeName, data) {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await initDB();
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // 自动添加创建时间
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            
            const request = store.add(data);
            
            request.onsuccess = function(event) {
                resolve(event.target.result);
            };
            
            request.onerror = function(event) {
                console.error(`添加数据到 ${storeName} 失败:`, event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 通用更新数据
 * @param {string} storeName - 表名
 * @param {Object} data - 要更新的数据（必须包含id）
 * @returns {Promise<number>} 更新数据的ID
 */
function updateData(storeName, data) {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await initDB();
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            data.updatedAt = new Date().toISOString();
            
            const request = store.put(data);
            
            request.onsuccess = function(event) {
                resolve(event.target.result);
            };
            
            request.onerror = function(event) {
                console.error(`更新数据到 ${storeName} 失败:`, event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 通用删除数据
 * @param {string} storeName - 表名
 * @param {number} id - 数据ID
 * @returns {Promise<void>}
 */
function deleteData(storeName, id) {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await initDB();
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = function() {
                resolve();
            };
            
            request.onerror = function(event) {
                console.error(`删除 ${storeName} 数据失败:`, event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 根据ID获取单条数据
 * @param {string} storeName - 表名
 * @param {number} id - 数据ID
 * @returns {Promise<Object|null>}
 */
function getDataById(storeName, id) {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await initDB();
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = function(event) {
                resolve(event.target.result || null);
            };
            
            request.onerror = function(event) {
                console.error(`获取 ${storeName} 数据失败:`, event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 根据子ID获取关联数据列表
 * @param {string} storeName - 表名
 * @param {number} childId - 孩子ID
 * @returns {Promise<Array>}
 */
function getDataByChildId(storeName, childId) {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await initDB();
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('childId');
            const request = index.getAll(childId);
            
            request.onsuccess = function(event) {
                resolve(event.target.result || []);
            };
            
            request.onerror = function(event) {
                console.error(`获取 ${storeName} 列表失败:`, event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取所有孩子档案
 * @returns {Promise<Array>}
 */
function getAllChildren() {
    return new Promise(async (resolve, reject) => {
        try {
            const database = await initDB();
            const transaction = database.transaction(['children'], 'readonly');
            const store = transaction.objectStore('children');
            const request = store.getAll();
            
            request.onsuccess = function(event) {
                resolve(event.target.result || []);
            };
            
            request.onerror = function(event) {
                console.error('获取孩子列表失败:', event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 计算年龄（精确到月）
 * @param {string} birthday - 生日字符串（YYYY-MM-DD）
 * @returns {number} 月龄
 */
function calculateAgeMonths(birthday) {
    if (!birthday) return 0;
    
    const birth = new Date(birthday);
    const now = new Date();
    
    let months = (now.getFullYear() - birth.getFullYear()) * 12;
    months += now.getMonth() - birth.getMonth();
    
    if (now.getDate() < birth.getDate()) {
        months -= 1;
    }
    
    return Math.max(0, months);
}

/**
 * 格式化日期显示
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 格式化日期时间
 * @param {string} dateStr - 日期字符串
 * @returns {string}
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 生成唯一ID
 * @returns {string}
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

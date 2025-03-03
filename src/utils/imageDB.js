const DB_NAME = 'ImageMetadataDB';
const DB_VERSION = 1;
const STORE_NAME = 'imageMetadata';

class ImageDB {
  constructor() {
    this.db = null;
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // 使用图片路径作为键
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'imagePath' });
          // 创建索引
          store.createIndex('dateCreated', 'dateCreated', { unique: false });
          store.createIndex('model', 'model', { unique: false });
        }
      };
    });
  }

  // 保存或更新图片元数据
  async saveMetadata(imagePath, metadata) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const data = {
        imagePath,
        ...metadata,
        lastModified: new Date().toISOString()
      };

      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取图片元数据
  async getMetadata(imagePath) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(imagePath);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有元数据
  async getAllMetadata() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 导出所有配置
  async exportConfig() {
    const allMetadata = await this.getAllMetadata();
    const blob = new Blob([JSON.stringify(allMetadata, null, 2)], { type: 'application/json' });
    return blob;
  }

  // 导入配置
  async importConfig(jsonFile) {
    try {
      const text = await jsonFile.text();
      const data = JSON.parse(text);
      
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // 清除现有数据
      await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = resolve;
        clearRequest.onerror = reject;
      });

      // 导入新数据
      for (const item of data) {
        await new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = resolve;
          request.onerror = reject;
        });
      }

      return true;
    } catch (error) {
      console.error('导入配置失败:', error);
      throw error;
    }
  }
}

export const imageDB = new ImageDB(); 
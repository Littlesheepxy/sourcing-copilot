const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const findProcess = require('find-process');
const fs = require('fs');
const isDev = true;  // 开发模式，生产环境可以设为false

let mainWindow;
let pythonProcess;
let pythonPort = 8000;
let apiReady = false;
let startupTimeout;

async function checkApiServer() {
  try {
    const response = await fetch(`http://localhost:${pythonPort}/api/status`);
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function waitForApiServer(maxAttempts = 20, interval = 1000) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const isReady = await checkApiServer();
    if (isReady) {
      console.log('API服务已启动并可用');
      return true;
    }
    
    console.log(`等待API服务启动...(${attempts + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  console.error('API服务启动超时');
  return false;
}

async function startPythonBackend() {
  // 检查是否已有Python服务
  const list = await findProcess('port', pythonPort);
  if (list.length > 0) {
    console.log('Python服务已在运行');
    apiReady = true;
    return true;
  }
  
  console.log('正在启动Python后端...');
  
  // 启动Python后端
  const pythonExecutable = isDev 
    ? 'python3'  // 开发环境
    : path.join(process.resourcesPath, 'app.asar.unpacked/server/dist/main');  // 生产环境
  
  const scriptPath = isDev
    ? path.join(__dirname, '../main.py')
    : null;
    
  try {
    pythonProcess = isDev
      ? spawn(pythonExecutable, [scriptPath])
      : spawn(pythonExecutable);
    
    // 处理stdout和stderr
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python输出: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python错误: ${data}`);
      if (data.toString().includes('Uvicorn running on')) {
        apiReady = true;
      }
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python进程已关闭，退出码: ${code}`);
      pythonProcess = null;
      
      // 如果窗口还在但服务停止了，显示错误
      if (mainWindow && !mainWindow.isDestroyed()) {
        dialog.showErrorBox(
          'Python服务已停止',
          `后端服务已意外停止，退出码: ${code}\n\n请重启应用。`
        );
      }
    });
    
    // 等待服务启动
    const isReady = await waitForApiServer();
    if (isReady) {
      apiReady = true;
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('启动Python服务失败:', error);
    return false;
  }
}

async function createWindow() {
  // 启动Python后端
  const backendStarted = await startPythonBackend();
  if (!backendStarted && !isDev) {
    dialog.showErrorBox(
      '启动失败',
      '无法启动后端服务，请检查安装或联系技术支持。'
    );
    app.quit();
    return;
  }
  
  // 创建Electron窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../icon.png'),
    title: 'Sourcing Copilot',
    backgroundColor: '#ffffff',
  });

  // 加载应用
  if (apiReady) {
    loadApp();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'loading.html'));
    
    // 检查API可用性，可用时加载应用
    startupTimeout = setTimeout(async () => {
      const ready = await checkApiServer();
      if (ready) {
        loadApp();
      } else {
        mainWindow.loadFile(path.join(__dirname, 'error.html'));
      }
    }, 10000);
  }
  
  // 打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  // 阻止导航
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost:8000') && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });
}

function loadApp() {
  const startUrl = isDev
    ? 'http://localhost:8000'  // 开发环境
    : `file://${path.join(__dirname, '../web-app/index.html')}`;  // 生产环境
    
  mainWindow.loadURL(startUrl);
  
  // 清除超时
  if (startupTimeout) {
    clearTimeout(startupTimeout);
    startupTimeout = null;
  }
}

// 应用事件处理
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用程序退出前清理
app.on('will-quit', async (event) => {
  // 关闭Python进程
  if (pythonProcess) {
    console.log('关闭Python进程...');
    
    // 尝试正常关闭
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
      } else {
        pythonProcess.kill('SIGTERM');
      }
    } catch (err) {
      console.error('关闭Python进程失败:', err);
    }
    
    pythonProcess = null;
  }
});

// IPC通信
ipcMain.handle('api-ready', async () => {
  return apiReady;
});

// API代理
ipcMain.handle('api-request', async (event, options) => {
  try {
    const response = await fetch(`http://localhost:${pythonPort}${options.url}`, {
      method: options.method || 'GET',
      headers: options.headers || { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}); 
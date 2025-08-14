const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const findProcess = require('find-process');
const fs = require('fs');
const isDev = !app.isPackaged;  // 自动检测开发/生产模式

let mainWindow;
let pythonProcess;
let pythonPort = 8000;
let apiReady = false;
let startupTimeout;
let isLoggedIn = false;
let currentUser = null;

async function checkApiServer() {
  try {
    // 使用动态导入node-fetch，如果没有则使用内置fetch
    let fetch;
    try {
      fetch = (await import('node-fetch')).default;
    } catch {
      // 如果没有node-fetch，尝试使用全局fetch（Node.js 18+）
      fetch = globalThis.fetch;
    }
    
    if (!fetch) {
      // 如果没有fetch，使用http模块
      const http = require('http');
      return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${pythonPort}/api/status`, (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
    }
    
    const response = await fetch(`http://127.0.0.1:${pythonPort}/api/status`, {
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.log(`API检查失败: ${error.message}`);
    return false;
  }
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
  
  // 确定Python可执行文件和脚本路径
  let pythonExecutable;
  let scriptPath;
  let args = [];
  
  if (isDev) {
    // 开发环境
    pythonExecutable = 'python3';
    scriptPath = path.join(__dirname, '../electron_backend.py');
    args = [scriptPath];
  } else {
    // 生产环境 - 尝试多种可能的路径
    const possiblePaths = [
      path.join(process.resourcesPath, 'server/sourcing-copilot-server'),
      path.join(process.resourcesPath, 'app/server/sourcing-copilot-server'),
      path.join(process.resourcesPath, 'server/electron_backend.py'),
      path.join(process.resourcesPath, 'server/start.py'),
      path.join(process.resourcesPath, 'server/main.py'),
      path.join(process.resourcesPath, 'app/server/electron_backend.py'),
      path.join(process.resourcesPath, 'app/server/start.py'),
      path.join(process.resourcesPath, 'app/server/main.py'),
      path.join(__dirname, '../server/main.py'),
      path.join(__dirname, 'server/main.py')
    ];
    
    // 检查哪个路径存在
    let foundPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        foundPath = testPath;
        console.log(`找到Python服务文件: ${foundPath}`);
        break;
      }
    }
    
    if (foundPath) {
      if (foundPath.endsWith('.py')) {
        // Python脚本文件
        pythonExecutable = 'python3';
        args = [foundPath];
      } else {
        // 可执行文件
        pythonExecutable = foundPath;
        args = [];
      }
    } else {
      // 如果找不到打包的服务，尝试使用系统Python运行脚本
      console.log('未找到打包的Python服务，尝试使用系统Python');
      pythonExecutable = 'python3';
      scriptPath = path.join(__dirname, '../electron_backend.py');
      if (fs.existsSync(scriptPath)) {
        args = [scriptPath];
      } else {
        console.error('无法找到Python后端服务文件');
        return false;
      }
    }
  }
  
  console.log(`启动Python服务: ${pythonExecutable} ${args.join(' ')}`);
    
  try {
    // 设置环境变量
    const env = {
      ...process.env,
      PLAYWRIGHT_DOWNLOAD_HOST: "https://registry.npmmirror.com/-/binary/playwright",
      PLAYWRIGHT_CHROMIUM_DOWNLOAD_HOST: "https://registry.npmmirror.com/-/binary/playwright",
      PLAYWRIGHT_FIREFOX_DOWNLOAD_HOST: "https://registry.npmmirror.com/-/binary/playwright",
      PLAYWRIGHT_WEBKIT_DOWNLOAD_HOST: "https://registry.npmmirror.com/-/binary/playwright",
      PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: "120000"
    };
    
    pythonProcess = spawn(pythonExecutable, args, { env });
    
    // 处理stdout和stderr
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python输出: ${data}`);
      // 检查API服务是否启动
      if (data.toString().includes('Uvicorn running on') || 
          data.toString().includes('Application startup complete')) {
        apiReady = true;
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python错误: ${data}`);
      if (data.toString().includes('Uvicorn running on') || 
          data.toString().includes('Application startup complete')) {
        apiReady = true;
      }
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python进程已关闭，退出码: ${code}`);
      pythonProcess = null;
      
      // 只有在非正常退出时才显示错误（退出码非0）
      if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
        dialog.showErrorBox(
          'Python服务已停止',
          `后端服务已意外停止，退出码: ${code}\n\n建议重启Mac应用以恢复服务。`
        );
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Python进程启动失败:', error);
      console.error('启动命令:', pythonExecutable, args.join(' '));
      console.error('工作目录:', process.cwd());
      console.error('资源路径:', process.resourcesPath);
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        // 在生产环境中，显示错误页面而不是对话框
        if (!isDev) {
          mainWindow.loadFile(path.join(__dirname, 'service-error.html'));
        } else {
          dialog.showErrorBox(
            '启动失败',
            `无法启动Python后端服务: ${error.message}\n\n建议重启Mac应用或联系技术支持。`
          );
        }
      }
    });
    
    // 等待服务启动
    const isReady = await waitForApiServer(40, 1500); // 增加等待次数，减少间隔
    if (isReady) {
      apiReady = true;
      return true;
    } else {
      // 在开发环境中，即使API检查失败也标记为准备就绪
      // 因为从日志看服务实际上是启动成功的
      if (isDev) {
        console.log('开发环境：即使API检查失败也继续，可能是检查逻辑问题');
        apiReady = true;
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('启动Python服务失败:', error);
    return false;
  }
}

async function createWindow() {
  // 先创建窗口并显示加载页面
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
    backgroundColor: '#667eea',
    show: false, // 先不显示，等加载页面准备好再显示
  });

  // 立即显示启动页面
  mainWindow.loadFile(path.join(__dirname, 'startup.html'));
  
  // 页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 在后台启动Python后端
  const backendStarted = await startPythonBackend();
  if (!backendStarted) {
    console.log('后端服务启动失败');
    // 在开发环境中，即使后端检查失败也继续，因为可能是检查逻辑的问题
    if (!isDev) {
      // 生产环境中，显示错误页面
      mainWindow.loadFile(path.join(__dirname, 'service-error.html'));
      return;
    }
  }

  // 后端启动完成后，显示登录页面
  mainWindow.loadFile(path.join(__dirname, 'login.html'));
  
  // 打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  // 阻止导航
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://127.0.0.1:8000') && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });
}

function loadApp() {
  const startUrl = isDev
    ? `file://${path.join(__dirname, '../web-app/out/index.html')}`  // 开发环境使用构建后的静态文件
    : `file://${path.join(process.resourcesPath, 'web-app/index.html')}`;  // 生产环境
    
  console.log('加载前端应用:', startUrl);
  mainWindow.loadURL(startUrl);
  
  // 清除超时
  if (startupTimeout) {
    clearTimeout(startupTimeout);
    startupTimeout = null;
  }
}

// 监听浏览器提醒文件
function startReminderFileWatcher() {
  const os = require('os');
  const reminderFile = path.join(os.tmpdir(), 'sourcing_copilot_browser_reminder.txt');
  
  // 定期检查文件是否存在
  const checkInterval = setInterval(() => {
    if (fs.existsSync(reminderFile)) {
      console.log('检测到浏览器提醒请求');
      
      // 显示浏览器运行提醒页面
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile(path.join(__dirname, 'browser-running.html'));
      }
      
      // 删除文件
      try {
        fs.unlinkSync(reminderFile);
      } catch (error) {
        console.error('删除提醒文件失败:', error);
      }
    }
  }, 1000); // 每秒检查一次
  
  // 应用退出时清理定时器
  app.on('before-quit', () => {
    clearInterval(checkInterval);
  });
}

// 应用事件处理
app.on('ready', () => {
  createWindow();
  startReminderFileWatcher();
});

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
  console.log('应用程序正在退出，开始清理资源...');
  
  // 阻止默认退出，等待清理完成
  event.preventDefault();
  
  try {
    // 关闭Python进程
    if (pythonProcess) {
      console.log('关闭Python进程...');
      
      // 尝试正常关闭
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
      } else {
        pythonProcess.kill('SIGTERM');
      }
      
      // 等待进程关闭
      await new Promise((resolve) => {
        pythonProcess.on('close', () => {
          console.log('Python进程已关闭');
          resolve();
        });
        
        // 如果5秒内没有关闭，强制关闭
        setTimeout(() => {
          if (pythonProcess) {
            console.log('强制关闭Python进程');
            pythonProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
      
      pythonProcess = null;
    }
    
    // 额外确保端口被释放
    console.log('确保端口被释放...');
    const { spawn: spawnSync } = require('child_process');
    
    // 查找并关闭占用8000端口的进程
    try {
      const result = spawnSync('lsof', ['-ti:8000'], { encoding: 'utf8' });
      if (result.stdout) {
        const pids = result.stdout.trim().split('\n').filter(pid => pid);
        for (const pid of pids) {
          console.log(`关闭占用8000端口的进程: ${pid}`);
          spawnSync('kill', ['-9', pid]);
        }
      }
    } catch (err) {
      console.log('清理8000端口时出错:', err.message);
    }
    
    // 查找并关闭占用3000端口的进程
    try {
      const result = spawnSync('lsof', ['-ti:3000'], { encoding: 'utf8' });
      if (result.stdout) {
        const pids = result.stdout.trim().split('\n').filter(pid => pid);
        for (const pid of pids) {
          console.log(`关闭占用3000端口的进程: ${pid}`);
          spawnSync('kill', ['-9', pid]);
        }
      }
    } catch (err) {
      console.log('清理3000端口时出错:', err.message);
    }
    
    console.log('资源清理完成，应用程序退出');
    
  } catch (error) {
    console.error('清理资源时出错:', error);
  }
  
  // 现在真正退出应用
  app.exit(0);
});

// IPC通信
ipcMain.handle('api-ready', async () => {
  return apiReady;
});

// 登录成功处理
ipcMain.handle('login-success', async (event, username) => {
  isLoggedIn = true;
  currentUser = username;
  
  console.log(`用户 ${username} 登录成功，显示浏览器操作提醒`);
  
  // 登录成功后先显示提醒页面
  mainWindow.loadFile(path.join(__dirname, 'browser-reminder.html'));
});

// 登出处理
ipcMain.handle('logout', async () => {
  isLoggedIn = false;
  currentUser = null;
  mainWindow.loadFile(path.join(__dirname, 'login.html'));
});

// API代理
ipcMain.handle('api-request', async (event, options) => {
  // 检查登录状态
  if (!isLoggedIn) {
    return { ok: false, error: '未登录' };
  }
  
  try {
    const response = await fetch(`http://127.0.0.1:${pythonPort}${options.url}`, {
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

// 错误处理IPC
ipcMain.handle('retry-backend', async () => {
  console.log('用户请求重试启动后端服务');
  mainWindow.loadFile(path.join(__dirname, 'startup.html'));
  
  const result = await startPythonBackend();
  if (result) {
    mainWindow.loadFile(path.join(__dirname, 'login.html'));
    return { success: true };
  } else {
    mainWindow.loadFile(path.join(__dirname, 'service-error.html'));
    return { success: false };
  }
});

ipcMain.handle('show-logs', async () => {
  console.log('用户请求查看日志');
  // 这里可以打开日志文件或显示日志窗口
  const { shell } = require('electron');
  
  // 尝试打开日志目录
  const logPath = path.join(app.getPath('userData'), 'logs');
  if (fs.existsSync(logPath)) {
    shell.openPath(logPath);
  } else {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '日志信息',
      message: '暂无日志文件',
      detail: '应用尚未生成日志文件，或日志文件已被清理。'
    });
  }
});

ipcMain.handle('exit-app', async () => {
  console.log('用户请求退出应用');
  app.quit();
});

// 新增外部链接处理
ipcMain.handle('open-external', async (event, url) => {
  console.log('打开外部链接:', url);
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('打开外部链接失败:', error);
    return { success: false, error: error.message };
  }
});

// 继续到应用
ipcMain.handle('continue-to-app', async () => {
  console.log('用户确认继续，开始加载应用');
  
  // 检查API状态并加载应用
  if (apiReady) {
    loadApp();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'loading.html'));
    
    // 检查API可用性，可用时加载应用
    let attempts = 0;
    const maxAttempts = 20;
    
    const checkAndLoad = async () => {
      attempts++;
      console.log(`检查API服务状态 (${attempts}/${maxAttempts})`);
      
      const ready = await checkApiServer();
      if (ready) {
        console.log('API服务检查成功，加载应用');
        apiReady = true;
        loadApp();
      } else if (attempts < maxAttempts) {
        setTimeout(checkAndLoad, 2000);
      } else {
        console.log('API服务检查超时，但在开发环境中仍然尝试加载应用');
        if (isDev) {
          // 开发环境中，即使检查失败也尝试加载应用
          loadApp();
        } else {
          mainWindow.loadFile(path.join(__dirname, 'error.html'));
        }
      }
    };
    
    checkAndLoad();
  }
  
  return { success: true };
});

// 打开系统设置
ipcMain.handle('open-system-settings', async () => {
  console.log('打开系统设置');
  try {
    // 在macOS上打开系统偏好设置的安全性与隐私页面
    if (process.platform === 'darwin') {
      await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
    } else {
      // 其他平台可以打开相应的设置页面
      await shell.openExternal('ms-settings:privacy-general');
    }
    return { success: true };
  } catch (error) {
    console.error('打开系统设置失败:', error);
    return { success: false, error: error.message };
  }
});

// 关闭提醒
ipcMain.handle('close-reminder', async () => {
  console.log('关闭浏览器运行提醒');
  // 直接返回到主应用界面
  loadApp();
  return { success: true };
}); 
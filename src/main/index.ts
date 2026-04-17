import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, globalShortcut, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import {
  initDatabase,
  getAllLists, createList, updateList, deleteList,
  getTasksByList, getTasksByTag, getTask, createTask, updateTask, deleteTask,
  permanentlyDeleteTask, restoreTask, emptyTrash, batchUpdateTasks, batchDeleteTasks,
  searchTasks as dbSearchTasks,
  getSubTasks, createSubTask, updateSubTask, deleteSubTask,
  getTags, createTag, updateTag, deleteTag
} from './database'

// 配置日志
log.transports.file.level = 'info'
log.transports.console.level = 'debug'
log.info('[Main] ZTodo 启动')

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let reminderInterval: NodeJS.Timeout | null = null

// 主题状态
let currentTheme: 'light' | 'dark' = 'light'

// 已弹出过的提醒（避免重复弹出）
const notifiedReminders = new Set<string>()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: true,
    backgroundColor: currentTheme === 'dark' ? '#1E1E1E' : '#F3F3F3',
    title: 'ZTodo',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.setTitle('ZTodo')

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    log.info('[Main] 主窗口已显示')
  })

  mainWindow.on('close', (e) => {
    if (process.platform === 'win32') {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  log.info('[Main] 窗口创建完成')
}

function createTray(): void {
    const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon_B_darkZ.png'))

  tray = new Tray(trayIcon)
  tray.setToolTip('ZTodo ⚡')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '⚡ ZTodo',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '显示主窗口',
      click: (): void => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: '关于',
      click: (): void => {
        const { dialog } = require('electron')
        dialog.showMessageBox(mainWindow!, {
          type: 'info',
          title: '关于',
          message: 'ZTodo',
          detail: '版本: 1.0.0\n作者: 张超\n基于 Electron + React + TypeScript 构建'
        })
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: (): void => {
        mainWindow?.removeAllListeners('close')
        mainWindow?.close()
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  log.info('[Main] 系统托盘创建完成')
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建任务',
          accelerator: 'CmdOrCtrl+N',
          click: (): void => {
            mainWindow?.webContents.send('menu:new-task')
          }
        },
        {
          label: '新建标签',
          accelerator: 'CmdOrCtrl+T',
          click: (): void => {
            mainWindow?.webContents.send('menu:new-tag')
          }
        },
        { type: 'separator' },
        {
          label: '搜索',
          accelerator: 'CmdOrCtrl+F',
          click: (): void => {
            mainWindow?.webContents.send('menu:focus-search')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: (): void => {
            mainWindow?.removeAllListeners('close')
            mainWindow?.close()
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: currentTheme === 'light' ? '切换到暗色模式' : '切换到浅色模式',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: (): void => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light'
            mainWindow?.webContents.send('menu:toggle-theme', currentTheme)
            Menu.setApplicationMenu(Menu.buildFromTemplate(createMenuTemplate()))
          }
        },
        { type: 'separator' },
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: (): void => {
            mainWindow?.webContents.reload()
          }
        },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: (): void => {
            mainWindow?.webContents.toggleDevTools()
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: (): void => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于',
              message: 'ZTodo',
              detail: '版本: 1.1.0\n作者: 张超\n基于 Electron + React + TypeScript 构建\n\n快捷键:\nCtrl+N 新建任务\nCtrl+T 新建标签\nCtrl+F 搜索\nCtrl+Shift+D 切换主题\nCtrl+Shift+A 批量选中'
            })
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createMenuTemplate(): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: '文件',
      submenu: [
        {
          label: '新建任务',
          accelerator: 'CmdOrCtrl+N',
          click: (): void => {
            mainWindow?.webContents.send('menu:new-task')
          }
        },
        {
          label: '新建标签',
          accelerator: 'CmdOrCtrl+T',
          click: (): void => {
            mainWindow?.webContents.send('menu:new-tag')
          }
        },
        { type: 'separator' },
        {
          label: '搜索',
          accelerator: 'CmdOrCtrl+F',
          click: (): void => {
            mainWindow?.webContents.send('menu:focus-search')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: (): void => {
            mainWindow?.removeAllListeners('close')
            mainWindow?.close()
            app.quit()
          }
        }
      ]
    },
    {
     	label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: currentTheme === 'light' ? '切换到暗色模式' : '切换到浅色模式',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: (): void => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light'
            mainWindow?.webContents.send('menu:toggle-theme', currentTheme)
            Menu.setApplicationMenu(Menu.buildFromTemplate(createMenuTemplate()))
          }
        },
        { type: 'separator' },
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: (): void => {
            mainWindow?.webContents.reload()
          }
        },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: (): void => {
            mainWindow?.webContents.toggleDevTools()
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: (): void => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于',
              message: 'ZTodo',
              detail: '版本: 1.1.0\n作者: 张超\n基于 Electron + React + TypeScript 构建\n\n快捷键:\nCtrl+N 新建任务\nCtrl+T 新建标签\nCtrl+F 搜索\nCtrl+Shift+D 切换主题'
            })
          }
        }
      ]
    }
  ]
}

// 启动提醒检查（每30秒一次）
function startReminderScheduler(): void {
  if (reminderInterval) clearInterval(reminderInterval)
  
  reminderInterval = setInterval(() => {
    const { getAllTasks } = require('./database')
    // 获取所有未完成任务（含提醒时间的）
    const allTasks = (getAllTasks as Function)().filter((t: any) => 
      t.isDeleted === 0 && t.isCompleted === 0 && t.reminder
    )
    
    const now = Date.now()
    
    for (const task of allTasks) {
      const reminderTime = new Date(task.reminder).getTime()
      const diff = reminderTime - now
      
      // 提醒：到期前1分钟内（含刚好到期）
      if (diff <= 60 * 1000 && diff > -60 * 1000) {
        const key = `${task.id}-${Math.floor(reminderTime / 60000)}`
        if (!notifiedReminders.has(key)) {
          notifiedReminders.add(key)
          
          // 限制集合大小
          if (notifiedReminders.size > 1000) {
            const arr = Array.from(notifiedReminders)
            notifiedReminders.clear()
            arr.slice(-500).forEach((k: string) => notifiedReminders.add(k))
          }
          
          if (Notification.isSupported()) {
            const notification = new Notification({
              title: '🔔 任务提醒',
              body: `${task.title}${task.note ? '\n' + task.note.substring(0, 50) : ''}`,
              urgency: 'normal'
            })
            notification.on('click', () => {
              mainWindow?.show()
              mainWindow?.focus()
            })
            notification.show()
            log.info(`[Reminder] 提醒已弹出: ${task.title}`)
          }
          
          // 通知前端
          mainWindow?.webContents.send('reminder:triggered', task)
        }
      }
    }
  }, 30000)
  
  log.info('[Main] 提醒调度器已启动')
}

// 注册 IPC 处理函数
function registerIpcHandlers(): void {
  // 列表操作
  ipcMain.handle('db:getLists', () => getAllLists())
  ipcMain.handle('db:createList', (_, list) => createList(list))
  ipcMain.handle('db:updateList', (_, id, data) => updateList(id, data))
  ipcMain.handle('db:deleteList', (_, id) => deleteList(id))

  // 任务操作
  ipcMain.handle('db:getTasks', (_, listId) => getTasksByList(listId))
  ipcMain.handle('db:getTasksByTag', (_, tagId) => getTasksByTag(tagId))
  ipcMain.handle('db:getTask', (_, id) => getTask(id))
  ipcMain.handle('db:createTask', (_, task) => createTask(task))
  ipcMain.handle('db:updateTask', (_, id, data) => updateTask(id, data))
  ipcMain.handle('db:deleteTask', (_, id) => deleteTask(id))
  ipcMain.handle('db:permanentlyDeleteTask', (_, id) => permanentlyDeleteTask(id))
  ipcMain.handle('db:restoreTask', (_, id) => restoreTask(id))
  ipcMain.handle('db:emptyTrash', () => emptyTrash())
  ipcMain.handle('db:batchUpdateTasks', (_, ids, data) => batchUpdateTasks(ids, data))
  ipcMain.handle('db:batchDeleteTasks', (_, ids) => batchDeleteTasks(ids))

  // 子任务操作
  ipcMain.handle('db:getSubTasks', (_, taskId) => getSubTasks(taskId))
  ipcMain.handle('db:createSubTask', (_, sub) => createSubTask(sub))
  ipcMain.handle('db:updateSubTask', (_, id, data) => updateSubTask(id, data))
  ipcMain.handle('db:deleteSubTask', (_, id) => deleteSubTask(id))

  // 标签操作
  ipcMain.handle('db:getTags', () => getTags())
  ipcMain.handle('db:createTag', (_, tag) => createTag(tag))
  ipcMain.handle('db:updateTag', (_, id, data) => updateTag(id, data))
  ipcMain.handle('db:deleteTag', (_, id) => deleteTag(id))

  // 搜索
  ipcMain.handle('db:searchTasks', (_, keyword) => dbSearchTasks(keyword))

  // 发送桌面通知
  ipcMain.handle('notification:show', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  // 获取当前主题
  ipcMain.handle('theme:get', () => currentTheme)

  // 设置主题
  ipcMain.handle('theme:set', (_, theme) => {
    currentTheme = theme
  })

  // 发送系统通知给前端
  ipcMain.on('notification:send', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  log.info('[Main] IPC 处理函数注册完成')
}

app.whenReady().then(() => {
  // 设置 app 名称
  app.name = 'ZTodo'

  // 初始化数据库
  initDatabase()

  // 注册 IPC
  registerIpcHandlers()

  // 创建菜单
  createMenu()

  // 创建窗口
  createWindow()

  // 创建托盘
  createTray()

  // 启动提醒调度器
  startReminderScheduler()

  // 监听窗口关闭事件（Windows 下隐藏到托盘）
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      // 不退出，仅隐藏
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  log.info('[Main] 应用就绪')
})

app.on('before-quit', () => {
  log.info('[Main] 应用退出')
  mainWindow?.removeAllListeners('close')
  mainWindow?.close()
  if (reminderInterval) clearInterval(reminderInterval)
})

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  log.error('[Main] 未捕获的异常:', error)
})

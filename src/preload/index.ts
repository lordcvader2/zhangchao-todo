import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  // 列表
  getLists: () => Promise<unknown>
  createList: (list: unknown) => Promise<unknown>
  updateList: (id: string, data: unknown) => Promise<unknown>
  deleteList: (id: string) => Promise<unknown>
  // 任务
  getTasks: (listId: string) => Promise<unknown>
  getTasksByTag: (tagId: string) => Promise<unknown>
  getTask: (id: string) => Promise<unknown>
  createTask: (task: unknown) => Promise<unknown>
  updateTask: (id: string, data: unknown) => Promise<unknown>
  deleteTask: (id: string) => Promise<unknown>
  permanentlyDeleteTask: (id: string) => Promise<unknown>
  restoreTask: (id: string) => Promise<unknown>
  emptyTrash: () => Promise<unknown>
  batchUpdateTasks: (ids: string[], data: unknown) => Promise<unknown>
  batchDeleteTasks: (ids: string[]) => Promise<unknown>
  // 子任务
  getSubTasks: (taskId: string) => Promise<unknown>
  createSubTask: (sub: unknown) => Promise<unknown>
  updateSubTask: (id: string, data: unknown) => Promise<unknown>
  deleteSubTask: (id: string) => Promise<unknown>
  // 标签
  getTags: () => Promise<unknown>
  createTag: (tag: unknown) => Promise<unknown>
  updateTag: (id: string, data: unknown) => Promise<unknown>
  deleteTag: (id: string) => Promise<unknown>
  // 主题
  getTheme: () => Promise<string>
  setTheme: (theme: string) => Promise<void>
  // 搜索
  searchTasks: (keyword: string) => Promise<unknown>
  // 通知
  sendNotification: (title: string, body: string) => void
  // 菜单事件
  onMenuNewTask: (cb: () => void) => void
  onMenuNewTag: (cb: () => void) => void
  onMenuFocusSearch: (cb: () => void) => void
  onMenuToggleTheme: (cb: (theme: string) => void) => void
  onReminderTriggered: (cb: (task: unknown) => void) => void
}

const api: ElectronAPI = {
  // 列表
  getLists: () => ipcRenderer.invoke('db:getLists'),
  createList: (list) => ipcRenderer.invoke('db:createList', list),
  updateList: (id, data) => ipcRenderer.invoke('db:updateList', id, data),
  deleteList: (id) => ipcRenderer.invoke('db:deleteList', id),
  // 任务
  getTasks: (listId) => ipcRenderer.invoke('db:getTasks', listId),
  getTasksByTag: (tagId) => ipcRenderer.invoke('db:getTasksByTag', tagId),
  getTask: (id) => ipcRenderer.invoke('db:getTask', id),
  createTask: (task) => ipcRenderer.invoke('db:createTask', task),
  updateTask: (id, data) => ipcRenderer.invoke('db:updateTask', id, data),
  deleteTask: (id) => ipcRenderer.invoke('db:deleteTask', id),
  permanentlyDeleteTask: (id) => ipcRenderer.invoke('db:permanentlyDeleteTask', id),
  restoreTask: (id) => ipcRenderer.invoke('db:restoreTask', id),
  emptyTrash: () => ipcRenderer.invoke('db:emptyTrash'),
  batchUpdateTasks: (ids, data) => ipcRenderer.invoke('db:batchUpdateTasks', ids, data),
  batchDeleteTasks: (ids) => ipcRenderer.invoke('db:batchDeleteTasks', ids),
  // 子任务
  getSubTasks: (taskId) => ipcRenderer.invoke('db:getSubTasks', taskId),
  createSubTask: (sub) => ipcRenderer.invoke('db:createSubTask', sub),
  updateSubTask: (id, data) => ipcRenderer.invoke('db:updateSubTask', id, data),
  deleteSubTask: (id) => ipcRenderer.invoke('db:deleteSubTask', id),
  // 标签
  getTags: () => ipcRenderer.invoke('db:getTags'),
  createTag: (tag) => ipcRenderer.invoke('db:createTag', tag),
  updateTag: (id, data) => ipcRenderer.invoke('db:updateTag', id, data),
  deleteTag: (id) => ipcRenderer.invoke('db:deleteTag', id),
  // 主题
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme) => ipcRenderer.invoke('theme:set', theme),
  // 搜索
  searchTasks: (keyword) => ipcRenderer.invoke('db:searchTasks', keyword),
  // 通知
  sendNotification: (title, body) => ipcRenderer.send('notification:send', { title, body }),
  // 菜单事件
  onMenuNewTask: (cb) => ipcRenderer.on('menu:new-task', cb),
  onMenuNewTag: (cb) => ipcRenderer.on('menu:new-tag', cb),
  onMenuFocusSearch: (cb) => ipcRenderer.on('menu:focus-search', cb),
  onMenuToggleTheme: (cb) => ipcRenderer.on('menu:toggle-theme', (_, theme) => cb(theme)),
  onReminderTriggered: (cb) => ipcRenderer.on('reminder:triggered', (_, task) => cb(task))
}

contextBridge.exposeInMainWorld('electron', api)

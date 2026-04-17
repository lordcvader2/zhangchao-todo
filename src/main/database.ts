import Store from 'electron-store'
import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'

export interface Task {
  id: string
  title: string
  note: string
  dueDate: string | null
  reminder: string | null
  isCompleted: number
  isImportant: number
  isMyDay: number
  isPinned: number
  priority: number
  tags: string[]
  isDeleted: number
  deletedAt: string | null
  listId: string
  createdAt: string
  updatedAt: string
}

export interface TaskList {
  id: string
  name: string
  icon: string
  color: string
  isDefault: number
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface SubTask {
  id: string
  title: string
  isCompleted: number
  taskId: string
}

interface StoreSchema {
  lists: TaskList[]
  tasks: Task[]
  subTasks: SubTask[]
  tags: Tag[]
}

let store: Store<StoreSchema>

export function initDatabase(): void {
  store = new Store<StoreSchema>({
    name: 'ztask-data',
    defaults: {
      lists: [],
      tasks: [],
      subTasks: [],
      tags: []
    }
  })

  log.info('[DB] electron-store 初始化完成，数据路径: ' + store.path)

  // 初始化默认列表
  const lists = store.get('lists', [])
  const hasDefault = lists.some((l: TaskList) => l.isDefault === 1)
  if (!hasDefault) {
    const now = new Date().toISOString()
    const defaultList: TaskList = {
      id: 'default-list',
      name: '我的任务',
      icon: '📋',
      color: '#0078D4',
      isDefault: 1,
      createdAt: now
    }
    store.set('lists', [defaultList])
    log.info('[DB] 默认任务列表创建成功')
  }

  // 初始化默认标签
  const tags = store.get('tags', [])
  if (tags.length === 0) {
    const now = new Date().toISOString()
    const defaultTags: Tag[] = [
      { id: 'tag-work', name: '工作', color: '#0078D4', createdAt: now },
      { id: 'tag-life', name: '生活', color: '#107C10', createdAt: now },
      { id: 'tag-study', name: '学习', color: '#FFB900', createdAt: now }
    ]
    store.set('tags', defaultTags)
    log.info('[DB] 默认标签创建成功')
  }

  // 数据迁移：确保旧任务数据有所有新字段
  const allTasks = store.get('tasks', [])
  if (allTasks.length > 0) {
    const needsMigration = allTasks.some((t: Task) =>
      t.isPinned === undefined || t.priority === undefined ||
      t.tags === undefined || t.isDeleted === undefined
    )
    if (needsMigration) {
      const migrated = allTasks.map((t: Task) => ({
        ...t,
        isPinned: t.isPinned ?? 0,
        priority: t.priority ?? 0,
        tags: t.tags ?? [],
        isDeleted: t.isDeleted ?? 0,
        deletedAt: t.deletedAt ?? null
      }))
      store.set('tasks', migrated)
      log.info(`[DB] 数据迁移完成，共 ${migrated.length} 个任务`)
    }
  }

  log.info('[DB] 数据库初始化完成')
}

// ============ 辅助函数 ============

function taskMatchesFilter(task: Task, filter: string): boolean {
  if (filter === 'all') return task.isDeleted === 0
  if (filter === 'trash') return task.isDeleted === 1
  if (filter === 'my-day') return task.isDeleted === 0 && task.isMyDay === 1
  if (filter === 'important') return task.isDeleted === 0 && task.isImportant === 1
  if (filter === 'planned') return task.isDeleted === 0 && !!task.dueDate
  // list filter
  return task.isDeleted === 0 && task.listId === filter
}

// 任务排序：置顶 > 优先级(高→低) > 截止日期 > 创建时间
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 置顶优先
    if (b.isPinned !== a.isPinned) return b.isPinned - a.isPinned
    // 按优先级
    if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0)
    // 有截止日期优先
    if (!!a.dueDate !== !!b.dueDate) return a.dueDate ? -1 : 1
    // 按截止日期
    if (a.dueDate && b.dueDate) {
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (diff !== 0) return diff
    }
    // 按创建时间
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

// ============ 列表 ============

function saveLists(lists: TaskList[]): void {
  store.set('lists', lists)
}

function saveTasks(tasks: Task[]): void {
  // 数据迁移：确保所有任务都有新字段
  const migrated = tasks.map(t => ({
    ...t,
    isPinned: t.isPinned ?? 0,
    priority: t.priority ?? 0,
    tags: t.tags ?? [],
    isDeleted: t.isDeleted ?? 0,
    deletedAt: t.deletedAt ?? null
  }))
  store.set('tasks', migrated)
}

function saveSubTasks(subTasks: SubTask[]): void {
  store.set('subTasks', subTasks)
}

export function getAllLists(): TaskList[] {
  return store.get('lists', [])
}

export function createList(list: Omit<TaskList, 'createdAt'>): TaskList {
  const now = new Date().toISOString()
  const newList: TaskList = { ...list, createdAt: now }
  const lists = store.get('lists', [])
  lists.push(newList)
  saveLists(lists)
  return newList
}

export function updateList(id: string, data: Partial<TaskList>): boolean {
  const lists = store.get('lists', [])
  const index = lists.findIndex((l: TaskList) => l.id === id)
  if (index === -1) return false
  lists[index] = { ...lists[index], ...data }
  saveLists(lists)
  return true
}

export function deleteList(id: string): boolean {
  if (id === 'default-list') return false
  const lists = store.get('lists', [])
  const filtered = lists.filter((l: TaskList) => l.id !== id)
  saveLists(filtered)
  const tasks = store.get('tasks', [])
  const filteredTasks = tasks.filter((t: Task) => t.listId !== id)
  saveTasks(filteredTasks)
  return true
}

// ============ 任务 ============

export function getTasksByList(listId: string): Task[] {
  const tasks = store.get('tasks', [])
  const filtered = tasks.filter((t: Task) => taskMatchesFilter(t, listId))
  return sortTasks(filtered)
}

export function getTasksByTag(tagId: string): Task[] {
  const tasks = store.get('tasks', [])
  return sortTasks(tasks.filter((t: Task) => t.isDeleted === 0 && t.tags && t.tags.includes(tagId)))
}

export function getTask(id: string): Task | undefined {
  const tasks = store.get('tasks', [])
  return tasks.find((t: Task) => t.id === id)
}

export function createTask(task: Omit<Task, 'createdAt' | 'updatedAt'>): Task {
  const now = new Date().toISOString()
  const newTask: Task = {
    ...task,
    isPinned: task.isPinned || 0,
    priority: task.priority || 0,
    tags: task.tags || [],
    isDeleted: task.isDeleted || 0,
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  }
  const tasks = store.get('tasks', [])
  tasks.push(newTask)
  saveTasks(tasks)
  return newTask
}

export function updateTask(id: string, data: Partial<Task>): boolean {
  const tasks = store.get('tasks', [])
  const index = tasks.findIndex((t: Task) => t.id === id)
  if (index === -1) return false
  tasks[index] = { ...tasks[index], ...data, updatedAt: new Date().toISOString() }
  saveTasks(tasks)
  return true
}

export function deleteTask(id: string): boolean {
  const tasks = store.get('tasks', [])
  const index = tasks.findIndex((t: Task) => t.id === id)
  if (index === -1) return false
  // 软删除
  tasks[index] = {
    ...tasks[index],
    isDeleted: 1,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  saveTasks(tasks)
  return true
}

export function permanentlyDeleteTask(id: string): boolean {
  const tasks = store.get('tasks', [])
  const filtered = tasks.filter((t: Task) => t.id !== id)
  saveTasks(filtered)
  // 删除子任务
  const subTasks = store.get('subTasks', [])
  const filteredSubs = subTasks.filter((s: SubTask) => s.taskId !== id)
  saveSubTasks(filteredSubs)
  return true
}

export function restoreTask(id: string): boolean {
  const tasks = store.get('tasks', [])
  const index = tasks.findIndex((t: Task) => t.id === id)
  if (index === -1) return false
  tasks[index] = {
    ...tasks[index],
    isDeleted: 0,
    deletedAt: null,
    updatedAt: new Date().toISOString()
  }
  saveTasks(tasks)
  return true
}

export function emptyTrash(): boolean {
  const tasks = store.get('tasks', [])
  const remaining = tasks.filter((t: Task) => t.isDeleted === 0)
  const toDelete = tasks.filter((t: Task) => t.isDeleted === 1)

  // 彻底删除所有回收站任务的子任务
  for (const t of toDelete) {
    const subTasks = store.get('subTasks', [])
    const filteredSubs = subTasks.filter((s: SubTask) => s.taskId !== t.id)
    saveSubTasks(filteredSubs)
  }

  saveTasks(remaining)
  return true
}

export function batchUpdateTasks(ids: string[], data: Partial<Task>): boolean {
  const tasks = store.get('tasks', [])
  let changed = false
  for (const id of ids) {
    const index = tasks.findIndex((t: Task) => t.id === id)
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...data, updatedAt: new Date().toISOString() }
      changed = true
    }
  }
  if (changed) saveTasks(tasks)
  return changed
}

export function batchDeleteTasks(ids: string[]): boolean {
  const tasks = store.get('tasks', [])
  const now = new Date().toISOString()
  let changed = false
  for (const id of ids) {
    const index = tasks.findIndex((t: Task) => t.id === id)
    if (index !== -1) {
      tasks[index] = {
        ...tasks[index],
        isDeleted: 1,
        deletedAt: now,
        updatedAt: now
      }
      changed = true
    }
  }
  if (changed) saveTasks(tasks)
  return changed
}

export function searchTasks(keyword: string): Task[] {
  const tasks = store.get('tasks', [])
  if (!keyword || !keyword.trim()) return []
  const kw = keyword.toLowerCase()
  const tags = store.get('tags', [])
  const filtered = tasks.filter((t: Task) => {
    if (t.isDeleted === 1) return false
    const titleMatch = t.title.toLowerCase().includes(kw)
    const noteMatch = t.note && t.note.toLowerCase().includes(kw)
    const tagMatch = t.tags && t.tags.some(tagId => {
      const tag = tags.find((tg: Tag) => tg.id === tagId)
      return tag && tag.name.toLowerCase().includes(kw)
    })
    return titleMatch || noteMatch || tagMatch
  })
  return sortTasks(filtered)
}

// ============ 子任务 ============

export function getSubTasks(taskId: string): SubTask[] {
  const subTasks = store.get('subTasks', [])
  return subTasks.filter((s: SubTask) => s.taskId === taskId)
}

export function createSubTask(sub: Omit<SubTask, never>): SubTask {
  const subTasks = store.get('subTasks', [])
  subTasks.push(sub as SubTask)
  saveSubTasks(subTasks)
  return sub as SubTask
}

export function updateSubTask(id: string, data: Partial<SubTask>): boolean {
  const subTasks = store.get('subTasks', [])
  const index = subTasks.findIndex((s: SubTask) => s.id === id)
  if (index === -1) return false
  subTasks[index] = { ...subTasks[index], ...data }
  saveSubTasks(subTasks)
  return true
}

export function deleteSubTask(id: string): boolean {
  const subTasks = store.get('subTasks', [])
  const filtered = subTasks.filter((s: SubTask) => s.id !== id)
  saveSubTasks(filtered)
  return true
}

// 获取所有任务（供提醒调度器使用）
export function getAllTasks(): Task[] {
  return store.get('tasks', [])
}

// ============ 标签 ============

export function getTags(): Tag[] {
  return store.get('tags', [])
}

export function createTag(tag: Omit<Tag, 'createdAt'>): Tag {
  const now = new Date().toISOString()
  const newTag: Tag = { ...tag, createdAt: now }
  const tags = store.get('tags', [])
  tags.push(newTag)
  store.set('tags', tags)
  return newTag
}

export function updateTag(id: string, data: Partial<Tag>): boolean {
  const tags = store.get('tags', [])
  const index = tags.findIndex((t: Tag) => t.id === id)
  if (index === -1) return false
  tags[index] = { ...tags[index], ...data }
  store.set('tags', tags)
  return true
}

export function deleteTag(id: string): boolean {
  const tags = store.get('tags', [])
  const filtered = tags.filter((t: Tag) => t.id !== id)
  store.set('tags', filtered)
  // 从所有任务中移除该标签
  const tasks = store.get('tasks', [])
  let changed = false
  for (const task of tasks) {
    if (task.tags && task.tags.includes(id)) {
      task.tags = task.tags.filter((tagId: string) => tagId !== id)
      changed = true
    }
  }
  if (changed) saveTasks(tasks)
  return true
}

export interface TaskList {
  id: string
  name: string
  icon: string
  color: string
  isDefault: number
  createdAt: string
}

export interface Task {
  id: string
  title: string
  note: string
  dueDate: string | null
  reminder: string | null   // 提醒时间 ISO 字符串
  isCompleted: number
  isImportant: number
  isMyDay: number
  isPinned: number          // 是否置顶
  priority: number         // 优先级 0=无 1=低 2=中 3=高
  tags: string[]           // 标签 ID 数组
  isDeleted: number        // 是否在回收站
  deletedAt: string | null // 删除时间
  listId: string
  createdAt: string
  updatedAt: string
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

export type NavItem =
  | { type: 'my-day' | 'important' | 'all' | 'planned' | 'trash'; label: string; icon: string }
  | { type: 'list'; listId: string; label: string; icon: string }
  | { type: 'tag'; tagId: string; label: string; color: string }

export interface ElectronAPI {
  // 列表
  getLists: () => Promise<TaskList[]>
  createList: (list: Partial<TaskList>) => Promise<TaskList>
  updateList: (id: string, data: Partial<TaskList>) => Promise<boolean>
  deleteList: (id: string) => Promise<boolean>
  // 任务
  getTasks: (listId: string) => Promise<Task[]>
  getTask: (id: string) => Promise<Task | undefined>
  createTask: (task: Partial<Task>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  permanentlyDeleteTask: (id: string) => Promise<boolean>
  restoreTask: (id: string) => Promise<boolean>
  emptyTrash: () => Promise<boolean>
  batchUpdateTasks: (ids: string[], data: Partial<Task>) => Promise<boolean>
  batchDeleteTasks: (ids: string[]) => Promise<boolean>
  // 子任务
  getSubTasks: (taskId: string) => Promise<SubTask[]>
  createSubTask: (sub: Partial<SubTask>) => Promise<SubTask>
  updateSubTask: (id: string, data: Partial<SubTask>) => Promise<boolean>
  deleteSubTask: (id: string) => Promise<boolean>
  // 标签
  getTags: () => Promise<Tag[]>
  createTag: (tag: Partial<Tag>) => Promise<Tag>
  updateTag: (id: string, data: Partial<Tag>) => Promise<boolean>
  deleteTag: (id: string) => Promise<boolean>
  // 主题
  getTheme: () => Promise<string>
  setTheme: (theme: string) => Promise<void>
  // 搜索
  searchTasks: (keyword: string) => Promise<Task[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

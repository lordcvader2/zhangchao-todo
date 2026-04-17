import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { TaskList, Task, SubTask, NavItem, Tag } from './types'
import Sidebar from './components/Sidebar'
import TaskListView from './components/TaskListView'
import TaskDetailPanel from './components/TaskDetailPanel'

export default function App() {
  const [lists, setLists] = useState<TaskList[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [trashCount, setTrashCount] = useState(0)
  const [selectedNav, setSelectedNav] = useState<NavItem>({ type: 'my-day', label: '我的一天', icon: '🌞' })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [filteredTasks, setFilteredTasks] = useState<Task[] | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [showNewTagModal, setShowNewTagModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#0078D4')
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'date'>('default')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 加载标签
  const loadTags = useCallback(async () => {
    const data = await window.electron.getTags()
    setTags(data as Tag[])
  }, [])

  // 加载列表
  const loadLists = useCallback(async () => {
    const data = await window.electron.getLists()
    setLists(data as TaskList[])
  }, [])

  // 加载任务
  const loadTasks = useCallback(async (nav: NavItem) => {
    let data: Task[]
    if (nav.type === 'tag') {
      data = await window.electron.getTasksByTag(nav.tagId) as Task[]
    } else if (nav.type === 'trash') {
      data = await window.electron.getTasks('trash') as Task[]
    } else if (nav.type === 'list') {
      data = await window.electron.getTasks(nav.listId) as Task[]
    } else {
      data = await window.electron.getTasks(nav.type) as Task[]
    }
    
    // 按排序方式处理
    if (sortBy === 'priority') {
      data = [...data].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    } else if (sortBy === 'date') {
      data = [...data].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        return a.dueDate ? -1 : 1
      })
    }
    
    setTasks(data)
    
    // 更新回收站数量
    const all = await window.electron.getTasks('trash') as Task[]
    setTrashCount(all.length)
  }, [sortBy])

  // 搜索
  const handleSearch = useCallback(async (keyword: string) => {
    setSearchKeyword(keyword)
    if (keyword.trim()) {
      const results = await window.electron.searchTasks(keyword)
      setFilteredTasks(results as Task[])
    } else {
      setFilteredTasks(null)
    }
  }, [])

  // 初始化
  useEffect(() => {
    loadLists()
    loadTags()
    loadTasks(selectedNav)
    loadTheme()
  }, [loadLists, loadTags, loadTasks])

  // 切换导航时清空搜索和选中
  useEffect(() => {
    setSearchKeyword('')
    setFilteredTasks(null)
    setIsSearching(false)
    setSelectedTaskIds(new Set())
    setIsBatchMode(false)
  }, [selectedNav])

  // 菜单事件监听
  useEffect(() => {
    window.electron.onMenuNewTask(() => {
      setIsAddingTask(true)
    })
    window.electron.onMenuNewTag(() => {
      setShowNewTagModal(true)
    })
    window.electron.onMenuFocusSearch(() => {
      setIsSearching(true)
      setTimeout(() => searchInputRef.current?.focus(), 100)
    })
    window.electron.onMenuToggleTheme((t) => {
      setTheme(t as 'light' | 'dark')
    })
    window.electron.onReminderTriggered((task: any) => {
      loadTasks(selectedNav)
    })
  }, [loadTasks, selectedNav])

  const loadTheme = async () => {
    const t = await window.electron.getTheme()
    setTheme(t as 'light' | 'dark')
  }

  const handleThemeChange = (t: 'light' | 'dark') => {
    setTheme(t)
    window.electron.setTheme(t)
  }

  // 创建新任务
  const handleCreateTask = async (title: string) => {
    if (!title.trim()) return
    let listId = selectedNav.type === 'list' ? selectedNav.listId : 'default-list'
    if (selectedNav.type === 'my-day' || selectedNav.type === 'important') {
      listId = 'default-list'
    }

    const newTask: Partial<Task> = {
      id: uuid(),
      title: title.trim(),
      note: '',
      dueDate: null,
      reminder: null,
      isCompleted: 0,
      isImportant: selectedNav.type === 'important' ? 1 : 0,
      isMyDay: selectedNav.type === 'my-day' ? 1 : 0,
      isPinned: 0,
      priority: 0,
      tags: [],
      isDeleted: 0,
      deletedAt: null,
      listId
    }

    await window.electron.createTask(newTask)
    await loadTasks(selectedNav)
    setIsAddingTask(false)
  }

  // 更新任务
  const handleUpdateTask = async (id: string, data: Partial<Task>) => {
    await window.electron.updateTask(id, data)
    await loadTasks(selectedNav)
    if (selectedTask?.id === id) {
      const updated = await window.electron.getTask(id)
      setSelectedTask(updated as Task)
    }
  }

  // 删除任务（软删除）
  const handleDeleteTask = async (id: string) => {
    await window.electron.deleteTask(id)
    if (selectedTask?.id === id) setSelectedTask(null)
    await loadTasks(selectedNav)
  }

  // 彻底删除任务
  const handlePermanentDelete = async (id: string) => {
    if (confirm('确定要彻底删除此任务吗？此操作不可恢复！')) {
      await window.electron.permanentlyDeleteTask(id)
      if (selectedTask?.id === id) setSelectedTask(null)
      await loadTasks(selectedNav)
    }
  }

  // 恢复任务
  const handleRestoreTask = async (id: string) => {
    await window.electron.restoreTask(id)
    if (selectedTask?.id === id) setSelectedTask(null)
    await loadTasks(selectedNav)
  }

  // 清空回收站
  const handleEmptyTrash = async () => {
    await window.electron.emptyTrash()
    if (selectedTask) setSelectedTask(null)
    await loadTasks(selectedNav)
  }

  // 批量操作
  const handleBatchSelect = (taskId: string) => {
    const newSet = new Set(selectedTaskIds)
    if (newSet.has(taskId)) {
      newSet.delete(taskId)
    } else {
      newSet.add(taskId)
    }
    setSelectedTaskIds(newSet)
  }

  const handleBatchComplete = async () => {
    for (const id of selectedTaskIds) {
      await window.electron.updateTask(id, { isCompleted: 1 })
    }
    setSelectedTaskIds(new Set())
    setIsBatchMode(false)
    await loadTasks(selectedNav)
  }

  const handleBatchDelete = async () => {
    if (confirm(`确定要删除选中的 ${selectedTaskIds.size} 个任务吗？`)) {
      for (const id of selectedTaskIds) {
        await window.electron.deleteTask(id)
      }
      setSelectedTaskIds(new Set())
      setIsBatchMode(false)
      await loadTasks(selectedNav)
    }
  }

  const handleBatchSetPriority = async (priority: number) => {
    await window.electron.batchUpdateTasks(Array.from(selectedTaskIds), { priority })
    setSelectedTaskIds(new Set())
    setIsBatchMode(false)
    await loadTasks(selectedNav)
  }

  // 创建列表
  const handleCreateList = async (name: string, icon: string) => {
    const newList: Partial<TaskList> = {
      id: uuid(),
      name,
      icon,
      color: '#0078D4',
      isDefault: 0
    }
    await window.electron.createList(newList)
    await loadLists()
  }

  // 删除列表
  const handleDeleteList = async (id: string) => {
    await window.electron.deleteList(id)
    if (selectedNav.type === 'list' && selectedNav.listId === id) {
      setSelectedNav({ type: 'my-day', label: '我的一天', icon: '🌞' })
    }
    await loadLists()
  }

  // 选择任务加载子任务
  const handleSelectTask = async (task: Task | null) => {
    setSelectedTask(task)
    if (task) {
      const subs = await window.electron.getSubTasks(task.id)
      setSubTasks(subs as SubTask[])
    } else {
      setSubTasks([])
    }
  }

  // 子任务操作
  const handleCreateSubTask = async (title: string) => {
    if (!selectedTask || !title.trim()) return
    const newSub: Partial<SubTask> = {
      id: uuid(),
      title: title.trim(),
      isCompleted: 0,
      taskId: selectedTask.id
    }
    await window.electron.createSubTask(newSub)
    const subs = await window.electron.getSubTasks(selectedTask.id)
    setSubTasks(subs as SubTask[])
  }

  const handleUpdateSubTask = async (id: string, data: Partial<SubTask>) => {
    await window.electron.updateSubTask(id, data)
    if (selectedTask) {
      const subs = await window.electron.getSubTasks(selectedTask.id)
      setSubTasks(subs as SubTask[])
    }
  }

  const handleDeleteSubTask = async (id: string) => {
    await window.electron.deleteSubTask(id)
    if (selectedTask) {
      const subs = await window.electron.getSubTasks(selectedTask.id)
      setSubTasks(subs as SubTask[])
    }
  }

  // 标签操作
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const newTag: Partial<Tag> = {
      id: uuid(),
      name: newTagName.trim(),
      color: newTagColor
    }
    await window.electron.createTag(newTag)
    await loadTags()
    setNewTagName('')
    setNewTagColor('#0078D4')
    setShowNewTagModal(false)
  }

  const handleDeleteTag = async (id: string) => {
    if (confirm('确定要删除此标签吗？任务中的标签引用也会被移除。')) {
      await window.electron.deleteTag(id)
      await loadTags()
      await loadTasks(selectedNav)
    }
  }

  // 删除标签（不删除标签本身，是用于批量操作中移除标签）
  const handleRemoveTagFromTask = async (taskId: string, tagId: string) => {
    const task = await window.electron.getTask(taskId) as Task
    if (task && task.tags) {
      const newTags = task.tags.filter((t: string) => t !== tagId)
      await window.electron.updateTask(taskId, { tags: newTags })
      await loadTasks(selectedNav)
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...task, tags: newTags })
      }
    }
  }

  const handleAddTagToTask = async (taskId: string, tagId: string) => {
    const task = await window.electron.getTask(taskId) as Task
    if (task) {
      const currentTags = task.tags || []
      if (!currentTags.includes(tagId)) {
        await window.electron.updateTask(taskId, { tags: [...currentTags, tagId] })
        await loadTasks(selectedNav)
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...task, tags: [...currentTags, tagId] })
        }
      }
    }
  }

  const displayTasks = filteredTasks ?? tasks

  return (
    <div className="flex h-screen" style={{
      backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F3F3F3',
      color: theme === 'dark' ? '#E0E0E0' : '#1a1a1a'
    }}>
      {/* 侧边栏 */}
      <Sidebar
        lists={lists}
        tags={tags}
        trashCount={trashCount}
        selectedNav={selectedNav}
        onSelectNav={setSelectedNav}
        onCreateList={handleCreateList}
        onDeleteList={handleDeleteList}
        onDeleteTag={handleDeleteTag}
        theme={theme}
        onThemeChange={handleThemeChange}
        onOpenTagManager={() => setShowTagManager(true)}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* 任务列表 */}
      <TaskListView
        nav={selectedNav}
        tasks={displayTasks}
        selectedTask={selectedTask}
        onSelectTask={handleSelectTask}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        isAddingTask={isAddingTask}
        setIsAddingTask={setIsAddingTask}
        theme={theme}
        searchKeyword={searchKeyword}
        onSearchChange={handleSearch}
        isSearching={isSearching}
        onToggleSearch={() => {
          setIsSearching(!isSearching)
          if (!isSearching) {
            setSearchKeyword('')
            setFilteredTasks(null)
          } else {
            setTimeout(() => searchInputRef.current?.focus(), 100)
          }
        }}
        searchInputRef={searchInputRef}
        tags={tags}
        selectedTaskIds={selectedTaskIds}
        onBatchSelect={handleBatchSelect}
        isBatchMode={isBatchMode}
        onToggleBatchMode={() => {
          setIsBatchMode(!isBatchMode)
          if (isBatchMode) setSelectedTaskIds(new Set())
        }}
        onBatchComplete={handleBatchComplete}
        onBatchDelete={handleBatchDelete}
        onBatchSetPriority={handleBatchSetPriority}
        onPermanentDelete={handlePermanentDelete}
        onRestoreTask={handleRestoreTask}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* 详情面板 */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          subTasks={subTasks}
          tags={tags}
          allTags={tags}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onCreateSubTask={handleCreateSubTask}
          onUpdateSubTask={handleUpdateSubTask}
          onDeleteSubTask={handleDeleteSubTask}
          onAddTag={handleAddTagToTask}
          onRemoveTag={handleRemoveTagFromTask}
          onPermanentDelete={handlePermanentDelete}
          onRestoreTask={handleRestoreTask}
          onClose={() => setSelectedTask(null)}
          theme={theme}
        />
      )}

      {/* 标签管理弹窗 */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowTagManager(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[400px] max-h-[500px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">标签管理</h2>
              <button onClick={() => setShowTagManager(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">✕</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[350px]">
              <div className="space-y-2">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="flex-1 text-sm font-medium text-gray-700">{tag.name}</span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => setShowNewTagModal(true)}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0078D4' }}
              >
                ➕ 新建标签
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建标签弹窗 */}
      {showNewTagModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => { setShowNewTagModal(false); setNewTagName(''); setNewTagColor('#0078D4') }}>
          <div className="bg-white rounded-xl shadow-2xl w-[360px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">新建标签</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">标签名称</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="例如：工作、学习、生活"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0078D4]"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">标签颜色</label>
                <div className="flex flex-wrap gap-2">
                  {['#0078D4', '#107C10', '#FFB900', '#D83B01', '#B4009E', '#00BCF2', '#E3008C', '#4A4A4A'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className="w-8 h-8 rounded-full transition-transform"
                      style={{
                        backgroundColor: color,
                        outline: newTagColor === color ? `3px solid ${color}` : 'none',
                        outlineOffset: '2px',
                        transform: newTagColor === color ? 'scale(1.15)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setShowNewTagModal(false); setNewTagName(''); setNewTagColor('#0078D4') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#0078D4' }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

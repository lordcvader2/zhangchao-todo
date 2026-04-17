import { useState, useRef, useEffect } from 'react'
import { Task, NavItem, Tag } from '../types'

interface TaskListViewProps {
  nav: NavItem
  tasks: Task[]
  selectedTask: Task | null
  onSelectTask: (task: Task | null) => void
  onCreateTask: (title: string) => void
  onUpdateTask: (id: string, data: Partial<Task>) => void
  onDeleteTask: (id: string) => void
  isAddingTask: boolean
  setIsAddingTask: (v: boolean) => void
  theme: 'light' | 'dark'
  searchKeyword: string
  onSearchChange: (kw: string) => void
  isSearching: boolean
  onToggleSearch: () => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  tags: Tag[]
  selectedTaskIds: Set<string>
  onBatchSelect: (taskId: string) => void
  isBatchMode: boolean
  onToggleBatchMode: () => void
  onBatchComplete: () => void
  onBatchDelete: () => void
  onBatchSetPriority: (priority: number) => void
  onPermanentDelete: (id: string) => void
  onRestoreTask: (id: string) => void
  onEmptyTrash: () => void
}

const PRIORITY_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '', color: '', bg: '' },
  1: { label: '低', color: '#6b7280', bg: '#f3f4f6' },
  2: { label: '中', color: '#d97706', bg: '#fef3c7' },
  3: { label: '高', color: '#dc2626', bg: '#fee2e2' }
}

const PRIORITY_DOT: Record<number, string> = {
  0: '#d1d5db',
  1: '#6b7280',
  2: '#d97706',
  3: '#dc2626'
}

export default function TaskListView({
  nav,
  tasks,
  selectedTask,
  onSelectTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  isAddingTask,
  setIsAddingTask,
  theme,
  searchKeyword,
  onSearchChange,
  isSearching,
  onToggleSearch,
  searchInputRef,
  tags,
  selectedTaskIds,
  onBatchSelect,
  isBatchMode,
  onToggleBatchMode,
  onBatchComplete,
  onBatchDelete,
  onBatchSetPriority,
  onPermanentDelete,
  onRestoreTask,
  onEmptyTrash
}: TaskListViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showBatchMenu, setShowBatchMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const isTrash = nav.type === 'trash'
  const isTagNav = nav.type === 'tag'

  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAddingTask])

  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingTaskId])

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearching, searchInputRef])

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onCreateTask(newTaskTitle.trim())
      setNewTaskTitle('')
      setIsAddingTask(false)
    }
  }

  const handleToggleComplete = (task: Task, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onUpdateTask(task.id, { isCompleted: task.isCompleted ? 0 : 1 })
  }

  const handleToggleImportant = (task: Task, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onUpdateTask(task.id, { isImportant: task.isImportant ? 0 : 1 })
  }

  const handleToggleMyDay = (task: Task, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onUpdateTask(task.id, { isMyDay: task.isMyDay ? 0 : 1 })
  }

  const handleTogglePin = (task: Task, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onUpdateTask(task.id, { isPinned: task.isPinned ? 0 : 1 })
  }

  const startEditing = (task: Task, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const saveEditing = () => {
    if (editingTaskId && editingTitle.trim()) {
      onUpdateTask(editingTaskId, { title: editingTitle.trim() })
    }
    setEditingTaskId(null)
    setEditingTitle('')
  }

  const getNavTitle = () => {
    if ('label' in nav) return nav.label
    return '任务'
  }

  const getNavIcon = () => {
    if ('icon' in nav) return nav.icon
    return '📋'
  }

  const incompleteTasks = tasks.filter(t => !t.isCompleted)
  const completedTasks = tasks.filter(t => t.isCompleted)

  const bg = theme === 'dark' ? '#1E1E1E' : '#ffffff'
  const border = theme === 'dark' ? '#333333' : '#e5e5e5'
  const textPrimary = theme === 'dark' ? '#E0E0E0' : '#1a1a1a'
  const textSecondary = theme === 'dark' ? '#888888' : '#666666'
  const textMuted = theme === 'dark' ? '#555555' : '#999999'
  const inputBg = theme === 'dark' ? '#2a2a2a' : '#f9f9f9'
  const hoverBg = theme === 'dark' ? '#2a2a2a' : 'rgba(0,0,0,0.03)'
  const selectedBg = theme === 'dark' ? '#2a2a2a' : '#F5F5F5'
  const accent = '#0078D4'
  const completedSectionBg = theme === 'dark' ? '#252525' : '#fafafa'

  // 获取任务上的标签
  const getTaskTags = (task: Task) => {
    if (!task.tags || task.tags.length === 0) return []
    return tags.filter(t => task.tags.includes(t.id))
  }

  const renderTaskTags = (task: Task) => {
    const taskTags = getTaskTags(task)
    if (taskTags.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {taskTags.map(tag => (
          <span
            key={tag.id}
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: tag.color + '20', color: tag.color }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    )
  }

  const renderTaskItem = (task: Task, sectionBg?: string) => {
    const priority = PRIORITY_LABELS[task.priority || 0]
    const isSelected = selectedTask?.id === task.id
    const isChecked = selectedTaskIds.has(task.id)

    return (
      <div
        key={task.id}
        className="group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
        style={{
          backgroundColor: isSelected ? selectedBg : (sectionBg || 'transparent'),
          paddingLeft: isBatchMode ? '12px' : '12px'
        }}
        onClick={() => {
          if (isBatchMode) {
            onBatchSelect(task.id)
          } else {
            onSelectTask(task)
          }
        }}
        onMouseEnter={() => setHoveredTaskId(task.id)}
        onMouseLeave={() => setHoveredTaskId(null)}
      >
        {/* 批量选择 checkbox */}
        {isBatchMode && (
          <div
            className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
            style={{
              borderColor: isChecked ? accent : '#d1d5db',
              backgroundColor: isChecked ? accent : 'transparent'
            }}
            onClick={(e) => { e.stopPropagation(); onBatchSelect(task.id) }}
          >
            {isChecked && <span className="text-white text-[8px]">✓</span>}
          </div>
        )}

        {/* 完成按钮（非批量模式） */}
        {!isBatchMode && (
          <button
            onClick={(e) => handleToggleComplete(task, e)}
            className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
            style={{ borderColor: task.isCompleted ? '#22c55e' : '#C4C4C4', backgroundColor: task.isCompleted ? '#22c55e' : 'transparent' }}
          >
            {task.isCompleted && <span className="text-white text-[8px]">✓</span>}
            {!task.isCompleted && (task.isImportant || task.isMyDay || task.isPinned) && (
              <span className="text-[8px]">
                {task.isPinned ? '📌' : task.isMyDay ? '🌞' : '⭐'}
              </span>
            )}
          </button>
        )}

        {/* 优先级指示 */}
        {!isBatchMode && (
          <div className="mt-1 flex-shrink-0 flex flex-col items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: PRIORITY_DOT[task.priority || 0] }}
              title={priority.label ? `优先级：${priority.label}` : ''}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {editingTaskId === task.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={saveEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing()
                if (e.key === 'Escape') { setEditingTaskId(null); setEditingTitle('') }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-1 py-0.5 border rounded text-sm"
              style={{ borderColor: accent, color: textPrimary, backgroundColor: bg }}
            />
          ) : (
            <div className="flex items-start gap-2">
              {task.isPinned === 1 && !task.isCompleted && (
                <span className="text-orange-400 flex-shrink-0 mt-0.5" title="已置顶">📌</span>
              )}
              <p
                className="text-sm flex-1"
                style={{
                  color: task.isCompleted ? textMuted : textPrimary,
                  textDecoration: task.isCompleted ? 'line-through' : 'none'
                }}
                onDoubleClick={(e) => { e.stopPropagation(); startEditing(task, e) }}
              >
                {task.title}
              </p>
            </div>
          )}
          
          {/* 标签展示 */}
          {renderTaskTags(task)}

          {/* 附加信息 */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {task.dueDate && (
              <span className="text-xs" style={{ color: textMuted }}>
                📅 {new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {task.reminder && (
              <span className="text-xs" style={{ color: '#f97316' }}>
                🔔 {new Date(task.reminder).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {priority.label && !task.isCompleted && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: priority.bg, color: priority.color }}
              >
                {priority.label}优先级
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮（非批量、非回收站） */}
        {!isBatchMode && !isTrash && hoveredTaskId === task.id && editingTaskId !== task.id && (
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => handleTogglePin(task, e)}
              className="w-7 h-7 rounded flex items-center justify-center text-sm"
              style={{ color: task.isPinned ? '#f97316' : textMuted }}
              title="置顶"
            >
              📌
            </button>
            <button
              onClick={(e) => handleToggleImportant(task, e)}
              className="w-7 h-7 rounded flex items-center justify-center text-sm"
              style={{ color: task.isImportant ? '#eab308' : textMuted }}
              title="标记重要"
            >
              ⭐
            </button>
            <button
              onClick={(e) => handleToggleMyDay(task, e)}
              className="w-7 h-7 rounded flex items-center justify-center text-sm"
              style={{ color: task.isMyDay ? '#f97316' : textMuted }}
              title="添加到我的一天"
            >
              🌞
            </button>
            <button
              onClick={(e) => startEditing(task, e)}
              className="w-7 h-7 rounded flex items-center justify-center text-xs"
              style={{ color: textMuted }}
              title="编辑"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id) }}
              className="w-7 h-7 rounded flex items-center justify-center text-xs"
              style={{ color: textMuted }}
              title="删除到回收站"
            >
              🗑️
            </button>
          </div>
        )}

        {/* 回收站操作按钮 */}
        {!isBatchMode && isTrash && hoveredTaskId === task.id && (
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onRestoreTask(task.id)}
              className="px-2 py-1 rounded text-xs font-medium hover:bg-green-50 text-green-600"
              title="恢复任务"
            >
              ♻️ 恢复
            </button>
            <button
              onClick={() => onPermanentDelete(task.id)}
              className="px-2 py-1 rounded text-xs font-medium hover:bg-red-50 text-red-500"
              title="彻底删除"
            >
              🗑️ 彻底删除
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex-1 flex flex-col min-w-[350px] border-r flex-shrink-0"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* 头部 + 搜索栏 */}
      <div className="p-5 border-b" style={{ borderColor: border }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getNavIcon()}</span>
          <h2 className="text-xl font-semibold flex-1" style={{ color: textPrimary }}>
            {getNavTitle()}
            {isTagNav && 'color' in nav && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full align-middle"
                style={{ backgroundColor: (nav as any).color + '20', color: (nav as any).color }}
              >
                {(nav as any).color}
              </span>
            )}
          </h2>
          
          {/* 批量操作按钮（非回收站） */}
          {!isTrash && (
            <button
              onClick={onToggleBatchMode}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
              style={{
                backgroundColor: isBatchMode ? accent + '20' : 'transparent',
                color: isBatchMode ? accent : textMuted
              }}
              title="批量操作 (Ctrl+Shift+A)"
            >
              ☑️
            </button>
          )}
          
          <button
            onClick={onToggleSearch}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{
              backgroundColor: isSearching ? accent + '20' : 'transparent',
              color: isSearching ? accent : textMuted
            }}
            title="搜索 (Ctrl+F)"
          >
            🔍
          </button>
        </div>

        {/* 搜索输入框 */}
        {isSearching && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchKeyword}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="搜索任务、备注或标签..."
                className="w-full px-3 py-2 text-sm rounded-lg border transition-all"
                style={{
                  backgroundColor: inputBg,
                  borderColor: border,
                  color: textPrimary
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onToggleSearch()
                    onSearchChange('')
                  }
                }}
              />
              {searchKeyword && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-xs"
                  style={{ color: textMuted }}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={onToggleSearch}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ color: textMuted }}
            >
              取消
            </button>
          </div>
        )}

        {nav.type === 'my-day' && incompleteTasks.length > 0 && (
          <p className="mt-2 text-xs" style={{ color: textMuted }}>
            {incompleteTasks.length} 项任务 · {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        )}
        {isSearching && searchKeyword && (
          <p className="mt-2 text-xs" style={{ color: textMuted }}>
            找到 {tasks.length} 个结果
          </p>
        )}
        {isTrash && tasks.length > 0 && (
          <p className="mt-2 text-xs" style={{ color: textMuted }}>
            回收站中的任务将在 30 天后自动清理
          </p>
        )}
      </div>

      {/* 批量操作栏 */}
      {isBatchMode && selectedTaskIds.size > 0 && (
        <div
          className="px-5 py-3 flex items-center gap-3 border-b"
          style={{ backgroundColor: accent + '10', borderColor: accent + '30' }}
        >
          <span className="text-sm font-medium" style={{ color: accent }}>
            已选中 {selectedTaskIds.size} 项
          </span>
          <div className="flex-1 flex items-center gap-2">
            {/* 优先级快捷设置 */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  onClick={() => handleBatchSetPriority(p)}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: PRIORITY_LABELS[p].bg, color: PRIORITY_LABELS[p].color }}
                >
                  {PRIORITY_LABELS[p].label}优先
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleBatchComplete}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90"
            style={{ backgroundColor: '#22c55e' }}
          >
            ✅ 标记完成
          </button>
          <button
            onClick={handleBatchDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90"
            style={{ backgroundColor: '#ef4444' }}
          >
            🗑️ 批量删除
          </button>
          <button
            onClick={onToggleBatchMode}
            className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
            style={{ backgroundColor: theme === 'dark' ? '#333' : '#e5e5e5', color: textSecondary }}
          >
            取消
          </button>
        </div>
      )}

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 未完成任务 / 回收站任务 */}
        {incompleteTasks.map((task) => renderTaskItem(task))}

        {/* 已完成任务 */}
        {completedTasks.length > 0 && !isTrash && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 mt-2">
              <span className="text-xs" style={{ color: textMuted }}>已完成 {completedTasks.length}</span>
              <div className="flex-1 h-px" style={{ backgroundColor: border }} />
            </div>
            {completedTasks.map((task) => renderTaskItem(task, completedSectionBg))}
          </>
        )}

        {/* 空状态 */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">
              {isSearching ? '🔍' : isTrash ? '🗑️' : nav.type === 'my-day' ? '🌞' : nav.type === 'important' ? '⭐' : nav.type === 'tag' ? ' 🏷️' : '📋'}
            </span>
            <p className="text-sm mb-1" style={{ color: textSecondary }}>
              {isSearching
                ? (searchKeyword ? '没有找到匹配的任务' : '输入关键词搜索')
                : isTrash
                  ? '回收站为空'
                  : nav.type === 'my-day'
                    ? '今天想做什么？'
                    : nav.type === 'important'
                      ? '还没有重要任务'
                      : nav.type === 'tag'
                        ? '该标签下暂无任务'
                        : '暂无任务'}
            </p>
            {!isSearching && !isTrash && <p className="text-xs" style={{ color: textMuted }}>点击下方添加按钮开始</p>}
          </div>
        )}
      </div>

      {/* 底部添加栏（仅非回收站） */}
      {!isTrash && (
        <div className="p-3 border-t" style={{ borderColor: border, backgroundColor: bg }}>
          {isAddingTask ? (
            <div className="flex items-center gap-2 px-2">
              <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: textMuted }} />
              <input
                ref={inputRef}
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask()
                  if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskTitle('') }
                }}
                onBlur={() => {
                  if (!newTaskTitle.trim()) setIsAddingTask(false)
                }}
                placeholder="输入任务名称..."
                className="flex-1 text-sm bg-transparent border-none outline-none"
                style={{ color: textPrimary }}
              />
              <button
                onClick={handleAddTask}
                className="text-xs font-medium hover:underline"
                style={{ color: accent }}
              >
                添加
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-lg transition-colors"
              style={{ color: textMuted }}
            >
              <span className="text-lg">➕</span>
              <span>添加任务</span>
              <span className="ml-auto text-[10px] opacity-50">Ctrl+N</span>
            </button>
          )}
        </div>
      )}

      {/* 回收站清空按钮 */}
      {isTrash && tasks.length > 0 && (
        <div className="p-3 border-t" style={{ borderColor: border, backgroundColor: bg }}>
          <button
            onClick={() => {
              if (confirm(`确定要清空回收站吗？将永久删除 ${tasks.length} 个任务！`)) {
                onEmptyTrash()
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🗑️</span>
            <span>清空回收站</span>
          </button>
        </div>
      )}
    </div>
  )
}

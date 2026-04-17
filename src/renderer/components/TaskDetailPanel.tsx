import { useState, useRef, useEffect } from 'react'
import { Task, SubTask, Tag } from '../types'

interface TaskDetailPanelProps {
  task: Task
  subTasks: SubTask[]
  tags: Tag[]
  allTags: Tag[]
  onUpdateTask: (id: string, data: Partial<Task>) => void
  onDeleteTask: (id: string) => void
  onCreateSubTask: (title: string) => void
  onUpdateSubTask: (id: string, data: Partial<SubTask>) => void
  onDeleteSubTask: (id: string) => void
  onAddTag: (taskId: string, tagId: string) => void
  onRemoveTag: (taskId: string, tagId: string) => void
  onPermanentDelete: (id: string) => void
  onRestoreTask: (id: string) => void
  onClose: () => void
  theme: 'light' | 'dark'
}

const PRIORITY_OPTIONS = [
  { value: 0, label: '无', color: '#d1d5db', bg: '#f9fafb' },
  { value: 1, label: '低', color: '#6b7280', bg: '#f3f4f6' },
  { value: 2, label: '中', color: '#d97706', bg: '#fef3c7' },
  { value: 3, label: '高', color: '#dc2626', bg: '#fee2e2' }
]

const REMINDER_PRESETS = [
  { label: '不提醒', value: '' },
  { label: '提前 5 分钟', value: 5 },
  { label: '提前 15 分钟', value: 15 },
  { label: '提前 30 分钟', value: 30 },
  { label: '提前 1 小时', value: 60 },
  { label: '提前 1 天', value: 1440 },
  { label: '提前 2 天', value: 2880 }
]

export default function TaskDetailPanel({
  task,
  subTasks,
  tags,
  allTags,
  onUpdateTask,
  onDeleteTask,
  onCreateSubTask,
  onUpdateSubTask,
  onDeleteSubTask,
  onAddTag,
  onRemoveTag,
  onPermanentDelete,
  onRestoreTask,
  onClose,
  theme
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note || '')
  const [isAddingSubTask, setIsAddingSubTask] = useState(false)
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('')
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [showPriorityPicker, setShowPriorityPicker] = useState(false)
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(task.title)
    setNote(task.note || '')
  }, [task])

  const handleSaveTitle = () => {
    if (title.trim() && title !== task.title) {
      onUpdateTask(task.id, { title: title.trim() })
    } else {
      setTitle(task.title)
    }
  }

  const handleSaveNote = () => {
    if (note !== task.note) {
      onUpdateTask(task.id, { note })
    }
  }

  const handleToggleComplete = () => {
    onUpdateTask(task.id, { isCompleted: task.isCompleted ? 0 : 1 })
  }

  const handleToggleImportant = () => {
    onUpdateTask(task.id, { isImportant: task.isImportant ? 0 : 1 })
  }

  const handleToggleMyDay = () => {
    onUpdateTask(task.id, { isMyDay: task.isMyDay ? 0 : 1 })
  }

  const handleTogglePin = () => {
    onUpdateTask(task.id, { isPinned: task.isPinned ? 0 : 1 })
  }

  const handleSetDueDate = () => {
    const dateStr = prompt('输入截止日期 (YYYY-MM-DD):', task.dueDate ? task.dueDate.split('T')[0] : '')
    if (dateStr === null) return
    if (dateStr === '') {
      onUpdateTask(task.id, { dueDate: null })
    } else {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        onUpdateTask(task.id, { dueDate: date.toISOString() })
      }
    }
  }

  const handleSetReminder = (minutes: number) => {
    if (!task.dueDate) {
      alert('请先设置截止日期！')
      setShowReminderPicker(false)
      return
    }
    if (minutes === 0) {
      onUpdateTask(task.id, { reminder: null })
    } else {
      const dueTime = new Date(task.dueDate).getTime()
      const reminderTime = dueTime - minutes * 60 * 1000
      onUpdateTask(task.id, { reminder: new Date(reminderTime).toISOString() })
    }
    setShowReminderPicker(false)
  }

  const handleSetReminderDateTime = (dateTimeStr: string) => {
    if (dateTimeStr === '') {
      onUpdateTask(task.id, { reminder: null })
    } else {
      onUpdateTask(task.id, { reminder: new Date(dateTimeStr).toISOString() })
    }
    setShowReminderPicker(false)
  }

  const handleSetPriority = (priority: number) => {
    onUpdateTask(task.id, { priority })
    setShowPriorityPicker(false)
  }

  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      onCreateSubTask(newSubTaskTitle.trim())
      setNewSubTaskTitle('')
      setIsAddingSubTask(false)
    }
  }

  const handleToggleSubTaskComplete = (sub: SubTask) => {
    onUpdateSubTask(sub.id, { isCompleted: sub.isCompleted ? 0 : 1 })
  }

  const handleAddTag = (tagId: string) => {
    onAddTag(task.id, tagId)
    setShowTagSelector(false)
  }

  const handleRemoveTag = (tagId: string) => {
    onRemoveTag(task.id, tagId)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return '今天'
    if (date.toDateString() === tomorrow.toDateString()) return '明天'
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
  }

  const formatReminder = (reminderStr: string | null) => {
    if (!reminderStr) return ''
    const date = new Date(reminderStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return '已过期'
    if (diff < 60 * 1000) return '即将到期'
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟后`
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时后`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const currentPriority = PRIORITY_OPTIONS.find(p => p.value === task.priority) || PRIORITY_OPTIONS[0]
  const taskTags = (task.tags || []).map((tagId: string) => allTags.find((t: Tag) => t.id === tagId)).filter(Boolean)
  const availableTags = allTags.filter((t: Tag) => !(task.tags || []).includes(t.id))
  const isTrash = task.isDeleted === 1

  const bg = theme === 'dark' ? '#1E1E1E' : '#ffffff'
  const border = theme === 'dark' ? '#333333' : '#e5e5e5'
  const textPrimary = theme === 'dark' ? '#E0E0E0' : '#1a1a1a'
  const textSecondary = theme === 'dark' ? '#888888' : '#666666'
  const textMuted = theme === 'dark' ? '#555555' : '#999999'
  const accent = '#0078D4'

  // 转换为本地时间字符串（用于 datetime-local input）
  const getLocalDateTimeString = (isoStr: string | null) => {
    if (!isoStr) return ''
    const date = new Date(isoStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const reminderInputValue = getLocalDateTimeString(task.reminder)

  return (
    <div className="detail-panel w-96 bg-white flex flex-col h-full" style={{ backgroundColor: bg }}>
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: border }}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleComplete}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
              task.isCompleted
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 hover:border-[#0078D4]'
            }`}
          >
            {task.isCompleted && <span className="text-xs">✓</span>}
          </button>
          <button
            onClick={handleToggleImportant}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              task.isImportant ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
            title="标记重要"
          >
            ⭐
          </button>
          {isTrash ? (
            <button
              onClick={() => onRestoreTask(task.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-green-500 hover:bg-green-50 transition-all"
              title="恢复任务"
            >
              ♻️
            </button>
          ) : (
            <button
              onClick={handleTogglePin}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                task.isPinned ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
              }`}
              title={task.isPinned ? '取消置顶' : '置顶任务'}
            >
              📌
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* 标题 */}
        {isTrash ? (
          <p className="text-xl font-semibold text-gray-400 line-through">{title}</p>
        ) : (
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSaveTitle()
              }
            }}
            className="w-full text-xl font-semibold text-gray-800 resize-none border-none outline-none bg-transparent leading-snug placeholder-gray-300"
            placeholder="任务标题..."
            rows={2}
          />
        )}

        {/* 快捷操作标签 */}
        {!isTrash && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleToggleMyDay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                task.isMyDay
                  ? 'bg-orange-100 text-orange-600 border border-orange-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-orange-50'
              }`}
            >
              🌞 我的一天
            </button>
            <button
              onClick={handleSetDueDate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                task.dueDate
                  ? 'bg-blue-100 text-blue-600 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-blue-50'
              }`}
            >
              📅 {task.dueDate ? formatDate(task.dueDate) : '添加截止日期'}
            </button>
            
            {/* 优先级选择 */}
            <div className="relative">
              <button
                onClick={() => { setShowPriorityPicker(!showPriorityPicker); setShowReminderPicker(false) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  task.priority > 0
                    ? 'border'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                style={
                  task.priority > 0
                    ? { backgroundColor: currentPriority.bg, color: currentPriority.color, borderColor: currentPriority.color + '40' }
                    : {}
                }
              >
                ⭐ {currentPriority.label || '设置优先级'}
              </button>
              {showPriorityPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPriorityPicker(false)} />
                  <div className="absolute top-full left-0 mt-1 rounded-lg border shadow-lg z-20 overflow-hidden" style={{ backgroundColor: bg, borderColor: border }}>
                    {PRIORITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSetPriority(opt.value)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:opacity-80"
                        style={{ color: opt.value === 0 ? textSecondary : opt.color, backgroundColor: opt.value === task.priority ? opt.bg : 'transparent' }}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span>{opt.label === '无' ? '不设置优先级' : opt.label + '优先级'}</span>
                        {opt.value > 0 && <span className="ml-auto text-xs opacity-50">{'!'.repeat(opt.value)}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 提醒时间 */}
            <div className="relative">
              <button
                onClick={() => { setShowReminderPicker(!showReminderPicker); setShowPriorityPicker(false) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  task.reminder
                    ? 'bg-orange-100 text-orange-600 border border-orange-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-orange-50'
                }`}
              >
                🔔 {task.reminder ? formatReminder(task.reminder) : '添加提醒'}
              </button>
              {showReminderPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowReminderPicker(false)} />
                  <div className="absolute top-full left-0 mt-1 rounded-lg border shadow-lg z-20 overflow-hidden w-56" style={{ backgroundColor: bg, borderColor: border }}>
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-medium" style={{ color: textMuted }}>快捷设置</p>
                      {REMINDER_PRESETS.map(preset => (
                        <button
                          key={preset.value}
                          onClick={() => handleSetReminder(preset.value)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: !task.reminder && preset.value === 0
                              ? accent + '15'
                              : task.reminder && preset.label.includes('分钟') && preset.value === 5 && !task.dueDate
                                ? 'transparent'
                                : 'transparent',
                            color: textSecondary
                          }}
                        >
                          <span>🔔</span>
                          <span>{preset.label}</span>
                        </button>
                      ))}
                      {!task.dueDate && (
                        <p className="text-xs text-center pt-1" style={{ color: textMuted }}>
                          ⚠️ 请先设置截止日期才能使用快捷提醒
                        </p>
                      )}
                    </div>
                    <div className="border-t p-3" style={{ borderColor: border }}>
                      <p className="text-xs font-medium mb-2" style={{ color: textMuted }}>自定义时间</p>
                      <input
                        type="datetime-local"
                        className="w-full px-2 py-1.5 text-xs border rounded-lg outline-none"
                        style={{ borderColor: border, color: textPrimary, backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9' }}
                        value={reminderInputValue}
                        onChange={(e) => handleSetReminderDateTime(e.target.value)}
                      />
                      {reminderInputValue && (
                        <button
                          onClick={() => handleSetReminderDateTime('')}
                          className="mt-2 w-full text-xs text-red-400 hover:text-red-600 py-1"
                        >
                          清除提醒
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 标签 */}
        {!isTrash && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400">🏷️</span>
              <span className="text-sm font-medium text-gray-600">标签</span>
              <button
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="ml-auto text-xs text-[#0078D4] hover:underline"
              >
                {showTagSelector ? '收起' : '+ 添加标签'}
              </button>
            </div>
            
            {/* 当前标签 */}
            {taskTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {taskTags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-0.5 hover:opacity-70"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* 标签选择器 */}
            {showTagSelector && availableTags.length > 0 && (
              <div className="rounded-lg border p-3 space-y-1" style={{ borderColor: border }}>
                {availableTags.map((tag: any) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span style={{ color: textSecondary }}>{tag.name}</span>
                  </button>
                ))}
              </div>
            )}
            {showTagSelector && availableTags.length === 0 && (
              <p className="text-xs text-center py-2" style={{ color: textMuted }}>所有标签都已添加</p>
            )}
          </div>
        )}

        {/* 备注 */}
        {!isTrash && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400">📝</span>
              <span className="text-sm font-medium text-gray-600">备注</span>
            </div>
            <textarea
              ref={noteTextareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleSaveNote}
              className="w-full min-h-[100px] p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg resize-none outline-none focus:border-[#0078D4] focus:bg-white transition-colors placeholder-gray-400"
              placeholder="添加备注..."
            />
          </div>
        )}

        {/* 回收站信息 */}
        {isTrash && (
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fee2e2' }}>
            <p className="text-sm font-medium text-red-600 mb-1">🗑️ 任务已删除</p>
            <p className="text-xs text-red-400">
              删除时间：{task.deletedAt ? new Date(task.deletedAt).toLocaleString('zh-CN') : '未知'}
            </p>
          </div>
        )}

        {/* 子任务 */}
        {!isTrash && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-400">☑️</span>
              <span className="text-sm font-medium text-gray-600">子任务</span>
              {subTasks.length > 0 && (
                <span className="text-xs text-gray-400 ml-auto">
                  {subTasks.filter(s => s.isCompleted).length}/{subTasks.length}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {subTasks.map((sub) => (
                <div
                  key={sub.id}
                  className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleToggleSubTaskComplete(sub)}
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      sub.isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 hover:border-[#0078D4]'
                    }`}
                  >
                    {sub.isCompleted && <span className="text-[8px]">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm ${sub.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => onDeleteSubTask(sub.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {isAddingSubTask ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border-2 border-gray-300" />
                  <input
                    type="text"
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubTask()
                      if (e.key === 'Escape') { setIsAddingSubTask(false); setNewSubTaskTitle('') }
                    }}
                    onBlur={() => {
                      if (!newSubTaskTitle.trim()) setIsAddingSubTask(false)
                    }}
                    placeholder="子任务..."
                    className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-400"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSubTask(true)}
                  className="flex items-center gap-2 p-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg w-full"
                >
                  <span>➕</span>
                  <span>添加子任务</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 任务详情（创建信息） */}
        <div className="text-xs" style={{ color: textMuted }}>
          <p>创建于 {new Date(task.createdAt).toLocaleDateString('zh-CN')}</p>
          {task.updatedAt !== task.createdAt && (
            <p>最后更新 {new Date(task.updatedAt).toLocaleDateString('zh-CN')}</p>
          )}
        </div>
      </div>

      {/* 底部删除 */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: border }}>
        {isTrash ? (
          <>
            <button
              onClick={() => onRestoreTask(task.id)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <span>♻️</span>
              <span>恢复任务</span>
            </button>
            <button
              onClick={() => onPermanentDelete(task.id)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span>🗑️</span>
              <span>彻底删除</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              if (confirm('确定要删除这个任务吗？可以在回收站恢复。')) {
                onDeleteTask(task.id)
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🗑️</span>
            <span>删除任务</span>
          </button>
        )}
      </div>
    </div>
  )
}

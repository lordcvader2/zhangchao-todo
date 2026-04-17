import { useState, useEffect } from 'react'
import { TaskList, NavItem, Tag } from '../types'

interface SidebarProps {
  lists: TaskList[]
  tags: Tag[]
  trashCount: number
  selectedNav: NavItem
  onSelectNav: (nav: NavItem) => void
  onCreateList: (name: string, icon: string) => void
  onDeleteList: (id: string) => void
  onDeleteTag: (id: string) => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onOpenTagManager: () => void
  sortBy: 'default' | 'priority' | 'date'
  onSortByChange: (sort: 'default' | 'priority' | 'date') => void
}

const defaultNavs: NavItem[] = [
  { type: 'my-day', label: '我的一天', icon: '🌞' },
  { type: 'important', label: '重要', icon: '⭐' },
  { type: 'planned', label: '计划内', icon: '📅' },
  { type: 'all', label: '全部', icon: '📋' }
]

const EMOJIS = ['📋', '🏠', '💼', '🏃', '📚', '💡', '🎯', '❤️', '🔥', '🎨', '🎮', '🎵']

export default function Sidebar({
  lists,
  tags,
  trashCount,
  selectedNav,
  onSelectNav,
  onCreateList,
  onDeleteList,
  onDeleteTag,
  theme,
  onThemeChange,
  onOpenTagManager,
  sortBy,
  onSortByChange
}: SidebarProps) {
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListIcon, setNewListIcon] = useState('📋')
  const [hoveredListId, setHoveredListId] = useState<string | null>(null)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const handleAddList = () => {
    if (newListName.trim()) {
      onCreateList(newListName.trim(), newListIcon)
      setNewListName('')
      setNewListIcon('📋')
      setIsAddingList(false)
    }
  }

  const isNavActive = (nav: NavItem) => {
    if (nav.type === 'list' && selectedNav.type === 'list') {
      return nav.listId === selectedNav.listId
    }
    if (nav.type === 'tag' && selectedNav.type === 'tag') {
      return nav.tagId === selectedNav.tagId
    }
    return nav.type === selectedNav.type
  }

  const customLists = lists.filter(l => l.isDefault !== 1)

  const bg = theme === 'dark' ? '#1E1E1E' : '#ffffff'
  const border = theme === 'dark' ? '#333333' : '#e5e5e5'
  const textPrimary = theme === 'dark' ? '#E0E0E0' : '#1a1a1a'
  const textSecondary = theme === 'dark' ? '#888888' : '#666666'
  const textMuted = theme === 'dark' ? '#555555' : '#999999'
  const hoverBg = theme === 'dark' ? '#2a2a2a' : 'rgba(0,0,0,0.05)'
  const activeBg = theme === 'dark' ? '#2D4F7C' : '#E5F1FB'
  const activeColor = theme === 'dark' ? '#7EB3F7' : '#0078D4'

  return (
    <div
      className="w-60 flex flex-col h-full border-r flex-shrink-0 relative"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* 顶部标题 */}
      <div className="p-4 border-b" style={{ borderColor: border }}>
        <h1
          className="text-lg font-bold flex items-center gap-2"
          style={{ color: textPrimary }}
        >
          <span className="text-2xl">⚡</span>
          <span>ZTodo</span>
        </h1>
      </div>

      {/* 滚动区域 */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* 默认导航 */}
        {defaultNavs.map((nav) => (
          <button
            key={nav.type}
            onClick={() => onSelectNav(nav)}
            className="nav-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
            style={{
              color: isNavActive(nav) ? activeColor : textSecondary,
              backgroundColor: isNavActive(nav) ? activeBg : 'transparent',
              fontWeight: isNavActive(nav) ? 600 : 400
            }}
          >
            <span className="text-lg w-6 text-center">{nav.icon}</span>
            <span>{nav.label}</span>
            {nav.type === 'my-day' && (
              <span
                className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: '#FFF3CD', color: '#856404' }}
              >
                建议
              </span>
            )}
          </button>
        ))}

        {/* 标签 */}
        {tags.length > 0 && (
          <>
            <div className="mx-4 my-3" style={{ borderTop: `1px solid ${border}` }} />
            <div className="px-4 py-1 mb-1 flex items-center justify-between">
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: textMuted }}
              >
                标签
              </span>
              <button
                onClick={onOpenTagManager}
                className="text-xs hover:underline"
                style={{ color: textMuted }}
                title="管理标签"
              >
                ⚙️
              </button>
            </div>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onSelectNav({ type: 'tag', tagId: tag.id, label: tag.name, color: tag.color })}
                className="nav-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                style={{
                  color: isNavActive({ type: 'tag', tagId: tag.id, label: tag.name, color: tag.color }) ? activeColor : textSecondary,
                  backgroundColor: isNavActive({ type: 'tag', tagId: tag.id, label: tag.name, color: tag.color }) ? activeBg : 'transparent',
                  fontWeight: isNavActive({ type: 'tag', tagId: tag.id, label: tag.name, color: tag.color }) ? 600 : 400
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 truncate">{tag.name}</span>
              </button>
            ))}
          </>
        )}

        {/* 分割线 */}
        <div className="mx-4 my-3" style={{ borderTop: `1px solid ${border}` }} />

        {/* 我的列表 */}
        <div className="px-4 py-1 mb-1">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: textMuted }}
          >
            我的列表
          </span>
        </div>

        {customLists.map((list) => (
          <button
            key={list.id}
            onClick={() => onSelectNav({ type: 'list', listId: list.id, label: list.name, icon: list.icon })}
            onMouseEnter={() => setHoveredListId(list.id)}
            onMouseLeave={() => setHoveredListId(null)}
            className="nav-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
            style={{
              color: isNavActive({ type: 'list', listId: list.id, label: list.name, icon: list.icon }) ? activeColor : textSecondary,
              backgroundColor: isNavActive({ type: 'list', listId: list.id, label: list.name, icon: list.icon }) ? activeBg : 'transparent',
              fontWeight: isNavActive({ type: 'list', listId: list.id, label: list.name, icon: list.icon }) ? 600 : 400
            }}
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: list.color + '20' }}
            >
              {list.icon}
            </span>
            <span className="flex-1 truncate">{list.name}</span>
            {hoveredListId === list.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteList(list.id)
                }}
                className="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-red-100 transition-colors"
                style={{ color: '#ef4444' }}
              >
                ✕
              </button>
            )}
          </button>
        ))}

        {/* 添加列表 */}
        {isAddingList ? (
          <div className="px-3 py-2">
            <div
              className="rounded-lg border p-3 shadow-lg"
              style={{ backgroundColor: bg, borderColor: border }}
            >
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="列表名称"
                className="w-full px-2 py-1.5 text-sm rounded border focus:outline-none"
                style={{
                  borderColor: border,
                  backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                  color: textPrimary
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewListIcon(emoji)}
                    className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors"
                    style={{
                      backgroundColor: newListIcon === emoji ? activeBg : 'transparent',
                      outline: newListIcon === emoji ? `2px solid ${activeColor}` : 'none'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddList}
                  className="flex-1 text-white text-xs py-1.5 rounded font-medium transition-colors"
                  style={{ backgroundColor: activeColor }}
                >
                  添加
                </button>
                <button
                  onClick={() => setIsAddingList(false)}
                  className="flex-1 text-xs py-1.5 rounded font-medium transition-colors"
                  style={{ backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0', color: textSecondary }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="nav-item w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
            style={{ color: textMuted }}
          >
            <span className="text-lg w-6 text-center">➕</span>
            <span>添加列表</span>
          </button>
        )}

        {/* 分割线 */}
        <div className="mx-4 my-3" style={{ borderTop: `1px solid ${border}` }} />

        {/* 回收站 */}
        <button
          onClick={() => onSelectNav({ type: 'trash', label: '回收站', icon: '🗑️' })}
          className="nav-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
          style={{
            color: isNavActive({ type: 'trash', label: '回收站', icon: '🗑️' }) ? activeColor : textSecondary,
            backgroundColor: isNavActive({ type: 'trash', label: '回收站', icon: '🗑️' }) ? activeBg : 'transparent',
            fontWeight: isNavActive({ type: 'trash', label: '回收站', icon: '🗑️' }) ? 600 : 400
          }}
        >
          <span className="text-lg w-6 text-center">🗑️</span>
          <span>回收站</span>
          {trashCount > 0 && (
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
            >
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* 底部设置区 */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: border }}>
        {/* 排序选择 */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
            style={{ backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5', color: textSecondary }}
          >
            <span>📊</span>
            <span>
              排序：{sortBy === 'default' ? '默认' : sortBy === 'priority' ? '优先级' : '截止日期'}
            </span>
            <span className="ml-auto text-xs opacity-60">▾</span>
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div
                className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border shadow-lg z-20 overflow-hidden"
                style={{ backgroundColor: bg, borderColor: border }}
              >
                {[
                  { key: 'default', label: '📌 默认排序' },
                  { key: 'priority', label: '⭐ 按优先级' },
                  { key: 'date', label: '📅 按截止日期' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => { onSortByChange(item.key as any); setShowSortMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors"
                    style={{
                      backgroundColor: sortBy === item.key ? activeBg : 'transparent',
                      color: sortBy === item.key ? activeColor : textSecondary
                    }}
                  >
                    <span>{item.label}</span>
                    {sortBy === item.key && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 主题切换 */}
        <button
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5', color: textSecondary }}
        >
          <span className="text-base">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span>{theme === 'light' ? '暗色模式' : '浅色模式'}</span>
          <span className="ml-auto text-xs opacity-60">Ctrl+Shift+D</span>
        </button>

        <p className="text-center text-[10px]" style={{ color: textMuted }}>
          ZTodo v1.1 ⚡
        </p>
      </div>
    </div>
  )
}

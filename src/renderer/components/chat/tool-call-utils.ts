import {
  FileText, FileEdit, Trash2, FolderSearch, Terminal, Brain,
  Globe, ArrowRightLeft, Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ToolKind } from '@/types'

const kindIcons: Record<ToolKind, LucideIcon> = {
  read: FileText,
  edit: FileEdit,
  delete: Trash2,
  move: ArrowRightLeft,
  search: FolderSearch,
  execute: Terminal,
  think: Brain,
  fetch: Globe,
  switch_mode: ArrowRightLeft,
  other: Wrench,
}

export function getToolIcon(kind?: ToolKind, title?: string): LucideIcon {
  if (kind && kindIcons[kind]) return kindIcons[kind]
  const t = (title ?? '').toLowerCase()
  if (t.includes('bash') || t.includes('command') || t.includes('exec') || t.includes('shell')) return Terminal
  if (t.includes('read') || t.includes('cat') || t.includes('view')) return FileText
  if (t.includes('write') || t.includes('edit') || t.includes('patch')) return FileEdit
  if (t.includes('search') || t.includes('grep') || t.includes('find') || t.includes('glob')) return FolderSearch
  if (t.includes('fetch') || t.includes('web') || t.includes('http')) return Globe
  if (t.includes('think')) return Brain
  return Wrench
}

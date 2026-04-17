import { cn } from '@/lib/utils'
import type { AppSettings } from '@/types'
import { SectionHeader, SectionLabel, SettingsCard } from './settings-shared'
import ThemeSelector from './ThemeSelector'

const FONT_SIZE_MIN = 14
const FONT_SIZE_MAX = 18

interface AppearanceSectionProps {
  draft: AppSettings
  updateDraft: (patch: Partial<AppSettings>) => void
}

export const AppearanceSection = ({ draft, updateDraft }: AppearanceSectionProps) => (
  <>
    <SectionHeader section="appearance" />
    <div>
      <SectionLabel title="Theme" />
      <SettingsCard className="!py-4">
        <ThemeSelector
          value={draft.theme ?? 'dark'}
          onChange={(mode) => updateDraft({ theme: mode })}
        />
      </SettingsCard>
    </div>

    <div>
      <SectionLabel title="Font size" />
      <SettingsCard className="!py-4">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{FONT_SIZE_MIN}</span>
          <input
            type="range"
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step={1}
            value={draft.fontSize ?? 14}
            onChange={(e) => updateDraft({ fontSize: Number(e.target.value) })}
            aria-label="Font size"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border/60 accent-primary [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
          />
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{FONT_SIZE_MAX}</span>
          <span className="min-w-[3ch] text-center text-sm font-semibold tabular-nums text-primary">{draft.fontSize ?? 14}</span>
        </div>
        <div className="mt-3 rounded-lg border border-border/60 bg-background/50 px-4 py-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Preview</p>
          <p className="text-foreground/80 leading-relaxed" style={{ fontSize: draft.fontSize }}>The quick brown fox jumps over the lazy dog</p>
        </div>
      </SettingsCard>
    </div>

    <div>
      <SectionLabel title="Layout" />
      <SettingsCard className="!py-4">
        <label className="mb-1.5 block text-[12px] font-medium text-foreground/70">Sidebar position</label>
        <div className="flex gap-2">
          {(['left', 'right'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => updateDraft({ sidebarPosition: pos })}
              className={cn(
                'flex-1 rounded-lg border py-2.5 text-center text-xs font-medium capitalize transition-colors',
                (draft.sidebarPosition ?? 'left') === pos
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </SettingsCard>
    </div>
  </>
)

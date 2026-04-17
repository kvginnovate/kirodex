import { SectionHeader, SectionLabel } from './settings-shared'
import { DeletedThreadsRestore } from './deleted-threads-restore'

export const ArchivesSection = () => (
  <>
    <SectionHeader section="archives" />
    <div>
      <SectionLabel title="Deleted threads" />
      <DeletedThreadsRestore />
    </div>
  </>
)

import type { Chapter } from '../../content/types'

export function ChapterHeading({ chapter }: { chapter: Chapter }) {
  return (
    <div className="chapter" style={{ ['--accent' as string]: chapter.accent }}>
      <span className="chapter-num">{chapter.num}</span>
      <h2 className="chapter-title">{chapter.title}</h2>
      <span className="chapter-line" aria-hidden="true" />
    </div>
  )
}

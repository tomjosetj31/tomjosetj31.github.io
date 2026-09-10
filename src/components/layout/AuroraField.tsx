/** The fixed aurora backdrop. Purely decorative and never interactive. */
export function AuroraField() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <span className="aurora-bloom aurora-bloom-1" />
      <span className="aurora-bloom aurora-bloom-2" />
      <span className="aurora-bloom aurora-bloom-3" />
    </div>
  )
}

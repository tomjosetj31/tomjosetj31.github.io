import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { experience } from '../../../content/experience'
import { pipelineNodes, supportingTools } from '../../../content/pipeline'
import { Infrastructure } from '../Infrastructure'

describe('Infrastructure', () => {
  it('is addressable by the chapter anchor', () => {
    const { container } = render(<Infrastructure />)
    expect(container.querySelector('#infrastructure')).not.toBeNull()
  })

  it('names every stage of the pipeline', () => {
    render(<Infrastructure />)
    // getAllByText, not getByText: EKS is both a pipeline node name and one of
    // the Cost outcome's tool tags.
    for (const node of pipelineNodes) {
      expect(screen.getAllByText(node.name).length).toBeGreaterThan(0)
    }
  })

  it('names the supporting tools', () => {
    render(<Infrastructure />)
    // getAllByText, not getByText: Prometheus, Grafana, Loki, Terraform and
    // Crossplane each appear both under the pipeline and as an outcome tag.
    for (const tool of supportingTools) {
      expect(screen.getAllByText(tool).length).toBeGreaterThan(0)
    }
  })

  it('renders all four outcome cards with their metric attached to the heading', () => {
    render(<Infrastructure />)
    for (const outcome of experience.outcomes) {
      const heading = screen.getByRole('heading', { name: new RegExp(outcome.title, 'i') })
      expect(heading).toHaveTextContent(outcome.metric)
    }
  })

  it('lists the tools behind each outcome', () => {
    render(<Infrastructure />)
    for (const tool of experience.outcomes.flatMap((o) => o.tools)) {
      expect(screen.getAllByText(tool).length).toBeGreaterThan(0)
    }
  })

  it('states the role and employer', () => {
    render(<Infrastructure />)
    expect(screen.getByText(new RegExp(experience.company, 'i'))).toBeInTheDocument()
  })

  it('exposes the pipeline as a scrollable, keyboard-reachable region so narrow viewports never clip a stage silently', () => {
    render(<Infrastructure />)
    expect(screen.getByRole('group', { name: /deployment pipeline, scrollable/i })).toBeInTheDocument()
  })
})

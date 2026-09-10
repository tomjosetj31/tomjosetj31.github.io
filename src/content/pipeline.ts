import type { PipelineNode } from './types'

export const pipelineNodes: PipelineNode[] = [
  { name: 'GIT', detail: 'github · gitlab' },
  { name: 'CI', detail: 'actions · gitlab-ci' },
  { name: 'ECR', detail: 'image registry' },
  { name: 'ARGOCD', detail: 'gitops · helm' },
  { name: 'EKS', detail: 'karpenter' },
]

/** Rendered beneath the flow, under a dashed rule. */
export const supportingTools = ['Prometheus', 'Grafana', 'Loki', 'Terraform', 'Crossplane']

/** The diagram's figure caption, top-left. */
export const pipelineCaption = 'Fig. 01 — Delivery path in production'

/** The diagram's status word, top-right. */
export const pipelineStatus = 'Live'

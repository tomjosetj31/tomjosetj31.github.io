import type { Education, Experience } from './types'

export const experience: Experience = {
  role: 'DevOps Engineer',
  company: 'Kotaicode GmbH',
  location: 'Frankfurt, Germany',
  period: '05/2021 — present',
  startedAt: '2021-05-01',
  outcomes: [
    {
      title: 'Delivery',
      metric: '−40% deploy time',
      body: 'Built and maintained the CI/CD pipelines behind multi-environment releases, with automated testing gates on every merge.',
      tools: ['GitHub Actions', 'GitLab CI', 'Helm'],
    },
    {
      title: 'Cost',
      metric: '−30% AWS spend',
      body: 'Cost Explorer analysis plus dynamic node provisioning with Karpenter — right-sizing capacity to actual demand.',
      tools: ['Karpenter', 'Cost Explorer', 'EKS'],
    },
    {
      title: 'Reliability',
      metric: 'faster MTTR',
      body: 'Metrics, dashboards and log aggregation with alerting that catches regressions before customers report them.',
      tools: ['Prometheus', 'Grafana', 'Loki'],
    },
    {
      title: 'Provisioning',
      metric: 'GitOps',
      body: 'Infrastructure lifecycle as code and declarative deployments — reproducible environments and reliable rollbacks.',
      tools: ['Terraform', 'Crossplane', 'ArgoCD'],
    },
  ],
}

export const education: Education = {
  degree: 'Bachelor of Technology',
  institution: 'Govt. Engineering College Palakkad',
  location: 'Palakkad, India',
  period: '08/2016 — 09/2020',
}

import type { Product } from './types'

export const products: Product[] = [
  {
    slug: 'spaceload',
    name: 'spaceload',
    tagline:
      'A macOS CLI that records and replays your entire dev environment — browser tabs, VPN, IDE, terminals.',
    problem:
      'Context-switching costs you twenty minutes of setup every time. `spaceload run` gets it back.',
    status: 'shipped',
    stack: ['Python 3.11', 'CLI', 'Homebrew tap', 'MIT'],
    install: {
      label: 'Install',
      command: 'brew install tomjosetj31/spaceload/spaceload',
    },
    links: [
      { label: 'Repo', href: 'https://github.com/tomjosetj31/spaceload' },
      { label: 'PyPI', href: 'https://pypi.org/project/spaceload/' },
    ],
    stars: 3,
    featured: true,
  },
  {
    slug: 'k8s-resource-booking-operator',
    name: 'K8s Resource Booking Operator',
    tagline:
      'A custom Kubernetes operator that schedules cloud instances against time-bound bookings.',
    problem:
      'Idle dev clusters burn money overnight. Tag it, book it, and the operator starts and stops it — without double-booking.',
    status: 'live',
    stack: ['Golang', 'Kubernetes CRDs', 'Kubernetes API'],
    links: [
      { label: 'Write-up', href: 'https://kotaico.de/resource-booking-operator/' },
    ],
  },
  {
    slug: 'cronochat',
    name: 'Cronochat',
    tagline:
      'A Slack app for scheduled, recurring, broadcast and anonymous messages.',
    problem:
      'Team announcements get forgotten or repeated by hand. Cronochat schedules them once and keeps information flowing.',
    status: 'shipped',
    stack: ['Slack API', 'Python', 'Scheduling'],
    links: [
      {
        label: 'Introduction',
        href: 'https://medium.com/@Tomjosetj31/introducing-cronochat-supercharge-your-slack-with-recurring-scheduled-broadcast-and-anonymous-107a2dfa25a8',
      },
    ],
  },
]

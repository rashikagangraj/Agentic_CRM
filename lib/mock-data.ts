export interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: string
  value: number
  source: string
}

export const initialLeads: Lead[] = [
  {
    id: "1",
    name: "Alice Johnson",
    company: "Tech Startup Inc",
    email: "alice@techstartup.com",
    phone: "+1 555-0101",
    status: "new",
    value: 15000,
    source: "Website",
  },
  {
    id: "2",
    name: "Bob Williams",
    company: "Global Solutions",
    email: "bob@globalsolutions.com",
    phone: "+1 555-0102",
    status: "contacted",
    value: 25000,
    source: "Referral",
  },
  {
    id: "3",
    name: "Carol Martinez",
    company: "Innovation Labs",
    email: "carol@innovationlabs.com",
    phone: "+1 555-0103",
    status: "qualified",
    value: 50000,
    source: "LinkedIn",
  },
  {
    id: "4",
    name: "David Lee",
    company: "Enterprise Corp",
    email: "david@enterprisecorp.com",
    phone: "+1 555-0104",
    status: "proposal",
    value: 75000,
    source: "Conference",
  },
  {
    id: "5",
    name: "Emma Davis",
    company: "Future Systems",
    email: "emma@futuresystems.com",
    phone: "+1 555-0105",
    status: "closed",
    value: 40000,
    source: "Website",
  },
]

export interface ContentItem {
  id: string
  title: string
  content: string
  channel: string
  status: string
  scheduledAt: string | null
  createdAt: string
}

export const initialContentItems: ContentItem[] = [
  {
    id: "1",
    title: "New Year Sale Announcement",
    content: "Start the year right with amazing deals...",
    channel: "whatsapp",
    status: "approved",
    scheduledAt: "Jan 1, 2026, 10:00 AM",
    createdAt: "Dec 5, 2025",
  },
  {
    id: "2",
    title: "Product Launch Teaser",
    content: "Something exciting is coming...",
    channel: "instagram",
    status: "pending",
    scheduledAt: null,
    createdAt: "Dec 6, 2025",
  },
  {
    id: "3",
    title: "Customer Success Story",
    content: "See how Company X grew 200%...",
    channel: "facebook",
    status: "draft",
    scheduledAt: null,
    createdAt: "Dec 7, 2025",
  },
  {
    id: "4",
    title: "Holiday Greetings",
    content: "Wishing you a wonderful holiday season...",
    channel: "twitter",
    status: "published",
    scheduledAt: null,
    createdAt: "Dec 1, 2025",
  },
]

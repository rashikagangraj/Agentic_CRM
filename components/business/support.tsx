"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Send,
  Users,
  HeadphonesIcon,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const customerTickets = [
  {
    id: "TKT-001",
    customer: "Alice Johnson",
    subject: "Payment issue",
    description: "Unable to process payment for order #12345",
    status: "open",
    priority: "high",
    createdAt: "Dec 6, 2025",
  },
  {
    id: "TKT-002",
    customer: "Bob Williams",
    subject: "Service inquiry",
    description: "Questions about the premium package",
    status: "in-progress",
    priority: "medium",
    createdAt: "Dec 5, 2025",
  },
  {
    id: "TKT-003",
    customer: "Carol Martinez",
    subject: "Technical support",
    description: "App not loading correctly on mobile",
    status: "resolved",
    priority: "low",
    createdAt: "Dec 4, 2025",
  },
]

const adminTickets = [
  {
    id: "ADM-001",
    subject: "API integration issue",
    description: "WhatsApp API not responding",
    status: "open",
    priority: "high",
    createdAt: "Dec 6, 2025",
  },
  {
    id: "ADM-002",
    subject: "Billing discrepancy",
    description: "Incorrect charges on monthly invoice",
    status: "in-progress",
    priority: "medium",
    createdAt: "Dec 3, 2025",
  },
]

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supportTicketSchema, type SupportTicketFormData } from "@/lib/schemas"
import { toast } from "sonner"
import { useState } from "react"

export function BusinessSupport() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [customerTicketList, setCustomerTicketList] = useState(customerTickets)
  const [selectedCustomerTicket, setSelectedCustomerTicket] = useState<(typeof customerTickets)[number] | null>(null)
  const [selectedAdminTicket, setSelectedAdminTicket] = useState<(typeof adminTickets)[number] | null>(null)
  const [replyingTo, setReplyingTo] = useState<(typeof customerTickets)[number] | null>(null)
  const [replyText, setReplyText] = useState("")

  const markResolved = (id: string) => {
    setCustomerTicketList((current) => current.map((t) => (t.id === id ? { ...t, status: "resolved" } : t)))
    toast.success("Ticket marked as resolved")
  }

  const sendReply = () => {
    toast.success("Reply sent")
    setReplyText("")
    setReplyingTo(null)
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketSchema),
  })

  const onSubmit = (data: SupportTicketFormData) => {
    // Here you would typically send data to your backend
    console.log("Submitting ticket:", data)
    toast.success("Support ticket created successfully!")
    reset()
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Manage customer support and admin tickets">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Raise a new ticket to Admin support</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of the issue"
                    {...register("subject")}
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-500">{errors.subject.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select onValueChange={(value) => setValue("priority", value as "low" | "medium" | "high")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-red-500">{errors.priority.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of your issue..."
                    rows={4}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Submit Ticket</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Open Tickets" value="5" icon={MessageSquare} description="awaiting response" />
        <StatCard title="In Progress" value="3" icon={Clock} description="being resolved" />
        <StatCard title="Resolved Today" value="8" icon={CheckCircle2} description="tickets closed" />
        <StatCard title="Avg. Response Time" value="2.5h" icon={HeadphonesIcon} description="first response" />
      </div>

      <Tabs defaultValue="customer" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Tickets
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4" />
              Admin Tickets
            </TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tickets..." className="pl-9 w-64" />
          </div>
        </div>

        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <CardTitle>Customer Support Tickets</CardTitle>
              <CardDescription>Support requests from your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerTicketList.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.customer)}&background=random`} />
                        <AvatarFallback>
                          {ticket.customer
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{ticket.subject}</p>
                          <StatusBadge
                            status={ticket.priority}
                            variant={
                              ticket.priority === "high" ? "error" : ticket.priority === "medium" ? "warning" : "info"
                            }
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ticket.customer} · {ticket.id}
                        </p>
                        <p className="text-sm mt-1 line-clamp-1">{ticket.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <StatusBadge
                          status={ticket.status.replace("-", " ")}
                          variant={
                            ticket.status === "resolved"
                              ? "success"
                              : ticket.status === "in-progress"
                                ? "warning"
                                : "info"
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">{ticket.createdAt}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedCustomerTicket(ticket)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReplyingTo(ticket)}>
                            <Send className="mr-2 h-4 w-4" />
                            Reply
                          </DropdownMenuItem>
                          {ticket.status !== "resolved" && (
                            <DropdownMenuItem onClick={() => markResolved(ticket.id)}>
                              Mark as Resolved
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin Support Tickets</CardTitle>
              <CardDescription>Your tickets to platform admin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${ticket.status === "open" ? "bg-blue-500/10" : "bg-yellow-500/10"}`}
                      >
                        <AlertCircle
                          className={`h-5 w-5 ${ticket.status === "open" ? "text-blue-500" : "text-yellow-500"}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{ticket.subject}</p>
                          <StatusBadge
                            status={ticket.priority}
                            variant={
                              ticket.priority === "high" ? "error" : ticket.priority === "medium" ? "warning" : "info"
                            }
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{ticket.id}</p>
                        <p className="text-sm mt-1">{ticket.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <StatusBadge
                          status={ticket.status.replace("-", " ")}
                          variant={ticket.status === "open" ? "info" : "warning"}
                        />
                        <p className="text-xs text-muted-foreground mt-1">{ticket.createdAt}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedAdminTicket(ticket)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedCustomerTicket}
        onOpenChange={(open) => !open && setSelectedCustomerTicket(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCustomerTicket?.subject}</DialogTitle>
            <DialogDescription>{selectedCustomerTicket?.id}</DialogDescription>
          </DialogHeader>
          {selectedCustomerTicket && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{selectedCustomerTicket.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium capitalize">{selectedCustomerTicket.priority}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge
                  status={selectedCustomerTicket.status.replace("-", " ")}
                  variant={
                    selectedCustomerTicket.status === "resolved"
                      ? "success"
                      : selectedCustomerTicket.status === "in-progress"
                        ? "warning"
                        : "info"
                  }
                />
              </div>
              <p className="text-muted-foreground pt-2">{selectedCustomerTicket.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to {replyingTo?.customer}</DialogTitle>
            <DialogDescription>{replyingTo?.subject}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Write your reply..."
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={sendReply}>Send Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAdminTicket} onOpenChange={(open) => !open && setSelectedAdminTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAdminTicket?.subject}</DialogTitle>
            <DialogDescription>{selectedAdminTicket?.id}</DialogDescription>
          </DialogHeader>
          {selectedAdminTicket && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium capitalize">{selectedAdminTicket.priority}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge
                  status={selectedAdminTicket.status.replace("-", " ")}
                  variant={selectedAdminTicket.status === "open" ? "info" : "warning"}
                />
              </div>
              <p className="text-muted-foreground pt-2">{selectedAdminTicket.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

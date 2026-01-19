import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Search,
  LayoutDashboard,
  Wrench,
  Calendar,
  Users,
  MapPin,
  Thermometer,
  FileText,
  Receipt,
  BarChart3,
  Package,
  UserCog,
  RefreshCw,
  Key,
  Smartphone,
  HelpCircle,
  BookOpen,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Wifi,
  WifiOff,
  Camera,
  PenTool,
  Download,
  Mail,
  Phone,
} from "lucide-react";

const helpSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    description: "Learn the basics of the Craven Cooling FSM system",
    content: [
      {
        title: "Welcome to Craven Cooling FSM",
        body: "The Craven Cooling Field Service Management system is a comprehensive platform designed to streamline your refrigeration and HVAC field operations. This system helps you manage jobs, customers, assets, scheduling, and much more from a single unified interface."
      },
      {
        title: "System Overview",
        body: "The system consists of three main applications: the Office Panel for dispatchers and administrators, the Engineer Mobile App for field technicians, and the Customer Portal for your clients. Each application is tailored to the specific needs of its users while sharing the same underlying data."
      },
      {
        title: "First Steps",
        body: "After logging in, you'll land on the Dashboard which provides an overview of your operations. From here, you can navigate to different sections using the sidebar menu. We recommend starting by setting up your customers, sites, and assets before creating jobs."
      },
      {
        title: "User Roles",
        body: "The system supports three user roles: Admin (full access to all features including user management), Dispatcher (day-to-day operations, scheduling, and customer management), and Engineer (mobile app access for field work). Your role determines which features you can access."
      }
    ]
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Understanding your operational overview",
    content: [
      {
        title: "Dashboard Overview",
        body: "The Dashboard provides a real-time snapshot of your field service operations. It displays key metrics including pending jobs, jobs in progress, completed jobs this week, and outstanding invoice amounts. Use this page to quickly assess your operational status."
      },
      {
        title: "Urgent Alerts",
        body: "When there are urgent jobs requiring immediate attention, an alert banner appears at the top of the dashboard. Click 'View Urgent Jobs' to see all high-priority breakdowns that need action."
      },
      {
        title: "Recent Pending Jobs",
        body: "The main panel shows your most recent pending jobs with customer information, priority level, and job type. Click on any job card to view its full details and take action."
      },
      {
        title: "PM Due Widget",
        body: "The PM Due sidebar shows assets that are due for preventative maintenance. This helps you stay on top of scheduled maintenance and ensures compliance with service contracts."
      },
      {
        title: "Quick Stats",
        body: "The bottom row displays total counts for customers, assets, jobs, and PM due items, giving you a high-level view of your business scale."
      }
    ]
  },
  {
    id: "jobs",
    title: "Job Management",
    icon: Wrench,
    description: "Creating, managing, and completing work orders",
    content: [
      {
        title: "Jobs Overview",
        body: "The Jobs page is the central hub for managing all work orders. You can view, filter, search, and create new jobs from this page. Jobs can be breakdowns, PM services, installations, or quote visits."
      },
      {
        title: "Creating a New Job",
        body: "Click the 'New Job' button to create a work order. Select the customer first, then choose the site (locations are filtered by customer). Optionally select specific assets at the site. Fill in the job type, priority, description, and optionally assign an engineer and schedule the work."
      },
      {
        title: "Job Priorities",
        body: "Jobs have four priority levels: Urgent (red) for emergency breakdowns requiring immediate response, High (orange) for important but not critical work, Medium (blue) for standard jobs, and Low (gray) for non-urgent tasks that can be scheduled flexibly."
      },
      {
        title: "Job Statuses",
        body: "Jobs progress through several statuses: Pending (awaiting action), Travelling (engineer en route), In Progress (work being performed), Completed (work finished), and Cancelled. Status changes are logged in the job's event timeline."
      },
      {
        title: "Filtering and Searching",
        body: "Use the filter dropdowns to narrow down jobs by status, priority, type, or assigned engineer. The search box allows you to find jobs by job number, description, or customer name."
      },
      {
        title: "Job Details",
        body: "Click on any job to view its full details including customer and site information, assigned assets, description, timeline of events, photos, and completion information. From here you can also generate a PDF report."
      },
      {
        title: "SLA Tracking",
        body: "When creating a job, you can set an SLA (Service Level Agreement) in hours. This helps track response times and ensures you meet contractual obligations with customers."
      }
    ]
  },
  {
    id: "scheduler",
    title: "Scheduler",
    icon: Calendar,
    description: "Visual calendar for job scheduling",
    content: [
      {
        title: "Calendar Overview",
        body: "The Scheduler provides a visual calendar interface for managing job schedules. View jobs by month, week, or day to get different perspectives on your workload and engineer availability."
      },
      {
        title: "Viewing Scheduled Jobs",
        body: "Jobs appear as colored blocks on the calendar based on their scheduled date and time. The color indicates the job priority, making it easy to spot urgent work at a glance."
      },
      {
        title: "Drag and Drop Scheduling",
        body: "You can reschedule jobs by dragging them to a new date or time slot. This makes it easy to adjust schedules when priorities change or engineers become unavailable."
      },
      {
        title: "Creating Jobs from Calendar",
        body: "Click on any empty time slot to create a new job scheduled for that date and time. This is a quick way to schedule work while viewing availability."
      },
      {
        title: "Engineer Filtering",
        body: "Filter the calendar by engineer to see individual workloads. This helps with load balancing and identifying available capacity for new jobs."
      }
    ]
  },
  {
    id: "customers",
    title: "Customers",
    icon: Users,
    description: "Managing customer information",
    content: [
      {
        title: "Customer Management",
        body: "The Customers page allows you to manage all your client organizations. Each customer can have multiple sites and assets associated with them."
      },
      {
        title: "Adding a Customer",
        body: "Click 'New Customer' to add a client. Enter the company name, billing address, phone number, email, and any relevant notes. The company name is required; other fields are optional but recommended."
      },
      {
        title: "Customer Details",
        body: "Click on a customer to view their full profile including all associated sites, assets, job history, quotes, and invoices. This gives you a complete picture of your relationship with each client."
      },
      {
        title: "Searching Customers",
        body: "Use the search box to quickly find customers by company name, email, or phone number. This is useful when you need to look up a customer during a phone call."
      }
    ]
  },
  {
    id: "sites",
    title: "Sites",
    icon: MapPin,
    description: "Managing service locations",
    content: [
      {
        title: "Site Management",
        body: "Sites represent physical locations where you perform service work. Each site belongs to a customer and can contain multiple assets (equipment)."
      },
      {
        title: "Adding a Site",
        body: "Click 'New Site' and select the customer first. Enter the site name, full address, and important access information like key locations, access codes, and opening hours. Include a contact name and phone for the site."
      },
      {
        title: "Access Notes",
        body: "The access notes field is crucial for engineers. Include information about parking, security procedures, key safe locations, alarm codes, and any special instructions for accessing the site."
      },
      {
        title: "Site Assets",
        body: "From a site's detail view, you can see all equipment installed at that location. This helps when scheduling maintenance or responding to breakdowns."
      }
    ]
  },
  {
    id: "assets",
    title: "Assets",
    icon: Thermometer,
    description: "Equipment and asset tracking",
    content: [
      {
        title: "Asset Management",
        body: "Assets are the equipment you service, such as refrigeration units, air conditioning systems, and cold rooms. Tracking assets helps you manage maintenance schedules and service history."
      },
      {
        title: "Adding an Asset",
        body: "Click 'New Asset' and select the site where the equipment is installed. Enter the asset name, make, model, and serial number. Include installation date and warranty expiry for tracking purposes."
      },
      {
        title: "Refrigerant Information",
        body: "For refrigeration equipment, record the refrigerant type (e.g., R404A, R410A) and charge amount. This information is important for compliance and service planning."
      },
      {
        title: "PM Intervals",
        body: "Set the PM (Preventative Maintenance) interval in months for each asset. The system will automatically track when maintenance is due and can generate PM jobs automatically."
      },
      {
        title: "Service History",
        body: "View an asset's complete service history including all jobs performed, parts replaced, and engineer notes. This helps diagnose recurring issues and plan future maintenance."
      }
    ]
  },
  {
    id: "pm-automation",
    title: "PM Automation",
    icon: RefreshCw,
    description: "Automated preventative maintenance scheduling",
    content: [
      {
        title: "PM Automation Overview",
        body: "The PM Automation feature automatically tracks when assets are due for preventative maintenance based on their configured PM intervals. This ensures you never miss scheduled maintenance."
      },
      {
        title: "PM Status Dashboard",
        body: "The PM Automation page shows three categories: Overdue (past due date), Due This Week, and Due This Month. Each category shows the count of assets requiring attention."
      },
      {
        title: "Generating PM Jobs",
        body: "Click 'Generate PM Jobs' to automatically create work orders for all assets that are due for maintenance. The system creates jobs with type 'PM Service' and marks them as auto-generated."
      },
      {
        title: "PM Completion",
        body: "When a PM job is completed, the system automatically updates the asset's last service date and calculates the next PM due date based on the interval. This closes the maintenance loop."
      },
      {
        title: "Configuring PM Intervals",
        body: "Set PM intervals on individual assets in the Assets section. Common intervals are 3, 6, or 12 months depending on equipment type and customer contracts."
      }
    ]
  },
  {
    id: "quotes",
    title: "Quotes",
    icon: FileText,
    description: "Creating and managing quotations",
    content: [
      {
        title: "Quote Management",
        body: "Create professional quotations for customers directly in the system. Quotes can be converted to jobs and invoices, maintaining a complete audit trail."
      },
      {
        title: "Creating a Quote",
        body: "Click 'New Quote' and select the customer and site. Add line items with descriptions, quantities, and unit prices. The system automatically calculates subtotals, VAT (20%), and the total amount."
      },
      {
        title: "Quote Statuses",
        body: "Quotes progress through statuses: Draft (being prepared), Sent (delivered to customer), Accepted (customer approved), Rejected (customer declined), and Expired (validity period passed)."
      },
      {
        title: "Validity Period",
        body: "Set the number of days the quote is valid. This helps manage customer expectations and allows you to track quotes that need follow-up."
      },
      {
        title: "PDF Generation",
        body: "Generate professional PDF quotes with your company branding. These can be emailed to customers or printed for in-person delivery."
      }
    ]
  },
  {
    id: "invoices",
    title: "Invoices",
    icon: Receipt,
    description: "Billing and invoice management",
    content: [
      {
        title: "Invoice Management",
        body: "Create and track invoices for completed work. Invoices can be linked to jobs for complete traceability from work order to payment."
      },
      {
        title: "Creating an Invoice",
        body: "Click 'New Invoice' and select the customer, site, and optionally link to a completed job. Add line items for labor, parts, and other charges. VAT is calculated automatically."
      },
      {
        title: "Invoice Statuses",
        body: "Invoices have statuses: Draft (being prepared), Sent (delivered to customer), Paid (payment received), and Overdue (past due date). Track outstanding amounts from the dashboard."
      },
      {
        title: "Payment Terms",
        body: "Set payment terms (days until due) when creating invoices. Common terms are 14, 30, or 60 days depending on customer agreements."
      },
      {
        title: "PDF Generation",
        body: "Generate professional PDF invoices with your company details, bank information, and payment instructions. These can be emailed directly to customers."
      }
    ]
  },
  {
    id: "reports",
    title: "Reports",
    icon: BarChart3,
    description: "Analytics and business intelligence",
    content: [
      {
        title: "Reports Overview",
        body: "The Reports section provides analytics and insights into your field service operations. Use these reports to identify trends, measure performance, and make data-driven decisions."
      },
      {
        title: "Jobs by Status",
        body: "View the distribution of jobs across different statuses. This helps identify bottlenecks in your workflow and areas needing attention."
      },
      {
        title: "Jobs by Engineer",
        body: "See workload distribution across your engineering team. Use this to balance assignments and identify capacity for new work."
      },
      {
        title: "PM Due List",
        body: "A comprehensive list of all assets due for preventative maintenance, sorted by due date. Export this list for planning and scheduling purposes."
      },
      {
        title: "Revenue Charts",
        body: "Track invoiced amounts over time to understand revenue trends. Filter by date range to analyze specific periods."
      }
    ]
  },
  {
    id: "parts",
    title: "Parts Inventory",
    icon: Package,
    description: "Managing parts and stock levels",
    content: [
      {
        title: "Parts Management",
        body: "Track your parts inventory including stock levels, pricing, and usage. Parts can be logged against jobs when used during service work."
      },
      {
        title: "Adding Parts",
        body: "Click 'New Part' to add items to your inventory. Enter the part name, part number, description, unit price, current stock quantity, and minimum stock level for reorder alerts."
      },
      {
        title: "Stock Tracking",
        body: "The system tracks stock levels as parts are used on jobs. When stock falls below the minimum level, you'll be alerted to reorder."
      },
      {
        title: "Parts on Jobs",
        body: "When completing a job, engineers can log parts used. This automatically updates inventory and adds the parts to the job record for invoicing."
      },
      {
        title: "Pricing",
        body: "Set unit prices for parts to ensure accurate invoicing. Prices can be updated as supplier costs change."
      }
    ]
  },
  {
    id: "users",
    title: "User Management",
    icon: UserCog,
    description: "Managing system users and access",
    content: [
      {
        title: "User Management Overview",
        body: "Administrators can manage system users including creating new accounts, assigning roles, and deactivating access. This section is only available to users with the Admin role."
      },
      {
        title: "Creating Users",
        body: "Click 'New User' to create an account. Enter the user's name, email address, password, and assign a role (Admin, Dispatcher, or Engineer)."
      },
      {
        title: "User Roles",
        body: "Admin users have full system access. Dispatchers can manage day-to-day operations but cannot access user management. Engineers have access to the mobile app for field work."
      },
      {
        title: "Engineer Assignments",
        body: "Only users with the Engineer role appear in the engineer assignment dropdown when creating or editing jobs. Ensure field technicians have this role."
      }
    ]
  },
  {
    id: "customer-portal",
    title: "Customer Portal",
    icon: Key,
    description: "Customer self-service portal management",
    content: [
      {
        title: "Portal Overview",
        body: "The Customer Portal allows your clients to view their service information without contacting your office. They can see sites, assets, service history, upcoming PM schedules, and invoices."
      },
      {
        title: "Granting Access",
        body: "From the Portal Access page, click 'Grant Access' and select a customer. Enter the contact's name and email. The system generates a unique access code that you share with the customer."
      },
      {
        title: "Access Codes",
        body: "Customers log in using their email and access code (not a password). Access codes are shown only once when created, so make sure to share them securely with the customer."
      },
      {
        title: "Revoking Access",
        body: "If a customer contact leaves or access needs to be removed, you can revoke their portal access from the Portal Access management page."
      },
      {
        title: "Portal Features",
        body: "Customers can view their dashboard with service overview, list of sites and assets, complete service history, upcoming PM schedule with overdue flags, and invoice history."
      }
    ]
  },
  {
    id: "engineer-app",
    title: "Engineer Mobile App",
    icon: Smartphone,
    description: "Mobile application for field engineers",
    content: [
      {
        title: "Mobile App Overview",
        body: "The Engineer Mobile App is a mobile-optimized interface designed for field technicians. It provides access to assigned jobs, job details, and the ability to complete work orders from the field."
      },
      {
        title: "Accessing the App",
        body: "Engineers access the mobile app by navigating to /engineer or clicking 'Engineer App' in the sidebar. The app works on phones and tablets with a touch-friendly interface."
      },
      {
        title: "Viewing Assigned Jobs",
        body: "The Jobs list shows all jobs assigned to the logged-in engineer. Jobs are sorted by priority and scheduled date, with urgent jobs highlighted for attention."
      },
      {
        title: "Job Details",
        body: "Tap a job to view full details including customer information, site address with access notes, asset information, and job description. Use this information to prepare for the service call."
      },
      {
        title: "Starting Work",
        body: "Use the status buttons to update job progress: 'Start Travel' when leaving for the site, 'Arrive' when on-site, and 'Complete' when work is finished."
      },
      {
        title: "Completing Jobs",
        body: "When completing a job, enter your engineer notes describing the work performed, log any parts used, and capture the customer's signature. This information is saved to the job record."
      },
      {
        title: "Photo Documentation",
        body: "Take photos during the job to document equipment condition, work performed, or issues found. Photos are uploaded and attached to the job record."
      },
      {
        title: "Offline Capability",
        body: "The app works offline, allowing engineers to view job information and complete work even without internet connectivity. Data syncs automatically when connection is restored."
      }
    ]
  },
  {
    id: "offline",
    title: "Offline Mode",
    icon: WifiOff,
    description: "Working without internet connectivity",
    content: [
      {
        title: "Offline Support",
        body: "The system includes offline support for field engineers who may work in areas with poor connectivity. Essential data is cached locally so work can continue without internet access."
      },
      {
        title: "What Works Offline",
        body: "When offline, engineers can view their assigned jobs, see customer and site information, view asset details, and complete job sheets. All actions are queued for sync when online."
      },
      {
        title: "Offline Indicator",
        body: "The app displays an offline indicator when internet connectivity is lost. This helps engineers know when they're working with cached data."
      },
      {
        title: "Data Synchronization",
        body: "When connectivity is restored, the app automatically syncs any offline changes to the server. This includes job status updates, completion data, and photos."
      },
      {
        title: "Preparing for Offline Work",
        body: "Before going to areas with poor connectivity, open the jobs you'll be working on while online. This ensures the data is cached and available offline."
      }
    ]
  }
];

const faqItems = [
  {
    question: "How do I reset my password?",
    answer: "Contact your system administrator to reset your password. They can update your account from the Users management section."
  },
  {
    question: "Why can't I see certain menu items?",
    answer: "Menu visibility depends on your user role. Dispatchers don't see User Management, and Engineers only have access to the mobile app. Contact your admin if you need additional access."
  },
  {
    question: "How do I assign a job to an engineer?",
    answer: "When creating or editing a job, use the 'Assign Engineer' dropdown to select from available engineers. Only users with the Engineer role appear in this list."
  },
  {
    question: "Can I change a job's status manually?",
    answer: "Job statuses are typically updated through the workflow (Start Travel, Arrive, Complete). However, you can view and manage job details from the Jobs page."
  },
  {
    question: "How do PM jobs get created automatically?",
    answer: "Go to PM Automation and click 'Generate PM Jobs'. The system scans all assets with PM intervals and creates jobs for those that are due. You can also set up scheduled automation."
  },
  {
    question: "Why isn't my customer showing in the dropdown?",
    answer: "Ensure the customer has been created in the Customers section first. The dropdown only shows existing customers. Check for typos in your search."
  },
  {
    question: "How do I generate a PDF report for a job?",
    answer: "Open the job details page and click the 'Download PDF' or 'Generate Report' button. The PDF includes all job information, completion notes, and signature."
  },
  {
    question: "Can customers see all their invoices in the portal?",
    answer: "Yes, customers with portal access can view all invoices associated with their account. They can see invoice details but cannot make payments through the portal."
  },
  {
    question: "What happens to offline data if I log out?",
    answer: "Offline data is stored locally and will sync when you log back in and have connectivity. However, it's best to sync before logging out to ensure no data is lost."
  },
  {
    question: "How do I add parts used during a job?",
    answer: "When completing a job in the mobile app, there's a 'Parts Used' section where you can select parts from inventory and specify quantities. This updates stock levels automatically."
  },
  {
    question: "Can I schedule recurring jobs?",
    answer: "Use the PM Automation feature for recurring maintenance. Set PM intervals on assets, and the system will generate jobs when maintenance is due."
  },
  {
    question: "How do I export data from the system?",
    answer: "Most list pages have export functionality. Look for the 'Export' or 'Download' button. Reports can be exported to PDF or CSV formats."
  }
];

const quickLinks = [
  { title: "Create New Job", path: "/jobs", icon: Wrench, description: "Start a new work order" },
  { title: "View Schedule", path: "/scheduler", icon: Calendar, description: "Check the calendar" },
  { title: "Add Customer", path: "/customers", icon: Users, description: "Register a new client" },
  { title: "PM Status", path: "/pm-automation", icon: RefreshCw, description: "Check maintenance due" },
  { title: "View Reports", path: "/reports", icon: BarChart3, description: "Analytics dashboard" },
  { title: "Engineer App", path: "/engineer", icon: Smartphone, description: "Mobile interface" },
];

const Help = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");

  const filteredSections = helpSections.filter((section) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      section.title.toLowerCase().includes(searchLower) ||
      section.description.toLowerCase().includes(searchLower) ||
      section.content.some(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.body.toLowerCase().includes(searchLower)
      )
    );
  });

  const filteredFaqs = faqItems.filter((faq) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      faq.question.toLowerCase().includes(searchLower) ||
      faq.answer.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6" data-testid="help-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground heading">Help Center</h1>
          <p className="text-muted-foreground text-sm">
            Find answers, learn features, and get the most out of Craven Cooling FSM
          </p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search help topics, features, or questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
          data-testid="help-search-input"
        />
      </div>

      {!searchTerm && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="p-4 text-center">
                  <link.icon className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="font-medium text-sm text-foreground">{link.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="guides" data-testid="tab-guides">
            <BookOpen className="h-4 w-4 mr-2" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="faq" data-testid="tab-faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="tips" data-testid="tab-tips">
            <Lightbulb className="h-4 w-4 mr-2" />
            Tips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base heading">Topics</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <nav className="space-y-1 p-3">
                    {filteredSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all text-left ${
                          activeSection === section.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`topic-${section.id}`}
                      >
                        <section.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardContent className="p-6">
                {filteredSections.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No topics found matching your search.</p>
                    <Button
                      variant="link"
                      onClick={() => setSearchTerm("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  (() => {
                    const section = filteredSections.find((s) => s.id === activeSection) || filteredSections[0];
                    return (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <section.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-foreground heading">{section.title}</h2>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        <Accordion type="single" collapsible className="space-y-2">
                          {section.content.map((item, index) => (
                            <AccordionItem
                              key={index}
                              value={`item-${index}`}
                              className="border border-border rounded-lg px-4"
                            >
                              <AccordionTrigger className="text-left font-medium hover:no-underline">
                                {item.title}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                                {item.body}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="heading">Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers to common questions about the Craven Cooling FSM system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No FAQs found matching your search.</p>
                  <Button
                    variant="link"
                    onClick={() => setSearchTerm("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`faq-${index}`}
                      className="border border-border rounded-lg px-4"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pl-8">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="heading flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium text-foreground">Complete customer setup first</p>
                    <p className="text-sm text-muted-foreground">Create customers, then sites, then assets before creating jobs for a smooth workflow.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium text-foreground">Use detailed access notes</p>
                    <p className="text-sm text-muted-foreground">Include parking info, key locations, and contact details to help engineers on-site.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium text-foreground">Set PM intervals on all assets</p>
                    <p className="text-sm text-muted-foreground">This enables automatic maintenance tracking and job generation.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">4</div>
                  <div>
                    <p className="font-medium text-foreground">Review the dashboard daily</p>
                    <p className="text-sm text-muted-foreground">Check urgent jobs, PM due items, and outstanding invoices each morning.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">5</div>
                  <div>
                    <p className="font-medium text-foreground">Document everything with photos</p>
                    <p className="text-sm text-muted-foreground">Engineers should photograph equipment before and after work for records.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="heading flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Time-Saving Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium text-foreground">Use the scheduler for quick scheduling</p>
                    <p className="text-sm text-muted-foreground">Drag and drop jobs on the calendar instead of editing each one.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium text-foreground">Filter jobs by engineer</p>
                    <p className="text-sm text-muted-foreground">Quickly see one engineer's workload without scrolling through all jobs.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium text-foreground">Generate PM jobs in bulk</p>
                    <p className="text-sm text-muted-foreground">Use PM Automation to create all due maintenance jobs at once.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">4</div>
                  <div>
                    <p className="font-medium text-foreground">Search by job number</p>
                    <p className="text-sm text-muted-foreground">Type the job number directly in the search box for instant access.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">5</div>
                  <div>
                    <p className="font-medium text-foreground">Use keyboard navigation</p>
                    <p className="text-sm text-muted-foreground">Tab through forms and use Enter to submit for faster data entry.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="heading flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Common Mistakes to Avoid
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-medium">!</div>
                  <div>
                    <p className="font-medium text-foreground">Don't skip asset serial numbers</p>
                    <p className="text-sm text-muted-foreground">Serial numbers are essential for warranty claims and service history.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-medium">!</div>
                  <div>
                    <p className="font-medium text-foreground">Don't forget to complete jobs</p>
                    <p className="text-sm text-muted-foreground">Incomplete jobs affect PM scheduling and reporting accuracy.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-medium">!</div>
                  <div>
                    <p className="font-medium text-foreground">Don't create duplicate customers</p>
                    <p className="text-sm text-muted-foreground">Search for existing customers before creating new ones to avoid duplicates.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-medium">!</div>
                  <div>
                    <p className="font-medium text-foreground">Don't ignore low stock alerts</p>
                    <p className="text-sm text-muted-foreground">Reorder parts before they run out to avoid delays on jobs.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="heading flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Mobile App Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Camera className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Take photos in good lighting</p>
                    <p className="text-sm text-muted-foreground">Ensure equipment photos are clear and well-lit for documentation.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <PenTool className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Get signatures before leaving</p>
                    <p className="text-sm text-muted-foreground">Always capture customer signature to confirm work completion.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Wifi className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Sync before going offline</p>
                    <p className="text-sm text-muted-foreground">Open your jobs while online to cache data for offline access.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Download className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Install as PWA</p>
                    <p className="text-sm text-muted-foreground">Add to home screen for app-like experience and faster access.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground heading">Still need help?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email Support
              </Button>
              <Button variant="outline" className="gap-2">
                <Phone className="h-4 w-4" />
                Call Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;

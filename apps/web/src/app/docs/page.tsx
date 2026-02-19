import Link from "next/link";
import {
  Users,
  TrendingUp,
  CheckSquare,
  StickyNote,
  List,
  Bot,
  SlidersHorizontal,
  Keyboard,
  Code2,
  Rocket,
  Settings,
  ArrowRight,
  Search,
  Upload,
  Blocks,
  Server,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

/* ── Section groups ─────────────────────────────────────── */

const tocGroups = [
  {
    label: "Getting Started",
    sections: [
      { id: "what-is-openclaw", label: "What is OpenClaw CRM", icon: Rocket },
      { id: "creating-account", label: "Creating your account", icon: Users },
      { id: "essential-setup", label: "Essential setup", icon: Zap },
    ],
  },
  {
    label: "Connect Your Agent",
    sections: [
      { id: "openclaw-bot", label: "OpenClaw Bot Integration", icon: Bot },
    ],
  },
  {
    label: "Features",
    sections: [
      { id: "people-companies", label: "People & Companies", icon: Users },
      { id: "deals-pipeline", label: "Deals & Pipeline", icon: TrendingUp },
      { id: "ai-chat", label: "AI Chat", icon: Bot },
      { id: "tasks", label: "Tasks", icon: CheckSquare },
      { id: "notes", label: "Notes", icon: StickyNote },
      { id: "lists", label: "Lists", icon: List },
      { id: "import-export", label: "Import & Export", icon: Upload },
      { id: "views-filters", label: "Views & Filters", icon: SlidersHorizontal },
      { id: "search", label: "Search", icon: Search },
      { id: "custom-objects", label: "Custom Objects", icon: Blocks },
    ],
  },
  {
    label: "Administration",
    sections: [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "keyboard-shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
    ],
  },
  {
    label: "For Developers",
    sections: [
      { id: "api-integrations", label: "API & Integrations", icon: Code2 },
      { id: "self-hosting", label: "Self-Hosting", icon: Server },
    ],
  },
];

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://openclaw-crm.402box.io";

export const metadata = {
  title: "Docs",
  description:
    "Learn how to connect your OpenClaw Bot, set up AI, import your data, and build your pipeline.",
  alternates: {
    canonical: `${baseUrl}/docs`,
  },
};

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/10 nav-glass">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[15px] font-semibold tracking-[-0.015em] text-foreground transition-opacity hover:opacity-70"
            >
              OpenClaw{" "}
              <span className="font-normal text-muted-foreground/60">CRM</span>
            </Link>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              Docs
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/giorgosn/openclaw-crm"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2 text-muted-foreground/50 transition-all hover:text-foreground hover:bg-foreground/[0.05]"
            >
              <GitHubLogoIcon className="h-[18px] w-[18px]" />
            </a>
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-full px-4 py-1.5 text-[13px] text-muted-foreground transition-all hover:text-foreground hover:bg-foreground/[0.04]"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-foreground/12 px-3.5 sm:px-4 py-1.5 text-[13px] font-medium text-foreground transition-all hover:border-foreground/25 hover:bg-foreground/[0.03]"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 sm:px-6 py-10">
        {/* ── TOC Sidebar ───────────────────────────── */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20">
            {tocGroups.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40">
                  {group.label}
                </p>
                <nav className="space-y-0.5">
                  {group.sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-all hover:bg-foreground/[0.04] hover:text-foreground"
                    >
                      <s.icon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      {s.label}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────── */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-14">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to home
            </Link>
            <h1 className="text-4xl font-medium tracking-[-0.03em] leading-tight sm:text-5xl">
              Documentation
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Everything you need to set up your workspace, get your data in,
              and start managing contacts and deals. No technical knowledge
              required.
            </p>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* GETTING STARTED                           */}
          {/* ══════════════════════════════════════════ */}
          <GroupDivider label="Getting Started" />

          {/* ── What is OpenClaw CRM ─────────────────── */}
          <Section id="what-is-openclaw" icon={Rocket} title="What is OpenClaw CRM?">
            <P>
              OpenClaw CRM helps you keep track of people, companies, deals,
              tasks, and notes in one place. It comes with a built-in AI
              assistant that lets you query and update your data in plain
              English, without writing any queries or learning a new interface.
            </P>
            <P>
              OpenClaw is open-source (MIT licensed) and available in two ways:
            </P>
            <Ul>
              <li>
                <Strong>Hosted</Strong>:{" "}
                <a
                  href="/register"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  sign up here
                </a>{" "}
                and start right away. Your data lives on our servers, updates
                happen automatically, and there is nothing to install.
              </li>
              <li>
                <Strong>Self-hosted</Strong>: clone the repository and run it
                on your own server. You own everything. See the{" "}
                <a
                  href="#self-hosting"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Self-Hosting
                </a>{" "}
                section for step-by-step instructions.
              </li>
            </Ul>
            <P>
              Either way you get the same full-featured CRM with no per-seat
              pricing and no paywalled features.
            </P>
          </Section>

          {/* ── Creating your account ───────────────── */}
          <Section id="creating-account" icon={Users} title="Creating your account">
            <H3>Sign up</H3>
            <Ol>
              <li>
                Click{" "}
                <a
                  href="/register"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  <Strong>Get started</Strong>
                </a>{" "}
                on the homepage.
              </li>
              <li>
                Enter your name, email, and a password (8 characters minimum).
                You can also sign in with GitHub or Google if OAuth is
                configured.
              </li>
              <li>
                Give your workspace a name, this is your team&apos;s shared
                space. If you leave it blank it defaults to &quot;[Your
                Name]&apos;s Workspace.&quot;
              </li>
              <li>
                Click <Strong>Create workspace</Strong>. You are taken to the
                Home page.
              </li>
            </Ol>

            <H3>What gets created automatically</H3>
            <P>
              Every new workspace comes pre-configured with three standard
              objects:
            </P>
            <Ul>
              <li>
                <Strong>People</Strong>: contacts with fields for name, email,
                phone, job title, linked company, location, and description.
              </li>
              <li>
                <Strong>Companies</Strong>: organizations with name, domains
                (websites), description, linked team members, location, and
                categories.
              </li>
              <li>
                <Strong>Deals</Strong>: sales opportunities with name, value,
                stage, expected close date, and linked company and contacts.
                Six pipeline stages come ready to use: Lead, Qualified,
                Proposal, Negotiation, Won, and Lost.
              </li>
            </Ul>

            <H3>The Home page</H3>
            <P>
              After logging in you land on the Home page. It shows a greeting
              with the current date, quick stats (contacts, companies, deals,
              open tasks), your recent tasks with overdue indicators, recent
              notes, and recently viewed records.
            </P>
            <P>
              New users see an onboarding checklist with four suggested first
              steps. Each step can be individually dismissed, or you can hide
              the whole checklist at once. The checklist disappears
              automatically once you have added your first records.
            </P>
          </Section>

          {/* ── Essential Setup ─────────────────────── */}
          <Section id="essential-setup" icon={Zap} title="Essential setup">
            <P>
              Before you start entering data, take 5 minutes to do these four
              things. They make the rest of the experience significantly better.
            </P>

            <H3>1. Learn to navigate the app</H3>
            <P>
              The sidebar on the left is your main navigation. The top section
              has your objects (People, Companies, Deals, and any custom objects
              you create). Below that are Tasks, Notes, Lists, Chat, and Search.
              Settings is at the very bottom.
            </P>
            <P>
              Press <Kbd>Ctrl+K</Kbd> (or <Kbd>Cmd+K</Kbd> on Mac) at any time
              to open the command palette. You can search for records, jump to
              any page, or start a new record without lifting your hands from
              the keyboard.
            </P>

            <H3>2. Set up AI chat</H3>
            <P>
              AI chat is the fastest way to query your data and take bulk
              actions. To enable it you need an OpenRouter API key. OpenRouter
              is a free service that gives you access to Claude, GPT-4o, Llama,
              Gemini, and other models through a single key.
            </P>
            <Ol>
              <li>
                Go to{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  openrouter.ai/keys
                </a>{" "}
                and create a free account. Generate an API key.
              </li>
              <li>
                In OpenClaw, go to{" "}
                <a
                  href="/settings/ai"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  <Strong>Settings &gt; AI</Strong>
                </a>{" "}
                in the sidebar.
              </li>
              <li>
                Paste your API key into the <Strong>OpenRouter API Key</Strong>{" "}
                field.
              </li>
              <li>
                Choose a model. <Strong>Claude Sonnet 4</Strong> is the default
                and works well for most tasks. GPT-4o Mini or Gemini 2.0 Flash
                are good lower-cost options if you want to minimize spend.
              </li>
              <li>
                Click <Strong>Save</Strong>, then click{" "}
                <Strong>Test Connection</Strong> to confirm everything works.
              </li>
            </Ol>
            <P>
              Once configured, open{" "}
              <a
                href="/chat"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                <Strong>Chat</Strong>
              </a>{" "}
              in the sidebar. You
              can ask things like &quot;How many deals do we have in
              Negotiation?&quot; or &quot;Create a contact named Jane Doe at
              Acme Corp&quot; and the AI handles it.
            </P>

            <H3>3. Get your data in</H3>
            <P>
              There are two ways to add records. Choose the one that fits your
              situation.
            </P>
            <P>
              <Strong>Manual entry</Strong>: open People, Companies, or Deals
              in the sidebar and click <Strong>+ New Record</Strong>. Fill in
              the fields and click <Strong>Create</Strong>. Good for adding a
              handful of records or when you are building your CRM from scratch.
            </P>
            <P>
              <Strong>CSV import</Strong>: if you have existing data in a
              spreadsheet (Excel, Google Sheets, another CRM), export it as a
              CSV and use the Import tool. Here is how:
            </P>
            <Ol>
              <li>
                Open the object you want to import into (e.g. People).
              </li>
              <li>
                Click the <Strong>Import</Strong> button in the toolbar.
              </li>
              <li>
                Drop or select your CSV file. The first row must be column
                headers.
              </li>
              <li>
                A column mapping screen appears. Each row shows a CSV header
                next to a dropdown where you pick the matching CRM field. If
                your CSV headers match the field names exactly, they are mapped
                automatically.
              </li>
              <li>
                You do not need to map every column, skip any column that does
                not have a matching field.
              </li>
              <li>
                Click <Strong>Import</Strong>. Up to 1,000 records per run. If
                any rows have errors you will see them listed with row numbers
                so you can fix and re-import.
              </li>
            </Ol>

            <H3>4. Invite your team</H3>
            <P>
              If others will use the CRM with you, invite them now so they can
              start adding data alongside you.
            </P>
            <Ol>
              <li>
                Go to{" "}
                <a
                  href="/settings/members"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  <Strong>Settings &gt; Members</Strong>
                </a>
                .
              </li>
              <li>
                Enter a team member&apos;s email address in the{" "}
                <Strong>Add Member</Strong> field.
              </li>
              <li>
                Choose their role: <Strong>Admin</Strong> (can change settings,
                manage members, and create API keys) or{" "}
                <Strong>Member</Strong> (full access to CRM data but cannot
                change workspace settings).
              </li>
              <li>
                Click <Strong>Add</Strong>. They can log in immediately.
              </li>
            </Ol>
            <P>
              You can change roles or remove members at any time from the same
              page.
            </P>
          </Section>

          {/* ══════════════════════════════════════════ */}
          {/* CONNECT YOUR AGENT                        */}
          {/* ══════════════════════════════════════════ */}
          <GroupDivider label="Connect Your Agent" />

          <Section id="openclaw-bot" icon={Bot} title="OpenClaw Bot Integration">
            <P>
              OpenClaw CRM plugs directly into your OpenClaw Bot. Generate a
              skill file, drop it into your agent config, and your agent can
              create contacts, update deals, log notes, search data, and manage
              tasks, all from wherever you already talk to it.
            </P>

            <H3>Generate your skill file</H3>
            <Ol>
              <li>
                Go to{" "}
                <a
                  href="/settings/api-keys"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  <Strong>Settings &gt; API Keys</Strong>
                </a>{" "}
                and create an API key.
              </li>
              <li>
                Navigate to{" "}
                <a
                  href="/settings/openclaw"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  <Strong>Settings &gt; OpenClaw</Strong>
                </a>
                .
              </li>
              <li>
                Follow the 4-step wizard to generate your skill file. It
                contains your CRM&apos;s base URL, API auth, and all 19 API
                endpoint categories.
              </li>
              <li>
                Click <Strong>Download</Strong> to save the file.
              </li>
            </Ol>

            <H3>Configure your agent</H3>
            <Ol>
              <li>
                Copy the downloaded file to{" "}
                <Code>~/.openclaw/skills/openclaw/SKILL.md</Code>
              </li>
              <li>
                Add the skill reference to your <Code>openclaw.json</Code>{" "}
                config file.
              </li>
              <li>Restart your OpenClaw Bot.</li>
            </Ol>

            <H3>Test it</H3>
            <P>
              Ask your agent: &quot;list all objects in the CRM.&quot; It
              should return People, Companies, and Deals (plus any custom
              objects you have created). Try a few more commands:
            </P>
            <Ul>
              <li>&quot;Add a contact named Jane Doe at Acme Corp&quot;</li>
              <li>&quot;Show me all deals closing this month&quot;</li>
              <li>&quot;Create a task to follow up with Sarah next Tuesday&quot;</li>
            </Ul>
            <P>
              For a full walkthrough, see the{" "}
              <a
                href="/blog/connect-openclaw-bot-to-crm"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                step-by-step tutorial
              </a>
              .
            </P>
          </Section>

          {/* ══════════════════════════════════════════ */}
          {/* FEATURES                                  */}
          {/* ══════════════════════════════════════════ */}
          <GroupDivider label="Features" />

          {/* ── People & Companies ─────────────────── */}
          <Section id="people-companies" icon={Users} title="People & Companies">
            <P>
              People and Companies are the two main contact types. Each is a
              table of records with customizable fields (called
              &quot;attributes&quot;). Records from both objects can be linked
              to each other and to deals.
            </P>

            <H3>Default fields</H3>
            <P>
              <Strong>People</Strong> come with: Name, Email Addresses, Phone
              Numbers, Job Title, Company (linked to a company record),
              Location, and Description.
            </P>
            <P>
              <Strong>Companies</Strong> come with: Name, Domains (websites),
              Description, Team (linked people records), Primary Location, and
              Categories.
            </P>

            <H3>Adding a record</H3>
            <Ol>
              <li>
                Open <Strong>People</Strong> or <Strong>Companies</Strong> in
                the sidebar.
              </li>
              <li>
                Click <Strong>+ New Record</Strong> (top-right corner).
              </li>
              <li>
                Fill in the fields. Required fields are marked.
              </li>
              <li>
                Click <Strong>Create</Strong>. The record detail page opens
                automatically.
              </li>
            </Ol>

            <H3>Record detail page</H3>
            <P>
              Click any record to open its full detail view. You will see five
              tabs:
            </P>
            <Ul>
              <li>
                <Strong>Overview</Strong>: all fields and their current
                values. Click any value to edit it inline. Press Enter or click
                away to save.
              </li>
              <li>
                <Strong>Related records</Strong>: linked people, companies, or
                deals. Add relationships from here.
              </li>
              <li>
                <Strong>Activity</Strong>: a timeline of every change to this
                record, showing who edited what and when.
              </li>
              <li>
                <Strong>Notes</Strong>: rich text notes attached to this
                record.
              </li>
              <li>
                <Strong>Tasks</Strong>: tasks linked to this record, with due
                dates and assignees.
              </li>
            </Ul>

            <H3>Attribute types</H3>
            <P>
              OpenClaw CRM supports 17 attribute types: text, number, currency,
              date, timestamp, checkbox, select (dropdown), status, rating,
              email address, phone number, domain (website), location, personal
              name, record reference (link to another record), actor reference
              (link to a user), and interaction. When you add a custom field to
              any object you pick from this list.
            </P>
          </Section>

          {/* ── Deals & Pipeline ───────────────────── */}
          <Section id="deals-pipeline" icon={TrendingUp} title="Deals & Pipeline">
            <P>
              Deals track your sales opportunities. They come with a built-in
              Kanban board so you can see where each deal sits in your pipeline
              at a glance.
            </P>

            <H3>Default pipeline stages</H3>
            <P>
              Every new workspace comes with six deal stages: Lead, Qualified,
              Proposal, Negotiation, Won, and Lost. Moving a deal to the Won
              stage triggers a small celebration animation. You can rename,
              reorder, recolor, or remove any of these stages.
            </P>

            <H3>Creating a deal</H3>
            <Ol>
              <li>
                Open <Strong>Deals</Strong> in the sidebar.
              </li>
              <li>
                Click <Strong>+ New Record</Strong>.
              </li>
              <li>
                Fill in the deal name, value (in any currency), stage, expected
                close date, and optionally link a company and associated people.
              </li>
              <li>
                Click <Strong>Create</Strong>.
              </li>
            </Ol>

            <H3>Kanban board</H3>
            <P>
              Switch to <Strong>Board</Strong> view using the toggle at the top
              of the Deals page. Each column represents a pipeline stage. Drag
              and drop deal cards between columns to move them through your
              pipeline. You can also reorder cards within a column to indicate
              relative priority. The total value of all deals in each stage is
              shown in the column header.
            </P>

            <H3>Customizing stages</H3>
            <P>
              Go to{" "}
              <a
                href="/settings/objects"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                <Strong>Settings &gt; Objects</Strong>
              </a>
              , expand Deals, and
              edit the Stage attribute. You can add new stages, rename existing
              ones, change their colors, reorder them, and mark which stages
              are &quot;active&quot; (open pipeline) versus closed (won or
              lost).
            </P>
          </Section>

          {/* ── AI Chat ────────────────────────────── */}
          <Section id="ai-chat" icon={Bot} title="AI Chat">
            <P>
              OpenClaw CRM has a built-in AI assistant that can read and write
              your CRM data using plain English. It works through OpenRouter,
              which means you can use Claude, GPT-4o, Llama, Gemini, and other
              models, whatever you prefer or already pay for.
            </P>

            <H3>Setting up AI</H3>
            <P>
              See the{" "}
              <a
                href="#essential-setup"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Essential setup
              </a>{" "}
              section above for step-by-step instructions. In short: get a free
              OpenRouter API key, paste it in{" "}
              <Strong>Settings &gt; AI</Strong>, choose a model, and click
              Save.
            </P>

            <H3>What the AI can do</H3>
            <P>
              The AI has 13 tools. 8 are read tools that run instantly. 5 are
              write tools that ask for your confirmation before making any
              changes.
            </P>
            <P>
              <Strong>Read tools</Strong> (instant, no confirmation needed):
            </P>
            <Ul>
              <li>Search records by name, email, domain, or any text</li>
              <li>List all object types and their attributes</li>
              <li>Browse records of a specific type (people, companies, deals)</li>
              <li>Look up a specific record by ID with full field details</li>
              <li>Show your open and completed tasks</li>
              <li>Retrieve notes attached to any record</li>
              <li>List all your workspace lists</li>
              <li>Get entries from a specific list</li>
            </Ul>
            <P>
              <Strong>Write tools</Strong> (require your confirmation first):
            </P>
            <Ul>
              <li>
                Create new records (contacts, companies, deals, or custom
                objects)
              </li>
              <li>Update fields on existing records</li>
              <li>Delete records permanently</li>
              <li>Create tasks and link them to records</li>
              <li>Add notes to records</li>
            </Ul>

            <H3>Example queries</H3>
            <Ul>
              <li>&quot;Show me all deals closing this month&quot;</li>
              <li>&quot;What is our total pipeline value?&quot;</li>
              <li>&quot;How many contacts did we add this week?&quot;</li>
              <li>&quot;Who are the contacts at Acme Corp?&quot;</li>
              <li>&quot;Add a follow-up note to Sarah Chen&quot;</li>
              <li>
                &quot;Create a new contact: Jane Doe, jane@example.com&quot;
              </li>
              <li>&quot;Move the Acme deal to Negotiation stage&quot;</li>
              <li>&quot;Create a task to call John Smith by Friday&quot;</li>
            </Ul>

            <H3>How confirmations work</H3>
            <P>
              When the AI plans a write action (create, update, or delete), it
              describes exactly what it is about to do and waits for you to
              approve before proceeding. You can confirm, ask it to adjust the
              details, or say no to cancel. Nothing is changed in your database
              until you explicitly approve.
            </P>

            <H3>Conversations</H3>
            <P>
              Each chat session is a persistent conversation. You can start new
              conversations from the sidebar panel on the Chat page, switch
              between past conversations, or delete ones you no longer need.
              The AI remembers context within a conversation, so you can refer
              to records you mentioned earlier without repeating yourself.
            </P>
          </Section>

          {/* ── Tasks ──────────────────────────────── */}
          <Section id="tasks" icon={CheckSquare} title="Tasks">
            <P>
              Tasks help you track things you need to do. Every task can be
              linked to one or more records (a person, company, deal, or any
              custom object) so you always have the context for why the task
              exists.
            </P>

            <H3>Creating a task</H3>
            <Ol>
              <li>
                Open <Strong>Tasks</Strong> in the sidebar, or click{" "}
                <Strong>Add Task</Strong> on any record&apos;s detail page
                (Tasks tab).
              </li>
              <li>Type the task description.</li>
              <li>
                Optionally set a <Strong>due date</Strong> and{" "}
                <Strong>assignee</Strong> (any workspace member).
              </li>
              <li>
                Optionally link the task to one or more records by searching
                for them.
              </li>
              <li>
                Click <Strong>Create</Strong>.
              </li>
            </Ol>

            <H3>Managing tasks</H3>
            <P>
              Click the circle checkbox next to any task to mark it as done.
              The Tasks page shows all open tasks with red overdue indicators
              for anything past its due date. The Home page widget shows your
              10 most recent tasks so you can check status at a glance without
              navigating away. Tasks linked to a record also appear on that
              record&apos;s detail page under the Tasks tab.
            </P>
          </Section>

          {/* ── Notes ──────────────────────────────── */}
          <Section id="notes" icon={StickyNote} title="Notes">
            <P>
              Notes let you write rich-text content attached to any record. Use
              them for meeting summaries, call logs, proposals, or any
              free-form information you want to keep alongside a contact or
              deal.
            </P>

            <H3>Creating a note</H3>
            <Ol>
              <li>
                Open a record and click the <Strong>Notes</Strong> tab.
              </li>
              <li>
                Click <Strong>+ New Note</Strong>.
              </li>
              <li>
                Write your note using the rich text editor. You can format with
                bold, italics, headings (H1–H3), bullet lists, numbered lists,
                links, and more.
              </li>
              <li>Notes save automatically as you type.</li>
            </Ol>

            <H3>Browsing all notes</H3>
            <P>
              The <Strong>Notes</Strong> page in the sidebar shows every note
              in your workspace grouped by date: Today, Yesterday, This Week,
              and Older. Click any note to open it in a side panel for quick
              reading or editing without navigating away.
            </P>
          </Section>

          {/* ── Lists ──────────────────────────────── */}
          <Section id="lists" icon={List} title="Lists">
            <P>
              Lists are curated collections of records you define manually.
              Think of them as saved groups, for example &quot;VIP
              Clients,&quot; &quot;Q1 Prospects,&quot; &quot;Conference
              Leads,&quot; or &quot;Partners.&quot;
            </P>

            <H3>Creating a list</H3>
            <Ol>
              <li>
                In the sidebar under <Strong>Lists</Strong>, click the{" "}
                <Strong>+</Strong> icon.
              </li>
              <li>
                Give your list a name and choose which object type it tracks
                (People, Companies, Deals, or any custom object).
              </li>
              <li>
                Click <Strong>Create</Strong>.
              </li>
            </Ol>

            <H3>Adding records to a list</H3>
            <P>
              Open your list, click <Strong>+ Add Record</Strong>, and browse
              or search for the records you want. You can add as many as you
              need.
            </P>

            <H3>List-specific attributes</H3>
            <P>
              Lists can have their own custom attributes (columns) that only
              apply within that list, useful for tracking data that is relevant
              to the list context but not to the record globally. For example, a
              &quot;Q1 Prospects&quot; list might have a &quot;Priority&quot;
              or &quot;Follow-up Date&quot; column that exists only in that
              list, not on the People object itself.
            </P>
          </Section>

          {/* ── Import & Export ─────────────────────── */}
          <Section id="import-export" icon={Upload} title="Import & Export">
            <H3>Importing from CSV</H3>
            <P>
              You can bulk-import records from a CSV file into any object type.
              This is the fastest way to migrate from another CRM, a
              spreadsheet, or any data export.
            </P>
            <Ol>
              <li>
                Open the object you want to import into (People, Companies,
                Deals, or a custom object).
              </li>
              <li>
                Click the <Strong>Import</Strong> button in the toolbar.
              </li>
              <li>
                Drop or select your CSV file. The first row must be column
                headers, the importer treats everything in row 1 as field
                names, not data.
              </li>
              <li>
                The column mapping screen appears. For each CSV column, pick the
                matching CRM field from the dropdown, or leave it as
                &quot;Skip&quot; to ignore that column. If your headers already
                match the CRM field names (case-insensitive), they are mapped
                automatically.
              </li>
              <li>
                Click <Strong>Import</Strong>. The importer processes up to
                1,000 rows per run. Empty rows are skipped automatically.
              </li>
            </Ol>
            <P>
              After import, you will see a summary showing how many records were
              created and a list of any rows that had errors (with row numbers).
              Fix the errors in your CSV and re-import just those rows.
            </P>

            <H3>Exporting to CSV</H3>
            <P>
              Click the <Strong>Export</Strong> button on any object page to
              download all current records as a CSV file. The export includes
              every attribute as a column with properly formatted values. Any
              active filters are applied before export, so you can export a
              filtered subset if needed.
            </P>
          </Section>

          {/* ── Views & Filters ────────────────────── */}
          <Section
            id="views-filters"
            icon={SlidersHorizontal}
            title="Views & Filters"
          >
            <P>
              Every object supports two view modes, accessible from the toggle
              at the top of the page:
            </P>
            <Ul>
              <li>
                <Strong>Table view</Strong>: a spreadsheet-style grid. Click
                column headers to sort. Resize columns by dragging their edges.
                Edit cells directly by clicking on them.
              </li>
              <li>
                <Strong>Board view</Strong>: a Kanban board grouped by a
                status attribute. Drag cards between columns to change their
                status. Available on any object that has at least one status
                field.
              </li>
            </Ul>

            <H3>Filtering</H3>
            <P>
              Click the <Strong>Filter</Strong> button to build conditions.
              Filters are attribute-aware: a number field offers &quot;greater
              than&quot; and &quot;less than,&quot; a text field offers
              &quot;contains&quot; and &quot;starts with,&quot; a date field
              offers &quot;before&quot; and &quot;after,&quot; and a select
              field lets you pick from the available options.
            </P>
            <P>
              You can stack multiple filters and connect them with AND or OR
              logic. For example: show deals worth more than $10,000 AND in the
              Negotiation stage, or show contacts from New York OR London.
            </P>

            <H3>Sorting</H3>
            <P>
              Click any column header in table view to sort ascending or
              descending. Click again to reverse the direction. You can sort by
              any field: name, date, numeric value, status order, or any custom
              attribute.
            </P>
          </Section>

          {/* ── Search ─────────────────────────────── */}
          <Section id="search" icon={Search} title="Search">
            <P>
              Press <Kbd>Ctrl+K</Kbd> (or <Kbd>Cmd+K</Kbd> on Mac) anywhere in
              the app to open the command palette. Type a name, email address,
              company name, or any text to search across all record types and
              lists simultaneously.
            </P>
            <P>
              Results are grouped by type (People, Companies, Deals, and any
              custom objects) and also include list matches. Click any result to
              jump directly to that record. The command palette also lets you
              navigate to any page in the app by typing its name.
            </P>
            <P>
              For a full-page search experience, open the dedicated{" "}
              <Strong>Search</Strong> page from the sidebar. It works the same
              way but gives you more space to browse results and shows more
              context for each match.
            </P>
          </Section>

          {/* ── Custom Objects ──────────────────────── */}
          <Section id="custom-objects" icon={Blocks} title="Custom Objects">
            <P>
              Beyond People, Companies, and Deals, you can create your own
              object types to track anything your business needs: projects,
              products, vendors, tickets, properties, campaigns, or anything
              else.
            </P>

            <H3>Creating a custom object</H3>
            <Ol>
              <li>
                Go to{" "}
                <a
                  href="/settings/objects"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  <Strong>Settings &gt; Objects</Strong>
                </a>
                .
              </li>
              <li>
                Click <Strong>+ New Object</Strong>.
              </li>
              <li>
                Enter a singular name (e.g. &quot;Product&quot;) and a plural
                name (e.g. &quot;Products&quot;). Choose an icon from the
                picker.
              </li>
              <li>
                Add attributes to define the fields on your object. For each
                attribute, pick a type from the 17 available options, give it a
                name, and configure whether it is required, unique, or supports
                multiple values.
              </li>
              <li>
                Click <Strong>Create</Strong>. The object appears immediately in
                the sidebar.
              </li>
            </Ol>
            <P>
              Custom objects support everything the built-in objects do: table
              and board views, filtering, sorting, CSV import and export, notes,
              tasks, related records, and AI chat.
            </P>

            <H3>Adding attributes to existing objects</H3>
            <P>
              You can add custom attributes to any object, including the
              built-in ones. Go to{" "}
              <a
                href="/settings/objects"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                <Strong>Settings &gt; Objects</Strong>
              </a>
              , expand the object you want to modify, and click{" "}
              <Strong>+ Add Attribute</Strong>. New attributes appear as
              additional columns in the table view and as new fields on record
              detail pages.
            </P>
          </Section>

          {/* ══════════════════════════════════════════ */}
          {/* ADMINISTRATION                            */}
          {/* ══════════════════════════════════════════ */}
          <GroupDivider label="Administration" />

          {/* ── Settings ───────────────────────────── */}
          <Section id="settings" icon={Settings} title="Settings">
            <P>
              Access settings from the <Strong>Settings</Strong> link at the
              very bottom of the sidebar. Settings are divided into sections:
            </P>

            <H3>General</H3>
            <P>
              View and edit your workspace name. The workspace slug and internal
              ID are shown for reference (read-only). Only admins can change
              workspace settings.
            </P>

            <H3>Members</H3>
            <P>
              Invite team members by email address. Each member has one of two
              roles:
            </P>
            <Ul>
              <li>
                <Strong>Admin</Strong>: full access including settings,
                managing members, creating and revoking API keys, and
                configuring AI.
              </li>
              <li>
                <Strong>Member</Strong>: full access to all CRM data (people,
                companies, deals, tasks, notes, lists, AI chat) but cannot
                change workspace settings or manage members.
              </li>
            </Ul>
            <P>
              You can change a member&apos;s role or remove them at any time.
              Removing a member revokes their access immediately.
            </P>

            <H3>API Keys</H3>
            <P>
              Create Bearer token API keys for programmatic access from external
              tools, scripts, or automations. Keys start with{" "}
              <Code>oc_sk_</Code> and are shown only once when created, copy
              and store them somewhere safe immediately. You can revoke any key
              at any time, which cuts off access instantly.
            </P>
            <P>
              To use a key, include it in the{" "}
              <Code>Authorization: Bearer oc_sk_...</Code> header on every API
              request.
            </P>

            <H3>AI Configuration</H3>
            <P>
              Enter your OpenRouter API key and select the default AI model for
              your workspace. Available models include Claude Sonnet 4, Claude
              Opus 4, GPT-4o, GPT-4o Mini, Llama 3.1 405B, Llama 3.1 70B, and
              Gemini 2.0 Flash. Each workspace stores its own key and model
              preference. The <Strong>Test Connection</Strong> button sends a
              quick test request so you can confirm the key and model are
              working before your team starts using Chat.
            </P>
            <P>
              You can also configure the{" "}
              <Strong>OpenClaw AI Agent</Strong> from this page, which enables
              the built-in assistant to perform CRM actions on behalf of your
              team. See the{" "}
              <a
                href="#ai-chat"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                AI Chat
              </a>{" "}
              section for details on what the agent can do.
            </P>

            <H3>Objects</H3>
            <P>
              View and manage all object types and their attributes. Add custom
              attributes to existing objects, create entirely new object types,
              configure status options and colors, and set field constraints
              like required or unique. See the{" "}
              <a
                href="#custom-objects"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Custom Objects
              </a>{" "}
              section for full details.
            </P>
          </Section>

          {/* ── Keyboard Shortcuts ─────────────────── */}
          <Section
            id="keyboard-shortcuts"
            icon={Keyboard}
            title="Keyboard Shortcuts"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-6 font-medium">Shortcut</th>
                    <th className="pb-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <ShortcutRow
                    keys="Ctrl+K / Cmd+K"
                    action="Open global search and command palette"
                  />
                  <ShortcutRow
                    keys="Escape"
                    action="Close modal, dialog, or search"
                  />
                  <ShortcutRow
                    keys="Enter"
                    action="Save inline edit / confirm selection"
                  />
                </tbody>
              </table>
            </div>
          </Section>

          {/* ══════════════════════════════════════════ */}
          {/* FOR DEVELOPERS                            */}
          {/* ══════════════════════════════════════════ */}
          <GroupDivider label="For Developers" />

          {/* ── API & Integrations ─────────────────── */}
          <Section
            id="api-integrations"
            icon={Code2}
            title="API & Integrations"
          >
            <P>
              OpenClaw CRM has a full REST API so you can integrate with other
              tools, automate workflows, sync data with external systems, or
              build custom apps on top of your CRM data.
            </P>

            <H3>Quick start</H3>
            <Ol>
              <li>
                Go to{" "}
                <a
                  href="/settings/api-keys"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  <Strong>Settings &gt; API Keys</Strong>
                </a>{" "}
                and create a key.
              </li>
              <li>
                Include the key in every request as a Bearer token:{" "}
                <Code>Authorization: Bearer oc_sk_...</Code>
              </li>
              <li>
                Start with <Code>GET /api/v1/objects</Code> to list all object
                types in your workspace and their slugs.
              </li>
              <li>
                Use <Code>GET /api/v1/objects/people/records</Code> to fetch
                people records, <Code>/companies</Code> for companies,{" "}
                <Code>/deals</Code> for deals, and so on.
              </li>
            </Ol>

            <H3>Key endpoints</H3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Endpoint</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GET /api/v1/objects</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      List all object types
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GET /api/v1/objects/:slug/records</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      List records with pagination
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>POST /api/v1/objects/:slug/records</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Create a record
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>POST /api/v1/objects/:slug/records/query</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Filter and sort records
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>POST /api/v1/objects/:slug/records/import</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Bulk import records (up to 1,000)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GET /api/v1/objects/:slug/records/export</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Export records as CSV
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GET /api/v1/search</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Full-text search across all records
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GET /api/v1/tasks</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">List tasks</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GET /api/v1/notes</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">List notes</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>POST /api/v1/chat/completions</Code>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      AI chat with tool calling (SSE stream)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <H3>API documentation</H3>
            <Ul>
              <li>
                <Strong>Concise reference</Strong>:{" "}
                <a
                  href="/llms-api.txt"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  /llms-api.txt
                </a>{" "}
                , quick endpoint list, useful for LLM agents
              </li>
              <li>
                <Strong>Full reference</Strong>:{" "}
                <a
                  href="/llms-full.txt"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  /llms-full.txt
                </a>{" "}
                , comprehensive request/response documentation
              </li>
              <li>
                <Strong>OpenAPI spec</Strong>:{" "}
                <a
                  href="/openapi.json"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  /openapi.json
                </a>{" "}
                , machine-readable spec for code generation and tooling
              </li>
            </Ul>
          </Section>

          {/* ── Self-Hosting ───────────────────────── */}
          <Section id="self-hosting" icon={Server} title="Self-Hosting">
            <P>
              OpenClaw CRM is MIT licensed and designed to run on your own
              infrastructure. You need Node.js 20+, pnpm 9+, and PostgreSQL
              16+. Docker is recommended for the database in both development
              and production.
            </P>

            <H3>Prerequisites</H3>
            <Ul>
              <li>
                Node.js 20 or later:{" "}
                <a
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  nodejs.org
                </a>
              </li>
              <li>
                pnpm 9 or later: <Code>npm install -g pnpm</Code>
              </li>
              <li>PostgreSQL 16 or later (or Docker to run it)</li>
              <li>Git</li>
            </Ul>

            <H3>Development setup</H3>
            <Ol>
              <li>
                Clone the repository:
                <br />
                <Code>
                  git clone https://github.com/giorgosn/openclaw-crm.git
                </Code>
              </li>
              <li>
                Install dependencies:
                <br />
                <Code>cd openclaw-crm && pnpm install</Code>
              </li>
              <li>
                Copy the environment file:
                <br />
                <Code>cp .env.example .env</Code>
              </li>
              <li>
                Edit <Code>.env</Code> with your database URL and auth secret.
                See the environment variables table below.
              </li>
              <li>
                Start PostgreSQL using Docker:
                <br />
                <Code>sudo docker compose up db -d</Code>
              </li>
              <li>
                Push the database schema:
                <br />
                <Code>pnpm db:push</Code>
              </li>
              <li>
                Seed default data (standard objects and pipeline stages):
                <br />
                <Code>pnpm db:seed</Code>
              </li>
              <li>
                Start the development server:
                <br />
                <Code>pnpm dev</Code>
              </li>
            </Ol>
            <P>
              Open <Code>http://localhost:3001</Code> in your browser and
              create your first account.
            </P>

            <H3>Environment variables</H3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Variable</th>
                    <th className="pb-2 pr-4 font-medium">Required</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>DATABASE_URL</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">Yes</td>
                    <td className="py-2 text-muted-foreground">
                      PostgreSQL connection string, e.g.{" "}
                      <Code>
                        postgresql://user:pass@localhost:5432/openclaw
                      </Code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>BETTER_AUTH_SECRET</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">Yes</td>
                    <td className="py-2 text-muted-foreground">
                      Session encryption key, 32+ characters. Generate with{" "}
                      <Code>openssl rand -base64 32</Code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>NEXT_PUBLIC_APP_URL</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">Yes</td>
                    <td className="py-2 text-muted-foreground">
                      Your app&apos;s public URL, e.g.{" "}
                      <Code>http://localhost:3001</Code> or{" "}
                      <Code>https://crm.yourcompany.com</Code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>OPENROUTER_API_KEY</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">No</td>
                    <td className="py-2 text-muted-foreground">
                      Default OpenRouter key for AI chat. Individual workspaces
                      can override this in Settings &gt; AI.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>OPENROUTER_MODEL</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">No</td>
                    <td className="py-2 text-muted-foreground">
                      Default model ID, e.g.{" "}
                      <Code>anthropic/claude-sonnet-4</Code>. Falls back to
                      Claude Sonnet 4 if not set.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GITHUB_CLIENT_ID</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">No</td>
                    <td className="py-2 text-muted-foreground">
                      GitHub OAuth app client ID. Also set{" "}
                      <Code>GITHUB_CLIENT_SECRET</Code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>GOOGLE_CLIENT_ID</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">No</td>
                    <td className="py-2 text-muted-foreground">
                      Google OAuth client ID. Also set{" "}
                      <Code>GOOGLE_CLIENT_SECRET</Code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      <Code>RESEND_API_KEY</Code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">No</td>
                    <td className="py-2 text-muted-foreground">
                      Resend API key for sending transactional emails such as
                      member invite notifications.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <H3>Production deployment with Docker</H3>
            <P>
              For production, use the included Docker Compose configuration
              which bundles both PostgreSQL and the Next.js app in optimized
              containers.
            </P>
            <Ol>
              <li>
                Generate a secure auth secret:
                <br />
                <Code>
                  export BETTER_AUTH_SECRET=$(openssl rand -base64 32)
                </Code>
              </li>
              <li>
                Set your production environment variables in <Code>.env</Code>.
                Make sure <Code>NEXT_PUBLIC_APP_URL</Code> is your real public
                domain, not localhost.
              </li>
              <li>
                Build and start the production stack:
                <br />
                <Code>
                  docker compose -f docker-compose.prod.yml up --build -d
                </Code>
              </li>
            </Ol>
            <P>
              The production build uses PostgreSQL 16 and a Node.js container
              running the Next.js standalone output. For SSL termination, put a
              reverse proxy such as Nginx or Caddy in front of the app
              container.
            </P>
          </Section>

          {/* ── CTA Footer ─────────────────────────── */}
          <div className="mt-16 rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] p-8 text-center">
            <h2 className="text-xl font-medium tracking-[-0.02em]">
              Ready to get started?
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              <a
                href="/register"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Create your account
              </a>{" "}
              and start managing your contacts in minutes.
            </p>
            <Link
              href="/register"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-[13px] font-medium text-background transition-all hover:opacity-80"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </main>
      </div>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="mt-12 border-t border-border/15">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6">
          <span className="text-[12px] text-muted-foreground/60">
            OpenClaw CRM
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/blog"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Blog
            </Link>
            <Link
              href="/compare"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Compare
            </Link>
            <a
              href="https://github.com/giorgosn/openclaw-crm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              GitHub
            </a>
            <span className="text-[12px] text-muted-foreground/60">
              MIT License
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Reusable Components ─────────────────────────────── */

function GroupDivider({ label }: { label: string }) {
  return (
    <div className="mb-10 mt-4 flex items-center gap-4">
      <div className="h-px flex-1 bg-foreground/[0.06] dark:bg-white/[0.06]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40">
        {label}
      </span>
      <div className="h-px flex-1 bg-foreground/[0.06] dark:bg-white/[0.06]" />
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-20">
      <div className="mb-5 flex items-center gap-3">
        <div className="inline-flex rounded-xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-medium tracking-[-0.02em]">{title}</h2>
      </div>
      <div className="space-y-4 pl-0 sm:pl-[3.25rem]">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-semibold text-foreground">{children}</h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-[1.7] text-muted-foreground">
      {children}
    </p>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

function Ol({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-[14px] leading-[1.7] text-muted-foreground marker:text-muted-foreground/40">
      {children}
    </ol>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-[1.7] text-muted-foreground marker:text-muted-foreground/40">
      {children}
    </ul>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-foreground/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 text-[12px] font-mono text-foreground">
      {children}
    </code>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-foreground/[0.08] dark:border-white/[0.08] bg-foreground/[0.03] dark:bg-white/[0.04] px-1.5 py-0.5 text-[12px] font-mono text-foreground">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <tr>
      <td className="py-2 pr-6">
        <kbd className="rounded-md border border-foreground/[0.08] dark:border-white/[0.08] bg-foreground/[0.03] dark:bg-white/[0.04] px-2 py-0.5 text-[12px] font-mono text-foreground">
          {keys}
        </kbd>
      </td>
      <td className="py-2 text-muted-foreground">{action}</td>
    </tr>
  );
}

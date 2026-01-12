# Getting Started

Welcome to TaskMaster! This guide will get you up and running in under 10 minutes.

---

## What You Need Before Starting

| Tool | Why You Need It | How to Get It |
|------|-----------------|---------------|
| **Node.js 18+** | Runs the app | [nodejs.org](https://nodejs.org) |
| **npm** | Installs packages | Comes with Node.js |
| **Git** | Version control | [git-scm.com](https://git-scm.com) |
| **Supabase Account** | Database & Auth | [supabase.com](https://supabase.com) (free tier) |
| **Gemini API Key** | AI features | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd Taskmaster/taskmaster-client
npm install
```

## Step 2: Set Up Environment Variables

Create a file called `.env.local` in the `taskmaster-client` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

**Where to find these:**
1. **Supabase URL & Key**: Supabase Dashboard → Settings → API
2. **Gemini Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

## Step 3: Run It!

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Understanding the Project Structure

```
taskmaster-client/
├── src/
│   ├── app/                 # Routes (don't touch much)
│   ├── client-pages/        # Where page logic lives
│   ├── components/          # Reusable UI pieces
│   │   └── ui/              # Core building blocks (USE THESE!)
│   ├── services/            # Talks to the database
│   └── context/             # Global state (user, theme)
└── public/                  # Images, icons
```

**Key insight:** You'll spend most of your time in `client-pages/` and `components/`.

---

## The Golden Rules

Before you write any code, remember these three rules:

### Rule 1: Use Our Components
We have pre-built components in `components/ui/`. **Always use them instead of raw HTML.**

```tsx
// BAD - raw HTML with Tailwind
<div className="flex flex-col gap-4">
  <p className="text-2xl font-bold">Hello</p>
</div>

// GOOD - using our components
<Stack gap={4}>
  <Text variant="h1">Hello</Text>
</Stack>
```

### Rule 2: Use Services for Data
Never call Supabase directly in components. Use the service layer.

```tsx
// BAD
const { data } = await supabase.from('tasks').select('*');

// GOOD
const tasks = await apiService.getAllTasks();
```

### Rule 3: Handle Loading and Errors
Every data fetch needs loading and error states:

```tsx
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);

if (isLoading) return <Text>Loading...</Text>;
if (error) return <Text color="destructive">Error: {error.message}</Text>;
```

---

## Next Steps

1. Read [02-Architecture.md](./02-Architecture.md) to understand the structure
2. Read [06-Coding-Standards.md](./06-Coding-Standards.md) before writing code
3. Check [04-Contributing.md](./04-Contributing.md) when ready to submit changes

import { createClient } from "@/utils/supabase/server";
import { taskService } from "@/services/api/taskService";
import DashboardPage from "@/client-pages/dashboard/DashboardPage";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch data server-side
  const tasks = await taskService.getAllTasks(supabase);

  return <DashboardPage initialTasks={tasks} />;
}

import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return <AppShell email={session?.email}>{children}</AppShell>;
}

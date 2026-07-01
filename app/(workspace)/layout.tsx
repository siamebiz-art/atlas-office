import WorkspaceLayout from "@/components/layout/WorkspaceLayout"

export const dynamic = "force-dynamic"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>
}

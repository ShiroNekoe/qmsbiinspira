import KanbanBoard from "../../components/KanbanBoard"
import { Head, Link, usePage } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { ClipboardList, Plus } from "lucide-react"

/* =========================
   TYPES
========================= */

type User = {
    id: number
    name: string
    role: string
}

type Task = {
    id: number
    title: string
    description: string
    status: string
}

type Props = {
    tasks: Record<string, Task[]>
    users: User[]
}

/* =========================
   COMPONENT
========================= */

export default function Index({ tasks, users }: Props) {

    const { auth } = usePage().props as any
    const userRole = auth.user.role

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: "QMS Requests",
            href: "/requests",
        },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="QMS Requests" />

            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                            <ClipboardList className="w-6 h-6 text-blue-600" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold">
                                Queue Management System
                            </h1>

                            <p className="text-sm text-gray-500">
                                Manage revision requests from all units in one board
                            </p>
                        </div>
                    </div>

                    {userRole === "unit" && (
                        <Link
                            href="/requests/create"
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus size={18} />
                            Create Request
                        </Link>
                    )}

                </div>

                {/* Board */}
                <div className="bg-white rounded-xl shadow-sm border">

                    <div className="p-4 border-b font-semibold text-gray-700">
                        Request Workflow
                    </div>

                    <div className="p-4">

                        <KanbanBoard
                            tasks={tasks}
                            users={users}
                            user_role={userRole}
                        />

                    </div>

                </div>

            </div>
        </AppLayout>
    )
}
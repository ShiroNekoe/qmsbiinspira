import KanbanBoard from "../../components/KanbanBoard"
import { Head, Link, usePage } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { ClipboardList, Plus } from "lucide-react"

export default function Index({ tasks }) {
    const { auth } = usePage().props
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
                    {/* Left */}
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

                    {/* Right Button - hanya role unit yang bisa buat request */}
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

                {/* Board Container */}
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-4 border-b font-semibold text-gray-700">
                        Request Workflow
                    </div>

                    <div className="p-4">
                        {/* Kirim prop user_role supaya KanbanBoard bisa batasi drag */}
                        <KanbanBoard tasks={tasks} user_role={userRole} />
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
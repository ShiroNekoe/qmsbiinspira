import KanbanBoard from "../../components/KanbanBoard"
import { Head, Link, usePage } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { ClipboardList, Plus } from "lucide-react"
import { useEffect, useState } from "react"

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

type Toast = {
    id: number
    text: string
    type: "success" | "error"
}

export default function Index({ tasks, users }: Props) {

    const { auth, errors, flash } = usePage().props as any
    const userRole = auth.user.role

    const [toasts, setToasts] = useState<Toast[]>([])

    // 🔥 helper add toast
    const addToast = (text: string, type: "success" | "error" = "success") => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, text, type }])

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }

    // =========================
    // ERROR HANDLER
    // =========================
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((err: any) => {
                addToast(err, "error")
            })
        }
    }, [errors])

    // =========================
    // SUCCESS HANDLER
    // =========================
    useEffect(() => {
        if (flash?.success) {
            const msg = typeof flash.success === "string"
                ? flash.success
                : flash.success.message

            addToast(msg, "success")
        }
    }, [flash])

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: "QMS Requests",
            href: "/requests",
        },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="QMS Requests" />

            {/* 🔥 TOAST CONTAINER */}
            <div className="fixed top-5 right-5 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="px-4 py-2 rounded-lg shadow-lg text-white
                                   bg-red-500
                                   transform transition-all duration-300
                                   translate-x-0 opacity-100
                                   animate-[slideIn_0.3s_ease]"
                    >
                        {toast.text}
                    </div>
                ))}
            </div>

            {/* 🔥 INLINE ANIMATION STYLE */}
            <style>
                {`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                `}
            </style>

            <div className="p-6 space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 leading-tight">
                                Queue Management System
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Manage revision requests from all units in one board
                            </p>
                        </div>
                    </div>
                </div>

                {/* Board Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

                    {/* Board Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800 text-sm">
                                Request Workflow
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Drag cards to update status
                            </p>
                        </div>

                        {userRole === "unit" && (
                            <Link
                                href="/requests/create"
                                className="flex items-center gap-1.5 bg-gray-400 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
                            >
                                <Plus size={16} />
                                Create Request
                            </Link>
                        )}
                    </div>

                    {/* Board Content */}
                    <div className="p-5">
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
import { X, Calendar, Link2 } from "lucide-react";
import { useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

type User = {
    id: number;
    name: string;
    role: string;
};

type TaskModalProps = {
    task: any;
    onClose: () => void;
    users?: User[];
};

export default function TaskModal({ task, onClose, users = [] }: TaskModalProps) {

    if (!task) return null;

    const [preview, setPreview] = useState<string | null>(null);

    const urgencyColor: Record<string, string> = {
        high: "bg-red-100 text-red-600",
        medium: "bg-yellow-100 text-yellow-600",
        low: "bg-green-100 text-green-600",
    };

    // ✅ progress mapping
    const progressMap: Record<string, number> = {
        request: 10,
        todo: 25,
        in_progress: 60,
        in_review: 85,
        complete: 100,
    };

    const { auth }: any = usePage().props;
    const userRole = auth.user.role;

    const { data, setData, patch, processing } = useForm({
        status: task.status || "request",
        estimation_start: task.estimation_start || "",
        estimation_end: task.estimation_end || "",
        assigned_to: task.assigned_to || "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/requests/${task.id}/status`);
    };

    // ✅ MULTI ATTACHMENT (dari relation)
    const attachments = task.attachments || [];

    const isImage = (file: string) => {
        return file.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

                <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-y-auto max-h-[90vh] flex flex-col">

                    {/* ✅ PROGRESS BAR (NEW, di atas banget) */}
                    <div className="w-full bg-gray-200 h-2">
                        <div
                            className="h-2 bg-blue-500 transition-all duration-500"
                            style={{ width: `${progressMap[task.status] || 0}%` }}
                        />
                    </div>

                    <div className="text-xs text-gray-500 px-5 pt-2">
                        Progress: {progressMap[task.status] || 0}%
                    </div>

                    {/* HEADER */}
                    <div className="flex justify-between items-center border-b p-5">

                        <div>
                            <h2 className="text-xl font-bold">{task.title}</h2>

                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">
                                    {task.status}
                                </span>

                                <span className={`px-2 py-1 text-xs rounded ${urgencyColor[task.urgency] || ""}`}>
                                    {task.urgency}
                                </span>
                            </div>
                        </div>

                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                            <X size={18} />
                        </button>

                    </div>

                    {/* BODY */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                        {/* DESCRIPTION */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 mb-2">
                                Description
                            </p>

                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                                {task.description || "No description"}
                            </div>
                        </div>

                        {/* ATTACHMENT */}
                            {attachments.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-gray-500 mb-2">
                                    Attachments
                                </p>

                                <div className="grid grid-cols-3 gap-3">

                                    {attachments.map((file: any, index: number) => {

                                        const url = `/storage/${file.file_path}`;

                                        if (isImage(file.file_path)) {
                                            return (
                                                <img
                                                    key={index}
                                                    src={url}
                                                    onClick={() => setPreview(url)}
                                                    className="rounded-lg cursor-pointer object-cover h-28 w-full hover:scale-105 transition"
                                                />
                                            );
                                        }

                                        return (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                className="flex items-center gap-2 text-blue-600 text-sm hover:underline"
                                            >
                                                <Link2 size={16} />
                                                Open File
                                            </a>
                                        );

                                    })}

                                </div>
                            </div>
                        )}

                        {/* INFO */}
                        <div className="grid md:grid-cols-2 gap-4">

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">
                                    Platform
                                </p>
                                <p className="font-medium">
                                    {task.created_by_name}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">
                                    Assigned Technician
                                </p>
                                <p className="font-medium">
                                    {task.assigned_to_name || "Unassigned"}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">
                                        Deadline
                                    </p>
                                    <p className="font-medium">
                                        {task.deadline || "No deadline"}
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* ESTIMATION INFO */}
                        <div className="grid grid-cols-2 gap-4">

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500">Estimation Start</p>
                                <p className="font-medium">{task.estimation_start || "-"}</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500">Estimation End</p>
                                <p className="font-medium">{task.estimation_end || "-"}</p>
                            </div>

                        </div>

                        {/* FORM UPDATE */}
                        {(userRole === "technician" || userRole === "admin") && (

                            <form onSubmit={submit} className="space-y-4 border-t pt-4">

                                <h3 className="text-sm font-semibold text-gray-600">
                                    Update Task
                                </h3>

                                <div className="grid grid-cols-2 gap-4">

                                    <div className="flex flex-col">
                                        <label className="text-xs text-gray-500 mb-1">
                                            Estimation Start
                                        </label>
                                        <input
                                            type="date"
                                            value={data.estimation_start}
                                            onChange={e => setData("estimation_start", e.target.value)}
                                            className="border rounded-lg p-2 text-sm"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-xs text-gray-500 mb-1">
                                            Estimation End
                                        </label>
                                        <input
                                            type="date"
                                            value={data.estimation_end}
                                            onChange={e => setData("estimation_end", e.target.value)}
                                            className="border rounded-lg p-2 text-sm"
                                        />
                                    </div>

                                </div>

                                {/* ASSIGN TECHNICIAN */}
                                <div>

                                    <label className="text-xs text-gray-500">
                                        Assign Technician
                                    </label>

                                    <select
                                        value={data.assigned_to}
                                        onChange={e => setData("assigned_to", e.target.value)}
                                        className="mt-1 w-full border rounded-lg p-2 text-sm"
                                    >

                                        <option value="">
                                            -- Unassigned --
                                        </option>

                                        {users
                                            .filter(u => u.role === "technician")
                                            .map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))
                                        }

                                    </select>

                                </div>

                                <div className="flex justify-end">

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                                    >
                                        {processing ? "Updating..." : "Update"}
                                    </button>

                                </div>

                            </form>

                        )}

                    </div>

                </div>

            </div>

            {/* IMAGE PREVIEW */}
            {preview && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
                    onClick={() => setPreview(null)}
                >
                    <img
                        src={preview}
                        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-xl"
                    />
                </div>
            )}
        </>
    );
}
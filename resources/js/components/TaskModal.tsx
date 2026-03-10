import { X, Calendar, Link2 } from "lucide-react";
import { useForm } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";

type TaskModalProps = {
    task: any;
    onClose: () => void;
    users?: { id: number; name: string; role: string }[];
};

type User = {
    id: number;
    name: string;
    role: string;
};

export default function TaskModal({ task, onClose, users = [] }: TaskModalProps) {
    if (!task) return null;

    const urgencyColor: Record<string, string> = {
        high: "bg-red-100 text-red-600",
        medium: "bg-yellow-100 text-yellow-600",
        low: "bg-green-100 text-green-600",
    };

    const { auth } = usePage().props;
    const userRole = auth.user.role;
    const userId = auth.user.id;

    const { data, setData, patch, processing, errors } = useForm({
        status: task.status || "request",
        estimation_start: task.estimation_start || "",
        estimation_end: task.estimation_end || "",
        actual_start: task.actual_start || "",
        actual_end: task.actual_end || "",
        assign_to: task.assigned_to || "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/requests/${task.id}/status`);
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-y-auto max-h-[90vh] flex flex-col">

                {/* HEADER */}
                <div className="flex justify-between items-center border-b p-5">
                    <div>
                        <h2 className="text-xl font-bold">{task.title}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">{task.status}</span>
                            <span className={`px-2 py-1 text-xs rounded ${urgencyColor[task.urgency] || ""}`}>{task.urgency}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                    {/* Description */}
                    <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Description</p>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">{task.description || "No description"}</div>
                    </div>

                    {/* Attachment */}
                    {task.attachment && (
                        <div>
                            <p className="text-sm font-semibold text-gray-500 mb-2">Attachment</p>
                            <a href={task.attachment} target="_blank" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-2">
                                <Link2 size={16} /> Open Attachment
                            </a>
                        </div>
                    )}

                    {/* Platform & Technician */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Platform</p>
                            <p className="font-medium">{task.created_by_name}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Assigned Technician</p>
                            <p className="font-medium">{task.assigned_to_name || "Unassigned"}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Deadline</p>
                                <p className="font-medium">{task.deadline || "No deadline"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Related URL */}
                    {task.related_url && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Link2 size={16} /> <span className="text-sm">Related Link</span>
                            </div>
                            <a href={task.related_url} target="_blank" className="text-sm font-medium text-blue-600 hover:underline">Open</a>
                        </div>
                    )}

                    {/* Status & Estimation Form */}
                    {(userRole === "technician" || userRole === "admin") && (
                        <form onSubmit={submit} className="space-y-4 mt-4 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-600">Update Status & Estimation</h3>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">Estimation Start</label>
                                    <input type="date" value={data.estimation_start} onChange={e => setData("estimation_start", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Estimation End</label>
                                    <input type="date" value={data.estimation_end} onChange={e => setData("estimation_end", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">Actual Start</label>
                                    <input type="date" value={data.actual_start} onChange={e => setData("actual_start", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Actual End</label>
                                    <input type="date" value={data.actual_end} onChange={e => setData("actual_end", e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm" />
                                </div>
                            </div>

                            {/* Assign to Technician */}
                            <div>
                                <label className="text-xs text-gray-500">Assign To</label>
                                <select
                                    value={data.assign_to}
                                    onChange={e => setData("assign_to", e.target.value)}
                                    className="mt-1 w-full border rounded-lg p-2 text-sm"
                                >
                                    <option value="">-- Unassigned --</option>
                                    {users
                                        .filter(u => u.role === "technician")
                                        .map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="flex justify-end">
                                <button type="submit" disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                                    {processing ? "Updating..." : "Update"}
                                </button>
                            </div>
                        </form>
                    )}

                </div>

                {(userRole === "technician" || userRole === "admin") && (
                    <div className="flex justify-end p-5 border-t">
                        <button onClick={() => console.log("Detail clicked!")} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition">Detail</button>
                    </div>
                )}
            </div>
        </div>
    );
}
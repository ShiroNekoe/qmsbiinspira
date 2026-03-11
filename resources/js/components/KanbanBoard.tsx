import { useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { router } from "@inertiajs/react"
import TaskModal from "./TaskModal"

// Simple toast notification
function showToast(message: string) {
    const toast = document.createElement("div")
    toast.innerText = message
    toast.className =
        "fixed top-5 right-5 bg-yellow-400 text-black px-4 py-2 rounded shadow-lg z-50 animate-slideIn"
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2500)
}

type Task = {
    id: number
    title: string
    unit: string
    urgency: "low" | "medium" | "high"
    created_by_name: string
    deadline?: string
}

type Board = {
    request: Task[]
    todo: Task[]
    in_progress: Task[]
    in_review: Task[]
    complete: Task[]
}

type TaskModalProps = {
    task: Task | null
    onClose: () => void
    readOnly?: boolean
}

export default function KanbanBoard({
    tasks,
    user_role,
}: {
    tasks: Partial<Board>
    user_role: string
}) {
    const columns: (keyof Board)[] = [
        "request",
        "todo",
        "in_progress",
        "in_review",
        "complete",
    ]

    const [board, setBoard] = useState<Board>({
        request: tasks?.request ?? [],
        todo: tasks?.todo ?? [],
        in_progress: tasks?.in_progress ?? [],
        in_review: tasks?.in_review ?? [],
        complete: tasks?.complete ?? [],
    })

    const [selectedTask, setSelectedTask] = useState<Task | null>(null)

    const openTask = (task: Task) => setSelectedTask(task)
    const closeTask = () => setSelectedTask(null)

    const urgencyColor = (level: string) => {
        if (level === "high") return "bg-red-100 text-red-600"
        if (level === "medium") return "bg-yellow-100 text-yellow-600"
        return "bg-green-100 text-green-600"
    }

    // Hanya admin & technician yang bisa drag
    const canDrag = user_role === "admin" || user_role === "technician"

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result
        if (!destination) return
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        )
            return

        if (!canDrag) {
            // Toast + rollback
            showToast("Hanya admin atau technician yang bisa memindahkan task!")
            return
        }

        const startColumn = source.droppableId as keyof Board
        const finishColumn = destination.droppableId as keyof Board

        const startTasks = Array.from(board[startColumn])
        const finishTasks = Array.from(board[finishColumn])
        const task = startTasks[source.index]

        if (startColumn === finishColumn) {
            startTasks.splice(source.index, 1)
            startTasks.splice(destination.index, 0, task)
            setBoard({ ...board, [startColumn]: startTasks })
        } else {
            startTasks.splice(source.index, 1)
            finishTasks.splice(destination.index, 0, task)
            setBoard({ ...board, [startColumn]: startTasks, [finishColumn]: finishTasks })
        }

        // Update backend
        router.patch(
            `/requests/${draggableId}/status`,
            { status: finishColumn },
            { preserveScroll: true, preserveState: true }
        )
    }

    const renderTaskCard = (task: Task, index?: number) => (
        <div
            key={task.id}
            onClick={() => openTask(task)}
            className="bg-white border rounded-lg p-3 mb-3 cursor-pointer hover:shadow-md transition-all duration-200 break-words"
        >
            <p className="font-medium text-sm mb-1">{task.title}</p>
            <p className="text-xs text-gray-400 mb-1 truncate">
                Platform: {task.created_by_name}
            </p>
            {task.deadline && (
                <p className="text-xs text-gray-400 mb-2 truncate">
                    Deadline: {task.deadline}
                </p>
            )}
            <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 truncate">{task.unit}</p>
                <span className={`text-xs px-2 py-1 rounded ${urgencyColor(task.urgency)}`}>
                    {task.urgency}
                </span>
            </div>
        </div>
    )

    return (
        <>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-5 gap-4">
                    {columns.map((col) => (
                        <Droppable droppableId={col} key={col}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="bg-gray-50 rounded-xl p-3 min-h-[400px]"
                                >
                                    <h2 className="font-semibold mb-3 capitalize text-sm text-gray-600">
                                        {col.replace("_", " ")}
                                    </h2>
                                    {board[col]?.map((task, index) =>
                                        canDrag ? (
                                            <Draggable
                                                key={task.id}
                                                draggableId={task.id.toString()}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        {renderTaskCard(task)}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ) : (
                                            renderTaskCard(task, index)
                                        )
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

            <TaskModal
                task={selectedTask}
                onClose={closeTask}
                readOnly={!canDrag}
            />

            <style>{`
                @keyframes slideIn {
                    0% { transform: translateY(-20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease forwards;
                }
            `}</style>
        </>
    )
}
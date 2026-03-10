import { useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { router } from "@inertiajs/react"
import TaskModal from "./TaskModal"

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

export default function KanbanBoard({ tasks, user_role }: { tasks: Partial<Board>, user_role: string }) {

    const columns: (keyof Board)[] = [
        "request",
        "todo",
        "in_progress",
        "in_review",
        "complete"
    ]

    const [board, setBoard] = useState<Board>({
        request: tasks?.request ?? [],
        todo: tasks?.todo ?? [],
        in_progress: tasks?.in_progress ?? [],
        in_review: tasks?.in_review ?? [],
        complete: tasks?.complete ?? []
    })

    const [selectedTask, setSelectedTask] = useState<Task | null>(null)

    function openTask(task: Task) {
        setSelectedTask(task)
    }

    function closeTask() {
        setSelectedTask(null)
    }

    function urgencyColor(level: string) {
        if (level === "high") return "bg-red-100 text-red-600"
        if (level === "medium") return "bg-yellow-100 text-yellow-600"
        return "bg-green-100 text-green-600"
    }

    function onDragEnd(result: DropResult) {
        if (user_role === "unit") return // unit tidak bisa drag

        const { source, destination, draggableId } = result
        if (!destination) return
        if (source.droppableId === destination.droppableId && source.index === destination.index) return

        const startColumn = source.droppableId as keyof Board
        const finishColumn = destination.droppableId as keyof Board

        const start = board[startColumn] || []
        const finish = board[finishColumn] || []

        const task = start[source.index]

        if (startColumn === finishColumn) {
            const newTasks = Array.from(start)
            newTasks.splice(source.index, 1)
            newTasks.splice(destination.index, 0, task)
            setBoard({ ...board, [startColumn]: newTasks })
        } else {
            const startTasks = Array.from(start)
            startTasks.splice(source.index, 1)
            const finishTasks = Array.from(finish)
            finishTasks.splice(destination.index, 0, task)
            setBoard({ ...board, [startColumn]: startTasks, [finishColumn]: finishTasks })
        }

        router.patch(
            `/requests/${draggableId}/status`,
            { status: finishColumn },
            { preserveScroll: true, preserveState: true }
        )
    }

    const renderTaskCard = (task: Task, isDraggable: boolean = true, index?: number) => {
        const cardContent = (
            <div
                onClick={() => openTask(task)}
                className="bg-white border rounded-lg p-3 mb-3 cursor-pointer hover:shadow-md transition-all duration-200 break-words"
            >
                {/* TITLE */}
                <p className="font-medium text-sm mb-1">{task.title}</p>

                {/* SENDER */}
                <p className="text-xs text-gray-400 mb-1 truncate">
                    From: {task.created_by_name}
                </p>

                {/* DEADLINE */}
                {task.deadline && (
                    <p className="text-xs text-gray-400 mb-2 truncate">
                        Deadline: {task.deadline}
                    </p>
                )}

                {/* FOOTER */}
                <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate">{task.unit}</p>
                    <span className={`text-xs px-2 py-1 rounded ${urgencyColor(task.urgency)}`}>
                        {task.urgency}
                    </span>
                </div>
            </div>
        )

        if (isDraggable && index !== undefined) {
            return (
                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                        >
                            {cardContent}
                        </div>
                    )}
                </Draggable>
            )
        }

        return <div key={task.id}>{cardContent}</div>
    }

    return (
        <>
            {user_role === "unit" ? (
                // READONLY BOARD UNTUK UNIT
                <div className="grid grid-cols-5 gap-4">
                    {columns.map((col) => (
                        <div key={col} className="bg-gray-50 rounded-xl p-3 min-h-[400px]">
                            <h2 className="font-semibold mb-3 capitalize text-sm text-gray-600">
                                {col.replace("_", " ")}
                            </h2>
                            {board[col]?.map((task) => renderTaskCard(task, false))}
                        </div>
                    ))}
                </div>
            ) : (
                // BOARD NORMAL UNTUK NON-UNIT
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
                                            renderTaskCard(task, true, index)
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            )}

            <TaskModal task={selectedTask} onClose={closeTask} />
        </>
    )
}
<?php

namespace App\Http\Controllers;

use App\Models\RevisionRequest;
use App\Models\RevisionLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RevisionRequestController extends Controller
{
    // Semua route harus login

    // Menampilkan board QMS
    public function index()
    {
        $tasks = RevisionRequest::with('creator:id,name') // ambil nama pembuat
            ->latest()
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'urgency' => $task->urgency,
                    'deadline' => $task->deadline,
                    'related_url' => $task->related_url,
                    'attachment' => $task->attachment,
                    'created_by_name' => $task->creator?->name,
                ];
            })
            ->groupBy('status');

        return Inertia::render('Requests/Index', [
            'tasks' => $tasks,
            'user_role' => auth()->user()->role,
            'user_id' => auth()->id(),
        ]);
    }

    // Form create request (hanya unit)
    public function create()
    {
        $user = auth()->user();
        if ($user->role !== 'unit') {
            abort(403, "Only units can create requests");
        }

        return Inertia::render('Requests/Create');
    }

    // Store request (hanya unit)
    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'unit') {
            abort(403, "Only units can create requests");
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'related_url' => 'nullable|string',
            'urgency' => 'required|in:high,medium,low',
            'deadline' => 'nullable|date',
            'attachment' => 'nullable|file|mimes:jpg,png,jpeg,pdf|max:5120', // max 5MB
        ]);

        $task = RevisionRequest::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'related_url' => $validated['related_url'] ?? null,
            'urgency' => $validated['urgency'],
            'deadline' => $validated['deadline'] ?? null,
            'status' => 'request',
            'created_by' => $user->id,
            'attachment' => $request->file('attachment')
                                ? $request->file('attachment')->store('revision_requests', 'public')
                                : null,
        ]);

        return redirect()->route('requests.index')
            ->with('success', 'Request created successfully');
    }

    // Update status, estimasi, assign technician (hanya technician)
    public function updateStatus(Request $request, $id)
    {
        $user = auth()->user();
        if ($user->role !== 'technician') {
            abort(403, "Only technicians can update status or estimations");
        }

        $validated = $request->validate([
            'status' => 'required|in:request,todo,in_progress,in_review,complete',
            'estimation_start' => 'nullable|date',
            'estimation_end' => 'nullable|date',
            'actual_start' => 'nullable|date',
            'actual_end' => 'nullable|date',
            'assign_to' => 'nullable|exists:users,id', // siapa yang ditugaskan
        ]);

        $task = RevisionRequest::findOrFail($id);
        $oldStatus = $task->status;

        $task->update([
            'status' => $validated['status'],
            'estimation_start' => $validated['estimation_start'] ?? $task->estimation_start,
            'estimation_end' => $validated['estimation_end'] ?? $task->estimation_end,
            'actual_start' => $validated['actual_start'] ?? $task->actual_start,
            'actual_end' => $validated['actual_end'] ?? $task->actual_end,
            'assigned_to' => $validated['assign_to'] ?? $task->assigned_to, // assign task ke user
        ]);

        RevisionLog::create([
            'revision_id' => $task->id,
            'from_status' => $oldStatus,
            'to_status' => $validated['status'],
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        return back()->with('success', 'Request updated successfully');
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\RevisionRequest;
use App\Models\RevisionAttachment;
use App\Models\RevisionLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\TaskStatusUpdated;
use App\Services\WhatsappService;

class RevisionRequestController extends Controller
{
    // =========================
    // INDEX
    // =========================
    public function index()
    {
        $tasks = RevisionRequest::with([
            'creator:id,name',
            'assignee:id,name',
            'attachments'
        ])
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

                // ✅ MULTI ATTACHMENT
                'attachments' => $task->attachments->map(fn($a) => [
                    'file_path' => $a->file_path
                ]),

                'created_by_name' => $task->creator?->name,

                'assigned_to' => $task->assigned_to,
                'assigned_to_name' => $task->assignee?->name,

                'estimation_start' => $task->estimation_start,
                'estimation_end' => $task->estimation_end,
            ];
        })
        ->groupBy('status');

        $users = User::select('id', 'name', 'role')
            ->where('role', 'technician')
            ->get();

        return Inertia::render('Requests/Index', [
            'tasks' => $tasks,
            'users' => $users,
            'user_role' => auth()->user()->role,
            'user_id' => auth()->id(),
        ]);
    }

    // =========================
    // CREATE (WAJIB ADA)
    // =========================
    public function create()
    {
        if (auth()->user()->role !== 'unit') {
            abort(403, 'Only units can create requests');
        }

        return Inertia::render('Requests/Create');
    }

    // =========================
    // STORE (MULTIPLE UPLOAD)
    // =========================
    public function store(Request $request)
    {
        if (auth()->user()->role !== 'unit') {
            abort(403, 'Only units can create requests');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'related_url' => 'nullable|string',
            'urgency' => 'required|in:high,medium,low',
            'deadline' => 'nullable|date',

            // ✅ MULTI FILE
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,png,jpeg,pdf|max:5120',
        ]);

        $task = RevisionRequest::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'related_url' => $validated['related_url'] ?? null,
            'urgency' => $validated['urgency'],
            'deadline' => $validated['deadline'] ?? null,
            'status' => 'request',
            'created_by' => auth()->id(),
        ]);

        // ✅ SIMPAN FILE
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {

                $path = $file->store('attachments', 'public');

                $task->attachments()->create([
                    'file_path' => $path
                ]);
            }
        }

        return redirect()
            ->route('requests.index')
            ->with('success', 'Request created successfully');
    }

    // =========================
    // UPDATE STATUS
    // =========================
    public function updateStatus(Request $request, $id)
    {
        $user = auth()->user();

        if (!in_array($user->role, ['technician', 'admin'])) {
            abort(403);
        }

        $task = RevisionRequest::findOrFail($id);
        $oldStatus = $task->status;

        $validated = $request->validate([
            'status' => 'required|in:request,todo,in_progress,in_review,complete',
            'assigned_to' => 'nullable|exists:users,id',
            'estimation_start' => 'nullable|date',
            'estimation_end' => 'nullable|date',
        ]);

        $task->update($validated);

        // 🔥 LOG + NOTIF
        if ($oldStatus !== $task->status) {

            RevisionLog::create([
                'revision_id' => $task->id,
                'from_status' => $oldStatus,
                'to_status' => $task->status,
                'changed_by' => $user->id,
                'changed_at' => now(),
            ]);

            $unitUser = User::find($task->created_by);

            if ($unitUser) {

                // EMAIL
                $unitUser->notify(new TaskStatusUpdated($task));

                // WA
                if ($unitUser->phone) {
                    $message =
                        "Update Request QMS\n\n" .
                        "Judul: {$task->title}\n" .
                        "Status Baru: {$task->status}\n\n" .
                        "Silakan cek dashboard QMS🙏.";

                    WhatsappService::send($unitUser->phone, $message);
                }
            }
        }

        return back()->with('success', 'Request updated');
    }

    // =========================
    // SHOW
    // =========================
    public function show($id)
    {
        $task = RevisionRequest::with(['creator', 'assignee', 'attachments'])
            ->findOrFail($id);

        return Inertia::render('Requests/Show', [
            'task' => $task
        ]);
    }

    // =========================
    // DELETE
    // =========================
    public function destroy($id)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403);
        }

        $task = RevisionRequest::findOrFail($id);
        $task->delete();

        return back()->with('success', 'Request deleted');
    }
}   
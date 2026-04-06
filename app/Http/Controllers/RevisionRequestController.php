<?php

namespace App\Http\Controllers;

use App\Models\RevisionRequest;
use App\Models\RevisionLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\TaskStatusUpdated;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

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
    // CREATE (🔥 FIX: tambah users + workload)
    // =========================
    public function create()
    {
        if (auth()->user()->role !== 'unit') {
            abort(403, 'Only units can create requests');
        }

        $users = User::select('id', 'name')
            ->where('role', 'technician')
            ->get()
            ->map(function ($user) {

                $workload = RevisionRequest::where('assigned_to', $user->id)
                    ->whereIn('status', ['todo', 'in_progress'])
                    ->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'workload' => $workload
                ];
            });

        return Inertia::render('Requests/Create', [
            'users' => $users
        ]);
    }

    // =========================
    // STORE (🔥 FIX: assigned_to + validation)
    // =========================
    public function store(Request $request)
    {
        if (auth()->user()->role !== 'unit') {
            abort(403, 'Only units can create requests');
        }

        // 🔥 DEBUG AWAL (LIHAT DATA MASUK)
        Log::info('REQUEST DEBUG', [
            'all' => $request->all(),
            'hasFile' => $request->hasFile('attachments'),
            'files' => $request->file('attachments')
        ]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'related_url' => 'nullable|url',
            'urgency' => 'required|in:high,medium,low',
            'deadline' => 'nullable|date',

            'assigned_to' => 'nullable|exists:users,id',

            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,png,jpeg,pdf',

        ]);

        $task = RevisionRequest::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'related_url' => $validated['related_url'] ?? null,
            'urgency' => $validated['urgency'],
            'deadline' => $validated['deadline'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'status' => 'request',
            'created_by' => auth()->id(),
        ]);

        // 🔥 DEBUG SEBELUM UPLOAD
        if (!$request->hasFile('attachments')) {
            Log::warning('NO FILE UPLOADED');
        }

        // ✅ FILE UPLOAD
        if ($request->hasFile('attachments')) {

            foreach ($request->file('attachments') as $file) {

                // 🔥 DEBUG PER FILE
                Log::info('UPLOADING FILE', [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                ]);

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

        if (in_array($request->status, ['todo', 'in_progress'])) {
            $request->validate([
                'assigned_to' => 'required|exists:users,id',
                'estimation_start' => 'required|date',
                'estimation_end' => 'required|date|after_or_equal:estimation_start',
            ]);
        }

        $task->update($validated);

        // LOG + NOTIF
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

                $unitUser->notify(new TaskStatusUpdated($task));

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

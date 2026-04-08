<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\RevisionRequestController;
use App\Models\User;
use App\Notifications\TaskStatusUpdated;
use App\Models\RevisionRequest;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Mail;
use App\Http\Controllers\UserController;


Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth'])->group(function () {

    Route::get('/technicians', [UserController::class, 'index'])
        ->name('technicians.index');

    Route::get('/technicians/create', [UserController::class, 'createTechnician'])
        ->name('technicians.create');

    Route::post('/technicians', [UserController::class, 'storeTechnician'])
        ->name('technicians.store');

    Route::get('/requests', [RevisionRequestController::class, 'index'])
        ->name('requests.index');

    Route::post('/requests', [RevisionRequestController::class, 'store']);

    Route::patch(
        '/requests/{id}/status',
        [RevisionRequestController::class, 'updateStatus']
    );

    Route::get('/requests/create', [RevisionRequestController::class, 'create']);
    Route::post('/requests', [RevisionRequestController::class, 'store']);

    Route::get('/test-wa', function () {

        $phone = "6289515779877"; // ganti dengan nomor kamu

        $message = "halo nyekk monyekkkkk🚀";

        WhatsappService::send($phone, $message);

        return "WA Sent";
    });
});

require __DIR__ . '/settings.php';

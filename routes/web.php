<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\RevisionRequestController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth'])->group(function(){
Route::get('/requests', [RevisionRequestController::class, 'index'])
    ->name('requests.index');

Route::post('/requests',[RevisionRequestController::class,'store']);

Route::patch('/requests/{id}/status',
[RevisionRequestController::class,'updateStatus']);

Route::get('/requests/create', [RevisionRequestController::class,'create']);
Route::post('/requests', [RevisionRequestController::class,'store']);

});

require __DIR__.'/settings.php';

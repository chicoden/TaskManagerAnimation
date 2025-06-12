#include <Windows.h>
#include <stdio.h>
#include <time.h>

typedef struct {
    LPSYNCHRONIZATION_BARRIER frame_barrier;
    volatile int keep_busy;
    volatile int* keep_alive;
} thread_param_t;

#define THREAD_COUNT 32
static const unsigned int FRAMES[] = {
    0x0000000001010101,
    0x0000000002020202,
    0x0000000004040404,
    0x0000000008080808,
    0x0000000010101010,
    0x0000000020202020,
    0x0000000040404040,
    0x0000000080808080,
    0x00000000000000FF,
    0x000000000000FF00,
    0x0000000000FF0000,
    0x00000000FF000000
};

DWORD WINAPI space_heater(LPVOID param) {
    printf("Entering thread %u\n", GetCurrentThreadId());
    thread_param_t* thread_params = (thread_param_t*)param;

    while (1) {
        EnterSynchronizationBarrier(thread_params->frame_barrier, SYNCHRONIZATION_BARRIER_FLAGS_BLOCK_ONLY);
        if (*(thread_params->keep_alive) == 0) break;

        if (thread_params->keep_busy) {
            clock_t start = clock();
            while (clock() - start < CLOCKS_PER_SEC * 60);
        } else {
            Sleep(60000);
        }

        EnterSynchronizationBarrier(thread_params->frame_barrier, SYNCHRONIZATION_BARRIER_FLAGS_BLOCK_ONLY);
    }

    printf("Exiting thread %u\n", GetCurrentThreadId());
    return 0;
}

int main() {
    HANDLE thread_handles[THREAD_COUNT];
    DWORD thread_ids[THREAD_COUNT];
    thread_param_t thread_params[THREAD_COUNT];
    SYNCHRONIZATION_BARRIER frame_barrier;
    volatile int keep_alive = 1;

    InitializeSynchronizationBarrier(&frame_barrier, THREAD_COUNT + 1, 0);
    for (int i = 0; i < THREAD_COUNT; i++) {
        thread_params[i].frame_barrier = &frame_barrier;
        thread_params[i].keep_alive = &keep_alive;
        thread_handles[i] = CreateThread(NULL, 0, space_heater, thread_params + i, 0, thread_ids + i);
        SetThreadAffinityMask(thread_handles[i], 1 << i);
    }

    for (int i = 0; i < sizeof(FRAMES) / sizeof(FRAMES[0]); i++) {
        for (int j = 0; j < THREAD_COUNT; j++) {
            thread_params[j].keep_busy = (FRAMES[i] & (1 << j)) != 0;
        }

        EnterSynchronizationBarrier(&frame_barrier, SYNCHRONIZATION_BARRIER_FLAGS_BLOCK_ONLY);
        EnterSynchronizationBarrier(&frame_barrier, SYNCHRONIZATION_BARRIER_FLAGS_BLOCK_ONLY);
    }

    keep_alive = 0;
    EnterSynchronizationBarrier(&frame_barrier, SYNCHRONIZATION_BARRIER_FLAGS_BLOCK_ONLY);
    WaitForMultipleObjects(THREAD_COUNT, thread_handles, TRUE, INFINITE);
    for (int i = 0; i < THREAD_COUNT; i++) {
        CloseHandle(thread_handles[i]);
    }

    DeleteSynchronizationBarrier(&frame_barrier);
    return 0;
}
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksAPI } from '../services/api';

export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (params, { rejectWithValue }) => {
        try {
            console.log('[fetchTasks] Fetching with params:', params);
            const response = await tasksAPI.getTasks(params);
            console.log('[fetchTasks] Response:', response.data);
            console.log('[fetchTasks] Found', response.data.tasks.length, 'tasks');
            return response.data.tasks;
        } catch (error) {
            console.error('[fetchTasks] Error:', error);
            console.error('[fetchTasks] Error response:', error.response?.data);
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch tasks');
        }
    }
);

export const acceptTask = createAsyncThunk(
    'tasks/acceptTask',
    async (taskId, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.acceptTask(taskId);
            return response.data.task;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to accept task');
        }
    }
);

export const rejectTask = createAsyncThunk(
    'tasks/rejectTask',
    async (taskId, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.rejectTask(taskId);
            return response.data.task;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to reject task');
        }
    }
);

export const completeTask = createAsyncThunk(
    'tasks/completeTask',
    async (taskId, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.completeTask(taskId);
            return response.data.task;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to complete task');
        }
    }
);

export const cancelTask = createAsyncThunk(
    'tasks/cancelTask',
    async (taskId, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.cancelTask(taskId);
            return response.data.task;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to cancel task');
        }
    }
);

const tasksSlice = createSlice({
    name: 'tasks',
    initialState: {
        tasks: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch tasks
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Accept task
            .addCase(acceptTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            // Reject task
            .addCase(rejectTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            // Complete task
            .addCase(completeTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            // Cancel task
            .addCase(cancelTask.fulfilled, (state, action) => {
                const index = state.tasks.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            });
    },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;

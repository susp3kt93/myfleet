import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksAPI } from '../lib/api';

export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (params, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.getTasks(params);
            return response.data.tasks;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch tasks');
        }
    }
);

export const createTask = createAsyncThunk(
    'tasks/createTask',
    async (taskData, { rejectWithValue }) => {
        try {
            const response = await tasksAPI.createTask(taskData);
            return response.data.task;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create task');
        }
    }
);

export const deleteTask = createAsyncThunk(
    'tasks/deleteTask',
    async (taskId, { rejectWithValue }) => {
        try {
            await tasksAPI.deleteTask(taskId);
            return taskId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete task');
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
            .addCase(createTask.fulfilled, (state, action) => {
                state.tasks.unshift(action.payload);
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.tasks = state.tasks.filter(t => t.id !== action.payload);
            });
    },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;

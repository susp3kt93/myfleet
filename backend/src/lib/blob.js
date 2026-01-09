import { put, del, list } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob Storage
 * @param {Buffer|ReadableStream} file - File data
 * @param {string} pathname - Path in blob storage (e.g., 'profiles/user123.jpg')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export async function uploadToBlob(file, pathname) {
    try {
        const blob = await put(pathname, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return blob.url;
    } catch (error) {
        console.error('Blob upload error:', error);
        throw new Error('Failed to upload file to blob storage');
    }
}

/**
 * Delete a file from Vercel Blob Storage
 * @param {string} url - Full blob URL to delete
 */
export async function deleteFromBlob(url) {
    try {
        await del(url, {
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
    } catch (error) {
        console.error('Blob delete error:', error);
        // Don't throw - deletion failures shouldn't break the flow
    }
}

/**
 * List all files in a blob storage path
 * @param {string} prefix - Path prefix (e.g., 'profiles/')
 * @returns {Promise<Array>} - Array of blob objects
 */
export async function listBlobFiles(prefix) {
    try {
        const { blobs } = await list({
            prefix,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return blobs;
    } catch (error) {
        console.error('Blob list error:', error);
        return [];
    }
}

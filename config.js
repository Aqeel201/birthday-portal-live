// Database Configuration for Supabase + IndexedDB Fallback
// === SETUP GUIDE ===
// 1. Create free account at https://supabase.com
// 2. Create new project
// 3. Go to Project Settings → API → copy URL & Anon Key
// 4. Go to Storage → Create new bucket named "birthday-photos"
// 5. Click bucket → Policies → Add "Upload" policy for "anon" role (INSERT)
// 6. Paste URL & Key below in CONFIG
// 7. Push to GitHub → auto deploy ho jayega

const CONFIG = {
    // 1. SUPABASE CREDENTIALS (Fill these to enable live backend)
    SUPABASE_URL: "", 
    SUPABASE_ANON_KEY: "",
    SUPABASE_BUCKET: "birthday-photos", // Same as bucket name you create
    
    // 2. Secret Admin Password for uploading photos
    ADMIN_PASSWORD: "love2026",
    
    // Fallback images bundled with the deployed site
    PLACEHOLDERS: {
        1: "photos/1.jpg",
        2: "photos/2.jpg",
        3: "photos/3.jpg",
        4: "photos/4.jpg",
        5: "photos/5.jpg",
        6: "photos/6.jpg"
    }
};

// ===================== IndexedDB Setup (Local Fallback) =====================
const DB_NAME = 'BirthdayPortalDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// ===================== SUPABASE: Check if configured =====================
function isSupabaseConfigured() {
    return !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && CONFIG.SUPABASE_URL.startsWith('https://'));
}

// ===================== SUPABASE: Upload Image to Storage =====================
async function uploadToSupabaseStorage(id, base64DataUrl) {
    const bucket = CONFIG.SUPABASE_BUCKET;
    const filename = `photo-${id}.jpg`;
    
    // Convert base64 to Blob
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    
    // Upload to Supabase Storage bucket
    const uploadRes = await fetch(
        `${CONFIG.SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`,
        {
            method: 'POST',
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                'Content-Type': 'image/jpeg'
            },
            body: blob
        }
    );
    
    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(`Supabase upload failed: ${err.message || uploadRes.statusText} (${uploadRes.status})`);
    }
    
    // Public URL for the uploaded image
    const publicUrl = `${CONFIG.SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
    return publicUrl;
}

// ===================== SUPABASE: Save URL to Database Table =====================
async function saveUrlToSupabaseTable(id, url) {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/photos`, {
        method: 'POST',
        headers: {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id: id, url: url, updated_at: new Date().toISOString() })
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Supabase table save failed: ${err.message || res.statusText} (${res.status})`);
    }
    return url;
}

// ===================== SUPABASE: Delete Image from Storage =====================
async function deleteFromSupabaseStorage(id) {
    const bucket = CONFIG.SUPABASE_BUCKET;
    const filename = `photo-${id}.jpg`;
    
    const res = await fetch(
        `${CONFIG.SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`,
        {
            method: 'DELETE',
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            }
        }
    );
    
    // Also delete from table
    try {
        await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/photos?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            }
        });
    } catch (e) {}
    
    return res.ok;
}

// ===================== Get Image URL (Supabase → IndexedDB → localStorage → Placeholder) =====================
async function getImageUrl(id) {
    // 1. SUPABASE (Live backend - works on all devices)
    if (isSupabaseConfigured()) {
        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/photos?id=eq.${id}&select=url`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });
            const data = await res.json();
            if (data && data[0] && data[0].url) {
                return data[0].url;
            }
            // If not in table but bucket exists, try direct public URL
            return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/${CONFIG.SUPABASE_BUCKET}/photo-${id}.jpg`;
        } catch (e) {
            console.error('Supabase fetch error:', e);
        }
    }
    
    // 2. INDEXEDDB (This browser only, larger storage)
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const result = await new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        if (result && result.url) {
            db.close();
            return result.url;
        }
        db.close();
    } catch (e) {
        console.error('IndexedDB error:', e);
    }
    
    // 3. LOCALSTORAGE (Legacy fallback, ~5MB limit)
    try {
        const localImg = localStorage.getItem(`birthday_photo_${id}`);
        if (localImg) return localImg;
    } catch (e) {
        console.error('localStorage error:', e);
    }
    
    // 4. BUNDLED PLACEHOLDER (Always works)
    return CONFIG.PLACEHOLDERS[id];
}

// ===================== Save Image URL (Supabase → IndexedDB → localStorage) =====================
async function saveImageUrl(id, url) {
    // 1. SUPABASE (Live backend - syncs everywhere)
    if (isSupabaseConfigured()) {
        try {
            // If it's a base64 data URL, upload to Storage first
            if (url.startsWith('data:image')) {
                const publicUrl = await uploadToSupabaseStorage(id, url);
                await saveUrlToSupabaseTable(id, publicUrl);
                return publicUrl;
            } else {
                // It's already a URL, just save to table
                await saveUrlToSupabaseTable(id, url);
                return url;
            }
        } catch (e) {
            console.error('Supabase save error:', e);
            throw e; // Don't silently fail - let user know
        }
    }
    
    // 2. INDEXEDDB (Local only, no quota issues)
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.put({ id: id, url: url, timestamp: Date.now() });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        db.close();
        try { localStorage.removeItem(`birthday_photo_${id}`); } catch (e) {}
        return url;
    } catch (e) {
        console.error('IndexedDB save error:', e);
    }
    
    // 3. LOCALSTORAGE (Last resort, limited to ~5MB)
    try {
        localStorage.setItem(`birthday_photo_${id}`, url);
    } catch (e) {
        console.error('Failed to save image:', e);
        throw new Error('Photo save nahi ho saka. Storage full hai. Kripya choti photo choose karein.');
    }
    return url;
}

// ===================== Clear All Photos =====================
async function clearAllPhotos() {
    // Clear Supabase (if configured)
    if (isSupabaseConfigured()) {
        try {
            for (let i = 1; i <= 6; i++) {
                await deleteFromSupabaseStorage(i);
            }
        } catch (e) {
            console.error('Supabase delete error:', e);
        }
    }
    
    // Clear IndexedDB
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        db.close();
    } catch (e) {
        console.error('Error clearing IndexedDB:', e);
    }
    
    // Clear localStorage
    for (let i = 1; i <= 6; i++) {
        try { localStorage.removeItem(`birthday_photo_${i}`); } catch (e) {}
    }
}

// ===================== Delete Single Photo =====================
async function deletePhoto(id) {
    // Delete from Supabase
    if (isSupabaseConfigured()) {
        try { await deleteFromSupabaseStorage(id); } catch (e) {}
    }
    
    // Delete from IndexedDB
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        db.close();
    } catch (e) {}
    
    // Delete from localStorage
    try { localStorage.removeItem(`birthday_photo_${id}`); } catch (e) {}
}

// ===================== Download Photo =====================
async function downloadPhoto(id, filename) {
    const url = await getImageUrl(id);
    if (!url || url.includes(CONFIG.PLACEHOLDERS[id])) {
        alert('Is photo ke liye koi uploaded image nahi hai!');
        return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `photo-${id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ===================== Get All Saved Photos =====================
async function getAllSavedPhotos() {
    const photos = {};
    for (let i = 1; i <= 6; i++) {
        const url = await getImageUrl(i);
        if (url && !url.includes(CONFIG.PLACEHOLDERS[i]) && !url.includes('unsplash')) {
            photos[i] = url;
        }
    }
    return photos;
}

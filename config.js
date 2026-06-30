// Database Configuration for Supabase + IndexedDB Fallback
// Agar aapke paas Supabase keys nahi hain, toh yeh IndexedDB/localStorage use karega.

const CONFIG = {
    // 1. Supabase credentials (Inhein live karne ke liye fill karein)
    SUPABASE_URL: "", 
    SUPABASE_ANON_KEY: "",
    
    // 2. Secret Admin Password for uploading photos
    ADMIN_PASSWORD: "love2026",
    
    // Fallback images bundled with the deployed site
    PLACEHOLDERS: {
        1: "photos/1.jpg", // Love Met
        2: "photos/2.jpg", // Talk
        3: "photos/3.jpg", // Knew
        4: "photos/4.jpg", // Remember
        5: "photos/5.jpg", // Funny
        6: "photos/6.jpg"  // Birthday
    }
};

// ===================== IndexedDB Setup =====================
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

// ===================== Get Image URL =====================
async function getImageUrl(id) {
    // 1. Try Supabase if configured
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/photos?id=eq.${id}&select=url`, {
                headers: {
                    "apikey": CONFIG.SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });
            const data = await res.json();
            if (data && data[0] && data[0].url) {
                return data[0].url;
            }
        } catch (e) {
            console.error("Supabase error, falling back to local:", e);
        }
    }
    
    // 2. Try IndexedDB (much larger storage than localStorage)
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
        console.error("IndexedDB error, falling back to localStorage:", e);
    }
    
    // 3. Try localStorage as legacy fallback
    try {
        const localImg = localStorage.getItem(`birthday_photo_${id}`);
        if (localImg) return localImg;
    } catch (e) {
        console.error("localStorage error:", e);
    }
    
    // 4. Return bundled placeholder
    return CONFIG.PLACEHOLDERS[id];
}

// ===================== Save Image URL =====================
async function saveImageUrl(id, url) {
    // 1. Try Supabase if configured
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
        try {
            await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/photos`, {
                method: "POST",
                headers: {
                    "apikey": CONFIG.SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates"
                },
                body: JSON.stringify({ id: id, url: url })
            });
            return;
        } catch (e) {
            console.error("Supabase save error:", e);
        }
    }
    
    // 2. Try IndexedDB first (handles larger images reliably)
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
        
        // Clean up old localStorage entry to avoid conflicts
        try {
            localStorage.removeItem(`birthday_photo_${id}`);
        } catch (e) {}
        return;
    } catch (e) {
        console.error("IndexedDB save error, falling back to localStorage:", e);
    }
    
    // 3. Fallback to localStorage (legacy, limited to ~5MB)
    try {
        localStorage.setItem(`birthday_photo_${id}`, url);
    } catch (e) {
        console.error("Failed to save image - storage quota exceeded:", e);
        throw new Error("Photo save nahi ho saka. Browser storage full hai. Kripya photos folder mein manually file daalein ya choti photo choose karein.");
    }
}

// ===================== Clear All Photos =====================
async function clearAllPhotos() {
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
        console.error("Error clearing IndexedDB:", e);
    }
    
    // Clear localStorage
    for (let i = 1; i <= 6; i++) {
        try {
            localStorage.removeItem(`birthday_photo_${i}`);
        } catch (e) {}
    }
}

// ===================== Export Helpers for Admin =====================
async function getAllSavedPhotos() {
    const photos = {};
    for (let i = 1; i <= 6; i++) {
        const url = await getImageUrl(i);
        // Only include if it's a data URL (user-uploaded) or not a placeholder
        if (url && !url.includes(CONFIG.PLACEHOLDERS[i]) && !url.includes('unsplash')) {
            photos[i] = url;
        }
    }
    return photos;
}

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

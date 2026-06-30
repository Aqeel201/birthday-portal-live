// Database Configuration for Supabase
// Agar aapke paas Supabase keys nahi hain, toh yeh local testing ke liye localStorage use karega.

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

// Helpers to get and set images dynamically
async function getImageUrl(id) {
    // If Supabase is configured
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
    
    // Local fallback: Check localStorage, then bundled images
    const localImg = localStorage.getItem(`birthday_photo_${id}`);
    if (localImg) return localImg;
    
    return CONFIG.PLACEHOLDERS[id];
}

async function saveImageUrl(id, url) {
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
    
    // Save locally
    localStorage.setItem(`birthday_photo_${id}`, url);
}

/*
Full authentication helper + auth-aware fetch wrapper for a Django + Djoser(SimpleJWT) backend.
Save this file as: frontend/js/auth-and-fetch-wrapper.js
Include it in your login page and other pages that need auth:
<script src="/js/auth-and-fetch-wrapper.js"></script>

What this file provides (exported to global window object):
- Auth.login(identifier, password)     -> login (identifier = username or email depending on your DJOSER LOGIN_FIELD)
- Auth.register(...)                    -> optional registration helper (depends on your backend endpoints)
- Auth.logout()                         -> clears tokens and stops auto refresh
- Auth.getAccessToken()                 -> returns access token string or null
- Auth.authFetch(input, init)           -> replacement for fetch that injects Authorization and auto-refreshes tokens
- Auth.addToCart(productId, qty)        -> example of calling a protected cart endpoint using authFetch

IMPORTANT: Adjust endpoint paths if your project uses different URLs.
Default assumptions used here:
- POST /auth/jwt/create/    -> returns { access, refresh }
- POST /auth/jwt/refresh/   -> returns { access }
- Protected endpoints expect header: Authorization: Bearer <access>

*/

const Auth = (function(){
    const API_BASE = "http://127.0.0.1:8000"; // change if needed
    const LOGIN_URL = API_BASE + "/auth/jwt/create/";
    const REFRESH_URL = API_BASE + "/auth/jwt/refresh/";

    let refreshTimer = null; // id for automatic refresh

    // ---------- Token storage helpers ----------
    function saveTokens({ access, refresh }){
        if(access) localStorage.setItem("access_token", access);
        if(refresh) localStorage.setItem("refresh_token", refresh);
    }
    function clearTokens(){
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
    }
    function getAccessToken(){ return localStorage.getItem("access_token"); }
    function getRefreshToken(){ return localStorage.getItem("refresh_token"); }

    // ---------- JWT helpers ----------
    function decodeBase64Url(str){
        // replace URL-safe chars
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        // pad with =
        while (str.length % 4) str += '=';
        try { return atob(str); } catch(e) { return null; }
    }
    function decodeJWT(token){
        if(!token) return null;
        const parts = token.split('.');
        if(parts.length !== 3) return null;
        try{
            const payload = decodeBase64Url(parts[1]);
            return JSON.parse(payload);
        }catch(e){ return null; }
    }
    function isTokenExpired(token, offsetSeconds = 10){
        const data = decodeJWT(token);
        if(!data || !data.exp) return true;
        const now = Math.floor(Date.now() / 1000);
        return (data.exp - offsetSeconds) <= now;
    }

    // ---------- Automatic refresh scheduling ----------
    function scheduleAutoRefresh(){
        // clear existing
        if(refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
        const refresh = getRefreshToken();
        const access = getAccessToken();
        if(!refresh || !access) return;
        const payload = decodeJWT(access);
        if(!payload || !payload.exp) return;
        const now = Math.floor(Date.now() / 1000);
        const secsLeft = payload.exp - now;
        // We'll attempt to refresh when there are 30s left or at half the remaining time if it's large
        const refreshIn = Math.max(5, Math.floor(secsLeft - 30));
        // If already expired or near expiry, refresh now
        if(secsLeft <= 40){
            refreshToken().catch(()=>{}); // try now
            return;
        }
        refreshTimer = setTimeout(()=>{
            refreshToken().catch(()=>{});
        }, refreshIn * 1000);
    }

    // ---------- Network helpers: login / refresh / logout ----------
    async function login(identifier, password, opts = {}){
        // identifier can be username or email depending on your DJOSER LOGIN_FIELD
        const bodyObj = opts.loginField === 'email' ? { email: identifier, password } : { username: identifier, password };
        const res = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
        });
        const data = await res.json();
        if(!res.ok){
            // bubble error message
            throw data;
        }
        saveTokens(data);
        scheduleAutoRefresh();
        return data;
    }

    async function refreshToken(){
        const refresh = getRefreshToken();
        if(!refresh) throw new Error('No refresh token');
        const res = await fetch(REFRESH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });
        const data = await res.json();
        if(!res.ok){
            // refresh failed: logout the user
            clearTokens();
            throw data;
        }
        // SimpleJWT returns { access: '...' }
        if(data.access) saveTokens({ access: data.access });
        scheduleAutoRefresh();
        return data.access;
    }

    function logout(){
        clearTokens();
        if(refreshTimer){ clearTimeout(refreshTimer); refreshTimer = null; }
    }

    // ---------- authFetch wrapper ----------
    async function authFetch(input, init = {}){
        // Ensure headers exists
        init.headers = init.headers || {};

        // attach token if present
        let access = getAccessToken();
        if(access && !isTokenExpired(access)){
            init.headers['Authorization'] = `Bearer ${access}`;
        }

        // perform request
        let res = await fetch(input, init);

        // If unauthorized due to expired access token, try refresh then retry once
        if(res.status === 401 || res.status === 403){
            try{
                const newAccess = await refreshToken();
                if(newAccess){
                    init.headers['Authorization'] = `Bearer ${newAccess}`;
                    res = await fetch(input, init);
                }
            }catch(e){
                // refresh failed -> user must login again
                logout();
                throw e;
            }
        }
        return res;
    }

    // ---------- Example protected operation: addToCart ----------
    // Adjust endpoint/path body according to your API
    async function addToCart(productId, quantity = 1){
        // Example: POST /shop/cart/ with JSON { product: id, quantity: n }
        const res = await authFetch(API_BASE + '/shop/cart/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: productId, quantity })
        });
        if(!res.ok){
            const err = await res.json().catch(()=>({ detail: 'unknown' }));
            throw err;
        }
        return res.json();
    }

    // ---------- Utility: secureFetchJSON ----------
    async function authFetchJSON(input, init = {}){
        const res = await authFetch(input, init);
        const data = await res.json().catch(()=>null);
        if(!res.ok){ throw data || { detail: 'request failed' }; }
        return data;
    }

    // on load, schedule auto refresh if tokens exist
    if(getAccessToken() && getRefreshToken()) scheduleAutoRefresh();

    // Public API
    return {
        login,
        refreshToken,
        logout,
        getAccessToken,
        getRefreshToken,
        authFetch,
        authFetchJSON,
        addToCart,
        clearTokens
    };
})();

// expose globally
window.Auth = Auth;

/*
Usage examples (in your HTML/other JS):

// Login button handler
async function handleLogin(e){
    e.preventDefault();
    const identifier = document.getElementById('id_username').value; // or 'id_email'
    const password = document.getElementById('id_password').value;
    try{
        await Auth.login(identifier, password, { loginField: 'username' }); // or 'email'
        alert('Login successful');
        // reload or call your fetchCart() that uses Auth.authFetch
    }catch(err){
        console.error('Login error', err);
        alert('Login failed: ' + (err.detail || JSON.stringify(err)));
    }
}

// Using authFetch to get protected resource
async function fetchCart(){
    try{
        const data = await Auth.authFetchJSON('http://127.0.0.1:8000/shop/cart/');
        // render cart
        console.log(data);
    }catch(e){
        console.error('Failed to fetch cart', e);
    }
}

// Add to cart from product list
async function addToCartButton(productId){
    try{
        const result = await Auth.addToCart(productId, 1);
        alert('Added to cart');
        fetchCart();
    }catch(e){
        console.error('Add to cart failed', e);
        alert('Add to cart failed: ' + (e.detail || JSON.stringify(e)));
    }
}

*/

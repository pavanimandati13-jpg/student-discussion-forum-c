// Import modern module web SDK hooks directly from Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your verified operational configuration parameters 
const firebaseConfig = {
    apiKey: "AIzaSyC9ZJ4GYYTqkpNCmoNQmcNG0n_Example_Key", // Replace this key with your exact full API Key string from your settings screen if it fails
    authDomain: "student-discussion-forum.firebaseapp.com",
    projectId: "student-discussion-forum",
    storageBucket: "student-discussion-forum.appspot.com",
    messagingSenderId: "444166224441",
    appId: "1:444166224441:web:10e39fa0a40bb222982be8", // Injected your exact updated ID string from your visual capture page
    measurementId: "G-HNPKX931QJ"
};

// Fire up core engine components
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Application Lifecycle State Cache
let isLoginMode = true;
let currentUser = null;

// Bind to Dynamic DOM Selectors
const authSection = document.getElementById('auth-section');
const forumSection = document.getElementById('forum-section');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const authToggleMsg = document.getElementById('auth-toggle-msg');

const navUserInfo = document.getElementById('nav-user-info');
const userDisplayEmail = document.getElementById('user-display-email');
const btnLogout = document.getElementById('btn-logout');

const postForm = document.getElementById('post-form');
const postTitle = document.getElementById('post-title');
const postContent = document.getElementById('post-content');
const postsContainer = document.getElementById('posts-container');

// --- USER MANAGEMENT CONTROLLER ---
btnToggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerText = "Login to Forum";
        btnAuthSubmit.innerText = "Sign In";
        authToggleMsg.innerText = "Don't have an account?";
        btnToggleAuth.innerText = "Register here";
    } else {
        authTitle.innerText = "Create Student Account";
        btnAuthSubmit.innerText = "Sign Up";
        authToggleMsg.innerText = "Already registered?";
        btnToggleAuth.innerText = "Login here";
    }
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, password)
            .catch(err => alert("Login Notice: " + err.message));
    } else {
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => alert("Registration successful! Welcome to the student community."))
            .catch(err => alert("Registration Notice: " + err.message));
    }
});

btnLogout.addEventListener('click', () => {
    signOut(auth).catch(err => alert(err.message));
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        authSection.classList.add('hidden');
        forumSection.classList.remove('hidden');
        navUserInfo.classList.remove('hidden');
        userDisplayEmail.innerText = user.email;
        authForm.reset();
        streamDiscussions();
    } else {
        currentUser = null;
        authSection.classList.remove('hidden');
        forumSection.classList.add('hidden');
        navUserInfo.classList.add('hidden');
    }
});

// --- CORE FORUM CONTROLLER ENGINE ---
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "posts"), {
            title: postTitle.value,
            content: postContent.value,
            author: currentUser.email,
            createdAt: serverTimestamp()
        });
        postForm.reset();
    } catch (error) {
        alert("Transaction Failed: " + error.message);
    }
});

function streamDiscussions() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        postsContainer.innerHTML = "";
        
        if(snapshot.empty) {
            postsContainer.innerHTML = `
                <div class="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p class="text-sm text-slate-400 italic">No threads matching this context are available. Initiate the first post!</p>
                </div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const postData = docSnap.data();
            const postId = docSnap.id;
            
            const postEl = document.createElement('div');
            postEl.className = "post-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4";
            postEl.innerHTML = `
                <div>
                    <h4 class="text-base font-bold text-slate-900">${postData.title}</h4>
                    <p class="text-[11px] text-slate-400 mt-0.5">Identified Author: <span class="text-indigo-600 font-semibold">${postData.author}</span></p>
                    <p class="text-sm text-slate-600 mt-3 whitespace-pre-wrap leading-relaxed">${postData.content}</p>
                </div>
                <hr class="border-slate-100">
                <div class="bg-slate-50/50 p-4 rounded-xl">
                    <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Community Responses</h5>
                    <div id="replies-container-${postId}" class="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                        <p class="text-xs text-slate-400 italic">Reading data stream...</p>
                    </div>
                    <form id="reply-form-${postId}" class="flex gap-2 mt-2">
                        <input type="text" placeholder="Type an insightful reply..." required class="flex-1 bg-white border border-slate-200 text-xs p-2.5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                        <button type="submit" class="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all">Reply</button>
                    </form>
                </div>
            `;
            
            postsContainer.appendChild(postEl);
            streamReplies(postId);
            setupReplyHandler(postId);
        });
    });
}

function streamReplies(postId) {
    const repliesRef = collection(db, "posts", postId, "replies");
    const q = query(repliesRef, orderBy("createdAt", "asc"));
    
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById(`replies-container-${postId}`);
        if (!container) return;
        
        container.innerHTML = "";
        if (snapshot.empty) {
            container.innerHTML = `<p class="text-[11px] text-slate-400 italic">No responses recorded yet.</p>`;
            return;
        }
        
        snapshot.forEach(docSnap => {
            const reply = docSnap.data();
            const replyEl = document.createElement('div');
            replyEl.className = "bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs";
            replyEl.innerHTML = `
                <p class="text-[10px] text-indigo-600 font-bold mb-0.5">${reply.author}</p>
                <p class="text-xs text-slate-700 leading-normal">${reply.text}</p>
            `;
            container.appendChild(replyEl);
        });
    });
}

function setupReplyHandler(postId) {
    const form = document.getElementById(`reply-form-${postId}`);
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input');
        const replyText = input.value;
        
        try {
            await addDoc(collection(db, "posts", postId, "replies"), {
                text: replyText,
                author: currentUser.email,
                createdAt: serverTimestamp()
            });
            input.value = "";
        } catch (error) {
            alert("Reply Submission Dropped: " + error.message);
        }
    });
}

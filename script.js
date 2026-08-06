// Local Storage Database Initialization
let posts = JSON.parse(localStorage.getItem('forum_posts')) || [
  {
    id: 1,
    title: "Node. Js",
    body: "How do I set up Express server routes properly in Node?",
    author: "Mandati pavani",
    email: "pavani@example.com",
    date: "2026-08-06"
  }
];

let currentUser = JSON.parse(localStorage.getItem('forum_user')) || null;

window.onload = () => {
  checkUserSession();
  renderPosts(posts);
};

function checkUserSession() {
  if (currentUser) {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('user-profile').classList.remove('hidden');
    document.getElementById('post-form').classList.remove('hidden');
    
    document.getElementById('logged-user-name').innerText = currentUser.name;
    document.getElementById('logged-user-email').innerText = currentUser.email;
  }
}

function handleLogin() {
  const name = document.getElementById('user-name-input').value.trim();
  const email = document.getElementById('email-input').value.trim();

  if (!name || !email) {
    alert("Please enter both your name and email!");
    return;
  }

  currentUser = { name, email };
  localStorage.setItem('forum_user', JSON.stringify(currentUser));
  checkUserSession();
}

function handleLogout() {
  localStorage.removeItem('forum_user');
  location.reload();
}

function createPost() {
  const title = document.getElementById('post-title').value.trim();
  const body = document.getElementById('post-body').value.trim();

  if (!title || !body) {
    alert("Please enter a title and question body!");
    return;
  }

  const newPost = {
    id: Date.now(),
    title: title,
    body: body,
    author: currentUser.name,
    email: currentUser.email,
    date: new Date().toISOString().split('T')[0]
  };

  posts.unshift(newPost); // Add new post to top
  localStorage.setItem('forum_posts', JSON.stringify(posts));

  // Reset Form
  document.getElementById('post-title').value = '';
  document.getElementById('post-body').value = '';

  renderPosts(posts);
}

function renderPosts(postsToRender) {
  const container = document.getElementById('discussions-container');

  if (postsToRender.length === 0) {
    container.innerHTML = `<p style="color:#6b7280; font-size:0.9rem;">No matching discussions found.</p>`;
    return;
  }

  container.innerHTML = postsToRender.map(post => `
    <div class="post-card">
      <h4>${post.title}</h4>
      <p>${post.body}</p>
      <div class="post-meta">
        <span>By: <strong>${post.author}</strong></span>
        <span>${post.date}</span>
      </div>
    </div>
  `).join('');
}

function filterPosts() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const filtered = posts.filter(post => 
    post.title.toLowerCase().includes(query) || 
    post.body.toLowerCase().includes(query) ||
    post.author.toLowerCase().includes(query)
  );
  renderPosts(filtered);
}

function clearAllData() {
  if (confirm("Reset forum back to default data?")) {
    localStorage.clear();
    location.reload();
  }
}

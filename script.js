let posts = JSON.parse(localStorage.getItem("posts")) || [];

function displayPosts() {
    const postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = "";

    posts.forEach((post) => {
        postsDiv.innerHTML += `
            <div class="post">
                <h3>${post.name}</h3>
                <p>${post.message}</p>
            </div>
        `;
    });
}

function addPost() {
    const name = document.getElementById("name").value.trim();
    const message = document.getElementById("message").value.trim();

    if (name === "" || message === "") {
        alert("Please enter your name and discussion.");
        return;
    }

    posts.unshift({
        name: name,
        message: message
    });

    localStorage.setItem("posts", JSON.stringify(posts));

    document.getElementById("name").value = "";
    document.getElementById("message").value = "";

    displayPosts();
}

displayPosts();
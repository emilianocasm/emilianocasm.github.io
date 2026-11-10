document.addEventListener('DOMContentLoaded', async () => {
  const postsUrl = '../data/posts.json';
  const currentPath = window.location.pathname;
  const isPostPage = currentPath.includes('/blog/post.html');

  const renderPostCard = (post) => `
    <article class="post-card">
      <span class="date">${post.date}</span>
      <h2><a href="post.html?id=${post.id}">${post.title}</a></h2>
      <p>${post.summary}</p>
    </article>
  `;

  const renderPostDetail = (post) => {
    const article = document.getElementById('post-article');
    if (!article) return;

    article.innerHTML = `
      <p class="eyebrow">${post.date}</p>
      <h1>${post.title}</h1>
      <div class="article-content">${post.content}</div>
    `;
  };

  try {
    const response = await fetch(postsUrl);
    if (!response.ok) throw new Error('No se pudo cargar el blog');

    const posts = await response.json();

    if (isPostPage) {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('id');
      const post = posts.find((item) => item.id === postId);

      if (post) {
        renderPostDetail(post);
        document.title = `${post.title} | Emiliano Izquierdo`;
      } else {
        document.getElementById('post-article').innerHTML = '<h1>Post no encontrado</h1>';
      }
      return;
    }

    const latestPosts = document.getElementById('latest-posts');
    const blogList = document.getElementById('blog-list');

    if (latestPosts) {
      latestPosts.innerHTML = posts.slice(0, 3).map(renderPostCard).join('');
    }

    if (blogList) {
      blogList.innerHTML = posts.map(renderPostCard).join('');
    }
  } catch (error) {
    const fallback = document.getElementById('latest-posts') || document.getElementById('blog-list') || document.getElementById('post-article');
    if (fallback) {
      fallback.innerHTML = '<p>No se pudieron cargar los posts.</p>';
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const postsUrl = '../data/posts.json';
  const currentPath = window.location.pathname;
  const isPostPage = currentPath.includes('/blog/post.html');

  const renderPostCard = (post) => `
    <article class="post-card">
      <span class="date">${post.date}</span>
      <h2><a href="${post.url || `post.html?id=${post.id}`}">${post.title}</a></h2>
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

  const drawBarChart = (canvasId, labels, values, color) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 32;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const maxValue = Math.max(...values, 100);

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    values.forEach((value, index) => {
      const barWidth = (chartWidth / values.length) * 0.58;
      const x = padding + index * (chartWidth / values.length) + 18;
      const barHeight = (value / maxValue) * chartHeight;
      const y = height - padding - barHeight;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#e5ebff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x + barWidth / 2, height - 10);
    });
  };

  const drawDonutChart = (canvasId, data, colors) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 68;
    const total = data.reduce((sum, value) => sum + value, 0);
    let start = -Math.PI / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.forEach((value, index) => {
      const slice = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = colors[index];
      ctx.fill();
      start += slice;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1020';
    ctx.fill();

    ctx.fillStyle = '#e5ebff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('100%', centerX, centerY + 6);
  };

  const renderPdfPreview = async () => {
    const canvas = document.getElementById('pdfCanvas');
    const prevBtn = document.getElementById('pdfPrev');
    const nextBtn = document.getElementById('pdfNext');
    const label = document.getElementById('pdfPageLabel');
    if (!canvas || !prevBtn || !nextBtn || !label) return;

    const pdfUrl = 'data/Sharding%20en%20PostgreSQL%20gu%C3%ADa%20y%20casos%20de%20uso.pdf';
    let pdfDoc = null;
    let pageNumber = 1;

    const renderPage = async (pageNum) => {
      if (!pdfDoc) return;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.35 });
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      label.textContent = `Página ${pageNum}`;
      prevBtn.disabled = pageNum <= 1;
      nextBtn.disabled = pageNum >= pdfDoc.numPages;
    };

    try {
      const pdfjsLib = window['pdfjsLib'];
      if (!pdfjsLib) {
        canvas.getContext('2d').fillStyle = '#0b1020';
        canvas.getContext('2d').fillRect(0, 0, canvas.width, canvas.height);
        label.textContent = 'PDF no disponible';
        return;
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs';
      pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
      pageNumber = 1;
      await renderPage(pageNumber);
      prevBtn.addEventListener('click', () => {
        if (pageNumber > 1) {
          pageNumber -= 1;
          renderPage(pageNumber);
        }
      });
      nextBtn.addEventListener('click', () => {
        if (pageNumber < pdfDoc.numPages) {
          pageNumber += 1;
          renderPage(pageNumber);
        }
      });
    } catch (error) {
      label.textContent = 'No se pudo renderizar el PDF';
    }
  };

  try {
    drawBarChart('skillsChart', ['Backend', 'Arquitectura', 'Cloud', 'Liderazgo'], [95, 90, 88, 82], '#7dd3fc');
    drawDonutChart('deliveryChart', [45, 30, 25], ['#7dd3fc', '#38bdf8', '#a78bfa']);

    const pdfScript = document.createElement('script');
    pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    pdfScript.onload = renderPdfPreview;
    document.body.appendChild(pdfScript);

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

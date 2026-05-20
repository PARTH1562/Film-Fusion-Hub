/* FilmFusion client-side script
 *
 * Handles AJAX review interactions, real-time Socket.io updates and
 * admin user management on the manage-users page.
 */

(function () {
  const base = (document.body && document.body.dataset.base) || "/";
  const apiBase = base + "api";

  async function api(path, opts = {}) {
    const res = await fetch(apiBase + path, {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      credentials: "include",
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 204) return null;
    let json = null;
    try { json = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
      const msg = (json && json.error && json.error.message) || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return json;
  }

  // ---------------- Movie detail page ----------------

  const detail = document.querySelector(".movie-detail");
  if (detail) initMovieDetail(detail);

  const currentUserId = document.body.dataset.userId;

  function initMovieDetail(root) {
    const movieId = root.dataset.movieId;
    const list = document.getElementById("reviews-list");
    const countEl = document.getElementById("review-count");
    const noEmpty = document.getElementById("no-reviews");
    const form = document.getElementById("review-form");
    const errEl = form && form.querySelector(".review-form__error");
    const deleteBtn = document.getElementById("delete-review");

    function setError(msg) {
      if (!errEl) return;
      if (!msg) { errEl.hidden = true; errEl.textContent = ""; return; }
      errEl.hidden = false; errEl.textContent = msg;
    }

    function updateCount(delta) {
      if (!countEl) return;
      const m = countEl.textContent.match(/\((\d+)\)/);
      const cur = m ? Number(m[1]) : 0;
      countEl.textContent = `(${Math.max(0, cur + delta)})`;
    }

    function renderReview(r) {
      const li = document.createElement("li");
      li.className = "review";
      li.dataset.reviewId = r.id;
      const author = r.author && r.author.name ? r.author.name : "Anonymous";
      const created = new Date(r.createdAt).toLocaleDateString();
      const upCount = r.upvoteCount || (r.upvotes ? r.upvotes.length : 0);
      const downCount = r.downvoteCount || (r.downvotes ? r.downvotes.length : 0);
      
      const isUpvoted = r.upvotes && r.upvotes.includes(currentUserId);
      const isDownvoted = r.downvotes && r.downvotes.includes(currentUserId);

      const sentimentEmoji = r.sentimentLabel === 'positive' ? '😊' : (r.sentimentLabel === 'negative' ? '😞' : '😐');
      const sentimentClass = r.sentimentLabel ? `badge--sentiment-${r.sentimentLabel}` : '';

      li.innerHTML = `
        <header class="review__head">
          <div>
            <strong></strong>
            <span class="review__rating"></span>
            ${r.sentimentLabel ? `<span class="badge ${sentimentClass}" style="margin-left: 10px; font-size: 0.7rem;">${sentimentEmoji} ${r.sentimentLabel.toUpperCase()}</span>` : ''}
          </div>
          <time>${created}</time>
        </header>
        <p class="review__text"></p>
        <div class="review__actions">
          <button class="vote vote--up ${isUpvoted ? 'is-active' : ''}" data-id="${r.id}" data-vote="up">
            <i class="fas fa-thumbs-up"></i>
            <span class="vote__count">${upCount}</span>
          </button>
          <button class="vote vote--down ${isDownvoted ? 'is-active' : ''}" data-id="${r.id}" data-vote="down">
            <i class="fas fa-thumbs-down"></i>
            <span class="vote__count">${downCount}</span>
          </button>
        </div>`;
      li.querySelector(".review__head strong").textContent = author;
      li.querySelector(".review__rating").textContent = `★ ${r.rating}/5`;
      li.querySelector(".review__text").textContent = r.text;
      return li;
    }

    function upsertReview(r) {
      const existing = list.querySelector(`[data-review-id="${r.id}"]`);
      const node = renderReview(r);
      if (existing) {
        existing.replaceWith(node);
      } else {
        list.prepend(node);
        updateCount(+1);
        if (noEmpty) noEmpty.remove();
      }
    }

    function removeReview(id) {
      const existing = list.querySelector(`[data-review-id="${id}"]`);
      if (existing) {
        existing.remove();
        updateCount(-1);
      }
    }

    if (form) {
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        setError(null);
        const data = new FormData(form);
        const rating = Number(data.get("rating"));
        const text = String(data.get("text") || "").trim();
        if (!rating || !text) { setError("Please pick a rating and write a review."); return; }
        
        try {
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          submitBtn.disabled = true;
          submitBtn.textContent = "Posting...";

          const isUpdate = form.querySelector('h3').textContent.includes('Update');
          const myExistingId = deleteBtn && deleteBtn.dataset.id;

          let result;
          if (isUpdate && myExistingId) {
            result = await api(`/reviews/${myExistingId}`, {
              method: "PATCH",
              body: { rating, text },
            });
          } else {
            result = await api(`/movies/${movieId}/reviews`, {
              method: "POST",
              body: { rating, text },
            });
          }

          if (result && result.data && result.data.review) {
            upsertReview(result.data.review);
            // After successful post/update, we might want to refresh to update the "myReview" state
            // or just update the UI manually. For simplicity, we'll reload for now to reset form state.
            window.location.reload();
          }
        } catch (err) {
          setError(err.message);
          const submitBtn = form.querySelector('button[type="submit"]');
          submitBtn.disabled = false;
          submitBtn.textContent = form.querySelector('h3').textContent.includes('Update') ? 'Save changes' : 'Post review';
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Delete your review? This will allow you to post a fresh one.")) return;
        try {
          await api(`/reviews/${deleteBtn.dataset.id}`, { method: "DELETE" });
          removeReview(deleteBtn.dataset.id);
          // Reload to reset the form state to "Write a review"
          window.location.reload();
        } catch (err) { alert(err.message); }
      });
    }

    list && list.addEventListener("click", async (ev) => {
      const btn = ev.target.closest(".vote");
      if (!btn) return;
      try {
        const result = await api(`/reviews/${btn.dataset.id}/${btn.dataset.vote === "up" ? "upvote" : "downvote"}`, { method: "POST" });
        if (result && result.data && result.data.review) {
          upsertReview(result.data.review);
        }
      } catch (err) { alert(err.message); }
    });

    if (window.io) {
      const socket = window.io({ path: "/socket.io" });
      socket.emit("join:movie", movieId);
      socket.on("review:created", (p) => p && p.review && upsertReview(p.review));
      socket.on("review:updated", (p) => p && p.review && upsertReview(p.review));
      socket.on("review:voted", (p) => p && p.review && upsertReview(p.review));
      socket.on("review:deleted", (p) => p && p.id && removeReview(p.id));
    }
  }

  // ---------------- Admin: users page ----------------

  document.querySelectorAll(".js-user-role").forEach((sel) => {
    sel.addEventListener("change", async () => {
      try { await api(`/users/${sel.dataset.id}`, { method: "PATCH", body: { role: sel.value } }); }
      catch (err) { alert(err.message); }
    });
  });

  document.querySelectorAll(".js-user-toggle").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const next = btn.dataset.active !== "true";
      try {
        await api(`/users/${btn.dataset.id}`, { method: "PATCH", body: { isActive: next } });
        btn.dataset.active = String(next);
        btn.textContent = next ? "Active" : "Disabled";
      } catch (err) { alert(err.message); }
    });
  });

  document.querySelectorAll(".js-user-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this user and all their reviews?")) return;
      try {
        await api(`/users/${btn.dataset.id}`, { method: "DELETE" });
        const row = btn.closest("tr"); if (row) row.remove();
      } catch (err) { alert(err.message); }
    });
  });

  // Navbar Dropdown
  const dropdownTrigger = document.getElementById("user-dropdown-trigger");
  const dropdownMenu = document.getElementById("user-dropdown");
  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("is-active");
    });
    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("is-active");
    });
  }
})();

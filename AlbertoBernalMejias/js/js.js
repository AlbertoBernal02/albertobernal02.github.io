// js/js.js
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    initActiveNav();
    initNavbarScrolled();
    initSmoothAnchors();
    initCvDownloadConfirm();
    initContactFormValidation();
    initGalleryFilters();
    initLightbox();
  });

  // Marca activo según la URL (usa data-nav="index|gallery|aboutme|contact")
  function initActiveNav() {
    const path = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const pageKey = (path.split(".")[0] || "index").toLowerCase();
    document.querySelectorAll("[data-nav]").forEach(link => {
      const key = link.getAttribute("data-nav")?.toLowerCase();
      if (key === pageKey) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });
  }

  // Sombra en navbar al hacer scroll
  function initNavbarScrolled() {
    const nav = document.querySelector(".navbar-blur");
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 8) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Scroll suave para anchors (respeta reduce motion)
  function initSmoothAnchors() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      const target = id && document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.tabIndex = -1; // para que pueda enfocarse
        target.focus({ preventScroll: true });
      }
    });
  }

  // Confirmación elegante para descargar CV (usa modal de Bootstrap si existe; si no, confirm nativo)
  function initCvDownloadConfirm() {
    const link = document.querySelector('a[href$="CVABM.pdf"]');
    if (!link) return;

    link.addEventListener("click", (event) => {
      // ¿Hay modal con id #confirmDownloadModal?
      const modalEl = document.getElementById("confirmDownloadModal");
      if (modalEl && window.bootstrap?.Modal) {
        event.preventDefault();
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();

        const confirmBtn = modalEl.querySelector("[data-confirm-download]");
        const cancelBtn = modalEl.querySelector("[data-cancel-download]");
        const cleanup = () => {
          confirmBtn?.removeEventListener("click", onConfirm);
          cancelBtn?.removeEventListener("click", onCancel);
          modalEl.removeEventListener("hidden.bs.modal", cleanup);
        };
        const onConfirm = () => {
          modal.hide();
          // fuerza descarga manteniendo atributo download si está
          const a = document.createElement("a");
          a.href = link.href;
          a.download = link.getAttribute("download") || "";
          document.body.appendChild(a);
          a.click();
          a.remove();
        };
        const onCancel = () => modal.hide();

        confirmBtn?.addEventListener("click", onConfirm, { once: true });
        cancelBtn?.addEventListener("click", onCancel, { once: true });
        modalEl.addEventListener("hidden.bs.modal", cleanup, { once: true });
      } else {
        // Fallback simple
        if (!confirm("¿Quieres descargar el CV?")) event.preventDefault();
      }
    });
  }

  // Validación accesible de formulario de contacto con Bootstrap
  function initContactFormValidation() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    // Muestra feedback nativo de Bootstrap (clases .is-invalid/.is-valid)
    form.setAttribute("novalidate", "");

    form.addEventListener("submit", async (e) => {
      // 1) Validación
      if (!form.checkValidity() || !extraBusinessRules(form)) {
        e.preventDefault();
        e.stopPropagation();
        applyBootstrapValidationState(form);
        announceErrors(form);
        return;
      }

      // 2) Envío a Formspree
      e.preventDefault();

      const endpoint = "https://formspree.io/f/xovnzgwn"; // <- tu endpoint
      const payload = {
        name: form.name.value.trim(),
        lastname: form.lastname.value.trim(),
        email: form.email.value.trim(),
        gender: (form.querySelector('input[name="gender"]:checked') || {}).value || '',
        reason: form.reason.value,
        comments: form.comments.value.trim(),
        subscribe: form.subscribe?.checked || false,
        company: form.company?.value || '' // honeypot
      };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Error al enviar");

        // 3) Éxito → modal o toast
        const modalEl = document.getElementById("staticBackdrop");
        if (modalEl && window.bootstrap?.Modal) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
          modalEl.addEventListener("hidden.bs.modal", () => form.reset(), { once: true });
        } else {
          showToast("Mensaje enviado ✅");
          form.reset();
        }
      } catch (err) {
        showToast("No se pudo enviar el mensaje ❌");
      }
    });

    // Valida en tiempo real
    form.addEventListener("input", (e) => {
      const field = e.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
      applyFieldState(field);
    });

    // Botón cerrar modal resetea (por compatibilidad con tu código anterior)
    const closeBtn = document.getElementById("closeModalBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => form.reset());
    }

    // Valida reglas business lógicas adicionales (radio/checkbox/select)
    function extraBusinessRules(formEl) {
      // Género (radio name="gender")
      const genderChecked = formEl.querySelector('input[name="gender"]:checked');
      // Motivo (select id="reason")
      const reason = formEl.querySelector("#reason");
      // Términos (checkbox id="terms")
      const terms = formEl.querySelector("#terms");

      let ok = true;

      if (reason) {
        reason.setCustomValidity("");
        if (reason.value === "") {
          reason.setCustomValidity("Selecciona un motivo de consulta.");
          ok = false;
        }
      }
      if (terms) {
        terms.setCustomValidity("");
        if (!terms.checked) {
          terms.setCustomValidity("Debes aceptar los términos.");
          ok = false;
        }
      }
      // Para grupo de radios, aplica error al último radio (para mostrar feedback)
      const genderGroup = formEl.querySelectorAll('input[name="gender"]');
      genderGroup.forEach(r => r.setCustomValidity(""));
      if (genderGroup.length && !genderChecked) {
        // marca el último para que Bootstrap muestre feedback
        genderGroup[genderGroup.length - 1].setCustomValidity("Selecciona tu sexo.");
        ok = false;
      }

      return ok;
    }

    function applyBootstrapValidationState(formEl) {
      formEl.classList.add("was-validated");
      // Aplica estado por campo
      [...formEl.elements].forEach(el => applyFieldState(el));
    }

    function applyFieldState(el) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
      // Limpia clases previas
      el.classList.remove("is-valid", "is-invalid");
      // Solo marca si el usuario ha tocado el campo o el form está validado
      const touched = el.matches(":focus") || el.value?.length || el.form?.classList.contains("was-validated");
      if (!touched) return;
      el.checkValidity() ? el.classList.add("is-valid") : el.classList.add("is-invalid");
    }

    // Región aria-live para anunciar errores sin alert()
    function announceErrors(formEl) {
      let live = document.getElementById("form-live-region");
      if (!live) {
        live = document.createElement("div");
        live.id = "form-live-region";
        live.className = "visually-hidden";
        live.setAttribute("role", "status");
        live.setAttribute("aria-live", "polite");
        formEl.appendChild(live);
      }
      const firstInvalid = formEl.querySelector(".is-invalid");
      if (firstInvalid) {
        const label = formEl.querySelector(`label[for="${firstInvalid.id}"]`)?.textContent?.trim() || firstInvalid.name || "Campo";
        live.textContent = `Revisa: ${label}.`;
        firstInvalid.focus({ preventScroll: true });
      }
    }
  }

  // Toast helper (Bootstrap)
  function showToast(message) {
    let toastEl = document.getElementById("globalToast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "globalToast";
      toastEl.className = "toast align-items-center text-bg-dark position-fixed bottom-0 end-0 m-3";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      toastEl.setAttribute("aria-atomic", "true");
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body"></div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector(".toast-body").textContent = message;
    if (window.bootstrap?.Toast) {
      const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
      toast.show();
    }
  }
})();
// contador de caracteres del mensaje
const msg = document.getElementById("comments");
const counter = document.getElementById("commentsCounter");
if (msg && counter) {
  const update = () => (counter.textContent = `${msg.value.length} / ${msg.maxLength}`);
  update();
  msg.addEventListener("input", update);
}
// Filtros por tecnología (data-filter en botones, data-tech en cards)
function initGalleryFilters() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const buttons = document.querySelectorAll('[data-filter]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // estado activo visual
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      const cards = grid.querySelectorAll('[data-tech]');

      cards.forEach(card => {
        const techs = card.getAttribute('data-tech')?.toLowerCase() || '';
        const show = (filter === 'all') || techs.includes(filter);
        card.classList.toggle('d-none', !show);
      });
    });
  });
}

// Lightbox usando modal Bootstrap
function initLightbox() {
  const modalEl = document.getElementById('lightboxModal');
  if (!modalEl) return;

  const imgEl = modalEl.querySelector('#lightboxImg');
  const titleEl = modalEl.querySelector('#lightboxTitle');
  const modal = window.bootstrap?.Modal ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lightbox]');
    if (!btn) return;
    const src = btn.getAttribute('data-lightbox');
    const title = btn.getAttribute('data-title') || 'Vista previa';
    if (src && modal) {
      imgEl.src = src;
      imgEl.alt = title;
      titleEl.textContent = title;
      modal.show();
    }
  });

  // Limpia imagen al cerrar
  modalEl.addEventListener('hidden.bs.modal', () => {
    imgEl.src = '';
    imgEl.alt = '';
  });
}

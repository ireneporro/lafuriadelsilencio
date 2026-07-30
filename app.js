const SHOWS = [
  { value: "2026-08-22", day: "22", month: "Agosto", label: "Sábado 22 de agosto" },
  { value: "2026-08-29", day: "29", month: "Agosto", label: "Sábado 29 de agosto" },
  { value: "2026-09-05", day: "05", month: "Septiembre", label: "Sábado 5 de septiembre" },
  { value: "2026-09-12", day: "12", month: "Septiembre", label: "Sábado 12 de septiembre" },
  { value: "2026-10-10", day: "10", month: "Octubre", label: "Sábado 10 de octubre" },
  { value: "2026-10-17", day: "17", month: "Octubre", label: "Sábado 17 de octubre" },
];

const PRICES = {
  normal: 25000,
  retired: 20000,
  student: 20000,
};

// Número argentino en formato internacional, sin "+" ni espacios.
const WHATSAPP_NUMBER = "5493515498977";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const form = document.querySelector("#booking-form");
const dateSelect = document.querySelector("#show-date");
const datesGrid = document.querySelector("#dates-grid");
const totalPrice = document.querySelector("#total-price");
const ticketCount = document.querySelector("#ticket-count");
const ticketBreakdown = document.querySelector("#ticket-breakdown");
const selectedShowSummary = document.querySelector("#selected-show-summary");
const dialog = document.querySelector("#summary-dialog");
const dossierDialog = document.querySelector("#dossier-dialog");
const summaryData = document.querySelector("#summary-data");
const submitButton = form.querySelector('button[type="submit"]');
const submitLabel = submitButton.querySelector(".submit-label");
const submitError = document.querySelector("#submit-error");
const isLocalPreview = window.location.protocol === "file:";
const galleryTrack = document.querySelector("#gallery-track");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

function moveGallery(direction) {
  galleryTrack.scrollBy({
    left: direction * Math.max(320, galleryTrack.clientWidth * 0.72),
    behavior: "smooth",
  });
}

document
  .querySelector("#gallery-prev")
  .addEventListener("click", () => moveGallery(-1));

document
  .querySelector("#gallery-next")
  .addEventListener("click", () => moveGallery(1));

galleryTrack.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveGallery(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveGallery(1);
  }
});

const heroArt = document.querySelector(".hero-art");
const posterFrame = document.querySelector(".poster-frame");

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  heroArt.addEventListener("pointermove", (event) => {
    const bounds = heroArt.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    posterFrame.style.setProperty("--poster-y", `${x * 7}deg`);
    posterFrame.style.setProperty("--poster-x", `${y * -7}deg`);
  });

  heroArt.addEventListener("pointerleave", () => {
    posterFrame.style.setProperty("--poster-y", "0deg");
    posterFrame.style.setProperty("--poster-x", "0deg");
  });
}

const revealElements = document.querySelectorAll(
  ".statement > *, .gallery-heading > *, .section-heading > *, " +
    ".team-heading > *, .team-list article, .dossier-card, " +
    ".booking-intro > *, .booking-form .form-block, .venue-line"
);

revealElements.forEach((element) => element.classList.add("reveal-item"));

if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

let galleryIsPaused = false;
let galleryResumeTimer;

function pauseGalleryTemporarily(duration = 8000) {
  galleryIsPaused = true;
  window.clearTimeout(galleryResumeTimer);
  galleryResumeTimer = window.setTimeout(() => {
    galleryIsPaused = false;
  }, duration);
}

function advanceGalleryAutomatically() {
  if (
    prefersReducedMotion.matches ||
    galleryIsPaused ||
    document.hidden
  ) {
    return;
  }

  const nearEnd =
    galleryTrack.scrollLeft + galleryTrack.clientWidth >=
    galleryTrack.scrollWidth - 40;

  galleryTrack.classList.add("is-auto-scrolling");

  if (nearEnd) {
    galleryTrack.scrollTo({ left: 0, behavior: "smooth" });
  } else {
    moveGallery(1);
  }
}

const galleryAutoplay = window.setInterval(
  advanceGalleryAutomatically,
  4200
);

galleryTrack.addEventListener("pointerdown", () =>
  pauseGalleryTemporarily()
);
galleryTrack.addEventListener("wheel", () =>
  pauseGalleryTemporarily()
);
galleryTrack.addEventListener("focusin", () => {
  galleryIsPaused = true;
});
galleryTrack.addEventListener("focusout", () => {
  galleryIsPaused = false;
});
galleryTrack.addEventListener("mouseenter", () => {
  galleryIsPaused = true;
});
galleryTrack.addEventListener("mouseleave", () => {
  galleryIsPaused = false;
});

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      window.clearInterval(galleryAutoplay);
    }
  });
}

function renderDates() {
  datesGrid.innerHTML = "";
  dateSelect.innerHTML = '<option value="">Seleccioná una fecha</option>';

  SHOWS.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.value;
    option.textContent = `${show.label} · 21:30 h`;
    option.disabled = show.available === 0;
    dateSelect.append(option);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "date-card";
    card.dataset.date = show.value;
    card.disabled = show.available === 0;
    const status =
      show.available === 0
        ? "Agotado"
        : Number.isFinite(show.available)
          ? `${show.available} disponibles →`
          : "Entradas disponibles →";
    card.innerHTML = `
      <span class="date-month">${show.month}</span>
      <span class="date-day">${show.day}</span>
      <span class="date-status">${status}</span>
    `;
    card.addEventListener("click", () => selectDate(show.value));
    datesGrid.append(card);
  });
}

function selectDate(value) {
  const show = SHOWS.find((item) => item.value === value);
  if (!show || show.available === 0) return;

  dateSelect.value = value;
  document.querySelectorAll(".date-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.date === value);
  });
  document.querySelector("#entradas").scrollIntoView({ behavior: "smooth" });
  clearError("date");
  submitError.textContent = "";
  updateShowSummary();
}

dateSelect.addEventListener("change", () => {
  document.querySelectorAll(".date-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.date === dateSelect.value);
  });
  clearError("date");
  submitError.textContent = "";
  updateShowSummary();
});

document.querySelectorAll("[data-counter]").forEach((counter) => {
  const input = counter.querySelector("input");

  counter.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (!action) return;

    const current = Number(input.value);
    const next =
      action === "increase"
        ? Math.min(current + 1, Number(input.max))
        : Math.max(current - 1, Number(input.min));

    input.value = next;
    updateTotal();
    clearError("tickets");
  });
});

function getQuantities() {
  return {
    normal: Number(document.querySelector("#normal").value),
    retired: Number(document.querySelector("#retired").value),
    student: Number(document.querySelector("#student").value),
  };
}

function updateTotal() {
  const quantities = getQuantities();
  const count = quantities.normal + quantities.retired + quantities.student;
  const total =
    quantities.normal * PRICES.normal +
    quantities.retired * PRICES.retired +
    quantities.student * PRICES.student;

  ticketCount.textContent = `${count} ${count === 1 ? "entrada" : "entradas"}`;
  const parts = [];
  if (quantities.normal) parts.push(`${quantities.normal} general`);
  if (quantities.retired) parts.push(`${quantities.retired} jubilado/s`);
  if (quantities.student) parts.push(`${quantities.student} estudiante/s`);
  ticketBreakdown.textContent =
    parts.length > 0
      ? parts.join(" · ")
      : "Todavía no seleccionaste entradas";
  totalPrice.textContent = currency.format(total);
}

function updateShowSummary() {
  const show = SHOWS.find((item) => item.value === dateSelect.value);
  selectedShowSummary.textContent = show
    ? `${show.label} · 21:30 h`
    : "Función sin seleccionar";
}

function setError(field, message) {
  document.querySelector(`#${field}-error`).textContent = message;
}

function clearError(field) {
  document.querySelector(`#${field}-error`).textContent = "";
}

function validate() {
  const quantities = getQuantities();
  const name = document.querySelector("#name").value.trim();
  const phone = document.querySelector("#phone").value.trim();
  const issues = [];
  let firstInvalid = null;

  ["date", "tickets", "name", "phone"].forEach(clearError);
  [dateSelect, document.querySelector("#name"), document.querySelector("#phone")]
    .forEach((field) => field.removeAttribute("aria-invalid"));

  if (!dateSelect.value) {
    setError("date", "Seleccioná una fecha.");
    dateSelect.setAttribute("aria-invalid", "true");
    issues.push("una función");
    firstInvalid = firstInvalid || dateSelect;
  }

  if (quantities.normal + quantities.retired + quantities.student === 0) {
    setError("tickets", "Agregá al menos una entrada.");
    issues.push("al menos una entrada");
    firstInvalid =
      firstInvalid ||
      document.querySelector('[data-counter] [data-action="increase"]');
  }

  if (name.length < 3) {
    setError("name", "Ingresá tu nombre y apellido.");
    document.querySelector("#name").setAttribute("aria-invalid", "true");
    issues.push("tu nombre y apellido");
    firstInvalid = firstInvalid || document.querySelector("#name");
  }

  if (phone && phone.replace(/\D/g, "").length < 8) {
    setError("phone", "Revisá el número o dejá el campo vacío.");
    document.querySelector("#phone").setAttribute("aria-invalid", "true");
    issues.push("revisar el WhatsApp opcional");
    firstInvalid = firstInvalid || document.querySelector("#phone");
  }

  return {
    valid: issues.length === 0,
    firstInvalid,
    message:
      issues.length > 0
        ? `Antes de continuar, falta: ${issues.join(", ")}.`
        : "",
  };
}

function getOrder() {
  const quantities = getQuantities();
  const selectedShow = SHOWS.find((show) => show.value === dateSelect.value);
  const count = quantities.normal + quantities.retired + quantities.student;
  const total =
    quantities.normal * PRICES.normal +
    quantities.retired * PRICES.retired +
    quantities.student * PRICES.student;

  return {
    name: document.querySelector("#name").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    show: selectedShow,
    quantities,
    count,
    total,
  };
}

function renderSummary(order, reservation) {
  const ticketParts = [];
  if (order.quantities.normal) ticketParts.push(`${order.quantities.normal} general`);
  if (order.quantities.retired) ticketParts.push(`${order.quantities.retired} jubilado/s`);
  if (order.quantities.student) ticketParts.push(`${order.quantities.student} estudiante/s`);

  summaryData.innerHTML = `
    <div><span>Reserva</span><strong>${escapeHtml(reservation.id)}</strong></div>
    <div><span>Nombre</span><strong>${escapeHtml(order.name)}</strong></div>
    <div><span>Función</span><strong>${order.show.label} · 21:30 h</strong></div>
    <div><span>Entradas</span><strong>${ticketParts.join(" · ")}</strong></div>
    <div><span>Total</span><strong>${currency.format(order.total)}</strong></div>
  `;

  const whatsappMessage = [
    "Hola, quiero reservar entradas para La furia del silencio.",
    "",
    `Reserva: ${reservation.id}`,
    `Nombre: ${order.name}`,
    `Función: ${order.show.label}, 21:30 h`,
    `Entradas: ${ticketParts.join(", ")}`,
    `Cantidad total: ${order.count}`,
    `Total: ${currency.format(order.total)}`,
    "",
    "Envío el comprobante de pago a continuación.",
  ].join("\n");

  document.querySelector("#whatsapp-link").href =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

async function registerOrder(order) {
  if (isLocalPreview) {
    return {
      id: "VISTA-PREVIA",
      importeTotal: order.total,
    };
  }

  const response = await fetch("/api/reservar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: order.name,
      phone: order.phone,
      showDate: order.show.value,
      normal: order.quantities.normal,
      retired: order.quantities.retired,
      student: order.quantities.student,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "No pudimos registrar la reserva.");
  }

  return data.reserva;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const validation = validate();

  if (!validation.valid) {
    submitError.textContent = validation.message;
    validation.firstInvalid.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "center",
    });
    window.setTimeout(() => validation.firstInvalid.focus(), 450);
    return;
  }

  const order = getOrder();
  submitError.textContent = "";
  submitButton.disabled = true;
  submitLabel.textContent = "Guardando reserva…";

  try {
    const reservation = await registerOrder(order);
    order.total = Number(reservation.importeTotal) || order.total;
    renderSummary(order, reservation);
    dialog.showModal();
  } catch (error) {
    submitError.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = "Continuar con la reserva";
  }
});

document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

document
  .querySelector("#open-dossier")
  .addEventListener("click", () => dossierDialog.showModal());

document
  .querySelector("#dossier-close")
  .addEventListener("click", () => dossierDialog.close());

dossierDialog.addEventListener("click", (event) => {
  if (event.target === dossierDialog) dossierDialog.close();
});

async function loadLiveAvailability() {
  if (isLocalPreview) return;

  try {
    const response = await fetch("/api/funciones");
    const data = await response.json();

    if (!response.ok || !data.ok) return;

    data.funciones.forEach((liveShow) => {
      const show = SHOWS.find((item) => item.value === liveShow.fecha);
      if (!show) return;
      show.available = Number(liveShow.disponibles);
      show.status = liveShow.estado;
    });

    renderDates();
  } catch (error) {
    // Si la consulta falla, mantenemos visibles las fechas conocidas.
  }
}

renderDates();
updateTotal();
updateShowSummary();
loadLiveAvailability();

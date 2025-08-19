document.addEventListener("DOMContentLoaded", () => {
  /* ========== Node helpers ========== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ========== Elements ========== */
  const form = $("#ticketForm");
  const formContainer = $("#formContainer");
  const ticketSection = $("#ticketSection");

  const nameInput = $("#fullName");
  const emailInput = $("#email");
  const githubInput = $("#github");
  const avatarInput = $("#avatar");

  const drop = $(".file-drop");
  const dropIcon = $(".drop-icon", drop);
  const dropText = $(".drop-instruction", drop);

  const uploadHint = $("#uploadHint");
  const uploadHintText = $("#uploadHintText");
  const DEFAULT_HINT = "Upload your photo (JPG or PNG, max size: 500KB).";

  // Success elements
  const headlineName = $("#headlineName");
  const headlineEmail = $("#headlineEmail");
  const ticketAvatar = $("#ticketAvatar");
  const ticketName = $("#ticketName");
  const ticketHandle = $("#ticketHandle");
  const ticketGithub = $("#ticketGithub");
  const ticketSerial = document.getElementById("ticketSerial");

  // Inline errors
  const nameError = $("#nameError");
  const emailError = $("#emailError");
  const avatarError = $("#avatarError");

  /* ========== Config ========== */
  const MAX_SIZE = 500 * 1024; // 500KB
  const ACCEPT = new Set(["image/jpeg", "image/png"]);

  /* ========== State ========== */
  let thumbEl = null;
  let actionsEl = null;
  let currentObjectURL = null;

  /* ========== Utilities ========== */
  const setError = (el, msg) => {
    el.textContent = msg;
  };
  const clearErrors = () =>
    [nameError, emailError, avatarError].forEach((e) => (e.textContent = ""));

  const setHint = (msg, isError = false) => {
    if (!uploadHintText) return;
    uploadHintText.textContent = msg;
    uploadHint.classList.toggle("is-error", isError);
  };

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validateFile = (file) => {
    avatarError.textContent = ""; // we show messages via the hint line
    if (!file) {
      setHint("Avatar image is required.", true);
      return false;
    }
    if (!ACCEPT.has(file.type)) {
      setHint("Only JPG or PNG images are allowed.", true);
      return false;
    }
    if (file.size > MAX_SIZE) {
      setHint("File too large. Please upload a photo under 500KB.", true);
      return false;
    }
    setHint(DEFAULT_HINT, false);
    return true;
  };

  const cleanupObjectURL = () => {
    if (currentObjectURL) {
      URL.revokeObjectURL(currentObjectURL);
      currentObjectURL = null;
    }
  };

  /* ========== Dropzone behaviors ========== */
  // Activate native picker on click/keyboard
  drop.addEventListener("click", () => avatarInput.click());
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      avatarInput.click();
    }
  });

  // Drag & drop
  ["dragenter", "dragover"].forEach((evt) =>
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add("is-dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    drop.addEventListener(evt, () => drop.classList.remove("is-dragover"))
  );

  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFileAndPreview(f);
  });

  // Picker change
  avatarInput.addEventListener("change", () => {
    const f = avatarInput.files?.[0];
    if (f) setFileAndPreview(f);
  });

  function setFileAndPreview(file) {
    // Attach file to input programmatically if it came from DnD
    const dt = new DataTransfer();
    dt.items.add(file);
    avatarInput.files = dt.files;

    if (!validateFile(file)) return;
    showPreview(file);
  }

  function showPreview(file) {
    cleanupObjectURL();
    currentObjectURL = URL.createObjectURL(file);

    drop.classList.add("has-image");
    dropIcon.style.display = "none";
    if (dropText) dropText.style.visibility = "hidden";

    if (!thumbEl) {
      thumbEl = document.createElement("img");
      thumbEl.className = "drop-thumb";
      drop.appendChild(thumbEl);
    }
    thumbEl.src = currentObjectURL;
    thumbEl.alt = "Selected avatar preview";

    if (!actionsEl) {
      actionsEl = document.createElement("div");
      actionsEl.className = "drop-actions";

      const removeBtn = Object.assign(document.createElement("button"), {
        type: "button",
        className: "btn-remove",
        textContent: "Remove image",
      });
      const changeBtn = Object.assign(document.createElement("button"), {
        type: "button",
        className: "btn-change",
        textContent: "Change image",
      });

      actionsEl.append(removeBtn, changeBtn);
      drop.appendChild(actionsEl);

      changeBtn.addEventListener("click", () => avatarInput.click());
      removeBtn.addEventListener("click", clearPreview);
    }
  }

  function clearPreview() {
    cleanupObjectURL();
    avatarInput.value = "";
    thumbEl?.remove();
    thumbEl = null;
    actionsEl?.remove();
    actionsEl = null;
    drop.classList.remove("has-image");
    dropIcon.style.display = "";
    if (dropText) dropText.style.visibility = "visible";
    setHint(DEFAULT_HINT, false);
  }

  /* ========== Submit flow ========== */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    let valid = true;
    const fullName = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const file = avatarInput.files?.[0];

    if (!fullName) {
      setError(nameError, "Full name is required.");
      valid = false;
    }
    if (!emailVal) {
      setError(emailError, "Email is required.");
      valid = false;
    } else if (!validateEmail(emailVal)) {
      setError(emailError, "Email format is invalid.");
      valid = false;
    }
    if (!validateFile(file)) valid = false;

    if (!valid) return;

    // Put avatar on the ticket
    const reader = new FileReader();
    reader.onload = (ev) => (ticketAvatar.src = ev.target.result);
    reader.readAsDataURL(file);

    // Headline + email
    headlineName.textContent = fullName;
    headlineEmail.textContent = emailVal;
    headlineEmail.href = `mailto:${emailVal}`;

    ticketSerial.textContent = makeSerial(fullName + "|" + emailVal);

    // Ticket text
    ticketName.textContent = fullName;
    const handle = githubInput.value.trim().replace(/^@/, "");
    if (handle) {
      ticketGithub.textContent = `@${handle}`;
      ticketHandle.classList.remove("is-hidden");
    } else {
      ticketGithub.textContent = "";
      ticketHandle.classList.add("is-hidden");
    }

    // Swap screens
    formContainer.classList.add("hidden");
    ticketSection.classList.remove("hidden");
  });
});

// Create a stable 5-digit code from a string (name + email)
function makeSerial(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  if (h < 0) h = -h;
  return "#" + String(h % 100000).padStart(5, "0");
}

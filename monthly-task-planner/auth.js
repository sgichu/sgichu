const SUPABASE_URL = "https://bakscjdwoxogouerybaw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJha3NjamR3b3hvZ291ZXJ5YmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDI0NTAsImV4cCI6MjEwNzMxODQ1MH0.yqkS967d0vik-VHr_lmMjZCOjNsap5RNQsFws8EkvwQ";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authStatus = document.getElementById("auth-status");
const lockOverlay = document.getElementById("lock-overlay");
const authModalBackdrop = document.getElementById("auth-modal-backdrop");
const authForm = document.getElementById("auth-form");
const authEmailInput = document.getElementById("auth-email");
const authSubmitBtn = document.getElementById("auth-submit");
const authFeedback = document.getElementById("auth-feedback");
const authDismissBtn = document.getElementById("auth-dismiss");

let currentUser = null;
let isLocked = true;
let nameModalShown = false;

function applyLockState() {
  lockOverlay.hidden = !isLocked;
}

function updateAuthUI() {
  applyLockState();
  authStatus.innerHTML = "";

  if (currentUser) {
    const label = document.createElement("span");
    label.textContent = `Signed in as ${currentUser.email}`;
    authStatus.appendChild(label);
    authStatus.appendChild(document.createTextNode(" · "));

    const signOutBtn = document.createElement("button");
    signOutBtn.type = "button";
    signOutBtn.className = "auth-signout-link";
    signOutBtn.textContent = "Sign out";
    signOutBtn.addEventListener("click", () => {
      supabaseClient.auth.signOut();
    });
    authStatus.appendChild(signOutBtn);

    authStatus.classList.add("signed-in");
  } else {
    authStatus.textContent = "Not signed in — create a free account to start editing";
    authStatus.classList.remove("signed-in");
  }
}

function showAuthModal() {
  authFeedback.hidden = true;
  authModalBackdrop.hidden = false;
  authEmailInput.focus();
}

function hideAuthModal() {
  authModalBackdrop.hidden = true;
}

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session ? data.session.user : null;
  isLocked = !currentUser;
  updateAuthUI();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session ? session.user : null;
    isLocked = !currentUser;
    updateAuthUI();
    if (currentUser) hideAuthModal();
  });
}

// Lock by default until we hear otherwise from Supabase.
applyLockState();
initAuth();

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = authEmailInput.value.trim();
  if (!email) return;

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = "Sending…";

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });

  authSubmitBtn.disabled = false;
  authSubmitBtn.textContent = "Send me a link";
  authFeedback.hidden = false;

  if (error) {
    authFeedback.textContent = "Something went wrong sending that link — please try again.";
    authFeedback.className = "auth-feedback error";
  } else {
    authFeedback.textContent = `Check ${email} for a link to finish creating your account.`;
    authFeedback.className = "auth-feedback success";
  }
});

document.getElementById("person-name").addEventListener("blur", () => {
  const nameValue = document.getElementById("person-name").value.trim();
  if (isLocked && nameValue && !nameModalShown) {
    nameModalShown = true;
    showAuthModal();
  }
});

lockOverlay.addEventListener("click", showAuthModal);
authDismissBtn.addEventListener("click", hideAuthModal);
authModalBackdrop.addEventListener("click", (event) => {
  if (event.target === authModalBackdrop) hideAuthModal();
});

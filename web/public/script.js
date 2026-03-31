/* ═══════════════════════════════════════════════════════════
   BlueLock Key System — Frontend Logic
   ═══════════════════════════════════════════════════════════ */

const API_BASE = window.location.origin;
let currentKey = null;
let selectedKeyType = 'daily';

// ─── Initialize Particles ───────────────────────────────
function initParticles() {
  const container = document.getElementById('particles');
  const count = 30;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (8 + Math.random() * 12) + 's';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.width = (1 + Math.random() * 2) + 'px';
    particle.style.height = particle.style.width;
    particle.style.opacity = 0.2 + Math.random() * 0.5;
    container.appendChild(particle);
  }
}

// ─── Key Type Selection ─────────────────────────────────
function selectKeyType(type) {
  selectedKeyType = type;
  document.querySelectorAll('.type-option').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.type-option[data-type="${type}"]`).classList.add('active');
}

// ─── Show/Hide Steps ────────────────────────────────────
function showStep(stepId) {
  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  const step = document.getElementById(stepId);
  if (step) {
    step.classList.remove('hidden');
    step.style.animation = 'none';
    step.offsetHeight; // force reflow
    step.style.animation = 'fadeIn 0.4s ease';
  }
}

// ─── Generate Key ───────────────────────────────────────
async function generateKey() {
  showStep('loadingStep');

  try {
    const response = await fetch(`${API_BASE}/api/key/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: selectedKeyType }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate key');
    }

    currentKey = data.key;
    document.getElementById('keyText').textContent = data.key;
    document.getElementById('expiryText').textContent = data.expiresIn || '24 hours';

    const keyTypeEl = document.getElementById('keyTypeText');
    if (keyTypeEl) keyTypeEl.textContent = data.typeLabel || 'Daily';

    showStep('step2');
  } catch (error) {
    document.getElementById('errorText').textContent = error.message;
    showStep('errorStep');
  }
}

// ─── Copy Key ───────────────────────────────────────────
async function copyKey() {
  if (!currentKey) return;

  try {
    await navigator.clipboard.writeText(currentKey);
    showToast('Key copied to clipboard!');

    const btn = document.getElementById('copyBtn');
    btn.style.color = '#10b981';
    btn.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    btn.style.background = 'rgba(16, 185, 129, 0.1)';

    setTimeout(() => {
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.style.background = '';
    }, 2000);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = currentKey;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('Key copied!');
  }
}

// ─── Toast Notification ─────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');
  toastText.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

// ─── Reset to Step 1 ────────────────────────────────────
function resetToStep1() {
  showStep('step1');
}

// ─── Initialize ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
});

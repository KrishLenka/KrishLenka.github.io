// js/main.js
document.addEventListener('DOMContentLoaded', () => {
	const nav   = document.getElementById('topnav');
	const out   = document.getElementById('titleText');
	const caret = document.getElementById('titleCaret'); // optional in markup
	const links = document.getElementById('homeLinks');
  
	const text = "Krish Lenka";
  
	// timing controls (tweak to taste)
	const initialDelay = 700;   // before first letter animates (ms)
	const stagger = 150;        // time between letters starting (ms)
	const animDuration = 1200;   // CSS animation duration per letter (ms) - must match CSS
  
	// hide caret if present (we're using per-letter spans)
	if (caret) caret.remove(); // remove from DOM so nothing lingers
  
	// clear target then build letter spans
	out.textContent = '';
  
	const frag = document.createDocumentFragment();
	for (let i = 0; i < text.length; i++) {
	  const ch = text[i];
	  const span = document.createElement('span');
	  span.className = 'char';
	  // non-breaking space for real spaces so layout keeps spacing
	  span.textContent = ch === ' ' ? '\u00A0' : ch;
	  // stagger the animation start per char
	  const delayMs = initialDelay + i * stagger;
	  span.style.animationDelay = `${delayMs}ms`;
	  frag.appendChild(span);
	}
	out.appendChild(frag);
  
	// Wait for last char animation to finish, then reveal nav & socials
	const lastChar = out.querySelector('.char:last-child');
	if (lastChar) {
	  // The animationend will fire when the CSS animation completes on the last char
	  lastChar.addEventListener('animationend', () => {
		if (nav) nav.classList.add('show');
		if (links) {
		  links.classList.remove('hidden');
		  links.classList.add('visible');
		}
	  }, { once: true });
  
	  // Safety fallback in case animationend doesn't fire (e.g., reduced-motion)
	  const totalMs = initialDelay + (text.length - 1) * stagger + animDuration + 80;
	  setTimeout(() => {
		if (nav && !nav.classList.contains('show')) nav.classList.add('show');
		if (links && links.classList.contains('hidden')) {
		  links.classList.remove('hidden');
		  links.classList.add('visible');
		}
	  }, totalMs);
	} else {
	  // if something odd, reveal immediately
	  if (nav) nav.classList.add('show');
	  if (links) {
		links.classList.remove('hidden');
		links.classList.add('visible');
	  }
	}
  });
  
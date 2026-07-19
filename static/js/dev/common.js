/**
 * Create a cookie
 *
 * @param cname {String}  cookie name
 * @param cvalue {string} cookie value
 * @param exdays {integer}  the number of the days for cookie expiration
 */
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	let expires = 'expires=' + d.toUTCString();
	if (location.protocol == 'https:') {
		document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/' + ';Samesite=Strict;Secure=True';
	} else {
		console.log('Warning: could not set secure cookie: try with Samsite Lax...');
		document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/' + ';Samesite=Lax';
	}
}

/**
* get a cookie 
*
* @param cname {String} cookie name
* @returns cookie value
*/
function getCookie(cname) {
	let name = cname + '=';
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return '';
}


/**
* format the data refresh string for exhibit on charts
*
* @param date {String}  date of the last refresh
* @returns string formatted
*/
function get_last_refresh(data) {
	let dt_refresh = new Date(0); // The 0 there is the key, which sets the date to the epoch
	//var dt_refresh;
	dt_refresh.setUTCSeconds(data['last_refresh']);
	const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
	const hours = pad(dt_refresh.getHours());
	const minutes = pad(dt_refresh.getMinutes());
	const months_names = get_months_names();
	const month = months_names[dt_refresh.getMonth()];
	const day = dt_refresh.getDate();
	const year = dt_refresh.getFullYear();
	const last_refresh = 'Data refresh: ' + day + ' of ' + month + ' ' + year + ' at ' + hours + ':' + minutes;
	return last_refresh;
}

/**
* format the data refresh string for exhibit on charts
*
* @returns {Array} list of months as short names
*/
function get_months_names() {
	var months_name = [];
	for (let monthNumber = 1; monthNumber < 13; monthNumber++) {
		const date = new Date();
		date.setMonth(monthNumber - 1);
		months_name.push(date.toLocaleString('en-US', {
			month: 'short'
		}));
	}
	return months_name;
}

/**
* format the data refresh string for exhibit on charts
*
* @param {Integer} num Number to be formatted 
* @returns {string} Number formatted with K for thousands and M for millions
*/
function format_u_k_m(num) {
	let label;
	let sign = 1;
	if (num < 0) {
		sign = -1;
	}
	let abs_num = Math.abs(num);
	if (abs_num == 0) {
		label = abs_num;
	} else {
		if (abs_num > 0 && abs_num < 1000) {
			label = abs_num * sign;
		} else {
			if (abs_num >= 1000 && abs_num < 1000000) {
				label = abs_num / 1000 * sign + 'K';
			} else {
				if (abs_num >= 1000000) {
					label = abs_num / 1000000 * sign + 'M';
				}
			}
		}
	}
	return label;
}

/**
* Set a selected element of a combo box with a value
*
* @param {string} id of the selected
* @param {string} valueToSelect value to assign
*/
function selectElement(id, valueToSelect) {
	let element = document.getElementById(id);
	element.value = valueToSelect;
}

/**
* Add event Handler to element (on)
*
* @param {string} id of the element
* @param {string} eventType i.e. "change"
* @param {function} handler the function to execute whene the evenet is raised
*/
function addEventHandler(id, eventType, handler) {
	if (id.addEventListener)
		id.addEventListener(eventType, handler, false);
	else if (id.attachEvent)
		id.attachEvent('on' + eventType, handler);
}

/**
* Set a text to a specific element
*
* @param {string} id of the element
* @param {string} newvalue the value to assign to element
*/
function setText(id, newvalue) {
	var s = document.getElementById(id);
	s.innerHTML = newvalue;
}

let globalAudioCtx;

/**
 * Initialize and unlock the AudioContext (required for mobile)
 */
function initAudio() {
	if (!globalAudioCtx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		globalAudioCtx = new AC();
	}
	if (globalAudioCtx.state === 'suspended') {
		globalAudioCtx.resume();
	}
}

/**
 * Trigger the actual beep sound — a pleasant two-tone "ding"
 */
function triggerBeep(ctx) {
	const now = ctx.currentTime;

	// First tone (higher, 880Hz)
	const osc1 = ctx.createOscillator();
	const gain1 = ctx.createGain();
	osc1.type = 'sine';
	osc1.frequency.setValueAtTime(880, now);
	gain1.gain.setValueAtTime(0.0001, now);
	gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
	gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
	osc1.connect(gain1);
	gain1.connect(ctx.destination);
	osc1.start(now);
	osc1.stop(now + 0.2);

	// Second tone (lower, 660Hz) — slight delay for a "ding-dong" feel
	const osc2 = ctx.createOscillator();
	const gain2 = ctx.createGain();
	osc2.type = 'sine';
	osc2.frequency.setValueAtTime(660, now + 0.08);
	gain2.gain.setValueAtTime(0.0001, now + 0.08);
	gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.09);
	gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
	osc2.connect(gain2);
	gain2.connect(ctx.destination);
	osc2.start(now + 0.08);
	osc2.stop(now + 0.35);
}

function showTime() {
	const now = new Date();
	const h = String(now.getUTCHours()).padStart(2, '0');
	const m = String(now.getUTCMinutes()).padStart(2, '0');
	const s = String(now.getUTCSeconds()).padStart(2, '0');
	const utcString = `${h}:${m}:${s}`;

	const localH = String(now.getHours()).padStart(2, '0');
	const localM = String(now.getMinutes()).padStart(2, '0');
	const localS = String(now.getSeconds()).padStart(2, '0');
	const localString = `${localH}:${localM}:${localS}`;

	// Update Navbar Clock (Legacy/Backup)
	const navClock = document.getElementById('NavbarClockDisplay');
	if (navClock) navClock.textContent = utcString;

	// Update Hero Clocks (UTC + Local)
	const heroUTC = document.getElementById('HeroClockUTC');
	const heroLocal = document.getElementById('HeroClockLocal');

	if (heroUTC) heroUTC.textContent = utcString;
	if (heroLocal) heroLocal.textContent = localString;

	setTimeout(showTime, 1000);
}

// Initialize UI Elements
document.addEventListener('DOMContentLoaded', () => {
	// Clock Initialization
	const heroUTC = document.getElementById('HeroClockUTC');
	if (heroUTC) {
		showTime();
	}

	// Audio Unlock for Mobile — multiple unlock paths for reliability
	document.addEventListener('click', initAudio, { once: true });
	document.addEventListener('touchstart', initAudio, { once: true });
	document.addEventListener('keydown', initAudio, { once: true });
	// Re-unlock when tab becomes visible again (mobile browsers suspend audio)
	document.addEventListener('visibilitychange', () => {
		if (!document.hidden) initAudio();
	});

	// Copyright Date
	const copyDateEl = document.getElementById('copyDate');
	if (copyDateEl) {
		copyDateEl.innerHTML = new Date().getFullYear();
	}

	// Back to Top functionality
	const button_top = document.getElementById('btn-back-to-top');
	if (button_top) {
		window.onscroll = () => {
			if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
				button_top.style.display = 'block';
			} else {
				button_top.style.display = 'none';
			}
		};
		button_top.addEventListener('click', () => {
			document.body.scrollTop = 0;
			document.documentElement.scrollTop = 0;
		});
	}

	// Dynamic VH for mobile (Native Feel)
	const setVh = () => {
		let vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	};
	setVh();
	window.addEventListener('resize', setVh);
	window.addEventListener('orientationchange', setVh);

	// Request notification permission on first user interaction
	document.addEventListener('click', requestNotificationPermission, { once: true });
	document.addEventListener('touchstart', requestNotificationPermission, { once: true });
});

/**
 * Show a native browser notification (PWA push notification)
 * @param {string} title - Notification title
 * @param {string} body  - Notification body text
 */
function showPWANotification(title, body) {
	if (!('Notification' in window)) return;

	// Don't notify if the page is focused and visible
	if (!document.hidden) return;

	if (Notification.permission === 'granted') {
		try {
			const n = new Notification(title, {
				body: body,
				icon: '/static/images/icons/icon-192x192.png',
				badge: '/static/images/icons/icon-72x72.png',
				tag: 'dx-spot',
				renotify: true,
			});
			// Auto-close after 6 seconds
			setTimeout(() => n.close(), 6000);
		} catch (e) {
			// Some browsers throw if notifications are disabled at OS level
		}
	}
}

/**
 * Request notification permission (called on first user interaction)
 */
function requestNotificationPermission() {
	if (!('Notification' in window)) return;
	if (Notification.permission === 'default') {
		Notification.requestPermission();
	}
}

/**
 * Show a tactical toast notification
 * @param {string} message
 * @param {string} title
 */
function showToast(message, title = 'System Update') {
	if (!isToastEnabled()) return;

	const container = document.getElementById('toast-container');
	if (!container) return;

	const toast = document.createElement('div');
	toast.className = 'custom-toast';
	toast.innerHTML = `
		<div class="custom-toast-header">
			<strong class="text-emerald" style="color: #10b981;"><i class="bi bi-broadcast"></i> ${title}</strong>
			<small class="text-muted">Just now</small>
		</div>
		<div class="custom-toast-body">
			${message}
		</div>
	`;

	container.appendChild(toast);

	// Remove after 5 seconds
	setTimeout(() => {
		toast.classList.add('toast-fade-out');
		setTimeout(() => {
			toast.remove();
		}, 500);
	}, 5000);
}

function isNewSpotSoundEnabled() {
	return localStorage.getItem('newSpotSound') !== 'false';
}

function isToastEnabled() {
	return localStorage.getItem('toastNotifications') !== 'false';
}

function playNewSpotSound() {
	if (!isNewSpotSoundEnabled()) return;

	if (!globalAudioCtx) initAudio();
	if (!globalAudioCtx) return;

	if (globalAudioCtx.state === 'suspended') {
		// Mobile: resume async then play beep once running
		globalAudioCtx.resume().then(() => {
			if (globalAudioCtx.state === 'running') {
				triggerBeep(globalAudioCtx);
			}
		}).catch(() => {});
	} else if (globalAudioCtx.state === 'running') {
		triggerBeep(globalAudioCtx);
	}
}

// Update the sound toggle icon based on enabled state
function updateSoundIcon(enabled) {
	const label = document.querySelector('.sound-switch .form-check-label i');
	if (label) {
		label.className = enabled ? 'bi bi-volume-up-fill' : 'bi bi-volume-mute-fill';
	}
}

// Update the toast toggle icon based on enabled state
function updateToastIcon(enabled) {
	const toastToggle = document.getElementById('toastToggle');
	if (!toastToggle) return;
	const label = toastToggle.parentElement.querySelector('.form-check-label i');
	if (label) {
		label.className = enabled ? 'bi bi-bell-fill' : 'bi bi-bell-slash-fill';
	}
}

// Initialize toggle states from localStorage
document.addEventListener('DOMContentLoaded', () => {
	const soundToggle = document.getElementById('soundToggle');
	if (soundToggle) {
		const isEnabled = isNewSpotSoundEnabled();
		soundToggle.checked = isEnabled;
		updateSoundIcon(isEnabled);
		soundToggle.addEventListener('change', (e) => {
			initAudio(); // Unlock audio on toggle change
			localStorage.setItem('newSpotSound', e.target.checked);
			updateSoundIcon(e.target.checked);
			if (e.target.checked) playNewSpotSound(); // Test beep
		});
	}

	const toastToggle = document.getElementById('toastToggle');
	if (toastToggle) {
		const toastEnabled = isToastEnabled();
		toastToggle.checked = toastEnabled;
		updateToastIcon(toastEnabled);
		toastToggle.addEventListener('change', (e) => {
			localStorage.setItem('toastNotifications', e.target.checked);
			updateToastIcon(e.target.checked);
			if (e.target.checked) {
				showToast('Toast notifications enabled', 'Settings');
			}
		});
	}
});

// ---- PWA Install Prompt ----
let deferredInstallPrompt = null;

// Detect if app is already installed (standalone mode)
function isPWAInstalled() {
	return window.matchMedia('(display-mode: standalone)').matches ||
		window.navigator.standalone === true;
}

// Capture the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
	// Prevent the default mini-infobar on mobile
	e.preventDefault();
	deferredInstallPrompt = e;

	// Don't show if already installed
	if (isPWAInstalled()) return;

	// Show the install button in footer
	const wrap = document.getElementById('pwaInstallWrap');
	if (wrap) wrap.style.display = 'block';

	// Auto-prompt on every new visit, unless already prompted this session
	// or user previously dismissed (we still re-prompt on next visit)
	const sessionPrompted = sessionStorage.getItem('pwaPromptShown');
	if (!sessionPrompted) {
		sessionStorage.setItem('pwaPromptShown', '1');
		// Small delay so it doesn't interfere with page load
		setTimeout(() => {
			if (deferredInstallPrompt) {
				deferredInstallPrompt.prompt();
			}
		}, 3000);
	}
});

// Handle install button click
document.addEventListener('DOMContentLoaded', () => {
	const installBtn = document.getElementById('pwaInstallBtn');
	if (installBtn) {
		installBtn.addEventListener('click', async () => {
			if (!deferredInstallPrompt) return;
			deferredInstallPrompt.prompt();
			const { outcome } = await deferredInstallPrompt.userChoice;
			if (outcome === 'accepted') {
				console.log('[PWA] User accepted install');
			} else {
				console.log('[PWA] User dismissed install');
			}
			deferredInstallPrompt = null;
			const wrap = document.getElementById('pwaInstallWrap');
			if (wrap) wrap.style.display = 'none';
		});
	}
});

// Hide install button if app already installed
window.addEventListener('appinstalled', () => {
	console.log('[PWA] App installed successfully');
	deferredInstallPrompt = null;
	const wrap = document.getElementById('pwaInstallWrap');
	if (wrap) wrap.style.display = 'none';
});

function backToTop() {
	document.body.scrollTop = 0;
	document.documentElement.scrollTop = 0;
}

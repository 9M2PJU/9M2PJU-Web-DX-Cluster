class table_builder {
	/**
	 * Table builder constructor
	 * @param selector {string} The html identifier where build the spots table 
	*/
	constructor(selector) {
		this.selector = selector;
		this.current_data = [];
		this.first_time = true;
	}
	/**
	 * @return last_rowid {integer} the last rowid 
	*/
	getLastRowId() {
		let last_rowid;
		if (this.current_data == null) {
			last_rowid = 0;
		} else {
			if (this.current_data.length < 1) {
				last_rowid = 0;
			} else {
				last_rowid = this.current_data[0].rowid;
			}
		}
		return last_rowid;
	}

	resetData() {
		this.current_data = [];
	}

	/**
	 * Single row injection for WebSockets
	 * @param spot {object}
	 * @param callsign {string}
	 */
	injectSpot(spot, callsign = '') {
		// Check if spot already exists in current data (avoid duplicates)
		if (this.current_data.some(s => s.rowid === spot.rowid)) return;

		let d = new Date();
		let dt_current = ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear();
		
		const row = this.#buildRow(spot, true, dt_current, callsign);
		const tableBody = document.getElementById(this.selector);
		if (tableBody) {
			tableBody.prepend(row);
			// Update internal state
			this.current_data.unshift(spot);
			
			// Update HQ Metrics
			this.#updateMetrics();
			
			// Transition highlight removal after 5s
			setTimeout(() => {
				row.classList.remove('spot-new');
			}, 5000);

			// Limit table size to keep performance high
			if (tableBody.children.length > 100) {
				tableBody.removeChild(tableBody.lastChild);
				this.current_data.pop();
			}

			// Trigger visual/audio feedback for single inject
			if (typeof showToast === 'function') {
				showToast(`<strong>${spot.de}</strong> &rarr; <strong>${spot.dx}</strong> on ${this.#formatFreqMHz(spot.freq)} MHz`, 'Real-time Spot');
			}
			if (typeof showPWANotification === 'function') {
				showPWANotification('New DX Spot', `${spot.de} -> ${spot.dx} on ${this.#formatFreqMHz(spot.freq)} MHz`);
			}
			if (typeof playNewSpotSound === 'function') {
				playNewSpotSound();
			}

			// Re-init popovers for new element
			var popoverTriggerList = [].slice.call(row.querySelectorAll('[data-bs-toggle="popover"]'));
			popoverTriggerList.map(function (popoverTriggerEl) {
				return new bootstrap.Popover(popoverTriggerEl);
			});
		}
	}
	/**
	 * @param line {object}  with the data of a single spot
	 * @param isnew {boolean} is the new rows indicator
	 * @param dt_current {string} current date in dd/mm/yyyy format
	 * @param callsign {string} optional callsign 
	 * @return a &lt;tr&gt; dom element
	*/
	#buildRow(line, isnew, dt_current, callsign = '') {
		const row = document.createElement('tr');

		if (callsign.length > 0) {
			/* 
			do not check new lines 
			*/
		} else if (isnew && !this.first_time) {
			row.className = 'spot-new';
			// Transition highlight removal after 5s
			setTimeout(() => {
				row.classList.remove('spot-new');
			}, 5000);
		}

		const td_qrzde = document.createElement('td');
		const a_qrzde = document.createElement('a');
		a_qrzde.href = qrz_url + line.de;
		a_qrzde.target = '_blank';
		a_qrzde.rel = 'noopener';
		a_qrzde.className = 'text-decoration-none';

		const i_qrzde = document.createElement('i');
		i_qrzde.className = 'bi-search search-icon me-1';
		
		const span_qrzde = document.createElement('span');
		span_qrzde.className = 'callsign-text fw-bold';

		//Mark DE if it found in callsign search
		if (line.de == callsign) {
			const mark_qrzde = document.createElement('mark');
			mark_qrzde.textContent = line.de;
			span_qrzde.appendChild(mark_qrzde);
		} else {
			span_qrzde.textContent = line.de;
		}

		a_qrzde.appendChild(i_qrzde);
		a_qrzde.appendChild(span_qrzde);
		td_qrzde.appendChild(a_qrzde);
		row.append(td_qrzde);

		//Column: frequency with Band Logic
		const freqValue = parseFloat(line.freq);
		const bandInfo = this.#getBandStyle(freqValue);

		const span_freq = document.createElement('span');
		span_freq.className = `freq-badge badge-responsive ${bandInfo.class}`;
		span_freq.textContent = Intl.NumberFormat('it-IT', { style: 'decimal' }).format(line.freq);

		const td_freq = document.createElement('td');
		td_freq.appendChild(span_freq);

		// Band tag shown next to frequency on mobile (hidden on desktop via CSS)
		const bandTag = document.createElement('span');
		bandTag.className = `spot-band-tag ${bandInfo.class}`;
		bandTag.textContent = bandInfo.label;
		td_freq.appendChild(bandTag);

		row.appendChild(td_freq);

		//Column: DX (with ADXO Management)
		var adxo = findAdxo(my_adxo_events, line.dx);
		var adxo_link = '<a href=' + adxo_url + ' target=_blank rel=noopener >NG3K Website</a>';
		
		const td_qrzdx = document.createElement('td');
		const a_qrzdx = document.createElement('a');
		a_qrzdx.href = qrz_url + line.dx;
		a_qrzdx.target = '_blank';
		a_qrzdx.rel = 'noopener';
		a_qrzdx.className = 'text-decoration-none';

		const i_qrzdx = document.createElement('i');
		i_qrzdx.className = 'bi-search search-icon me-1';
		
		const span_qrzdx = document.createElement('span');
		span_qrzdx.className = 'callsign-text fw-bold';
		
		if (line.dx == callsign) {
			const mark_qrzdx = document.createElement('mark');
			mark_qrzdx.textContent = line.dx;
			span_qrzdx.appendChild(mark_qrzdx);
		} else {
			span_qrzdx.textContent = line.dx;
		}

		if (adxo != undefined) {
			const i_adxo = document.createElement('i');
			i_adxo.tabIndex = 0;
			i_adxo.className = 'bi-megaphone-fill ms-1';
			i_adxo.style = 'color: #3b82f6; cursor: pointer;';
			i_adxo.setAttribute('data-bs-container', 'body');
			i_adxo.setAttribute('data-bs-toggle', 'popover');
			i_adxo.setAttribute('data-bs-trigger', 'focus');
			i_adxo.setAttribute('data-bs-html', 'true');
			i_adxo.setAttribute('data-bs-title', 'DX Op: ' + adxo.summary);
			i_adxo.setAttribute('data-bs-content', adxo.description + '<br><br>' + adxo_link);
			span_qrzdx.appendChild(i_adxo);
		}

		a_qrzdx.appendChild(i_qrzdx);
		a_qrzdx.appendChild(span_qrzdx);
		td_qrzdx.appendChild(a_qrzdx);
		row.appendChild(td_qrzdx);

		//Column: Flag
		const td_flag = document.createElement('td');
		try {
			const span_flag = document.createElement('span');
			span_flag.className = 'img-flag fi fi-' + line.iso;
			span_flag.setAttribute('data-bs-container', 'body');
			span_flag.setAttribute('data-bs-toggle', 'popover');
			span_flag.setAttribute('data-bs-trigger', 'hover');
			span_flag.setAttribute('data-bs-placement', 'left');
			span_flag.setAttribute('data-bs-content', line.country);
			td_flag.appendChild(span_flag);
		} catch (err) {
			console.log('error creating flag');
		}
		// Country name under flag (mobile only)
		if (line.country) {
			const flagCountry = document.createElement('div');
			flagCountry.className = 'flag-country-mobile';
			flagCountry.textContent = line.country;
			td_flag.appendChild(flagCountry);
		}
		row.appendChild(td_flag);

		//Column: Country/QTH (desktop only)
		const td_country_code = document.createElement('td');
		td_country_code.className = 'd-none d-lg-table-cell d-xl-table-cell text-muted small py-2';
		td_country_code.textContent = line.country;
		row.appendChild(td_country_code);

		//Column: Comment			
		const td_comm = document.createElement('td');
		td_comm.className = 'd-none d-lg-table-cell d-xl-table-cell text-light small py-2 italic';
		try {
			td_comm.textContent = line.comm.substring(0, 100);
		} catch (err) {
			td_comm.textContent = '';
		}
		row.appendChild(td_comm);

		//Column: UTC			
		let dt = new Date(line.time * 1000);
		let tm = dt.getUTCHours().toString().padStart(2, '0') + ':' + dt.getUTCMinutes().toString().padStart(2, '0');
		
		const td_utc = document.createElement('td');
		const span_tm = document.createElement('span');
		span_tm.className = 'utc-time fw-bold text-emerald';
		span_tm.textContent = tm;
		td_utc.appendChild(span_tm);
		row.appendChild(td_utc);

		// Mobile-only rich meta cell: comment only (full width)
		const td_mobile_meta = document.createElement('td');
		td_mobile_meta.className = 'spot-meta-mobile';

		// Comment line (if present)
		if (line.comm) {
			const metaComm = document.createElement('div');
			metaComm.className = 'spot-meta-comm';
			metaComm.textContent = line.comm.substring(0, 100);
			td_mobile_meta.appendChild(metaComm);
		}

		row.appendChild(td_mobile_meta);

		return row;
	}

	/**
	 * Helper for band-specific styling
	 * @param freq {number}
	 */
	#getBandStyle(freq) {
		// Normalization: handle strings, commas, and kHz/MHz conversion
		let f_str = freq ? freq.toString().replace(',', '.') : '0';
		let f = parseFloat(f_str);
		
		// If freq is in kHz (e.g. 7199), convert to MHz (7.199)
		if (f > 100) f = f / 1000;

		if (f < 2.5) return { class: 'band-160m', label: '160m' };
		if (f < 5.0) return { class: 'band-80m', label: '80m' };
		if (f < 9.0) return { class: 'band-40m', label: '40m' };
		if (f < 12.0) return { class: 'band-30m', label: '30m' };
		if (f < 16.0) return { class: 'band-20m', label: '20m' };
		if (f < 19.0) return { class: 'band-17m', label: '17m' };
		if (f < 23.0) return { class: 'band-15m', label: '15m' };
		if (f < 26.0) return { class: 'band-12m', label: '12m' };
		if (f < 30.0) return { class: 'band-10m', label: '10m' };
		return { class: 'band-v-u-shf', label: 'VHF+' };
	}

	/**
	 * Format frequency for display in MHz
	 * DB stores kHz (e.g. 7022), convert to MHz (7.022) for toast notifications
	 * @param freq {number|string} frequency in kHz
	 * @returns {string} formatted frequency in MHz
	 */
	#formatFreqMHz(freq) {
		let f_str = freq ? freq.toString().replace(',', '.') : '0';
		let f = parseFloat(f_str);
		if (f > 100) f = f / 1000;
		return f.toFixed(3).replace(/\.?0+$/, '');
	}

	/**
	 * Update HQ Metrics Bar
	 */
	#updateMetrics() {
		if (!this.current_data || this.current_data.length === 0) return;

		const totalSpots = this.current_data.length;
		const bands = {};
		const modes = { CW: 0, PH: 0, DG: 0 };

		this.current_data.forEach(s => {
			const b = this.#getBandStyle(s.freq).label;
			bands[b] = (bands[b] || 0) + 1;
			
			const comm = (s.comm || '').toUpperCase();
			if (comm.includes('CW')) modes.CW++;
			else if (comm.includes('FT8') || comm.includes('FT4') || comm.includes('RTTY')) modes.DG++;
			else modes.PH++;
		});

		const hotBand = Object.keys(bands).reduce((a, b) => bands[a] > bands[b] ? a : b);
		const peakMode = Object.keys(modes).reduce((a, b) => modes[a] > modes[b] ? a : b);

		const elTotal = document.getElementById('stat-total-spots');
		const elBand = document.getElementById('stat-hot-band');
		const elMode = document.getElementById('stat-peak-mode');

		if (elTotal) elTotal.textContent = totalSpots;
		if (elBand) elBand.textContent = hotBand;
		if (elMode) elMode.textContent = peakMode === 'DG' ? 'DIGITAL' : (peakMode === 'PH' ? 'PHONE' : 'CW');
	}

	/**
	 * Build the table with the spot
	 *
	 * @param data {json} The payload with all the spots received from cluster
	 * @param rl {json} Row List
	 * @param callsign {string} An optional parameter with the callsign to search
	 */
	build(data, callsign) {

		if (data != null) {

			//get current date
			let d = new Date();
			let dd_current = '00' + d.getUTCDate();
			dd_current = dd_current.substring(dd_current.length - 2, dd_current.length);
			let mo_current = '00' + (Number(d.getUTCMonth()) + 1);
			mo_current = mo_current.substring(mo_current.length - 2, mo_current.length);
			let yy_current = d.getUTCFullYear();
			let dt_current = dd_current + '/' + mo_current + '/' + yy_current;

			//empty the table
			document.getElementById(this.selector).replaceChildren();

			//insert in table new elements
			let merge_data = [];
			for (let i = 0; i < data.length; i++) {
				document.getElementById(this.selector).append(this.#buildRow(data[i], true, dt_current, callsign));
				merge_data.push(data[i]);
			}

			//insert in html table previous elements
			for (let i = 0; i < this.current_data.length - data.length; i++) {
				document.getElementById(this.selector).append(this.#buildRow(this.current_data[i], false, dt_current, callsign));
				merge_data.push(this.current_data[i]);
			}

			//replace current data with merge
			this.current_data = merge_data;

			// Update HQ Metrics
			this.#updateMetrics();

			// Trigger Toast for new spots (only after initial load)
			if (data.length > 0 && !this.first_time) {
				const spotCount = data.length;
				const latestSpot = data[0];
				const message = spotCount === 1 
					? `<strong>${latestSpot.de}</strong> &rarr; <strong>${latestSpot.dx}</strong> on ${this.#formatFreqMHz(latestSpot.freq)} MHz`
					: `Received <strong>${spotCount}</strong> new spots (Latest: ${latestSpot.dx})`;
				
				if (typeof showToast === 'function') {
					showToast(message, 'DX Cluster Update');
				}
				if (typeof playNewSpotSound === 'function') {
					playNewSpotSound();
				}
			}

			var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
			var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
				return new bootstrap.Popover(popoverTriggerEl);
			});

			this.first_time = false;
		}
	}
} //end class


/********************************************************************************
 * javascript used to popolate main  table with spots            
 * ******************************************************************************/
const adxo_url = 'https://www.ng3k.com/misc/adxo.html';
const qrz_url = 'https://www.qrz.com/db/';
const tb = new table_builder('bodyspot');
var params_sv = {};

function updateLiveStatus(state, text) {
	const statusEl = document.getElementById('ws-status');
	const textEl = document.getElementById('ws-status-text');
	if (!statusEl || !textEl) return;

	statusEl.className = `live-status live-status-${state}`;
	textEl.textContent = text;
}

// SOCKET.IO INTEGRATION
const socket = io();

socket.on('connect', () => {
    console.log('[Socket] Connected to server');
	updateLiveStatus('online', 'Live');
});

socket.on('disconnect', () => {
	console.log('[Socket] Disconnected from server');
	updateLiveStatus('offline', 'Offline');
});

socket.io.on('reconnect_attempt', () => {
	updateLiveStatus('pending', 'Reconnecting');
});

socket.io.on('reconnect', () => {
	updateLiveStatus('online', 'Live');
});

socket.on('new_spots', (data) => {
    console.log('[Socket] Received new spots:', data.spots.length);
    // Reverse because we want to prepend in order (oldest of the new ones first if multiple)
    data.spots.reverse().forEach(spot => {
        tb.injectSpot(spot, params_sv.callsign || '');
    });
});

/**
 * Decode Announced Dx Operation (ng3k)
 *
 * @param adxo {adxo} This is the json containing all the dxo events
 * @param callsign_to_find {callsign_to_find} The callsign of the current dx line
 */
function findAdxo(adxo, callsign_to_find) {
	if (adxo) {
		for (let i = 0; i < adxo.length; i++) {
			if (adxo[i].callsign == callsign_to_find) {
				return adxo[i];
			}
		}
	}
}


/**
 * Function to filter spot when pressed the search button on filter
 * This function trigger the search, also triggered by timer
 */
function mySearch(event) {
	event.preventDefault();
	refresh_timer(); //force the call of query 
}

/**
 * Function for construct query string for single value selection
 *
 * @param id {string} The html identifier used for filter
 * @param len {number} The maximum number of element that could be selected; use -1 if the filter permits a single selection
 * @param qry_json {object} The input json 
 */
function compose_filter(id, len, qry_json) {

	try {
		if (len == 0) {  //checkboxes
			qry_json[id] = document.getElementById(id).checked; 
		} else {
			let selectedFilter = [].map.call(document.getElementById(id).selectedOptions, option => option.value);
			if (selectedFilter.length < len) { //lists
				qry_json[id] = [];
				selectedFilter.map(function (el) {
					if (el) {
						qry_json[id].push(el);
					} else {
						return '';
					}
				});
			} else if (len == -1) {    //combo-box
				selectedFilter.map(function (el) {
					if (el) {
						qry_json[id] = el;
					} else {
						return '';
					}
				});
			}
		}
	}
	catch (err) {
		if (err instanceof TypeError) {
			console.log(err.name + ' managed - it is ok: probabilly ther is no filter on cq region');
		} else {
			throw err;
		}
	}

	return qry_json;
}

/**
 * Search / Filter cluster spot based on filter settings            
 * Gets the filter values, constructs the query parameter and 
 * make the request to the server
 */
function refresh_timer() {

	let params = {};

	//get other filters
	params = compose_filter('dxcalls', 14, params);
	params = compose_filter('band', 14, params);
	params = compose_filter('de_re', 7, params);
	params = compose_filter('dx_re', 7, params);
	params = compose_filter('mode', 3, params);
	params = compose_filter('cqdeInput', -1, params);
	params = compose_filter('cqdxInput', -1, params);
	params = compose_filter('exclft8', 0, params);
	params = compose_filter('exclft4', 0, params);


	delete params_sv['lr'];  //remove line row number, for future param comparison	
	//If the filter is changed we need to reset the data table and restart from rowid=0
	if (JSON.stringify(params) !== JSON.stringify(params_sv)) {
		tb.resetData();
		params_sv = params;
	}
	params['lr'] = tb.getLastRowId();

	//Open a new connection, using the GET request on the URL endpoint
	//let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");	
	fetch('spotlist', {
		method: 'POST',
		cache: 'no-cache',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(params)
	})
		.then((response) => response.json())
		.then((data_new) => {
			try {
				tb.build(data_new);
			} catch (err) {
				console.log(err);
				console.log(err.stack);
				console.log(data_new);
			}
		});
}

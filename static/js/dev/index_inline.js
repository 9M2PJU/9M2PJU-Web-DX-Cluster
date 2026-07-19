/* 
 * script loaded inline page in order to prepare data
 * for next operations
 * Moreover, add an event to the button of the filter form
 */
//var my_adxo_events=jQuery.parseJSON(my_adxo_events_json.replaceAll("\t",""));

var my_adxo_events = JSON.parse(my_adxo_events_json.replaceAll('\t', ''));
//var my_adxo_events = JSON.parse(my_adxo_events_json)
refresh_timer(); //run first data fetch
var myRefresh = setInterval(refresh_timer, 10000); // Live updates every 10 seconds

// showTime is already managed in common.js

function getSelectValues(id) {
	const select = document.getElementById(id);
	if (!select) return [];
	return Array.from(select.options).map((option) => option.value);
}

function getSelectedValues(id) {
	const select = document.getElementById(id);
	if (!select) return [];
	return Array.from(select.selectedOptions).map((option) => option.value);
}

function setMultiSelectValues(id, values) {
	const select = document.getElementById(id);
	if (!select) return;
	const wanted = new Set(values);
	Array.from(select.options).forEach((option) => {
		option.selected = wanted.has(option.value);
	});
}

function countActiveFilters() {
	let count = 0;
	const bandOptions = getSelectValues('band');
	const modeOptions = getSelectValues('mode');
	const deOptions = getSelectValues('de_re');
	const dxOptions = getSelectValues('dx_re');

	if (getSelectedValues('band').length !== bandOptions.length) count++;
	if (getSelectedValues('mode').length !== modeOptions.length) count++;
	if (getSelectedValues('de_re').length !== deOptions.length) count++;
	if (getSelectedValues('dx_re').length !== dxOptions.length) count++;
	if (document.getElementById('dxcalls')?.selectedOptions.length > 0) count++;
	if (document.getElementById('exclft8')?.checked) count++;
	if (document.getElementById('exclft4')?.checked) count++;
	if (document.getElementById('cqdeInput')?.value) count++;
	if (document.getElementById('cqdxInput')?.value) count++;

	return count;
}

function updateActiveFilterCount() {
	const counter = document.getElementById('active-filter-count');
	if (counter) counter.textContent = countActiveFilters();
}

function setActiveQuickFilter(filterName) {
	document.querySelectorAll('.quick-filter').forEach((button) => {
		button.classList.toggle('active', button.dataset.quickFilter === filterName);
	});
}

function applyQuickFilter(filterName) {
	const bands = getSelectValues('band');
	const hfBands = bands.filter((band) => !['6', 'VHF', 'UHF', 'SHF'].includes(band));
	const vhfBands = bands.filter((band) => ['6', 'VHF', 'UHF', 'SHF'].includes(band));

	if (filterName === 'hf') setMultiSelectValues('band', hfBands);
	if (filterName === 'vhf') setMultiSelectValues('band', vhfBands);
	if (filterName === 'cw') setMultiSelectValues('mode', ['cw']);
	if (filterName === 'phone') setMultiSelectValues('mode', ['phone']);
	if (filterName === 'digi') setMultiSelectValues('mode', ['digi']);

	setActiveQuickFilter(filterName);
	updateActiveFilterCount();
	refresh_timer();
}

function resetFilterIndicators() {
	setTimeout(() => {
		document.querySelectorAll('.quick-filter').forEach((button) => button.classList.remove('active'));
		updateActiveFilterCount();
		refresh_timer();
	}, 0);
}

/* managing Tom Select for selecting DX callsings */
document.addEventListener('DOMContentLoaded', function () {
	var dxcallsElement = document.getElementById('dxcalls');
	if (dxcallsElement) {
		new TomSelect(dxcallsElement, {
			plugins: {
				remove_button: {
					title: 'Remove callsign',
				},
				'dropdown_header': {
					title: 'Callsign'
				},
				'clear_button':{
					'title':'Remove all selected options',
				}
			},
			persist: false,
			create: true,
			createOnBlur: true,
			allowEmptyOption: true,
			maxItems: 6,
			wrap: true,
			onChange: updateActiveFilterCount
		});
	}

	document.getElementById('form-filters')?.addEventListener('submit', mySearch);
	document.getElementById('form-filters')?.addEventListener('reset', resetFilterIndicators);
	document.getElementById('form-filters')?.addEventListener('change', updateActiveFilterCount);
	document.querySelectorAll('.quick-filter').forEach((button) => {
		button.addEventListener('click', () => applyQuickFilter(button.dataset.quickFilter));
	});

	updateActiveFilterCount();
});


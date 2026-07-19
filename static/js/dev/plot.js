class plot_base {

	//refresh = function(){   
	refresh() {
	}

	/**
	* Chart creator
	*
	* @constructor
	* @param {String} chart_id The HTML id where place chart
	* @param {string} end_point This is backend end-point for chart datas 
	*/
	constructor(chart_id, end_point) {
		// Initialize the echarts instance based on the prepared dom
		let chartDom = document.getElementById(chart_id);
		this.end_point = end_point;
		this.myChart = echarts.init(chartDom);

		//resize on window resize and mobile orientation change
		const chart = this.myChart;
		const doResize = () => chart.resize();
		window.addEventListener('resize', doResize);
		window.addEventListener('orientationchange', () => setTimeout(doResize, 250));
	}

}  //end class


/********************************************************************************
 * javascript used to build band_activity chart       
 * ******************************************************************************/
class band_activity extends plot_base {

	/**
	 * refresh and populate chart 
	 *
	 * @param {string} region  This is the continent name (EU,AF,NA...) of the selected
	 */
	//refresh = function(this.myChart, end_point, region, bands, continents){
	//refresh = function(region){        
	refresh(region) {
		super.refresh();
		console.log('refresh band_activity');
		if (typeof region !== 'undefined') {
			this.selectedContinent = region;
		}

		// Asynchronous Data Loading
		//fetch(this.end_point + '?continent=' + this.selectedContinent)
		const params = {
			continent: this.selectedContinent
		};

		fetch(this.end_point, {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'				
			},
			body: JSON.stringify( params )  
		})			
			.then((response) => response.json())
			.then((data) => {
				// Fill in the data
				var last_refresh = get_last_refresh(data);
				var dataMap = Array.from(data['band activity']).map(function (item) {
					return [item[1], item[0], item[2] || '-'];
				});
				// Modern Redesign: Band Activity
				this.myChart.setOption({
					backgroundColor: 'transparent',
					tooltip: {
						position: 'top',
						backgroundColor: 'rgba(10, 10, 10, 0.8)',
						borderColor: '#10b981',
						textStyle: { color: '#fff', fontFamily: 'Inter' },
						backdropFilter: 'blur(4px)',
						formatter: function (p) {
							return `<span style="color:#10b981;font-weight:bold">${p.seriesName}</span><br/>${p.name} Band: <b>${p.data[2]}</b>`;
						}
					},
					title: {
						text: 'BAND ACTIVITY',
						subtext: last_refresh,
						textStyle: { color: '#fff', fontFamily: 'Outfit', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
						subtextStyle: { color: '#94a3b8', fontSize: 11 },
						top: 10,
						left: 10
					},
					toolbox: {
						show: true,
						right: 15,
						top: 10,
						feature: {
							saveAsImage: { show: true, iconStyle: { borderColor: '#10b981' } }
						}
					},
					grid: {
						height: '75%',
						left: '10%',
						top: 70,
						right: '15%',
						bottom: '10%',
						show: false
					},
					xAxis: {
						type: 'category',
						data: this.bands,
						axisTick: { show: false },
						axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
						axisLabel: { color: '#94a3b8', fontFamily: 'Inter', fontSize: 10 },
						splitLine: { show: false }
					},
					yAxis: {
						type: 'category',
						data: this.continents,
						axisTick: { show: false },
						axisLine: { show: false },
						axisLabel: { color: '#94a3b8', fontFamily: 'Inter', fontSize: 10 },
						splitLine: { show: false }
					},
					visualMap: {
						calculable: true,
						orient: 'vertical',
						right: 10,
						top: 'center',
						min: 0,
						max: 30,
						textStyle: { color: '#94a3b8', fontSize: 9 },
						inRange: {
							color: ['rgba(16, 185, 129, 0.05)', '#10b981', '#3b82f6'] // Emerald to Electric Blue
						}
					},
					series: [
						{
							name: 'Spots',
							type: 'heatmap',
							data: dataMap,
							itemStyle: {
								borderRadius: 2,
								borderColor: 'rgba(0,0,0,0.5)',
								borderWidth: 1
							},
							emphasis: {
								itemStyle: {
									shadowBlur: 15,
									shadowColor: 'rgba(16, 185, 129, 0.5)'
								}
							}
						}
					]
				});
			});
	}

	/**
	* Chart creator
	*
	* @constructor
	* @param {String} chart_id The HTML id where place chart
	* @param {string} end_point This is backend end-point for chart datas
	* @param {integer} refresh_time Time to refesh chart
	* @param {Json} cont_cq  The continent list( EU, SA, ...)
	* @param {Json} band_freq The frequency band list (160, 80, 60... UHF, SHF)
	*/
	constructor(chart_id, end_point, cont_cq, band_freq) {
		super(chart_id, end_point);

		//populate continents array
		let continents = [];
		cont_cq.forEach(function myFunction(item, index) {
			continents[index] = item['id'];
		});
		this.continents = continents;

		//populate bands array
		let bands = [];
		band_freq.forEach(function myFunction(item, index) {
			bands[index] = item['id'];
		});
		this.bands = bands;

		//managing region
		const continentInput = document.getElementById('continentInput');
		var selectedContinent = getCookie('user_region');
		var selectedContinent_desc = getCookie('user_region_desc');
		const hasSavedContinent = Boolean(selectedContinent);

		const getContinentDescription = (continent) => {
			const option = Array.from(continentInput.options).find((item) => item.value === continent);
			return option ? option.text : '';
		};
		const setRegionText = (description) => {
			setText('txt_continent', '\xa0 Based on DX SPOTS from stations in ' + description + ' during the last hour, displayed by Continent and Band');
		};
		const applyContinent = (continent, description, persist) => {
			if (!this.continents.includes(continent)) return;
			selectedContinent = continent;
			selectedContinent_desc = description || getContinentDescription(continent);
			selectElement('continentInput', selectedContinent);
			if (persist) {
				setCookie('user_region', selectedContinent, 60);
				setCookie('user_region_desc', selectedContinent_desc, 60);
			}
			setRegionText(selectedContinent_desc);
			this.refresh(selectedContinent);
		};

		if (!selectedContinent || !this.continents.includes(selectedContinent)) {
			selectedContinent = 'EU';
			selectedContinent_desc = 'Europe';
		}

		addEventHandler(continentInput, 'change', function () {
			applyContinent(this.value, this.options[this.selectedIndex].text, true);
		});

		applyContinent(selectedContinent, selectedContinent_desc, hasSavedContinent);

		if (!hasSavedContinent) {
			fetch('/visitor_continent', { cache: 'no-store', credentials: 'same-origin' })
				.then((response) => response.ok ? response.json() : null)
				.then((data) => {
					if (!data || !data.continent || getCookie('user_region')) return;
					applyContinent(data.continent, data.description, true);
				})
				.catch((err) => console.log('visitor continent lookup skipped', err));
		}

	}
}


/********************************************************************************
 * javascript used to build world dx spots live
 * ******************************************************************************/

class world_dx_spots_live extends plot_base {

	/**
   * refresh and populate chart 
   *
   */
	refresh() {
		super.refresh();
		console.log('refresh world_dx_spots_live');
		// Asynchronous Data Loading

		fetch(this.end_point, {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'						
			}
		})		

			.then((response) => response.json())
			.then((data) => {
				fetch('world.json')
					.then(response => response.text())
					.then(geoJson => {
						var last_refresh = get_last_refresh(data);
						var dataMap = [];
						data['world_dx_spots_live'].forEach(function myFunction(item, index) {
							//lon, lat, number of qso
							dataMap.push({ 'value': [item['lon'], item['lat'], item['count']] });
						});

						this.myChart.hideLoading();
						echarts.registerMap('WR', geoJson);

						// Modern Redesign: World Map
						this.myChart.setOption({
							backgroundColor: 'transparent',
							title: {
								text: 'LIVE WORLD DX ACTIVITY',
								subtext: last_refresh,
								textStyle: { color: '#fff', fontFamily: 'Outfit', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
								subtextStyle: { color: '#94a3b8', fontSize: 11 },
								top: 15,
								left: 20
							},
							tooltip: {
								trigger: 'item',
								backgroundColor: 'rgba(10, 10, 10, 0.8)',
								borderColor: '#10b981',
								textStyle: { color: '#fff', fontFamily: 'Inter' },
								formatter: function (val) {
									return `<span style="color:#10b981">Spots:</span> <b>${val.value[2]}</b>`;
								}
							},
							geo: {
								map: 'WR',
								roam: true,
								zoom: 1.2,
								layoutCenter: ['50%', '55%'],
								layoutSize: '110%',
								itemStyle: {
									areaColor: '#1a1a1a',
									borderColor: 'rgba(16, 185, 129, 0.3)',
									borderWidth: 1
								},
								emphasis: {
									itemStyle: { areaColor: '#252525' },
									label: { show: false }
								}
							},
							series: [
								{
									name: 'Active Spots',
									type: 'effectScatter',
									coordinateSystem: 'geo',
									data: dataMap,
									symbolSize: function (val) {
										return Math.min(Math.max(val[2] * 2, 8), 25);
									},
									showEffectOn: 'render',
									rippleEffect: {
										brushType: 'stroke',
										scale: 3,
										period: 4
									},
									hoverAnimation: true,
									itemStyle: {
										color: '#10b981',
										shadowBlur: 10,
										shadowColor: '#10b981'
									},
									zlevel: 1
								}
							]
						});

					}
					);
			});
	}
	/**
  * Chart creator
  *
  * @constructor
  * @param {String} chart_id The HTML id where place chart
  * @param {string} end_point This is backend end-point for chart datas
  */
	constructor(chart_id, end_point) {
		super(chart_id, end_point);
		this.refresh();
	}

}

/********************************************************************************
 * javascript used to build band/hour chart      
 * ******************************************************************************/

class hour_band extends plot_base {

	/**
   * refresh and populate chart 
   *
   * @param {Json} bands The frequency band list (160, 80, 60... UHF, SHF)
   */
	refresh() {

		// Asynchronous Data Loading
		super.refresh();
		console.log('refresh hour_band');

		fetch(this.end_point, {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'						
			}
		})			
			.then((response) => response.json())
			.then((data) => {
				// Fill in the dat
				var last_refresh = get_last_refresh(data);
				//set hour indicator names
				var hour_indicators = [];

				for (let i = 23; i > -1; i--) {
					var hour_name = {};
					var s = i.toString();
					hour_name['name'] = s;
					hour_indicators.push(hour_name);
				}

				//cycling whithin each bands and hours
				var dataMap = [];
				this.bands.forEach(band_item => {
					var qso = [];

					for (let i = 23; i > -1; i--) {
						try {
							var value = data['hour_band'][band_item][i];
							if (typeof value == 'undefined') {
								value = 0;
							}
							qso.push(value);
						} catch (TypeError) {
							//TODO
						}
					}
					var tot = { 'value': qso, 'name': band_item };
					dataMap.push(tot);
				});


				// Modern Redesign: Hour/Band Radar
				this.myChart.setOption({
					color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'],
					title: {
						text: 'HOURLY DYNAMICS',
						subtext: 'Last Month Analysis',
						textStyle: { color: '#fff', fontFamily: 'Outfit', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
						subtextStyle: { color: '#94a3b8', fontSize: 11 },
						top: 15,
						right: 20
					},
					legend: {
						orient: 'horizontal',
						left: 10,
						bottom: 10,
						textStyle: { color: '#94a3b8', fontSize: 9, fontFamily: 'Inter' },
						itemWidth: 10,
						itemHeight: 10
					},
					tooltip: {
						trigger: 'item',
						backgroundColor: 'rgba(10, 10, 10, 0.8)',
						borderColor: '#10b981',
						textStyle: { color: '#fff', fontFamily: 'Inter' }
					},
					radar: {
						shape: 'circle',
						indicator: hour_indicators,
						center: ['50%', '50%'],
						radius: '65%',
						axisName: { color: '#94a3b8', fontSize: 10 },
						splitLine: { lineStyle: { color: 'rgba(16, 185, 129, 0.1)' } },
						splitArea: { show: false },
						axisLine: { lineStyle: { color: 'rgba(16, 185, 129, 0.2)' } }
					},
					series: [
						{
							type: 'radar',
							symbol: 'circle',
							symbolSize: 4,
							data: dataMap,
							areaStyle: { opacity: 0.1 },
							lineStyle: { width: 2, opacity: 0.8 },
							emphasis: { lineStyle: { width: 4, opacity: 1 } }
						}
					]
				});
			});
	}


	/**
  * Chart creator
  *
  * @constructor
  * @param {String} chart_id The HTML id where place chart
  * @param {string} end_point This is backend end-point for chart datas
  * @param {Json} band_freq The frequency band list (160, 80, 60... UHF, SHF)
  */
	constructor(chart_id, end_point, band_freq) {
		// Initialize the echarts instance based on the prepared dom
		super(chart_id, end_point);

		//populate bands array
		let lcl_bands = [];
		band_freq.forEach(function myFunction(item, index) {
			lcl_bands[index] = item['id'];
		});
		this.bands = lcl_bands;
		this.refresh();

	}
}


/********************************************************************************
 * javascript used to build dx spots per month chart       
 * ******************************************************************************/

class dx_spots_per_month extends plot_base {

	/**
	 * refresh and populate chart 
	 */
	refresh() {

		console.log('refresh dx_spots_per_month');
		// Asynchronous Data Loading

		//$.getJSON(end_point).done(function(data) {
		
		fetch(this.end_point, {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'						
			}
		})		
			.then((response) => response.json())
			.then((data) => {
				// Fill in the data
				var last_refresh = get_last_refresh(data);
				var year_now = new Date().getFullYear();
				var year_0 = (year_now - 0).toString();
				var year_1 = (year_now - 1).toString();
				var year_2 = (year_now - 2).toString();

				var months_name = get_months_names();

				var dataMap_year_0 = [];
				var dataMap_year_1 = [];
				var dataMap_year_2 = [];
				for (let i = 1; i < 13; i++) {
					dataMap_year_0.push(data.spots_per_month[i].year_0);
					dataMap_year_1.push(data.spots_per_month[i].year_1);
					dataMap_year_2.push(data.spots_per_month[i].year_2);
				}

				// Modern Redesign: Spots per Month
				this.myChart.setOption({
					color: ['#3b82f6', '#8b5cf6', '#10b981'],
					tooltip: {
						trigger: 'axis',
						backgroundColor: 'rgba(10, 10, 10, 0.8)',
						borderColor: '#10b981',
						textStyle: { color: '#fff', fontFamily: 'Inter' }
					},
					title: {
						text: 'MONTHLY VOLUME',
						subtext: last_refresh,
						textStyle: { color: '#fff', fontFamily: 'Outfit', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
						subtextStyle: { color: '#94a3b8', fontSize: 11 },
						top: 15,
						left: 15
					},
					legend: {
						data: [year_2, year_1, year_0],
						bottom: 5,
						textStyle: { color: '#94a3b8', fontSize: 10 }
					},
					grid: { top: 80, bottom: 60, left: 50, right: 20 },
					xAxis: [
						{
							type: 'category',
							axisTick: { show: false },
							data: months_name,
							axisLabel: { color: '#94a3b8', fontSize: 10 },
							axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
						}
					],
					yAxis: [
						{
							type: 'value',
							splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
							axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v) => format_u_k_m(v) }
						}
					],
					series: [
						{
							name: year_2,
							type: 'bar',
							barMaxWidth: 15,
							itemStyle: { borderRadius: [4, 4, 0, 0] },
							data: dataMap_year_2
						},
						{
							name: year_1,
							type: 'bar',
							barMaxWidth: 15,
							itemStyle: { borderRadius: [4, 4, 0, 0] },
							data: dataMap_year_1
						},
						{
							name: year_0,
							type: 'bar',
							barMaxWidth: 15,
							itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: '#10b981'}, {offset: 1, color: '#059669'}]) },
							data: dataMap_year_0
						}
					]
				});
			});
	}

	/**
  * Chart creator
  *
  * @constructor
  * @param {String} chart_id The HTML id where place chart
  * @param {string} end_point This is backend end-point for chart datas
  */
	constructor(chart_id, end_point) {
		super(chart_id, end_point);
		this.refresh();
	}
}

/********************************************************************************
 * javascript used to build dx spots trend      
 * ******************************************************************************/

class dx_spots_trend extends plot_base {

	/**
	 * refresh and populate chart 
	 */
	refresh() {

		console.log('refresh dx_spots_trend');
		// Asynchronous Data Loading

		fetch(this.end_point, {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'						
			}
		})	
			.then((response) => response.json())
			.then((data) => {
				// Fill in the data
				var last_refresh = get_last_refresh(data);
				var dataMap = [];
				for (const [key, value] of Object.entries(data['spots_trend'])) {
					var tuple = [];
					tuple.push(key);
					tuple.push(value);
					dataMap.push(tuple);
				}
				// Modern Redesign: Spots Trend
				this.myChart.setOption({
					backgroundColor: 'transparent',
					tooltip: {
						trigger: 'axis',
						backgroundColor: 'rgba(10, 10, 10, 0.8)',
						borderColor: '#10b981',
						textStyle: { color: '#fff', fontFamily: 'Inter' }
					},
					title: {
						text: 'SPOT VOLUME TREND',
						subtext: last_refresh,
						textStyle: { color: '#fff', fontFamily: 'Outfit', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
						subtextStyle: { color: '#94a3b8', fontSize: 11 },
						top: 15,
						left: 15
					},
					grid: { top: 80, bottom: 80, left: 50, right: 20 },
					xAxis: {
						type: 'time',
						axisLabel: { color: '#94a3b8', fontSize: 10 },
						axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
						splitLine: { show: false }
					},
					yAxis: {
						type: 'value',
						splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
						axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v) => format_u_k_m(v) }
					},
					dataZoom: [{ type: 'inside', start: 70, end: 100 }, { type: 'slider', bottom: 10, height: 20, borderColor: 'transparent', handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z' }],
					series: [
						{
							name: 'Spots',
							type: 'line',
							smooth: true,
							symbol: 'none',
							lineStyle: { width: 3, color: '#10b981' },
							areaStyle: {
								color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
									{ offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
									{ offset: 1, color: 'rgba(16, 185, 129, 0)' }
								])
							},
							data: dataMap
						}
					]
				});
			});
	}

	/**
	* Chart creator
	*
	* @constructor
	* @param {String} chart_id The HTML id where place chart
	* @param {string} end_point This is backend end-point for chart datas
	*/
	constructor(chart_id, end_point) {
		// Initialize the echarts instance based on the prepared dom
		super(chart_id, end_point);
		this.refresh();
	}
}

//create objects and timing

var plot_ba = new band_activity('chart-band_activity', '/plot_get_heatmap_data', continents_cq, band_frequencies);
setInterval(function () { plot_ba.refresh(); }, 5 * 60 * 1000);

var plot_wdsl = new world_dx_spots_live('chart-world_dx_spots_live', '/plot_get_world_dx_spots_live');
setInterval(function () { plot_wdsl.refresh(); }, 5 * 60 * 1000);

var plot_hb = new hour_band('chart-hour_band', '/plot_get_hour_band', band_frequencies);
setInterval(function () { plot_hb.refresh(); }, 1 * 60 * 60 * 1000);

var plot_dspm = new dx_spots_per_month('chart-dx_spots_x_month', '/plot_get_dx_spots_per_month');
setInterval(function () { plot_dspm.refresh(); }, 12 * 60 * 60 * 1000);

var plot_dst = new dx_spots_trend('chart-dx_spots_trend', '/plot_get_dx_spots_trend');
setInterval(function () { plot_dst.refresh(); }, 12 * 60 * 60 * 1000);

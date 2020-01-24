let globalTemperatureData =
	'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json';

let heatMap = data => {
	// DATASET
	let dataset = data.monthlyVariance,
		baseTemp = data.baseTemperature;

	// PARAMETERS
	let margin = {
			top: 20,
			bottom: 20,
			right: 60,
			left: 60
		},
		width = 1000 + (margin.left + margin.right),
		height = 500 + (margin.top + margin.bottom),
		tileHeight = Math.round(height / 12),
		tileWidth = Math.round(width / (dataset.length / 12));

	// ARRAYS
	let years = dataset.map(val => val.year);
	let months = dataset.map(val => val.month - 1);
	let variance = dataset.map(val => val.variance);

	// MAX / MIN
	let yearMin = d3.min(years),
		yearMax = d3.max(years),
		// monthMin = d3.min(months),
		// monthMax = d3.max(months),
		varianceMin = d3.min(variance),
		varianceMax = d3.max(variance),
		tempMin = Math.round((baseTemp + varianceMin) * 1000) / 1000,
		tempMax = Math.round((baseTemp + varianceMax) * 1000) / 1000;

	let tempColors = [
		'#67001f',
		'#b2182b',
		'#d6604d',
		'#f4a582',
		'#fddbc7',
		'#f7f7f7',
		'#d1e5f0',
		'#92c5de',
		'#4393c3',
		'#2166ac',
		'#053061'
	].reverse();

	let threshDomain = ((min, max, count) => {
		let array = [];
		let step = (max - min) / count;
		let base = min;
		for (let i = 1; i < count; i++) {
			let val = Math.round((base + i * step) * 1000) / 1000;
			array.push(val);
		}
		return array;
	})(tempMin, tempMax, tempColors.length);

	// SCALES
	let yearScale = d3
			.scaleLinear()
			.domain([yearMin, yearMax])
			.range([margin.left, width - margin.right]),
		monthScale = d3
			.scaleBand()
			.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
			.rangeRound([0, height - (margin.top + margin.bottom)], 0, 0),
		legendThreshold = d3
			.scaleThreshold()
			.domain(threshDomain)
			.range(tempColors);

	// VISUALIZATION
	let vis = d3.select('#vis');

	// HEADER
	let header = vis.append('header');

	// TITLE
	header
		.append('h1')
		.attr('id', 'title')
		.attr('class', 'title')
		.text('D3: Monthly Global Land-Surface Temperature');

	// SUBTITLE
	header
		.append('h2')
		.attr('id', 'description')
		.attr('class', 'description')
		.text(() => {
			let min = dataset[0].year,
				max = dataset[dataset.length - 1].year;
			return `From: ${min} - ${max}, Base Temperature: ${baseTemp}°`;
		});

	// TOOLTIP
	let tooltip = d3
		.tip()
		.attr('class', 'd3-tip')
		.attr('id', 'tooltip')
		.offset([10, 0])
		.html(d => d);

	// SVG
	let svg = vis
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.call(tooltip);

	// PLOT
	svg
		.selectAll('rect')
		.data(dataset)
		.enter()
		.append('rect')
		.attr('class', 'cell')
		.attr('data-year', (d, i) => years[i])
		.attr('data-month', (d, i) => months[i])
		.attr('data-temp', (d, i) => variance[i])
		.attr('x', (d, i) => yearScale(years[i]))
		.attr('y', (d, i) => monthScale(months[i]))
		.attr('width', tileWidth)
		.attr('height', tileHeight)
		.attr('fill', (d, i) => legendThreshold(Math.round((baseTemp + variance[i]) * 1000) / 1000))
		.on('mouseover', (d, i) => {
			let date = new Date(months[i], years[i]),
				temp = Math.round((baseTemp + variance[i]) * 100) / 100,
				diff = variance[i];

			let info = `
	    <p>${d3.timeFormat('%Y - %B')(date)}</p>
	    <p>${temp}°, ${diff}°</p>
	`;

			tooltip
				.attr('data-year', years[i])
				.style({
					left: d3.event.pageX + 'px',
					top: d3.event.pageY - 28 + 'px'
				})
				.show(info);
		})
		.on('mouseout', () => tooltip.hide());

	// AXES
	let xAxis = d3.axisBottom(yearScale).tickFormat(d3.format('d')),
		yAxis = d3.axisLeft(monthScale).tickFormat(month => {
			let date = new Date(0);
			date.setUTCMonth(month + 1);
			return d3.timeFormat('%B')(date);
		});

	svg
		// X
		.append('g')
		.attr('id', 'x-axis')
		.attr('class', 'axis')
		.attr('transform', `translate(0, ${height - (margin.top + margin.bottom)})`)
		.call(xAxis);
	svg
		// Y
		.append('g')
		.attr('id', 'y-axis')
		.attr('class', 'axis')
		.attr('transform', `translate(${margin.left}, 0)`)
		.call(yAxis);

	// LEGEND
	let legendWidth = width - (margin.left + margin.right),
		legendHeight = 300 / tempColors.length;

	let legendX = d3
		.scaleLinear()
		.domain([tempMin, tempMax])
		.range([0, legendWidth]);

	let legendXAxis = d3
		.axisBottom(legendX)
		.tickSize(10, 0)
		.tickValues(legendThreshold.domain())
		.tickFormat(d3.format('.1f'));

	let legend = vis
		.append('svg')
		.attr('id', 'legend')
		.attr('class', 'legend');

	legend
		.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.bottom * 2})`)
		.call(legendXAxis)
		.selectAll('rect')
		.data(
			legendThreshold.range().map(color => {
				let d = legendThreshold.invertExtent(color);
				if (d[0] == null) d[0] = legendX.domain()[0];
				if (d[1] == null) d[1] = legendX.domain()[1];
				return d;
			})
		)
		.enter()
		.append('rect')
		.style('fill', d => legendThreshold(d[0]))
		.attr('width', d => legendX(d[1]) - legendX(d[0]))
		.attr('height', legendHeight)
		.attr('x', d => legendX(d[0]))
		.attr('y', -legendHeight);

	legend
		.append('text')
		.attr('fill', '#fff')
		.attr('font-weight', 'bold')
		.attr('text-anchor', 'start')
		.style('transform', 'translate(150%, 0)')
		.text('Temperature (degrees)');
};

// // INIT
d3.json(globalTemperatureData).then(heatMap);

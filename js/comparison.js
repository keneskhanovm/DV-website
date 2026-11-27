document.addEventListener("DOMContentLoaded", () => {
  renderHorizontalBarChart();
  renderGroupedBarChart();
  renderStacked100BarChart();
  renderHeatmap();
  renderWaffleChart();
  renderDumbbellPlot();
});

function createTooltip(container) {
  return d3.select(container)
    .append("div")
    .attr("class", "viz-tooltip");
}

function positionTooltip(tooltip, event, container) {
  const [x, y] = d3.pointer(event, container);
  const bounds = container.getBoundingClientRect();
  const left = Math.min(x + 12, bounds.width - 190);
  tooltip
    .style("left", Math.max(8, left) + "px")
    .style("top", Math.max(8, y - 42) + "px");
}

// 1. horizontal bar chart 
function renderHorizontalBarChart() {
  const data = [
    { region: "United States", twh: 183, share: "45%", highlight: true },
    { region: "China", twh: 104, share: "25%", highlight: false },
    { region: "Europe", twh: 62, share: "15%", highlight: false },
    { region: "Asia-Pacific (excl. China)", twh: 42, share: "10%", highlight: false },
    { region: "Rest of World", twh: 24, share: "5%", highlight: false }
  ];

  const container = document.getElementById("chart-bar");
  const tooltip = createTooltip(container);

  const width = 760;
  const height = 310;
  const margin = { top: 20, right: 85, bottom: 40, left: 185 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Horizontal bar chart of data centre electricity consumption by region in 2024");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, 210])
    .range([0, innerW]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.region))
    .range([0, innerH])
    .padding(0.28);

  // Subtle vertical gridlines
  g.append("g")
    .attr("class", "svg-grid")
    .call(d3.axisBottom(x).ticks(5).tickSize(innerH).tickFormat(""))
    .select(".domain").remove();

  // Axes
  g.append("g")
    .attr("class", "svg-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove();

  g.append("g")
    .attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + " TWh"));

  // Bars (Start with gray: US highlighted in blue)
  g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.region))
    .attr("width", d => x(d.twh))
    .attr("height", y.bandwidth())
    .attr("rx", 3)
    .attr("class", d => d.highlight ? "bar-highlight" : "bar-muted")
    .on("mousemove", (event, d) => {
      tooltip
        .classed("visible", true)
        .html(`<strong>${d.region}</strong><br>${d.twh} TWh (${d.share} global share)`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  // Direct value labels
  g.selectAll(".val-label")
    .data(data)
    .join("text")
    .attr("class", d => d.highlight ? "svg-label-bold" : "svg-label")
    .attr("x", d => x(d.twh) + 8)
    .attr("y", d => y(d.region) + y.bandwidth() / 2 + 4)
    .text(d => `${d.twh} TWh (${d.share})`);
}

// 2. grouped bar chart
function renderGroupedBarChart() {
  const data = [
    { region: "United States", y2024: 183, y2030: 425 },
    { region: "China", y2024: 104, y2030: 275 },
    { region: "Europe", y2024: 62, y2030: 115 },
    { region: "Rest of World", y2024: 66, y2030: 130 }
  ];

  const subgroups = ["y2024", "y2030"];
  const labels = { y2024: "2024 Actual", y2030: "2030 Base Case" };

  const container = document.getElementById("chart-grouped");
  const tooltip = createTooltip(container);

  const width = 760;
  const height = 340;
  const margin = { top: 24, right: 30, bottom: 45, left: 65 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Grouped bar chart comparing 2024 and 2030 projected data centre electricity consumption");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand()
    .domain(data.map(d => d.region))
    .range([0, innerW])
    .padding(0.25);

  const x1 = d3.scaleBand()
    .domain(subgroups)
    .range([0, x0.bandwidth()])
    .padding(0.12);

  const y = d3.scaleLinear()
    .domain([0, 480])
    .range([innerH, 0]);

  g.append("g")
    .attr("class", "svg-grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""))
    .select(".domain").remove();

  g.append("g")
    .attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x0));

  g.append("g")
    .attr("class", "svg-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + " TWh"));

  const regionGroups = g.selectAll(".region-group")
    .data(data)
    .join("g")
    .attr("transform", d => `translate(${x0(d.region)},0)`);

  regionGroups.selectAll("rect")
    .data(d => subgroups.map(key => ({ key, value: d[key], region: d.region })))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => innerH - y(d.value))
    .attr("rx", 3)
    .attr("class", d => d.key === "y2030" ? "bar-highlight" : "bar-muted")
    .on("mousemove", (event, d) => {
      tooltip
        .classed("visible", true)
        .html(`<strong>${d.region}</strong><br>${labels[d.key]}: ${d.value} TWh`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  // Direct data labels above bars
  regionGroups.selectAll("text")
    .data(d => subgroups.map(key => ({ key, value: d[key] })))
    .join("text")
    .attr("class", d => d.key === "y2030" ? "svg-label-bold" : "svg-label")
    .attr("x", d => x1(d.key) + x1.bandwidth() / 2)
    .attr("y", d => y(d.value) - 6)
    .attr("text-anchor", "middle")
    .text(d => d.value);
}

// 3. stacked 100% bar chart
function renderStacked100BarChart() {
  const data = [
    { country: "Sweden", renewables: 69, nuclear: 29, fossil: 2 },
    { country: "France", renewables: 27, nuclear: 65, fossil: 8 },
    { country: "Ireland", renewables: 42, nuclear: 0, fossil: 58 },
    { country: "United States", renewables: 23, nuclear: 18, fossil: 59 },
    { country: "China", renewables: 32, nuclear: 5, fossil: 63 },
    { country: "Singapore", renewables: 4, nuclear: 0, fossil: 96 }
  ];

  const keys = ["renewables", "nuclear", "fossil"];
  const keyNames = { renewables: "Renewables", nuclear: "Nuclear", fossil: "Fossil Fuels" };
  const classMap = { renewables: "bar-teal", nuclear: "bar-highlight", fossil: "bar-muted" };

  const stack = d3.stack().keys(keys);
  const series = stack(data);

  const container = document.getElementById("chart-stacked");
  const tooltip = createTooltip(container);

  const width = 760;
  const height = 320;
  const margin = { top: 20, right: 30, bottom: 40, left: 120 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "100% stacked bar chart of electricity generation mix across data centre hub countries");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 100]).range([0, innerW]);
  const y = d3.scaleBand().domain(data.map(d => d.country)).range([0, innerH]).padding(0.26);

  g.append("g")
    .attr("class", "svg-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove();

  g.append("g")
    .attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

  const layer = g.selectAll(".stack-layer")
    .data(series)
    .join("g")
    .attr("class", d => classMap[d.key]);

  layer.selectAll("rect")
    .data(d => d.map(item => ({ ...item, key: d.key })))
    .join("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d.data.country))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("height", y.bandwidth())
    .on("mousemove", (event, d) => {
      const pct = d[1] - d[0];
      tooltip
        .classed("visible", true)
        .html(`<strong>${d.data.country}</strong><br>${keyNames[d.key]}: ${pct}%`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  // Direct percentage labels inside segments >= 12%
  layer.selectAll("text")
    .data(d => d.map(item => ({ ...item, key: d.key })))
    .join("text")
    .attr("class", "svg-label-light")
    .attr("x", d => x(d[0]) + (x(d[1]) - x(d[0])) / 2)
    .attr("y", d => y(d.data.country) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .text(d => (d[1] - d[0]) >= 12 ? `${d[1] - d[0]}%` : "");
}

// 4. heatmap
function renderHeatmap() {
  const countries = ["Ireland", "Singapore", "Netherlands", "United States", "Germany", "China"];
  const years = ["2020", "2021", "2022", "2023", "2024", "2025"];

  // Share of national electricity demand (%)
  const matrix = [
    { country: "Ireland", year: "2020", val: 11.2 },
    { country: "Ireland", year: "2021", val: 14.0 },
    { country: "Ireland", year: "2022", val: 17.5 },
    { country: "Ireland", year: "2023", val: 20.6 },
    { country: "Ireland", year: "2024", val: 21.8 },
    { country: "Ireland", year: "2025", val: 23.0 },

    { country: "Singapore", year: "2020", val: 6.5 },
    { country: "Singapore", year: "2021", val: 7.0 },
    { country: "Singapore", year: "2022", val: 7.3 },
    { country: "Singapore", year: "2023", val: 7.8 },
    { country: "Singapore", year: "2024", val: 8.2 },
    { country: "Singapore", year: "2025", val: 8.8 },

    { country: "Netherlands", year: "2020", val: 3.1 },
    { country: "Netherlands", year: "2021", val: 3.5 },
    { country: "Netherlands", year: "2022", val: 4.0 },
    { country: "Netherlands", year: "2023", val: 4.6 },
    { country: "Netherlands", year: "2024", val: 5.1 },
    { country: "Netherlands", year: "2025", val: 5.7 },

    { country: "United States", year: "2020", val: 2.3 },
    { country: "United States", year: "2021", val: 2.7 },
    { country: "United States", year: "2022", val: 3.2 },
    { country: "United States", year: "2023", val: 3.8 },
    { country: "United States", year: "2024", val: 4.4 },
    { country: "United States", year: "2025", val: 5.1 },

    { country: "Germany", year: "2020", val: 2.6 },
    { country: "Germany", year: "2021", val: 2.9 },
    { country: "Germany", year: "2022", val: 3.2 },
    { country: "Germany", year: "2023", val: 3.6 },
    { country: "Germany", year: "2024", val: 4.0 },
    { country: "Germany", year: "2025", val: 4.4 },

    { country: "China", year: "2020", val: 0.9 },
    { country: "China", year: "2021", val: 1.0 },
    { country: "China", year: "2022", val: 1.1 },
    { country: "China", year: "2023", val: 1.2 },
    { country: "China", year: "2024", val: 1.3 },
    { country: "China", year: "2025", val: 1.5 }
  ];

  function heatClass(v) {
    if (v < 2) return "heat-cell heat-0";
    if (v < 4) return "heat-cell heat-1";
    if (v < 7) return "heat-cell heat-2";
    if (v < 12) return "heat-cell heat-3";
    if (v < 18) return "heat-cell heat-4";
    return "heat-cell heat-5";
  }

  const container = document.getElementById("chart-heatmap");
  const tooltip = createTooltip(container);

  const width = 760;
  const height = 330;
  const margin = { top: 32, right: 25, bottom: 25, left: 125 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Heatmap of data centre share of national electricity demand from 2020 to 2025");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(years).range([0, innerW]).padding(0.05);
  const y = d3.scaleBand().domain(countries).range([0, innerH]).padding(0.08);

  g.append("g")
    .attr("class", "svg-axis")
    .call(d3.axisTop(x).tickSize(0))
    .select(".domain").remove();

  g.append("g")
    .attr("class", "svg-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove();

  g.selectAll("rect")
    .data(matrix)
    .join("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.country))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 4)
    .attr("class", d => heatClass(d.val))
    .on("mousemove", (event, d) => {
      tooltip
        .classed("visible", true)
        .html(`<strong>${d.country} (${d.year})</strong><br>Data centre share: ${d.val.toFixed(1)}%`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  g.selectAll(".heat-text")
    .data(matrix)
    .join("text")
    .attr("class", d => d.val >= 12 ? "svg-label-light" : "svg-label")
    .attr("x", d => x(d.year) + x.bandwidth() / 2)
    .attr("y", d => y(d.country) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .text(d => d.val.toFixed(1) + "%");
}


// 5. waffle chart
function renderWaffleChart() {
  // 100 cells = 100% of global data centre electricity in 2025 (485 TWh)
  // 32 squares: AI-accelerated servers (~155 TWh)
  // 46 squares: Traditional cloud & enterprise servers (~223 TWh)
  // 22 squares: Cooling, storage & network overhead (~107 TWh)
  const cells = d3.range(100).map(i => {
    let category = "Cooling & infrastructure (22% / ~107 TWh)";
    let cssClass = "waffle-rest";
    if (i < 32) {
      category = "AI-accelerated servers (32% / ~155 TWh)";
      cssClass = "waffle-ai";
    } else if (i < 78) {
      category = "Traditional servers (46% / ~223 TWh)";
      cssClass = "waffle-dc";
    }
    return {
      index: i,
      row: Math.floor(i / 10),
      col: i % 10,
      category,
      cssClass
    };
  });

  const container = document.getElementById("chart-waffle");
  const tooltip = createTooltip(container);

  const width = 760;
  const height = 290;
  const cellSize = 22;
  const gap = 4;
  const offsetX = 40;
  const offsetY = 18;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "10 by 10 waffle chart showing AI workloads at 32 percent of data centre electricity");

  const g = svg.append("g")
    .attr("transform", `translate(${offsetX},${offsetY})`);

  g.selectAll("rect")
    .data(cells)
    .join("rect")
    .attr("x", d => d.col * (cellSize + gap))
    .attr("y", d => d.row * (cellSize + gap))
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("rx", 3)
    .attr("class", d => d.cssClass)
    .on("mousemove", (event, d) => {
      tooltip
        .classed("visible", true)
        .html(`<strong>Square #${d.index + 1} of 100</strong><br>${d.category}`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  // Direct annotation panel on the right side of the waffle grid
  const textX = 10 * (cellSize + gap) + 36;
  const annot = svg.append("g").attr("transform", `translate(${offsetX + textX}, ${offsetY + 24})`);

  annot.append("text")
    .attr("class", "svg-label-bold")
    .attr("y", 0)
    .text("32% AI Share of Data Centre Power (2025)");

  annot.append("text")
    .attr("class", "svg-annotation")
    .attr("y", 24)
    .text("Out of 485 TWh consumed by data centres globally:");

  annot.append("text")
    .attr("class", "svg-annotation")
    .attr("y", 48)
    .text("\u2022 32 squares: AI training & inference (~155 TWh)");

  annot.append("text")
    .attr("class", "svg-annotation")
    .attr("y", 72)
    .text("\u2022 46 squares: Traditional compute & cloud (~223 TWh)");

  annot.append("text")
    .attr("class", "svg-annotation")
    .attr("y", 96)
    .text("\u2022 22 squares: Cooling & power overhead (~107 TWh)");

  annot.append("text")
    .attr("class", "svg-annotation")
    .attr("y", 132)
    .text("By 2030, AI workloads are projected to expand");

  annot.append("text")
    .attr("class", "svg-annotation")
    .attr("y", 152)
    .text("to nearly 45\u201350% of all data centre demand.");
}
// 6.dumbbell dot plot
function renderDumbbellPlot() {
  const data = [
    { country: "Ireland", y2020: 11.2, y2025: 23.0 },
    { country: "Singapore", y2020: 6.5, y2025: 8.8 },
    { country: "Netherlands", y2020: 3.1, y2025: 5.7 },
    { country: "United States", y2020: 2.3, y2025: 5.1 },
    { country: "Germany", y2020: 2.6, y2025: 4.4 },
    { country: "China", y2020: 0.9, y2025: 1.5 }
  ];

  const container = document.getElementById("chart-dumbbell");
  const tooltip = createTooltip(container);

  const width = 760;
  const height = 320;
  const margin = { top: 20, right: 65, bottom: 40, left: 125 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Dumbbell dot plot comparing 2020 and 2025 data centre electricity share by country");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 26]).range([0, innerW]);
  const y = d3.scaleBand().domain(data.map(d => d.country)).range([0, innerH]).padding(0.35);

  g.append("g")
    .attr("class", "svg-grid")
    .call(d3.axisBottom(x).ticks(6).tickSize(innerH).tickFormat(""))
    .select(".domain").remove();

  g.append("g")
    .attr("class", "svg-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain").remove();

  g.append("g")
    .attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + "%"));

  // Connecting lines
  g.selectAll(".dumbbell-line")
    .data(data)
    .join("line")
    .attr("class", "dumbbell-line")
    .attr("x1", d => x(d.y2020))
    .attr("x2", d => x(d.y2025))
    .attr("y1", d => y(d.country) + y.bandwidth() / 2)
    .attr("y2", d => y(d.country) + y.bandwidth() / 2);

  // 2020 start dots
  g.selectAll(".dumbbell-dot-start")
    .data(data)
    .join("circle")
    .attr("class", "dumbbell-dot-start")
    .attr("cx", d => x(d.y2020))
    .attr("cy", d => y(d.country) + y.bandwidth() / 2)
    .attr("r", 7)
    .on("mousemove", (event, d) => {
      tooltip
        .classed("visible", true)
        .html(`<strong>${d.country}</strong><br>2020: ${d.y2020}% &rarr; 2025: ${d.y2025}% (+${(d.y2025 - d.y2020).toFixed(1)} pp)`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  // 2025 end dots
  g.selectAll(".dumbbell-dot-end")
    .data(data)
    .join("circle")
    .attr("class", "dumbbell-dot-end")
    .attr("cx", d => x(d.y2025))
    .attr("cy", d => y(d.country) + y.bandwidth() / 2)
    .attr("r", 7)
    .on("mousemove", (event, d) => {
      tooltip
        .classed("visible", true)
        .html(`<strong>${d.country}</strong><br>2020: ${d.y2020}% &rarr; 2025: ${d.y2025}% (+${(d.y2025 - d.y2020).toFixed(1)} pp)`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  // End value labels
  g.selectAll(".end-label")
    .data(data)
    .join("text")
    .attr("class", "svg-label-bold")
    .attr("x", d => x(d.y2025) + 12)
    .attr("y", d => y(d.country) + y.bandwidth() / 2 + 4)
    .text(d => d.y2025.toFixed(1) + "%");
}

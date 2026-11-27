document.addEventListener("DOMContentLoaded", () => {
  renderLineFanChart();
  renderStackedAreaChart();
  renderBoxplotJitter();
  renderViolinPlot();
  renderBeeswarmPlot();
  renderRidgelinePlot();
});

function createTooltip(container) {
  return d3.select(container)
    .append("div")
    .attr("class", "viz-tooltip");
}

function positionTooltip(tooltip, event, container) {
  const [x, y] = d3.pointer(event, container);
  const bounds = container.getBoundingClientRect();
  const left = Math.min(x + 12, bounds.width - 205);
  tooltip
    .style("left", Math.max(8, left) + "px")
    .style("top", Math.max(8, y - 46) + "px");
}

// 1. line chart with fan projection
function renderLineFanChart() {
  const historical = [
    { year: 2015, val: 200 },
    { year: 2016, val: 205 },
    { year: 2017, val: 212 },
    { year: 2018, val: 222 },
    { year: 2019, val: 235 },
    { year: 2020, val: 255 },
    { year: 2021, val: 285 },
    { year: 2022, val: 325 },
    { year: 2023, val: 365 },
    { year: 2024, val: 415 }
  ];

  const forecast = [
    { year: 2024, base: 415, low: 415, high: 415 },
    { year: 2025, base: 485, low: 465, high: 515 },
    { year: 2026, base: 565, low: 520, high: 635 },
    { year: 2027, base: 650, low: 580, high: 775 },
    { year: 2028, base: 745, low: 640, high: 935 },
    { year: 2029, base: 845, low: 700, high: 1115 },
    { year: 2030, base: 945, low: 760, high: 1310 },
    { year: 2032, base: 1110, low: 840, high: 1620 },
    { year: 2035, base: 1320, low: 920, high: 1980 }
  ];

  const container = document.getElementById("chart-line-fan");
  const tooltip = createTooltip(container);

  const width = 760, height = 350;
  const margin = { top: 24, right: 115, bottom: 42, left: 68 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Line chart with projection fan showing global data centre electricity demand from 2015 to 2035");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([2015, 2035]).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, 2100]).range([innerH, 0]);

  g.append("g").attr("class", "svg-grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""))
    .select(".domain").remove();

  g.append("g").attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")));

  g.append("g").attr("class", "svg-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + " TWh"));

  g.append("line")
    .attr("class", "ref-line-dashed")
    .attr("x1", x(2024)).attr("x2", x(2024))
    .attr("y1", 0).attr("y2", innerH);

  g.append("text")
    .attr("class", "svg-annotation")
    .attr("x", x(2024) + 6)
    .attr("y", 14)
    .text("Projections begin");

  const area = d3.area()
    .x(d => x(d.year))
    .y0(d => y(d.low))
    .y1(d => y(d.high));

  g.append("path")
    .datum(forecast)
    .attr("class", "fan-area")
    .attr("d", area);

  const lineHist = d3.line().x(d => x(d.year)).y(d => y(d.val));
  g.append("path")
    .datum(historical)
    .attr("class", "line-navy")
    .attr("d", lineHist);

  const lineBase = d3.line().x(d => x(d.year)).y(d => y(d.base));
  g.append("path")
    .datum(forecast)
    .attr("class", "line-coral-dashed")
    .attr("d", lineBase);

  const last = forecast[forecast.length - 1];
  g.append("text").attr("class", "svg-annotation").attr("x", x(2035) + 6).attr("y", y(last.high) + 4).text("High: 1,980");
  g.append("text").attr("class", "svg-label-bold").attr("x", x(2035) + 6).attr("y", y(last.base) + 4).text("Base case: 1,320");
  g.append("text").attr("class", "svg-annotation").attr("x", x(2035) + 6).attr("y", y(last.low) + 4).text("Efficiency: 920");

  g.selectAll(".hist-dot")
    .data(historical)
    .join("circle")
    .attr("class", "dot-navy")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.val))
    .attr("r", 4)
    .on("mousemove", (event, d) => {
      tooltip.classed("visible", true).html(`<strong>${d.year} (Actual)</strong><br>Demand: ${d.val} TWh`);
      positionTooltip(tooltip, event, container);   })
    .on("mouseleave", () => tooltip.classed("visible", false));

  g.selectAll(".fc-dot")
    .data(forecast.slice(1))
    .join("circle")
    .attr("class", "dot-coral")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.base))
    .attr("r", 4.5)
    .on("mousemove", (event, d) => {
      tooltip.classed("visible", true)
        .html(`<strong>${d.year} (Projection)</strong><br>Base: ${d.base} TWh<br>Range: ${d.low}&ndash;${d.high} TWh`);
      positionTooltip(tooltip, event, container);  })
    .on("mouseleave", () => tooltip.classed("visible", false));
}

// 2. stacked area chart
function renderStackedAreaChart() {
  const data = [
    { year: 2018, ai: 8, cloud: 62, cooling: 30 },
    { year: 2019, ai: 10, cloud: 61, cooling: 29 },
    { year: 2020, ai: 12, cloud: 60, cooling: 28 },
    { year: 2021, ai: 15, cloud: 58, cooling: 27 },
    { year: 2022, ai: 19, cloud: 55, cooling: 26 },
    { year: 2023, ai: 24, cloud: 52, cooling: 24 },
    { year: 2024, ai: 28, cloud: 49, cooling: 23 },
    { year: 2025, ai: 32, cloud: 46, cooling: 22 },
    { year: 2026, ai: 36, cloud: 43, cooling: 21 },
    { year: 2028, ai: 42, cloud: 39, cooling: 19 },
    { year: 2030, ai: 47, cloud: 35, cooling: 18 }
  ];

  const keys = ["ai", "cloud", "cooling"];
  const classMap = { ai: "area-coral", cloud: "area-navy", cooling: "area-muted" };
  const series = d3.stack().keys(keys)(data);

  const container = document.getElementById("chart-stacked-area");
  const tooltip = createTooltip(container);

  const width = 760, height = 320;
  const margin = { top: 20, right: 125, bottom: 40, left: 55 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "100 percent stacked area chart of data centre electricity share by workload from 2018 to 2030");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([2018, 2030]).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

  const area = d3.area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  g.selectAll(".area-layer")
    .data(series)
    .join("path")
    .attr("class", d => classMap[d.key])
    .attr("d", area);

  g.append("g").attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format("d")));

  g.append("g").attr("class", "svg-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));

  g.append("text").attr("class", "svg-label-bold").attr("x", innerW + 8).attr("y", y(24)).text("AI Servers (47%)");
  g.append("text").attr("class", "svg-label").attr("x", innerW + 8).attr("y", y(65)).text("Cloud & Web (35%)");
  g.append("text").attr("class", "svg-annotation").attr("x", innerW + 8).attr("y", y(91)).text("Cooling (18%)");
/*  for left side
  g.append("text").attr("class", "svg-label-light").attr("x", 8).attr("y", y(4) + 4).text("8%");
  g.append("text").attr("class", "svg-label-light").attr("x", 8).attr("y", y(39)).text("62%");
  g.append("text").attr("class", "svg-label-bold").attr("x", 8).attr("y", y(85)).text("30%");

  for right side
  g.append("text").attr("class", "svg-label-bold").attr("x", innerW + 8).attr("y", y(24)).text("AI Servers: 47%");
  g.append("text").attr("class", "svg-label").attr("x", innerW + 8).attr("y", y(65)).text("Cloud & Web: 35%");
  g.append("text").attr("class", "svg-annotation").attr("x", innerW + 8).attr("y", y(91)).text("Cooling: 18%");
*/ 
  const hoverLine = g.append("line").attr("class", "ref-line-dashed").attr("y1", 0).attr("y2", innerH).attr("opacity", 0);

  svg.on("mousemove", (event) => {
    const [mx] = d3.pointer(event, g.node());
    if (mx < 0 || mx > innerW) {
      hoverLine.attr("opacity", 0);
      tooltip.classed("visible", false);
      return;
    }
    const yr = Math.round(x.invert(mx));
    const closest = data.reduce((a, b) => Math.abs(b.year - yr) < Math.abs(a.year - yr) ? b : a);
    hoverLine.attr("x1", x(closest.year)).attr("x2", x(closest.year)).attr("opacity", 1);
    tooltip.classed("visible", true)
      .html(`<strong>${closest.year}</strong><br>AI Servers: ${closest.ai}%<br>Cloud &amp; Web: ${closest.cloud}%<br>Cooling: ${closest.cooling}%`);
    positionTooltip(tooltip, event, container);
  }).on("mouseleave", () => {
    hoverLine.attr("opacity", 0);
    tooltip.classed("visible", false);
  });
}

// 3. boxplot 
function renderBoxplotJitter() {
  const groups = [
    {
      zone: "Cold Climate (Nordics / Canada)",
      highlight: false,
      values: [0.12, 0.15, 0.18, 0.21, 0.22, 0.24, 0.26, 0.28, 0.30, 0.31, 0.33, 0.35, 0.38, 0.41, 0.44, 0.48, 0.52, 0.58, 0.65, 0.82]
    },
    {
      zone: "Temperate Climate (N. Virginia / UK)",
      highlight: false,
      values: [0.55, 0.62, 0.68, 0.74, 0.80, 0.85, 0.88, 0.92, 0.95, 0.98, 1.02, 1.06, 1.10, 1.15, 1.22, 1.28, 1.35, 1.44, 1.58, 1.75]
    },
    {
      zone: "Hot & Arid (Arizona / Singapore)",
      highlight: true,
      values: [1.15, 1.28, 1.35, 1.42, 1.50, 1.56, 1.62, 1.68, 1.74, 1.80, 1.85, 1.92, 1.98, 2.05, 2.15, 2.25, 2.38, 2.52, 2.75, 2.95]
    }
  ];

  function pseudoJitter(idx) {
    return (((idx * 37) % 19) / 19 - 0.5) * 28;
  }

  const stats = groups.map(g => {
    const sorted = [...g.values].sort(d3.ascending);
    const q1 = d3.quantile(sorted, 0.25);
    const median = d3.quantile(sorted, 0.5);
    const q3 = d3.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const min = Math.max(d3.min(sorted), q1 - 1.5 * iqr);
    const max = Math.min(d3.max(sorted), q3 + 1.5 * iqr);
    return { ...g, sorted, q1, median, q3, min, max };
  });

  const container = document.getElementById("chart-boxplot");
  const tooltip = createTooltip(container);

  const width = 760, height = 340;
  const margin = { top: 24, right: 35, bottom: 58, left: 72 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Boxplot with jittered facility points comparing water usage effectiveness across climate zones");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(stats.map(d => d.zone)).range([0, innerW]).padding(0.42);
  const y = d3.scaleLinear().domain([0, 3.2]).range([innerH, 0]);

  g.append("g").attr("class", "svg-grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""))
    .select(".domain").remove();

  const xAxisG = g.append("g").attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x)); // divide into two line

  xAxisG.selectAll(".tick text").each(function() {
    const text = d3.select(this);
    const parts = text.text().split(" (");
    if (parts.length === 2) {
      text.text(parts[0]);
      text.append("tspan")
        .attr("x", 0)
        .attr("dy", "1.35em")
        .text("(" + parts[1]);
    }
  });

  g.append("g").attr("class", "svg-axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d.toFixed(1) + " L"));

  stats.forEach(d => {
    const cx = x(d.zone) + x.bandwidth() / 2;
    const boxW = Math.min(72, x.bandwidth());

    g.append("line")
      .attr("class", "boxplot-whisker")
      .attr("x1", cx).attr("x2", cx)
      .attr("y1", y(d.min)).attr("y2", y(d.max));

    [d.min, d.max].forEach(capVal => {
      g.append("line")
        .attr("class", "boxplot-whisker")
        .attr("x1", cx - 14).attr("x2", cx + 14)
        .attr("y1", y(capVal)).attr("y2", y(capVal));
    });

    g.append("rect")
      .attr("x", cx - boxW / 2)
      .attr("y", y(d.q3))
      .attr("width", boxW)
      .attr("height", y(d.q1) - y(d.q3))
      .attr("rx", 4)
      .attr("class", d.highlight ? "boxplot-box-coral" : "boxplot-box-navy")
      .on("mousemove", (event) => {
        tooltip.classed("visible", true)
          .html(`<strong>${d.zone}</strong><br>Median: ${d.median.toFixed(2)} L/kWh<br>IQR: ${d.q1.toFixed(2)}&ndash;${d.q3.toFixed(2)} L/kWh`);
        positionTooltip(tooltip, event, container);
      })
      .on("mouseleave", () => tooltip.classed("visible", false));

    g.append("line")
      .attr("class", "boxplot-median")
      .attr("x1", cx - boxW / 2).attr("x2", cx + boxW / 2)
      .attr("y1", y(d.median)).attr("y2", y(d.median));

    g.append("text")
      .attr("class", d.highlight ? "svg-label-bold" : "svg-label")
      .attr("x", cx + boxW / 2 + 8)
      .attr("y", y(d.median) + 4)
      .text("Med: " + d.median.toFixed(2));

  });
}

// 4. violin plot

function renderViolinPlot() {
  const datasets = [
    {
      label: "Hyperscale AI & Cloud Facilities",
      highlight: true,
      values: [1.08, 1.10, 1.11, 1.12, 1.12, 1.13, 1.14, 1.14, 1.15, 1.15, 1.16, 1.16, 1.17, 1.18, 1.19, 1.20, 1.22, 1.25, 1.28, 1.32]
    },
    {
      label: "Traditional Enterprise Data Centres",
      highlight: false,
      values: [1.28, 1.35, 1.40, 1.44, 1.48, 1.50, 1.52, 1.55, 1.56, 1.58, 1.60, 1.62, 1.65, 1.68, 1.72, 1.75, 1.80, 1.85, 1.92, 2.02]
    }
  ];

  function kde(kernel, thresholds, data) {
    return thresholds.map(t => [t, d3.mean(data, d => kernel(t - d))]);
  }
  function epanechnikov(bw) {
    return x => Math.abs(x /= bw) <= 1 ? 0.75 * (1 - x * x) / bw : 0;
  }

  const container = document.getElementById("chart-violin");
  const tooltip = createTooltip(container);

  const width = 760, height = 330;
  const margin = { top: 24, right: 40, bottom: 45, left: 72 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Violin plot comparing PUE efficiency distribution between hyperscale and enterprise data centres");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(datasets.map(d => d.label)).range([0, innerW]).padding(0.35);
  const y = d3.scaleLinear().domain([1.0, 2.15]).range([innerH, 0]);

  g.append("g").attr("class", "svg-grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""))
    .select(".domain").remove();

  g.append("g").attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x));

    g.append("g").attr("class", "svg-axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d.toFixed(2)));

  g.append("text")
    .attr("class", "svg-annotation")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -48)
    .attr("text-anchor", "middle")
    .text("PUE (1.0 = ideal efficiency)");


  const thresholds = y.ticks(35);

  datasets.forEach(d => {
    const density = kde(epanechnikov(0.08), thresholds, d.values);
    const maxDens = d3.max(density, p => p[1]);
    const halfW = x.bandwidth() / 2;
    const xNum = d3.scaleLinear().domain([-maxDens, maxDens]).range([0, x.bandwidth()]);

    const sorted = [...d.values].sort(d3.ascending);
    const q1 = d3.quantile(sorted, 0.25);
    const med = d3.quantile(sorted, 0.5);
    const q3 = d3.quantile(sorted, 0.75);

    const group = g.append("g").attr("transform", `translate(${x(d.label)},0)`);

    const area = d3.area()
      .x0(p => xNum(-p[1]))
      .x1(p => xNum(p[1]))
      .y(p => y(p[0]))
      .curve(d3.curveCatmullRom);

    group.append("path")
      .datum(density)
      .attr("class", d.highlight ? "violin-coral" : "violin-navy")
      .attr("d", area)
      .on("mousemove", (event) => {
        tooltip.classed("visible", true)
          .html(`<strong>${d.label}</strong><br>Median PUE: ${med.toFixed(2)}<br>IQR: ${q1.toFixed(2)}&ndash;${q3.toFixed(2)}`);
        positionTooltip(tooltip, event, container);
      })
      .on("mouseleave", () => tooltip.classed("visible", false));

    group.append("line")
      .attr("class", "violin-spine")
      .attr("x1", halfW).attr("x2", halfW)
      .attr("y1", y(d3.min(sorted))).attr("y2", y(d3.max(sorted)));

    group.append("rect")
      .attr("class", "violin-iqr")
      .attr("x", halfW - 6)
      .attr("y", y(q3))
      .attr("width", 12)
      .attr("height", y(q1) - y(q3))
      .attr("rx", 2);

    group.append("circle")
      .attr("class", "violin-median-dot")
      .attr("cx", halfW)
      .attr("cy", y(med))
      .attr("r", 4);

    group.append("text")
      .attr("class", d.highlight ? "svg-label-bold" : "svg-label")
      .attr("x", halfW + 16)
      .attr("y", y(med) + 4)
      .text("Median: " + med.toFixed(2));
  });
}

// 5. beeswarm plot
function renderBeeswarmPlot() {
  const models = [
    { name: "BERT-Large (2019)", co2: 1.4, featured: false },
    { name: "T5-Base", co2: 4.5, featured: false },
    { name: "RoBERTa", co2: 9.2, featured: false },
    { name: "GPT-2 XL", co2: 14, featured: false },
    { name: "AlphaFold 2", co2: 22, featured: false },
    { name: "Switch Transformer", co2: 35, featured: false },
    { name: "GShard", co2: 48, featured: false },
    { name: "ViT-Huge", co2: 62, featured: false },
    { name: "Megatron-11B", co2: 85, featured: false },
    { name: "Chinchilla (70B)", co2: 120, featured: false },
    { name: "OPT-175B", co2: 145, featured: false },
    { name: "BLOOM (176B)", co2: 165, featured: false },
    { name: "PaLM (540B)", co2: 270, featured: false },
    { name: "LLaMA-1 (65B)", co2: 310, featured: false },
    { name: "Stable Diffusion XL", co2: 380, featured: false },
    { name: "GPT-3 (175B)", co2: 552, featured: true },
    { name: "Falcon-180B", co2: 640, featured: false },
    { name: "Llama 2 (70B)", co2: 710, featured: false },
    { name: "Mistral Large", co2: 890, featured: false },
    { name: "Gopher (280B)", co2: 1050, featured: false },
    { name: "Claude 2", co2: 1350, featured: false },
    { name: "Qwen-72B", co2: 1620, featured: false },
    { name: "Command R+", co2: 1950, featured: false },
    { name: "Grok-1 (314B)", co2: 2400, featured: false },
    { name: "DeepSeek-V3", co2: 2850, featured: false },
    { name: "Llama 3.1 (405B)", co2: 3900, featured: true },
    { name: "Gemini 1.5 Pro", co2: 4600, featured: false },
    { name: "GPT-4", co2: 6900, featured: true },
    { name: "Frontier Reasoning Cluster", co2: 9800, featured: false }
  ];

  const container = document.getElementById("chart-beeswarm");
  const tooltip = createTooltip(container);

  const width = 760, height = 270;
  const margin = { top: 34, right: 35, bottom: 45, left: 35 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Beeswarm plot of training carbon emissions across 29 notable AI models");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLog().domain([1, 15000]).range([0, innerW]);

  g.append("g").attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues([1, 10, 100, 1000, 10000]).tickFormat(d => d.toLocaleString() + " t"));

  const medianVal = d3.median(models, d => d.co2);
  g.append("line")
    .attr("class", "ref-line-dashed")
    .attr("x1", x(medianVal)).attr("x2", x(medianVal))
    .attr("y1", 0).attr("y2", innerH);

  g.append("text")
    .attr("class", "svg-annotation")
    .attr("x", x(medianVal) + 6)
    .attr("y", 10)
    .text(`Median: ${medianVal} tCO2e`);

  const radius = 6.5;
  const placed = [];
  models.forEach(m => {
    const cx = x(m.co2);
    let cy = innerH / 2;
    let step = 0;
    while (placed.some(p => Math.hypot(p.cx - cx, p.cy - cy) < radius * 2.15)) {
      step++;
      const dir = step % 2 === 1 ? 1 : -1;
      cy = innerH / 2 + dir * Math.ceil(step / 2) * (radius * 2.1);
    }
    placed.push({ ...m, cx, cy });
  });

  g.selectAll("circle")
    .data(placed)
    .join("circle")
    .attr("cx", d => d.cx)
    .attr("cy", d => d.cy)
    .attr("r", radius)
    .attr("class", d => d.featured ? "bee-dot-coral" : "bee-dot-navy")
    .on("mousemove", (event, d) => {
      tooltip.classed("visible", true)
        .html(`<strong>${d.name}</strong><br>Est. training footprint: ${d.co2.toLocaleString()} tCO2e`);
      positionTooltip(tooltip, event, container);
    })
    .on("mouseleave", () => tooltip.classed("visible", false));

  placed.filter(d => d.featured).forEach(d => {
    g.append("text")
      .attr("class", "svg-label-bold")
      .attr("x", d.cx)
      .attr("y", d.cy - 12)
      .attr("text-anchor", "middle")
      .text(d.name.split(" (")[0]);
  });
}

// 6. ridgeline plot
function renderRidgelinePlot() {
  const years = [
    { year: "2018", highlight: false, values: [45, 70, 120, 190, 240, 290, 340, 380, 410, 430, 450, 470, 490, 520, 560, 610, 650, 690] },
    { year: "2020", highlight: false, values: [35, 60, 105, 165, 215, 260, 305, 345, 380, 405, 425, 445, 470, 500, 540, 590, 630, 670] },
    { year: "2022", highlight: false, values: [28, 50, 90, 145, 190, 235, 275, 315, 350, 375, 395, 420, 445, 480, 520, 565, 605, 645] },
    { year: "2024", highlight: false, values: [22, 42, 78, 125, 168, 205, 245, 280, 315, 340, 365, 390, 415, 450, 490, 535, 575, 615] },
    { year: "2025", highlight: true,  values: [18, 36, 68, 112, 152, 188, 225, 260, 290, 315, 340, 365, 395, 430, 470, 515, 555, 595] }
  ];

  function kde(kernel, thresholds, data) {
    return thresholds.map(t => [t, d3.mean(data, d => kernel(t - d))]);
  }
  function epanechnikov(bw) {
    return x => Math.abs(x /= bw) <= 1 ? 0.75 * (1 - x * x) / bw : 0;
  }

  const container = document.getElementById("chart-ridgeline");
  const tooltip = createTooltip(container);

  const width = 760, height = 340;
  const margin = { top: 45, right: 35, bottom: 42, left: 75 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", "Ridgeline plot showing the shift in grid carbon intensity distribution across data centre hubs from 2018 to 2025");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 750]).range([0, innerW]);
  const yBand = d3.scaleBand().domain(years.map(d => d.year)).range([0, innerH]).paddingInner(0.15);

  g.append("g").attr("class", "svg-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + " gCO2"));

  g.append("g").attr("class", "svg-axis")
    .call(d3.axisLeft(yBand).tickSize(0))
    .select(".domain").remove();

  const thresholds = x.ticks(45);
  const allDensities = years.map(yr => ({
    ...yr,
    median: d3.median(yr.values),
    density: kde(epanechnikov(75), thresholds, yr.values)
  }));

  const maxDens = d3.max(allDensities, d => d3.max(d.density, p => p[1]));
  const yCurve = d3.scaleLinear().domain([0, maxDens]).range([0, -yBand.bandwidth() * 1.65]);

  allDensities.forEach(yr => {
    const baseline = yBand(yr.year) + yBand.bandwidth();
    const ridgeGroup = g.append("g").attr("transform", `translate(0,${baseline})`);

    const area = d3.area()
      .x(p => x(p[0]))
      .y0(0)
      .y1(p => yCurve(p[1]))
      .curve(d3.curveBasis);

    ridgeGroup.append("path")
      .datum(yr.density)
      .attr("class", yr.highlight ? "ridge-coral" : "ridge-navy")
      .attr("d", area)
      .on("mousemove", (event) => {
        tooltip.classed("visible", true)
          .html(`<strong>${yr.year} Hub Distribution</strong><br>Median intensity: ${Math.round(yr.median)} gCO2/kWh`);
        positionTooltip(tooltip, event, container);
      })
      .on("mouseleave", () => tooltip.classed("visible", false));
  });
}

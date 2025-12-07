# Global AI Research Visualization

An interactive web application for exploring the geographic and temporal distribution of AI research papers worldwide (2010-2025).

**Live Demo on Vercel!**

## Overview

AI research has expanded rapidly over the last decade, but its geographic distribution is uneven and evolving. This visualization helps users understand:

- **Where** AI papers are produced globally
- **How** outputs change over time
- **Which subareas** (CV, NLP, Robotics, RL) dominate in different regions
- **What subfields** are growing within each main research area

The intended audience includes students, researchers, and curious members of the public who want a data-driven overview of global AI development.

## Features

- **Interactive Choropleth Map** — World map colored by paper count or growth rate with hover tooltips
- **Time-Series Panel** — Multi-line chart comparing country trajectories with year indicator
- **Node-Link Graph** — Expandable research field hierarchy showing subfield breakdown with paper counts
- **Animated Year Slider** — Play/pause animation through years with adjustable speed (0.5x-4x)
- **Smart Tooltips** — Tooltips automatically reposition to stay within view bounds
- **Country Selection** — Multiple ways to select/deselect countries (click, double-click, clear button)
- **Linked Interactions** — All views are bidirectionally coordinated

## What's New

### Animation Controls
- **Play/Pause Button** — Animate through years 2010-2025 automatically
- **Speed Control** — Choose from 0.5x, 1x, 2x, or 4x playback speed
- **Year Indicator** — Pink dashed line on time-series shows current year during animation

### Enhanced Node-Link Graph
- **Year-Aware Data** — Subfield counts update as you scrub or animate through years
- **Subfield Paper Counts** — Each subfield node now displays its paper count (e.g., "11K")
- **Total Papers Display** — Shows total papers for selected country and year

### Improved UX
- **Tooltip Overflow Fix** — Tooltips flip position when near map edges
- **Multiple Deselection Methods** — Click empty area, double-click country, or use "Clear all" button
- **Clear Selection Hint** — Visual hint appears when countries are selected

## Quick Start

### Local Development

#### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn

#### Installation

```bash
cd nextjs_app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the visualization.

#### Production Build

```bash
npm run build
npm start
```

## Data Source

Data is sourced from [OpenAlex](https://openalex.org), an open catalog of scholarly works. We filter for AI/ML papers using concept tags:

- **C154945302** — Artificial Intelligence
- **C119857082** — Machine Learning
- **C112194779** — Deep Learning

Papers are aggregated by:
- Country (via author institution)
- Year (2010-2025)
- Subfield (Computer Vision, NLP, Robotics, Reinforcement Learning)

### Subfield Data

The node-link graph now includes detailed subfield breakdowns:

| Main Field | Subfields |
|------------|-----------|
| Computer Vision | Object Detection, Image Segmentation, Face Recognition, Video Analysis, 3D Vision, Medical Imaging |
| NLP | Machine Translation, Sentiment Analysis, Question Answering, Text Generation, Named Entity Recognition, Text Summarization |
| Robotics | Motion Planning, SLAM, Robot Control, Manipulation, Human-Robot Interaction, Swarm Robotics |
| Reinforcement Learning | Deep Learning, Q-Learning, Policy Gradient, Multi-agent Systems, Imitation Learning, Transfer Learning |

### Regenerating Data

To fetch fresh data from OpenAlex:

```bash
cd data_processing

pip install requests pandas tqdm pycountry

python openalex_processor.py
python fetch_real_subfield_data.py --real
```

## Views

### View 1: Global Choropleth Map

- World map colored by AI paper count (log scale) or growth ratio
- Hover for country statistics (papers in year, total papers, growth ratio)
- Click to select a country for detailed analysis
- Click empty area to deselect
- Tooltips automatically reposition near edges
- Legend shows color scale

### View 2: Time-Series Growth Panel

- Multi-line chart showing paper counts over 2010-2025
- Compares up to 5 selected countries
- Pink dashed vertical line indicates current year during animation
- Highlighted circles mark data points at current year
- Click legend or dots to select countries

### View 3: Field-Subfield Node-Link Graph

- Four main AI fields: Computer Vision, NLP, Robotics, Reinforcement Learning
- Node size represents paper count for selected country and year
- **Paper counts displayed inside each node** (main and subfield)
- Click a main field to expand and see subfields
- Click a subfield to filter map and time-series
- Data updates dynamically during year animation

### Controls Panel

- **Year Slider** — Drag to select year (2010-2025)
- **Play/Pause Button** — Animate through years automatically
- **Speed Selector** — 0.5x, 1x, 2x, 4x playback speed
- **View Mode Toggle** — Switch between paper count and growth rate
- **Country Tags** — Click × to remove from comparison
- **Clear All Button** — Reset all selections

## Interactions

| Action | Effect |
|--------|--------|
| Click country on map | Select country, add to comparison, update node-link graph |
| Double-click country | Deselect country |
| Click empty map area | Clear selection |
| Hover country on map | Show tooltip with statistics |
| Drag year slider | Update all views for that year |
| Click Play button | Animate through years 2010-2025 |
| Select speed (0.5x-4x) | Change animation speed |
| Toggle view mode | Switch between paper count and growth rate |
| Click country tag (×) | Remove from comparison |
| Click "Clear all" | Remove all compared countries |
| Click main field node | Expand/collapse subfields |
| Click subfield node | Filter all views by subfield |


## Usage Scenarios

**Scenario A:** A PhD student deciding where to apply for internships wants to know which countries are strongest in robotics and whether those regions are trending upward. They can click Play to watch the animation and see how different countries' robotics research has grown over time.

**Scenario B:** A general reader wants evidence for "AI is becoming more global" — which regions are catching up, and which subfields are driving the change. They can compare multiple countries and explore subfield breakdowns.

**Scenario C:** A researcher wants to understand specialization patterns — why does China lead in Computer Vision while the US excels in NLP? The node-link graph shows subfield distributions that update by year.

## Deployment

This application is deployed on **Vercel** at [https://airesearchcount.vercel.app](https://airesearchcount.vercel.app).

To deploy your own instance:

1. Fork this repository
2. Connect to Vercel
3. Deploy with default Next.js settings

## Team

- **Zifan Zhao** (zz4330) — Data pipeline, cross-view linking, integration
- **Firestone Lappland** (xy2456) — View implementation, UI, styling, Vercel deployment

NYUSH Information Visualization Course • Fall 2025

## License

MIT License

## Acknowledgments

- [OpenAlex](https://openalex.org) for providing open scholarly metadata
- [D3.js](https://d3js.org) for the visualization library
- [Natural Earth](https://www.naturalearthdata.com) for geographic data
- [Vercel](https://vercel.com) for hosting and deployment
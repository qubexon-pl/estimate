# 3-Layer Architecture Estimator

Simple estimator for project implementation effort across:
- Ingestion layer
- Transformation layer
- Gold/Semantic/Power BI layer

## Usage
Open `index.html` in a browser and fill in:
1. Number of sources and ingestion objects.
2. Number + complexity of transformations (or define transformation complexity by named data source).
3. Gold layer objects, semantic complexity, and Power BI reports.
4. Optional calibration rates (hours per artifact), plus documentation and UAT percentages.

Click **Calculate PRG** to compute total PRG hours and a suggested team size.

## Estimation algorithm
Total hours =
- Ingestion hours
- Transformation hours (global values or by named source definitions)
- Gold/BI hours
- + 15% contingency
- + Documentation overhead (%)
- + UAT overhead (%)

The model is intentionally simple and tunable. Improve it by periodically calibrating the 6 base rates against real project actuals.

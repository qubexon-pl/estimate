const getElement = (id) => document.getElementById(id);
const getNum = (id) => Number(getElement(id)?.value) || 0;

const formatNum = (value) => value.toFixed(1);
const setText = (id, value) => {
  const el = getElement(id);
  if (el) el.textContent = formatNum(value);
};
const setValue = (id, value) => {
  const el = getElement(id);
  if (el) el.value = formatNum(value);
};

function complexityOptions(defaultValue = '1') {
  return `
    <option value="1" ${defaultValue === '1' ? 'selected' : ''}>Low (1.0)</option>
    <option value="1.5" ${defaultValue === '1.5' ? 'selected' : ''}>Medium (1.5)</option>
    <option value="2.2" ${defaultValue === '2.2' ? 'selected' : ''}>High (2.2)</option>
  `;
}

function addRow(containerId, templateFn) {
  const container = getElement(containerId);
  if (!container) return;
  const row = document.createElement('div');
  row.className = templateFn.className;
  row.innerHTML = templateFn.html;
  row.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', calculateEstimate));
  const deleteBtn = row.querySelector('.row-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      row.remove();
      calculateEstimate();
    });
  }
  container.appendChild(row);
}

function addIngestionRow(source = '') {
  addRow('ingestionRows', {
    className: 'table-row table-row-with-delete ingestion-row',
    html: `
      <input class="ingestion-source-name" value="${source}" placeholder="source name" />
      <input class="ingestion-object-count" type="number" min="0" value="0" />
      <select class="ingestion-source-complexity">${complexityOptions('1.5')}</select>
      <select class="ingestion-quality-factor">
        <option value="1">Good (1.0)</option>
        <option value="1.2" selected>Average (1.2)</option>
        <option value="1.5">Poor (1.5)</option>
      </select>
      <button class="btn icon-only-btn row-delete-btn" type="button" aria-label="Delete source">🗑</button>
    `,
  });
}

function addTransformRow(source = '') {
  addRow('transformRows', {
    className: 'table-row table-row-with-delete-3 transform-row',
    html: `
      <input class="transform-source-name" value="${source}" placeholder="source name" />
      <input class="transform-count" type="number" min="0" value="0" />
      <select class="transform-complexity">${complexityOptions('1.5')}</select>
      <button class="btn icon-only-btn row-delete-btn" type="button" aria-label="Delete source">🗑</button>
    `,
  });
}

function addDimensionRow() {
  addRow('dimensionRows', {
    className: 'table-row table-row-with-delete-2 dimension-row',
    html: `
      <input class="dimension-count" type="number" min="0" value="0" />
      <select class="dimension-complexity">${complexityOptions('1.5')}</select>
      <button class="btn icon-only-btn row-delete-btn" type="button" aria-label="Delete dimension row">🗑</button>
    `,
  });
}

function addFactRow() {
  addRow('factRows', {
    className: 'table-row table-row-with-delete-2 fact-row',
    html: `
      <input class="fact-count" type="number" min="0" value="0" />
      <select class="fact-complexity">${complexityOptions('1.5')}</select>
      <button class="btn icon-only-btn row-delete-btn" type="button" aria-label="Delete fact row">🗑</button>
    `,
  });
}

function addReportRow() {
  addRow('reportRows', {
    className: 'table-row table-row-with-delete-3 report-row',
    html: `
      <input class="report-count" type="number" min="0" value="0" />
      <input class="report-tabs" type="number" min="1" value="1" />
      <select class="report-complexity">
        <option value="1">Low (1.0)</option>
        <option value="1.5" selected>Medium (1.5)</option>
        <option value="2.3">High (2.3)</option>
      </select>
      <button class="btn icon-only-btn row-delete-btn" type="button" aria-label="Delete report row">🗑</button>
    `,
  });
}

function rowNum(row, selector, fallback = 0) {
  return Number(row.querySelector(selector)?.value) || fallback;
}

function calculateEstimate() {
  const hrsPerSource = getNum('hrsPerSource');
  const hrsPerIngest = getNum('hrsPerIngest');
  const hrsPerTransform = getNum('hrsPerTransform');
  const hrsPerDimension = getNum('hrsPerDimension');
  const hrsPerFact = getNum('hrsPerFact');
  const hrsPerReport = getNum('hrsPerReport');
  const tabImpactPct = getNum('tabImpactPct') / 100;
  const documentationPct = getNum('documentationPct') / 100;
  const uatPct = getNum('uatPct') / 100;

  const ingestionHours = Array.from(document.querySelectorAll('.ingestion-row')).reduce((sum, row) => {
    const objects = rowNum(row, '.ingestion-object-count');
    const sourceComplexity = rowNum(row, '.ingestion-source-complexity', 1);
    const qualityFactor = rowNum(row, '.ingestion-quality-factor', 1);
    return sum + (hrsPerSource + objects * hrsPerIngest) * sourceComplexity * qualityFactor;
  }, 0);

  const transformationHours = Array.from(document.querySelectorAll('.transform-row')).reduce((sum, row) => {
    const transformations = rowNum(row, '.transform-count');
    const complexity = rowNum(row, '.transform-complexity', 1);
    return sum + transformations * hrsPerTransform * complexity;
  }, 0);

  const dimensionHours = Array.from(document.querySelectorAll('.dimension-row')).reduce((sum, row) => {
    const count = rowNum(row, '.dimension-count');
    const complexity = rowNum(row, '.dimension-complexity', 1);
    return sum + count * hrsPerDimension * complexity;
  }, 0);

  const factHours = Array.from(document.querySelectorAll('.fact-row')).reduce((sum, row) => {
    const count = rowNum(row, '.fact-count');
    const complexity = rowNum(row, '.fact-complexity', 1);
    return sum + count * hrsPerFact * complexity;
  }, 0);

  const reportHours = Array.from(document.querySelectorAll('.report-row')).reduce((sum, row) => {
    const count = rowNum(row, '.report-count');
    const tabs = Math.max(1, rowNum(row, '.report-tabs', 1));
    const complexity = rowNum(row, '.report-complexity', 1);
    const tabMultiplier = 1 + Math.max(0, tabs - 1) * tabImpactPct;
    return sum + count * hrsPerReport * complexity * tabMultiplier;
  }, 0);

  const goldHours = dimensionHours + factHours + reportHours;
  const baseHours = ingestionHours + transformationHours + goldHours;
  const contingencyHours = baseHours * 0.15;
  const documentationHours = baseHours * documentationPct;
  const uatHours = baseHours * uatPct;
  const totalHours = baseHours + contingencyHours + documentationHours + uatHours;

  setText('ingestionHours', ingestionHours);
  setText('transformationHours', transformationHours);
  setText('dimensionHours', dimensionHours);
  setText('factHours', factHours);
  setText('goldHours', goldHours);
  setText('baseHours', baseHours);
  setText('contingencyHours', contingencyHours);
  setText('documentationHours', documentationHours);
  setText('uatHours', uatHours);
  setText('totalHours', totalHours);
  setValue('prgHours', totalHours);

  const weeks = Math.max(1, getNum('deliveryWeeks'));
  setText('teamSize', totalHours / (weeks * 30));
}

function buildJsonPayload() {
  return {
    calibration: {
      hrsPerSource: getNum('hrsPerSource'),
      hrsPerIngest: getNum('hrsPerIngest'),
      hrsPerTransform: getNum('hrsPerTransform'),
      hrsPerDimension: getNum('hrsPerDimension'),
      hrsPerFact: getNum('hrsPerFact'),
      hrsPerReport: getNum('hrsPerReport'),
      tabImpactPct: getNum('tabImpactPct'),
      documentationPct: getNum('documentationPct'),
      uatPct: getNum('uatPct'),
    },
    ingestion: {
      sources: Array.from(document.querySelectorAll('.ingestion-row')).map((row) => ({
        name: row.querySelector('.ingestion-source-name')?.value || '',
        objects: rowNum(row, '.ingestion-object-count'),
        sourceComplexity: rowNum(row, '.ingestion-source-complexity', 1.5),
        qualityFactor: rowNum(row, '.ingestion-quality-factor', 1.2),
      })),
    },
    transformation: {
      sources: Array.from(document.querySelectorAll('.transform-row')).map((row) => ({
        name: row.querySelector('.transform-source-name')?.value || '',
        transformations: rowNum(row, '.transform-count'),
        complexity: rowNum(row, '.transform-complexity', 1.5),
      })),
    },
    gold: {
      dimensions: Array.from(document.querySelectorAll('.dimension-row')).map((row) => ({
        count: rowNum(row, '.dimension-count'),
        complexity: rowNum(row, '.dimension-complexity', 1.5),
      })),
      facts: Array.from(document.querySelectorAll('.fact-row')).map((row) => ({
        count: rowNum(row, '.fact-count'),
        complexity: rowNum(row, '.fact-complexity', 1.5),
      })),
      reports: Array.from(document.querySelectorAll('.report-row')).map((row) => ({
        count: rowNum(row, '.report-count'),
        tabs: rowNum(row, '.report-tabs', 1),
        complexity: rowNum(row, '.report-complexity', 1.5),
      })),
    },
    assumptions: {
      ingestion: getElement('ingestionAssumptions')?.value || '',
      transformation: getElement('transformAssumptions')?.value || '',
      gold: getElement('goldAssumptions')?.value || '',
    },
  };
}

function exportJson() {
  const payload = buildJsonPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'estimation-export.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  getElement('uploadStatus').textContent = 'Exported estimation JSON successfully.';
}

function applyJsonToForm(payload) {
  const ingestionRows = Array.isArray(payload.ingestion?.sources) ? payload.ingestion.sources : [];
  const transformRows = Array.isArray(payload.transformation?.sources) ? payload.transformation.sources : [];
  const dimensionRows = Array.isArray(payload.gold?.dimensions) ? payload.gold.dimensions : [];
  const factRows = Array.isArray(payload.gold?.facts) ? payload.gold.facts : [];
  const reportRows = Array.isArray(payload.gold?.reports) ? payload.gold.reports : [];

  getElement('ingestionRows').innerHTML = '';
  getElement('transformRows').innerHTML = '';
  getElement('dimensionRows').innerHTML = '';
  getElement('factRows').innerHTML = '';
  getElement('reportRows').innerHTML = '';

  ingestionRows.forEach((row) => {
    addIngestionRow(row.name || '');
    const current = document.querySelector('#ingestionRows .ingestion-row:last-child');
    if (!current) return;
    current.querySelector('.ingestion-object-count').value = row.objects || 0;
    current.querySelector('.ingestion-source-complexity').value = String(row.sourceComplexity || 1.5);
    current.querySelector('.ingestion-quality-factor').value = String(row.qualityFactor || 1.2);
  });

  transformRows.forEach((row) => {
    addTransformRow(row.name || '');
    const current = document.querySelector('#transformRows .transform-row:last-child');
    if (!current) return;
    current.querySelector('.transform-count').value = row.transformations || 0;
    current.querySelector('.transform-complexity').value = String(row.complexity || 1.5);
  });

  dimensionRows.forEach((row) => {
    addDimensionRow();
    const current = document.querySelector('#dimensionRows .dimension-row:last-child');
    if (!current) return;
    current.querySelector('.dimension-count').value = row.count || 0;
    current.querySelector('.dimension-complexity').value = String(row.complexity || 1.5);
  });

  factRows.forEach((row) => {
    addFactRow();
    const current = document.querySelector('#factRows .fact-row:last-child');
    if (!current) return;
    current.querySelector('.fact-count').value = row.count || 0;
    current.querySelector('.fact-complexity').value = String(row.complexity || 1.5);
  });

  reportRows.forEach((row) => {
    addReportRow();
    const current = document.querySelector('#reportRows .report-row:last-child');
    if (!current) return;
    current.querySelector('.report-count').value = row.count || 0;
    current.querySelector('.report-tabs').value = row.tabs || 1;
    current.querySelector('.report-complexity').value = String(row.complexity || 1.5);
  });

  if (payload.calibration) {
    const calibrationFields = [
      'hrsPerSource',
      'hrsPerIngest',
      'hrsPerTransform',
      'hrsPerDimension',
      'hrsPerFact',
      'hrsPerReport',
      'tabImpactPct',
      'documentationPct',
      'uatPct',
    ];
    calibrationFields.forEach((field) => {
      if (payload.calibration[field] !== undefined) {
        getElement(field).value = payload.calibration[field];
      }
    });
  }

  getElement('ingestionAssumptions').value = payload.assumptions?.ingestion || '';
  getElement('transformAssumptions').value = payload.assumptions?.transformation || '';
  getElement('goldAssumptions').value = payload.assumptions?.gold || '';

  const rowsLoaded = ingestionRows.length + transformRows.length + dimensionRows.length + factRows.length + reportRows.length;
  getElement('uploadStatus').textContent = `Loaded JSON successfully. Added ${rowsLoaded} row(s).`;
  calculateEstimate();
}

function handleJsonUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  getElement('uploadStatus').textContent = 'Reading JSON file...';

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      applyJsonToForm(payload);
    } catch (error) {
      getElement('uploadStatus').textContent = `Unable to read JSON: ${error.message}`;
    }
  };
  reader.readAsText(file);
}

function initEstimator() {
  getElement('addIngestionBtn').addEventListener('click', () => {
    addIngestionRow();
    calculateEstimate();
  });

  getElement('addTransformBtn').addEventListener('click', () => {
    addTransformRow();
    calculateEstimate();
  });

  getElement('addDimensionBtn').addEventListener('click', () => {
    addDimensionRow();
    calculateEstimate();
  });

  getElement('addFactBtn').addEventListener('click', () => {
    addFactRow();
    calculateEstimate();
  });

  getElement('addReportBtn').addEventListener('click', () => {
    addReportRow();
    calculateEstimate();
  });

  getElement('jsonUpload').addEventListener('change', handleJsonUpload);
  getElement('exportJsonBtn').addEventListener('click', exportJson);

  document.querySelectorAll('input,select,textarea').forEach((el) => {
    if (el.id !== 'jsonUpload') {
      el.addEventListener('input', calculateEstimate);
    }
  });

  addIngestionRow('Source A');
  addTransformRow('Source A');
  addDimensionRow();
  addFactRow();
  addReportRow();
  calculateEstimate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEstimator);
} else {
  initEstimator();
}

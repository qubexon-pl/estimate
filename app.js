const getElement = (id) => document.getElementById(id);
const getNum = (id) => Number(getElement(id)?.value) || 0;
const setText = (id, value) => {
  const target = getElement(id);
  if (target) {
    target.textContent = value.toFixed(1);
  }
};
const setValue = (id, value) => {
  const target = getElement(id);
  if (target) {
    target.value = value.toFixed(1);
  }
};

const FIELD_ALIASES = {
  dataSources: ['dataSources', 'ingestion.dataSources'],
  ingestObjects: ['ingestObjects', 'objectsToIngest', 'ingestion.objects', 'ingestion.ingestObjects'],
  sourceComplexity: ['sourceComplexity', 'ingestion.sourceComplexity'],
  qualityFactor: ['qualityFactor', 'ingestion.qualityFactor'],
  transformCount: ['transformCount', 'transformations', 'transformation.count'],
  transformComplexity: ['transformComplexity', 'transformation.complexity'],
  reuseFactor: ['reuseFactor', 'transformation.reuseFactor'],
  dimensionCount: ['dimensionCount', 'gold.dimensionCount', 'gold.dimensions'],
  factCount: ['factCount', 'gold.factCount', 'gold.facts'],
  semanticComplexity: ['semanticComplexity', 'gold.semanticComplexity'],
  reportCount: ['reportCount', 'gold.reportCount', 'powerBI.reportCount'],
  reportComplexity: ['reportComplexity', 'gold.reportComplexity', 'powerBI.reportComplexity'],
  hrsPerSource: ['hrsPerSource', 'calibration.hrsPerSource'],
  hrsPerIngest: ['hrsPerIngest', 'calibration.hrsPerIngest'],
  hrsPerTransform: ['hrsPerTransform', 'calibration.hrsPerTransform'],
  hrsPerDimension: ['hrsPerDimension', 'calibration.hrsPerDimension'],
  hrsPerFact: ['hrsPerFact', 'calibration.hrsPerFact'],
  hrsPerReport: ['hrsPerReport', 'calibration.hrsPerReport'],
  documentationPct: ['documentationPct', 'calibration.documentationPct'],
  uatPct: ['uatPct', 'calibration.uatPct'],
  deliveryWeeks: ['deliveryWeeks', 'planning.deliveryWeeks'],
  assumptions: ['assumptions', 'notes', 'project.assumptions'],
};

let sourceRowId = 0;

function addSourceRow(name = '', transformCount = 0, complexity = '1.4') {
  sourceRowId += 1;
  const row = document.createElement('div');
  row.className = 'source-item border rounded p-3 bg-light';
  row.dataset.rowId = String(sourceRowId);

  const normalizedComplexity = normalizeComplexity(complexity, '1.4');

  row.innerHTML = `
    <div class="row g-3 align-items-end">
      <div class="col-md-4">
        <label class="form-label mb-1">Data source name</label>
        <input type="text" class="form-control source-name" placeholder="e.g. SAP" value="${name}" />
      </div>
      <div class="col-md-3">
        <label class="form-label mb-1">Transformations for this source</label>
        <input type="number" class="form-control source-transform-count" min="0" value="${Number(transformCount) || 0}" />
      </div>
      <div class="col-md-3">
        <label class="form-label mb-1">Transformation complexity</label>
        <select class="form-select source-complexity">
          <option value="1" ${normalizedComplexity === '1' ? 'selected' : ''}>Low</option>
          <option value="1.4" ${normalizedComplexity === '1.4' ? 'selected' : ''}>Medium</option>
          <option value="2" ${normalizedComplexity === '2' ? 'selected' : ''}>High</option>
        </select>
      </div>
      <div class="col-md-2 d-grid">
        <button type="button" class="btn btn-outline-secondary remove-source-btn">Remove source</button>
      </div>
    </div>
  `;

  row.querySelector('.remove-source-btn')?.addEventListener('click', () => {
    row.remove();
    calculateEstimate();
  });

  row.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', calculateEstimate);
  });

  getElement('dataSourceTransforms')?.appendChild(row);
}

function normalizeComplexity(value, defaultValue) {
  if (value == null) return defaultValue;
  const asText = String(value).trim().toLowerCase();
  if (asText === 'low') return '1';
  if (asText === 'medium') return defaultValue;
  if (asText === 'high') return defaultValue === '1.5' ? '2.3' : '2';
  if (!Number.isNaN(Number(asText))) return String(Number(asText));
  return defaultValue;
}

function getByPath(source, path) {
  return path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), source);
}

function getFirstValue(source, paths) {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function applyJsonToForm(payload) {
  let appliedFields = 0;

  Object.entries(FIELD_ALIASES).forEach(([fieldId, paths]) => {
    const value = getFirstValue(payload, paths);
    if (value === undefined) return;

    const input = getElement(fieldId);
    if (!input) return;

    if (input.tagName === 'SELECT') {
      const normalized = normalizeComplexity(value, input.value);
      const optionExists = Array.from(input.options).some((option) => option.value === normalized);
      if (optionExists) {
        input.value = normalized;
        appliedFields += 1;
      }
      return;
    }

    input.value = value;
    appliedFields += 1;
  });

  const sourceRowsContainer = getElement('dataSourceTransforms');
  const sourceRows =
    getFirstValue(payload, [
      'dataSourceTransforms',
      'transformationByDataSource',
      'transformation.sources',
      'dataSourcesDetails',
      'sources',
    ]) || [];

  if (sourceRowsContainer && Array.isArray(sourceRows)) {
    sourceRowsContainer.innerHTML = '';
    sourceRows.forEach((source) => {
      addSourceRow(
        source.name || source.sourceName || '',
        source.transformCount || source.transformations || 0,
        source.complexity || source.transformComplexity || '1.4',
      );
    });
  }

  calculateEstimate();
  const status = getElement('uploadStatus');
  if (status) {
    status.textContent = `Loaded JSON successfully. Updated ${appliedFields} field(s) and ${sourceRows.length} data source row(s).`;
  }
}

function handleJsonUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const status = getElement('uploadStatus');
  if (status) status.textContent = 'Reading JSON file...';

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      applyJsonToForm(payload);
    } catch (error) {
      if (status) status.textContent = `Unable to read JSON: ${error.message}`;
    }
  };
  reader.readAsText(file);
}

function getSourceTransformationHours(hrsPerTransform, reuseFactor) {
  const rows = Array.from(document.querySelectorAll('.source-item'));
  if (rows.length === 0) return null;

  return rows.reduce((total, row) => {
    const count = Number(row.querySelector('.source-transform-count')?.value) || 0;
    const complexity = Number(row.querySelector('.source-complexity')?.value) || 1;
    return total + count * hrsPerTransform * complexity * reuseFactor;
  }, 0);
}

function calculateEstimate() {
  const dataSources = getNum('dataSources');
  const ingestObjects = getNum('ingestObjects');
  const sourceComplexity = getNum('sourceComplexity');
  const qualityFactor = getNum('qualityFactor');

  const transformCount = getNum('transformCount');
  const transformComplexity = getNum('transformComplexity');
  const reuseFactor = getNum('reuseFactor');

  const dimensionCount = getNum('dimensionCount');
  const factCount = getNum('factCount');
  const semanticComplexity = getNum('semanticComplexity');
  const reportCount = getNum('reportCount');
  const reportComplexity = getNum('reportComplexity');

  const hrsPerSource = getNum('hrsPerSource');
  const hrsPerIngest = getNum('hrsPerIngest');
  const hrsPerTransform = getNum('hrsPerTransform');
  const hrsPerDimension = getNum('hrsPerDimension');
  const hrsPerFact = getNum('hrsPerFact');
  const hrsPerReport = getNum('hrsPerReport');
  const documentationPct = getNum('documentationPct') / 100;
  const uatPct = getNum('uatPct') / 100;

  const ingestionHours =
    (dataSources * hrsPerSource + ingestObjects * hrsPerIngest) * sourceComplexity * qualityFactor;

  const sourceTransformationHours = getSourceTransformationHours(hrsPerTransform, reuseFactor);
  const transformationHours =
    sourceTransformationHours ?? transformCount * hrsPerTransform * transformComplexity * reuseFactor;

  const goldHours =
    (dimensionCount * hrsPerDimension + factCount * hrsPerFact) * semanticComplexity +
    reportCount * hrsPerReport * reportComplexity;

  const baseHours = ingestionHours + transformationHours + goldHours;
  const contingencyHours = baseHours * 0.15;
  const documentationHours = baseHours * documentationPct;
  const uatHours = baseHours * uatPct;
  const totalHours = baseHours + contingencyHours + documentationHours + uatHours;

  setText('ingestionHours', ingestionHours);
  setText('transformationHours', transformationHours);
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

function initEstimator() {
  const requiredIds = ['deliveryWeeks', 'addDataSourceBtn', 'jsonUpload'];
  if (requiredIds.some((id) => !getElement(id))) {
    return;
  }

  getElement('deliveryWeeks').addEventListener('input', calculateEstimate);
  getElement('addDataSourceBtn').addEventListener('click', () => {
    addSourceRow();
    calculateEstimate();
  });
  getElement('jsonUpload').addEventListener('change', handleJsonUpload);

  document.querySelectorAll('input, select, textarea').forEach((el) => {
    if (el.id !== 'deliveryWeeks' && el.id !== 'jsonUpload') {
      el.addEventListener('input', calculateEstimate);
    }
  });

  calculateEstimate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEstimator);
} else {
  initEstimator();
}

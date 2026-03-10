const getNum = (id) => Number(document.getElementById(id).value) || 0;
const setText = (id, value) => {
  document.getElementById(id).textContent = value.toFixed(1);
};
const setValue = (id, value) => {
  document.getElementById(id).value = value.toFixed(1);
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
  row.className = 'source-item';
  row.dataset.rowId = String(sourceRowId);

  const normalizedComplexity = normalizeComplexity(complexity, '1.4');

  row.innerHTML = `
    <div class="grid two">
      <label>
        Data source name
        <input type="text" class="source-name" placeholder="e.g. SAP" value="${name}" />
      </label>
      <label>
        Transformations for this source
        <input type="number" class="source-transform-count" min="0" value="${Number(transformCount) || 0}" />
      </label>
      <label>
        Transformation complexity
        <select class="source-complexity">
          <option value="1" ${normalizedComplexity === '1' ? 'selected' : ''}>Low</option>
          <option value="1.4" ${normalizedComplexity === '1.4' ? 'selected' : ''}>Medium</option>
          <option value="2" ${normalizedComplexity === '2' ? 'selected' : ''}>High</option>
        </select>
      </label>
      <button type="button" class="secondary remove-source-btn">Remove source</button>
    </div>
  `;

  row.querySelector('.remove-source-btn').addEventListener('click', () => {
    row.remove();
    calculateEstimate();
  });

  row.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', calculateEstimate);
  });

  document.getElementById('dataSourceTransforms').appendChild(row);
}

function normalizeComplexity(value, defaultValue) {
  if (value == null) {
    return defaultValue;
  }

  const asText = String(value).trim().toLowerCase();
  if (asText === 'low') return '1';
  if (asText === 'medium') return defaultValue;
  if (asText === 'high') return defaultValue === '1.5' ? '2.3' : '2';
  if (!Number.isNaN(Number(asText))) {
    return String(Number(asText));
  }
  return defaultValue;
}

function getByPath(source, path) {
  return path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), source);
}

function getFirstValue(source, paths) {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function applyJsonToForm(payload) {
  let appliedFields = 0;

  Object.entries(FIELD_ALIASES).forEach(([fieldId, paths]) => {
    const value = getFirstValue(payload, paths);
    if (value === undefined) {
      return;
    }

    const input = document.getElementById(fieldId);
    if (!input) {
      return;
    }

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

  const sourceRowsContainer = document.getElementById('dataSourceTransforms');
  const sourceRows =
    getFirstValue(payload, [
      'dataSourceTransforms',
      'transformationByDataSource',
      'transformation.sources',
      'dataSourcesDetails',
      'sources',
    ]) || [];

  if (Array.isArray(sourceRows)) {
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
  const status = document.getElementById('uploadStatus');
  status.textContent = `Loaded JSON successfully. Updated ${appliedFields} field(s) and ${sourceRows.length} data source row(s).`;
}

function handleJsonUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const status = document.getElementById('uploadStatus');
  status.textContent = 'Reading JSON file...';

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      applyJsonToForm(payload);
    } catch (error) {
      status.textContent = `Unable to read JSON: ${error.message}`;
    }
  };
  reader.readAsText(file);
}

function getSourceTransformationHours(hrsPerTransform, reuseFactor) {
  const rows = Array.from(document.querySelectorAll('.source-item'));
  if (rows.length === 0) {
    return null;
  }

  return rows.reduce((total, row) => {
    const count = Number(row.querySelector('.source-transform-count').value) || 0;
    const complexity = Number(row.querySelector('.source-complexity').value) || 1;
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
  const teamSize = totalHours / (weeks * 30);
  setText('teamSize', teamSize);
}

document.getElementById('deliveryWeeks').addEventListener('input', calculateEstimate);
document.getElementById('addDataSourceBtn').addEventListener('click', () => {
  addSourceRow();
  calculateEstimate();
});
document.getElementById('jsonUpload').addEventListener('change', handleJsonUpload);

document.querySelectorAll('input, select, textarea').forEach((el) => {
  if (el.id !== 'deliveryWeeks' && el.id !== 'jsonUpload') {
    el.addEventListener('input', calculateEstimate);
  }
});

calculateEstimate();

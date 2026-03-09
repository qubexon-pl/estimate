const getNum = (id) => Number(document.getElementById(id).value) || 0;
const setText = (id, value) => {
  document.getElementById(id).textContent = value.toFixed(1);
};
const setValue = (id, value) => {
  document.getElementById(id).value = value.toFixed(1);
};

let sourceRowId = 0;

function addSourceRow(name = '', transformCount = 0, complexity = '1.4') {
  sourceRowId += 1;
  const row = document.createElement('div');
  row.className = 'source-item';
  row.dataset.rowId = String(sourceRowId);
  row.innerHTML = `
    <div class="grid two">
      <label>
        Data source name
        <input type="text" class="source-name" placeholder="e.g. SAP" value="${name}" />
      </label>
      <label>
        Transformations for this source
        <input type="number" class="source-transform-count" min="0" value="${transformCount}" />
      </label>
      <label>
        Transformation complexity
        <select class="source-complexity">
          <option value="1" ${complexity === '1' ? 'selected' : ''}>Low</option>
          <option value="1.4" ${complexity === '1.4' ? 'selected' : ''}>Medium</option>
          <option value="2" ${complexity === '2' ? 'selected' : ''}>High</option>
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

document.getElementById('calculateBtn').addEventListener('click', calculateEstimate);
document.getElementById('deliveryWeeks').addEventListener('input', calculateEstimate);
document.getElementById('addDataSourceBtn').addEventListener('click', () => {
  addSourceRow();
  calculateEstimate();
});

document.querySelectorAll('input, select').forEach((el) => {
  if (el.id !== 'deliveryWeeks') {
    el.addEventListener('input', calculateEstimate);
  }
});

calculateEstimate();

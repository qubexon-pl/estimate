const getNum = (id) => Number(document.getElementById(id).value) || 0;
const setText = (id, value) => {
  document.getElementById(id).textContent = value.toFixed(1);
};
const setValue = (id, value) => {
  document.getElementById(id).value = value.toFixed(1);
};

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

  const ingestionHours =
    (dataSources * hrsPerSource + ingestObjects * hrsPerIngest) * sourceComplexity * qualityFactor;

  const transformationHours =
    transformCount * hrsPerTransform * transformComplexity * reuseFactor;

  const goldHours =
    (dimensionCount * hrsPerDimension + factCount * hrsPerFact) * semanticComplexity +
    reportCount * hrsPerReport * reportComplexity;

  const baseHours = ingestionHours + transformationHours + goldHours;
  const contingencyHours = baseHours * 0.15;
  const totalHours = baseHours + contingencyHours;

  setText('ingestionHours', ingestionHours);
  setText('transformationHours', transformationHours);
  setText('goldHours', goldHours);
  setText('baseHours', baseHours);
  setText('contingencyHours', contingencyHours);
  setText('totalHours', totalHours);

  setValue('prgHours', totalHours);

  const weeks = Math.max(1, getNum('deliveryWeeks'));
  const teamSize = totalHours / (weeks * 30);
  setText('teamSize', teamSize);
}

document.getElementById('calculateBtn').addEventListener('click', calculateEstimate);
document.getElementById('deliveryWeeks').addEventListener('input', calculateEstimate);

calculateEstimate();

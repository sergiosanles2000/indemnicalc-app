
// IndemniCalc - Labor Law & Severance Calculation Engine (Estatuto de los Trabajadores 2026)
document.addEventListener('DOMContentLoaded', () => {
  const salaryTypeSelect = document.getElementById('salaryType');
  const salaryAmountInput = document.getElementById('salaryAmount');
  const paysCountSelect = document.getElementById('paysCount');
  const yearsWorkedInput = document.getElementById('yearsWorked');
  const monthsWorkedInput = document.getElementById('monthsWorked');
  const dismissalTypeSelect = document.getElementById('dismissalType');
  const contractStartDateInput = document.getElementById('contractStartDate');

  // Finiquito items
  const vacationDaysInput = document.getElementById('vacationDays');
  const pendingMonthDaysInput = document.getElementById('pendingMonthDays');

  // Result Elements
  const resTotalCompensation = document.getElementById('resTotalCompensation');
  const resSeverancePay = document.getElementById('resSeverancePay');
  const resFiniquitoTotal = document.getElementById('resFiniquitoTotal');
  const resDailySalary = document.getElementById('resDailySalary');
  const resDaysCompensated = document.getElementById('resDaysCompensated');
  const resTaxExemptInfo = document.getElementById('resTaxExemptInfo');

  function formatEur(val) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(val);
  }

  function calculateSeverance() {
    const sType = salaryTypeSelect.value;
    const sAmount = parseFloat(salaryAmountInput.value) || 0;
    const pays = parseInt(paysCountSelect.value) || 12;
    const years = parseInt(yearsWorkedInput.value) || 0;
    const months = parseInt(monthsWorkedInput.value) || 0;
    const dType = dismissalTypeSelect.value;

    if (sAmount <= 0) return;

    // 1. Calculate Daily Salary (Salario Diario Oficial)
    // Daily salary = Salario Bruto Anual / 365 días (o 360 según convenio)
    let annualGross = 0;
    if (sType === 'annual') {
      annualGross = sAmount;
    } else {
      // Monthly gross (if 14 pays, monthly base is adjusted)
      annualGross = sAmount * pays;
    }
    const dailySalary = annualGross / 365;

    // Total tenure in months (prorated by full months)
    const totalTenureMonths = (years * 12) + months;
    const totalTenureYears = totalTenureMonths / 12;

    // 2. Severance Pay Calculation according to Spanish Labor Law (Estatuto de los Trabajadores)
    let daysPerYear = 0;
    let maxMonthlyCaps = 0; // Months of salary cap

    if (dType === 'improcedente_post2012') {
      // Despido Improcedente (contratos posteriores a 12/02/2012)
      // 33 días por año trabajado, prorrateándose por meses los períodos inferiores a un año, máx. 24 mensualidades (720 días)
      daysPerYear = 33;
      maxMonthlyCaps = 24;
    } else if (dType === 'improcedente_pre2012') {
      // Simplificado: ponderación mixta 45/33 días, máx. 42 mensualidades
      daysPerYear = 40; // Promedio representativo si tiene tramo anterior a 2012
      maxMonthlyCaps = 42;
    } else if (dType === 'objetivo') {
      // Despido Objetivo (causas económicas, técnicas, organizativas o de producción art. 52 y 53 ET)
      // 20 días por año trabajado, prorrateándose por meses, máx. 12 mensualidades (360 días)
      daysPerYear = 20;
      maxMonthlyCaps = 12;
    } else if (dType === 'temporal') {
      // Fin de contrato temporal (art. 49.1.c ET)
      // 12 días por año trabajado, sin tope específico de mensualidades
      daysPerYear = 12;
      maxMonthlyCaps = 12;
    } else if (dType === 'dimision') {
      // Baja voluntaria / Dimisión: No genera indemnización por despido
      daysPerYear = 0;
      maxMonthlyCaps = 0;
    }

    // Days and Amount entitled to compensation (Estatuto de los Trabajadores & Tribunal Supremo)
    const compensatedDaysCalculated = (totalTenureMonths / 12) * daysPerYear;
    const monthlySalary = annualGross / 12;
    const maxLegalCapAmount = maxMonthlyCaps * monthlySalary;
    const rawSeverance = compensatedDaysCalculated * dailySalary;
    const severancePay = maxMonthlyCaps > 0 ? Math.min(rawSeverance, maxLegalCapAmount) : 0;
    const finalCompensatedDays = dailySalary > 0 ? (severancePay / dailySalary) : 0;

    // 3. Finiquito Calculation (Settlement for pending accrued amounts)
    const vacationDays = parseFloat(vacationDaysInput.value) || 0;
    const pendingMonthDays = parseFloat(pendingMonthDaysInput.value) || 0;

    const vacationAmount = vacationDays * dailySalary;
    const pendingMonthAmount = pendingMonthDays * dailySalary;
    // Prorated bonus estimate
    const proratedBonusAmount = (pays === 14) ? ((annualGross - (sAmount * 12)) / 365) * 30 : 0;

    const totalFiniquito = vacationAmount + pendingMonthAmount + proratedBonusAmount;
    const totalLiquidacion = severancePay + totalFiniquito;

    // Render results
    resTotalCompensation.textContent = formatEur(totalLiquidacion);
    resSeverancePay.textContent = formatEur(severancePay);
    resFiniquitoTotal.textContent = formatEur(totalFiniquito);
    resDailySalary.textContent = formatEur(dailySalary);
    resDaysCompensated.textContent = `${finalCompensatedDays.toFixed(1)} días`;

    if (dType === 'dimision') {
      resTaxExemptInfo.textContent = 'En baja voluntaria no hay indemnización; solo se abona finiquito.';
    } else if (severancePay <= 180000) {
      resTaxExemptInfo.textContent = 'Indemnización 100% EXENTA de IRPF (inferior al límite de 180.000 €). El finiquito tributa como salario habitual.';
    } else {
      const taxableExcess = severancePay - 180000;
      resTaxExemptInfo.textContent = `Atención: ${formatEur(180000)} exentos. El exceso de ${formatEur(taxableExcess)} tributará en IRPF.`;
    }

    if (window.enterpriseTrack) {
      window.enterpriseTrack('severance_calculated', { dismissalType: dType, totalCompensation: totalLiquidacion });
    }
  }

  // Event Listeners
  [salaryTypeSelect, salaryAmountInput, paysCountSelect, yearsWorkedInput, monthsWorkedInput, dismissalTypeSelect, vacationDaysInput, pendingMonthDaysInput].forEach(el => {
    el.addEventListener('input', calculateSeverance);
  });

  calculateSeverance();
});

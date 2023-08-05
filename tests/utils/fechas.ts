const formatDate = (inputDate: Date) => {

  const date = inputDate.getDate();
  const month = inputDate.getMonth() + 1;
  const year = inputDate.getFullYear();

  return `${date
    .toString()
    .padStart(2, '0')}/${month
      .toString()
      .padStart(2, '0')}/${year}`;
}

// Dia Actual
const diaActual = new Date();

// Primer dia del mes actual
const primerDiaMes = formatDate(new Date(diaActual.getFullYear(), diaActual.getMonth(), 1));

// Dia anterior al dia actual
const diaAnterior = formatDate(new Date(diaActual.setDate(diaActual.getDate() - 1)));

// Dia siguiente al dia actual
const diaSiguiente = formatDate(new Date(diaActual.setDate(diaActual.getDate() - 1)));

// Mismo dia pero dos meses despues
const dosMesDespues = formatDate(new Date(diaActual.setMonth(diaActual.getMonth() + 2)));

export {
  formatDate,
  primerDiaMes,
  diaAnterior,
  diaSiguiente,
  dosMesDespues
}
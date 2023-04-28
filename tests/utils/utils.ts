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

// Primer dia del mes actual
const diaActual = new Date();
const primerDiaMes = formatDate(new Date(diaActual.getFullYear(), diaActual.getMonth(), 1));

export {
  formatDate,
  primerDiaMes
}
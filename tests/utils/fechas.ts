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

  // Variables con los dias sin formato
  let diaAnteriorNoFormato = new Date();
  let diaSiguienteNoFormato = new Date();
  
  // Primer dia del mes actual
  const primerDiaMes = formatDate(new Date(diaActual.getFullYear(), diaActual.getMonth(), 1));
  console.log(primerDiaMes)

  // Mismo dia pero dos meses despues
  const dosMesDespues = formatDate(new Date(diaActual.setMonth(diaActual.getMonth() + 2)));
  console.log(dosMesDespues);

  // Dia anterior al dia actual
  diaAnteriorNoFormato = new Date(diaAnteriorNoFormato.setDate(diaAnteriorNoFormato.getDate() - 1));
  const diaAnterior = formatDate(diaAnteriorNoFormato);

  // Dia siguiente al dia actual
  diaSiguienteNoFormato = new Date(diaSiguienteNoFormato.setDate(diaSiguienteNoFormato.getDate() + 1));
  const diaSiguiente= formatDate(diaSiguienteNoFormato);
  
  export {
    formatDate,
    primerDiaMes,
    diaAnterior,
    diaSiguiente,
    dosMesDespues
  }
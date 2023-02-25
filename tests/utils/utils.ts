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

export {
  formatDate,
}
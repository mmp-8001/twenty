export const formatTehranTime = (iso: string) =>
  new Date(iso).toLocaleString('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'short',
    timeStyle: 'short',
  });

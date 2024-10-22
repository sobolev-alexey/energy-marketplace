export const convertAmount = amount => {
  if (amount < Math.pow(10, 3)) {
    const num = amount;
    if (num % 1 !== 0) return [num.toFixed(2), 'Iota'];
    return [num, 'Iota'];
  } else if (amount < Math.pow(10, 6)) {
    const num = amount / Math.pow(10, 3);
    if (num % 1 !== 0) return [num.toFixed(2), 'Ki'];
    return [num, 'Ki'];
  } else if (amount < Math.pow(10, 9)) {
    const num = amount / Math.pow(10, 6);
    if (num % 1 !== 0) return [num.toFixed(2), 'Mi'];
    return [num, 'Mi'];
  } else if (amount < Math.pow(10, 12)) {
    const num = amount / Math.pow(10, 9);
    if (num % 1 !== 0) return [num.toFixed(2), 'Gi'];
    return [num, 'Gi'];
  } else if (amount < Math.pow(10, 15)) {
    const num = amount / Math.pow(10, 12);
    if (num % 1 !== 0) return [num.toFixed(2), 'Ti'];
    return [num, 'Ti'];
  }
};
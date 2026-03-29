import { format, formatDistanceToNow, differenceInYears, isValid } from 'date-fns';

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'N/A';
  return format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'N/A';
  return format(d, 'MMM d, yyyy h:mm a');
};

export const formatRelative = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return 'N/A';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const calculateAge = (dob: Date | string | null | undefined): number => {
  if (!dob) return 0;
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  if (!isValid(d)) return 0;
  return differenceInYears(new Date(), d);
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatNumber = (num: number, decimals = 0): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const truncate = (str: string, maxLen: number): string => {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
};

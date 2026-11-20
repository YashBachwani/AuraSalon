export function formatTime24To12(timeStr = '09:00') {
  const [rawH, rawM] = String(timeStr).split(':');
  const hours = Number(rawH);
  const minutes = Number(rawM);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatInr(amount) {
  const numeric = Number(amount || 0);
  return `₹${numeric.toLocaleString('en-IN')}`;
}

export function maskCustomerName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function getInitials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function maskPhone(phone = '') {
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length < 10) return phone;
  return `${cleaned.slice(0, 2)}******${cleaned.slice(8)}`;
}

export function formatTime12(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

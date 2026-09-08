export function fail(status, code, message) { throw Object.assign(new Error(message), { status, code }); }
export function requireValue(ok, message, status = 400, code = 'INVALID_INPUT') { if (!ok) fail(status, code, message); }
export function record(data, collection, id) {
  const item = data[collection].find(item => item.id === id);
  requireValue(item, `${collection} record not found.`, 404, 'NOT_FOUND');
  return item;
}
export function bodyFields(body, allowed) {
  requireValue(body && typeof body === 'object' && !Array.isArray(body), 'JSON object required.');
  requireValue(Object.keys(body).every(key => allowed.includes(key)), 'Unknown field.');
}
export function text(value, max = 1000) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }

export const todayKey = () => new Date().toISOString().slice(0, 10);
export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function validateCheckIn(date, input, today = todayKey()) {
    if (!validDate(date) || date > today) throw new Error('Choose today or a past date.');
    if (!['measured', 'reused', 'skipped'].includes(input?.status)) throw new Error('Choose how you want to check in.');
    if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > 280)) throw new Error('Keep your note under 280 characters.');
    const entry = { date, status: input.status, weightKg: null, sourceDate: null, note: (input.note || '').trim() };
    if (input.status === 'measured') {
        if (typeof input.weightKg !== 'number' || !Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 500) throw new Error('Enter a weight between 20 and 500 kg.');
        entry.weightKg = Math.round(input.weightKg * 10) / 10;
    }
    return entry;
}
export const WEIGH_IN_FREQUENCIES = ['daily', 'weekly', 'when_ready', 'off'];

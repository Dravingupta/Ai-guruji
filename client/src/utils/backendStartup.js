// Retry only safe reads while a sleeping backend starts. Never replay writes or AI calls.
const aborted = () => new DOMException('Request cancelled', 'AbortError');
const timeout = () => new DOMException('The fitness service did not respond in time', 'TimeoutError');

function attemptRead(request, parentSignal, timeoutMs) {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
        let timer;
        const finish = (complete, value) => {
            clearTimeout(timer);
            parentSignal?.removeEventListener('abort', cancel);
            controller.signal.removeEventListener('abort', fail);
            complete(value);
        };
        const cancel = () => controller.abort(aborted());
        const fail = () => finish(reject, controller.signal.reason);
        controller.signal.addEventListener('abort', fail, { once: true });
        parentSignal?.addEventListener('abort', cancel, { once: true });
        if (parentSignal?.aborted) { cancel(); return; }
        timer = setTimeout(() => controller.abort(timeout()), timeoutMs);
        Promise.resolve().then(() => {
            if (controller.signal.aborted) throw controller.signal.reason;
            return request({ signal: controller.signal, timeout: timeoutMs });
        }).then(value => finish(resolve, value), error => finish(reject, error));
    });
}

function pause(ms, signal) {
    return new Promise((resolve, reject) => {
        const cancel = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); reject(aborted()); };
        const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, ms);
        signal?.addEventListener('abort', cancel, { once: true });
        if (signal?.aborted) cancel();
    });
}

export function isTransientStartupError(error) {
    const status = error.response?.status;
    return error.name === 'TimeoutError' || error.retryable === true ||
        (!status && error.name !== 'AbortError') || status === 408 || status >= 500;
}

export async function retryStartupRead(request, {
    signal, totalTimeoutMs = 120_000, requestTimeoutMs = 15_000, retryDelayMs = 2_500
} = {}) {
    const deadline = Date.now() + totalTimeoutMs;
    let lastError = timeout();
    while (Date.now() < deadline) {
        if (signal?.aborted) throw aborted();
        try {
            return await attemptRead(request, signal, Math.min(requestTimeoutMs, deadline - Date.now()));
        } catch (error) {
            if (signal?.aborted || error.name === 'AbortError') throw aborted();
            if (!isTransientStartupError(error)) throw error;
            lastError = error;
        }
        const remaining = deadline - Date.now();
        if (remaining > 0) await pause(Math.min(retryDelayMs, remaining), signal);
    }
    if (signal?.aborted) throw aborted();
    throw lastError;
}

export async function loadStartupProfile(request, uid, options) {
    return retryStartupRead(async config => {
        let profile;
        try { profile = await request(config); }
        catch (error) {
            // An arbitrary 404/HTML proxy page is not evidence of a new account.
            if (error.response?.status === 404 && error.response.data?.error === 'Profile not found') return null;
            throw error;
        }
        if (!profile || typeof profile !== 'object' || profile.uid !== uid) {
            const error = new Error('Invalid profile response');
            error.retryable = true;
            throw error;
        }
        return profile;
    }, options);
}

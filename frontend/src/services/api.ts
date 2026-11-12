/** Cliente HTTP único do LookLoop.
 * No desenvolvimento o Vite encaminha /api para o Express (mesma origem e cookies HttpOnly).
 */
const prefix = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = 'ApiError'; }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${prefix}${path}`, {
      ...init,
      credentials: 'include',
      headers: { ...(isForm ? {} : init.body != null ? {'Content-Type': 'application/json'} : {}), ...init.headers },
    });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique se o backend está em execução na porta 3001.', 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error || `Não foi possível concluir a operação (${response.status}).`, response.status);
  return data as T;
}

export const json = (value: unknown) => JSON.stringify(value);

export type ImageResult = { imageId: string; imageUrl: string; isProcessed: boolean };
export async function sendImage(file: File, removeBackground = false): Promise<ImageResult> {
  const form = new FormData();
  form.append('file', file);
  return api<ImageResult>(removeBackground ? '/api/images/remove-background' : '/api/images/upload', {
    method: 'POST', body: form,
  });
}

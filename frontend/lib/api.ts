// Cliente HTTP centralizado.
//
// - credentials: "include" para que viajen las cookies httpOnly del JWT.
// - Lanza ApiError con { status, code, detail } para que los componentes
//   reaccionen. En el navegador, ante 401 redirige a /login (la autenticación
//   se verifica SIEMPRE en el backend; esto es solo UX).

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export interface ApiError extends Error {
  status: number;
  code?: string;
  detail?: unknown;
}

function makeError(status: number, body: any): ApiError {
  // El backend devuelve { detail: "..." } o { detail: { detail, ... } }.
  const d = body?.detail;
  let code: string | undefined;
  let message: string;
  if (typeof d === "string") {
    code = d;
    message = d;
  } else if (d && typeof d === "object") {
    code = d.detail;
    message = d.detail || JSON.stringify(d);
  } else {
    message = body ? JSON.stringify(body) : "error_desconocido";
  }
  const err = new Error(message) as ApiError;
  err.status = status;
  err.code = code;
  err.detail = d;
  return err;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  console.log(`[api] ${options.method || "GET"} ${url}`);
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // 204 o vacío
  if (res.status === 204) return undefined as T;

  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { detail: text };
    }
  }

  if (!res.ok) {
    console.error(`[api] ERROR ${res.status} ${url}`, body);
    const err = makeError(res.status, body);
    // UX: 401 -> login. La seguridad real la decide el backend en cada llamada.
    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw err;
  }
  console.log(`[api] OK ${res.status} ${url}`);

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

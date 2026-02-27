const NIMBUS_URL = process.env.NIMBUS_API_URL || "http://127.0.0.1:18785";
const NIMBUS_TOKEN = process.env.NIMBUS_API_TOKEN || "oc-nimbus-2026";

export async function nimbusFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${NIMBUS_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${NIMBUS_TOKEN}`,
      ...options.headers,
    },
  });
}

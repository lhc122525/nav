export type OpenAPI3 = {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{ url: string; description?: string }>
  paths: Record<
    string,
    Record<
      string,
      {
        summary?: string
        description?: string
        parameters?: unknown[]
        requestBody?: unknown
        responses: Record<string, unknown>
      }
    >
  >
}


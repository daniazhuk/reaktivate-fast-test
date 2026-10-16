// Typed env variables; `vite/client` types are included through tsconfig.json.
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_API_USER?: string;
}

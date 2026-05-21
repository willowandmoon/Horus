declare module "*.json" {
  const value: Record<string, unknown> | unknown[] | string | number | boolean | null;
  export default value;
}

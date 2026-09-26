declare module "morgan-json" {
  function morganJSON(format: Record<string, string> | string): string;
  export default morganJSON;
}

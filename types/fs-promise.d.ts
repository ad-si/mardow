declare module "fs-promise" {
  import { Stats } from "fs"

  export function readFile(_path: string, _encoding: string): Promise<string>
  export function statSync(_path: string): Stats
  export { Stats }
}

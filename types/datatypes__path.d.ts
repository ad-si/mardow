declare module "@datatypes/path" {
  class Path {
    static fromString(_path: string): Path
    toString(): string
  }
  export default Path
}

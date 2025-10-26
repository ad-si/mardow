import { readFile } from "fs-promise"
import Path from "@datatypes/path"

interface PathLike {
  toString(): string
}

export default function replaceIncludes (
  filePath: PathLike | string | undefined,
): Promise<string> | undefined {
  const mdIncludeRegex = /!\[.+\]\(.+\.md\)/gi
  let expandedMarkdown = ""

  if (!filePath) return

  return readFile(String(filePath), "utf8")
    .then((fileContent: string) => {
      expandedMarkdown = fileContent

      return Array.from(
        // Remove duplicate entries
        new Set(fileContent.match(mdIncludeRegex)),
      )
    })
    .then((matches: (string | null)[]) => matches
      .map((matchedString: string | null) => {
        if (!matchedString) return Promise.resolve()

        const fileNameMatch = matchedString.match(/\((.+)\)$/i)
        if (!fileNameMatch || !fileNameMatch[1]) return Promise.resolve()

        const newFilePath = Path.fromString(
          `${filePath}/../${fileNameMatch[1]}`,
        )

        return replaceIncludes(newFilePath)
          ?.then((expandedContent?: string) => {
            if (expandedContent) {
              expandedMarkdown = expandedMarkdown
                .replace(matchedString, expandedContent)
            }
          })
      }),
    )
    .then((includePromises: (Promise<void> | undefined)[]) =>
      Promise.all(includePromises.filter(Boolean)),
    )
    .then(() => expandedMarkdown)
}

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { options } from './mergeDocuments'

// TODO: ↓↓ this really needs to be a three way merge if we want to properly
// reuse styles from the output document. We'll make it a preference, for people
// who want to publish both the source, output and theme documents.
export function mergeStyles(
  sourceStyles:
    | FileFormat.SharedStyleContainer
    | FileFormat.SharedTextStyleContainer,
  themeStyles:
    | FileFormat.SharedStyleContainer
    | FileFormat.SharedTextStyleContainer,
  type
) {
  let combinedStyles = {
    _class: type,
    objects: [],
  }
  // First, we'll start with the styles from the source document
  combinedStyles.objects = sourceStyles.objects

  // Then we'll add the styles from the theme document
  themeStyles.objects.forEach((themeStyle: FileFormat.SharedStyle) => {
    const matchingStyle = combinedStyles.objects.find(
      (combinedStyle: FileFormat.SharedStyle) => {
        return combinedStyle.name === themeStyle.name
      }
    )
    // If the style is already in the source document, we'll replace it...
    if (matchingStyle) {
      if (options.reuseStyleID) {
        const originalStyle =
          combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)]
        const originalID = originalStyle.do_objectID
        // We want to use the same ID as the original style
        themeStyle.do_objectID = originalID
      }
      combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)] =
        themeStyle
    } else {
      // ...otherwise we'll add it to the collection
      combinedStyles.objects.push(themeStyle)
    }
  })
  return combinedStyles
}

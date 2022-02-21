import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { options } from './mergeDocuments'

export function mergeLayerStyles(
  sourceStyles: FileFormat.SharedStyleContainer,
  themeStyles: FileFormat.SharedStyleContainer
): FileFormat.SharedStyleContainer {
  let combinedStyles: FileFormat.SharedStyleContainer = {
    _class: 'sharedStyleContainer',
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
      // TODO: use the implementation from mergeTextStyles
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

import FileFormat from '@sketch-hq/sketch-file-format-ts'

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
      const originalStyle =
        combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)]
      // We want to use the same ID as the original style
      themeStyle.do_objectID = originalStyle.do_objectID
      combinedStyles.objects[combinedStyles.objects.indexOf(matchingStyle)] =
        themeStyle
    } else {
      // ...otherwise we'll add it to the collection
      combinedStyles.objects.push(themeStyle)
    }
  })
  return combinedStyles
}

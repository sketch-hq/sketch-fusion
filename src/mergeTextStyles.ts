import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { allLayers, allTextLayers } from './allLayers'

export function mergeTextStyles(
  sourceFile: SketchFile,
  themeFile: SketchFile
): FileFormat.SharedTextStyleContainer {
  const sourceStyles = sourceFile.contents.document.layerTextStyles
  const themeStyles = themeFile.contents.document.layerTextStyles

  let combinedStyles: FileFormat.SharedTextStyleContainer = {
    _class: 'sharedTextStyleContainer',
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
    if (!matchingStyle) {
      // If the style doesn't exist in the source document, add it and call it a day
      combinedStyles.objects.push(themeStyle)
    } else {
      // If the style does exist in the source document, we have a lot of work to do
      const index = combinedStyles.objects.indexOf(matchingStyle)
      combinedStyles.objects[index] = themeStyle
      // We now need to update the text layers that use this style,
      // but we'll do this in a second pass later on in the process.
      const textUsingStyle = layersUsingStyle(
        matchingStyle.do_objectID,
        sourceFile
      )
      textUsingStyle.forEach((textLayer) => {
        textLayer.userInfo = {
          ...textLayer.userInfo,
          previousTextStyle: {
            id: matchingStyle.do_objectID,
            name: matchingStyle.name,
          },
        }
      })
    }
  })
  return combinedStyles
}

function layersUsingStyle(id: string, document: SketchFile): FileFormat.Text[] {
  const all = allLayers(document)
  return all.filter((layer) => {
    return layer._class === 'text' && layer.sharedStyleID === id
  })
}

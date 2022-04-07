import { SketchFile } from '@sketch-hq/sketch-file'
import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { allLayers, allTextLayers } from './allLayers'

export function mergeTextStyles(
  sourceFile: SketchFile,
  themeFile: SketchFile
): FileFormat.SharedTextStyleContainer {
  // The JSON transformation is a bit of a hack to copy the objects without reference
  const sourceStyles = JSON.parse(
    JSON.stringify(sourceFile.contents.document.layerTextStyles)
  )
  const themeStyles = JSON.parse(
    JSON.stringify(themeFile.contents.document.layerTextStyles)
  )

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
      // If the style does exist in the source document, replace it.
      // We'll keep a reference to the original style id on the name, so we can use it later
      themeStyle.name += '💠💠💠💠💠💠' + matchingStyle.do_objectID
      const index = combinedStyles.objects.indexOf(matchingStyle)
      combinedStyles.objects[index] = themeStyle
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

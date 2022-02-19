import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function matchingLayerStyle(
  id: string,
  styles: FileFormat.SharedStyle[]
): FileFormat.SharedStyle {
  const matchingStyle = styles.find((style) => {
    return style.do_objectID === id
  })
  return matchingStyle
}

import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function colorsAreEqual(
  colorOne: FileFormat.Color,
  colorTwo: FileFormat.Color
): boolean {
  return (
    colorOne.alpha === colorTwo.alpha &&
    colorOne.red === colorTwo.red &&
    colorOne.green === colorTwo.green &&
    colorOne.blue === colorTwo.blue
  )
}

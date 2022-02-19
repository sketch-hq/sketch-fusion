import FileFormat from '@sketch-hq/sketch-file-format-ts'

export function matchingSwatchForColorInSwatches(
  color: FileFormat.Color,
  swatches: FileFormat.SwatchContainer
): FileFormat.Swatch {
  // console.log(`Looking for a matching swatch for ${color}`)
  return swatches.objects.find((swatch) => {
    // console.log(JSON.stringify(swatch))
    //return colorsAreEqual(swatch.value, color)
    return swatch.do_objectID === color.swatchID
  })
}

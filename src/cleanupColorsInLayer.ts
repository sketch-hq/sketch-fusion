import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { matchingSwatchForColorInSwatches } from './matchingSwatchForColorInSwatches'
import { colorsAreEqual } from './colorsAreEqual'

export function cleanupColorsInLayer(
  layer: any,
  swatches: FileFormat.SwatchContainer
) {
  if (
    layer._class == 'artboard' ||
    layer._class == 'symbolMaster' ||
    layer._class == 'group'
  ) {
    layer.layers.forEach((sublayer) => {
      sublayer = cleanupColorsInLayer(sublayer, swatches)
    })
  }
  // - Update fills & tints
  // TODO: not sure this is taking care of gradient fills...
  layer.style?.fills?.forEach((fill: FileFormat.Fill) => {
    if (fill.color.swatchID !== undefined) {
      // console.log(`Found a layer with a swatch fill: ${fill.color.swatchID}`)
      const matchingSwatch = matchingSwatchForColorInSwatches(
        fill.color,
        swatches
      )
      if (matchingSwatch && !colorsAreEqual(fill.color, matchingSwatch.value)) {
        fill.color = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update borders
  layer.style?.borders?.forEach((border: FileFormat.Border) => {
    if (border.color.swatchID !== undefined) {
      const matchingSwatch = matchingSwatchForColorInSwatches(
        border.color,
        swatches
      )
      if (
        matchingSwatch &&
        !colorsAreEqual(border.color, matchingSwatch.value)
      ) {
        // console.log(`Found a matching swatch for ${layer.name}'s border`)
        border.color = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update shadows
  layer.style?.shadows?.forEach((shadow: FileFormat.Shadow) => {
    if (shadow.color.swatchID !== undefined) {
      const matchingSwatch = matchingSwatchForColorInSwatches(
        shadow.color,
        swatches
      )
      if (
        matchingSwatch &&
        !colorsAreEqual(shadow.color, matchingSwatch.value)
      ) {
        shadow.color = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update innerShadows
  layer.style?.innerShadows?.forEach((shadow: FileFormat.InnerShadow) => {
    if (shadow.color.swatchID !== undefined) {
      const matchingSwatch = matchingSwatchForColorInSwatches(
        shadow.color,
        swatches
      )
      if (
        matchingSwatch &&
        !colorsAreEqual(shadow.color, matchingSwatch.value)
      ) {
        shadow.color = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update text colors
  layer.attributedString?.attributes?.forEach((attribute) => {
    const color = attribute.attributes.MSAttributedStringColorAttribute
    if (color && color.swatchID !== undefined) {
      const matchingSwatch = matchingSwatchForColorInSwatches(color, swatches)
      if (matchingSwatch && !colorsAreEqual(color, matchingSwatch.value)) {
        attribute.attributes.MSAttributedStringColorAttribute = {
          ...matchingSwatch.value,
          swatchID: matchingSwatch.do_objectID,
        }
      }
    }
  })

  // - Update Artboard and Slice backgrounds
  if (
    (layer._class === 'slice' || layer._class === 'artboard') &&
    layer.hasBackgroundColor
  ) {
    const backgroundColor = layer.backgroundColor
    const matchingSwatch = matchingSwatchForColorInSwatches(
      backgroundColor,
      swatches
    )
    if (matchingSwatch) {
      layer.backgroundColor = {
        ...matchingSwatch.value,
        swatchID: matchingSwatch.do_objectID,
      }
    }
  }

  return layer
}

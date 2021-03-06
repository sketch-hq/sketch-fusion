import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { matchingSwatchForColorInSwatches } from './matchingSwatchForColorInSwatches'
import { colorsAreEqual } from './colorsAreEqual'

export function cleanupColorsInLayer(
  layer: any,
  swatches: FileFormat.SwatchContainer
) {
  // console.log(`\n\nCleaning up colors in layer ${layer.name}`)

  if (
    layer._class == 'artboard' ||
    layer._class == 'symbolMaster' ||
    layer._class == 'group'
  ) {
    layer.layers.forEach((sublayer) => {
      sublayer = cleanupColorsInLayer(sublayer, swatches)
    })
  }

  // 1. Update fills & tints
  // console.log(`\t1. Fills and tints`)
  layer.style?.fills?.forEach((fill: FileFormat.Fill) => {
    switch (fill.fillType) {
      case 0:
        // Color
        // console.log(`\t\tFill is a color`)
        if (fill.color.swatchID !== undefined) {
          const matchingSwatch = matchingSwatchForColorInSwatches(
            fill.color,
            swatches
          )
          if (
            matchingSwatch &&
            !colorsAreEqual(fill.color, matchingSwatch.value)
          ) {
            fill.color = {
              ...matchingSwatch.value,
              swatchID: matchingSwatch.do_objectID,
            }
          }
        }
        break
      case 1:
        // Gradient
        // console.log(`\t\tFill is a gradient, skipping`)
        // TODO: implement gradient fill cleanup
        break
      case 4:
        // Pattern
        // console.log(`\t\tFill is a pattern, skipping`)
        // TODO: implement pattern fill cleanup
        break
      default:
        // console.log(`\t\tUnknown fill type: ${fill.fillType}`)
        break
    }
  })

  // 2. Update borders
  // console.log(`\t2. Borders`)
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

  // 3. Update shadows
  // console.log(`\t3. Shadows`)
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

  // 4. Update innerShadows
  // console.log(`\t4. Inner Shadows`)
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

  // 5. Update text colors
  // console.log(`\t5. Text Colors`)
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

  // 6. Update Artboard and Slice backgrounds
  // console.log(`\t6. Artboard & Slice Background`)
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
  } else {
    // console.log(`\t\tNo background color found`)
  }

  return layer
}

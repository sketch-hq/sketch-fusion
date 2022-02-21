export function injectDynamicData(layer: any, data: object) {
  if (
    layer._class == 'artboard' ||
    layer._class == 'symbolMaster' ||
    layer._class == 'group'
  ) {
    layer.layers.forEach((sublayer) => {
      sublayer = injectDynamicData(sublayer, data)
    })
  }
  if (layer._class === 'text') {
    let text = layer.attributedString.string
    Object.keys(data).forEach((key) => {
      const match = `{{${key}}}`
      const replacement = text.replace(match, data[key])
      if (text.includes(match)) {
        layer.attributedString.string = replacement
        // TODO: ↓↓ This only works for text layers with a single style
        layer.attributedString.attributes[0].length =
          layer.attributedString.string.length
        text = replacement
      }
    })
    // Special keywords: {{date}} and {{time}}
    if (text.includes('{{date}}')) {
      layer.attributedString.string = text.replace(
        '{{date}}',
        new Date().toDateString()
      )
      // TODO: ↓↓ this looks like it could be extracted into a function
      layer.attributedString.attributes[0].length =
        layer.attributedString.string.length
    }
  }
  // TODO: ↓↓ adjust layer size based on text size. Not sure how we can do this from the file format... Maybe mark the layer as needing a resize somehow?
  return layer
}

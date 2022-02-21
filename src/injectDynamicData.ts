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
      // console.log(JSON.stringify(layer)) // let's see what's here...
      // layer.frame = {} // This crashes Sketch 😬
      /**
       * {"_class":"text","do_objectID":"D8D66684-659C-496B-95F0-3BE156354E35","booleanOperation":-1,"isFixedToViewport":false,"isFlippedHorizontal":false,"isFlippedVertical":false,"isLocked":false,"isVisible":true,"layerListExpandedType":0,"name":"Dynamic data: {{date","nameIsFixed":false,"resizingConstraint":47,"resizingType":0,"rotation":0,"shouldBreakMaskChain":false,"exportOptions":{"_class":"exportOptions","includedLayerIds":[],"layerOptions":0,"shouldTrim":false,"exportFormats":[]},"frame":{"_class":"rect","constrainProportions":false,"height":37,"width":322,"x":142,"y":309},"clippingMaskMode":0,"hasClippingMask":false,"style":{"_class":"style","do_objectID":"D630F931-674F-49EF-A372-7E3BE5AB3DF8","endMarkerType":0,"miterLimit":10,"startMarkerType":0,"windingRule":1,"blur":{"_class":"blur","isEnabled":false,"center":"{0.5, 0.5}","motionAngle":0,"radius":10,"saturation":1,"type":0},"borderOptions":{"_class":"borderOptions","isEnabled":true,"dashPattern":[],"lineCapStyle":0,"lineJoinStyle":0},"borders":[],"colorControls":{"_class":"colorControls","isEnabled":false,"brightness":0,"contrast":1,"hue":0,"saturation":1},"contextSettings":{"_class":"graphicsContextSettings","blendMode":0,"opacity":1},"fills":[],"innerShadows":[],"shadows":[],"textStyle":{"_class":"textStyle","encodedAttributes":{"MSAttributedStringFontAttribute":{"_class":"fontDescriptor","attributes":{"name":"HelveticaNeue","size":32}},"paragraphStyle":{"_class":"paragraphStyle","alignment":0},"MSAttributedStringColorAttribute":{"_class":"color","alpha":1,"blue":0.2,"green":0.2,"red":0.2},"textStyleVerticalAlignmentKey":0,"kerning":0},"verticalAlignment":0}},"attributedString":{"_class":"attributedString","string":"Dynamic data: Tue Feb 15 2022","attributes":[{"_class":"stringAttribute","location":0,"length":29,"attributes":{"MSAttributedStringFontAttribute":{"_class":"fontDescriptor","attributes":{"name":"HelveticaNeue","size":32}},"MSAttributedStringColorAttribute":{"_class":"color","alpha":1,"blue":0.2,"green":0.2,"red":0.2},"kerning":0,"textStyleVerticalAlignmentKey":0,"paragraphStyle":{"_class":"paragraphStyle","alignment":0}}}]},"automaticallyDrawOnUnderlyingPath":false,"dontSynchroniseWithSymbol":false,"glyphBounds":"{{2, 6}, {318, 31}}","lineSpacingBehaviour":3,"textBehaviour":0}
       */
    }
  }
  // TODO: ↓↓ adjust layer size based on text size. Not sure how we can do this from the file format... Maybe mark the layer as needing a resize somehow?
  return layer
}

`favicons.svg` is an Inkscape file used to create most of the favicons in this folder. It should also be usable in any other vector graphics software. It's a template, not supposed to be directly displayed anywhere in wiki.

Every favicon is stored in a separate layer. This allows to export all favicons at once in Inkscape: 

1. Go to Export > Batch Export > Layers.
2. Select layers/favicons you want to export.
3. Select "Export Selected Only"
4. Choose PNG without suffix (exported files will be named after the layers).
5. Change DPI to batch export at different resolution (the default 96 DPI will export at 128x128, 144 DPI would export at 192x192 and so on). If changing the DPI is undesired, the favicons can be single-exported (hide all layers but one, Export > Single Image) at specified DPI and resolution.
6. Specify only export path without file name prefix (exported files will be named after the layers).
7. Export.

The colours used in the favicons are saved as swatches, named after the favicon using the colour.

If the icons were to be used as SVG, the individual layers should be separately exported and then cleaned up from Inkscape's metadata.
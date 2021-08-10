# HangaPic

HangaPic is a JavaScript library for simulating wall with the ability to hang a picture and see how it would look like on a real wall.

## Options

- `bgImgs`: (array), Array of objects
- `frontImgs`: (array), Array of objects
- `startX` (optional): (integer), Percentage from 1 to 100, **Default** _0_
- `startY` (optional): (integer), Percentage from 1 to 100, **Default** _0_
- `units` (optional): (string), "cm" or "inches", **Default** _"cm"_
- `borderOpacity` (optional): (float), From 0 to 1, **Default** _0.2_
- `uploadCustomWall` (optional): (bool), **Default** _false_
- `debug` (optional): (bool), **Default** _false_

###  `bgImgs`

Array of images. Image should be an object with the following properties : `src`,  `srcThumb` (optional), `width`, `height`, `startX`, `startY`

###  `frontImgs`

Array of images. Image should be an object with the following properties : `src`,  `width`, `height`

## Functions

### `init`

Initialize the library in the following format:

`wmount.init(options)`

Example usage:

```
window.wmount.init({
    bgImgs: bgImgsArray,
    frontImgs: frontImgsArray,
    startX: 20,
    startY: 50,
    units: 'cm',
    borderOpacity: .2,
    uploadCustomWall: true,
    debug: true
})
```

### `units`

Show currently used units by the library.  
Return `inches` or 'cm'

### `device`

Show device used by a front-end client.  
Return `desktop` or `mobile`

### `addFrontImage(image)`

Dynamically add a picture to the `frontImgs` array. Takes an image object as an argument in the `frontImgs` image format.
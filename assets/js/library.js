(function(window){
  let bgImgs = [],
    frontImgs = [],
    bgDefaultImagesLength = 0,
    boundsWidth = 0,
    boundsHeight = 0,
    posX = 0,
    posY = 0,
    body = null,
    wm = null,
    wmContainer = null,
    wmBg = null,
    wmFront = null,
    wmBgChange = null,
    wmFrontChange = null,
    wmRemoveLocalBg = null,
    wmRemoveLocalFront = null,
    wmAddFront = null,
    wmLocalUpload = null,
    wmFrontWidth = null,
    wmFrontHeight = null,
    wmBgWidth = null,
    wmBgHeight = null,
    wmLocalWidth = null,
    wmLocalWidthValue = null,
    wmLocalWidthHelper = null,
    wmLocalHeight = null,
    wmLocalHeightValue = null,
    wmLocalHeightHelper = null,
    wmBgImagesList = null,
    wmFrontImagesList = null,
    wmUnitsChange = null,
    wmWallDimension = null,
    units = 'cm',
    origUnits = 'cm',
    borderOpacity = 1,
    uploadCustomWall = false,
    device = 'desktop',
    first = true,
    debug = false;

  const _init = (data = []) => {
    body = document.querySelector('body');
    wm = document.querySelector('#wm');
    if (wm === null) {
      throw new Error('Error finding #wm');
    }
    if (typeof data.bgImgs !== 'object' || data.bgImgs.length <= 0) {
      throw new Error('Error creating bgImgs');
    }
    if (typeof data.frontImgs !== 'object' || data.frontImgs.length <= 0) {
      throw new Error('Error creating frontImgs');
    }

    // Set units
    if (data.units === 'inches' || localStorage.getItem('units') === 'inches') {
      units = 'inches';
      origUnits = 'inches';
    }

    // Set front image border opacity
    if (!isNaN(data.borderOpacity))
      borderOpacity = data.borderOpacity;

    if (data.uploadCustomWall) {
      uploadCustomWall = true;
    }

    if (data.debug === true) {
      debug = true;
    }

    bgImgs = data.bgImgs;
    frontImgs = data.frontImgs;
    bgDefaultImagesLength = bgImgs.length;

    // Set original width/height not distorted by responsiveness
    for (let i=0; i<bgImgs.length; i++) {
      bgImgs[i].origWidth = bgImgs[i].width;
      bgImgs[i].origHeight = bgImgs[i].height;
    }
    for (let i=0; i<frontImgs.length; i++) {
      frontImgs[i].origWidth = frontImgs[i].width;
      frontImgs[i].origHeight = frontImgs[i].height;
    }

    // Load uploaded images
    let localBgImages = getLocalImages('bg');
    if (localBgImages.length) {
      bgImgs = bgImgs.concat(localBgImages);
    }

    let localFrontImages = getLocalImages('front');
    if (localFrontImages.length) {
      frontImgs.forEach(function(frontImg) {
        localFrontImages.forEach(function(localImg) {
          if (frontImg.src === localImg.src) {
            frontImg.isDuplicate = true;
          }
        })
      });

      frontImgs = frontImgs.concat(localFrontImages);
    }

    createDOM();
    loadDOM();
    attachEventListeners();
    updateImage('bg');
    updateImage('front');

    if (debug) {
      showImagesList('bg');
      showImagesList('front');
    }
  }

  // Create DOM elements on page
  const createDOM = () => {
    let uploadCustomWallHtml = uploadCustomWallInputsHtml = frontPrevNextHtml = ``;
    if (uploadCustomWall) {
      uploadCustomWallHtml = `<div class="row"><label>Upload your wall<input class="wm-local-img" type="file" accept="image/*" capture @change="setImage"/></label></div>`
      uploadCustomWallInputsHtml = `<div class="wm-wall-dimensions row"><label>Wall width<input class="wm-local-width" type="range" min="100" max="1000" value="0" /><span class="wm-local-width-value">0</span></label></div><div class="wm-wall-dimensions row"><label>Wall height<input class="wm-local-height" type="range" min="100" max="1000" value="0" /><span class="wm-local-height-value">0</span></label></div>`;
    }
    if (frontImgs.length > 0)
      frontPrevNextHtml = `<button class="wm-front-change" data-wm-front-prev>Prev image</button><button class="wm-front-change" data-wm-front-next>Next image</button><button class="wm-add-local-front">Add to compare</button><button class="wm-remove-local-front" disabled>Remove from compare</button>`;
    let html = `<div class="wm-container"><img class="wm-bg" alt="Wall image" src="" /><img class="wm-front" alt="Preview image" src="" /><div class="wm-bg-width-helper"></div><div class="wm-bg-height-helper"></div></div><div class="wm-menu"><div class="row"><button class="wm-bg-change" data-wm-bg-prev>Prev wall</button><button class="wm-bg-change" data-wm-bg-next>Next wall</button><button class="wm-remove-local-bg" disabled>Remove wall</button>${frontPrevNextHtml}</div><div class="row"></div>${uploadCustomWallHtml}<div class="row"><label>Units</label><select data-units><option${(units === 'cm' ? ' selected' : '')}>cm</option><option${(units === 'inches' ? ' selected' : '')}>inches</option></select></div></div>${uploadCustomWallInputsHtml}<div class="row"><span>Wall dimensions: <span class="wm-bg-width"></span> x <span class="wm-bg-height"></span></span></div><div class="row"><span>Image dimensions: <span class="wm-front-width"></span> x <span class="wm-front-height"></span></span></div>`;
    let debug_html = `
            <hr /><div class="row"><span>Walls:</span><ul class="wm-bg-images"></ul><span>Images:</span><ul class="wm-front-images"></ul></div>`;
    if (debug) {
      html += debug_html;
    }
    html += `</div>`;
    wm.innerHTML = html;
  }

  // Load DOM elements
  const loadDOM = () => {
    wmContainer = document.querySelector('#wm .wm-container');
    wmBg = document.querySelector('#wm .wm-bg');
    wmFront = document.querySelector('#wm .wm-front');
    wmBgChange = document.querySelectorAll('#wm .wm-bg-change');
    wmFrontChange = document.querySelectorAll('#wm .wm-front-change');
    wmRemoveLocalBg = document.querySelector('#wm .wm-remove-local-bg');
    wmRemoveLocalFront = document.querySelector('#wm .wm-remove-local-front');
    wmLocalUpload = document.querySelector('#wm .wm-local-img');
    wmFrontWidth = document.querySelector('#wm .wm-front-width');
    wmFrontHeight = document.querySelector('#wm .wm-front-height');
    wmBgWidth = document.querySelector('#wm .wm-bg-width');
    wmBgHeight = document.querySelector('#wm .wm-bg-height');
    wmLocalWidth = document.querySelector('#wm .wm-local-width');
    wmLocalWidthValue = document.querySelector('#wm .wm-local-width-value');
    wmLocalWidthHelper = document.querySelector('#wm .wm-bg-width-helper');
    wmLocalHeight = document.querySelector('#wm .wm-local-height');
    wmLocalHeightValue = document.querySelector('#wm .wm-local-height-value');
    wmLocalHeightHelper = document.querySelector('#wm .wm-bg-height-helper');
    wmBgImagesList = document.querySelector('#wm .wm-bg-images');
    wmFrontImagesList = document.querySelector('#wm .wm-front-images');
    wmUnitsChange = document.querySelector('#wm select[data-units]');
    wmWallDimension = document.querySelectorAll('#wm .wm-wall-dimensions');
    wmAddFront = document.querySelector('#wm .wm-add-local-front');
  }

  const attachEventListeners = () => {
    wmBg.addEventListener('load', function() {
      positionElement(wmFront);
      dragElement(wmFront);
      wmContainer.style.height = wmBg.height + "px";
    });

    wmFront.addEventListener('load', function() {
      setFrontImageBorder(borderOpacity);
    });

    // Load local bg image
    if (wmLocalUpload) {
      wmLocalUpload.addEventListener('change', function () {
        positionElement(wmFront);
        dragElement(wmFront);
        loadLocalImage();
        wmContainer.style.height = wmBg.height + "px";
      });
    }

    // Change local bg image width/height
    if (wmLocalWidth) {
      wmLocalWidth.addEventListener('input', function() {
        let width = parseInt(this.value),
            height = calcHeight(this.value);

        if (height > wmLocalHeight.max) {
          height = wmLocalHeight.max;
        } else if (height < wmLocalHeight.min) {
          height = wmLocalHeight.min;
        }

        wmBg.setAttribute('data-wmwidth', width);
        wmBg.setAttribute('data-wmheight', height);
        scaleRatio();
        calcBonds();
      });

      wmLocalWidth.addEventListener('change', function() {
        triggerEvent(this, 'input');
        let index = getCurrentImageIndex('bg');
        let localBgImages = getLocalImages('bg');
        let width = parseInt(this.value);

        if (localBgImages) {
          localBgImages.forEach(function(img) {
            if (img.src === bgImgs[index].src) {
              img.width = width;
              bgImgs[index] = img;
            }
          });
          setLocalImages(localBgImages);
        }
      });

      wmLocalHeight.addEventListener('input', function () {
        let height = parseInt(this.value),
            width = calcWidth(this.value);

        if (width > wmLocalWidth.max) {
          width = wmLocalWidth.max;
        } else if (width < wmLocalWidth.min) {
          width = wmLocalWidth.min;
        }

        wmBg.setAttribute('data-wmwidth', width);
        wmBg.setAttribute('data-wmheight', height);
        scaleRatio();
        calcBonds();
      });

      wmLocalHeight.addEventListener('change', function() {
        triggerEvent(this, 'input');
        let index = getCurrentImageIndex('bg');
        let localBgImages = getLocalImages('bg');
        let width = calcWidth(this.value);

        if (localBgImages) {
          localBgImages.forEach(function(img) {
            if (img.src === bgImgs[index].src) {
              img.width = width;
              bgImgs[index] = img;
            }
          });
          setLocalImages(localBgImages);
        }
      });

      wmLocalWidth.addEventListener('mouseover', function() {
        wmLocalWidthHelper.style.opacity = 1;
        wmLocalWidthHelper.style.zIndex = 1;
        wmBg.style.opacity = .7;
        wmFront.style.opacity = .7;
      });

      wmLocalWidth.addEventListener('mouseout', function() {
        wmLocalWidthHelper.style.opacity = 0;
        wmLocalWidthHelper.style.zIndex = -1;
        wmBg.style.opacity = 1;
        wmFront.style.opacity = 1;
      });

      wmLocalHeight.addEventListener('mouseover', function() {
        wmLocalHeightHelper.style.opacity = 1;
        wmLocalHeightHelper.style.zIndex = 1;
        wmBg.style.opacity = .7;
        wmFront.style.opacity = .7;
      });

      wmLocalHeight.addEventListener('mouseout', function() {
        wmLocalHeightHelper.style.opacity = 0;
        wmLocalHeightHelper.style.zIndex = -1;
        wmBg.style.opacity = 1;
        wmFront.style.opacity = 1;
      });
    }

    wmUnitsChange.addEventListener('change', function() {
      updateUnits(this.options[this.selectedIndex].value);
    });

    // Add front image button
    wmAddFront.addEventListener('click', function() {
      let index = getCurrentImageIndex('front');
      let image = JSON.parse(JSON.stringify(frontImgs[index]));

      if (typeof image.isDynamic !== 'undefined') {
        return;
      }

      _addFrontImage(image);
    });

    window.onresize = function() {
      scaleRatio();
      calcBonds();
      wmContainer.style.height = wmBg.height + "px";
    };

    // Touch support
    wm.addEventListener('click', prevNextHandler, true);
    wmRemoveLocalBg.addEventListener('click', wmRemoveLocalBgHandler, true);
    wmRemoveLocalFront.addEventListener('click', wmRemoveLocalFrontHandler, true);
    wmFront.addEventListener('touchstart', touchHandler, true);
    wmFront.addEventListener('touchmove', touchHandler, true);
    wmFront.addEventListener('touchend', touchHandler, true);
    wmFront.addEventListener('touchcancel', touchHandler, true);
    wmFront.addEventListener('touchstart', mobileDevice);
  }

  const calcHeight = () => {
    let widthRatio = wmBg.width / wmBg.getAttribute('data-wmwidth');
    return parseInt(wmBg.height / widthRatio);
  }

  const calcWidth = () => {
    let heightRatio = wmBg.height / wmBg.getAttribute('data-wmheight');
    return parseInt(wmBg.width / heightRatio);
  }

  const formatUnits = (value) => {
    return parseFloat(value * (units === 'cm' ? 1 : 0.393701)).toFixed((units === 'cm' ? 0 : 1)) + units;
  }

  const updateUnits = (selectedUnits) => {
    units = selectedUnits;
    localStorage.setItem('units', units);
    let formattedWidth = formatUnits(wmBg.getAttribute('data-wmwidth'));
    let height = calcHeight(wmBg.getAttribute('data-wmwidth'));
    let formattedHeight = formatUnits(height);
    if (wmLocalWidth) {
      wmLocalWidthValue.innerHTML = formattedWidth;
      wmLocalHeightValue.innerHTML = formattedHeight;
    }
    wmFrontWidth.innerHTML = formatUnits(wmFront.getAttribute('data-wmwidth'));
    wmFrontHeight.innerHTML = formatUnits(wmFront.getAttribute('data-wmheight'));
    wmBgWidth.innerHTML = formatUnits(wmBg.getAttribute('data-wmwidth'));
    wmBgHeight.innerHTML = formatUnits(wmBg.getAttribute('data-wmheight'));
  }

  const setFrontImageBorder = (value) => {
    if (value < 0) value = 0;
    else if (value > 1) value = 1;
    wmFront.style.outline = '2px solid rgba(0,0,0,'+value+')';
  }

  const setPosition = (x = 20 ,y = 50) => {
    if (typeof x === 'number') {
      if (x >= 0 && x <= 100) {
        posX = x;
      }
    }
    if (typeof y === 'number') {
      if (y >= 0 && y <= 100) {
        posY = y;
      }
    }
  }

  let showImagesList = (type) => {
    let imgsList,
      imgsListDom,
      html = '';

    if (type === 'front') {
      imgsList = frontImgs;
      imgsListDom = wmFrontImagesList;
    } else {
      imgsList = bgImgs;
      imgsListDom = wmBgImagesList;
    }

    imgsList.forEach(function(img, i) {
      let imgSrc = img.src;
      let title = ((type === 'bg') ? 'Wall ' : 'Image ') + (i + 1);
      if (typeof img.srcThumb !== 'undefined') {
        imgSrc = img.srcThumb;
      }
      html += `<li${(i === 0 ? ' class="selected"' : '')}><img src='${imgSrc}' title='${title}' alt='thumb-${i}' /></li>`;
    });

    imgsListDom.innerHTML = html;
  }

  let updateImage = (type, direction, last) => {
    let image = null,
      imgs = null,
      imgsListDom = null,
      newImage = new Image();

    if (type === 'front') {
      image = wmFront;
      imgs = frontImgs;
      imgsListDom = wmFrontImagesList;
    } else {
      image = wmBg;
      imgs = bgImgs;
      imgsListDom = wmBgImagesList;
    }

    if (type === 'bg') {
      image.style.opacity = .3;
    }

    newImage.onload = function() {
      let defaultWidth = 110;
      let defaultHeight = calcHeight(defaultWidth);

      if (type === 'bg') {
        defaultWidth = 300;
        defaultHeight = calcHeight(defaultWidth);
        setPosition(imgs[index].startX, imgs[index].startY);
      }

      image.setAttribute('data-wmwidth', (imgs[index].width || defaultWidth));
      image.setAttribute('data-wmheight', (imgs[index].height || defaultHeight));
      image.src = this.src;

      if (type === 'bg') {
        image.style.opacity = 1;
        if (first) {
          let height = calcHeight(this.value);
          if (wmLocalWidth) {
            wmLocalWidthValue.innerHTML = formatUnits(this.value);
            wmLocalHeightValue.innerHTML = formatUnits(height);
          }
          wmBgWidth.innerHTML = formatUnits(wmBg.getAttribute('data-wmwidth'));
          wmBgHeight.innerHTML = formatUnits(wmBg.getAttribute('data-wmheight'));
          first = false;
        }
      }
      else {
        wmFrontWidth.innerHTML = formatUnits(wmFront.getAttribute('data-wmwidth'));
        wmFrontHeight.innerHTML = formatUnits(wmFront.getAttribute('data-wmheight'));
      }

      scaleRatio();
      calcBonds();

      if (debug) {
        let selected = imgsListDom.querySelector('li.selected');
        if (selected) selected.classList.remove('selected');
        selected = imgsListDom.querySelector('li:nth-child(' + (index + 1) + ')');
        if (selected)  selected.classList.add('selected');
      }
    }

    let index = first ? 0 : getImageIndex(type, direction, last);

    if (type === 'bg') {
      if (!imgs[index].src.startsWith('data')) {
        wmRemoveLocalBg.setAttribute('disabled', 'disabled');
        wmWallDimension.forEach((e) => {
          e.classList.add('hide');
        });
      }
      else {
        wmRemoveLocalBg.removeAttribute('disabled');
        wmWallDimension.forEach((e) => {
          e.classList.remove('hide');
        });
      }
    } else if (type === 'front') {
      if (imgs[index].isDynamic) {
        wmRemoveLocalFront.removeAttribute('disabled');
        wmAddFront.setAttribute('disabled', 'disabled');
      }
      else {
        wmRemoveLocalFront.setAttribute('disabled', 'disabled');
        wmAddFront.removeAttribute('disabled');
      }
    }

    newImage.src = imgs[index].src;
    dragElement(wmFront);
  }

  let getCurrentImageIndex = (type) => {
    let index = null,
      imgs = [],
      wmImg = null;

    if (type === 'bg') {
      imgs = bgImgs;
      wmImg = wmBg;
    } else {
      imgs = frontImgs;
      wmImg = wmFront;
    }

    imgs.forEach(function(img, i) {
      if (img.src === wmImg.src) {
        index = i;
      }
    });

    return index;
  }

  let getImageIndex = (type, direction, last = null) => {
    let index = -1,
      selectedImg = null,
      imgs = [],
      isDynamic = true;

    if (type === 'front') {
      selectedImg = wmFront;
      imgs = frontImgs;
    } else {
      selectedImg = wmBg;
      imgs = bgImgs;
    }

    for (let i = imgs.length - 1; i >= 0; i--) {
      if (imgs[i].src === selectedImg.src) {
        index = i;
        break;
      }
    }

    if (last) {
      index = imgs.length - 1;
    } else {
      let counter = 0;
      while (isDynamic && counter < 100) {
        if (direction === 'prev') {
          index--;
          if (index < 0) {
            index = imgs.length - 1;
          }
        } else {
          index++;
          if (index > imgs.length - 1) {
            index = 0;
          }
        }

        if (typeof imgs[index].isDuplicate === 'undefined') {
          isDynamic = false;
        }
        counter++;
      }
    }

    return index;
  }

  let scaleRatio = () => {
    let bgWidth = calcWidth(wmBg.getAttribute('data-wmheight')),
        bgHeight = calcHeight(bgWidth),
        ratio = wmBg.width / bgWidth,
        frontWidth = parseInt(wmFront.getAttribute('data-wmwidth') * ratio),
        minWidth = wmLocalWidth.min,
        maxWidth = wmLocalWidth.max,
        minHeight = wmLocalHeight.min,
        maxHeight = wmLocalHeight.max,
        formattedWidth = '',
        formattedHeight = '';

    if (bgWidth >= maxWidth) {
      bgWidth = maxWidth;
    } else if (bgWidth <= minWidth) {
      bgWidth = minWidth;
    }

    if (bgHeight >= maxHeight) {
      bgHeight = maxHeight;
    } else if (bgHeight <= minHeight) {
      bgHeight = minHeight;
    }

    wmFront.width = frontWidth;
    wmFront.style.opacity = 1;
    wmLocalWidth.value = bgWidth;
    wmLocalHeight.value = bgHeight;

    formattedWidth = formatUnits(bgWidth);
    formattedHeight = formatUnits(bgHeight);

    wmLocalWidthValue.innerHTML = formattedWidth;
    wmLocalHeightValue.innerHTML = formattedHeight;
    wmBgWidth.innerHTML = formattedWidth;
    wmBgHeight.innerHTML = formattedHeight;
    positionElement(wmFront);
  }

  let calcBonds = () => {
    boundsWidth = wmBg.width - wmFront.width;
    boundsHeight = wmBg.height - wmFront.height;
  }

  let loadLocalImage = () => {
    if (!uploadCustomWall)
      return;

    wmBg.style.opacity = .3;
    let fr = new FileReader();
    fr.readAsDataURL(wmLocalUpload.files[0]);

    fr.onload = function() {
      wmBg.src = this.result;
      wmBg.style.opacity = 1;

      wmBg.onload = function() {
        // Save image object to localStorage
        let localBgImage = {
          src: fr.result,
          startX: 50,
          startY: 50
        }

        bgImgs.push(localBgImage);

        // Save image to localStorage
        addLocalImage(localBgImage, 'bg');

        wmContainer.style.height = wmBg.height + "px";
        wmRemoveLocalBg.removeAttribute('disabled');

        scaleRatio();
        calcBonds();
        showImagesList('bg');
        wmBg.onload = null;

        wmWallDimension.forEach((e) => {
          e.classList.remove('hide');
        });

        if (debug) {
          let selected = wmBgImagesList.querySelector('li.selected');
          if (selected) selected.classList.remove('selected');
          selected = wmBgImagesList.querySelector('li:last-child');
          selected.classList.add('selected');
        }
      }
    };
  }

  let positionElement = (element) => {
    element.style.top = ((wmBg.height - element.height) / 100 * posX) + "px";
    element.style.left = ((wmBg.width - element.width) / 100 * posY) + "px";
  }

  let dragElement = (element) => {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0,
      relPos1 = 0,
      relPos2 = 0;

    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
      if (device === 'mobile')
        body.classList.add('dragging');
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // Calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      relPos1 = element.offsetTop - pos2;
      relPos2 = element.offsetLeft - pos1;

      // Check top left boundaries
      if (relPos1 <= 0) relPos1 = 0;
      if (relPos2 <= 0) relPos2 = 0;

      // Check right bottom boundaries
      if (relPos1 >= boundsHeight) relPos1 = boundsHeight;
      if (relPos2 >= boundsWidth) relPos2 = boundsWidth;

      // Set the element's new position:
      element.style.top = relPos1 + "px";
      element.style.left = relPos2 + "px";
      posX = 100 * relPos1 / (wmBg.height - element.height);
      posY = 100 * relPos2 / (wmBg.width - element.width);
    }

    function closeDragElement() {
      /// Stop moving when mouse button is released
      if (device === 'mobile')
        body.classList.remove('dragging');
      document.onmouseup = null;
      document.onmousemove = null;

      // Store front image position to bg image
      let index = getCurrentImageIndex('bg');

      bgImgs[index].startX = posX;
      bgImgs[index].startY = posY;

      // Update local storage
      if (bgImgs[index].src.startsWith('data')) {
        updateLocalImage(bgImgs[index],'bg');
      }
    }
  }

  let prevNextHandler = (event) => {
    if (event.target.attributes['data-wm-bg-prev'] !== undefined) {
      updateImage('bg', 'prev');
    } else if (event.target.attributes['data-wm-bg-next'] !== undefined) {
      updateImage('bg', 'next');
    } else if (event.target.attributes['data-wm-front-prev'] !== undefined) {
      updateImage('front', 'prev');
    } else if (event.target.attributes['data-wm-front-next'] !== undefined) {
      updateImage('front', 'next');
    }
  }

  let touchHandler = (event) => {
    const touch = event.changedTouches[0];
    const simulatedEvent = document.createEvent("MouseEvent");

    simulatedEvent.initMouseEvent({
        touchstart: "mousedown",
        touchmove: "mousemove",
        touchend: "mouseup"
      }[event.type], true, true, window, 1,
      touch.screenX, touch.screenY,
      touch.clientX, touch.clientY, false,
      false, false, false, 0, null);

    touch.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
  }

  let wmRemoveLocalBgHandler = () => {
    let index = getCurrentImageIndex('bg');
    let localImagesIndex = index - bgImgs.length;

    bgImgs.splice(index, 1);
    removeLocalImage(localImagesIndex, 'bg');
    updateImage('bg');

    if (debug) {
      let imgToRemove = wmBgImagesList.querySelectorAll('li')[index];
      imgToRemove.parentNode.removeChild(imgToRemove);
    }
  }

  let wmRemoveLocalFrontHandler = () => {
    let index = getCurrentImageIndex('front');
    let localImagesIndex = index - frontImgs.length;

    frontImgs.forEach(function(frontImg) {
      if (frontImgs[index].src === frontImg.src) {
        delete frontImg.isDuplicate;
      }
    });

    frontImgs.splice(index, 1);
    removeLocalImage(localImagesIndex, 'front');
    updateImage('front');

    if (debug) {
      let imgToRemove = wmFrontImagesList.querySelectorAll('li')[index];
      imgToRemove.parentNode.removeChild(imgToRemove);
    }
  }

  let triggerEvent = (el, type) => {
    // IE9+ and other modern browsers
    if ('createEvent' in document) {
      let e = document.createEvent('HTMLEvents');
      e.initEvent(type, false, true);
      el.dispatchEvent(e);
    } else {
      // IE8
      let e = document.createEventObject();
      e.eventType = type;
      el.fireEvent('on' + e.eventType, e);
    }
  }

  let getLocalImages = (type) => {
    if (type !== 'bg' && type !== 'front') {
      return [];
    }
    let typeString = 'localImages_' + type;
    let localImages = JSON.parse(localStorage.getItem(typeString));
    return localImages ? localImages : [];
  }

  let addLocalImage = (localImage, type) => {
    if (type !== 'bg' && type !== 'front') {
      return false;
    }

    let typeString = 'localImages_' + type;
    let localImages = getLocalImages(type);

    localImages.push(localImage);
    localStorage.setItem(typeString, JSON.stringify(localImages));
    return true;
  }

  let updateLocalImage = (localImage, type) => {
    if (type !== 'bg' && type !== 'front') {
      return false;
    }
    let localImages = getLocalImages(type);
    localImages.forEach(function(img, i) {
      if (img.src === localImage.src) {
        localImages[i] = localImage;
      }
    });
    setLocalImages(localImages, type);
    return true;
  }

  let setLocalImages = (localImages, type) => {
    if (type !== 'bg' && type !== 'front') {
      return false;
    }
    let typeString = 'localImages_' + type;
    localStorage.setItem(typeString, JSON.stringify(localImages));
    return true;
  }

  let removeLocalImage = (index, type) => {
    if (type !== 'bg' && type !== 'front') {
      return false;
    }
    let localImages = getLocalImages(type);
    localImages.splice(index, 1);
    setLocalImages(localImages, type);
    return true;
  }

  let mobileDevice = () => {
    device = 'mobile';
    window.removeEventListener('touchstart', mobileDevice, false);
  }

  let _units = () => {
    return units;
  }

  let _device = () => {
    return device;
  }

  let _addFrontImage = (image) => {
    let error,
        found = false;

    if (typeof image.width === 'undefined') {
      error = 'Width not set';
    }
    else if (typeof image.height === 'undefined') {
      error = 'Height not set';
    }
    else if (typeof image.src === 'undefined') {
      error = 'Src not set';
    }
    if (error) {
      console.log(error);
      return;
    }

    frontImgs.forEach(function (frontImg) {
      if (frontImg.src === image.src && typeof frontImg.isDuplicate !== 'undefined') {
        found = true;
      }
    })

    if (found) {
      return;
    }

    image.origWidth = image.width;
    image.origHeight = image.height;
    image.isDynamic = true;

    frontImgs.forEach(function (frontImg) {
      if (frontImg.src === image.src) {
        frontImg.isDuplicate = true;
      }
    });

    frontImgs.push(image);
    addLocalImage(image, 'front');
    updateImage('front', null, true);
    showImagesList('front');

    if (debug) {
      let selected = wmFrontImagesList.querySelector('li.selected');
      if (selected) selected.classList.remove('selected');
      selected = wmFrontImagesList.querySelector('li:last-child');
      if (selected)  selected.classList.add('selected');
    }
  }

  window.wmount = {
    init: _init,
    units: _units,
    device: _device,
    addFrontImage: (image) => {
      _addFrontImage(image)
    }
  }
})(window)
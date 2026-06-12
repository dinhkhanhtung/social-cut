document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('dropzone');
    const dropzonePrompt = document.getElementById('dropzone-prompt');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    
    const modeGridBtn = document.getElementById('mode-grid');
    const modeBoxBtn = document.getElementById('mode-box');
    const controlsGridMode = document.getElementById('controls-grid-mode');
    const controlsBoxMode = document.getElementById('controls-box-mode');
    
    const inputRows = document.getElementById('input-rows');
    const inputCols = document.getElementById('input-cols');
    const inputOffset = document.getElementById('input-offset');
    const offsetNumberVal = document.getElementById('input-offset-number');
    
    const selectRatio = document.getElementById('select-ratio');
    const switchUniform = document.getElementById('switch-uniform');
    const switchSnap = document.getElementById('switch-snap');
    
    const btnSlice = document.getElementById('btn-slice');
    const btnAutoDetect = document.getElementById('btn-auto-detect');
    const btnGenBoxes = document.getElementById('btn-gen-boxes');
    const btnClearBoxes = document.getElementById('btn-clear-boxes');
    const btnDownloadZip = document.getElementById('btn-download-zip');
    
    const tabBtnLive = document.getElementById('tab-btn-live');
    const tabBtnResult = document.getElementById('tab-btn-result');
    const tabLiveGrid = document.getElementById('tab-live-grid');
    const tabResultGrid = document.getElementById('tab-result-grid');
    
    const canvasPlaceholder = document.getElementById('canvas-placeholder');
    const previewCanvas = document.getElementById('preview-canvas');
    const imageMeta = document.getElementById('image-meta');
    const imgDimOriginal = document.getElementById('img-dim-original');
    const imgDimCell = document.getElementById('img-dim-cell');
    const gridModeText = document.getElementById('grid-mode-text');
    const interactiveTip = document.getElementById('interactive-tip');
    const tipText = document.getElementById('tip-text');
    
    const resultCount = document.getElementById('result-count');
    const resultCountBadge = document.getElementById('result-count-badge');
    const resultGrid = document.getElementById('result-grid');
    const btnClearResults = document.getElementById('btn-clear-results');
    const btnRenumberResults = document.getElementById('btn-renumber-results');
    const btnMobilePreview = document.getElementById('btn-mobile-preview');
    const mobilePreviewModal = document.getElementById('mobile-preview-modal');
    const btnCloseMobilePreview = document.getElementById('btn-close-mobile-preview');
    const mobileCarouselSlider = document.getElementById('mobile-carousel-slider');
    const mobileCarouselDots = document.getElementById('mobile-carousel-dots');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const appContent = document.getElementById('app-content');

    const ctx = previewCanvas.getContext('2d');

    // Global State
    let currentImage = null;
    let slicedImages = []; // Array of { name, dataUrl }
    let slicedBlobs = [];  // Array of { name, blob }
    
    let slicingMode = 'grid'; // 'grid' or 'box'

    // --- Mode 1: Grid Mode Variables ---
    let colsX = [];        // X coordinates of vertical grid lines. Length: cols - 1
    let rowsY = [];        // Y coordinates of horizontal grid lines. Length: rows - 1
    let isCustomGrid = false; 

    // --- Mode 2: Box Mode Variables ---
    let selectionBoxes = []; // Array of { id, x, y, w, h } in original image space
    let nextBoxId = 1;
    let isDrawingNewBox = false;
    let newBoxStart = { x: 0, y: 0 };
    let dragBoxTarget = null; // { boxIndex, actionType: 'move' | 'resize-br', startX, startY, originalBox }

    // --- Constraints State ---
    let lockedRatio = null; // null (free) or number (width/height ratio)
    let isUniformSize = false; // Sync dimensions of all boxes
    let isSnapEnabled = true;
    let snapGuides = [];

    // --- Result Management State ---
    let resultIdCounter = 1;
    let globalTargetW = null;
    let globalTargetH = null;

    // --- Zoom and Pan State ---
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let spacePressed = false;
    let isPanning = false;
    let selectedBoxIdx = -1;
    let panStart = { x: 0, y: 0 };

    // Precision drag variables (Alt key slowdown)
    let lastDragMouseX = 0;
    let lastDragMouseY = 0;

    // Constants
    const dragTolerancePx = 14; // Screen pixels tolerance to grab a grid line
    const boxHandleSize = 10;    // Size of the resize handle at bottom-right of selection boxes
    const deleteBtnSize = 18;   // Size of the close (delete) button at top-right of selection boxes

    // --- Drag and Drop Events for Upload ---
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleImageSelection(files[0]);
        }
    });



    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            handleImageSelection(fileInput.files[0]);
        }
    });

    // --- Paste image from clipboard shortcut Ctrl + V ---
    window.addEventListener('paste', (e) => {
        // Tránh dán ảnh khi người dùng đang tập trung gõ vào các ô nhập liệu
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;
        
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    handleImageSelection(file);
                    e.preventDefault();
                    break;
                }
            }
        }
    });

    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent opening file chooser
        resetApp();
    });

    // --- Slicing Mode Switches ---
    const setSlicingMode = (mode) => {
        slicingMode = mode;
        if (mode === 'grid') {
            modeGridBtn.classList.add('active');
            modeBoxBtn.classList.remove('active');
            controlsGridMode.classList.add('active');
            controlsBoxMode.classList.remove('active');
            
            if (currentImage) {
                btnAutoDetect.style.display = 'flex';
                tipText.innerHTML = "Mẹo: Bạn có thể kéo thả các đường lưới màu xanh để thay đổi kích thước các ô.";
                gridModeText.textContent = isCustomGrid ? "Tùy chỉnh" : "Chia đều";
                gridModeText.style.color = isCustomGrid ? "var(--accent)" : "var(--text-secondary)";
            }
        } else {
            modeGridBtn.classList.remove('active');
            modeBoxBtn.classList.add('active');
            controlsGridMode.classList.remove('active');
            controlsBoxMode.classList.add('active');
            
            if (currentImage) {
                btnAutoDetect.style.display = 'none';
                tipText.innerHTML = "Mẹo: Nhấp kéo chuột trên ảnh để vẽ khung tự do.";
                gridModeText.textContent = `Tự do (${selectionBoxes.length} khung)`;
                gridModeText.style.color = "var(--success)";
            }
        }
        if (currentImage) {
            handleParamsChange();
        }
    };

    modeGridBtn.addEventListener('click', () => setSlicingMode('grid'));
    modeBoxBtn.addEventListener('click', () => setSlicingMode('box'));

    // --- Constraints Controls Listeners ---
    selectRatio.addEventListener('change', () => {
        const val = selectRatio.value;
        if (val === 'free') {
            lockedRatio = null;
        } else if (val === '1:1') {
            lockedRatio = 1.0;
        } else if (val === '4:5') {
            lockedRatio = 4 / 5;
        } else if (val === '3:4') {
            lockedRatio = 3 / 4;
        } else if (val === '9:16') {
            lockedRatio = 9 / 16;
        }
        
        // Apply aspect ratio lock immediately to all existing boxes in Box mode
        if (currentImage && slicingMode === 'box' && lockedRatio && selectionBoxes.length > 0) {
            selectionBoxes.forEach(box => {
                box.h = box.w / lockedRatio;
                // Keep inside image boundaries
                if (box.y + box.h > currentImage.naturalHeight) {
                    box.h = currentImage.naturalHeight - box.y;
                    box.w = box.h * lockedRatio;
                }
            });
            handleParamsChange();
        }
    });

    switchUniform.addEventListener('change', () => {
        isUniformSize = switchUniform.checked;
        
        // Apply uniform size immediately to all boxes in Box mode based on the first box size
        if (currentImage && slicingMode === 'box' && isUniformSize && selectionBoxes.length > 1) {
            const baseW = selectionBoxes[0].w;
            const baseH = selectionBoxes[0].h;
            
            selectionBoxes.forEach((box, idx) => {
                if (idx > 0) {
                    box.w = baseW;
                    box.h = baseH;
                    // Clamp boundaries safely
                    if (box.x + box.w > currentImage.naturalWidth) {
                        box.x = currentImage.naturalWidth - box.w;
                    }
                    if (box.y + box.h > currentImage.naturalHeight) {
                        box.y = currentImage.naturalHeight - box.h;
                    }
                }
            });
            handleParamsChange();
        }
    });

    if (switchSnap) {
        switchSnap.addEventListener('change', () => {
            isSnapEnabled = switchSnap.checked;
        });
    }

    if (offsetNumberVal) {
        offsetNumberVal.addEventListener('input', () => {
            let val = parseInt(offsetNumberVal.value) || 0;
            const maxVal = parseInt(inputOffset.max) || 50;
            const minVal = parseInt(inputOffset.min) || 0;
            if (val < minVal) val = minVal;
            if (val > maxVal) val = maxVal;
            offsetNumberVal.value = val;
            inputOffset.value = val;
            handleParamsChange();
        });
    }

    // Gán sự kiện click cho các nút spinner (+/-)
    document.querySelectorAll('.btn-spinner').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPlus = btn.classList.contains('btn-plus');
            const min = parseInt(input.min) || 0;
            const max = parseInt(input.max) || 100;
            const step = parseInt(input.step) || 1;
            let val = parseInt(input.value) || 0;

            if (isPlus) {
                val = Math.min(max, val + step);
            } else {
                val = Math.max(min, val - step);
            }

            input.value = val;
            input.dispatchEvent(new Event('input'));
        });
    });

    // --- Tab Switching Logic ---
    const switchTab = (tabId) => {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    };

    tabBtnLive.addEventListener('click', () => switchTab('tab-live-grid'));
    tabBtnResult.addEventListener('click', () => {
        if (!tabBtnResult.disabled) {
            switchTab('tab-result-grid');
        }
    });

    // --- Initialize Grid Lines (Evenly Distributed) ---
    const resetGridToEven = () => {
        if (!currentImage) return;
        
        const rows = parseInt(inputRows.value) || 1;
        const cols = parseInt(inputCols.value) || 1;
        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;

        colsX = [];
        for (let i = 1; i < cols; i++) {
            colsX.push((width / cols) * i);
        }

        rowsY = [];
        for (let j = 1; j < rows; j++) {
            rowsY.push((height / rows) * j);
        }

        isCustomGrid = false;
        if (slicingMode === 'grid') {
            gridModeText.textContent = "Chia đều";
            gridModeText.style.color = "var(--text-secondary)";
        }
    };

    // --- Parameter Control Events ---
    const handleParamsChange = (e) => {
        if (slicingMode === 'grid' && e && (e.target.id === 'input-rows' || e.target.id === 'input-cols')) {
            resetGridToEven();
        }

        if (currentImage) {
            let minCellSize = Infinity;

            if (slicingMode === 'grid') {
                const cols = parseInt(inputCols.value) || 1;
                let prevX = 0;
                for (let i = 0; i <= colsX.length; i++) {
                    const curX = (i === colsX.length) ? currentImage.naturalWidth : colsX[i];
                    minCellSize = Math.min(minCellSize, curX - prevX);
                    prevX = curX;
                }
                let prevY = 0;
                for (let j = 0; j <= rowsY.length; j++) {
                    const curY = (j === rowsY.length) ? currentImage.naturalHeight : rowsY[j];
                    minCellSize = Math.min(minCellSize, curY - prevY);
                    prevY = curY;
                }
            } else {
                if (selectionBoxes.length > 0) {
                    selectionBoxes.forEach(box => {
                        minCellSize = Math.min(minCellSize, box.w, box.h);
                    });
                } else {
                    minCellSize = 100;
                }
            }

            const maxAllowedOffset = Math.max(0, Math.floor(minCellSize / 2) - 1);
            inputOffset.max = maxAllowedOffset;
            if (parseInt(inputOffset.value) > maxAllowedOffset) {
                inputOffset.value = maxAllowedOffset;
            }
        }
        
        if (offsetNumberVal) {
            offsetNumberVal.max = inputOffset.max;
            if (parseInt(offsetNumberVal.value) > parseInt(inputOffset.max)) {
                offsetNumberVal.value = inputOffset.max;
            }
            if (offsetNumberVal.value !== inputOffset.value) {
                offsetNumberVal.value = inputOffset.value;
            }
        }
        if (currentImage) {
            drawLiveGrid();
        }
    };

    inputRows.addEventListener('input', handleParamsChange);
    inputCols.addEventListener('input', handleParamsChange);
    inputOffset.addEventListener('input', handleParamsChange);

    // --- Smart Snapping Logic Helpers ---
    const SNAP_THRESHOLD = 8; // pixel trên ảnh gốc

    function applyMoveSnapping(newX, newY, boxW, boxH, boxIdx) {
        snapGuides = [];
        if (!isSnapEnabled || !currentImage) return { x: newX, y: newY };

        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;
        
        let snappedX = newX;
        let snappedY = newY;
        let snapDiffX = Infinity;
        let snapDiffY = Infinity;

        // --- SNAP TRỤC X ---
        // 1. Snap với biên ảnh gốc
        if (Math.abs(newX) < SNAP_THRESHOLD) {
            snappedX = 0;
            snapDiffX = Math.abs(newX);
            snapGuides.push({ type: 'x', value: 0 });
        }
        if (Math.abs(newX + boxW - width) < SNAP_THRESHOLD && Math.abs(newX + boxW - width) < snapDiffX) {
            snappedX = width - boxW;
            snapDiffX = Math.abs(newX + boxW - width);
            snapGuides = snapGuides.filter(g => g.type !== 'x');
            snapGuides.push({ type: 'x', value: width });
        }

        // 2. Snap với các box khác
        selectionBoxes.forEach((other, idx) => {
            if (idx === boxIdx) return;

            const otherLeft = other.x;
            const otherRight = other.x + other.w;

            if (Math.abs(newX - otherLeft) < SNAP_THRESHOLD && Math.abs(newX - otherLeft) < snapDiffX) {
                snappedX = otherLeft;
                snapDiffX = Math.abs(newX - otherLeft);
                snapGuides = snapGuides.filter(g => g.type !== 'x');
                snapGuides.push({ type: 'x', value: otherLeft });
            }
            if (Math.abs(newX - otherRight) < SNAP_THRESHOLD && Math.abs(newX - otherRight) < snapDiffX) {
                snappedX = otherRight;
                snapDiffX = Math.abs(newX - otherRight);
                snapGuides = snapGuides.filter(g => g.type !== 'x');
                snapGuides.push({ type: 'x', value: otherRight });
            }
            if (Math.abs(newX + boxW - otherLeft) < SNAP_THRESHOLD && Math.abs(newX + boxW - otherLeft) < snapDiffX) {
                snappedX = otherLeft - boxW;
                snapDiffX = Math.abs(newX + boxW - otherLeft);
                snapGuides = snapGuides.filter(g => g.type !== 'x');
                snapGuides.push({ type: 'x', value: otherLeft });
            }
            if (Math.abs(newX + boxW - otherRight) < SNAP_THRESHOLD && Math.abs(newX + boxW - otherRight) < snapDiffX) {
                snappedX = otherRight - boxW;
                snapDiffX = Math.abs(newX + boxW - otherRight);
                snapGuides = snapGuides.filter(g => g.type !== 'x');
                snapGuides.push({ type: 'x', value: otherRight });
            }
        });

        // --- SNAP TRỤC Y ---
        // 1. Snap với biên ảnh gốc
        if (Math.abs(newY) < SNAP_THRESHOLD) {
            snappedY = 0;
            snapDiffY = Math.abs(newY);
            snapGuides.push({ type: 'y', value: 0 });
        }
        if (Math.abs(newY + boxH - height) < SNAP_THRESHOLD && Math.abs(newY + boxH - height) < snapDiffY) {
            snappedY = height - boxH;
            snapDiffY = Math.abs(newY + boxH - height);
            snapGuides = snapGuides.filter(g => g.type !== 'y');
            snapGuides.push({ type: 'y', value: height });
        }

        // 2. Snap với các box khác
        selectionBoxes.forEach((other, idx) => {
            if (idx === boxIdx) return;

            const otherTop = other.y;
            const otherBottom = other.y + other.h;

            if (Math.abs(newY - otherTop) < SNAP_THRESHOLD && Math.abs(newY - otherTop) < snapDiffY) {
                snappedY = otherTop;
                snapDiffY = Math.abs(newY - otherTop);
                snapGuides = snapGuides.filter(g => g.type !== 'y');
                snapGuides.push({ type: 'y', value: otherTop });
            }
            if (Math.abs(newY - otherBottom) < SNAP_THRESHOLD && Math.abs(newY - otherBottom) < snapDiffY) {
                snappedY = otherBottom;
                snapDiffY = Math.abs(newY - otherBottom);
                snapGuides = snapGuides.filter(g => g.type !== 'y');
                snapGuides.push({ type: 'y', value: otherBottom });
            }
            if (Math.abs(newY + boxH - otherTop) < SNAP_THRESHOLD && Math.abs(newY + boxH - otherTop) < snapDiffY) {
                snappedY = otherTop - boxH;
                snapDiffY = Math.abs(newY + boxH - otherTop);
                snapGuides = snapGuides.filter(g => g.type !== 'y');
                snapGuides.push({ type: 'y', value: otherTop });
            }
            if (Math.abs(newY + boxH - otherBottom) < SNAP_THRESHOLD && Math.abs(newY + boxH - otherBottom) < snapDiffY) {
                snappedY = otherBottom - boxH;
                snapDiffY = Math.abs(newY + boxH - otherBottom);
                snapGuides = snapGuides.filter(g => g.type !== 'y');
                snapGuides.push({ type: 'y', value: otherBottom });
            }
        });

        return { x: snappedX, y: snappedY };
    }

    function applyResizeSnapping(boxX, boxY, newW, newH, boxIdx) {
        snapGuides = [];
        if (!isSnapEnabled || !currentImage) return { w: newW, h: newH };

        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;

        let snappedW = newW;
        let snappedH = newH;
        let snapDiffX = Infinity;
        let snapDiffY = Infinity;

        const currentRight = boxX + newW;
        const currentBottom = boxY + newH;

        // --- SNAP TRỤC X ---
        // 1. Snap với biên phải ảnh gốc
        if (Math.abs(currentRight - width) < SNAP_THRESHOLD) {
            snappedW = width - boxX;
            snapDiffX = Math.abs(currentRight - width);
            snapGuides.push({ type: 'x', value: width });
        }

        // 2. Snap với các box khác
        selectionBoxes.forEach((other, idx) => {
            if (idx === boxIdx) return;

            const otherLeft = other.x;
            const otherRight = other.x + other.w;

            if (Math.abs(currentRight - otherLeft) < SNAP_THRESHOLD && Math.abs(currentRight - otherLeft) < snapDiffX) {
                snappedW = otherLeft - boxX;
                snapDiffX = Math.abs(currentRight - otherLeft);
                snapGuides = snapGuides.filter(g => g.type !== 'x');
                snapGuides.push({ type: 'x', value: otherLeft });
            }
            if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD && Math.abs(currentRight - otherRight) < snapDiffX) {
                snappedW = otherRight - boxX;
                snapDiffX = Math.abs(currentRight - otherRight);
                snapGuides = snapGuides.filter(g => g.type !== 'x');
                snapGuides.push({ type: 'x', value: otherRight });
            }
        });

        if (lockedRatio) {
            snappedH = snappedW / lockedRatio;
            if (boxY + snappedH > height) {
                snappedH = height - boxY;
                snappedW = snappedH * lockedRatio;
                snapGuides = [{ type: 'y', value: height }];
            }
            return { w: snappedW, h: snappedH };
        }

        // --- SNAP TRỤC Y ---
        // 1. Snap với biên dưới ảnh gốc
        if (Math.abs(currentBottom - height) < SNAP_THRESHOLD) {
            snappedH = height - boxY;
            snapDiffY = Math.abs(currentBottom - height);
            snapGuides.push({ type: 'y', value: height });
        }

        // 2. Snap với các box khác
        selectionBoxes.forEach((other, idx) => {
            if (idx === boxIdx) return;

            const otherTop = other.y;
            const otherBottom = other.y + other.h;

            if (Math.abs(currentBottom - otherTop) < SNAP_THRESHOLD && Math.abs(currentBottom - otherTop) < snapDiffY) {
                snappedH = otherTop - boxY;
                snapDiffY = Math.abs(currentBottom - otherTop);
                snapGuides = snapGuides.filter(g => g.type !== 'y');
                snapGuides.push({ type: 'y', value: otherTop });
            }
            if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD && Math.abs(currentBottom - otherBottom) < snapDiffY) {
                snappedH = otherBottom - boxY;
                snapDiffY = Math.abs(currentBottom - otherBottom);
                snapGuides = snapGuides.filter(g => g.type !== 'y');
                snapGuides.push({ type: 'y', value: otherBottom });
            }
        });

        return { w: snappedW, h: snappedH };
    }

    // --- Mouse Coordinate Utilities ---
    const getNaturalCoords = (clientX, clientY) => {
        const rect = previewCanvas.getBoundingClientRect();
        
        const canvasW = rect.width;
        const canvasH = rect.height;
        const imgRatio = currentImage.naturalWidth / currentImage.naturalHeight;
        const canvasRatio = canvasW / canvasH;
        
        let actualRenderedW = canvasW;
        let actualRenderedH = canvasH;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
            actualRenderedW = canvasH * imgRatio;
            offsetX = (canvasW - actualRenderedW) / 2;
        } else {
            actualRenderedH = canvasW / imgRatio;
            offsetY = (canvasH - actualRenderedH) / 2;
        }

        const relativeX = clientX - rect.left - offsetX;
        const relativeY = clientY - rect.top - offsetY;

        const scaleX = currentImage.naturalWidth / actualRenderedW;
        const scaleY = currentImage.naturalHeight / actualRenderedH;

        const canvasX = relativeX * scaleX;
        const canvasY = relativeY * scaleY;

        const imgX = (canvasX - panX) / zoomScale;
        const imgY = (canvasY - panY) / zoomScale;

        return { 
            x: imgX, 
            y: imgY, 
            scaleX: scaleX / zoomScale, 
            scaleY: scaleY / zoomScale 
        };
    };

    // --- Grid Mode: Find Nearest Line ---
    const findNearestGridLine = (clientX, clientY) => {
        if (!currentImage) return null;
        
        const coords = getNaturalCoords(clientX, clientY);
        const imgX = coords.x;
        const imgY = coords.y;
        
        const toleranceX = dragTolerancePx * coords.scaleX;
        const toleranceY = dragTolerancePx * coords.scaleY;

        let nearestCol = -1;
        let minDistX = toleranceX;
        let nearestRow = -1;
        let minDistY = toleranceY;

        for (let i = 0; i < colsX.length; i++) {
            const dist = Math.abs(imgX - colsX[i]);
            if (dist < minDistX) {
                minDistX = dist;
                nearestCol = i;
            }
        }

        for (let j = 0; j < rowsY.length; j++) {
            const dist = Math.abs(imgY - rowsY[j]);
            if (dist < minDistY) {
                minDistY = dist;
                nearestRow = j;
            }
        }

        if (nearestCol !== -1 && nearestRow !== -1) {
            return (minDistX < minDistY) 
                ? { type: 'col', index: nearestCol } 
                : { type: 'row', index: nearestRow };
        } else if (nearestCol !== -1) {
            return { type: 'col', index: nearestCol };
        } else if (nearestRow !== -1) {
            return { type: 'row', index: nearestRow };
        }

        return null;
    };

    // --- Box Mode: Check Cursor Hover Target ---
    const getBoxInteractionTarget = (imgX, imgY, scaleX, scaleY) => {
        for (let i = selectionBoxes.length - 1; i >= 0; i--) {
            const box = selectionBoxes[i];
            
            // 1. Check Delete button
            const delX = box.x + box.w;
            const delY = box.y;
            const delToleranceX = (deleteBtnSize / 2) * scaleX;
            const delToleranceY = (deleteBtnSize / 2) * scaleY;
            if (Math.abs(imgX - delX) <= delToleranceX && Math.abs(imgY - delY) <= delToleranceY) {
                return { boxIndex: i, actionType: 'delete' };
            }

            // 2. Check Resize handle
            const handleX = box.x + box.w;
            const handleY = box.y + box.h;
            const resToleranceX = boxHandleSize * scaleX;
            const resToleranceY = boxHandleSize * scaleY;
            if (Math.abs(imgX - handleX) <= resToleranceX && Math.abs(imgY - handleY) <= resToleranceY) {
                return { boxIndex: i, actionType: 'resize-br' };
            }
            
            // 3. Check Inside box
            if (imgX >= box.x && imgX <= box.x + box.w && imgY >= box.y && imgY <= box.y + box.h) {
                return { boxIndex: i, actionType: 'move' };
            }
        }
        return null;
    };

    // --- Canvas Mouse Listeners ---
    previewCanvas.addEventListener('mousemove', (e) => {
        if (!currentImage) return;

        if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            panStart = { x: e.clientX, y: e.clientY };

            const rect = previewCanvas.getBoundingClientRect();
            const scaleX = currentImage.naturalWidth / rect.width;
            const scaleY = currentImage.naturalHeight / rect.height;

            panX += dx * scaleX;
            panY += dy * scaleY;
            drawLiveGrid();
            return;
        }

        if (spacePressed) {
            previewCanvas.style.cursor = 'grab';
            return;
        }

        const coords = getNaturalCoords(e.clientX, e.clientY);
        const imgX = coords.x;
        const imgY = coords.y;

        if (slicingMode === 'grid') {
            if (dragTarget) {
                let deltaX = imgX - lastDragMouseX;
                let deltaY = imgY - lastDragMouseY;
                if (e.altKey) {
                    deltaX *= 0.15; // Hãm chậm 6.6 lần khi giữ Alt
                    deltaY *= 0.15;
                }

                if (dragTarget.type === 'col') {
                    const idx = dragTarget.index;
                    const minLimit = (idx === 0) ? 0 : colsX[idx - 1];
                    const maxLimit = (idx === colsX.length - 1) ? currentImage.naturalWidth : colsX[idx + 1];
                    colsX[idx] = Math.max(minLimit + 20, Math.min(maxLimit - 20, colsX[idx] + deltaX));
                } else if (dragTarget.type === 'row') {
                    const idx = dragTarget.index;
                    const minLimit = (idx === 0) ? 0 : rowsY[idx - 1];
                    const maxLimit = (idx === rowsY.length - 1) ? currentImage.naturalHeight : rowsY[idx + 1];
                    rowsY[idx] = Math.max(minLimit + 20, Math.min(maxLimit - 20, rowsY[idx] + deltaY));
                }

                isCustomGrid = true;
                gridModeText.textContent = "Tùy chỉnh";
                gridModeText.style.color = "var(--accent)";
                drawLiveGrid();
            } else {
                const hoverTarget = findNearestGridLine(e.clientX, e.clientY);
                if (hoverTarget) {
                    previewCanvas.style.cursor = (hoverTarget.type === 'col') ? 'col-resize' : 'row-resize';
                } else {
                    previewCanvas.style.cursor = 'default';
                }
            }
        } else {
            if (isDrawingNewBox) {
                const lastBox = selectionBoxes[selectionBoxes.length - 1];
                const currentX = Math.max(0, Math.min(currentImage.naturalWidth, imgX));
                const currentY = Math.max(0, Math.min(currentImage.naturalHeight, imgY));

                lastBox.x = Math.min(newBoxStart.x, currentX);
                lastBox.y = Math.min(newBoxStart.y, currentY);
                
                const rawW = Math.abs(currentX - newBoxStart.x);
                let rawH = Math.abs(currentY - newBoxStart.y);

                if (lockedRatio) {
                    rawH = rawW / lockedRatio;
                }

                lastBox.w = rawW;
                lastBox.h = rawH;

                if (isUniformSize) {
                    selectionBoxes.forEach((box, index) => {
                        if (index < selectionBoxes.length - 1) {
                            box.w = rawW;
                            box.h = rawH;
                        }
                    });
                }

                drawLiveGrid();
            } else if (dragBoxTarget) {
                const box = selectionBoxes[dragBoxTarget.boxIndex];
                let deltaX = imgX - lastDragMouseX;
                let deltaY = imgY - lastDragMouseY;
                if (e.altKey) {
                    deltaX *= 0.15;
                    deltaY *= 0.15;
                }
                
                if (dragBoxTarget.actionType === 'move') {
                    let newX = box.x + deltaX;
                    let newY = box.y + deltaY;

                    // Áp dụng Smart Snap (Tạm tắt snap khi nhấn Alt để căn chỉnh chi tiết)
                    const snapped = e.altKey ? { x: newX, y: newY } : applyMoveSnapping(newX, newY, box.w, box.h, dragBoxTarget.boxIndex);
                    newX = snapped.x;
                    newY = snapped.y;

                    newX = Math.max(0, Math.min(currentImage.naturalWidth - box.w, newX));
                    newY = Math.max(0, Math.min(currentImage.naturalHeight - box.h, newY));

                    box.x = newX;
                    box.y = newY;
                } else if (dragBoxTarget.actionType === 'resize-br') {
                    let newW = box.w + deltaX;
                    let newH = box.h + deltaY;

                    if (lockedRatio) {
                        newH = newW / lockedRatio;
                    }

                    // Áp dụng Smart Snap (Tạm tắt snap khi nhấn Alt)
                    const snapped = e.altKey ? { w: newW, h: newH } : applyResizeSnapping(box.x, box.y, newW, newH, dragBoxTarget.boxIndex);
                    newW = snapped.w;
                    newH = snapped.h;

                    newW = Math.max(20, Math.min(currentImage.naturalWidth - box.x, newW));
                    if (lockedRatio) {
                        newH = newW / lockedRatio;
                        if (box.y + newH > currentImage.naturalHeight) {
                            newH = currentImage.naturalHeight - box.y;
                            newW = newH * lockedRatio;
                        }
                    } else {
                        newH = Math.max(20, Math.min(currentImage.naturalHeight - box.y, newH));
                    }

                    box.w = newW;
                    box.h = newH;

                    if (isUniformSize) {
                        selectionBoxes.forEach(b => {
                            b.w = newW;
                            b.h = newH;
                            if (b.x + b.w > currentImage.naturalWidth) b.x = currentImage.naturalWidth - b.w;
                            if (b.y + b.h > currentImage.naturalHeight) b.y = currentImage.naturalHeight - b.h;
                        });
                    }
                }
                drawLiveGrid();
            } else {
                const hover = getBoxInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
                if (hover) {
                    if (hover.actionType === 'delete') {
                        previewCanvas.style.cursor = 'pointer';
                    } else if (hover.actionType === 'resize-br') {
                        previewCanvas.style.cursor = 'nwse-resize';
                    } else {
                        previewCanvas.style.cursor = 'move';
                    }
                } else {
                    previewCanvas.style.cursor = 'crosshair';
                }
            }
        }

        // Cập nhật vị trí chuột cuối cùng cho frame tiếp theo
        lastDragMouseX = imgX;
        lastDragMouseY = imgY;
    });

    previewCanvas.addEventListener('mousedown', (e) => {
        if (!currentImage) return;

        if (spacePressed) {
            isPanning = true;
            previewCanvas.style.cursor = 'grabbing';
            panStart = { x: e.clientX, y: e.clientY };
            return;
        }

        const coords = getNaturalCoords(e.clientX, e.clientY);
        const imgX = coords.x;
        const imgY = coords.y;

        // Lưu trữ tọa độ chuột bắt đầu kéo
        lastDragMouseX = imgX;
        lastDragMouseY = imgY;

        if (slicingMode === 'grid') {
            const target = findNearestGridLine(e.clientX, e.clientY);
            if (target) {
                dragTarget = target;
            }
        } else {
            const interaction = getBoxInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
            
            if (interaction) {
                selectedBoxIdx = interaction.boxIndex;
                if (interaction.actionType === 'delete') {
                    selectionBoxes.splice(interaction.boxIndex, 1);
                    selectionBoxes.forEach((box, idx) => {
                        box.id = idx + 1;
                    });
                    nextBoxId = selectionBoxes.length + 1;
                    selectedBoxIdx = -1;
                    gridModeText.textContent = `Tự do (${selectionBoxes.length} khung)`;
                    handleParamsChange();
                    drawLiveGrid();
                } else {
                    const box = selectionBoxes[interaction.boxIndex];
                    dragBoxTarget = {
                        boxIndex: interaction.boxIndex,
                        actionType: interaction.actionType,
                        startX: imgX,
                        startY: imgY,
                        originalBox: { x: box.x, y: box.y, w: box.w, h: box.h }
                    };
                    drawLiveGrid(); // Redraw to show yellow highlight border
                }
            } else {
                selectedBoxIdx = -1;
                isDrawingNewBox = true;
                newBoxStart = { x: imgX, y: imgY };
                
                let initialW = 0;
                let initialH = 0;
                if (isUniformSize && selectionBoxes.length > 0) {
                    initialW = selectionBoxes[0].w;
                    initialH = selectionBoxes[0].h;
                }

                selectionBoxes.push({
                    id: nextBoxId++,
                    x: imgX,
                    y: imgY,
                    w: initialW,
                    h: initialH
                });
                selectedBoxIdx = selectionBoxes.length - 1;
                gridModeText.textContent = `Tự do (${selectionBoxes.length} khung)`;
                drawLiveGrid();
            }
        }
    });



    // --- Box Mode Control Panel Actions ---

    // --- Mouse Up Event Listener ---
    window.addEventListener('mouseup', () => {
        if (snapGuides.length > 0) {
            snapGuides = [];
            drawLiveGrid();
        }

        if (isPanning) {
            isPanning = false;
            previewCanvas.style.cursor = spacePressed ? 'grab' : 'default';
            return;
        }

        if (slicingMode === 'grid') {
            if (dragTarget) {
                dragTarget = null;
                handleParamsChange();
            }
        } else {
            if (isDrawingNewBox) {
                isDrawingNewBox = false;
                const lastBox = selectionBoxes[selectionBoxes.length - 1];
                if (lastBox.w < 10 || lastBox.h < 10) {
                    selectionBoxes.pop();
                    nextBoxId--;
                    gridModeText.textContent = `Tự do (${selectionBoxes.length} khung)`;
                }
                handleParamsChange();
            }
            if (dragBoxTarget) {
                dragBoxTarget = null;
                handleParamsChange();
            }
        }
    });

    // --- Photoshop-like Shortcut Listeners (Spacebar Pan, Zoom, Arrow nudge, Delete) ---

    // mouseleave to stop panning safely
    previewCanvas.addEventListener('mouseleave', () => {
        if (isPanning) {
            isPanning = false;
            previewCanvas.style.cursor = spacePressed ? 'grab' : 'default';
        }
    });

    // Touch support mapping for main canvas
    previewCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            previewCanvas.dispatchEvent(mouseEvent);
        }
    }, { passive: true });

    previewCanvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            // Ngăn chặn cuộn trang khi đang thao tác vẽ/kéo trên canvas
            if (typeof dragTarget !== 'undefined' && dragTarget || 
                typeof dragBoxTarget !== 'undefined' && dragBoxTarget || 
                typeof isDrawingNewBox !== 'undefined' && isDrawingNewBox || 
                typeof isPanning !== 'undefined' && isPanning) {
                e.preventDefault();
            }
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            previewCanvas.dispatchEvent(mouseEvent);
        }
    }, { passive: false });

    previewCanvas.addEventListener('touchend', (e) => {
        const mouseEvent = new MouseEvent('mouseup', {});
        window.dispatchEvent(mouseEvent);
    }, { passive: true });

    // Mouse Wheel Zoom Listener
    previewCanvas.addEventListener('wheel', (e) => {
        if (!currentImage) return;
        e.preventDefault();

        const rect = previewCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const canvasW = rect.width;
        const canvasH = rect.height;
        const imgRatio = currentImage.naturalWidth / currentImage.naturalHeight;
        const canvasRatio = canvasW / canvasH;

        let actualRenderedW = canvasW;
        let actualRenderedH = canvasH;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
            actualRenderedW = canvasH * imgRatio;
            offsetX = (canvasW - actualRenderedW) / 2;
        } else {
            actualRenderedH = canvasW / imgRatio;
            offsetY = (canvasH - actualRenderedH) / 2;
        }

        const relativeX = mouseX - offsetX;
        const relativeY = mouseY - offsetY;

        const scaleX = currentImage.naturalWidth / actualRenderedW;
        const scaleY = currentImage.naturalHeight / actualRenderedH;

        const canvasX = relativeX * scaleX;
        const canvasY = relativeY * scaleY;

        // Zoom factor: 1.15 for zoom in, 0.85 for zoom out
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        const newZoomScale = Math.max(0.05, Math.min(10.0, zoomScale * zoomFactor));

        // Adjust pan offsets to keep point under cursor stable
        panX = canvasX - (canvasX - panX) * (newZoomScale / zoomScale);
        panY = canvasY - (canvasY - panY) * (newZoomScale / zoomScale);
        zoomScale = newZoomScale;

        drawLiveGrid();
    }, { passive: false });

    // Programmatic Zoom Helper (Zoom from Center)
    const triggerProgrammaticZoom = (factor) => {
        if (!currentImage) return;
        const rect = previewCanvas.getBoundingClientRect();
        const mouseX = rect.width / 2;
        const mouseY = rect.height / 2;
        
        const imgRatio = currentImage.naturalWidth / currentImage.naturalHeight;
        const canvasW = rect.width;
        const canvasH = rect.height;
        const canvasRatio = canvasW / canvasH;

        let actualRenderedW = canvasW;
        let actualRenderedH = canvasH;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
            actualRenderedW = canvasH * imgRatio;
            offsetX = (canvasW - actualRenderedW) / 2;
        } else {
            actualRenderedH = canvasW / imgRatio;
            offsetY = (canvasH - actualRenderedH) / 2;
        }

        const relativeX = mouseX - offsetX;
        const relativeY = mouseY - offsetY;

        const scaleX = currentImage.naturalWidth / actualRenderedW;
        const scaleY = currentImage.naturalHeight / actualRenderedH;

        const canvasX = relativeX * scaleX;
        const canvasY = relativeY * scaleY;

        const newZoomScale = Math.max(0.05, Math.min(10.0, zoomScale * factor));

        panX = canvasX - (canvasX - panX) * (newZoomScale / zoomScale);
        panY = canvasY - (canvasY - panY) * (newZoomScale / zoomScale);
        zoomScale = newZoomScale;

        drawLiveGrid();
    };

    // Helper to change input grid values (rows/cols) via keyboard
    const changeGridValue = (inputId, delta) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        const min = parseInt(input.min) || 1;
        const max = parseInt(input.max) || 20;
        let val = parseInt(input.value) || 1;
        val = Math.max(min, Math.min(max, val + delta));
        input.value = val;
        input.dispatchEvent(new Event('input'));
    };

    // Global Key Shortcuts Listener
    window.addEventListener('keydown', (e) => {
        if (!currentImage) return;

        // Ignore shortcuts if user is typing in inputs or select options
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
            return;
        }

        // Toggle Keyboard Shortcuts Panel with '?'
        if (e.key === '?') {
            e.preventDefault();
            const popup = document.getElementById('shortcuts-popup');
            if (popup) popup.classList.toggle('active');
            return;
        }

        // Spacebar to Pan
        if (e.code === 'Space') {
            e.preventDefault();
            if (!spacePressed) {
                spacePressed = true;
                previewCanvas.style.cursor = 'grab';
            }
        }

        // 1 & 2 to Switch Mode
        if (e.key === '1') {
            e.preventDefault();
            if (modeGridBtn) modeGridBtn.click();
        } else if (e.key === '2') {
            e.preventDefault();
            if (modeBoxBtn) modeBoxBtn.click();
        }

        // Q or B to Toggle Sidebar
        if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'b') {
            e.preventDefault();
            if (btnToggleSidebar) btnToggleSidebar.click();
        }

        // C or Enter to Slice
        if ((e.key.toLowerCase() === 'c' || e.key === 'Enter') && !btnSlice.disabled) {
            e.preventDefault();
            btnSlice.click();
        }

        // Z to Download ZIP
        if (e.key.toLowerCase() === 'z' && !btnDownloadZip.disabled) {
            e.preventDefault();
            btnDownloadZip.click();
        }

        // + / = / - / 0 to Zoom
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            triggerProgrammaticZoom(1.15);
        } else if (e.key === '-') {
            e.preventDefault();
            triggerProgrammaticZoom(0.85);
        } else if (e.key === '0') {
            e.preventDefault();
            zoomScale = 1.0;
            panX = 0;
            panY = 0;
            drawLiveGrid();
        }

        // Grid mode controls (W/S/A/D or Arrows)
        if (slicingMode === 'grid') {
            if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
                e.preventDefault();
                changeGridValue('input-rows', 1);
            } else if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
                e.preventDefault();
                changeGridValue('input-rows', -1);
            } else if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
                e.preventDefault();
                changeGridValue('input-cols', 1);
            } else if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') {
                e.preventDefault();
                changeGridValue('input-cols', -1);
            }
        }

        // Box mode controls (W/S/A/D or Arrows to nudge box)
        if (slicingMode === 'box' && selectedBoxIdx !== -1) {
            const box = selectionBoxes[selectedBoxIdx];
            const step = e.shiftKey ? 10 : 1;

            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
                e.preventDefault();
                box.y = Math.max(0, box.y - step);
                drawLiveGrid();
            } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
                e.preventDefault();
                box.y = Math.min(currentImage.naturalHeight - box.h, box.y + step);
                drawLiveGrid();
            } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                e.preventDefault();
                box.x = Math.max(0, box.x - step);
                drawLiveGrid();
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                e.preventDefault();
                box.x = Math.min(currentImage.naturalWidth - box.w, box.x + step);
                drawLiveGrid();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                selectionBoxes.splice(selectedBoxIdx, 1);
                selectionBoxes.forEach((b, idx) => {
                    b.id = idx + 1;
                });
                nextBoxId = selectionBoxes.length + 1;
                selectedBoxIdx = -1;
                gridModeText.textContent = `Tự do (${selectionBoxes.length} khung)`;
                handleParamsChange();
                drawLiveGrid();
            }
        }

        // Global shortcuts for escape
        if (e.key === 'Escape') {
            selectedBoxIdx = -1;
            drawLiveGrid();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spacePressed = false;
            previewCanvas.style.cursor = isPanning ? 'grabbing' : 'default';
        }
    });

    // --- Box Mode Control Panel Actions ---

    // --- Handle Image Selection & Load ---
    function handleImageSelection(file) {
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP,...)');
            return;
        }

        fileName.textContent = file.name || 'Ảnh từ Clipboard';
        fileSize.textContent = file.size ? `(${(file.size / 1024).toFixed(1)} KB)` : '';
        dropzonePrompt.style.display = 'none';
        fileInfo.style.display = 'flex';
        dropzone.classList.add('has-image');
        appContent.classList.add('has-image');

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;
                
                // Reset zoom & pan for new image
                zoomScale = 1.0;
                panX = 0;
                panY = 0;
                selectedBoxIdx = -1;
                
                canvasPlaceholder.style.display = 'none';
                previewCanvas.style.display = 'block';
                imageMeta.style.display = 'flex';
                interactiveTip.style.display = 'flex';
                imgDimOriginal.textContent = `${img.naturalWidth} x ${img.naturalHeight} px`;
                
                btnSlice.disabled = false;
                btnAutoDetect.disabled = false;
                btnGenBoxes.disabled = false;
                btnClearBoxes.disabled = false;
                
                resetGridToEven();
                
                selectionBoxes = [];
                nextBoxId = 1;
                
                handleParamsChange();
                setSlicingMode(slicingMode);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }


    // --- Draw Live Preview Grid & Selection Boxes ---
    function drawLiveGrid() {
        if (!currentImage) return;

        previewCanvas.width = currentImage.naturalWidth;
        previewCanvas.height = currentImage.naturalHeight;

        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        const zoomText = document.getElementById('zoom-level-text');
        if (zoomText) {
            zoomText.textContent = `${Math.round(zoomScale * 100)}%`;
        }

        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(zoomScale, zoomScale);

        ctx.drawImage(currentImage, 0, 0);

        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;
        const offset = parseInt(inputOffset.value) || 0;

        if (slicingMode === 'grid') {
            const boundariesX = [0, ...colsX, width];
            const boundariesY = [0, ...rowsY, height];

            if (offset > 0) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
                for (let r = 0; r < boundariesY.length - 1; r++) {
                    for (let c = 0; c < boundariesX.length - 1; c++) {
                        const x1 = boundariesX[c];
                        const x2 = boundariesX[c + 1];
                        const y1 = boundariesY[r];
                        const y2 = boundariesY[r + 1];
                        const cellW = x2 - x1;
                        const cellH = y2 - y1;

                        ctx.fillRect(x1, y1, cellW, offset);
                        ctx.fillRect(x1, y2 - offset, cellW, offset);
                        ctx.fillRect(x1, y1 + offset, offset, cellH - (2 * offset));
                        ctx.fillRect(x2 - offset, y1 + offset, offset, cellH - (2 * offset));
                    }
                }
            }

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = Math.max(2, Math.floor(width / 600));
            ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
            colsX.forEach(x => {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            });

            rowsY.forEach(y => {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            });

            if (offset > 0) {
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = Math.max(1, Math.floor(width / 800));
                ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth * 2]);
                for (let r = 0; r < boundariesY.length - 1; r++) {
                    for (let c = 0; c < boundariesX.length - 1; c++) {
                        const sx = boundariesX[c] + offset;
                        const sy = boundariesY[r] + offset;
                        const sw = (boundariesX[c + 1] - boundariesX[c]) - (2 * offset);
                        const sh = (boundariesY[r + 1] - boundariesY[r]) - (2 * offset);
                        ctx.strokeRect(sx, sy, sw, sh);
                    }
                }
            }
        } else {
            selectionBoxes.forEach((box, idx) => {
                const x = box.x;
                const y = box.y;
                const w = box.w;
                const h = box.h;
                const isSelected = (idx === selectedBoxIdx);

                if (offset > 0 && w > 2 * offset && h > 2 * offset) {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
                    ctx.fillRect(x, y, w, offset);
                    ctx.fillRect(x, y + h - offset, w, offset);
                    ctx.fillRect(x, y + offset, offset, h - 2 * offset);
                    ctx.fillRect(x + w - offset, y + offset, offset, h - 2 * offset);
                }

                ctx.strokeStyle = isSelected ? '#eab308' : '#06b6d4';
                ctx.lineWidth = isSelected ? Math.max(3, Math.floor(width / 500)) : Math.max(2, Math.floor(width / 700));
                ctx.setLineDash(isSelected ? [8, 4] : []);
                ctx.strokeRect(x, y, w, h);
                
                ctx.fillStyle = isSelected ? 'rgba(234, 179, 8, 0.08)' : 'rgba(6, 182, 212, 0.12)';
                ctx.fillRect(x, y, w, h);

                if (offset > 0 && w > 2 * offset && h > 2 * offset) {
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = Math.max(1, Math.floor(width / 900));
                    ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth * 2]);
                    ctx.strokeRect(x + offset, y + offset, w - 2 * offset, h - 2 * offset);
                }

                const badgeRadius = Math.max(12, Math.floor(width / 80));
                ctx.fillStyle = isSelected ? '#eab308' : '#0b0f19';
                ctx.beginPath();
                ctx.arc(x + badgeRadius + 6, y + badgeRadius + 6, badgeRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = isSelected ? '#0b0f19' : '#06b6d4';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = isSelected ? '#0b0f19' : '#f3f4f6';
                ctx.font = `bold ${Math.round(badgeRadius * 1.1)}px var(--font-sans)`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(box.id, x + badgeRadius + 6, y + badgeRadius + 6);

                const handleSz = Math.max(6, Math.floor(width / 150));
                ctx.fillStyle = isSelected ? '#eab308' : '#06b6d4';
                ctx.fillRect(x + w - handleSz, y + h - handleSz, handleSz, handleSz);
                ctx.strokeStyle = '#0b0f19';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + w - handleSz, y + h - handleSz, handleSz, handleSz);

                const delSz = Math.max(7, Math.floor(width / 130));
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(x + w, y, delSz, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = '#0b0f19';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = '#0b0f19';
                ctx.font = `bold ${Math.round(delSz * 1.2)}px var(--font-sans)`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('×', x + w, y);
            });
        }

        // Vẽ Snap guides nét đứt màu hồng neon
        if (isSnapEnabled && snapGuides.length > 0) {
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = Math.max(1.5, Math.floor(width / 600));
            ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
            snapGuides.forEach(guide => {
                ctx.beginPath();
                if (guide.type === 'x') {
                    ctx.moveTo(guide.value, 0);
                    ctx.lineTo(guide.value, height);
                } else if (guide.type === 'y') {
                    ctx.moveTo(0, guide.value);
                    ctx.lineTo(width, guide.value);
                }
                ctx.stroke();
            });
        }

        ctx.restore();
    }

    // --- Smart Self-Adaptive Auto-Detect Grid Borders Algorithm ---

    // --- Smart Self-Adaptive Auto-Detect Grid Borders Algorithm ---
    btnAutoDetect.addEventListener('click', () => {
        if (!currentImage) return;

        const rows = parseInt(inputRows.value) || 1;
        const cols = parseInt(inputCols.value) || 1;
        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;

        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = width;
        hiddenCanvas.height = height;
        const hiddenCtx = hiddenCanvas.getContext('2d');
        hiddenCtx.drawImage(currentImage, 0, 0);

        try {
            const imgData = hiddenCtx.getImageData(0, 0, width, height);
            const pixels = imgData.data;

            // Đếm pixel sáng (trắng) và pixel tối (đen) trên từng hàng/cột
            const colWhiteCount = new Array(width).fill(0);
            const colBlackCount = new Array(width).fill(0);
            const rowWhiteCount = new Array(height).fill(0);
            const rowBlackCount = new Array(height).fill(0);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const r = pixels[idx];
                    const g = pixels[idx + 1];
                    const b = pixels[idx + 2];
                    
                    // Pixel sáng (vạch phân cách trắng)
                    if (r > 225 && g > 225 && b > 225) {
                        colWhiteCount[x]++;
                        rowWhiteCount[y]++;
                    }
                    // Pixel tối (vạch phân cách đen)
                    else if (r < 35 && g < 35 && b < 35) {
                        colBlackCount[x]++;
                        rowBlackCount[y]++;
                    }
                }
            }

            // Quyết định chế độ quét phân cách sáng hay tối dựa trên số lượng nổi bật
            const totalWhiteCols = colWhiteCount.reduce((a, b) => a + b, 0);
            const totalBlackCols = colBlackCount.reduce((a, b) => a + b, 0);
            const useWhiteCols = totalWhiteCols >= totalBlackCols;

            const totalWhiteRows = rowWhiteCount.reduce((a, b) => a + b, 0);
            const totalBlackRows = rowBlackCount.reduce((a, b) => a + b, 0);
            const useWhiteRows = totalWhiteRows >= totalBlackRows;

            const targetColCounts = useWhiteCols ? colWhiteCount : colBlackCount;
            const targetRowCounts = useWhiteRows ? rowWhiteCount : rowBlackCount;

            // Tìm điểm số cao nhất cho cột & hàng
            let maxColScore = 0;
            for (let i = 0; i < targetColCounts.length; i++) {
                if (targetColCounts[i] > maxColScore) maxColScore = targetColCounts[i];
            }

            let maxRowScore = 0;
            for (let j = 0; j < targetRowCounts.length; j++) {
                if (targetRowCounts[j] > maxRowScore) maxRowScore = targetRowCounts[j];
            }

            // Tính toán ngưỡng động (Dynamic Threshold)
            // Cột/Hàng phải có ít nhất 40% kích thước ảnh trùng màu và đạt 75% điểm số cao nhất
            const colThreshold = Math.max(height * 0.4, maxColScore * 0.75);
            const rowThreshold = Math.max(width * 0.4, maxRowScore * 0.75);

            // Hàm trích xuất dải phân cách
            const extractSeparators = (counts, threshold, maxLen) => {
                const separators = [];
                let inSeparator = false;
                let separatorStart = 0;

                for (let idx = 0; idx < maxLen; idx++) {
                    const isSepLine = counts[idx] >= threshold;
                    if (isSepLine) {
                        if (!inSeparator) {
                            inSeparator = true;
                            separatorStart = idx;
                        }
                    } else {
                        if (inSeparator) {
                            inSeparator = false;
                            const separatorEnd = idx - 1;
                            const center = Math.round((separatorStart + separatorEnd) / 2);
                            const widthOfSeparator = separatorEnd - separatorStart + 1;
                            
                            // Bỏ qua dải phân cách sát lề biên ảnh (dưới 3% kích thước ảnh)
                            const margin = maxLen * 0.03;
                            if (center > margin && center < maxLen - margin) {
                                separators.push({
                                    center: center,
                                    width: widthOfSeparator
                                });
                            }
                        }
                    }
                }

                if (inSeparator) {
                    const center = Math.round((separatorStart + maxLen - 1) / 2);
                    const margin = maxLen * 0.03;
                    if (center < maxLen - margin) {
                        separators.push({ center: center, width: maxLen - separatorStart });
                    }
                }

                return separators;
            };

            let detectedCols = extractSeparators(targetColCounts, colThreshold, width);
            let detectedRows = extractSeparators(targetRowCounts, rowThreshold, height);

            // --- Bộ lọc khử nhiễu tự động (Dynamic Noise Filtering) ---
            // Không yêu cầu truyền vào số lượng cần phát hiện trước mà tự nhận định
            const filterSeparatorsDynamic = (seps, maxLen) => {
                if (seps.length === 0) return [];
                
                // Ưu tiên các dải phân cách có độ rộng lớn hơn (rãnh cắt thực tế của ảnh)
                const sortedByWidth = [...seps].sort((a, b) => b.width - a.width);

                const result = [];
                // Khoảng cách tối thiểu giữa 2 đường lưới là 10% chiều dài ảnh để loại bỏ vạch nhiễu
                const minDistance = maxLen * 0.10; 

                for (let i = 0; i < sortedByWidth.length; i++) {
                    const candidate = sortedByWidth[i];
                    const isTooClose = result.some(selected => Math.abs(selected.center - candidate.center) < minDistance);
                    if (!isTooClose) {
                        result.push(candidate);
                    }
                }
                
                // Sắp xếp lại tọa độ tăng dần từ trái sang phải hoặc từ trên xuống dưới
                return result.sort((a, b) => a.center - b.center);
            };

            const filteredCols = filterSeparatorsDynamic(detectedCols, width);
            const filteredRows = filterSeparatorsDynamic(detectedRows, height);

            const hasDetectedCols = filteredCols.length > 0;
            const hasDetectedRows = filteredRows.length > 0;

            let finalCols = [];
            let finalRows = [];
            let finalColsCount = 1;
            let finalRowsCount = 1;

            if (hasDetectedCols || hasDetectedRows) {
                // Nếu phát hiện được bất kỳ dải phân cách dọc hoặc ngang nào
                finalCols = filteredCols.map(item => item.center);
                finalRows = filteredRows.map(item => item.center);
                finalColsCount = filteredCols.length + 1;
                finalRowsCount = filteredRows.length + 1;
            } else {
                // Fallback: Chia đều theo số lượng hàng/cột hiện tại trên ô nhập liệu
                const currentRows = parseInt(inputRows.value) || 1;
                const currentCols = parseInt(inputCols.value) || 1;
                finalColsCount = currentCols;
                finalRowsCount = currentRows;

                for (let i = 1; i < currentCols; i++) {
                    finalCols.push((width / currentCols) * i);
                }
                for (let j = 1; j < currentRows; j++) {
                    finalRows.push((height / currentRows) * j);
                }
            }

            // Tự động nhận diện độ rộng trung bình của các dải rãnh phân cách
            let recommendedOffset = 0;
            if (hasDetectedCols || hasDetectedRows) {
                let totalWidth = 0;
                let count = 0;
                filteredCols.forEach(c => { totalWidth += c.width; count++; });
                filteredRows.forEach(r => { totalWidth += r.width; count++; });
                if (count > 0) {
                    const avgWidth = totalWidth / count;
                    // Lùi vào thêm 1px để sạch sẽ mép viền hoàn toàn
                    recommendedOffset = Math.round(avgWidth / 2) + 1;
                }
            }

            // Cập nhật thông số lên ô nhập liệu trên giao diện
            inputCols.value = finalColsCount;
            inputRows.value = finalRowsCount;

            colsX = finalCols;
            rowsY = finalRows;
            
            isCustomGrid = true;
            gridModeText.textContent = "Tự động căn (Auto-Detect)";
            gridModeText.style.color = "var(--success)";

            // Gọi handleParamsChange lần đầu để vẽ lưới và tính toán maxAllowedOffset dựa trên minCellSize
            handleParamsChange();

            // Áp dụng offset tự động
            if (recommendedOffset > 0) {
                let minCellSize = Infinity;
                let prevX = 0;
                for (let i = 0; i <= colsX.length; i++) {
                    const curX = (i === colsX.length) ? width : colsX[i];
                    minCellSize = Math.min(minCellSize, curX - prevX);
                    prevX = curX;
                }
                let prevY = 0;
                for (let j = 0; j <= rowsY.length; j++) {
                    const curY = (j === rowsY.length) ? height : rowsY[j];
                    minCellSize = Math.min(minCellSize, curY - prevY);
                    prevY = curY;
                }
                const maxAllowedOffset = Math.max(0, Math.floor(minCellSize / 2) - 1);
                
                const finalOffset = Math.min(recommendedOffset, maxAllowedOffset);
                inputOffset.value = finalOffset;
                if (offsetNumberVal) {
                    offsetNumberVal.value = finalOffset;
                }
                
                // Gọi vẽ lại lần nữa để áp dụng Offset mới
                handleParamsChange();
            } else {
                inputOffset.value = 0;
                if (offsetNumberVal) {
                    offsetNumberVal.value = 0;
                }
                handleParamsChange();
            }
            
            previewCanvas.animate([
                { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' },
                { boxShadow: '0 0 25px var(--success)' },
                { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }
            ], {
                duration: 800,
                iterations: 1
            });

        } catch (error) {
            console.error("Auto detect failed: ", error);
            alert("Không thể quét ảnh tự động. Bạn vẫn có thể dùng chuột kéo thả trực tiếp các đường lưới màu xanh để căn chỉnh thủ công!");
        }
    });


    btnGenBoxes.addEventListener('click', () => {
        if (!currentImage) return;

        const rows = parseInt(inputRows.value) || 1;
        const cols = parseInt(inputCols.value) || 1;
        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;

        const cellW = width / cols;
        const cellH = height / rows;

        selectionBoxes = [];
        let boxId = 1;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                selectionBoxes.push({
                    id: boxId++,
                    x: c * cellW,
                    y: r * cellH,
                    w: cellW,
                    h: cellH
                });
            }
        }
        nextBoxId = boxId;
        gridModeText.textContent = `Tự do (${selectionBoxes.length} khung)`;
        
        handleParamsChange();
    });

    btnClearBoxes.addEventListener('click', () => {
        selectionBoxes = [];
        nextBoxId = 1;
        gridModeText.textContent = `Tự do (0 khung)`;
        handleParamsChange();
    });

    // --- Slice Image Implementation ---
    btnSlice.addEventListener('click', () => {
        if (!currentImage) return;

        const offset = parseInt(inputOffset.value) || 0;
        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;

        // Bắt đầu từ vị trí tiếp nối (số ảnh kết quả hiện tại)
        const startIndex = slicedImages.length;
        
        if (btnClearResults) btnClearResults.style.display = 'inline-flex';
        if (btnRenumberResults) btnRenumberResults.style.display = 'inline-flex';
        if (btnMobilePreview) btnMobilePreview.style.display = 'inline-flex';
        if (btnDownloadZip) btnDownloadZip.style.display = 'inline-flex';

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        if (slicingMode === 'grid') {
            const rows = parseInt(inputRows.value) || 1;
            const cols = parseInt(inputCols.value) || 1;
            const boundariesX = [0, ...colsX, width];
            const boundariesY = [0, ...rowsY, height];

            const firstCellW = boundariesX[1] - boundariesX[0];
            const firstCellH = boundariesY[1] - boundariesY[0];
            const currentTargetW = firstCellW - (2 * offset);
            const currentTargetH = firstCellH - (2 * offset);

            if (slicedImages.length === 0) {
                globalTargetW = currentTargetW;
                globalTargetH = currentTargetH;
            }

            const totalNewCells = rows * cols;
            let count = 1;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x1 = boundariesX[c];
                    const x2 = boundariesX[c + 1];
                    const y1 = boundariesY[r];
                    const y2 = boundariesY[r + 1];

                    const cellW = x2 - x1;
                    const cellH = y2 - y1;

                    const sx = x1 + offset;
                    const sy = y1 + offset;
                    const cropW = cellW - (2 * offset);
                    const cropH = cellH - (2 * offset);

                    if (cropW <= 0 || cropH <= 0) {
                        alert(`Kích thước ô [Hàng ${r+1}, Cột ${c+1}] sau khi xén viền nhỏ hơn 0. Hãy giảm Offset hoặc điều chỉnh đường lưới rộng hơn!`);
                        return;
                    }

                    const resultId = resultIdCounter++;
                    const sliceName = `slide_${startIndex + count}.png`;
                    processSlice(tempCanvas, tempCtx, sx, sy, cropW, cropH, sliceName, resultId, globalTargetW, globalTargetH);
                    count++;
                }
            }
        } else {
            if (selectionBoxes.length === 0) {
                alert('Vui lòng vẽ ít nhất 1 khung cắt tự do trên ảnh!');
                return;
            }

            const currentTargetW = selectionBoxes[0].w - (2 * offset);
            const currentTargetH = selectionBoxes[0].h - (2 * offset);

            if (slicedImages.length === 0) {
                globalTargetW = currentTargetW;
                globalTargetH = currentTargetH;
            }

            selectionBoxes.forEach((box, idx) => {
                const sx = box.x + offset;
                const sy = box.y + offset;
                const cropW = box.w - (2 * offset);
                const cropH = box.h - (2 * offset);

                if (cropW <= 0 || cropH <= 0) {
                    alert(`Kích thước Khung ${box.id} sau khi xén viền nhỏ hơn 0. Hãy giảm Offset hoặc co dãn khung lớn hơn!`);
                    return;
                }

                const resultId = resultIdCounter++;
                const sliceName = `slide_${startIndex + idx + 1}.png`;
                processSlice(tempCanvas, tempCtx, sx, sy, cropW, cropH, sliceName, resultId, globalTargetW, globalTargetH);
            });
        }

        const totalImages = slicedImages.length;
        resultCount.textContent = totalImages;
        if (resultCountBadge) {
            resultCountBadge.textContent = totalImages;
        }

        const colsCount = Math.min(4, Math.ceil(Math.sqrt(totalImages)));
        resultGrid.style.gridTemplateColumns = `repeat(${colsCount}, 1fr)`;

        tabBtnResult.disabled = false;
        switchTab('tab-result-grid');
    });

    function processSlice(tempCanvas, tempCtx, sx, sy, cropW, cropH, sliceName, resultId, targetW, targetH) {
        tempCanvas.width = targetW;
        tempCanvas.height = targetH;
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.clearRect(0, 0, targetW, targetH);

        // Vẽ toàn bộ vùng ảnh gốc trong ô lưới (cropW x cropH) lên Canvas con (targetW x targetH)
        // Trình duyệt sẽ tự động co giãn (nội suy phóng to/thu nhỏ) để lấp đầy vừa khít
        // mà hoàn toàn không cắt bớt bất kỳ pixel nào của ảnh gốc trong vùng lưới
        tempCtx.drawImage(currentImage, sx, sy, cropW, cropH, 0, 0, targetW, targetH);

        const dataUrl = tempCanvas.toDataURL('image/png');
        slicedImages.push({ id: resultId, name: sliceName, dataUrl: dataUrl });

        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.dataset.id = resultId;
        resultItem.setAttribute('draggable', 'true');
        resultItem.style.aspectRatio = `${targetW} / ${targetH}`;

        const grip = document.createElement('div');
        grip.classList.add('result-item-grip');
        grip.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
        resultItem.appendChild(grip);

        const btnDel = document.createElement('button');
        btnDel.classList.add('result-item-btn-del');
        btnDel.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        btnDel.title = `Xóa slide này`;
        btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            resultItem.remove();
            
            slicedImages = slicedImages.filter(item => item.id !== resultId);
            slicedBlobs = slicedBlobs.filter(item => item.id !== resultId);
            
            const total = slicedImages.length;
            resultCount.textContent = total;
            if (resultCountBadge) {
                resultCountBadge.textContent = total;
            }
            
            if (total === 0) {
                btnDownloadZip.disabled = true;
                if (btnDownloadZip) btnDownloadZip.style.display = 'none';
                if (btnClearResults) btnClearResults.style.display = 'none';
                if (btnRenumberResults) btnRenumberResults.style.display = 'none';
                if (btnMobilePreview) btnMobilePreview.style.display = 'none';
                globalTargetW = null;
                globalTargetH = null;
            } else {
                const colsCount = Math.min(4, Math.ceil(Math.sqrt(total)));
                resultGrid.style.gridTemplateColumns = `repeat(${colsCount}, 1fr)`;
            }
        });
        resultItem.appendChild(btnDel);

        const imgEl = document.createElement('img');
        imgEl.src = dataUrl;
        imgEl.classList.add('result-img');
        imgEl.alt = sliceName;
        resultItem.appendChild(imgEl);

        const nameContainer = document.createElement('div');
        nameContainer.classList.add('result-item-name-container');

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.classList.add('result-item-name-input');
        const baseName = sliceName.replace('.png', '');
        nameInput.value = baseName;
        nameInput.title = "Nhấp chuột hoặc nhấn Enter để đổi tên";
        
        nameInput.addEventListener('focus', () => {
            resultItem.setAttribute('draggable', 'false');
        });
        nameInput.addEventListener('blur', () => {
            resultItem.setAttribute('draggable', 'true');
            const newBaseName = nameInput.value.trim().replace(/[\\/:*?"<>|]/g, '');
            const newFullName = newBaseName ? `${newBaseName}.png` : sliceName;
            nameInput.value = newBaseName || baseName;
            
            const imgObj = slicedImages.find(item => item.id === resultId);
            if (imgObj) imgObj.name = newFullName;
            
            const blobObj = slicedBlobs.find(item => item.id === resultId);
            if (blobObj) blobObj.name = newFullName;
        });
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                nameInput.blur();
            }
        });

        const extSpan = document.createElement('span');
        extSpan.classList.add('result-item-ext');
        extSpan.textContent = '.png';

        nameContainer.appendChild(nameInput);
        nameContainer.appendChild(extSpan);
        resultItem.appendChild(nameContainer);

        const btnDl = document.createElement('button');
        btnDl.classList.add('result-item-btn-dl');
        btnDl.innerHTML = '<i class="fa-solid fa-download"></i>';
        btnDl.title = `Tải xuống slide này`;
        btnDl.addEventListener('click', () => {
            const a = document.createElement('a');
            const currentImgObj = slicedImages.find(item => item.id === resultId);
            const downloadName = currentImgObj ? currentImgObj.name : sliceName;
            a.href = dataUrl;
            a.download = downloadName;
            a.click();
        });
        resultItem.appendChild(btnDl);

        resultItem.addEventListener('dragstart', handleDragStart);
        resultItem.addEventListener('dragover', handleDragOver);
        resultItem.addEventListener('dragenter', handleDragEnter);
        resultItem.addEventListener('dragleave', handleDragLeave);
        resultItem.addEventListener('drop', handleDrop);
        resultItem.addEventListener('dragend', handleDragEnd);

        // Touch Drag & Drop for mobile
        let touchStartItem = null;
        let touchDragOverEl = null;

        resultItem.addEventListener('touchstart', (e) => {
            if (e.target.closest('.result-item-grip')) {
                touchStartItem = resultItem;
                resultItem.classList.add('dragging');
                e.preventDefault();
            }
        }, { passive: false });

        resultItem.addEventListener('touchmove', (e) => {
            if (!touchStartItem) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetItem = elementUnder ? elementUnder.closest('.result-item') : null;

            document.querySelectorAll('.result-item').forEach(item => {
                if (item !== targetItem) {
                    item.classList.remove('drag-over');
                }
            });

            if (targetItem && targetItem !== touchStartItem) {
                touchDragOverEl = targetItem;
                targetItem.classList.add('drag-over');
            } else {
                touchDragOverEl = null;
            }
        }, { passive: false });

        resultItem.addEventListener('touchend', (e) => {
            if (!touchStartItem) return;
            
            touchStartItem.classList.remove('dragging');
            
            if (touchDragOverEl && touchDragOverEl !== touchStartItem) {
                touchDragOverEl.classList.remove('drag-over');
                
                touchDragOverEl.parentNode.insertBefore(touchStartItem, touchDragOverEl);
                syncArraysOrder();
            }
            
            touchStartItem = null;
            touchDragOverEl = null;
        });

        resultGrid.appendChild(resultItem);

        tempCanvas.toBlob((blob) => {
            slicedBlobs.push({ id: resultId, name: sliceName, blob: blob });
            
            if (slicedBlobs.length === slicedImages.length) {
                btnDownloadZip.disabled = false;
            }
        }, 'image/png');
    }

    // --- Drag & Drop for Result Items ---
    let dragSourceEl = null;

    function handleDragStart(e) {
        this.classList.add('dragging');
        dragSourceEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.id);
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (dragSourceEl !== this) {
            const rect = this.getBoundingClientRect();
            const next = (e.clientX - rect.left) > (rect.width / 2);
            
            if (next) {
                this.parentNode.insertBefore(dragSourceEl, this.nextSibling);
            } else {
                this.parentNode.insertBefore(dragSourceEl, this);
            }
            
            syncArraysOrder();
        }
        return false;
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        document.querySelectorAll('.result-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    function syncArraysOrder() {
        const orderedIds = Array.from(resultGrid.children).map(el => parseInt(el.dataset.id));
        
        const newSlicedImages = [];
        const newSlicedBlobs = [];
        
        orderedIds.forEach(id => {
            const img = slicedImages.find(item => item.id === id);
            if (img) newSlicedImages.push(img);
            
            const blob = slicedBlobs.find(item => item.id === id);
            if (blob) newSlicedBlobs.push(blob);
        });
        
        slicedImages = newSlicedImages;
        slicedBlobs = newSlicedBlobs;
    }

    // --- ZIP Archiver ---
    btnDownloadZip.addEventListener('click', () => {
        if (slicedBlobs.length === 0) return;

        const originalBtnHtml = btnDownloadZip.innerHTML;
        btnDownloadZip.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang nén ZIP...';
        btnDownloadZip.disabled = true;

        const zip = new JSZip();
        slicedBlobs.forEach(item => {
            zip.file(item.name, item.blob);
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'carousel_sliced_images.zip';
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            btnDownloadZip.innerHTML = originalBtnHtml;
            btnDownloadZip.disabled = false;
        }).catch(err => {
            console.error('Lỗi khi nén ZIP:', err);
            alert('Không thể tạo file ZIP. Hãy tải về từng file ảnh thủ công.');
            btnDownloadZip.innerHTML = originalBtnHtml;
            btnDownloadZip.disabled = false;
        });
    });

    // --- Clear All Results ---
    if (btnClearResults) {
        btnClearResults.addEventListener('click', () => {
            const conf = confirm("Bạn có chắc chắn muốn xóa tất cả các slide ảnh kết quả hiện tại?");
            if (conf) {
                slicedImages = [];
                slicedBlobs = [];
                resultGrid.innerHTML = '';
                resultCount.textContent = '0';
                if (resultCountBadge) {
                    resultCountBadge.textContent = '0';
                }
                btnDownloadZip.disabled = true;
                if (btnDownloadZip) btnDownloadZip.style.display = 'none';
                if (btnClearResults) btnClearResults.style.display = 'none';
                if (btnRenumberResults) btnRenumberResults.style.display = 'none';
                if (btnMobilePreview) btnMobilePreview.style.display = 'none';
                globalTargetW = null;
                globalTargetH = null;
            }
        });
    }

    // --- Renumber Results ---
    if (btnRenumberResults) {
        btnRenumberResults.addEventListener('click', () => {
            if (slicedImages.length === 0) return;
            
            const conf = confirm("Bạn có chắc chắn muốn đổi tên và đánh số lại toàn bộ các slide kết quả hiện tại theo thứ tự từ 1 đến " + slicedImages.length + "?");
            if (!conf) return;

            // Đọc thứ tự thực tế trong DOM
            const orderedItems = Array.from(resultGrid.children);
            
            orderedItems.forEach((resultItem, index) => {
                const resultId = parseInt(resultItem.dataset.id);
                const newIndex = index + 1;
                const newName = `slide_${newIndex}.png`;
                const newBaseName = `slide_${newIndex}`;

                // Cập nhật giá trị hiển thị trong input
                const nameInput = resultItem.querySelector('.result-item-name-input');
                if (nameInput) {
                    nameInput.value = newBaseName;
                }

                // Cập nhật download tooltip
                const btnDl = resultItem.querySelector('.result-item-btn-dl');
                if (btnDl) {
                    btnDl.title = `Tải xuống ${newName}`;
                }

                // Cập nhật mảng slicedImages và slicedBlobs
                const imgObj = slicedImages.find(item => item.id === resultId);
                if (imgObj) {
                    imgObj.name = newName;
                }

                const blobObj = slicedBlobs.find(item => item.id === resultId);
                if (blobObj) {
                    blobObj.name = newName;
                }
            });

            // Đồng bộ lại thứ tự mảng tương ứng
            syncArraysOrder();

            alert("Đã tự động đánh số lại toàn bộ slide kết quả!");
        });
    }

    // --- Mobile Carousel Preview Logic ---
    if (btnMobilePreview && mobilePreviewModal) {
        btnMobilePreview.addEventListener('click', () => {
            if (slicedImages.length === 0) return;

            // Xóa sạch nội dung slider và dots cũ
            mobileCarouselSlider.innerHTML = '';
            mobileCarouselDots.innerHTML = '';

            // Lấy thứ tự thực tế trong DOM để hiển thị
            const orderedIds = Array.from(resultGrid.children).map(el => parseInt(el.dataset.id));
            
            orderedIds.forEach((id, index) => {
                const imgData = slicedImages.find(item => item.id === id);
                if (imgData) {
                    // Tạo slide element
                    const slide = document.createElement('div');
                    slide.classList.add('mobile-carousel-slide');
                    slide.dataset.index = index;

                    const img = document.createElement('img');
                    img.src = imgData.dataUrl;
                    img.alt = imgData.name;
                    slide.appendChild(img);

                    mobileCarouselSlider.appendChild(slide);

                    // Tạo dot element tương ứng
                    const dot = document.createElement('div');
                    dot.classList.add('mobile-carousel-dot');
                    if (index === 0) dot.classList.add('active');
                    dot.dataset.index = index;
                    
                    // Cho phép click dot để chuyển slide
                    dot.addEventListener('click', () => {
                        const sliderWidth = mobileCarouselSlider.clientWidth;
                        mobileCarouselSlider.scrollTo({
                            left: index * sliderWidth,
                            behavior: 'smooth'
                        });
                    });
                    
                    mobileCarouselDots.appendChild(dot);
                }
            });

            // Mở modal
            mobilePreviewModal.style.display = 'flex';
            
            // Focus vào slide đầu tiên
            mobileCarouselSlider.scrollLeft = 0;
            updateActiveDot(0);
        });
    }

    // Đóng modal
    if (btnCloseMobilePreview && mobilePreviewModal) {
        btnCloseMobilePreview.addEventListener('click', () => {
            mobilePreviewModal.style.display = 'none';
        });
    }
    
    // Đóng khi click ra ngoài container điện thoại
    if (mobilePreviewModal) {
        mobilePreviewModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('mobile-preview-modal') || e.target.classList.contains('mobile-preview-backdrop')) {
                mobilePreviewModal.style.display = 'none';
            }
        });
    }

    // Theo dõi scroll của slider để cập nhật active dot
    if (mobileCarouselSlider) {
        mobileCarouselSlider.addEventListener('scroll', () => {
            const sliderWidth = mobileCarouselSlider.clientWidth;
            const scrollLeft = mobileCarouselSlider.scrollLeft;
            const activeIndex = Math.round(scrollLeft / sliderWidth);
            updateActiveDot(activeIndex);
        });
    }

    function updateActiveDot(index) {
        const dots = mobileCarouselDots.querySelectorAll('.mobile-carousel-dot');
        if (dots.length > 0) {
            dots.forEach((dot, idx) => {
                if (idx === index) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }

    // Hỗ trợ kéo thả bằng chuột để vuốt slide (Mouse drag scroll)
    let isDown = false;
    let startX;
    let scrollLeft;

    if (mobileCarouselSlider) {
        mobileCarouselSlider.addEventListener('mousedown', (e) => {
            isDown = true;
            mobileCarouselSlider.classList.add('active');
            startX = e.pageX - mobileCarouselSlider.offsetLeft;
            scrollLeft = mobileCarouselSlider.scrollLeft;
        });
        
        mobileCarouselSlider.addEventListener('mouseleave', () => {
            isDown = false;
            mobileCarouselSlider.classList.remove('active');
        });
        
        mobileCarouselSlider.addEventListener('mouseup', () => {
            isDown = false;
            mobileCarouselSlider.classList.remove('active');
        });
        
        mobileCarouselSlider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - mobileCarouselSlider.offsetLeft;
            const walk = (x - startX) * 1.5; // tốc độ scroll
            mobileCarouselSlider.scrollLeft = scrollLeft - walk;
        });
    }

    // --- Toggle Sidebar logic ---
    if (btnToggleSidebar && appContent) {
        btnToggleSidebar.addEventListener('click', () => {
            const isCollapsed = appContent.classList.toggle('sidebar-collapsed');
            
            // Cập nhật icon và title cho nút
            const icon = btnToggleSidebar.querySelector('i');
            if (icon) {
                if (isCollapsed) {
                    icon.className = 'fa-solid fa-chevron-right';
                    btnToggleSidebar.title = 'Hiện thanh cấu hình';
                } else {
                    icon.className = 'fa-solid fa-chevron-left';
                    btnToggleSidebar.title = 'Ẩn thanh cấu hình';
                }
            }
            
            // Vẽ lại Grid/Canvas sau khi transition CSS hoàn tất (300ms)
            setTimeout(() => {
                drawLiveGrid();
            }, 300);
        });
    }

    // --- Reset Application State ---
    function resetApp() {
        fileInput.value = '';
        currentImage = null;
        dropzone.classList.remove('has-image');
        appContent.classList.remove('has-image');
        slicedImages = [];
        slicedBlobs = [];
        colsX = [];
        rowsY = [];
        selectionBoxes = [];
        nextBoxId = 1;
        isCustomGrid = false;
        
        // Reset Zoom & Pan
        zoomScale = 1.0;
        panX = 0;
        panY = 0;
        spacePressed = false;
        isPanning = false;
        selectedBoxIdx = -1;
        
        // Reset controls
        inputRows.value = 3;
        inputCols.value = 3;
        inputOffset.value = 0;
        if (offsetNumberVal) {
            offsetNumberVal.value = 0;
        }
        selectRatio.value = 'free';
        lockedRatio = null;
        switchUniform.checked = false;
        isUniformSize = false;
        if (switchSnap) {
            switchSnap.checked = true;
        }
        isSnapEnabled = true;
        resultIdCounter = 1;
        globalTargetW = null;
        globalTargetH = null;
        if (btnDownloadZip) btnDownloadZip.style.display = 'none';
        if (btnClearResults) btnClearResults.style.display = 'none';
        if (btnRenumberResults) btnRenumberResults.style.display = 'none';
        if (btnMobilePreview) btnMobilePreview.style.display = 'none';
        if (resultCountBadge) {
            resultCountBadge.textContent = '0';
        }
        
        // Reset panels visibility
        dropzonePrompt.style.display = 'flex';
        fileInfo.style.display = 'none';
        
        btnSlice.disabled = true;
        btnAutoDetect.disabled = true;
        btnGenBoxes.disabled = true;
        btnClearBoxes.disabled = true;
        btnDownloadZip.disabled = true;
        
        tabBtnResult.disabled = true;
        resultCount.textContent = '0';
        resultGrid.innerHTML = '';
        
        previewCanvas.style.display = 'none';
        imageMeta.style.display = 'none';
        interactiveTip.style.display = 'none';
        canvasPlaceholder.style.display = 'flex';
        
        switchTab('tab-live-grid');
        setSlicingMode('grid');
    }

    // Shortcuts Helper UI Click Listeners
    const btnShortcutsToggle = document.getElementById('btn-shortcuts-toggle');
    const btnCloseShortcuts = document.getElementById('btn-close-shortcuts');
    const shortcutsPopup = document.getElementById('shortcuts-popup');

    if (btnShortcutsToggle && shortcutsPopup) {
        btnShortcutsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            shortcutsPopup.classList.toggle('active');
        });
    }

    if (btnCloseShortcuts && shortcutsPopup) {
        btnCloseShortcuts.addEventListener('click', (e) => {
            e.stopPropagation();
            shortcutsPopup.classList.remove('active');
        });
    }

    // Đóng popup khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (shortcutsPopup && shortcutsPopup.classList.contains('active')) {
            if (!shortcutsPopup.contains(e.target) && e.target !== btnShortcutsToggle && !btnShortcutsToggle.contains(e.target)) {
                shortcutsPopup.classList.remove('active');
            }
        }
    });

    // ==========================================
    // AI Generator Panel Logic (GPT-4o + DALL-E 3)
    // ==========================================
    const btnCollapsibleAi = document.getElementById('btn-collapsible-ai');
    const aiSection = document.getElementById('ai-section');
    const aiApiKey = document.getElementById('ai-api-key');
    const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
    const aiCharacterMode = document.getElementById('ai-character-mode');
    const aiFaceUploadGroup = document.getElementById('ai-face-upload-group');
    const aiFaceInput = document.getElementById('ai-face-input');
    const faceUploadBox = document.getElementById('face-upload-box');
    const facePrompt = document.getElementById('face-prompt');
    const facePreviewContainer = document.getElementById('face-preview-container');
    const facePreview = document.getElementById('face-preview');
    const btnRemoveFace = document.getElementById('btn-remove-face');
    const aiSlideCount = document.getElementById('ai-slide-count');
    const aiArticle = document.getElementById('ai-article');
    const btnGenerateAi = document.getElementById('btn-generate-ai');
    const aiStatusContainer = document.getElementById('ai-status-container');
    const aiStatusText = document.getElementById('ai-status-text');

    let referenceFaceBase64 = null;

    // 1. Toggle Collapsible Section
    if (btnCollapsibleAi && aiSection) {
        btnCollapsibleAi.addEventListener('click', () => {
            aiSection.classList.toggle('active');
        });
    }

    // 2. Load API Key from localStorage
    if (aiApiKey) {
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            aiApiKey.value = savedKey;
        }
        aiApiKey.addEventListener('input', () => {
            localStorage.setItem('openai_api_key', aiApiKey.value.trim());
        });
    }

    // 3. Toggle API Key Visibility
    if (btnToggleKeyVisibility && aiApiKey) {
        btnToggleKeyVisibility.addEventListener('click', () => {
            const icon = btnToggleKeyVisibility.querySelector('i');
            if (aiApiKey.type === 'password') {
                aiApiKey.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                aiApiKey.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    // 4. Character Mode Change
    if (aiCharacterMode && aiFaceUploadGroup) {
        aiCharacterMode.addEventListener('change', () => {
            if (aiCharacterMode.value === 'reference') {
                aiFaceUploadGroup.style.display = 'block';
            } else {
                aiFaceUploadGroup.style.display = 'none';
            }
        });
    }

    // 5. Face Image Upload Handlers
    if (faceUploadBox && aiFaceInput) {
        faceUploadBox.addEventListener('click', (e) => {
            // Tránh click đúp nếu bấm vào nút remove
            if (e.target.id === 'btn-remove-face' || e.target.closest('#btn-remove-face')) {
                return;
            }
            aiFaceInput.click();
        });
    }

    if (aiFaceInput) {
        aiFaceInput.addEventListener('change', () => {
            if (aiFaceInput.files && aiFaceInput.files[0]) {
                const file = aiFaceInput.files[0];
                if (!file.type.startsWith('image/')) {
                    alert('Vui lòng chọn file hình ảnh hợp lệ!');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    referenceFaceBase64 = e.target.result; // Dạng data:image/png;base64,...
                    facePreview.src = referenceFaceBase64;
                    facePrompt.style.display = 'none';
                    facePreviewContainer.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnRemoveFace) {
        btnRemoveFace.addEventListener('click', (e) => {
            e.stopPropagation();
            referenceFaceBase64 = null;
            aiFaceInput.value = '';
            facePreview.src = '';
            facePreviewContainer.style.display = 'none';
            facePrompt.style.display = 'flex';
        });
    }

    // 6. Generate AI Carousel Trigger
    if (btnGenerateAi) {
        btnGenerateAi.addEventListener('click', async () => {
            const apiKey = aiApiKey.value.trim();
            if (!apiKey) {
                alert('Vui lòng nhập OpenAI API Key của bạn để sử dụng tính năng này!');
                aiSection.classList.add('active');
                aiApiKey.focus();
                return;
            }

            const articleText = aiArticle.value.trim();
            if (!articleText) {
                alert('Vui lòng nhập hoặc dán nội dung bài viết!');
                aiArticle.focus();
                return;
            }

            const cardCount = parseInt(aiSlideCount.value);
            const isReferenceMode = aiCharacterMode.value === 'reference';

            if (isReferenceMode && !referenceFaceBase64) {
                alert('Vui lòng tải lên ảnh khuôn mặt để làm nhân vật tham chiếu!');
                return;
            }

            // Lock UI
            btnGenerateAi.disabled = true;
            aiStatusContainer.style.display = 'flex';
            aiStatusText.textContent = 'Đang phân tích bài viết bằng GPT-4o...';

            try {
                // Bước 1: Gọi GPT-4o để viết lại DALL-E Prompt
                const dallEPrompt = await callGPT4oToWritePrompt(apiKey, articleText, cardCount, isReferenceMode, referenceFaceBase64);
                
                aiStatusText.textContent = 'Đang vẽ ảnh Carousel bằng DALL-E 3 (mất khoảng 20s)...';
                
                // Bước 2: Gọi DALL-E 3 để vẽ ảnh
                const imageUrl = await callDALLE3ToDrawImage(apiKey, dallEPrompt, cardCount);
                
                aiStatusText.textContent = 'Đang tải ảnh vào khung làm việc...';

                // Tải ảnh trực tiếp vào ứng dụng
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File([blob], `ai_carousel_${cardCount}s.png`, { type: 'image/png' });
                
                handleImageSelection(file);

                // Khóa chế độ tự động căn lưới tương ứng với số slide
                // 6 slide -> 3 hàng x 2 cột hoặc 2 hàng x 3 cột (theo DALL-E template 3:2 -> 3 cột x 2 hàng)
                // 9 slide -> 3 hàng x 3 cột
                // 12 slide -> 4 hàng x 3 cột (3:4 -> 3 cột x 4 hàng)
                // 15 slide -> 5 hàng x 3 cột (3:5 -> 3 cột x 5 hàng)
                let cols = 3;
                let rows = 3;
                if (cardCount === 6) {
                    cols = 3; rows = 2;
                } else if (cardCount === 9) {
                    cols = 3; rows = 3;
                } else if (cardCount === 12) {
                    cols = 3; rows = 4;
                } else if (cardCount === 15) {
                    cols = 3; rows = 5;
                }

                inputCols.value = cols;
                inputRows.value = rows;
                resetGridToEven();
                handleParamsChange();

                // Đóng panel AI sau khi tạo xong
                aiSection.classList.remove('active');
                alert('Đã tạo thành công Carousel bằng AI và tải vào lưới cắt! Bạn có thể nhấn nút "Tự động căn lưới" hoặc điều chỉnh lưới tùy ý, sau đó nhấn "Cắt ảnh".');

            } catch (error) {
                console.error(error);
                alert(`Lỗi khi tạo ảnh bằng AI: ${error.message || error}`);
            } finally {
                // Unlock UI
                btnGenerateAi.disabled = false;
                aiStatusContainer.style.display = 'none';
            }
        });
    }

    // Hàm gọi GPT-4o để viết Prompt DALL-E 3
    async function callGPT4oToWritePrompt(apiKey, article, cardCount, isReferenceMode, faceBase64) {
        const url = 'https://api.openai.com/v1/chat/completions';
        
        let systemPrompt = `TIKTOK CAROUSEL GENERATOR — DALL·E MASTER VERSION
ROLE
You are a professional TikTok Carousel Generator optimized specifically for DALL·E.
Your task is to receive an article, analyze it, and write a single highly-detailed prompt for DALL·E 3 to draw a carousel grid image with exactly ${cardCount} invisible crop zones.

CRITICAL RULES:
1. Zero gaps between slides. Absolute edge-to-edge layout. Do not create visible cards, borders, tiles, gutters or separators.
2. The image will contain exactly ${cardCount} zones:
   - 6 cards -> 3 columns x 2 rows (Aspect Ratio 3:2)
   - 9 cards -> 3 columns x 3 rows (Aspect Ratio 1:1)
   - 12 cards -> 3 columns x 4 rows (Aspect Ratio 3:4)
   - 15 cards -> 3 columns x 5 rows (Aspect Ratio 3:5)
3. Ensure every zone contains: Headline (max 8 words in Vietnamese), an illustration, and a visual focus. Nothing may cross into neighboring zones.
4. Maintain a single unified background system across the entire sheet. Background gradients or colors connect naturally.
5. Character design: You must define one single character (gender, age, hairstyle, hair color, shirt color, illustration style) and use this EXACT character in all zones.

OUTPUT FORMAT:
Provide ONLY the final prompt for DALL-E 3 in English. Do not write any other explanation, markdown formatting or introduction. Just output the prompt text directly.`;

        let messages = [
            { role: 'system', content: systemPrompt }
        ];

        if (isReferenceMode && faceBase64) {
            // Tách phần đầu base64
            const base64Data = faceBase64.split(',')[1];
            messages.push({
                role: 'user',
                content: [
                    { 
                        type: 'text', 
                        text: `Here is the user's face reference image. Write a DALL-E 3 prompt based on the following article. Important: Analyze the user's face appearance (gender, age, hairstyle, face shape, features) and write a detailed character description in the prompt to make DALL-E 3 draw a character matching this face identity consistently across all ${cardCount} panels.
                        
                        Article content:
                        ${article}` 
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${base64Data}`
                        }
                    }
                ]
            });
        } else {
            messages.push({
                role: 'user',
                content: `Write a DALL-E 3 prompt based on the following article for ${cardCount} panels:
                
                ${article}`
            });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Không thể gọi API GPT-4o.');
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // Hàm gọi DALL-E 3 để vẽ ảnh
    async function callDALLE3ToDrawImage(apiKey, prompt, cardCount) {
        const url = 'https://api.openai.com/v1/images/generations';
        
        // Ánh xạ kích thước DALL-E 3 tương ứng với số slide
        // DALL-E 3 chỉ hỗ trợ: 1024x1024 (1:1), 1792x1024 (ngang), 1024x1792 (dọc)
        let size = '1024x1024';
        if (cardCount === 6) {
            size = '1792x1024'; // Ảnh ngang (3:2 xấp xỉ)
        } else if (cardCount === 9) {
            size = '1024x1024'; // Ảnh vuông (1:1)
        } else if (cardCount === 12 || cardCount === 15) {
            size = '1024x1792'; // Ảnh dọc (3:4 hoặc 3:5 xấp xỉ)
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: size,
                quality: 'standard', // Để chạy nhanh và tiết kiệm, có thể để 'standard'. Muốn cực nét đổi thành 'hd'
                style: 'vivid' // Giúp ảnh có chiều sâu nghệ thuật và màu sắc bắt mắt hơn
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Không thể gọi API DALL-E 3.');
        }

        const data = await response.json();
        return data.data[0].url;
    }
});

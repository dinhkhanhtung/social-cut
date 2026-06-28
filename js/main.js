// --- Main Coordinator Module ---
import { elements, state, constants } from './state.js';
import { saveLocalProjectState, loadLocalProjectState, clearLocalProjectState } from './db.js';
import { drawWatermarkOnCtx } from './watermark.js';
import { autoDetectOptimalGrid } from './auto-detect.js';
import { showToast, showConfirm, switchTab, switchMobileTab, restoreResultGrid } from './ui-helpers.js';
import { initShortcuts } from './shortcuts.js';
import { downloadAllImages } from './download-helper.js';

// Destructure DOM Elements for local access
const {
    fileInput,
    dropzone,
    dropzonePrompt,
    fileInfo,
    btnRemoveFile,
    btnChangeFile,
    modeGridBtn,
    modeBoxBtn,
    controlsGridMode,
    controlsBoxMode,
    inputRows,
    inputCols,
    inputOffset,
    offsetNumberVal,
    selectRatio,
    ratioControlItem,
    selectGridType,
    gridTypeControlItem,
    gridEvenParameters,
    switchUniform,
    switchSnap,
    btnSlice,
    btnAutoDetect,
    btnGenBoxes,
    btnClearBoxes,
    btnDownloadZip,
    tabBtnLive,
    tabBtnResult,
    tabLiveGrid,
    tabResultGrid,
    canvasPlaceholder,
    previewCanvas,
    imageMeta,
    imgDimOriginal,
    imgDimCell,
    gridModeText,
    interactiveTip,
    tipText,
    resultCount,
    resultCountBadge,
    resultGrid,
    btnClearResults,
    btnRenumberResults,
    btnMobilePreview,
    mobilePreviewModal,
    btnCloseMobilePreview,
    mobileCarouselSlider,
    mobileCarouselDots,
    btnToggleSidebar,
    appContent,
    historyList,
    pcHistoryList,
    btnMobileHistoryViewToggle,
    btnPcHistoryViewToggle,
    passwordGate,
    btnUnlockApp,
    appPasswordInput,
    passwordErrorMessage,
    btnTogglePasswordVisibility,
    panelWatermark,
    headerWatermark,
    contentWatermark,
    switchWatermark,
    watermarkOptionsContainer,
    inputWatermarkText,
    selectWatermarkPosition,
    inputWatermarkSize,
    watermarkSizeVal,
    inputWatermarkOpacity,
    watermarkOpacityVal,
    selectWatermarkType,
    watermarkTextConfig,
    watermarkImageConfig,
    inputWatermarkImage,
    watermarkImagePreviewInfo,
    inputWatermarkImageScale,
    watermarkImageScaleVal,
    panelExportSettings,
    headerExportSettings,
    contentExportSettings,
    selectExportResolution,
    selectExportSharpness,
    selectExportFormat,
    containerExportQuality,
    inputExportQuality,
    exportQualityVal,
    sidebarAccountPanel,
    pcAuthPopup,
    btnCloseAuthPopup,
    pcLoggedOut,
    pcLoggedIn,
    pcUsername,
    mobileLoggedOut,
    mobileLoggedIn,
    mobileUsername,
    sidebarAccountName,
    sidebarAccountStatus,
    linkPcAuthSwitch,
    pcAuthTitle,
    btnPcAuthSubmit,
    pcAuthSwitchText,
    mobileNavUpload,
    mobileNavEdit,
    mobileNavResult,
    sidebar,
    btnMobileToggleParams
} = elements;

// Local file-scoped variables
const ctx = previewCanvas ? previewCanvas.getContext('2d') : null;
let gridLineColor = '#06b6d4';
let currentSlideIndex = 0;
let canvasBgMode = localStorage.getItem('canvas_bg_mode') || 'checkerboard';
let pcAuthMode = 'login';
let mobileAuthMode = 'login';

// Touch interaction variables
let touchStartDist = 0;
let startZoomScale = 1.0;
let startScrollLeft = 0;
let startScrollTop = 0;
let touchStartPanX = 0;
let touchStartPanY = 0;
let touchStartCenter = { x: 0, y: 0 };
let isPinching = false;
let cachedWrapperWidth = null;
let cachedWrapperHeight = null;
let cachedWrapperLeft = null;
let cachedWrapperTop = null;


// --- Smart Snapping Threshold ---
const SNAP_THRESHOLD = 8;

// --- Helper to get export scale factor based on resolution config ---
const getExportScale = (w) => {
    if (state.exportResolution === 'original') {
        return 1.0;
    }
    let targetMinW = 1080;
    if (state.exportResolution === '2k') {
        targetMinW = 2160;
    } else if (state.exportResolution === '4k') {
        targetMinW = 3840;
    }
    return w < targetMinW ? (targetMinW / w) : 1.0;
};

// --- Helper to toggle Sidebar Controls when Recutting ---
export const updateSidebarControlsState = () => {
    const isRecutting = (state.recutSlideId !== null);
    
    if (modeGridBtn) modeGridBtn.disabled = isRecutting;
    if (modeBoxBtn) modeBoxBtn.disabled = isRecutting;
    
    const modeSelector = document.querySelector('.mode-selector');
    if (modeSelector) {
        if (isRecutting) modeSelector.classList.add('disabled-controls');
        else modeSelector.classList.remove('disabled-controls');
    }

    if (inputRows) inputRows.disabled = isRecutting;
    if (inputCols) inputCols.disabled = isRecutting;
    if (inputOffset) inputOffset.disabled = isRecutting;
    if (selectRatio) selectRatio.disabled = isRecutting;
    if (selectGridType) selectGridType.disabled = isRecutting;
    
    const gridEvenParams = document.getElementById('grid-even-parameters');
    const gridTypeControl = document.getElementById('grid-type-control-item');
    const ratioControl = document.getElementById('ratio-control-item');
    
    [gridEvenParams, gridTypeControl, ratioControl].forEach(el => {
        if (el) {
            if (isRecutting) el.classList.add('disabled-controls');
            else el.classList.remove('disabled-controls');
        }
    });

    if (btnAutoDetect) btnAutoDetect.disabled = isRecutting;
    if (btnGenBoxes) btnGenBoxes.disabled = isRecutting;
    if (btnClearBoxes) btnClearBoxes.disabled = isRecutting;
    
    const boxActions = document.querySelector('.box-actions');
    if (boxActions) {
        if (isRecutting) boxActions.classList.add('disabled-controls');
        else boxActions.classList.remove('disabled-controls');
    }
    if (btnAutoDetect) {
        if (isRecutting) btnAutoDetect.classList.add('disabled-controls');
        else btnAutoDetect.classList.remove('disabled-controls');
    }

    if (fileInput) fileInput.disabled = isRecutting;
    if (btnRemoveFile) btnRemoveFile.disabled = isRecutting;
    if (dropzone) {
        if (isRecutting) dropzone.classList.add('disabled-controls');
        else dropzone.classList.remove('disabled-controls');
    }

    const importControls = [
        document.getElementById('btn-import-project'),
        document.getElementById('btn-pc-import-project')
    ];
    importControls.forEach(btn => {
        if (btn) {
            if (isRecutting) btn.classList.add('disabled-controls');
            else btn.classList.remove('disabled-controls');
        }
    });
};

// --- Slicing Mode Switcher ---
export const setSlicingMode = (mode) => {
    state.slicingMode = mode;
    if (mode === 'grid') {
        if (modeGridBtn) modeGridBtn.classList.add('active');
        if (modeBoxBtn) modeBoxBtn.classList.remove('active');
        if (controlsGridMode) controlsGridMode.classList.add('active');
        if (controlsBoxMode) controlsBoxMode.classList.remove('active');
        
        if (selectRatio) selectRatio.disabled = true;
        if (ratioControlItem) ratioControlItem.classList.add('disabled');

        if (selectGridType) selectGridType.disabled = false;
        if (gridTypeControlItem) gridTypeControlItem.classList.remove('disabled');

        if (state.currentImage) {
            if (btnAutoDetect) btnAutoDetect.style.display = 'flex';
            if (tipText) tipText.innerHTML = "Mẹo: Bạn có thể kéo thả các đường lưới màu xanh để thay đổi kích thước các ô.";
            if (gridModeText) {
                gridModeText.textContent = state.isCustomGrid ? "Tùy chỉnh" : "Chia đều";
                gridModeText.style.color = state.isCustomGrid ? "var(--accent)" : "var(--text-secondary)";
            }
        }
    } else {
        if (modeGridBtn) modeGridBtn.classList.remove('active');
        if (modeBoxBtn) modeBoxBtn.classList.add('active');
        if (controlsGridMode) controlsGridMode.classList.remove('active');
        if (controlsBoxMode) controlsBoxMode.classList.add('active');
        
        if (selectRatio) selectRatio.disabled = false;
        if (ratioControlItem) ratioControlItem.classList.remove('disabled');

        if (selectGridType) selectGridType.disabled = true;
        if (gridTypeControlItem) gridTypeControlItem.classList.add('disabled');

        if (state.currentImage) {
            if (btnAutoDetect) btnAutoDetect.style.display = 'none';
            if (tipText) tipText.innerHTML = "Mẹo: Nhấp kéo chuột trên ảnh để vẽ khung tự do.";
            if (gridModeText) {
                gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
                gridModeText.style.color = "var(--success)";
            }
        }
    }
    if (state.currentImage) {
        handleParamsChange();
    }
};

// --- Display Size & Positioning functions ---
export function updateCanvasDisplaySize(cachedW = null, cachedH = null) {
    if (!state.currentImage || !previewCanvas) return;
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (!canvasWrapper) return;

    const wrapperW = (cachedW !== null) ? cachedW : canvasWrapper.clientWidth;
    const wrapperH = (cachedH !== null) ? cachedH : canvasWrapper.clientHeight;

    if (wrapperH <= 0 || wrapperW <= 0) {
        return;
    }

    state.baseCanvasHeight = wrapperH;
    state.baseCanvasWidth = state.baseCanvasHeight * (state.currentImage.naturalWidth / state.currentImage.naturalHeight);

    const canvasW = Math.round(state.baseCanvasWidth * state.zoomScale);
    const canvasH = Math.round(state.baseCanvasHeight * state.zoomScale);

    previewCanvas.style.height = canvasH + 'px';
    previewCanvas.style.width = canvasW + 'px';

    canvasWrapper.style.justifyContent = 'flex-start';
    canvasWrapper.style.alignItems = 'flex-start';

    const marginX = Math.round(wrapperW * 0.5);
    const marginY = Math.round(wrapperH * 0.5);
    
    previewCanvas.style.margin = `${marginY}px ${marginX}px`;
}

export function centerCanvas() {
    if (!state.currentImage || !previewCanvas) return;
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (!canvasWrapper) return;
    
    updateCanvasDisplaySize();
    
    const _ = canvasWrapper.scrollWidth; // Force reflow
    
    const canvasW = Math.round(parseFloat(previewCanvas.style.width) || previewCanvas.clientWidth || 0);
    const canvasH = Math.round(parseFloat(previewCanvas.style.height) || previewCanvas.clientHeight || 0);
    
    canvasWrapper.scrollLeft = Math.round(canvasW * 0.5);
    canvasWrapper.scrollTop = Math.round(canvasH * 0.5);
}

export function focusOnRecutArea() {
    if (!state.currentImage || !previewCanvas || !state.recutTempCoords) return;
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (!canvasWrapper) return;

    const wrapperW = canvasWrapper.clientWidth;
    const wrapperH = canvasWrapper.clientHeight;
    if (wrapperW <= 0 || wrapperH <= 0) return;

    updateCanvasDisplaySize();

    const naturalWidth = state.currentImage.naturalWidth;
    const scale = (state.baseCanvasWidth * state.zoomScale) / naturalWidth;

    const centerX = state.recutTempCoords.sx + state.recutTempCoords.cropW / 2;
    const centerY = state.recutTempCoords.sy + state.recutTempCoords.cropH / 2;

    const canvasCenterX = centerX * scale;
    const canvasCenterY = centerY * scale;

    const marginX = Math.round(wrapperW * 0.5);
    const marginY = Math.round(wrapperH * 0.5);

    const targetScrollLeft = marginX + canvasCenterX - wrapperW / 2;
    const targetScrollTop = marginY + canvasCenterY - wrapperH / 2;

    canvasWrapper.scrollLeft = Math.round(targetScrollLeft);
    canvasWrapper.scrollTop = Math.round(targetScrollTop);
}

// --- Initialize Grid Lines (Evenly Distributed) ---
export const resetGridToEven = () => {
    if (!state.currentImage) return;
    
    const rows = parseInt(inputRows.value) || 1;
    const cols = parseInt(inputCols.value) || 1;
    const width = state.currentImage.naturalWidth;
    const height = state.currentImage.naturalHeight;

    state.colsX = [];
    for (let i = 1; i < cols; i++) {
        state.colsX.push((width / cols) * i);
    }

    state.rowsY = [];
    for (let j = 1; j < rows; j++) {
        state.rowsY.push((height / rows) * j);
    }

    state.isCustomGrid = false;
    if (state.slicingMode === 'grid') {
        if (gridModeText) {
            gridModeText.textContent = "Chia đều";
            gridModeText.style.color = "var(--text-secondary)";
        }
    }
};

// --- Update Grid Smartly (Keep custom spacing if custom grid) ---
const updateGridParamsSmart = (type) => {
    if (!state.currentImage) return;
    const width = state.currentImage.naturalWidth;
    const height = state.currentImage.naturalHeight;

    if (type === 'cols') {
        const cols = parseInt(inputCols.value) || 1;
        const targetLen = cols - 1;

        state.colsX.sort((a, b) => a - b);

        if (state.colsX.length > targetLen) {
            state.colsX.splice(targetLen);
        } else if (state.colsX.length < targetLen) {
            while (state.colsX.length < targetLen) {
                const temp = [0, ...state.colsX, width];
                let maxDist = -1;
                let insertIdx = -1;
                let insertVal = 0;

                for (let i = 0; i < temp.length - 1; i++) {
                    const dist = temp[i+1] - temp[i];
                    if (dist > maxDist) {
                        maxDist = dist;
                        insertIdx = i;
                        insertVal = Math.round((temp[i] + temp[i+1]) / 2);
                    }
                }

                if (insertIdx !== -1) {
                    state.colsX.push(insertVal);
                    state.colsX.sort((a, b) => a - b);
                } else {
                    break;
                }
            }
        }
    } else if (type === 'rows') {
        const rows = parseInt(inputRows.value) || 1;
        const targetLen = rows - 1;

        state.rowsY.sort((a, b) => a - b);

        if (state.rowsY.length > targetLen) {
            state.rowsY.splice(targetLen);
        } else if (state.rowsY.length < targetLen) {
            while (state.rowsY.length < targetLen) {
                const temp = [0, ...state.rowsY, height];
                let maxDist = -1;
                let insertIdx = -1;
                let insertVal = 0;

                for (let i = 0; i < temp.length - 1; i++) {
                    const dist = temp[i+1] - temp[i];
                    if (dist > maxDist) {
                        maxDist = dist;
                        insertIdx = i;
                        insertVal = Math.round((temp[i] + temp[i+1]) / 2);
                    }
                }

                if (insertIdx !== -1) {
                    state.rowsY.push(insertVal);
                    state.rowsY.sort((a, b) => a - b);
                } else {
                    break;
                }
            }
        }
    }
};

// --- Parameter Changes Handling ---
export const handleParamsChange = (e) => {
    if (state.slicingMode === 'grid' && e && (e.target.id === 'input-rows' || e.target.id === 'input-cols')) {
        if (state.isCustomGrid) {
            updateGridParamsSmart(e.target.id === 'input-rows' ? 'rows' : 'cols');
        } else {
            resetGridToEven();
        }
    }

    if (state.currentImage) {
        let minCellSize = Infinity;

        if (state.slicingMode === 'grid') {
            const cols = parseInt(inputCols.value) || 1;
            let prevX = 0;
            for (let i = 0; i <= state.colsX.length; i++) {
                const curX = (i === state.colsX.length) ? state.currentImage.naturalWidth : state.colsX[i];
                minCellSize = Math.min(minCellSize, curX - prevX);
                prevX = curX;
            }
            let prevY = 0;
            for (let j = 0; j <= state.rowsY.length; j++) {
                const curY = (j === state.rowsY.length) ? state.currentImage.naturalHeight : state.rowsY[j];
                minCellSize = Math.min(minCellSize, curY - prevY);
                prevY = curY;
            }
        } else {
            if (state.selectionBoxes.length > 0) {
                state.selectionBoxes.forEach(box => {
                    minCellSize = Math.min(minCellSize, box.w, box.h);
                });
            } else {
                minCellSize = 100;
            }
        }

        const maxAllowedOffset = Math.max(0, Math.floor(minCellSize / 2) - 1);
        if (inputOffset) {
            inputOffset.max = maxAllowedOffset;
            if (parseInt(inputOffset.value) > maxAllowedOffset) {
                inputOffset.value = maxAllowedOffset;
            }
        }
        if (offsetNumberVal) {
            offsetNumberVal.max = maxAllowedOffset;
            if (parseInt(offsetNumberVal.value) > maxAllowedOffset) {
                offsetNumberVal.value = maxAllowedOffset;
            }
            if (inputOffset && offsetNumberVal.value !== inputOffset.value) {
                offsetNumberVal.value = inputOffset.value;
            }
        }
    }
    
    if (state.currentImage) {
        drawLiveGrid();
    }
    if (!state.isApplyingHistoryState) {
        saveHistoryStateDebounced();
    }
    if (state.currentImage) {
        saveLocalProjectState();
    }
};

const handleManualInputChange = (e) => {
    resetToEvenGridType();
    handleParamsChange(e);
};

// --- Reset to Even Template Helper ---
export function resetToEvenGridType() {
    if (selectGridType) {
        const val = selectGridType.value;
        if (val === 'insta-square' || val === 'insta-portrait' || 
            val === 'fb-profile-cover' || val === 'fb-page-cover' || val === 'fb-group-cover' ||
            val === 'tiktok-carousel-916' || val === 'tiktok-carousel-34') {
            selectGridType.value = 'even';
            state.gridType = 'even';
            if (gridEvenParameters) {
                gridEvenParameters.style.display = (state.slicingMode === 'grid') ? 'grid' : 'none';
            }
        }
    }
}

// --- Smart Snapping Implementations ---
function applyMoveSnapping(newX, newY, boxW, boxH, boxIdx) {
    state.snapGuides = [];
    if (!state.isSnapEnabled || !state.currentImage) return { x: newX, y: newY };

    const width = state.currentImage.naturalWidth;
    const height = state.currentImage.naturalHeight;
    
    let snappedX = newX;
    let snappedY = newY;
    let snapDiffX = Infinity;
    let snapDiffY = Infinity;

    // --- SNAP TRỤC X ---
    if (Math.abs(newX) < SNAP_THRESHOLD) {
        snappedX = 0;
        snapDiffX = Math.abs(newX);
        state.snapGuides.push({ type: 'x', value: 0 });
    }
    if (Math.abs(newX + boxW - width) < SNAP_THRESHOLD && Math.abs(newX + boxW - width) < snapDiffX) {
        snappedX = width - boxW;
        snapDiffX = Math.abs(newX + boxW - width);
        state.snapGuides = state.snapGuides.filter(g => g.type !== 'x');
        state.snapGuides.push({ type: 'x', value: width });
    }

    state.selectionBoxes.forEach((other, idx) => {
        if (idx === boxIdx) return;

        const otherLeft = other.x;
        const otherRight = other.x + other.w;

        if (Math.abs(newX - otherLeft) < SNAP_THRESHOLD && Math.abs(newX - otherLeft) < snapDiffX) {
            snappedX = otherLeft;
            snapDiffX = Math.abs(newX - otherLeft);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'x');
            state.snapGuides.push({ type: 'x', value: otherLeft });
        }
        if (Math.abs(newX - otherRight) < SNAP_THRESHOLD && Math.abs(newX - otherRight) < snapDiffX) {
            snappedX = otherRight;
            snapDiffX = Math.abs(newX - otherRight);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'x');
            state.snapGuides.push({ type: 'x', value: otherRight });
        }
        if (Math.abs(newX + boxW - otherLeft) < SNAP_THRESHOLD && Math.abs(newX + boxW - otherLeft) < snapDiffX) {
            snappedX = otherLeft - boxW;
            snapDiffX = Math.abs(newX + boxW - otherLeft);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'x');
            state.snapGuides.push({ type: 'x', value: otherLeft });
        }
        if (Math.abs(newX + boxW - otherRight) < SNAP_THRESHOLD && Math.abs(newX + boxW - otherRight) < snapDiffX) {
            snappedX = otherRight - boxW;
            snapDiffX = Math.abs(newX + boxW - otherRight);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'x');
            state.snapGuides.push({ type: 'x', value: otherRight });
        }
    });

    // --- SNAP TRỤC Y ---
    if (Math.abs(newY) < SNAP_THRESHOLD) {
        snappedY = 0;
        snapDiffY = Math.abs(newY);
        state.snapGuides.push({ type: 'y', value: 0 });
    }
    if (Math.abs(newY + boxH - height) < SNAP_THRESHOLD && Math.abs(newY + boxH - height) < snapDiffY) {
        snappedY = height - boxH;
        snapDiffY = Math.abs(newY + boxH - height);
        state.snapGuides = state.snapGuides.filter(g => g.type !== 'y');
        state.snapGuides.push({ type: 'y', value: height });
    }

    state.selectionBoxes.forEach((other, idx) => {
        if (idx === boxIdx) return;

        const otherTop = other.y;
        const otherBottom = other.y + other.h;

        if (Math.abs(newY - otherTop) < SNAP_THRESHOLD && Math.abs(newY - otherTop) < snapDiffY) {
            snappedY = otherTop;
            snapDiffY = Math.abs(newY - otherTop);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'y');
            state.snapGuides.push({ type: 'y', value: otherTop });
        }
        if (Math.abs(newY - otherBottom) < SNAP_THRESHOLD && Math.abs(newY - otherBottom) < snapDiffY) {
            snappedY = otherBottom;
            snapDiffY = Math.abs(newY - otherBottom);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'y');
            state.snapGuides.push({ type: 'y', value: otherBottom });
        }
        if (Math.abs(newY + boxH - otherTop) < SNAP_THRESHOLD && Math.abs(newY + boxH - otherTop) < snapDiffY) {
            snappedY = otherTop - boxH;
            snapDiffY = Math.abs(newY + boxH - otherTop);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'y');
            state.snapGuides.push({ type: 'y', value: otherTop });
        }
        if (Math.abs(newY + boxH - otherBottom) < SNAP_THRESHOLD && Math.abs(newY + boxH - otherBottom) < snapDiffY) {
            snappedY = otherBottom - boxH;
            snapDiffY = Math.abs(newY + boxH - otherBottom);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'y');
            state.snapGuides.push({ type: 'y', value: otherBottom });
        }
    });

    return { x: snappedX, y: snappedY };
}

function applyResizeSnapping(boxX, boxY, newW, newH, boxIdx) {
    state.snapGuides = [];
    if (!state.isSnapEnabled || !state.currentImage) return { w: newW, h: newH };

    const width = state.currentImage.naturalWidth;
    const height = state.currentImage.naturalHeight;

    let snappedW = newW;
    let snappedH = newH;
    let snapDiffX = Infinity;
    let snapDiffY = Infinity;

    const currentRight = boxX + newW;
    const currentBottom = boxY + newH;

    // --- SNAP TRỤC X ---
    if (Math.abs(currentRight - width) < SNAP_THRESHOLD) {
        snappedW = width - boxX;
        snapDiffX = Math.abs(currentRight - width);
        state.snapGuides.push({ type: 'x', value: width });
    }

    state.selectionBoxes.forEach((other, idx) => {
        if (idx === boxIdx) return;

        const otherLeft = other.x;
        const otherRight = other.x + other.w;

        if (Math.abs(currentRight - otherLeft) < SNAP_THRESHOLD && Math.abs(currentRight - otherLeft) < snapDiffX) {
            snappedW = otherLeft - boxX;
            snapDiffX = Math.abs(currentRight - otherLeft);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'x');
            state.snapGuides.push({ type: 'x', value: otherLeft });
        }
        if (Math.abs(currentRight - otherRight) < SNAP_THRESHOLD && Math.abs(currentRight - otherRight) < snapDiffX) {
            snappedW = otherRight - boxX;
            snapDiffX = Math.abs(currentRight - otherRight);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'x');
            state.snapGuides.push({ type: 'x', value: otherRight });
        }
    });

    if (state.lockedRatio) {
        snappedH = snappedW / state.lockedRatio;
        if (boxY + snappedH > height) {
            snappedH = height - boxY;
            snappedW = snappedH * state.lockedRatio;
            state.snapGuides = [{ type: 'y', value: height }];
        }
        return { w: snappedW, h: snappedH };
    }

    // --- SNAP TRỤC Y ---
    if (Math.abs(currentBottom - height) < SNAP_THRESHOLD) {
        snappedH = height - boxY;
        snapDiffY = Math.abs(currentBottom - height);
        state.snapGuides.push({ type: 'y', value: height });
    }

    state.selectionBoxes.forEach((other, idx) => {
        if (idx === boxIdx) return;

        const otherTop = other.y;
        const otherBottom = other.y + other.h;

        if (Math.abs(currentBottom - otherTop) < SNAP_THRESHOLD && Math.abs(currentBottom - otherTop) < snapDiffY) {
            snappedH = otherTop - boxY;
            snapDiffY = Math.abs(currentBottom - otherTop);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'y');
            state.snapGuides.push({ type: 'y', value: otherTop });
        }
        if (Math.abs(currentBottom - otherBottom) < SNAP_THRESHOLD && Math.abs(currentBottom - otherBottom) < snapDiffY) {
            snappedH = otherBottom - boxY;
            snapDiffY = Math.abs(currentBottom - otherBottom);
            state.snapGuides = state.snapGuides.filter(g => g.type !== 'y');
            state.snapGuides.push({ type: 'y', value: otherBottom });
        }
    });

    return { w: snappedW, h: snappedH };
}

// --- Coordinate Conversions ---
const getNaturalCoords = (clientX, clientY) => {
    const rect = previewCanvas.getBoundingClientRect();
    
    const canvasW = rect.width;
    const canvasH = rect.height;
    const imgRatio = state.currentImage.naturalWidth / state.currentImage.naturalHeight;
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

    const scaleX = state.currentImage.naturalWidth / actualRenderedW;
    const scaleY = state.currentImage.naturalHeight / actualRenderedH;

    const imgX = relativeX * scaleX;
    const imgY = relativeY * scaleY;

    return { 
        x: imgX, 
        y: imgY, 
        scaleX: scaleX, 
        scaleY: scaleY 
    };
};

const findNearestGridLine = (clientX, clientY) => {
    if (!state.currentImage) return null;
    
    const coords = getNaturalCoords(clientX, clientY);
    const imgX = coords.x;
    const imgY = coords.y;
    
    const toleranceX = constants.dragTolerancePx * coords.scaleX;
    const toleranceY = constants.dragTolerancePx * coords.scaleY;

    let nearestCol = -1;
    let minDistX = toleranceX;
    let nearestRow = -1;
    let minDistY = toleranceY;

    for (let i = 0; i < state.colsX.length; i++) {
        const dist = Math.abs(imgX - state.colsX[i]);
        if (dist < minDistX) {
            minDistX = dist;
            nearestCol = i;
        }
    }

    for (let j = 0; j < state.rowsY.length; j++) {
        const dist = Math.abs(imgY - state.rowsY[j]);
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

const getBoxInteractionTarget = (imgX, imgY, scaleX, scaleY) => {
    for (let i = state.selectionBoxes.length - 1; i >= 0; i--) {
        const box = state.selectionBoxes[i];
        
        const delX = box.x + box.w;
        const delY = box.y;
        
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const toleranceMultiplier = isTouch ? 2.5 : 1.5;

        const delToleranceX = (constants.deleteBtnSize / 2) * scaleX * toleranceMultiplier;
        const delToleranceY = (constants.deleteBtnSize / 2) * scaleY * toleranceMultiplier;
        if (Math.abs(imgX - delX) <= delToleranceX && Math.abs(imgY - delY) <= delToleranceY) {
            return { boxIndex: i, actionType: 'delete' };
        }

        const handleX = box.x + box.w;
        const handleY = box.y + box.h;
        const resToleranceX = constants.boxHandleSize * scaleX * toleranceMultiplier;
        const resToleranceY = constants.boxHandleSize * scaleY * toleranceMultiplier;
        if (Math.abs(imgX - handleX) <= resToleranceX && Math.abs(imgY - handleY) <= resToleranceY) {
            return { boxIndex: i, actionType: 'resize-br' };
        }
        
        if (imgX >= box.x && imgX <= box.x + box.w && imgY >= box.y && imgY <= box.y + box.h) {
            return { boxIndex: i, actionType: 'move' };
        }
    }
    return null;
};

const getRecutInteractionTarget = (imgX, imgY, scaleX, scaleY) => {
    if (!state.recutTempCoords) return null;

    const { sx, sy, cropW, cropH } = state.recutTempCoords;
    const x1 = sx;
    const y1 = sy;
    const x2 = sx + cropW;
    const y2 = sy + cropH;

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const toleranceMultiplier = isTouch ? 2.5 : 1.5;
    const handleSize = 10;
    const toleranceX = handleSize * scaleX * toleranceMultiplier;
    const toleranceY = handleSize * scaleY * toleranceMultiplier;

    if (Math.abs(imgX - x1) <= toleranceX && Math.abs(imgY - y1) <= toleranceY) return 'tl';
    if (Math.abs(imgX - x2) <= toleranceX && Math.abs(imgY - y1) <= toleranceY) return 'tr';
    if (Math.abs(imgX - x1) <= toleranceX && Math.abs(imgY - y2) <= toleranceY) return 'bl';
    if (Math.abs(imgX - x2) <= toleranceX && Math.abs(imgY - y2) <= toleranceY) return 'br';

    if (Math.abs(imgX - x1) <= toleranceX && imgY >= y1 && imgY <= y2) return 'l';
    if (Math.abs(imgX - x2) <= toleranceX && imgY >= y1 && imgY <= y2) return 'r';
    if (Math.abs(imgY - y1) <= toleranceY && imgX >= x1 && imgX <= x2) return 't';
    if (Math.abs(imgY - y2) <= toleranceY && imgX >= x1 && imgX <= x2) return 'b';

    if (imgX >= x1 && imgX <= x2 && imgY >= y1 && imgY <= y2) return 'move';

    return null;
};

const getCanvasScale = () => {
    if (!state.currentImage || !previewCanvas) return { scaleX: 1, scaleY: 1 };
    const rect = previewCanvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { scaleX: 1, scaleY: 1 };
    
    const canvasW = rect.width;
    const canvasH = rect.height;
    const imgRatio = state.currentImage.naturalWidth / state.currentImage.naturalHeight;
    const canvasRatio = canvasW / canvasH;
    
    let actualRenderedW = canvasW;
    let actualRenderedH = canvasH;

    if (canvasRatio > imgRatio) {
        actualRenderedW = canvasH * imgRatio;
    } else {
        actualRenderedH = canvasW / imgRatio;
    }

    const scaleX = state.currentImage.naturalWidth / actualRenderedW;
    const scaleY = state.currentImage.naturalHeight / actualRenderedH;
    return { scaleX, scaleY };
};

const checkRecutButtonInteraction = (imgX, imgY) => {
    if (state.recutSlideId === null || !state.recutTempCoords) return null;

    const { scaleX, scaleY } = getCanvasScale();
    const { sx, sy, cropW, cropH } = state.recutTempCoords;
    const centerX = sx + cropW / 2;
    const btnRad = 24 * scaleX;
    const btnY = sy + cropH - 35 * scaleY;
    const confirmX = centerX + 35 * scaleX;
    const cancelX = centerX - 35 * scaleX;

    const distConfirm = Math.hypot(imgX - confirmX, imgY - btnY);
    const distCancel = Math.hypot(imgX - cancelX, imgY - btnY);

    const hitRad = 32 * scaleX;
    if (distConfirm <= hitRad) return 'confirm';
    if (distCancel <= hitRad) return 'cancel';

    return null;
};

// --- Custom Tooltip rendering ---
let customTooltipEl = document.getElementById('custom-tooltip');
if (!customTooltipEl) {
    customTooltipEl = document.createElement('div');
    customTooltipEl.id = 'custom-tooltip';
    customTooltipEl.className = 'custom-tooltip';
    document.body.appendChild(customTooltipEl);
}

const showCustomTooltip = (text, shortcut, x, y, targetEl = null) => {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    let contentHTML = `<span class="tooltip-text">${text}</span>`;
    if (shortcut) {
        let shortcutHTML = '';
        const keys = shortcut.split(/\s*(?:hoặc|[\/,;])\s*/i);
        if (keys.length > 0) {
            shortcutHTML = keys.map(k => `<kbd class="tooltip-key">${k.trim()}</kbd>`).join('<span class="tooltip-separator">/</span>');
        } else {
            shortcutHTML = `<kbd class="tooltip-key">${shortcut}</kbd>`;
        }
        contentHTML += `<span class="tooltip-shortcut-container">${shortcutHTML}</span>`;
    }

    customTooltipEl.innerHTML = contentHTML;
    customTooltipEl.classList.add('active');

    let top, left;
    if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = customTooltipEl.getBoundingClientRect();
        
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;

        if (top < 8) {
            top = rect.bottom + 8;
        }

        const minMargin = 8;
        if (left < minMargin) {
            left = minMargin;
        } else if (left + tooltipRect.width > window.innerWidth - minMargin) {
            left = window.innerWidth - tooltipRect.width - minMargin;
        }
        top += window.scrollY;
        left += window.scrollX;
    } else {
        const tooltipRect = customTooltipEl.getBoundingClientRect();
        top = y - tooltipRect.height - 15 + window.scrollY;
        left = x - tooltipRect.width / 2 + window.scrollX;

        const minMargin = 8;
        if (left < minMargin) {
            left = minMargin;
        } else if (left + tooltipRect.width > window.innerWidth - minMargin) {
            left = window.innerWidth - tooltipRect.width - minMargin;
        }
        if (top < window.scrollY + 8) {
            top = y + 15 + window.scrollY;
        }
    }

    customTooltipEl.style.top = `${top}px`;
    customTooltipEl.style.left = `${left}px`;
};

const hideCustomTooltip = () => {
    if (customTooltipEl) {
        customTooltipEl.classList.remove('active');
    }
};

const setupCustomTooltips = () => {
    document.querySelectorAll('[title]').forEach(el => {
        if (el.id === 'btn-pc-logout' || el.id === 'btn-mobile-logout' || el.classList.contains('btn-auth-logout')) {
            el.removeAttribute('title');
            return;
        }
        const title = el.getAttribute('title');
        if (!title) return;

        const match = title.match(/^([^(]+)(?:\((?:Phím|giữ)\s*([^)]+)\))?$/i);
        if (match) {
            const text = match[1].trim();
            const shortcut = match[2] ? match[2].trim() : null;
            el.setAttribute('data-tooltip', text);
            if (shortcut) {
                el.setAttribute('data-shortcut', shortcut);
            }
            el.removeAttribute('title');
        } else {
            el.setAttribute('data-tooltip', title);
            el.removeAttribute('title');
        }
    });
};

const initCustomTooltips = () => {
    setupCustomTooltips();

    let showTooltipTimeout = null;
    let hideTooltipTimeout = null;

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        clearTimeout(showTooltipTimeout);
        clearTimeout(hideTooltipTimeout);

        showTooltipTimeout = setTimeout(() => {
            const text = target.getAttribute('data-tooltip');
            const shortcut = target.getAttribute('data-shortcut');
            showCustomTooltip(text, shortcut, 0, 0, target);
        }, 150);
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        clearTimeout(showTooltipTimeout);
        clearTimeout(hideTooltipTimeout);

        hideTooltipTimeout = setTimeout(() => {
            hideCustomTooltip();
        }, 80);
    });

    const tooltipObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.hasAttribute('title')) {
                        const title = node.getAttribute('title');
                        const match = title.match(/^([^(]+)(?:\((?:Phím|giữ)\s*([^)]+)\))?$/i);
                        if (match) {
                            node.setAttribute('data-tooltip', match[1].trim());
                            if (match[2]) node.setAttribute('data-shortcut', match[2].trim());
                        } else {
                            node.setAttribute('data-tooltip', title);
                        }
                        node.removeAttribute('title');
                    }
                    node.querySelectorAll('[title]').forEach(el => {
                        const title = el.getAttribute('title');
                        const match = title.match(/^([^(]+)(?:\((?:Phím|giữ)\s*([^)]+)\))?$/i);
                        if (match) {
                            el.setAttribute('data-tooltip', match[1].trim());
                            if (match[2]) el.setAttribute('data-shortcut', match[2].trim());
                        } else {
                            el.setAttribute('data-tooltip', title);
                        }
                        el.removeAttribute('title');
                    });
                }
            });
        });
    });

    tooltipObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// --- Draw Live Preview Grid & Selection Boxes ---
export function drawLiveGrid() {
    if (!state.currentImage) return;

    updateCanvasDisplaySize();

    previewCanvas.width = state.currentImage.naturalWidth;
    previewCanvas.height = state.currentImage.naturalHeight;

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    const zoomText = document.getElementById('zoom-level-text');
    if (zoomText) {
        zoomText.textContent = `${Math.round(state.zoomScale * 100)}%`;
    }

    ctx.save();
    ctx.drawImage(state.currentImage, 0, 0);

    const width = state.currentImage.naturalWidth;
    const height = state.currentImage.naturalHeight;
    const offset = parseInt(inputOffset.value) || 0;

    if (state.slicingMode === 'grid') {
        let cells = [];
        if (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') {
            const boundariesX = [0, ...state.colsX, width];
            const boundariesY = [0, ...state.rowsY, height];
            const totalCols = boundariesX.length - 1;
            const totalRows = boundariesY.length - 1;
            
            for (let r = 0; r < totalRows; r++) {
                for (let c = 0; c < totalCols; c++) {
                    const x1 = boundariesX[c];
                    const x2 = boundariesX[c + 1];
                    const y1 = boundariesY[r];
                    const y2 = boundariesY[r + 1];
                    
                    cells.push({
                        x1: x1, y1: y1, x2: x2, y2: y2,
                        sx: x1 + offset,
                        sy: y1 + offset,
                        sw: (x2 - x1) - 2 * offset,
                        sh: (y2 - y1) - 2 * offset
                    });
                }
            }
        } else if (state.gridType === 'fb-1d3v') {
            const midX = width * 0.5;
            const h1 = height * (1/3);
            const h2 = height * (2/3);
            
            const leftCropW = midX - 2 * offset;
            const leftCropH = height - 2 * offset;
            const rightCropW = (width - midX) - 2 * offset;
            const rightCropH = h1 - 2 * offset;
            
            cells.push({ x1: 0, y1: 0, x2: midX, y2: height, sx: offset, sy: offset, sw: leftCropW, sh: leftCropH });
            cells.push({ x1: midX, y1: 0, x2: width, y2: h1, sx: midX + offset, sy: offset, sw: rightCropW, sh: rightCropH });
            cells.push({ x1: midX, y1: h1, x2: width, y2: h2, sx: midX + offset, sy: h1 + offset, sw: rightCropW, sh: rightCropH });
            cells.push({ x1: midX, y1: h2, x2: width, y2: height, sx: midX + offset, sy: h2 + offset, sw: rightCropW, sh: rightCropH });
        } else if (state.gridType === 'fb-1n3v') {
            const midY = height * 0.5;
            const w1 = width * (1/3);
            const w2 = width * (2/3);
            
            const topCropW = width - 2 * offset;
            const topCropH = midY - 2 * offset;
            const bottomCropW = w1 - 2 * offset;
            const bottomCropH = (height - midY) - 2 * offset;
            
            cells.push({ x1: 0, y1: 0, x2: width, y2: midY, sx: offset, sy: offset, sw: topCropW, sh: topCropH });
            cells.push({ x1: 0, y1: midY, x2: w1, y2: height, sx: offset, sy: midY + offset, sw: bottomCropW, sh: bottomCropH });
            cells.push({ x1: w1, y1: midY, x2: w2, y2: height, sx: w1 + offset, sy: midY + offset, sw: bottomCropW, sh: bottomCropH });
            cells.push({ x1: w2, y1: midY, x2: width, y2: height, sx: w2 + offset, sy: midY + offset, sw: bottomCropW, sh: bottomCropH });
        }

        if (offset > 0) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            cells.forEach(cell => {
                const { x1, y1, x2, y2, sx, sy, sw, sh } = cell;
                if (sw > 0 && sh > 0) {
                    if (sy > y1) ctx.fillRect(x1, y1, x2 - x1, sy - y1);
                    if (y2 > sy + sh) ctx.fillRect(x1, sy + sh, x2 - x1, y2 - (sy + sh));
                    if (sx > x1) ctx.fillRect(x1, sy, sx - x1, sh);
                    if (x2 > sx + sw) ctx.fillRect(sx + sw, sy, x2 - (sx + sw), sh);
                }
            });
        }

        ctx.strokeStyle = gridLineColor;
        ctx.lineWidth = Math.max(2, Math.floor(width / 600));
        ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
        
        if (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') {
            state.colsX.forEach(x => {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            });
            state.rowsY.forEach(y => {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            });
        } else if (state.gridType === 'fb-1d3v') {
            const midX = width * 0.5;
            const h1 = height * (1/3);
            const h2 = height * (2/3);
            
            ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(midX, h1); ctx.lineTo(width, h1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(midX, h2); ctx.lineTo(width, h2); ctx.stroke();
        } else if (state.gridType === 'fb-1n3v') {
            const midY = height * 0.5;
            const w1 = width * (1/3);
            const w2 = width * (2/3);
            
            ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(width, midY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w1, midY); ctx.lineTo(w1, height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w2, midY); ctx.lineTo(w2, height); ctx.stroke();
        }
    } else {
        state.selectionBoxes.forEach((box, idx) => {
            const isRecutting = (state.recutSlideId !== null && state.recutBoxId === box.id);
            if (isRecutting) return;

            const x = box.x;
            const y = box.y;
            const w = box.w;
            const h = box.h;
            const isSelected = (idx === state.selectedBoxIdx);

            if (offset > 0 && w > 2 * offset && h > 2 * offset) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
                ctx.fillRect(x, y, w, offset);
                ctx.fillRect(x, y + h - offset, w, offset);
                ctx.fillRect(x, y + offset, offset, h - 2 * offset);
                ctx.fillRect(x + w - offset, y + offset, offset, h - 2 * offset);
            }

            let boxStrokeColor = gridLineColor;
            if (isSelected) boxStrokeColor = '#eab308';

            ctx.strokeStyle = boxStrokeColor;
            ctx.lineWidth = isSelected ? Math.max(4, Math.floor(width / 450)) : Math.max(2, Math.floor(width / 700));
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
            ctx.strokeStyle = isSelected ? '#0b0f19' : gridLineColor;
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

    if (state.isSnapEnabled && state.snapGuides.length > 0) {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = Math.max(1.5, Math.floor(width / 600));
        ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
        state.snapGuides.forEach(guide => {
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

    const isWatermarkEnabled = switchWatermark && switchWatermark.checked;
    if (isWatermarkEnabled) {
        const type = selectWatermarkType ? selectWatermarkType.value : 'text';
        const position = selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right';
        const opacity = parseInt(inputWatermarkOpacity ? inputWatermarkOpacity.value : 50) || 50;
        const size = parseInt(inputWatermarkSize ? inputWatermarkSize.value : 24) || 24;
        const text = inputWatermarkText ? inputWatermarkText.value.trim() : '';
        const scalePercent = parseInt(inputWatermarkImageScale ? inputWatermarkImageScale.value : 20) || 20;

        if ((type === 'text' && text) || (type === 'image' && state.watermarkImageObj)) {
            const drawConf = {
                type: type,
                text: text,
                fontSize: size,
                imageObj: state.watermarkImageObj,
                scalePercent: scalePercent
            };

            if (state.slicingMode === 'grid') {
                let tempCells = [];
                if (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') {
                    const boundariesX = [0, ...state.colsX, width];
                    const boundariesY = [0, ...state.rowsY, height];
                    const totalCols = boundariesX.length - 1;
                    const totalRows = boundariesY.length - 1;
                    for (let r = 0; r < totalRows; r++) {
                        for (let c = 0; c < totalCols; c++) {
                            const x1 = boundariesX[c];
                            const x2 = boundariesX[c + 1];
                            const y1 = boundariesY[r];
                            const y2 = boundariesY[r + 1];
                            tempCells.push({
                                sx: x1 + offset,
                                sy: y1 + offset,
                                sw: (x2 - x1) - 2 * offset,
                                sh: (y2 - y1) - 2 * offset
                            });
                        }
                    }
                } else if (state.gridType === 'fb-1d3v') {
                    const midX = width * 0.5;
                    const h1 = height * (1/3);
                    const h2 = height * (2/3);
                    const leftCropW = midX - 2 * offset;
                    const leftCropH = height - 2 * offset;
                    const rightCropW = (width - midX) - 2 * offset;
                    const rightCropH = h1 - 2 * offset;
                    tempCells.push({ sx: offset, sy: offset, sw: leftCropW, sh: leftCropH });
                    tempCells.push({ sx: midX + offset, sy: offset, sw: rightCropW, sh: rightCropH });
                    tempCells.push({ sx: midX + offset, sy: h1 + offset, sw: rightCropW, sh: rightCropH });
                    tempCells.push({ sx: midX + offset, sy: h2 + offset, sw: rightCropW, sh: rightCropH });
                } else if (state.gridType === 'fb-1n3v') {
                    const midY = height * 0.5;
                    const w1 = width * (1/3);
                    const w2 = width * (2/3);
                    const topCropW = width - 2 * offset;
                    const topCropH = midY - 2 * offset;
                    const bottomCropW = w1 - 2 * offset;
                    const bottomCropH = (height - midY) - 2 * offset;
                    tempCells.push({ sx: offset, sy: offset, sw: topCropW, sh: topCropH });
                    tempCells.push({ sx: offset, sy: midY + offset, sw: bottomCropW, sh: bottomCropH });
                    tempCells.push({ sx: w1 + offset, sy: midY + offset, sw: bottomCropW, sh: bottomCropH });
                    tempCells.push({ sx: w2 + offset, sy: midY + offset, sw: bottomCropW, sh: bottomCropH });
                }
                
                tempCells.forEach(cell => {
                    if (cell.sw > 0 && cell.sh > 0) {
                        const cellConf = Object.assign({}, drawConf, {
                            cellX: cell.sx,
                            cellY: cell.sy,
                            cellW: cell.sw,
                            cellH: cell.sh
                        });
                        drawWatermarkOnCtx(ctx, position, opacity, cellConf);
                    }
                });
            } else {
                state.selectionBoxes.forEach(box => {
                    const cropW = box.w - (2 * offset);
                    const cropH = box.h - (2 * offset);
                    if (cropW > 0 && cropH > 0) {
                        const cellConf = Object.assign({}, drawConf, {
                            cellX: box.x + offset,
                            cellY: box.y + offset,
                            cellW: cropW,
                            cellH: cropH
                        });
                        drawWatermarkOnCtx(ctx, position, opacity, cellConf);
                    }
                });
            }
        }
    }

    if (state.recutSlideId !== null && state.recutTempCoords) {
        const { sx, sy, cropW, cropH } = state.recutTempCoords;

        const recutItem = state.slicedImages.find(item => item.id === state.recutSlideId);
        const isBoxModeRecut = (recutItem?.meta?.slicingMode === 'box');
        const recutColor = isBoxModeRecut ? '#10b981' : '#eab308';
        const recutBgColor = isBoxModeRecut ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)';

        ctx.save();
        ctx.strokeStyle = recutColor;
        ctx.lineWidth = Math.max(3, Math.floor(width / 350));
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(sx, sy, cropW, cropH);

        ctx.fillStyle = recutBgColor;
        ctx.fillRect(sx, sy, cropW, cropH);

        const handleSize = Math.max(8, Math.floor(width / 180));
        ctx.fillStyle = recutColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        const x1 = sx;
        const y1 = sy;
        const x2 = sx + cropW;
        const y2 = sy + cropH;
        const xm = sx + cropW / 2;
        const ym = sy + cropH / 2;

        const handles = [
            { x: x1, y: y1 }, { x: xm, y: y1 }, { x: x2, y: y1 },
            { x: x1, y: ym },                  { x: x2, y: ym },
            { x: x1, y: y2 }, { x: xm, y: y2 }, { x: x2, y: y2 }
        ];

        handles.forEach(h => {
            ctx.beginPath();
            ctx.arc(h.x, h.y, handleSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });

        const { scaleX, scaleY } = getCanvasScale();
        const centerX = sx + cropW / 2;
        const btnRad = 24 * scaleX;
        const btnY = sy + cropH - 35 * scaleY;
        const confirmX = centerX + 35 * scaleX;
        const cancelX = centerX - 35 * scaleX;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8 * scaleX;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4 * scaleY;

        ctx.beginPath(); ctx.arc(cancelX, btnY, btnRad, 0, 2 * Math.PI); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.lineWidth = 2.5 * scaleX; ctx.strokeStyle = gridLineColor; ctx.stroke();
        ctx.beginPath(); ctx.arc(confirmX, btnY, btnRad, 0, 2 * Math.PI); ctx.fillStyle = '#10b981'; ctx.fill(); ctx.lineWidth = 2.5 * scaleX; ctx.strokeStyle = gridLineColor; ctx.stroke();

        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.0 * scaleX;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cancelX - 7 * scaleX, btnY - 7 * scaleY); ctx.lineTo(cancelX + 7 * scaleX, btnY + 7 * scaleY);
        ctx.moveTo(cancelX + 7 * scaleX, btnY - 7 * scaleY); ctx.lineTo(cancelX - 7 * scaleX, btnY + 7 * scaleY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.0 * scaleX;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(confirmX - 8 * scaleX, btnY); ctx.lineTo(confirmX - 3 * scaleX, btnY + 7 * scaleY); ctx.lineTo(confirmX + 8 * scaleX, btnY - 7 * scaleY);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
}

// --- Crop & Process single slice ---
function processSlice(sx, sy, cropW, cropH, sliceName, resultId, targetW, targetH, meta = null) {
    const sliceCanvas = document.createElement('canvas');
    const sliceCtx = sliceCanvas.getContext('2d');

    sliceCanvas.width = targetW;
    sliceCanvas.height = targetH;
    if (targetW === cropW && targetH === cropH) {
        sliceCtx.imageSmoothingEnabled = false;
    } else {
        sliceCtx.imageSmoothingEnabled = true;
        sliceCtx.imageSmoothingQuality = 'high';
    }
    sliceCtx.clearRect(0, 0, targetW, targetH);

    if (state.exportSharpness !== 'off') {
        sliceCtx.filter = `url(#sharpen-${state.exportSharpness})`;
    } else {
        sliceCtx.filter = 'none';
    }

    sliceCtx.drawImage(state.currentImage, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
    sliceCtx.filter = 'none';

    const isWatermarkEnabled = switchWatermark && switchWatermark.checked;
    if (isWatermarkEnabled) {
        const type = selectWatermarkType ? selectWatermarkType.value : 'text';
        const position = selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right';
        const opacity = parseInt(inputWatermarkOpacity ? inputWatermarkOpacity.value : 50) || 50;
        const size = parseInt(inputWatermarkSize ? inputWatermarkSize.value : 24) || 24;
        const text = inputWatermarkText ? inputWatermarkText.value.trim() : '';
        const scalePercent = parseInt(inputWatermarkImageScale ? inputWatermarkImageScale.value : 20) || 20;

        if ((type === 'text' && text) || (type === 'image' && state.watermarkImageObj)) {
            const scaleFactor = targetW / cropW;
            const actualFontSize = Math.max(12, Math.round(size * scaleFactor));
            
            const cellConf = {
                type: type,
                text: text,
                fontSize: actualFontSize,
                imageObj: state.watermarkImageObj,
                scalePercent: scalePercent,
                cellX: 0,
                cellY: 0,
                cellW: targetW,
                cellH: targetH
            };
            drawWatermarkOnCtx(sliceCtx, position, opacity, cellConf);
        }
    }

    const mimeType = state.exportFormat === 'png' ? 'image/png' : (state.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/webp');
    const quality = state.exportFormat === 'png' ? undefined : state.exportQuality;
    const dataUrl = sliceCanvas.toDataURL(mimeType, quality);
    state.slicedImages.push({ 
        id: resultId, 
        name: sliceName, 
        dataUrl: dataUrl, 
        meta: meta,
        sliceParams: { sx, sy, cropW, cropH, targetW, targetH }
    });

    sliceCanvas.toBlob((blob) => {
        const blobObj = state.slicedBlobs.find(b => b.id === resultId);
        if (blobObj) {
            blobObj.blob = blob;
            blobObj.name = sliceName;
        } else {
            state.slicedBlobs.push({ id: resultId, name: sliceName, blob: blob });
        }
    }, mimeType, quality);
}

// --- Image file loading & selection logic ---
export function handleImageSelection(file) {
    if (!file.type.startsWith('image/')) {
        showToast('File ảnh không hợp lệ!', 'warning');
        return;
    }

    if (document.activeElement) {
        document.activeElement.blur();
    }

    state.currentOriginalFile = file;
    state.uploadedOriginalImageUrl = null;

    state.slicedImages = [];
    state.slicedBlobs = [];
    resultGrid.innerHTML = '';
    resultGrid.className = 'result-grid';
    resultCount.textContent = '0';
    if (resultCountBadge) {
        resultCountBadge.textContent = '0';
    }
    state.globalTargetW = null;
    state.globalTargetH = null;
    if (btnDownloadZip) {
        btnDownloadZip.disabled = true;
        btnDownloadZip.style.display = 'none';
    }
    if (btnClearResults) btnClearResults.style.display = 'none';
    if (btnRenumberResults) btnRenumberResults.style.display = 'none';
    if (btnMobilePreview) btnMobilePreview.style.display = 'none';

    dropzonePrompt.style.display = 'none';
    fileInfo.style.display = 'flex';
    dropzone.classList.add('has-image');
    appContent.classList.add('has-image');

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            state.currentImage = img;
            
            previewCanvas.style.visibility = 'hidden';
            previewCanvas.style.display = 'block';
            
            state.zoomScale = 1.0;
            state.baseCanvasWidth = 0;
            state.baseCanvasHeight = 0;
            state.panX = 0;
            state.panY = 0;
            state.selectedBoxIdx = -1;
            
            canvasPlaceholder.style.display = 'none';
            imageMeta.style.display = 'flex';
            interactiveTip.style.display = 'flex';
            imgDimOriginal.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
            
            btnSlice.disabled = false;
            if (btnAutoDetect) btnAutoDetect.disabled = false;
            btnGenBoxes.disabled = false;
            btnClearBoxes.disabled = false;
            
            resetGridToEven();
            
            state.selectionBoxes = [];
            state.nextBoxId = 1;
            
            if (mobileNavEdit) mobileNavEdit.classList.remove('disabled');
            if (mobileNavResult) mobileNavResult.classList.add('disabled');
            switchMobileTab('edit');
            
            handleParamsChange();
            setSlicingMode(state.slicingMode);
            initHistory();
            
            setTimeout(() => {
                updateCanvasDisplaySize();
                centerCanvas();
                drawLiveGrid();
                previewCanvas.style.visibility = 'visible';
                saveLocalProjectState();
            }, 30);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// --- getRecutSlideCoords ---
export function getRecutSlideCoords(recutItem) {
    if (!state.currentImage || !recutItem) return null;
    
    if (recutItem.meta.customCoords) {
        const cc = recutItem.meta.customCoords;
        return {
            sx: cc.sx,
            sy: cc.sy,
            cropW: cc.cropW,
            cropH: cc.cropH,
            x1: cc.sx,
            y1: cc.sy,
            x2: cc.sx + cc.cropW,
            y2: cc.sy + cc.cropH
        };
    }
    
    const offset = parseInt(inputOffset.value) || 0;
    const width = state.currentImage.naturalWidth;
    const height = state.currentImage.naturalHeight;

    let x1, y1, x2, y2, sx, sy, cropW, cropH;

    if (recutItem.meta.slicingMode === 'grid') {
        if (recutItem.meta.gridType === 'even' || recutItem.meta.gridType === 'insta-square' || recutItem.meta.gridType === 'insta-portrait' || recutItem.meta.gridType === 'tiktok-carousel-916' || recutItem.meta.gridType === 'tiktok-carousel-34') {
            const r = recutItem.meta.row;
            const c = recutItem.meta.col;

            if (state.colsX.length === 0 && state.rowsY.length === 0) {
                resetGridToEven();
            }

            const boundariesX = [0, ...state.colsX, width];
            const boundariesY = [0, ...state.rowsY, height];

            const safeC = Math.min(c, boundariesX.length - 2);
            const safeR = Math.min(r, boundariesY.length - 2);

            x1 = boundariesX[safeC];
            x2 = boundariesX[safeC + 1];
            y1 = boundariesY[safeR];
            y2 = boundariesY[safeR + 1];

            sx = x1 + offset;
            sy = y1 + offset;
            cropW = (x2 - x1) - 2 * offset;
            cropH = (y2 - y1) - 2 * offset;
        } else {
            const type = recutItem.meta.gridType;
            let gridCells = [];
            if (type === 'fb-1d3v') {
                const midX = width * 0.5;
                const h1 = height * (1/3);
                const h2 = height * (2/3);
                const leftCropW = midX - 2 * offset;
                const leftCropH = height - 2 * offset;
                const rightCropW = (width - midX) - 2 * offset;
                const rightCropH = h1 - 2 * offset;

                gridCells.push({ x1: 0, y1: 0, x2: midX, y2: height, sx: offset, sy: offset, cropW: leftCropW, cropH: leftCropH });
                gridCells.push({ x1: midX, y1: 0, x2: width, y2: h1, sx: midX + offset, sy: offset, cropW: rightCropW, cropH: rightCropH });
                gridCells.push({ x1: midX, y1: h1, x2: width, y2: h2, sx: midX + offset, sy: h1 + offset, cropW: rightCropW, cropH: rightCropH });
                gridCells.push({ x1: midX, y1: h2, x2: width, y2: height, sx: midX + offset, sy: h2 + offset, cropW: rightCropW, cropH: rightCropH });
            } else if (type === 'fb-1n3v') {
                const midY = height * 0.5;
                const w1 = width * (1/3);
                const w2 = width * (2/3);
                const topCropW = width - 2 * offset;
                const topCropH = midY - 2 * offset;
                const bottomCropW = w1 - 2 * offset;
                const bottomCropH = (height - midY) - 2 * offset;

                gridCells.push({ x1: 0, y1: 0, x2: width, y2: midY, sx: offset, sy: offset, cropW: topCropW, cropH: topCropH });
                gridCells.push({ x1: 0, y1: midY, x2: w1, y2: height, sx: offset, sy: midY + offset, cropW: bottomCropW, cropH: bottomCropH });
                gridCells.push({ x1: w1, y1: midY, x2: w2, y2: height, sx: w1 + offset, sy: midY + offset, cropW: bottomCropW, cropH: bottomCropH });
                gridCells.push({ x1: w2, y1: midY, x2: width, y2: height, sx: w2 + offset, sy: midY + offset, cropW: bottomCropW, cropH: bottomCropH });
            }

            const cell = gridCells[recutItem.meta.cellIndex];
            if (cell) {
                x1 = cell.x1; y1 = cell.y1; x2 = cell.x2; y2 = cell.y2;
                sx = cell.sx; sy = cell.sy; cropW = cell.cropW; cropH = cell.cropH;
            }
        }
    } else {
        const box = state.selectionBoxes.find(b => b.id === recutItem.meta.boxId);
        if (box) {
            x1 = box.x; y1 = box.y; x2 = box.x + box.w; y2 = box.y + box.h;
            sx = box.x + offset; sy = box.y + offset;
            cropW = box.w - (2 * offset); cropH = box.h - (2 * offset);
        }
    }

    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return null;
    return { x1, y1, x2, y2, sx, sy, cropW, cropH };
}

// --- Confirm Recut Single Slide Implementation ---
export const handleConfirmRecut = () => {
    if (state.recutSlideId === null || !state.recutTempCoords) return;

    const recutItem = state.slicedImages.find(item => item.id === state.recutSlideId);
    if (!recutItem) {
        state.recutSlideId = null;
        state.recutBoxId = null;
        state.recutTempCoords = null;
        if (btnSlice) btnSlice.disabled = false;
        updateSidebarControlsState();
        return;
    }

    const { sx, sy, cropW, cropH } = state.recutTempCoords;

    if (cropW <= 0 || cropH <= 0) {
        showToast("Kích thước cắt quá nhỏ. Hãy kéo rộng lưới/khung hoặc giảm xén viền!", "error");
        return;
    }

    const scale = getExportScale(cropW);
    const targetW = Math.round(cropW * scale);
    const targetH = Math.round(cropH * scale);

    recutItem.meta.targetW = targetW;
    recutItem.meta.targetH = targetH;

    const sliceCanvas = document.createElement('canvas');
    const sliceCtx = sliceCanvas.getContext('2d');
    sliceCanvas.width = targetW;
    sliceCanvas.height = targetH;
    
    if (targetW === cropW && targetH === cropH) {
        sliceCtx.imageSmoothingEnabled = false;
    } else {
        sliceCtx.imageSmoothingEnabled = true;
        sliceCtx.imageSmoothingQuality = 'high';
    }
    sliceCtx.clearRect(0, 0, targetW, targetH);

    if (state.exportSharpness !== 'off') {
        sliceCtx.filter = `url(#sharpen-${state.exportSharpness})`;
    } else {
        sliceCtx.filter = 'none';
    }

    sliceCtx.drawImage(state.currentImage, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
    sliceCtx.filter = 'none';

    const isWatermarkEnabled = switchWatermark && switchWatermark.checked;
    if (isWatermarkEnabled) {
        const type = selectWatermarkType ? selectWatermarkType.value : 'text';
        const position = selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right';
        const opacity = parseInt(inputWatermarkOpacity ? inputWatermarkOpacity.value : 50) || 50;
        const size = parseInt(inputWatermarkSize ? inputWatermarkSize.value : 24) || 24;
        const text = inputWatermarkText ? inputWatermarkText.value.trim() : '';
        const scalePercent = parseInt(inputWatermarkImageScale ? inputWatermarkImageScale.value : 20) || 20;

        if ((type === 'text' && text) || (type === 'image' && state.watermarkImageObj)) {
            const scaleFactor = targetW / cropW;
            const actualFontSize = Math.max(12, Math.round(size * scaleFactor));
            
            const cellConf = {
                type: type,
                text: text,
                fontSize: actualFontSize,
                imageObj: state.watermarkImageObj,
                scalePercent: scalePercent,
                cellX: 0,
                cellY: 0,
                cellW: targetW,
                cellH: targetH
            };
            drawWatermarkOnCtx(sliceCtx, position, opacity, cellConf);
        }
    }

    const mimeType = state.exportFormat === 'png' ? 'image/png' : (state.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/webp');
    const quality = state.exportFormat === 'png' ? undefined : state.exportQuality;
    const dataUrl = sliceCanvas.toDataURL(mimeType, quality);
    recutItem.dataUrl = dataUrl;
    recutItem.sliceParams = { sx, sy, cropW, cropH, targetW, targetH };
    
    const ext = state.exportFormat === 'png' ? 'png' : (state.exportFormat === 'jpeg' ? 'jpg' : 'webp');
    recutItem.name = recutItem.name.replace(/\.[^/.]+$/, "") + "." + ext;

    if (recutItem.meta.slicingMode === 'grid') {
        recutItem.meta.customCoords = { sx, sy, cropW, cropH };
    } else if (recutItem.meta.slicingMode === 'box') {
        const box = state.selectionBoxes.find(b => b.id === recutItem.meta.boxId);
        if (box) {
            const offset = parseInt(inputOffset.value) || 0;
            box.x = sx - offset;
            box.y = sy - offset;
            box.w = cropW + 2 * offset;
            box.h = cropH + 2 * offset;
        }
    }

    const resultItem = resultGrid.querySelector(`.result-item[data-id="${recutItem.id}"]`);
    if (resultItem) {
        let displayRatio = targetW / targetH;
        if (displayRatio > 2.0) {
            displayRatio = 2.0;
        } else if (displayRatio < 0.5) {
            displayRatio = 0.5;
        }
        resultItem.style.aspectRatio = String(displayRatio);
        const imgEl = resultItem.querySelector('.result-img');
        if (imgEl) imgEl.src = dataUrl;
        
        const btnDl = resultItem.querySelector('.result-item-btn-dl');
        if (btnDl) {
            const newBtnDl = btnDl.cloneNode(true);
            newBtnDl.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = recutItem.name;
                a.click();
            });
            btnDl.parentNode.replaceChild(newBtnDl, btnDl);
        }
    }

    sliceCanvas.toBlob((blob) => {
        const blobObj = state.slicedBlobs.find(item => item.id === recutItem.id);
        if (blobObj) {
            blobObj.blob = blob;
            blobObj.name = recutItem.name;
        } else {
            state.slicedBlobs.push({ id: recutItem.id, name: recutItem.name, blob: blob });
        }
    }, mimeType, quality);

    showToast("Đã cắt lại slide thành công!", "success");

    state.recutSlideId = null;
    state.recutBoxId = null;
    state.recutTempCoords = null;
    if (btnSlice) btnSlice.disabled = false;
    if (fileInfo) fileInfo.style.display = 'flex';
    updateSidebarControlsState();
    drawLiveGrid();

    switchTab('tab-result-grid');
    switchMobileTab('result');
    saveLocalProjectState();
};

export const handleCancelRecut = () => {
    state.recutSlideId = null;
    state.recutBoxId = null;
    state.recutTempCoords = null;
    if (btnSlice) btnSlice.disabled = false;
    if (fileInfo) fileInfo.style.display = 'flex';
    updateSidebarControlsState();
    drawLiveGrid();
    showToast("Đã hủy cắt lại", "info");
    switchTab('tab-result-grid');
    switchMobileTab('result');
};

// --- WebP & Quality settings regeneration on selection change ---
export function regenerateSlicedImagesMimeType() {
    if (state.slicedImages.length === 0) return;

    const mimeType = state.exportFormat === 'png' ? 'image/png' : (state.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/webp');
    const ext = state.exportFormat === 'png' ? 'png' : (state.exportFormat === 'jpeg' ? 'jpg' : 'webp');
    const quality = state.exportFormat === 'png' ? undefined : state.exportQuality;

    if (btnDownloadZip) btnDownloadZip.disabled = true;

    let completedCount = 0;

    state.slicedImages.forEach(item => {
        if (!item.sliceParams) return;

        const { sx, sy, cropW, cropH, targetW, targetH } = item.sliceParams;
        
        const sliceCanvas = document.createElement('canvas');
        const sliceCtx = sliceCanvas.getContext('2d');
        sliceCanvas.width = targetW;
        sliceCanvas.height = targetH;
        
        if (targetW === cropW && targetH === cropH) {
            sliceCtx.imageSmoothingEnabled = false;
        } else {
            sliceCtx.imageSmoothingEnabled = true;
            sliceCtx.imageSmoothingQuality = 'high';
        }
        sliceCtx.clearRect(0, 0, targetW, targetH);

        if (state.exportSharpness !== 'off') {
            sliceCtx.filter = `url(#sharpen-${state.exportSharpness})`;
        } else {
            sliceCtx.filter = 'none';
        }

        sliceCtx.drawImage(state.currentImage, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
        sliceCtx.filter = 'none';

        const isWatermarkEnabled = switchWatermark && switchWatermark.checked;
        if (isWatermarkEnabled) {
            const type = selectWatermarkType ? selectWatermarkType.value : 'text';
            const position = selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right';
            const opacity = parseInt(inputWatermarkOpacity ? inputWatermarkOpacity.value : 50) || 50;
            const size = parseInt(inputWatermarkSize ? inputWatermarkSize.value : 24) || 24;
            const text = inputWatermarkText ? inputWatermarkText.value.trim() : '';
            const scalePercent = parseInt(inputWatermarkImageScale ? inputWatermarkImageScale.value : 20) || 20;

            if ((type === 'text' && text) || (type === 'image' && state.watermarkImageObj)) {
                const scaleFactor = targetW / cropW;
                const actualFontSize = Math.max(12, Math.round(size * scaleFactor));
                
                const cellConf = {
                    type: type,
                    text: text,
                    fontSize: actualFontSize,
                    imageObj: state.watermarkImageObj,
                    scalePercent: scalePercent,
                    cellX: 0,
                    cellY: 0,
                    cellW: targetW,
                    cellH: targetH
                };
                drawWatermarkOnCtx(sliceCtx, position, opacity, cellConf);
            }
        }

        const newDataUrl = sliceCanvas.toDataURL(mimeType, quality);
        item.dataUrl = newDataUrl;
        item.name = item.name.replace(/\.[^/.]+$/, "") + "." + ext;

        const resultItem = resultGrid.querySelector(`.result-item[data-id="${item.id}"]`);
        if (resultItem) {
            const imgEl = resultItem.querySelector('.result-img');
            if (imgEl) imgEl.src = newDataUrl;

            const nameInput = resultItem.querySelector('.result-item-name-input');
            if (nameInput) {
                nameInput.value = item.name.replace(/\.[^/.]+$/, "");
            }

            const btnDl = resultItem.querySelector('.result-item-btn-dl');
            if (btnDl) {
                const newBtnDl = btnDl.cloneNode(true);
                newBtnDl.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = newDataUrl;
                    a.download = item.name;
                    a.click();
                });
                btnDl.parentNode.replaceChild(newBtnDl, btnDl);
            }
        }

        sliceCanvas.toBlob((blob) => {
            const blobObj = state.slicedBlobs.find(b => b.id === item.id);
            if (blobObj) {
                blobObj.blob = blob;
                blobObj.name = item.name;
            } else {
                state.slicedBlobs.push({ id: item.id, name: item.name, blob: blob });
            }

            completedCount++;
            if (completedCount === state.slicedImages.length && btnDownloadZip) {
                btnDownloadZip.disabled = false;
            }
        }, mimeType, quality);
    });
}

// --- Zoom logic from center / keyboard shortcuts trigger ---
export const triggerProgrammaticZoom = (factor) => {
    if (!state.currentImage) return;

    const wrapper = document.querySelector('.canvas-wrapper');
    if (!wrapper) return;

    const newZoomScale = Math.max(0.05, Math.min(10.0, state.zoomScale * factor));

    if (newZoomScale !== state.zoomScale) {
        const zoomRatio = newZoomScale / state.zoomScale;

        const scrollLeft_new = wrapper.scrollLeft * zoomRatio;
        const scrollTop_new = wrapper.scrollTop * zoomRatio;

        state.zoomScale = newZoomScale;
        updateCanvasDisplaySize();

        const _ = wrapper.scrollWidth; // Force reflow

        wrapper.scrollLeft = Math.round(scrollLeft_new);
        wrapper.scrollTop = Math.round(scrollTop_new);

        drawLiveGrid();
    }
};

// --- Mobile Preview Slider navigation ---
export const navigateMobileSlide = (direction) => {
    if (!mobileCarouselSlider) return;
    const dots = mobileCarouselDots.querySelectorAll('.mobile-carousel-dot');
    const totalSlides = dots.length;
    if (totalSlides === 0) return;
    
    let newIndex = currentSlideIndex;
    if (direction === 'prev') {
        newIndex = Math.max(0, currentSlideIndex - 1);
    } else if (direction === 'next') {
        newIndex = Math.min(totalSlides - 1, currentSlideIndex + 1);
    }
    
    if (newIndex !== currentSlideIndex) {
        const sliderWidth = mobileCarouselSlider.clientWidth;
        mobileCarouselSlider.style.scrollBehavior = 'smooth';
        mobileCarouselSlider.style.scrollSnapType = 'x mandatory';
        mobileCarouselSlider.scrollTo({
            left: newIndex * sliderWidth,
            behavior: 'smooth'
        });
        currentSlideIndex = newIndex;
        updateActiveDot(newIndex);
    }
};

const updateActiveDot = (index) => {
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
};

// --- Reset Application State ---
function resetApp() {
    state.recutSlideId = null;
    state.recutBoxId = null;
    updateSidebarControlsState();
    fileInput.value = '';
    state.currentImage = null;
    if (dropzone) dropzone.classList.remove('has-image');
    if (appContent) appContent.classList.remove('has-image');
    state.slicedImages = [];
    state.slicedBlobs = [];
    state.colsX = [];
    state.rowsY = [];
    state.selectionBoxes = [];
    state.nextBoxId = 1;
    state.isCustomGrid = false;
    
    state.uploadedOriginalImageUrl = null;
    
    state.zoomScale = 1.0;
    state.panX = 0;
    state.panY = 0;
    state.spacePressed = false;
    state.isPanning = false;
    state.selectedBoxIdx = -1;
    
    inputRows.value = 1;
    inputCols.value = 4;
    inputOffset.value = 0;
    if (offsetNumberVal) {
        offsetNumberVal.value = 0;
    }
    selectRatio.value = 'free';
    state.lockedRatio = null;
    switchUniform.checked = false;
    state.isUniformSize = false;
    if (switchSnap) {
        switchSnap.checked = true;
    }
    state.isSnapEnabled = true;
    state.resultIdCounter = 1;
    state.globalTargetW = null;
    state.globalTargetH = null;
    if (btnDownloadZip) btnDownloadZip.style.display = 'none';
    if (btnClearResults) btnClearResults.style.display = 'none';
    if (btnRenumberResults) btnRenumberResults.style.display = 'none';
    if (btnMobilePreview) btnMobilePreview.style.display = 'none';
    if (resultCountBadge) {
        resultCountBadge.textContent = '0';
    }
    
    dropzonePrompt.style.display = 'flex';
    fileInfo.style.display = 'none';
    fileInfo.classList.remove('active');
    
    btnSlice.disabled = true;
    if (btnAutoDetect) btnAutoDetect.disabled = true;
    btnGenBoxes.disabled = true;
    btnClearBoxes.disabled = true;
    btnDownloadZip.disabled = true;
    
    tabBtnResult.disabled = true;
    resultCount.textContent = '0';
    resultGrid.innerHTML = '';
    resultGrid.className = 'result-grid';
    
    previewCanvas.style.display = 'none';
    imageMeta.style.display = 'none';
    interactiveTip.style.display = 'none';
    canvasPlaceholder.style.display = 'flex';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
        canvasWrapper.style.justifyContent = '';
        canvasWrapper.style.alignItems = '';
    }
    
    switchTab('tab-live-grid');
    setSlicingMode('grid');
    
    if (mobileNavEdit) mobileNavEdit.classList.add('disabled');
    if (mobileNavResult) mobileNavResult.classList.add('disabled');
    switchMobileTab('upload');
    clearLocalProjectState();
}

// --- App Settings persistence logic ---
const saveAppSettings = () => {
    try {
        const settings = {
            exportResolution: state.exportResolution,
            exportSharpness: state.exportSharpness,
            watermarkEnabled: switchWatermark ? switchWatermark.checked : false,
            watermarkType: selectWatermarkType ? selectWatermarkType.value : 'text',
            watermarkText: inputWatermarkText ? inputWatermarkText.value : '',
            watermarkPosition: selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right',
            watermarkSize: inputWatermarkSize ? inputWatermarkSize.value : '24',
            watermarkOpacity: inputWatermarkOpacity ? inputWatermarkOpacity.value : '50',
            watermarkImageScale: inputWatermarkImageScale ? inputWatermarkImageScale.value : '20',
            gridRows: inputRows ? parseInt(inputRows.value) : 4,
            gridCols: inputCols ? parseInt(inputCols.value) : 3,
            gridOffset: inputOffset ? parseInt(inputOffset.value) : 0
        };
        localStorage.setItem('carousel_cut_app_settings', JSON.stringify(settings));
    } catch (err) {
        console.error("Lỗi khi lưu cài đặt ứng dụng:", err);
    }
};

const loadAppSettings = () => {
    try {
        if (inputRows) inputRows.value = 4;
        if (inputCols) inputCols.value = 3;
        if (inputOffset) inputOffset.value = 0;

        const settingsStr = localStorage.getItem('carousel_cut_app_settings');
        if (settingsStr) {
            const settings = JSON.parse(settingsStr);
            
            if (settings.exportResolution) {
                state.exportResolution = settings.exportResolution;
                if (selectExportResolution) selectExportResolution.value = state.exportResolution;
            }
            
            if (settings.exportSharpness) {
                state.exportSharpness = settings.exportSharpness;
                if (selectExportSharpness) selectExportSharpness.value = state.exportSharpness;
            }
            
            if (switchWatermark) {
                switchWatermark.checked = settings.watermarkEnabled || false;
                if (watermarkOptionsContainer) {
                    watermarkOptionsContainer.style.display = switchWatermark.checked ? 'block' : 'none';
                }
            }
            
            if (selectWatermarkType) {
                selectWatermarkType.value = settings.watermarkType || 'text';
                if (watermarkTextConfig) {
                    watermarkTextConfig.style.display = (selectWatermarkType.value === 'text') ? 'block' : 'none';
                }
                if (watermarkImageConfig) {
                    watermarkImageConfig.style.display = (selectWatermarkType.value === 'image') ? 'block' : 'none';
                }
            }
            
            if (inputWatermarkText && settings.watermarkText !== undefined) {
                inputWatermarkText.value = settings.watermarkText;
            }
            
            if (selectWatermarkPosition) {
                selectWatermarkPosition.value = settings.watermarkPosition || 'bottom-right';
            }
            
            if (inputWatermarkSize) {
                inputWatermarkSize.value = settings.watermarkSize || '24';
                if (watermarkSizeVal) watermarkSizeVal.textContent = inputWatermarkSize.value;
            }
            
            if (inputWatermarkOpacity) {
                inputWatermarkOpacity.value = settings.watermarkOpacity || '50';
                if (watermarkOpacityVal) watermarkOpacityVal.textContent = inputWatermarkOpacity.value;
            }
            
            if (inputWatermarkImageScale) {
                inputWatermarkImageScale.value = settings.watermarkImageScale || '20';
                if (watermarkImageScaleVal) watermarkImageScaleVal.textContent = inputWatermarkImageScale.value;
            }

            if (inputRows && settings.gridRows !== undefined) {
                inputRows.value = settings.gridRows;
            }
            if (inputCols && settings.gridCols !== undefined) {
                inputCols.value = settings.gridCols;
            }
            if (inputOffset && settings.gridOffset !== undefined) {
                inputOffset.value = settings.gridOffset;
                if (offsetNumberVal) offsetNumberVal.value = settings.gridOffset;
            }
        }
        
        const imgData = localStorage.getItem('carousel_cut_watermark_image');
        if (imgData) {
            const img = new Image();
            img.onload = () => {
                state.watermarkImageObj = img;
                if (watermarkImagePreviewInfo) watermarkImagePreviewInfo.style.display = 'block';
                drawLiveGrid();
            };
            img.src = imgData;
        }
    } catch (err) {
        console.error("Lỗi khi khôi phục cài đặt ứng dụng:", err);
    }
};

// --- Password gate app lock logic ---
function checkPasswordLock() {
    if (!passwordGate) return;

    const securityChecking = document.getElementById('security-checking');
    const passwordBox = document.getElementById('password-box');
    const progressFill = document.getElementById('checking-progress-fill');
    const isUnlocked = localStorage.getItem('app_unlocked') === 'true';

    if (securityChecking) {
        securityChecking.style.display = 'flex';
        securityChecking.style.opacity = '1';
    }
    if (passwordBox) passwordBox.style.display = 'none';
    passwordGate.style.display = 'flex';
    passwordGate.classList.remove('fade-out');

    let progress = 0;
    const duration = 800;
    const intervalTime = 20;
    const increment = (100 / (duration / intervalTime));

    const timer = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            
            if (isUnlocked) {
                passwordGate.classList.add('fade-out');
                setTimeout(() => {
                    passwordGate.style.display = 'none';
                }, 400);
            } else {
                if (securityChecking) {
                    securityChecking.style.opacity = '0';
                    setTimeout(() => {
                        securityChecking.style.display = 'none';
                        if (passwordBox) {
                            passwordBox.style.display = 'flex';
                            passwordBox.style.opacity = '0';
                            setTimeout(() => {
                                passwordBox.style.opacity = '1';
                                passwordBox.style.transition = 'opacity 0.3s ease-in-out';
                                if (appPasswordInput) appPasswordInput.focus();
                            }, 50);
                        }
                    }, 300);
                }
            }
        }
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }, intervalTime);
}

// --- Supabase Client Creation ---
const SUPABASE_URL = 'https://awqqnvloeckdxtdcjako.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aSHG8chYnIlz6R3PkhJqgw_YICNImU6';

if (window.supabase) {
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error("Supabase SDK is not loaded!");
}

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function updateAuthUI() {
    const pcLoggedOut = document.getElementById('pc-auth-logged-out');
    const pcLoggedIn = document.getElementById('pc-auth-logged-in');
    const pcUsername = document.getElementById('pc-auth-username');
    
    const mobileLoggedOut = document.getElementById('mobile-auth-logged-out');
    const mobileLoggedIn = document.getElementById('mobile-auth-logged-in');
    const mobileUsername = document.getElementById('mobile-auth-username');

    const sidebarAccountName = document.getElementById('sidebar-account-name');
    const sidebarAccountStatus = document.getElementById('sidebar-account-status');
    const pcAuthPopup = document.getElementById('pc-auth-popup');

    if (state.syncKey) {
        if (pcLoggedOut) pcLoggedOut.style.display = 'none';
        if (pcLoggedIn) {
            pcLoggedIn.style.display = 'flex';
            if (pcUsername) pcUsername.textContent = state.syncKey;
        }

        if (mobileLoggedOut) mobileLoggedOut.style.display = 'none';
        if (mobileLoggedIn) {
            mobileLoggedIn.style.display = 'flex';
            if (mobileUsername) mobileUsername.textContent = state.syncKey;
        }

        if (sidebarAccountName) sidebarAccountName.textContent = state.syncKey;
        if (sidebarAccountStatus) {
            sidebarAccountStatus.innerHTML = '<i class="fa-solid fa-cloud" style="color: #06b6d4; font-size: 0.72rem;"></i> Đang đồng bộ';
        }
        if (pcAuthPopup) pcAuthPopup.classList.add('user-logged-in');
    } else {
        pcAuthMode = 'login';
        mobileAuthMode = 'login';

        const pcAuthTitle = document.getElementById('pc-auth-title');
        const btnPcAuthSubmit = document.getElementById('btn-pc-auth-submit');
        const pcAuthSwitchText = document.getElementById('pc-auth-switch-text');
        const linkPcAuthSwitch = document.getElementById('link-pc-auth-switch');

        const mobileAuthTitle = document.getElementById('mobile-auth-title');
        const btnMobileAuthSubmit = document.getElementById('btn-mobile-auth-submit');
        const mobileAuthSwitchText = document.getElementById('mobile-auth-switch-text');
        const linkMobileAuthSwitch = document.getElementById('link-mobile-auth-switch');

        if (pcAuthTitle) pcAuthTitle.textContent = 'Đăng Nhập Hệ Thống';
        if (btnPcAuthSubmit) btnPcAuthSubmit.textContent = 'Đăng nhập';
        if (pcAuthSwitchText) pcAuthSwitchText.textContent = 'Chưa có tài khoản?';
        if (linkPcAuthSwitch) linkPcAuthSwitch.textContent = 'Đăng ký ngay';

        if (mobileAuthTitle) mobileAuthTitle.textContent = 'Đăng Nhập Hệ Thống';
        if (btnMobileAuthSubmit) btnMobileAuthSubmit.textContent = 'Đăng nhập';
        if (mobileAuthSwitchText) mobileAuthSwitchText.textContent = 'Chưa có tài khoản?';
        if (linkMobileAuthSwitch) linkMobileAuthSwitch.textContent = 'Đăng ký ngay';

        if (pcLoggedOut) pcLoggedOut.style.display = 'flex';
        if (pcLoggedIn) pcLoggedIn.style.display = 'none';

        if (mobileLoggedOut) mobileLoggedOut.style.display = 'flex';
        if (mobileLoggedIn) {
            mobileLoggedIn.style.display = 'none';
        }
        
        if (sidebarAccountName) sidebarAccountName.textContent = 'Chưa đăng nhập';
        if (sidebarAccountStatus) sidebarAccountStatus.textContent = 'Đồng bộ đám mây';
        if (pcAuthPopup) pcAuthPopup.classList.remove('user-logged-in');
        
        const pcUserIn = document.getElementById('pc-username-input');
        const pcPassIn = document.getElementById('pc-password-input');
        const mobUserIn = document.getElementById('mobile-username-input');
        const mobPassIn = document.getElementById('mobile-password-input');
        if (pcUserIn) pcUserIn.value = '';
        if (pcPassIn) pcPassIn.value = '';
        if (mobUserIn) mobUserIn.value = '';
        if (mobPassIn) mobPassIn.value = '';
    }
}

async function performRegister(usernameInputId, passwordInputId) {
    if (!state.supabase) return;
    const userIn = document.getElementById(usernameInputId);
    const passIn = document.getElementById(passwordInputId);
    if (!userIn || !passIn) return;

    const username = userIn.value.trim().toLowerCase();
    const password = passIn.value;

    if (!username || !password) {
        showToast("Thiếu tài khoản hoặc mật khẩu!", "warning");
        return;
    }

    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        showToast("Tên đăng nhập không hợp lệ!", "warning");
        return;
    }

    if (password.length < 6) {
        showToast("Mật khẩu phải từ 6 ký tự!", "warning");
        return;
    }

    try {
        const { data: existingUser, error: checkError } = await state.supabase
            .from('carousel_users')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            showToast("Tên đăng nhập đã tồn tại!", "error");
            return;
        }

        const hashedPassword = await hashPassword(password);
        const { error: insertError } = await state.supabase
            .from('carousel_users')
            .insert([{ username, password: hashedPassword }]);

        if (insertError) throw insertError;

        showToast("Đăng ký tài khoản thành công!", "success");
        state.syncKey = username;
        localStorage.setItem('carousel_logged_user', state.syncKey);
        updateAuthUI();
        loadHistoryFromDB();
    } catch (err) {
        console.error("Lỗi đăng ký:", err);
        showToast("Đăng ký tài khoản thất bại!", "error");
    }
}

async function performLogin(usernameInputId, passwordInputId) {
    if (!state.supabase) return;
    const userIn = document.getElementById(usernameInputId);
    const passIn = document.getElementById(passwordInputId);
    if (!userIn || !passIn) return;

    const username = userIn.value.trim().toLowerCase();
    const password = passIn.value;

    if (!username || !password) {
        showToast("Thiếu tài khoản hoặc mật khẩu!", "warning");
        return;
    }

    try {
        const hashedPassword = await hashPassword(password);
        
        const { data: user, error: loginError } = await state.supabase
            .from('carousel_users')
            .select('*')
            .eq('username', username)
            .eq('password', hashedPassword)
            .maybeSingle();

        if (loginError) throw loginError;

        if (!user) {
            showToast("Sai tài khoản hoặc mật khẩu!", "error");
            return;
        }

        state.syncKey = username;
        localStorage.setItem('carousel_logged_user', state.syncKey);
        updateAuthUI();
        loadHistoryFromDB();
        showToast(`Xin chào, ${state.syncKey}!`, "success");
    } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        showToast("Đăng nhập thất bại!", "error");
    }
}

function performLogout() {
    showConfirm("Bạn có chắc chắn muốn đăng xuất tài khoản?", () => {
        state.syncKey = '';
        localStorage.removeItem('carousel_logged_user');
        updateAuthUI();
        loadHistoryFromDB();
    });
}

// --- Sync history to Supabase ---
async function saveProjectToDB() {
    if (!state.supabase || !state.currentOriginalFile) return;
    if (!state.syncKey) {
        console.log("Chưa đăng nhập tài khoản. Dự án sẽ không được lưu trực tuyến.");
        return;
    }

    try {
        let publicUrl = state.uploadedOriginalImageUrl;

        if (!publicUrl) {
            console.log("Đang tải ảnh gốc lên Supabase Storage...");
            const fileExt = state.currentOriginalFile.name.split('.').pop() || 'png';
            const fileName = `${state.syncKey}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await state.supabase.storage
                .from('project-images')
                .upload(fileName, state.currentOriginalFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl: url } } = state.supabase.storage
                .from('project-images')
                .getPublicUrl(fileName);
            
            publicUrl = url;
            state.uploadedOriginalImageUrl = url;
        } else {
            console.log("Sử dụng lại ảnh gốc đã tải lên trước đó:", publicUrl);
        }

        const newProject = {
            sync_key: state.syncKey,
            name: state.currentOriginalFile.name || 'du_an_khong_ten.png',
            date: new Date().toLocaleString('vi-VN'),
            slicing_mode: state.slicingMode,
            grid_type: state.gridType,
            rows: parseInt(inputRows.value) || 1,
            cols: parseInt(inputCols.value) || 1,
            ratio: selectRatio.value,
            scale: JSON.stringify({
                scale: 'auto',
                grid_line_color: gridLineColor,
                export_resolution: state.exportResolution,
                export_sharpness: state.exportSharpness
            }),
            offset_val: parseInt(inputOffset.value) || 0,
            selection_boxes: state.selectionBoxes,
            switch_uniform: switchUniform.checked,
            switch_snap: switchSnap ? switchSnap.checked : true,
            cols_x: state.colsX,
            rows_y: state.rowsY,
            image_url: publicUrl
        };

        const { data: dbData, error: dbError } = await state.supabase
            .from('projects')
            .insert([newProject])
            .select();

        if (dbError) throw dbError;

        console.log("Lưu lịch sử dự án trực tuyến thành công!");
        cleanOldProjects();
        loadHistoryFromDB();
    } catch (err) {
        console.error("Lỗi khi đồng bộ lên Supabase:", err);
        showToast("Không thể lưu lịch sử lên mây!", "error");
    }
}

async function cleanOldProjects() {
    if (!state.supabase || !state.syncKey) return;
    try {
        const { data, error } = await state.supabase
            .from('projects')
            .select('id, created_at')
            .eq('sync_key', state.syncKey)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 10) {
            const projectsToDelete = data.slice(0, data.length - 10);
            for (const proj of projectsToDelete) {
                await deleteProjectStorageFile(proj.id);
                await state.supabase.from('projects').delete().eq('id', proj.id);
            }
        }
    } catch (err) {
        console.error("Lỗi khi dọn dẹp dự án cũ:", err);
    }
}

async function deleteProjectStorageFile(projectId) {
    if (!state.supabase) return;
    try {
        const { data, error } = await state.supabase
            .from('projects')
            .select('image_url')
            .eq('id', projectId)
            .single();
        
        if (error || !data) return;

        const bucketPart = 'project-images/';
        const index = data.image_url.indexOf(bucketPart);
        if (index !== -1) {
            const filePath = decodeURIComponent(data.image_url.substring(index + bucketPart.length));
            await state.supabase.storage.from('project-images').remove([filePath]);
        }
    } catch (e) {
        console.error("Lỗi khi xóa file storage:", e);
    }
}

const applyHistoryViewMode = (mode) => {
    state.historyViewMode = mode;
    localStorage.setItem('history_view_mode', mode);

    const listContainers = [historyList, pcHistoryList];
    listContainers.forEach(container => {
        if (container) {
            if (mode === 'grid') {
                container.classList.add('grid-view');
            } else {
                container.classList.remove('grid-view');
            }
        }
    });

    const toggles = [
        { btn: btnMobileHistoryViewToggle, id: 'btn-mobile-history-view-toggle' },
        { btn: btnPcHistoryViewToggle, id: 'btn-pc-history-view-toggle' }
    ];

    toggles.forEach(t => {
        const btn = t.btn || document.getElementById(t.id);
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                if (mode === 'grid') {
                    icon.className = 'fa-solid fa-list';
                    btn.classList.add('active-mode');
                    btn.setAttribute('data-tooltip', 'Chuyển sang xem dạng Danh sách');
                } else {
                    icon.className = 'fa-solid fa-table-cells-large';
                    btn.classList.remove('active-mode');
                    btn.setAttribute('data-tooltip', 'Chuyển sang xem dạng Lưới');
                }
            }
        }
    });
};

const initHistoryViewToggle = () => {
    const toggles = ['btn-mobile-history-view-toggle', 'btn-pc-history-view-toggle'];
    toggles.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const newMode = state.historyViewMode === 'list' ? 'grid' : 'list';
                applyHistoryViewMode(newMode);
            });
        }
    });
};

async function loadHistoryFromDB() {
    if (!state.supabase) return;

    if (!state.syncKey) {
        const emptyMsg = '<div class="history-empty">Đăng nhập tài khoản để xem và đồng bộ lịch sử dự án.</div>';
        if (pcHistoryList) pcHistoryList.innerHTML = emptyMsg;
        if (historyList) historyList.innerHTML = emptyMsg;
        return;
    }

    try {
        const { data: projects, error } = await state.supabase
            .from('projects')
            .select('*')
            .eq('sync_key', state.syncKey)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const renderList = (container, isPc = true) => {
            if (!container) return;

            const btnSelectAll = document.getElementById(isPc ? 'btn-pc-select-all-toggle' : 'btn-mobile-select-all-toggle');
            const btnBulkDelete = document.getElementById(isPc ? 'btn-pc-bulk-delete' : 'btn-mobile-bulk-delete');
            const badge = document.getElementById(isPc ? 'pc-selected-count' : 'mobile-selected-count');

            if (btnSelectAll) {
                btnSelectAll.style.display = 'none';
                btnSelectAll.classList.remove('active');
            }
            if (btnBulkDelete) {
                btnBulkDelete.disabled = true;
                btnBulkDelete.style.display = 'none';
            }
            if (badge) {
                badge.style.display = 'none';
                badge.textContent = '0';
            }

            if (!projects || projects.length === 0) {
                container.innerHTML = '<div class="history-empty">Chưa có dự án nào được lưu đám mây.</div>';
                return;
            }

            if (btnSelectAll) btnSelectAll.style.display = 'inline-flex';
            if (btnBulkDelete) btnBulkDelete.style.display = 'inline-flex';

            container.innerHTML = '';
            projects.forEach((proj) => {
                const item = document.createElement('div');
                item.classList.add('history-item');
                item.dataset.id = proj.id;

                item.innerHTML = `
                    <input type="checkbox" class="history-item-checkbox" data-id="${proj.id}">
                    <img class="history-thumb" src="${proj.image_url}" alt="Thumbnail" crossOrigin="anonymous">
                    <div class="history-info">
                        <div class="history-name" title="${proj.name}">${proj.name}</div>
                        <div class="history-date">${proj.date}</div>
                    </div>
                    <div class="history-actions">
                        <button class="history-btn history-btn-load" title="Nạp lại dự án này">
                            <i class="fa-solid fa-folder-open"></i>
                        </button>
                        <button class="history-btn history-btn-export" title="Xuất dự án thành file (.ccut)">
                            <i class="fa-solid fa-file-export"></i>
                        </button>
                        <button class="history-btn history-btn-del" title="Xóa dự án này">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `;

                const chkItem = item.querySelector('.history-item-checkbox');
                if (chkItem) {
                    chkItem.addEventListener('change', (ev) => {
                        ev.stopPropagation();
                        updateBulkUI();
                    });
                }

                item.querySelector('.history-btn-load').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    loadProject(proj.id);
                    const historyPopup = document.getElementById('history-popup');
                    const historyBackdrop = document.getElementById('history-backdrop');
                    if (historyPopup) {
                        historyPopup.classList.remove('active');
                        if (historyBackdrop) historyBackdrop.classList.remove('active');
                    }
                });

                item.querySelector('.history-btn-export').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    exportProject(proj.id);
                });

                item.querySelector('.history-btn-del').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    showConfirm(`Bạn có chắc chắn muốn xóa dự án "${proj.name}" khỏi lịch sử đám mây?`, () => {
                        deleteProject(proj.id);
                    });
                });

                container.appendChild(item);
            });

            const updateBulkUI = () => {
                const checkedItems = container.querySelectorAll('.history-item-checkbox:checked');
                const totalItems = container.querySelectorAll('.history-item-checkbox');
                const count = checkedItems.length;

                const activeBtnBulkDelete = document.getElementById(isPc ? 'btn-pc-bulk-delete' : 'btn-mobile-bulk-delete');
                const activeBtnSelectAll = document.getElementById(isPc ? 'btn-pc-select-all-toggle' : 'btn-mobile-select-all-toggle');

                if (activeBtnBulkDelete) {
                    activeBtnBulkDelete.disabled = count === 0;
                }

                if (badge) {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'inline-block' : 'none';
                }

                if (activeBtnSelectAll) {
                    if (count === totalItems.length && totalItems.length > 0) {
                        activeBtnSelectAll.classList.add('active');
                        activeBtnSelectAll.title = "Bỏ chọn tất cả";
                    } else {
                        activeBtnSelectAll.classList.remove('active');
                        activeBtnSelectAll.title = "Chọn tất cả dự án";
                    }
                }
            };

            if (btnSelectAll) {
                const newBtnSelectAll = btnSelectAll.cloneNode(true);
                btnSelectAll.parentNode.replaceChild(newBtnSelectAll, btnSelectAll);

                newBtnSelectAll.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const totalItems = container.querySelectorAll('.history-item-checkbox');
                    const checkedItems = container.querySelectorAll('.history-item-checkbox:checked');
                    
                    const shouldCheck = (checkedItems.length < totalItems.length);
                    totalItems.forEach(chk => {
                        chk.checked = shouldCheck;
                    });
                    updateBulkUI();
                });
            }

            if (btnBulkDelete) {
                const newBtnBulkDelete = btnBulkDelete.cloneNode(true);
                btnBulkDelete.parentNode.replaceChild(newBtnBulkDelete, btnBulkDelete);

                newBtnBulkDelete.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const checkedItems = container.querySelectorAll('.history-item-checkbox:checked');
                    const ids = Array.from(checkedItems).map(chk => chk.dataset.id);
                    if (ids.length === 0) return;

                    showConfirm(`Bạn có chắc chắn muốn xóa ${ids.length} dự án đã chọn khỏi lịch sử đám mây?`, () => {
                        deleteProjectsBulk(ids);
                    });
                });
            }
        };

        renderList(pcHistoryList, true);
        renderList(historyList, false);

        applyHistoryViewMode(state.historyViewMode);

    } catch (err) {
        console.error("Lỗi khi load danh sách lịch sử:", err);
        const errMsg = '<div class="history-empty" style="color: var(--danger);">Không thể kết nối đám mây!</div>';
        if (pcHistoryList) pcHistoryList.innerHTML = errMsg;
        if (historyList) historyList.innerHTML = errMsg;
    }
}

async function loadProject(id) {
    if (state.recutSlideId !== null) {
        showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
        return;
    }
    if (!state.supabase) return;

    try {
        const { data: proj, error } = await state.supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!proj) return;

        console.log("Đang tải ảnh gốc từ Supabase...");
        
        const response = await fetch(proj.image_url);
        const blob = await response.blob();
        state.currentOriginalFile = new File([blob], proj.name, { type: blob.type });
        state.uploadedOriginalImageUrl = proj.image_url;

        state.slicingMode = proj.slicing_mode;
        state.gridType = proj.grid_type;
        
        if (state.slicingMode === 'grid') {
            if (modeGridBtn) modeGridBtn.classList.add('active');
            if (modeBoxBtn) modeBoxBtn.classList.remove('active');
            if (controlsGridMode) controlsGridMode.classList.add('active');
            if (controlsBoxMode) controlsBoxMode.classList.remove('active');
        } else {
            if (modeGridBtn) modeGridBtn.classList.remove('active');
            if (modeBoxBtn) modeBoxBtn.classList.add('active');
            if (controlsGridMode) controlsGridMode.classList.remove('active');
            if (controlsBoxMode) controlsBoxMode.classList.add('active');
        }

        if (selectGridType) selectGridType.value = state.gridType;
        if (inputRows) inputRows.value = proj.rows;
        if (inputCols) inputCols.value = proj.cols;
        if (selectRatio) selectRatio.value = proj.ratio;
        if (inputOffset) {
            inputOffset.value = proj.offset_val || 0;
            if (offsetNumberVal) offsetNumberVal.value = proj.offset_val || 0;
        }
        let loadedGridLineColor = proj.grid_line_color || '#06b6d4';
        let loadedExportResolution = proj.export_resolution || 'auto';
        let loadedExportSharpness = proj.export_sharpness || 'off';

        if (proj.scale && proj.scale.startsWith('{')) {
            try {
                const parsedScale = JSON.parse(proj.scale);
                loadedGridLineColor = parsedScale.grid_line_color || loadedGridLineColor;
                loadedExportResolution = parsedScale.export_resolution || loadedExportResolution;
                loadedExportSharpness = parsedScale.export_sharpness || loadedExportSharpness;
            } catch (e) {
                console.error("Lỗi parse JSON scale:", e);
            }
        }

        gridLineColor = loadedGridLineColor;
        updateColorPickerUI(gridLineColor);
        state.exportResolution = loadedExportResolution;
        state.exportSharpness = loadedExportSharpness;
        if (selectExportResolution) selectExportResolution.value = state.exportResolution;
        if (selectExportSharpness) selectExportSharpness.value = state.exportSharpness;
        if (switchUniform) {
            switchUniform.checked = proj.switch_uniform;
            state.isUniformSize = proj.switch_uniform;
        }
        if (switchSnap) {
            switchSnap.checked = proj.switch_snap;
            state.isSnapEnabled = proj.switch_snap;
        }

        state.colsX = proj.cols_x || [];
        state.rowsY = proj.rows_y || [];
        state.selectionBoxes = proj.selection_boxes || [];
        if (state.selectionBoxes.length > 0) {
            state.nextBoxId = Math.max(...state.selectionBoxes.map(b => b.id)) + 1;
        } else {
            state.nextBoxId = 1;
        }

        if (gridEvenParameters) {
            gridEvenParameters.style.display = (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') ? 'flex' : 'none';
        }

        dropzonePrompt.style.display = 'none';
        fileInfo.style.display = 'flex';
        dropzone.classList.add('has-image');
        appContent.classList.add('has-image');

        state.slicedImages = [];
        state.slicedBlobs = [];
        resultGrid.innerHTML = '';
        resultGrid.className = 'result-grid';
        resultCount.textContent = '0';
        if (resultCountBadge) resultCountBadge.textContent = '0';
        tabBtnResult.disabled = true;

        if (btnDownloadZip) btnDownloadZip.style.display = 'none';
        if (btnClearResults) btnClearResults.style.display = 'none';
        if (btnRenumberResults) btnRenumberResults.style.display = 'none';
        if (btnMobilePreview) btnMobilePreview.style.display = 'none';

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.currentImage = img;
                state.zoomScale = 1.0;
                state.baseCanvasWidth = 0;
                state.baseCanvasHeight = 0;
                state.panX = 0;
                state.panY = 0;
                state.selectedBoxIdx = -1;
                
                canvasPlaceholder.style.display = 'none';
                previewCanvas.style.display = 'block';
                imageMeta.style.display = 'flex';
                interactiveTip.style.display = 'flex';
                imgDimOriginal.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
                
                btnSlice.disabled = false;
                if (btnAutoDetect) btnAutoDetect.disabled = false;
                btnGenBoxes.disabled = (state.slicingMode !== 'box');
                btnClearBoxes.disabled = (state.slicingMode !== 'box');

                if (state.colsX.length === 0 && state.rowsY.length === 0 && state.slicingMode === 'grid' && (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34')) {
                    resetGridToEven();
                }

                drawLiveGrid();
                
                if (mobileNavEdit) mobileNavEdit.classList.remove('disabled');
                if (mobileNavResult) mobileNavResult.classList.add('disabled');
                switchTab('tab-live-grid');
                switchMobileTab('edit');

                setTimeout(centerCanvas, 150);

                showToast(`Đã nạp dự án: ${proj.name}`, "success");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(blob);
    } catch (err) {
        console.error("Lỗi khi nạp dự án:", err);
        showToast("Không thể tải ảnh dự án!", "error");
    }
}

async function deleteProject(id) {
    if (!state.supabase) return;
    try {
        await deleteProjectStorageFile(id);
        const { error } = await state.supabase.from('projects').delete().eq('id', id);
        if (error) throw error;

        console.log("Đã xóa dự án khỏi Supabase.");
        loadHistoryFromDB();
    } catch (err) {
        console.error("Lỗi khi xóa dự án:", err);
        showToast("Xóa dự án thất bại!", "error");
    }
}

async function deleteProjectsBulk(ids) {
    if (!state.supabase || !ids || ids.length === 0) return;
    try {
        const { data: projs, error: fetchErr } = await state.supabase
            .from('projects')
            .select('image_url')
            .in('id', ids);
        
        if (!fetchErr && projs) {
            const filePaths = [];
            const bucketPart = 'project-images/';
            projs.forEach(proj => {
                const index = proj.image_url.indexOf(bucketPart);
                if (index !== -1) {
                    const filePath = decodeURIComponent(proj.image_url.substring(index + bucketPart.length));
                    filePaths.push(filePath);
                }
            });
            if (filePaths.length > 0) {
                await state.supabase.storage.from('project-images').remove(filePaths);
            }
        }

        const { error: delErr } = await state.supabase.from('projects').delete().in('id', ids);
        if (delErr) throw delErr;

        console.log("Đã xóa hàng loạt dự án khỏi Supabase.");
        showToast(`Đã xóa thành công ${ids.length} dự án!`, "success");
        loadHistoryFromDB();
    } catch (err) {
        console.error("Lỗi khi xóa hàng loạt dự án:", err);
        showToast("Xóa dự án thất bại!", "error");
    }
}

async function exportProject(id) {
    if (!state.supabase) return;
    try {
        const { data: proj, error } = await state.supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!proj) return;

        const response = await fetch(proj.image_url);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64Data = ev.target.result;
            
            let scaleVal = proj.scale;
            let loadedGridLineColor = proj.grid_line_color || '#06b6d4';
            let loadedExportResolution = proj.export_resolution || 'auto';
            let loadedExportSharpness = proj.export_sharpness || 'off';

            if (proj.scale && proj.scale.startsWith('{')) {
                try {
                    const parsedScale = JSON.parse(proj.scale);
                    scaleVal = parsedScale.scale || 'auto';
                    loadedGridLineColor = parsedScale.grid_line_color || loadedGridLineColor;
                    loadedExportResolution = parsedScale.export_resolution || loadedExportResolution;
                    loadedExportSharpness = parsedScale.export_sharpness || loadedExportSharpness;
                } catch (e) {
                    console.error("Lỗi parse JSON scale khi xuất:", e);
                }
            }

            const exportData = {
                version: "1.0",
                name: proj.name,
                slicingMode: proj.slicing_mode,
                gridType: proj.grid_type,
                rows: proj.rows,
                cols: proj.cols,
                ratio: proj.ratio,
                scale: scaleVal,
                offset: proj.offset_val || 0,
                selectionBoxes: proj.selection_boxes,
                switchUniform: proj.switch_uniform,
                switchSnap: proj.switch_snap,
                colsX: proj.cols_x,
                rowsY: proj.rows_y,
                gridLineColor: loadedGridLineColor,
                exportResolution: loadedExportResolution,
                exportSharpness: loadedExportSharpness,
                imageBase64: base64Data
            };

            const jsonStr = JSON.stringify(exportData, null, 2);
            const exportBlob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(exportBlob);
            
            const a = document.createElement('a');
            a.href = url;
            const baseName = proj.name.substring(0, proj.name.lastIndexOf('.')) || proj.name;
            a.download = `${baseName}_social_cut.ccut`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        reader.readAsDataURL(blob);
    } catch (err) {
        console.error("Lỗi khi xuất file dự án:", err);
        showToast("Xuất file dự án thất bại!", "error");
    }
}

const handleImportFile = (file) => {
    if (state.recutSlideId !== null) {
        showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
        return;
    }
    if (!file || !state.supabase) return;
    if (!state.syncKey) {
        showToast("Hãy đăng nhập trước khi nhập file!", "warning");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            
            if (!data.imageBase64 || !data.slicingMode || !data.name) {
                showToast("File dự án không hợp lệ (.ccut)!", "warning");
                return;
            }

            const res = await fetch(data.imageBase64);
            const imageBlob = await res.blob();

            console.log("Đang nhập dự án lên đám mây...");
            const fileExt = data.name.split('.').pop() || 'png';
            const fileName = `${state.syncKey}/${Date.now()}_import.${fileExt}`;
            
            const { error: uploadError } = await state.supabase.storage
                .from('project-images')
                .upload(fileName, imageBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = state.supabase.storage
                .from('project-images')
                .getPublicUrl(fileName);

            const newProject = {
                sync_key: state.syncKey,
                name: data.name,
                date: new Date().toLocaleString('vi-VN') + " (Nhập file)",
                slicing_mode: data.slicingMode,
                grid_type: data.gridType || 'even',
                rows: parseInt(data.rows) || 1,
                cols: parseInt(data.cols) || 1,
                ratio: data.ratio || 'free',
                scale: JSON.stringify({
                    scale: data.scale || '3',
                    grid_line_color: data.gridLineColor || '#06b6d4',
                    export_resolution: data.exportResolution || 'auto',
                    export_sharpness: data.exportSharpness || 'off'
                }),
                offset_val: parseInt(data.offset) || 0,
                selection_boxes: data.selectionBoxes || [],
                switch_uniform: data.switchUniform !== undefined ? data.switchUniform : false,
                switch_snap: data.switchSnap !== undefined ? data.switchSnap : true,
                cols_x: data.colsX || [],
                rows_y: data.rowsY || [],
                image_url: publicUrl
            };

            const { data: insertedProj, error: dbError } = await state.supabase
                .from('projects')
                .insert([newProject])
                .select()
                .single();

            if (dbError) throw dbError;

            console.log("Nhập file dự án thành công!");
            cleanOldProjects();
            loadHistoryFromDB();
            loadProject(insertedProj.id);
        } catch (err) {
            console.error("Lỗi khi nhập file dự án:", err);
            showToast("Nhập file dự án thất bại!", "error");
        }
    };
    reader.readAsText(file);
};

// --- Social Templates logic handler ---
export function applySocialTemplate(template) {
    if (!state.currentImage) return;
    
    state.selectionBoxes = [];
    
    if (selectGridType) selectGridType.value = template;
    state.gridType = template;
    
    switch (template) {
        case 'insta-square':
            setSlicingMode('grid');
            if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
            state.lockedRatio = 1.0;
            if (selectRatio) selectRatio.value = '1:1';
            {
                const imgW = state.currentImage.naturalWidth;
                const imgH = state.currentImage.naturalHeight;
                const cols = Math.max(1, Math.round(imgW / imgH));
                if (inputCols) inputCols.value = cols;
                if (inputRows) inputRows.value = 1;
            }
            resetGridToEven();
            break;
            
        case 'insta-portrait':
            setSlicingMode('grid');
            if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
            state.lockedRatio = 4 / 5;
            if (selectRatio) selectRatio.value = '4:5';
            {
                const imgW = state.currentImage.naturalWidth;
                const imgH = state.currentImage.naturalHeight;
                const cols = Math.max(1, Math.round(imgW / (imgH * 4 / 5)));
                if (inputCols) inputCols.value = cols;
                if (inputRows) inputRows.value = 1;
            }
            resetGridToEven();
            break;

        case 'tiktok-carousel-916':
            setSlicingMode('grid');
            if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
            state.lockedRatio = 9 / 16;
            if (selectRatio) selectRatio.value = '9:16';
            {
                const imgW = state.currentImage.naturalWidth;
                const imgH = state.currentImage.naturalHeight;
                const cols = Math.max(1, Math.round(imgW / (imgH * 9 / 16)));
                if (inputCols) inputCols.value = cols;
                if (inputRows) inputRows.value = 1;
            }
            resetGridToEven();
            break;

        case 'tiktok-carousel-34':
            setSlicingMode('grid');
            if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
            state.lockedRatio = 3 / 4;
            if (selectRatio) selectRatio.value = '3:4';
            {
                const imgW = state.currentImage.naturalWidth;
                const imgH = state.currentImage.naturalHeight;
                const cols = Math.max(1, Math.round(imgW / (imgH * 3 / 4)));
                if (inputCols) inputCols.value = cols;
                if (inputRows) inputRows.value = 1;
            }
            resetGridToEven();
            break;
            
        case 'fb-profile-cover':
            setSlicingMode('box');
            state.lockedRatio = 851 / 315;
            if (selectRatio) selectRatio.value = 'free';
            {
                const imgW = state.currentImage.naturalWidth;
                const imgH = state.currentImage.naturalHeight;
                let boxW = imgW * 0.8;
                let boxH = boxW / state.lockedRatio;
                
                if (boxH > imgH) {
                    boxH = imgH * 0.8;
                    boxW = boxH * state.lockedRatio;
                }
                const boxX = (imgW - boxW) / 2;
                const boxY = (imgH - boxH) / 2;
                
                state.selectionBoxes.push({
                    id: state.nextBoxId++,
                    x: Math.round(boxX),
                    y: Math.round(boxY),
                    w: Math.round(boxW),
                    h: Math.round(boxH)
                });
                state.selectedBoxIdx = 0;
                if (gridModeText) gridModeText.textContent = `Tự do (1 khung)`;
            }
            break;
            
        case 'fb-page-cover':
            setSlicingMode('box');
            state.lockedRatio = 820 / 312;
            if (selectRatio) selectRatio.value = 'free';
            {
                const imgW = state.currentImage.naturalWidth;
                const imgH = state.currentImage.naturalHeight;
                let boxW = imgW * 0.8;
                let boxH = boxW / state.lockedRatio;
                
                if (boxH > imgH) {
                    boxH = imgH * 0.8;
                    boxW = boxH * state.lockedRatio;
                }
                const boxX = (imgW - boxW) / 2;
                const boxY = (imgH - boxH) / 2;
                
                state.selectionBoxes.push({
                    id: state.nextBoxId++,
                    x: Math.round(boxX),
                    y: Math.round(boxY),
                    w: Math.round(boxW),
                    h: Math.round(boxH)
                });
                state.selectedBoxIdx = 0;
                if (gridModeText) gridModeText.textContent = `Tự do (1 khung)`;
            }
            break;
            
        case 'fb-group-cover':
            setSlicingMode('box');
            state.lockedRatio = 1640 / 856;
            if (selectRatio) selectRatio.value = 'free';
            {
                const imgW = state.currentImage.naturalWidth;
                const imgH = state.currentImage.naturalHeight;
                let boxW = imgW * 0.8;
                let boxH = boxW / state.lockedRatio;
                
                if (boxH > imgH) {
                    boxH = imgH * 0.8;
                    boxW = boxH * state.lockedRatio;
                }
                const boxX = (imgW - boxW) / 2;
                const boxY = (imgH - boxH) / 2;
                
                state.selectionBoxes.push({
                    id: state.nextBoxId++,
                    x: Math.round(boxX),
                    y: Math.round(boxY),
                    w: Math.round(boxW),
                    h: Math.round(boxH)
                });
                state.selectedBoxIdx = 0;
                if (gridModeText) gridModeText.textContent = `Tự do (1 khung)`;
            }
            break;
    }
    
    handleParamsChange();
}

// --- History State Management Helpers ---
function getHistoryState() {
    return {
        slicingMode: state.slicingMode,
        cols: parseInt(inputCols ? inputCols.value : 3) || 1,
        rows: parseInt(inputRows ? inputRows.value : 3) || 1,
        colsX: JSON.parse(JSON.stringify(state.colsX)),
        rowsY: JSON.parse(JSON.stringify(state.rowsY)),
        isCustomGrid: state.isCustomGrid,
        selectionBoxes: JSON.parse(JSON.stringify(state.selectionBoxes)),
        nextBoxId: state.nextBoxId,
        lockedRatio: state.lockedRatio,
        isUniformSize: state.isUniformSize,
        gridType: state.gridType,
        selectRatioValue: selectRatio ? selectRatio.value : 'free',
        selectGridTypeValue: selectGridType ? selectGridType.value : 'even'
    };
}

function applyHistoryState(historyState) {
    if (!historyState) return;
    
    state.isApplyingHistoryState = true;
    
    state.slicingMode = historyState.slicingMode;
    state.colsX = JSON.parse(JSON.stringify(historyState.colsX));
    state.rowsY = JSON.parse(JSON.stringify(historyState.rowsY));
    state.isCustomGrid = historyState.isCustomGrid;
    state.selectionBoxes = JSON.parse(JSON.stringify(historyState.selectionBoxes));
    state.nextBoxId = historyState.nextBoxId;
    state.lockedRatio = historyState.lockedRatio;
    state.isUniformSize = historyState.isUniformSize;
    state.gridType = historyState.gridType;
    
    if (inputCols) inputCols.value = historyState.cols;
    if (inputRows) inputRows.value = historyState.rows;
    if (selectRatio) selectRatio.value = historyState.selectRatioValue;
    if (selectGridType) selectGridType.value = historyState.selectGridTypeValue;
    
    setSlicingMode(state.slicingMode);
    
    if (state.slicingMode === 'grid') {
        if (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') {
            if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
        } else {
            if (gridEvenParameters) gridEvenParameters.style.display = 'none';
        }
    }
    
    if (switchUniform) switchUniform.checked = state.isUniformSize;
    if (switchSnap) switchSnap.checked = state.isSnapEnabled;
    
    if (gridModeText) {
        if (state.slicingMode === 'box') {
            gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
        } else {
            gridModeText.textContent = "Chế độ lưới";
        }
    }
    
    handleParamsChange();
    
    state.isApplyingHistoryState = false;
}

function areStatesEqual(s1, s2) {
    if (!s1 || !s2) return false;
    if (s1.slicingMode !== s2.slicingMode) return false;
    if (s1.cols !== s2.cols) return false;
    if (s1.rows !== s2.rows) return false;
    if (s1.isCustomGrid !== s2.isCustomGrid) return false;
    if (s1.nextBoxId !== s2.nextBoxId) return false;
    if (s1.lockedRatio !== s2.lockedRatio) return false;
    if (s1.isUniformSize !== s2.isUniformSize) return false;
    if (s1.gridType !== s2.gridType) return false;
    if (s1.selectRatioValue !== s2.selectRatioValue) return false;
    if (s1.selectGridTypeValue !== s2.selectGridTypeValue) return false;
    
    if (s1.colsX.length !== s2.colsX.length) return false;
    for (let i = 0; i < s1.colsX.length; i++) {
        if (Math.abs(s1.colsX[i] - s2.colsX[i]) > 0.1) return false;
    }
    
    if (s1.rowsY.length !== s2.rowsY.length) return false;
    for (let i = 0; i < s1.rowsY.length; i++) {
        if (Math.abs(s1.rowsY[i] - s2.rowsY[i]) > 0.1) return false;
    }
    
    if (s1.selectionBoxes.length !== s2.selectionBoxes.length) return false;
    for (let i = 0; i < s1.selectionBoxes.length; i++) {
        const b1 = s1.selectionBoxes[i];
        const b2 = s2.selectionBoxes[i];
        if (b1.id !== b2.id || b1.x !== b2.x || b1.y !== b2.y || b1.w !== b2.w || b1.h !== b2.h) return false;
    }
    
    return true;
}

export function initHistory() {
    state.historyStack = [];
    state.historyPointer = -1;
    saveHistoryState();
}

function saveHistoryState() {
    if (!state.currentImage) return;
    
    if (state.historyPointer < state.historyStack.length - 1) {
        state.historyStack = state.historyStack.slice(0, state.historyPointer + 1);
    }
    
    const hState = getHistoryState();
    if (state.historyPointer >= 0 && areStatesEqual(state.historyStack[state.historyPointer], hState)) {
        return;
    }
    
    state.historyStack.push(hState);
    state.historyPointer++;
    
    if (state.historyStack.length > 50) {
        state.historyStack.shift();
        state.historyPointer--;
    }
}

function saveHistoryStateDebounced() {
    if (state.saveStateTimeout) clearTimeout(state.saveStateTimeout);
    state.saveStateTimeout = setTimeout(() => {
        saveHistoryState();
    }, 300);
}

export function undo() {
    if (state.historyPointer > 0) {
        state.historyPointer--;
        applyHistoryState(state.historyStack[state.historyPointer]);
        showToast("Đã hoàn tác (Undo)", "info");
    } else {
        showToast("Không thể hoàn tác thêm", "warning");
    }
}

export function redo() {
    if (state.historyPointer < state.historyStack.length - 1) {
        state.historyPointer++;
        applyHistoryState(state.historyStack[state.historyPointer]);
        showToast("Đã làm lại (Redo)", "info");
    } else {
        showToast("Không thể làm lại thêm", "warning");
    }
}

export function updateColorPickerUI(color) {
    document.querySelectorAll('.color-dot').forEach(dot => {
        if (dot.getAttribute('data-color') === color) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// --- Init Event Listeners on DOM ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Drag & Drop for Upload Events
    if (dropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'), false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleImageSelection(files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleImageSelection(e.target.files[0]);
            }
        });
    }

    if (dropzonePrompt) {
        dropzonePrompt.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    const badgeAvatar = fileInfo ? fileInfo.querySelector('.badge-avatar') : null;
    if (badgeAvatar && fileInfo) {
        badgeAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInfo.classList.toggle('active');
        });
    }

    if (btnChangeFile) {
        btnChangeFile.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }



    // Ctrl + V Paste Image
    window.addEventListener('paste', (e) => {
        if (localStorage.getItem('app_unlocked') !== 'true') return;
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const file = new File([blob], "paste_clipboard.png", { type: blob.type });
                handleImageSelection(file);
                showToast("Đã dán ảnh từ clipboard!", "success");
                break;
            }
        }
    });

    if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirm("Bạn có chắc chắn muốn gỡ ảnh hiện tại và reset thiết lập?", () => {
                resetApp();
            });
        });
    }

    // 2. Collapsible Watermark & Export panels
    if (headerWatermark && contentWatermark) {
        headerWatermark.addEventListener('click', (e) => {
            e.stopPropagation();
            panelWatermark.classList.toggle('expanded');
            contentWatermark.style.display = panelWatermark.classList.contains('expanded') ? 'block' : 'none';
        });
        contentWatermark.addEventListener('click', (e) => e.stopPropagation());
    }

    if (headerExportSettings && contentExportSettings) {
        headerExportSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            panelExportSettings.classList.toggle('expanded');
            contentExportSettings.style.display = panelExportSettings.classList.contains('expanded') ? 'block' : 'none';
        });
        contentExportSettings.addEventListener('click', (e) => e.stopPropagation());
    }

    document.addEventListener('click', () => {
        if (panelWatermark) {
            panelWatermark.classList.remove('expanded');
            if (contentWatermark) contentWatermark.style.display = 'none';
        }
        if (panelExportSettings) {
            panelExportSettings.classList.remove('expanded');
            if (contentExportSettings) contentExportSettings.style.display = 'none';
        }
    });

    // Watermark options change event triggers
    if (selectExportResolution) {
        selectExportResolution.addEventListener('change', () => {
            state.exportResolution = selectExportResolution.value;
            saveAppSettings();
            if (state.slicedImages.length > 0) {
                regenerateSlicedImagesMimeType();
            }
        });
    }
    if (selectExportSharpness) {
        selectExportSharpness.addEventListener('change', () => {
            state.exportSharpness = selectExportSharpness.value;
            saveAppSettings();
            if (state.slicedImages.length > 0) {
                regenerateSlicedImagesMimeType();
            }
            drawLiveGrid();
        });
    }
    if (switchWatermark) {
        switchWatermark.addEventListener('change', () => {
            if (watermarkOptionsContainer) {
                watermarkOptionsContainer.style.display = switchWatermark.checked ? 'block' : 'none';
            }
            saveAppSettings();
            drawLiveGrid();
            if (state.slicedImages.length > 0) {
                regenerateSlicedImagesMimeType();
            }
        });
    }
    if (inputWatermarkText) {
        inputWatermarkText.addEventListener('input', () => {
            saveAppSettings();
            drawLiveGrid();
        });
    }
    if (selectWatermarkPosition) {
        selectWatermarkPosition.addEventListener('change', () => {
            saveAppSettings();
            drawLiveGrid();
        });
    }
    if (inputWatermarkSize) {
        inputWatermarkSize.addEventListener('input', (e) => {
            if (watermarkSizeVal) watermarkSizeVal.textContent = e.target.value;
            saveAppSettings();
            drawLiveGrid();
        });
    }
    if (inputWatermarkOpacity) {
        inputWatermarkOpacity.addEventListener('input', (e) => {
            if (watermarkOpacityVal) watermarkOpacityVal.textContent = e.target.value + '%';
            saveAppSettings();
            drawLiveGrid();
        });
    }
    if (selectWatermarkType) {
        selectWatermarkType.addEventListener('change', (e) => {
            const val = e.target.value;
            if (watermarkTextConfig) watermarkTextConfig.style.display = (val === 'text') ? 'block' : 'none';
            if (watermarkImageConfig) watermarkImageConfig.style.display = (val === 'image') ? 'block' : 'none';
            saveAppSettings();
            drawLiveGrid();
        });
    }
    if (inputWatermarkImage) {
        inputWatermarkImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        state.watermarkImageObj = img;
                        if (watermarkImagePreviewInfo) {
                            watermarkImagePreviewInfo.style.display = 'block';
                            watermarkImagePreviewInfo.textContent = `Đã tải: ${file.name}`;
                        }
                        try {
                            localStorage.setItem('carousel_cut_watermark_image', event.target.result);
                        } catch (err) {
                            console.error("Không thể lưu watermark image vào localStorage do đầy bộ nhớ.");
                        }
                        drawLiveGrid();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (inputWatermarkImageScale) {
        inputWatermarkImageScale.addEventListener('input', (e) => {
            if (watermarkImageScaleVal) watermarkImageScaleVal.textContent = e.target.value + '%';
            saveAppSettings();
            drawLiveGrid();
        });
    }

    const expandMobileParams = () => {
        if (window.matchMedia('(max-width: 768px)').matches) {
            const sidebar = document.getElementById('sidebar');
            const btnMobileToggleParams = document.getElementById('btn-mobile-toggle-params');
            if (sidebar && !sidebar.classList.contains('active-params')) {
                sidebar.classList.add('active-params');
                if (btnMobileToggleParams) {
                    btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                    btnMobileToggleParams.classList.add('active');
                }
            }
        }
    };

    // 3. Mode changes and input parameters change
    if (modeGridBtn) {
        modeGridBtn.addEventListener('click', () => {
            if (state.recutSlideId !== null) {
                showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
                return;
            }
            setSlicingMode('grid');
            expandMobileParams();
        });
    }
    if (modeBoxBtn) {
        modeBoxBtn.addEventListener('click', () => {
            if (state.recutSlideId !== null) {
                showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
                return;
            }
            setSlicingMode('box');
            expandMobileParams();
        });
    }
    if (selectRatio) {
        selectRatio.addEventListener('change', () => {
            const val = selectRatio.value;
            if (val === 'free') {
                state.lockedRatio = null;
            } else if (val === '1:1') {
                state.lockedRatio = 1.0;
            } else if (val === '4:5') {
                state.lockedRatio = 4 / 5;
            } else if (val === '9:16') {
                state.lockedRatio = 9 / 16;
            } else if (val === '3:4') {
                state.lockedRatio = 3 / 4;
            } else if (val === '16:9') {
                state.lockedRatio = 16 / 9;
            }
            
            if (state.lockedRatio && state.slicingMode === 'box' && state.selectedBoxIdx !== -1) {
                const box = state.selectionBoxes[state.selectedBoxIdx];
                box.h = box.w / state.lockedRatio;
                if (box.y + box.h > state.currentImage.naturalHeight) {
                    box.h = state.currentImage.naturalHeight - box.y;
                    box.w = box.h * state.lockedRatio;
                }
                drawLiveGrid();
            }
        });
    }

    if (switchUniform) {
        switchUniform.addEventListener('change', () => {
            state.isUniformSize = switchUniform.checked;
            if (state.isUniformSize && state.selectionBoxes.length > 0) {
                const first = state.selectionBoxes[0];
                state.selectionBoxes.forEach(b => {
                    b.w = first.w;
                    b.h = first.h;
                    if (b.x + b.w > state.currentImage.naturalWidth) b.x = state.currentImage.naturalWidth - b.w;
                    if (b.y + b.h > state.currentImage.naturalHeight) b.y = state.currentImage.naturalHeight - b.h;
                });
                drawLiveGrid();
            }
        });
    }

    if (switchSnap) {
        switchSnap.addEventListener('change', () => {
            state.isSnapEnabled = switchSnap.checked;
        });
    }

    if (offsetNumberVal && inputOffset) {
        offsetNumberVal.addEventListener('input', () => {
            let val = parseInt(offsetNumberVal.value);
            if (isNaN(val)) val = 0;
            val = Math.max(0, Math.min(parseInt(inputOffset.max) || 200, val));
            inputOffset.value = val;
            handleParamsChange();
        });
    }

    if (inputRows) inputRows.addEventListener('input', handleManualInputChange);
    if (inputCols) inputCols.addEventListener('input', handleManualInputChange);
    if (inputOffset) inputOffset.addEventListener('input', handleManualInputChange);

    // Canvas Background Checkerboard/Solid Toggle
    const canvasBgModeText = document.getElementById('canvas-bg-mode-text');
    const updateCanvasBgDisplay = () => {
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        if (!canvasWrapper || !canvasBgModeText) return;
        if (canvasBgMode === 'solid') {
            canvasWrapper.classList.add('bg-solid');
            canvasBgModeText.textContent = 'Trơn';
            canvasBgModeText.style.color = 'var(--text-secondary)';
        } else {
            canvasWrapper.classList.remove('bg-solid');
            canvasBgModeText.textContent = 'Caro';
            canvasBgModeText.style.color = 'var(--accent)';
        }
    };
    updateCanvasBgDisplay();

    if (canvasBgModeText) {
        canvasBgModeText.addEventListener('click', (e) => {
            e.stopPropagation();
            canvasBgMode = (canvasBgMode === 'checkerboard') ? 'solid' : 'checkerboard';
            localStorage.setItem('canvas_bg_mode', canvasBgMode);
            updateCanvasBgDisplay();
        });
    }

    if (selectGridType) {
        selectGridType.addEventListener('change', () => {
            const val = selectGridType.value;
            if (val === 'fb-profile-cover' || val === 'fb-page-cover' || val === 'fb-group-cover' || val === 'insta-square' || val === 'insta-portrait' || val === 'tiktok-carousel-916' || val === 'tiktok-carousel-34') {
                if (!state.currentImage) {
                    showToast("Vui lòng tải ảnh lên trước khi áp dụng template!", "warning");
                    selectGridType.value = 'even';
                    state.gridType = 'even';
                    if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
                    resetGridToEven();
                    handleParamsChange();
                    return;
                }
                applySocialTemplate(val);
            } else {
                state.gridType = val;
                if (state.gridType === 'even') {
                    if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
                    resetGridToEven();
                } else {
                    if (gridEvenParameters) gridEvenParameters.style.display = 'none';
                }
                handleParamsChange();
            }
        });
    }

    if (gridModeText) {
        gridModeText.style.cursor = 'pointer';
        gridModeText.title = "Click để đặt lại lưới chia đều";
        gridModeText.addEventListener('click', () => {
            if (state.slicingMode === 'grid' && (state.isCustomGrid || state.gridType !== 'even')) {
                if (selectGridType) {
                    selectGridType.value = 'even';
                    state.gridType = 'even';
                    if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
                }
                resetGridToEven();
                handleParamsChange();
                showToast("Đã đặt lại lưới chia đều!", "success");
            }
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

    // Color picker events
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const chosenColor = dot.getAttribute('data-color');
            if (chosenColor) {
                gridLineColor = chosenColor;
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                if (state.currentImage) {
                    drawLiveGrid();
                }
            }
        });
    });

    const btnColorPrev = document.querySelector('.btn-color-prev');
    const btnColorNext = document.querySelector('.btn-color-next');
    const colorOptionsScroll = document.querySelector('.color-options-scroll');
    if (btnColorPrev && colorOptionsScroll) {
        btnColorPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            colorOptionsScroll.scrollBy({ left: -40, behavior: 'smooth' });
        });
    }
    if (btnColorNext && colorOptionsScroll) {
        btnColorNext.addEventListener('click', (e) => {
            e.stopPropagation();
            colorOptionsScroll.scrollBy({ left: 40, behavior: 'smooth' });
        });
    }

    // 4. Action buttons click listeners
    if (btnAutoDetect) {
        btnAutoDetect.addEventListener('click', autoDetectOptimalGrid);
    }

    if (btnGenBoxes) {
        btnGenBoxes.addEventListener('click', () => {
            if (!state.currentImage) return;
            const rows = parseInt(inputRows.value) || 3;
            const cols = parseInt(inputCols.value) || 3;
            const width = state.currentImage.naturalWidth;
            const height = state.currentImage.naturalHeight;
            
            state.selectionBoxes = [];
            state.nextBoxId = 1;
            
            const cellW = width / cols;
            const cellH = height / rows;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    state.selectionBoxes.push({
                        id: state.nextBoxId++,
                        x: Math.round(c * cellW),
                        y: Math.round(r * cellH),
                        w: Math.round(cellW),
                        h: Math.round(cellH)
                    });
                }
            }
            state.selectedBoxIdx = state.selectionBoxes.length - 1;
            gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
            handleParamsChange();
            drawLiveGrid();
            showToast("Đã tự động tạo các khung cắt theo hàng cột!", "success");
        });
    }

    if (btnClearBoxes) {
        btnClearBoxes.addEventListener('click', () => {
            if (state.selectionBoxes.length === 0) return;
            showConfirm("Bạn có chắc chắn muốn xóa tất cả các khung cắt tự do hiện tại?", () => {
                state.selectionBoxes = [];
                state.nextBoxId = 1;
                state.selectedBoxIdx = -1;
                gridModeText.textContent = "Tự do (0 khung)";
                handleParamsChange();
                drawLiveGrid();
                showToast("Đã xóa tất cả các khung cắt!", "success");
            });
        });
    }

    if (btnSlice) {
        btnSlice.addEventListener('click', () => {
            if (!state.currentImage) return;

            let canKeep = false;
            if (state.slicedImages && state.slicedImages.length > 0) {
                const firstImg = state.slicedImages[0];
                const prevMeta = firstImg.meta || {};
                if (prevMeta.slicingMode === state.slicingMode) {
                    if (state.slicingMode === 'grid') {
                        if (prevMeta.gridType === state.gridType) {
                            if (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') {
                                const prevRows = Math.max(...state.slicedImages.map(img => (img.meta ? img.meta.row : 0))) + 1;
                                const prevCols = Math.max(...state.slicedImages.map(img => (img.meta ? img.meta.col : 0))) + 1;
                                const currentRows = parseInt(inputRows.value) || 1;
                                const currentCols = parseInt(inputCols.value) || 1;
                                if (prevRows === currentRows && prevCols === currentCols) {
                                    canKeep = true;
                                }
                            } else {
                                canKeep = true;
                            }
                        }
                    } else {
                        if (state.slicedImages.length === state.selectionBoxes.length) {
                            canKeep = true;
                        }
                    }
                }
            }

            const keptImages = canKeep ? state.slicedImages.filter(img => img.keep) : [];
            if (canKeep && keptImages.length > 0) {
                showToast(`Giữ lại ${keptImages.length} slide đã khóa.`, "success");
            } else if (!canKeep && state.slicedImages.some(img => img.keep)) {
                showToast("Bố cục hoặc số lượng ô thay đổi, các slide khóa đã bị mở.", "warning");
            }

            state.slicedImages = [];
            state.slicedBlobs = [];
            resultGrid.innerHTML = '';
            state.globalTargetW = null;
            state.globalTargetH = null;

            state.recutSlideId = null;
            state.recutBoxId = null;
            updateSidebarControlsState();
            const btnConfirmRecut = document.getElementById('btn-confirm-recut');
            if (btnConfirmRecut) {
                btnConfirmRecut.style.display = 'none';
            }

            const offset = parseInt(inputOffset.value) || 0;
            const width = state.currentImage.naturalWidth;
            const height = state.currentImage.naturalHeight;

            const startIndex = 0;
            
            if (btnClearResults) btnClearResults.style.display = 'inline-flex';
            if (btnRenumberResults) btnRenumberResults.style.display = 'inline-flex';
            if (btnMobilePreview) btnMobilePreview.style.display = 'inline-flex';
            if (btnDownloadZip) btnDownloadZip.style.display = 'inline-flex';

            let targetW, targetH;
            const ext = state.exportFormat === 'png' ? 'png' : (state.exportFormat === 'jpeg' ? 'jpg' : 'webp');

            if (state.slicingMode === 'grid') {
                if (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') {
                    if (!state.isCustomGrid) {
                        resetGridToEven();
                    }
                    const rows = parseInt(inputRows.value) || 1;
                    const cols = parseInt(inputCols.value) || 1;
                    const boundariesX = [0, ...state.colsX, width];
                    const boundariesY = [0, ...state.rowsY, height];

                    const firstCellW = boundariesX[1] - boundariesX[0];
                    const firstCellH = boundariesY[1] - boundariesY[0];
                    
                    const firstCropW = firstCellW - 2 * offset;
                    const firstCropH = firstCellH - 2 * offset;

                    if (firstCropW <= 0 || firstCropH <= 0) {
                        showToast("Kích thước ô quá nhỏ. Giảm Offset!", "error");
                        return;
                    }

                    if (!state.globalTargetW || !state.globalTargetH) {
                        const scale = getExportScale(firstCropW);
                        state.globalTargetW = Math.round(firstCropW * scale);
                        state.globalTargetH = Math.round(firstCropH * scale);
                    }

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
                            const cropW = cellW - 2 * offset;
                            const cropH = cellH - 2 * offset;

                            if (cropW <= 0 || cropH <= 0) {
                                showToast(`Ô [H${r+1}, C${c+1}] quá nhỏ. Giảm Offset!`, "error");
                                return;
                            }

                            const kept = keptImages.find(img => img.meta && img.meta.slicingMode === 'grid' && img.meta.row === r && img.meta.col === c);
                            if (kept) {
                                const currentExt = kept.name.split('.').pop() || ext;
                                const nameIsDefault = /^slide_\d+$/.test(kept.name.replace(/\.[^/.]+$/, "")) || /^\d+$/.test(kept.name.replace(/\.[^/.]+$/, ""));
                                if (nameIsDefault) {
                                    kept.name = `${String(startIndex + count).padStart(2, '0')}.${currentExt}`;
                                }
                                if (kept.meta) {
                                    kept.meta.cellIndex = count - 1;
                                }
                                state.slicedImages.push(kept);
                                count++;
                                continue;
                            }

                            const resultId = state.resultIdCounter++;
                            const sliceName = `${String(startIndex + count).padStart(2, '0')}.${ext}`;
                            
                            const scale = getExportScale(cropW);
                            const cellTargetW = Math.round(cropW * scale);
                            const cellTargetH = Math.round(cropH * scale);

                            const meta = {
                                slicingMode: 'grid',
                                gridType: state.gridType,
                                cellIndex: count - 1,
                                row: r,
                                col: c,
                                targetW: cellTargetW,
                                targetH: cellTargetH
                            };
                            processSlice(sx, sy, cropW, cropH, sliceName, resultId, cellTargetW, cellTargetH, meta);
                            count++;
                        }
                    }
                } else {
                    let gridCells = [];
                    if (state.gridType === 'fb-1d3v') {
                        const midX = width * 0.5;
                        const h1 = height * (1/3);
                        const h2 = height * (2/3);
                        const smallCropW = (width - midX) - 3 * offset;
                        const smallCropH = h1 - 3 * offset;

                        gridCells.push({ sx: 2*offset, sy: 2*offset, cropW: midX - 3*offset, cropH: height - 4*offset, isLarge: true });
                        gridCells.push({ sx: midX + offset, sy: 2*offset, cropW: smallCropW, cropH: smallCropH, isLarge: false });
                        gridCells.push({ sx: midX + offset, sy: h1 + offset + Math.floor(offset / 2), cropW: smallCropW, cropH: smallCropH, isLarge: false });
                        gridCells.push({ sx: midX + offset, sy: h2 + offset, cropW: smallCropW, cropH: smallCropH, isLarge: false });
                    } else if (state.gridType === 'fb-1n3v') {
                        const midY = height * 0.5;
                        const w1 = width * (1/3);
                        const w2 = width * (2/3);
                        const smallCropW = w1 - 3 * offset;
                        const smallCropH = (height - midY) - 3 * offset;

                        gridCells.push({ sx: 2*offset, sy: 2*offset, cropW: width - 4*offset, cropH: midY - 3*offset, isLarge: true });
                        gridCells.push({ sx: 2*offset, sy: midY + offset, cropW: smallCropW, cropH: smallCropH, isLarge: false });
                        gridCells.push({ sx: w1 + offset + Math.floor(offset / 2), sy: midY + offset, cropW: smallCropW, cropH: smallCropH, isLarge: false });
                        gridCells.push({ sx: w2 + offset, sy: midY + offset, cropW: smallCropW, cropH: smallCropH, isLarge: false });
                    }

                    const largeCell = gridCells[0];
                    if (largeCell.cropW <= 0 || largeCell.cropH <= 0) {
                        showToast("Ô to quá nhỏ. Giảm Offset!", "error");
                        return;
                    }
                    const largeScale = getExportScale(largeCell.cropW);
                    const targetW_large = Math.round(largeCell.cropW * largeScale);
                    const targetH_large = Math.round(largeCell.cropH * largeScale);

                    const smallCell = gridCells[1];
                    if (smallCell.cropW <= 0 || smallCell.cropH <= 0) {
                        showToast("Ô nhỏ quá nhỏ. Giảm Offset!", "error");
                        return;
                    }
                    const smallScale = getExportScale(smallCell.cropW);
                    const targetW_small = Math.round(smallCell.cropW * smallScale);
                    const targetH_small = Math.round(smallCell.cropH * smallScale);

                    gridCells.forEach((cell, idx) => {
                        const sx = cell.sx;
                        const sy = cell.sy;
                        const cropW = cell.cropW;
                        const cropH = cell.cropH;
                        const tW = cell.isLarge ? targetW_large : targetW_small;
                        const tH = cell.isLarge ? targetH_large : targetH_small;

                        const kept = keptImages.find(img => img.meta && img.meta.slicingMode === 'grid' && img.meta.cellIndex === idx);
                        if (kept) {
                            const currentExt = kept.name.split('.').pop() || ext;
                            const nameIsDefault = /^slide_\d+$/.test(kept.name.replace(/\.[^/.]+$/, "")) || /^\d+$/.test(kept.name.replace(/\.[^/.]+$/, ""));
                            if (nameIsDefault) {
                                kept.name = `${String(startIndex + idx + 1).padStart(2, '0')}.${currentExt}`;
                            }
                            if (kept.meta) {
                                kept.meta.cellIndex = idx;
                            }
                            state.slicedImages.push(kept);
                            return;
                        }

                        const resultId = state.resultIdCounter++;
                        const sliceName = `${String(startIndex + idx + 1).padStart(2, '0')}.${ext}`;
                        
                        const meta = {
                            slicingMode: 'grid',
                            gridType: state.gridType,
                            cellIndex: idx,
                            isLarge: cell.isLarge,
                            targetW: tW,
                            targetH: tH
                        };
                        processSlice(sx, sy, cropW, cropH, sliceName, resultId, tW, tH, meta);
                    });
                }
            } else {
                if (state.selectionBoxes.length === 0) {
                    showToast('Hãy vẽ ít nhất 1 khung cắt!', 'warning');
                    return;
                }

                const firstBox = state.selectionBoxes[0];
                const firstCropW = firstBox.w - (2 * offset);
                const firstCropH = firstBox.h - (2 * offset);

                if (firstCropW <= 0 || firstCropH <= 0) {
                    showToast("Khung vẽ quá nhỏ. Giảm Offset!", "error");
                    return;
                }

                if (!state.globalTargetW || !state.globalTargetH) {
                    const scale = getExportScale(firstCropW);
                    state.globalTargetW = Math.round(firstCropW * scale);
                    state.globalTargetH = Math.round(firstCropH * scale);
                }

                state.selectionBoxes.forEach((box, idx) => {
                    const sx = box.x + offset;
                    const sy = box.y + offset;
                    const cropW = box.w - (2 * offset);
                    const cropH = box.h - (2 * offset);

                    if (cropW <= 0 || cropH <= 0) {
                        showToast(`Khung ${box.id} quá nhỏ. Giảm Offset!`, "error");
                        return;
                    }

                    const kept = keptImages.find(img => img.meta && img.meta.slicingMode === 'box' && img.meta.boxId === box.id);
                    if (kept) {
                        const currentExt = kept.name.split('.').pop() || ext;
                        const nameIsDefault = /^slide_\d+$/.test(kept.name.replace(/\.[^/.]+$/, "")) || /^\d+$/.test(kept.name.replace(/\.[^/.]+$/, ""));
                        if (nameIsDefault) {
                            kept.name = `${String(startIndex + idx + 1).padStart(2, '0')}.${currentExt}`;
                        }
                        state.slicedImages.push(kept);
                        return;
                    }

                    const resultId = state.resultIdCounter++;
                    const sliceName = `${String(startIndex + idx + 1).padStart(2, '0')}.${ext}`;
                    
                    const scale = getExportScale(cropW);
                    const cellTargetW = Math.round(cropW * scale);
                    const cellTargetH = Math.round(cropH * scale);

                    const meta = {
                        slicingMode: 'box',
                        boxId: box.id,
                        targetW: cellTargetW,
                        targetH: cellTargetH
                    };
                    processSlice(sx, sy, cropW, cropH, sliceName, resultId, cellTargetW, cellTargetH, meta);
                });
            }

            const totalImages = state.slicedImages.length;
            resultCount.textContent = totalImages;
            if (resultCountBadge) {
                resultCountBadge.textContent = totalImages;
            }

            if (state.gridType === 'fb-1d3v' || state.gridType === 'fb-1n3v') {
                resultGrid.className = `result-grid layout-${state.gridType}`;
            } else {
                resultGrid.className = 'result-grid';
            }

            tabBtnResult.disabled = false;
            switchTab('tab-result-grid');
            
            if (mobileNavResult) mobileNavResult.classList.remove('disabled');
            switchMobileTab('result');

            restoreResultGrid(state.slicedImages, true);

            saveLocalProjectState();
            saveProjectToDB();
        });
    }

    if (btnDownloadZip) {
        btnDownloadZip.addEventListener('click', downloadAllImages);
    }

    // PC Tab Switcher Events
    if (tabBtnLive) {
        tabBtnLive.addEventListener('click', () => switchTab('tab-live-grid'));
    }
    if (tabBtnResult) {
        tabBtnResult.addEventListener('click', () => switchTab('tab-result-grid'));
    }

    // Mobile Navigation Bottom Buttons Events
    [mobileNavUpload, mobileNavEdit, mobileNavResult].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                const tabId = btn.getAttribute('data-tab');
                switchMobileTab(tabId);
            });
        }
    });

    // Toggle Mobile Params Sheet Event
    if (btnMobileToggleParams && sidebar) {
        btnMobileToggleParams.addEventListener('click', () => {
            const isOpened = sidebar.classList.toggle('active-params');
            if (isOpened) {
                btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                btnMobileToggleParams.classList.add('active');
            } else {
                btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-sliders"></i> Tùy chỉnh thông số';
                btnMobileToggleParams.classList.remove('active');
            }
        });
    }

    if (btnClearResults) {
        btnClearResults.addEventListener('click', () => {
            showConfirm("Bạn có chắc chắn muốn xóa tất cả các slide ảnh kết quả hiện tại?", () => {
                state.slicedImages = [];
                state.slicedBlobs = [];
                resultGrid.innerHTML = '';
                resultGrid.className = 'result-grid';
                resultCount.textContent = '0';
                if (resultCountBadge) {
                    resultCountBadge.textContent = '0';
                }
                btnDownloadZip.disabled = true;
                if (btnDownloadZip) btnDownloadZip.style.display = 'none';
                if (btnClearResults) btnClearResults.style.display = 'none';
                if (btnRenumberResults) btnRenumberResults.style.display = 'none';
                if (btnMobilePreview) btnMobilePreview.style.display = 'none';
                state.globalTargetW = null;
                state.globalTargetH = null;
                saveLocalProjectState();
            });
        });
    }

    if (btnRenumberResults) {
        btnRenumberResults.addEventListener('click', () => {
            if (state.slicedImages.length === 0) return;
            
            showConfirm("Bạn có chắc chắn muốn đổi tên và đánh số lại toàn bộ các slide kết quả hiện tại theo thứ tự từ 01 đến " + String(state.slicedImages.length).padStart(2, '0') + "?", () => {
                const orderedItems = Array.from(resultGrid.children);
                orderedItems.forEach((resultItem, index) => {
                    const resultId = parseInt(resultItem.dataset.id);
                    const newIndexStr = String(index + 1).padStart(2, '0');
                    const extVal = state.exportFormat === 'png' ? 'png' : (state.exportFormat === 'jpeg' ? 'jpg' : 'webp');
                    const newName = `${newIndexStr}.${extVal}`;
                    const newBaseName = newIndexStr;

                    const nameInput = resultItem.querySelector('.result-item-name-input');
                    if (nameInput) {
                        nameInput.value = newBaseName;
                        nameInput.style.width = Math.max(12, Math.min(120, nameInput.value.length * 7.5)) + 'px';
                    }

                    const btnDl = resultItem.querySelector('.result-item-btn-dl');
                    if (btnDl) {
                        btnDl.title = `Tải xuống ${newName}`;
                    }

                    const imgObj = state.slicedImages.find(item => item.id === resultId);
                    if (imgObj) {
                        imgObj.name = newName;
                    }

                    const blobObj = state.slicedBlobs.find(item => item.id === resultId);
                    if (blobObj) {
                        blobObj.name = newName;
                    }
                });

                // sync order
                const orderedIds = Array.from(resultGrid.children).map(el => parseInt(el.dataset.id));
                const newSlicedImages = [];
                const newSlicedBlobs = [];
                orderedIds.forEach(id => {
                    const img = state.slicedImages.find(item => item.id === id);
                    if (img) newSlicedImages.push(img);
                    const blob = state.slicedBlobs.find(item => item.id === id);
                    if (blob) newSlicedBlobs.push(blob);
                });
                state.slicedImages = newSlicedImages;
                state.slicedBlobs = newSlicedBlobs;

                showToast("Đã đánh số lại các slide!", "success");
                saveLocalProjectState();
            });
        });
    }

    // 5. Mobile Preview Modal and Carousel
    if (btnMobilePreview && mobilePreviewModal) {
        btnMobilePreview.addEventListener('click', () => {
            if (state.slicedImages.length === 0) return;

            const isFacebookMode = (state.gridType === 'fb-1d3v' || state.gridType === 'fb-1n3v');

            const fakeTiktokUi = mobilePreviewModal.querySelector('.fake-tiktok-ui');
            const fakeTiktokNav = mobilePreviewModal.querySelector('.fake-tiktok-nav');
            const fakeFacebookUi = mobilePreviewModal.querySelector('.fake-facebook-ui');
            const fakeFacebookNav = mobilePreviewModal.querySelector('.fake-facebook-nav');
            const previewHint = mobilePreviewModal.querySelector('.mobile-preview-hint');
            const fbPostGrid = mobilePreviewModal.querySelector('#fb-post-grid');

            const orderedIds = Array.from(resultGrid.children).map(el => parseInt(el.dataset.id));

            if (isFacebookMode) {
                if (fakeTiktokUi) fakeTiktokUi.style.display = 'none';
                if (fakeTiktokNav) fakeTiktokNav.style.display = 'none';
                if (mobileCarouselSlider) mobileCarouselSlider.style.display = 'none';
                if (mobileCarouselDots) mobileCarouselDots.style.display = 'none';
                if (previewHint) previewHint.style.display = 'none';

                if (fakeFacebookUi) fakeFacebookUi.style.display = 'block';
                if (fakeFacebookNav) fakeFacebookNav.style.display = 'flex';

                if (fbPostGrid) {
                    fbPostGrid.innerHTML = '';
                    fbPostGrid.className = `fb-post-grid fb-grid-${state.gridType}`;
                    
                    orderedIds.forEach((id) => {
                        const imgData = state.slicedImages.find(item => item.id === id);
                        if (imgData) {
                            const img = document.createElement('img');
                            img.src = imgData.dataUrl;
                            img.alt = imgData.name;
                            img.classList.add('fb-post-img');
                            fbPostGrid.appendChild(img);
                        }
                    });
                }
            } else {
                if (fakeFacebookUi) fakeFacebookUi.style.display = 'none';
                if (fakeFacebookNav) fakeFacebookNav.style.display = 'none';

                if (fakeTiktokUi) fakeTiktokUi.style.display = 'block';
                if (fakeTiktokNav) fakeTiktokNav.style.display = 'flex';
                if (mobileCarouselSlider) mobileCarouselSlider.style.display = 'flex';
                if (mobileCarouselDots) mobileCarouselDots.style.display = 'flex';
                if (previewHint) previewHint.style.display = 'block';

                mobileCarouselSlider.innerHTML = '';
                mobileCarouselDots.innerHTML = '';

                orderedIds.forEach((id, index) => {
                    const imgData = state.slicedImages.find(item => item.id === id);
                    if (imgData) {
                        const slide = document.createElement('div');
                        slide.classList.add('mobile-carousel-slide');
                        slide.dataset.index = index;

                        const img = document.createElement('img');
                        img.src = imgData.dataUrl;
                        img.alt = imgData.name;
                        slide.appendChild(img);

                        mobileCarouselSlider.appendChild(slide);

                        const dot = document.createElement('div');
                        dot.classList.add('mobile-carousel-dot');
                        if (index === 0) dot.classList.add('active');
                        dot.dataset.index = index;
                        
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

                mobileCarouselSlider.scrollLeft = 0;
                currentSlideIndex = 0;
                updateActiveDot(0);
            }

            mobilePreviewModal.style.display = 'flex';
        });
    }

    if (btnCloseMobilePreview && mobilePreviewModal) {
        btnCloseMobilePreview.addEventListener('click', () => {
            mobilePreviewModal.style.display = 'none';
        });
    }

    if (mobilePreviewModal) {
        mobilePreviewModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('mobile-preview-modal') || e.target.classList.contains('mobile-preview-backdrop')) {
                mobilePreviewModal.style.display = 'none';
            }
        });
    }

    if (mobileCarouselSlider) {
        mobileCarouselSlider.addEventListener('scroll', () => {
            const sliderWidth = mobileCarouselSlider.clientWidth;
            const scrollLeft = mobileCarouselSlider.scrollLeft;
            const activeIndex = Math.round(scrollLeft / sliderWidth);
            currentSlideIndex = activeIndex;
            updateActiveDot(activeIndex);
        });
    }

    // Touch and mouse swipes support for mobile slider preview
    let isSwipeDragging = false;
    let swipeStartX = 0;
    let swipeStartScrollLeft = 0;
    let swipeStartTime = 0;

    const getClientSwipeX = (e) => {
        return e.touches ? e.touches[0].clientX : e.clientX;
    };

    const handleSwipeStart = (e) => {
        if (!mobileCarouselSlider) return;
        isSwipeDragging = true;
        swipeStartX = getClientSwipeX(e);
        swipeStartScrollLeft = mobileCarouselSlider.scrollLeft;
        swipeStartTime = Date.now();
        mobileCarouselSlider.style.scrollSnapType = 'none';
        mobileCarouselSlider.style.scrollBehavior = 'auto';
    };

    const handleSwipeMove = (e) => {
        if (!isSwipeDragging || !mobileCarouselSlider) return;
        if (e.cancelable) e.preventDefault();
        const currentX = getClientSwipeX(e);
        const dx = currentX - swipeStartX;
        mobileCarouselSlider.scrollLeft = swipeStartScrollLeft - dx;
    };

    const handleSwipeEnd = (e) => {
        if (!isSwipeDragging || !mobileCarouselSlider) return;
        isSwipeDragging = false;
        
        let endX = swipeStartX;
        if (e.changedTouches && e.changedTouches.length > 0) {
            endX = e.changedTouches[0].clientX;
        } else if (e.clientX) {
            endX = e.clientX;
        }
        
        const dx = endX - swipeStartX;
        const duration = Date.now() - swipeStartTime;
        const slideWidth = mobileCarouselSlider.clientWidth || 1;
        const totalSlides = mobileCarouselSlider.children.length;
        
        mobileCarouselSlider.style.scrollBehavior = 'smooth';
        
        let targetIndex = currentSlideIndex;
        if (duration < 250 && Math.abs(dx) > 30) {
            if (dx < 0) {
                targetIndex = Math.min(totalSlides - 1, currentSlideIndex + 1);
            } else {
                targetIndex = Math.max(0, currentSlideIndex - 1);
            }
        } else if (Math.abs(dx) > slideWidth * 0.20) {
            if (dx < 0) {
                targetIndex = Math.min(totalSlides - 1, currentSlideIndex + 1);
            } else {
                targetIndex = Math.max(0, currentSlideIndex - 1);
            }
        } else {
            const currentScroll = mobileCarouselSlider.scrollLeft;
            targetIndex = Math.round(currentScroll / slideWidth);
        }
        
        targetIndex = Math.max(0, Math.min(totalSlides - 1, targetIndex));
        mobileCarouselSlider.scrollTo({
            left: targetIndex * slideWidth,
            behavior: 'smooth'
        });
        
        currentSlideIndex = targetIndex;
        updateActiveDot(targetIndex);
        
        setTimeout(() => {
            if (mobileCarouselSlider) {
                mobileCarouselSlider.style.scrollSnapType = 'x mandatory';
            }
        }, 300);
    };

    if (mobileCarouselSlider) {
        mobileCarouselSlider.addEventListener('mousedown', handleSwipeStart);
        window.addEventListener('mousemove', handleSwipeMove);
        window.addEventListener('mouseup', handleSwipeEnd);
        mobileCarouselSlider.addEventListener('touchstart', handleSwipeStart, { passive: false });
        mobileCarouselSlider.addEventListener('touchmove', handleSwipeMove, { passive: false });
        mobileCarouselSlider.addEventListener('touchend', handleSwipeEnd, { passive: true });
    }

    // Toggle Sidebar controls on PC
    if (btnToggleSidebar && appContent) {
        btnToggleSidebar.addEventListener('click', () => {
            const isCollapsed = appContent.classList.toggle('sidebar-collapsed');
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
            setTimeout(() => {
                drawLiveGrid();
            }, 300);
        });
    }

    // PC Account Auth Popup Events
    if (sidebarAccountPanel && pcAuthPopup) {
        sidebarAccountPanel.addEventListener('click', (e) => {
            if (pcAuthPopup.contains(e.target)) return;
            e.stopPropagation();
            pcAuthPopup.classList.toggle('active');
        });
        pcAuthPopup.addEventListener('click', (e) => e.stopPropagation());
    }

    if (linkPcAuthSwitch) {
        linkPcAuthSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (pcAuthMode === 'login') {
                pcAuthMode = 'register';
                if (pcAuthTitle) pcAuthTitle.textContent = 'Đăng Ký Tài Khoản';
                if (btnPcAuthSubmit) btnPcAuthSubmit.textContent = 'Đăng ký';
                if (pcAuthSwitchText) pcAuthSwitchText.textContent = 'Đã có tài khoản?';
                linkPcAuthSwitch.textContent = 'Đăng nhập';
            } else {
                pcAuthMode = 'login';
                if (pcAuthTitle) pcAuthTitle.textContent = 'Đăng Nhập Hệ Thống';
                if (btnPcAuthSubmit) btnPcAuthSubmit.textContent = 'Đăng nhập';
                if (pcAuthSwitchText) pcAuthSwitchText.textContent = 'Chưa có tài khoản?';
                linkPcAuthSwitch.textContent = 'Đăng ký ngay';
            }
        });
    }

    if (btnPcAuthSubmit) {
        btnPcAuthSubmit.addEventListener('click', () => {
            if (pcAuthMode === 'login') performLogin('pc-username-input', 'pc-password-input');
            else performRegister('pc-username-input', 'pc-password-input');
        });
    }

    const btnPcLogout = document.getElementById('btn-pc-logout');
    if (btnPcLogout) btnPcLogout.addEventListener('click', performLogout);

    const pcUserIn = document.getElementById('pc-username-input');
    const pcPassIn = document.getElementById('pc-password-input');
    const triggerPcAuthOnEnter = (e) => {
        if (e.key === 'Enter') {
            if (pcAuthMode === 'login') performLogin('pc-username-input', 'pc-password-input');
            else performRegister('pc-username-input', 'pc-password-input');
        }
    };
    if (pcUserIn) pcUserIn.addEventListener('keydown', triggerPcAuthOnEnter);
    if (pcPassIn) pcPassIn.addEventListener('keydown', triggerPcAuthOnEnter);

    // Mobile Account Drawer Auth Events
    const mobileDrawer = document.getElementById('mobile-drawer');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const mobileDrawerBackdrop = document.getElementById('mobile-drawer-backdrop');

    if (mobileDrawer && btnMobileMenu) {
        btnMobileMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileDrawer.classList.add('active');
        });
    }

    const closeMobileDrawer = () => {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
    };

    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeMobileDrawer);
    if (mobileDrawerBackdrop) mobileDrawerBackdrop.addEventListener('click', closeMobileDrawer);

    const linkMobileAuthSwitch = document.getElementById('link-mobile-auth-switch');
    const mobileAuthTitle = document.getElementById('mobile-auth-title');
    const btnMobileAuthSubmit = document.getElementById('btn-mobile-auth-submit');
    const mobileAuthSwitchText = document.getElementById('mobile-auth-switch-text');
    if (linkMobileAuthSwitch) {
        linkMobileAuthSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (mobileAuthMode === 'login') {
                mobileAuthMode = 'register';
                if (mobileAuthTitle) mobileAuthTitle.textContent = 'Đăng Ký Tài Khoản';
                if (btnMobileAuthSubmit) btnMobileAuthSubmit.textContent = 'Đăng ký';
                if (mobileAuthSwitchText) mobileAuthSwitchText.textContent = 'Đã có tài khoản?';
                linkMobileAuthSwitch.textContent = 'Đăng nhập';
            } else {
                mobileAuthMode = 'login';
                if (mobileAuthTitle) mobileAuthTitle.textContent = 'Đăng Nhập Hệ Thống';
                if (btnMobileAuthSubmit) btnMobileAuthSubmit.textContent = 'Đăng nhập';
                if (mobileAuthSwitchText) mobileAuthSwitchText.textContent = 'Chưa có tài khoản?';
                linkMobileAuthSwitch.textContent = 'Đăng ký ngay';
            }
        });
    }

    if (btnMobileAuthSubmit) {
        btnMobileAuthSubmit.addEventListener('click', () => {
            if (mobileAuthMode === 'login') performLogin('mobile-username-input', 'mobile-password-input');
            else performRegister('mobile-username-input', 'mobile-password-input');
        });
    }

    const btnMobileLogout = document.getElementById('btn-mobile-logout');
    if (btnMobileLogout) btnMobileLogout.addEventListener('click', performLogout);

    const mobUserIn = document.getElementById('mobile-username-input');
    const mobPassIn = document.getElementById('mobile-password-input');
    const triggerMobileAuthOnEnter = (e) => {
        if (e.key === 'Enter') {
            if (mobileAuthMode === 'login') performLogin('mobile-username-input', 'mobile-password-input');
            else performRegister('mobile-username-input', 'mobile-password-input');
        }
    };
    if (mobUserIn) mobUserIn.addEventListener('keydown', triggerMobileAuthOnEnter);
    if (mobPassIn) mobPassIn.addEventListener('keydown', triggerMobileAuthOnEnter);

    // 6. Project History DB sync triggers
    const btnHistoryToggle = document.getElementById('btn-history-toggle');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const historyPopup = document.getElementById('history-popup');
    const historyBackdrop = document.getElementById('history-backdrop');

    if (btnHistoryToggle && historyPopup) {
        btnHistoryToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            historyPopup.classList.toggle('active');
            if (historyBackdrop) historyBackdrop.classList.toggle('active');
            if (historyPopup.classList.contains('active')) {
                loadHistoryFromDB();
            }
        });
    }

    if (btnCloseHistory && historyPopup) {
        btnCloseHistory.addEventListener('click', (e) => {
            e.stopPropagation();
            historyPopup.classList.remove('active');
            if (historyBackdrop) historyBackdrop.classList.remove('active');
        });
    }

    if (historyBackdrop) {
        historyBackdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            historyPopup.classList.remove('active');
            historyBackdrop.classList.remove('active');
        });
    }

    const triggerSyncRefresh = async (btnId) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const icon = btn.querySelector('i');
            if (icon) icon.classList.add('spinning');
            
            try {
                await loadHistoryFromDB();
            } finally {
                if (icon) {
                    setTimeout(() => {
                        icon.classList.remove('spinning');
                    }, 800);
                }
            }
        });
    };
    triggerSyncRefresh('btn-pc-sync-refresh');
    triggerSyncRefresh('btn-mobile-sync-refresh');

    // 7. Config Import/Export Buttons
    const btnImportProject = document.getElementById('btn-import-project');
    const importProjectInput = document.getElementById('import-project-input');
    const btnPcImportProject = document.getElementById('btn-pc-import-project');
    const pcImportProjectInput = document.getElementById('pc-import-project-input');

    if (btnImportProject && importProjectInput) {
        btnImportProject.addEventListener('click', () => importProjectInput.click());
        importProjectInput.addEventListener('change', (e) => handleImportFile(e.target.files[0]));
    }

    if (btnPcImportProject && pcImportProjectInput) {
        btnPcImportProject.addEventListener('click', () => pcImportProjectInput.click());
        pcImportProjectInput.addEventListener('change', (e) => handleImportFile(e.target.files[0]));
    }

    // 8. Shortcuts Keyboard Info Box Toggle
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
    document.addEventListener('click', (e) => {
        if (shortcutsPopup && shortcutsPopup.classList.contains('active')) {
            if (!shortcutsPopup.contains(e.target) && e.target !== btnShortcutsToggle && !btnShortcutsToggle.contains(e.target)) {
                shortcutsPopup.classList.remove('active');
            }
        }
    });

    // 9. Password Unlock Screen
    if (btnUnlockApp && appPasswordInput) {
        const unlock = () => {
            const val = appPasswordInput.value;
            if (val === constants.CORRECT_PASSWORD) {
                localStorage.setItem('app_unlocked', 'true');
                passwordGate.classList.add('fade-out');
                setTimeout(() => {
                    passwordGate.style.display = 'none';
                }, 400);
            } else {
                const box = passwordGate.querySelector('.password-box');
                if (box) {
                    box.classList.remove('shake');
                    void box.offsetWidth; 
                    box.classList.add('shake');
                }
                if (passwordErrorMessage) {
                    passwordErrorMessage.style.display = 'block';
                }
            }
        };

        btnUnlockApp.addEventListener('click', unlock);
        appPasswordInput.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') unlock();
        });
    }

    if (btnTogglePasswordVisibility && appPasswordInput) {
        btnTogglePasswordVisibility.addEventListener('click', () => {
            const icon = btnTogglePasswordVisibility.querySelector('i');
            if (appPasswordInput.type === 'password') {
                appPasswordInput.type = 'text';
                if (icon) icon.className = 'fa-solid fa-eye-slash';
            } else {
                appPasswordInput.type = 'password';
                if (icon) icon.className = 'fa-solid fa-eye';
            }
        });
    }

    // 10. PC Settings View / Auth View navigation
    const globalSettingsWrapper = document.getElementById('global-settings-wrapper');
    const pcSettingsTeleportZone = document.getElementById('pc-settings-teleport-zone');
    const mobileSettingsTeleportZone = document.getElementById('mobile-settings-teleport-zone');
    const pcAuthContentView = document.getElementById('pc-auth-content-view');
    const pcSettingsView = document.getElementById('pc-settings-view');
    const mobileAuthContentView = document.getElementById('mobile-auth-content-view');
    const mobileSettingsView = document.getElementById('mobile-settings-view');

    const expandAllSettingsPanels = () => {
        const panelWatermark = document.getElementById('panel-watermark');
        const contentWatermark = document.getElementById('content-watermark');
        const panelExportSettings = document.getElementById('panel-export-settings');
        const contentExportSettings = document.getElementById('content-export-settings');

        if (panelWatermark && contentWatermark) {
            panelWatermark.classList.add('expanded');
            contentWatermark.style.display = 'block';
        }
        if (panelExportSettings && contentExportSettings) {
            panelExportSettings.classList.add('expanded');
            contentExportSettings.style.display = 'block';
        }
    };

    const switchToPcSettings = () => {
        if (globalSettingsWrapper && pcSettingsTeleportZone) {
            globalSettingsWrapper.style.display = 'block';
            expandAllSettingsPanels();
        }
        if (pcAuthContentView) pcAuthContentView.style.display = 'none';
        if (pcSettingsView) pcSettingsView.style.display = 'flex';
    };

    const switchToPcAuth = () => {
        if (pcAuthContentView) pcAuthContentView.style.display = 'flex';
        if (pcSettingsView) pcSettingsView.style.display = 'none';
    };

    const switchToMobileSettings = () => {
        if (globalSettingsWrapper && mobileSettingsTeleportZone) {
            globalSettingsWrapper.style.display = 'block';
            expandAllSettingsPanels();
        }
        if (mobileAuthContentView) mobileAuthContentView.style.display = 'none';
        if (mobileSettingsView) mobileSettingsView.style.display = 'flex';
    };

    const switchToMobileAuth = () => {
        if (mobileAuthContentView) mobileAuthContentView.style.display = 'flex';
        if (mobileSettingsView) mobileSettingsView.style.display = 'none';
    };

    const btnPcSettingsHeader = document.getElementById('btn-pc-settings-header');
    if (btnPcSettingsHeader) {
        btnPcSettingsHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            if (pcSettingsView && pcSettingsView.style.display === 'flex') switchToPcAuth();
            else switchToPcSettings();
        });
    }
    document.querySelectorAll('.btn-pc-settings-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchToPcSettings();
        });
    });
    const btnPcSettingsBack = document.getElementById('btn-pc-settings-back');
    if (btnPcSettingsBack) {
        btnPcSettingsBack.addEventListener('click', (e) => {
            e.stopPropagation();
            switchToPcAuth();
        });
    }

    const btnMobileSettingsHeader = document.getElementById('btn-mobile-settings-header');
    if (btnMobileSettingsHeader) {
        btnMobileSettingsHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileSettingsView && mobileSettingsView.style.display === 'flex') switchToMobileAuth();
            else switchToMobileSettings();
        });
    }
    document.querySelectorAll('.btn-mobile-settings-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchToMobileSettings();
        });
    });
    const btnMobileSettingsBack = document.getElementById('btn-mobile-settings-back');
    if (btnMobileSettingsBack) {
        btnMobileSettingsBack.addEventListener('click', (e) => {
            e.stopPropagation();
            switchToMobileAuth();
        });
    }

    if (btnCloseAuthPopup && pcAuthPopup) {
        btnCloseAuthPopup.addEventListener('click', (e) => {
            e.stopPropagation();
            pcAuthPopup.classList.remove('active');
            setTimeout(switchToPcAuth, 300);
        });
    }
    const btnCloseSettingsPopup = document.getElementById('btn-close-settings-popup');
    if (btnCloseSettingsPopup && pcAuthPopup) {
        btnCloseSettingsPopup.addEventListener('click', (e) => {
            e.stopPropagation();
            pcAuthPopup.classList.remove('active');
            setTimeout(switchToPcAuth, 300);
        });
    }
    if (btnCloseDrawer) {
        btnCloseDrawer.addEventListener('click', () => {
            setTimeout(switchToMobileAuth, 300);
        });
    }
    const btnCloseSettingsDrawer = document.getElementById('btn-close-settings-drawer');
    if (btnCloseSettingsDrawer) {
        btnCloseSettingsDrawer.addEventListener('click', () => {
            closeMobileDrawer();
            setTimeout(switchToMobileAuth, 300);
        });
    }
    if (mobileDrawerBackdrop) {
        mobileDrawerBackdrop.addEventListener('click', () => {
            setTimeout(switchToMobileAuth, 300);
        });
    }
    document.addEventListener('click', (e) => {
        if (pcAuthPopup && pcAuthPopup.classList.contains('active')) {
            if (!pcAuthPopup.contains(e.target) && e.target !== sidebarAccountPanel && !sidebarAccountPanel.contains(e.target)) {
                pcAuthPopup.classList.remove('active');
                setTimeout(switchToPcAuth, 300);
            }
        }

        // Close canvas file badge when clicked outside
        if (fileInfo && fileInfo.classList.contains('active')) {
            if (!fileInfo.contains(e.target)) {
                fileInfo.classList.remove('active');
            }
        }
    });

    // 11. Canvas Interaction: Mouse Events setup on previewCanvas
    if (previewCanvas) {
        previewCanvas.addEventListener('mousedown', (e) => {
            if (!state.currentImage) return;

            if (state.spacePressed) {
                state.isPanning = true;
                previewCanvas.style.cursor = 'grabbing';
                state.panStart = { x: e.clientX, y: e.clientY };
                return;
            }

            const coords = getNaturalCoords(e.clientX, e.clientY);
            const imgX = coords.x;
            const imgY = coords.y;

            const recutAction = checkRecutButtonInteraction(imgX, imgY);
            if (recutAction) {
                if (recutAction === 'confirm') {
                    showConfirm("Bạn có chắc chắn muốn lưu thay đổi cắt lại cho slide này?", () => {
                        handleConfirmRecut();
                    });
                } else if (recutAction === 'cancel') {
                    handleCancelRecut();
                }
                return;
            }

            state.lastDragMouseX = imgX;
            state.lastDragMouseY = imgY;

            if (state.recutSlideId !== null && state.recutTempCoords) {
                const action = getRecutInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
                if (action) {
                    state.dragRecutTarget = {
                        action: action,
                        startX: imgX,
                        startY: imgY,
                        originalCoords: { ...state.recutTempCoords }
                    };
                    drawLiveGrid();
                    return;
                } else {
                    state.isPanning = true;
                    previewCanvas.style.cursor = 'grabbing';
                    state.panStart = { x: e.clientX, y: e.clientY };
                    return;
                }
            }

            if (state.slicingMode === 'grid') {
                const target = findNearestGridLine(e.clientX, e.clientY);
                if (target) {
                    resetToEvenGridType();
                    state.dragTarget = target;
                } else {
                    state.isPanning = true;
                    previewCanvas.style.cursor = 'grabbing';
                    state.panStart = { x: e.clientX, y: e.clientY };
                }
            } else {
                const interaction = getBoxInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
                if (interaction) {
                    resetToEvenGridType();
                    state.selectedBoxIdx = interaction.boxIndex;
                    if (interaction.actionType === 'delete') {
                        state.selectionBoxes.splice(interaction.boxIndex, 1);
                        state.selectionBoxes.forEach((box, idx) => {
                            box.id = idx + 1;
                        });
                        state.nextBoxId = state.selectionBoxes.length + 1;
                        state.selectedBoxIdx = -1;
                        gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
                        handleParamsChange();
                        drawLiveGrid();
                    } else {
                        const box = state.selectionBoxes[interaction.boxIndex];
                        state.dragBoxTarget = {
                            boxIndex: interaction.boxIndex,
                            actionType: interaction.actionType,
                            startX: imgX,
                            startY: imgY,
                            originalBox: { x: box.x, y: box.y, w: box.w, h: box.h }
                        };
                        drawLiveGrid();
                    }
                } else {
                    resetToEvenGridType();
                    state.selectedBoxIdx = -1;
                    state.isDrawingNewBox = true;
                    state.newBoxStart = { x: imgX, y: imgY };
                    
                    let initialW = 0;
                    let initialH = 0;
                    if (state.isUniformSize && state.selectionBoxes.length > 0) {
                        initialW = state.selectionBoxes[0].w;
                        initialH = state.selectionBoxes[0].h;
                    }

                    state.selectionBoxes.push({
                        id: state.nextBoxId++,
                        x: imgX,
                        y: imgY,
                        w: initialW,
                        h: initialH
                    });
                    state.selectedBoxIdx = state.selectionBoxes.length - 1;
                    gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
                    drawLiveGrid();
                }
            }
        });

        previewCanvas.addEventListener('mousemove', (e) => {
            if (!state.currentImage) return;

            if (state.isPanning) {
                const dx = e.clientX - state.panStart.x;
                const dy = e.clientY - state.panStart.y;
                state.panStart = { x: e.clientX, y: e.clientY };

                const canvasWrapper = document.querySelector('.canvas-wrapper');
                if (canvasWrapper) {
                    canvasWrapper.scrollLeft -= dx;
                    canvasWrapper.scrollTop -= dy;
                }
                return;
            }

            if (state.spacePressed) {
                previewCanvas.style.cursor = 'grab';
                return;
            }

            const coords = getNaturalCoords(e.clientX, e.clientY);
            const imgX = coords.x;
            const imgY = coords.y;

            if (state.recutSlideId !== null && state.dragRecutTarget) {
                const orig = state.dragRecutTarget.originalCoords;
                const action = state.dragRecutTarget.action;

                let deltaX = imgX - state.dragRecutTarget.startX;
                let deltaY = imgY - state.dragRecutTarget.startY;
                if (e.altKey) {
                    deltaX *= 0.15;
                    deltaY *= 0.15;
                }

                if (e.shiftKey && action === 'move') {
                    if (Math.abs(imgX - state.dragRecutTarget.startX) > Math.abs(imgY - state.dragRecutTarget.startY)) {
                        deltaY = 0;
                    } else {
                        deltaX = 0;
                    }
                }

                let newSx = orig.sx;
                let newSy = orig.sy;
                let newW = orig.cropW;
                let newH = orig.cropH;
                const minSize = 20;

                if (action === 'move') {
                    newSx = Math.max(0, Math.min(state.currentImage.naturalWidth - newW, orig.sx + deltaX));
                    newSy = Math.max(0, Math.min(state.currentImage.naturalHeight - newH, orig.sy + deltaY));
                } else {
                    if (action.includes('l')) {
                        const proposedSx = orig.sx + deltaX;
                        const limitX = orig.sx + orig.cropW - minSize;
                        newSx = Math.max(0, Math.min(limitX, proposedSx));
                        newW = orig.cropW + (orig.sx - newSx);
                    }
                    if (action.includes('r')) {
                        const proposedW = orig.cropW + deltaX;
                        const maxW = state.currentImage.naturalWidth - orig.sx;
                        newW = Math.max(minSize, Math.min(maxW, proposedW));
                    }
                    if (action.includes('t')) {
                        const proposedSy = orig.sy + deltaY;
                        const limitY = orig.sy + orig.cropH - minSize;
                        newSy = Math.max(0, Math.min(limitY, proposedSy));
                        newH = orig.cropH + (orig.sy - newSy);
                    }
                    if (action.includes('b')) {
                        const proposedH = orig.cropH + deltaY;
                        const maxH = state.currentImage.naturalHeight - orig.sy;
                        newH = Math.max(minSize, Math.min(maxH, proposedH));
                    }
                }

                state.recutTempCoords = {
                    sx: Math.round(newSx),
                    sy: Math.round(newSy),
                    cropW: Math.round(newW),
                    cropH: Math.round(newH)
                };

                if (action === 'tl' || action === 'br') previewCanvas.style.cursor = 'nwse-resize';
                else if (action === 'tr' || action === 'bl') previewCanvas.style.cursor = 'nesw-resize';
                else if (action === 'l' || action === 'r') previewCanvas.style.cursor = 'ew-resize';
                else if (action === 't' || action === 'b') previewCanvas.style.cursor = 'ns-resize';
                else if (action === 'move') previewCanvas.style.cursor = 'move';

                drawLiveGrid();
                return;
            }

            if (state.recutSlideId !== null && state.recutTempCoords && !state.dragRecutTarget) {
                const recutAction = checkRecutButtonInteraction(imgX, imgY);
                if (recutAction) {
                    previewCanvas.style.cursor = 'pointer';
                    const tooltipText = recutAction === 'confirm' ? 'Xác nhận cắt lại' : 'Hủy cắt lại';
                    const shortcutText = recutAction === 'confirm' ? 'Enter' : 'Esc';
                    showCustomTooltip(tooltipText, shortcutText, e.clientX, e.clientY);
                    return;
                } else {
                    hideCustomTooltip();
                }

                const action = getRecutInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
                if (action) {
                    if (action === 'tl' || action === 'br') previewCanvas.style.cursor = 'nwse-resize';
                    else if (action === 'tr' || action === 'bl') previewCanvas.style.cursor = 'nesw-resize';
                    else if (action === 'l' || action === 'r') previewCanvas.style.cursor = 'ew-resize';
                    else if (action === 't' || action === 'b') previewCanvas.style.cursor = 'ns-resize';
                    else if (action === 'move') previewCanvas.style.cursor = 'move';
                    return;
                }
            }

            if (state.slicingMode === 'grid') {
                if (state.dragTarget) {
                    let deltaX = imgX - state.lastDragMouseX;
                    let deltaY = imgY - state.lastDragMouseY;
                    if (e.altKey) {
                        deltaX *= 0.15;
                        deltaY *= 0.15;
                    }

                    if (state.dragTarget.type === 'col') {
                        let idx = state.dragTarget.index;
                        const width = state.currentImage.naturalWidth;
                        let currentDeltaX = imgX - state.lastDragMouseX;
                        if (e.altKey) currentDeltaX *= 0.15;
                        let targetX = state.colsX[idx] + currentDeltaX;
                        
                        let swapped = true;
                        while (swapped) {
                            swapped = false;
                            if (idx < state.colsX.length - 1 && imgX > state.colsX[idx + 1]) {
                                const temp = state.colsX[idx];
                                state.colsX[idx] = state.colsX[idx + 1];
                                state.colsX[idx + 1] = temp;
                                idx++; swapped = true;
                            } else if (idx > 0 && imgX < state.colsX[idx - 1]) {
                                const temp = state.colsX[idx];
                                state.colsX[idx] = state.colsX[idx - 1];
                                state.colsX[idx - 1] = temp;
                                idx--; swapped = true;
                            }
                        }
                        state.dragTarget.index = idx;
                        let minLimit = 0; let maxLimit = width;
                        if (idx > 0) minLimit = state.colsX[idx - 1] + 20;
                        if (idx < state.colsX.length - 1) maxLimit = state.colsX[idx + 1] - 20;
                        const scaleX = coords.scaleX;
                        const dragOutLimit = 80 * scaleX; // Cho phép kéo ra ngoài tối đa 80px màn hình
                        const finalMin = (idx === 0) ? -dragOutLimit : minLimit;
                        const finalMax = (idx === state.colsX.length - 1) ? width + dragOutLimit : maxLimit;
                        state.colsX[idx] = Math.max(finalMin, Math.min(finalMax, targetX));
                        
                    } else if (state.dragTarget.type === 'row') {
                        let idx = state.dragTarget.index;
                        const height = state.currentImage.naturalHeight;
                        let currentDeltaY = imgY - state.lastDragMouseY;
                        if (e.altKey) currentDeltaY *= 0.15;
                        let targetY = state.rowsY[idx] + currentDeltaY;
                        
                        let swapped = true;
                        while (swapped) {
                            swapped = false;
                            if (idx < state.rowsY.length - 1 && imgY > state.rowsY[idx + 1]) {
                                const temp = state.rowsY[idx];
                                state.rowsY[idx] = state.rowsY[idx + 1];
                                state.rowsY[idx + 1] = temp;
                                idx++; swapped = true;
                            } else if (idx > 0 && imgY < state.rowsY[idx - 1]) {
                                const temp = state.rowsY[idx];
                                state.rowsY[idx] = state.rowsY[idx - 1];
                                state.rowsY[idx - 1] = temp;
                                idx--; swapped = true;
                            }
                        }
                        state.dragTarget.index = idx;
                        let minLimit = 0; let maxLimit = height;
                        if (idx > 0) minLimit = state.rowsY[idx - 1] + 20;
                        if (idx < state.rowsY.length - 1) maxLimit = state.rowsY[idx + 1] - 20;
                        const scaleY = coords.scaleY;
                        const dragOutLimit = 80 * scaleY; // Cho phép kéo ra ngoài tối đa 80px màn hình
                        const finalMin = (idx === 0) ? -dragOutLimit : minLimit;
                        const finalMax = (idx === state.rowsY.length - 1) ? height + dragOutLimit : maxLimit;
                        state.rowsY[idx] = Math.max(finalMin, Math.min(finalMax, targetY));
                    }

                    state.isCustomGrid = true;
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
                if (state.isDrawingNewBox) {
                    const lastBox = state.selectionBoxes[state.selectionBoxes.length - 1];
                    const currentX = Math.max(0, Math.min(state.currentImage.naturalWidth, imgX));
                    const currentY = Math.max(0, Math.min(state.currentImage.naturalHeight, imgY));

                    lastBox.x = Math.min(state.newBoxStart.x, currentX);
                    lastBox.y = Math.min(state.newBoxStart.y, currentY);
                    
                    const rawW = Math.abs(currentX - state.newBoxStart.x);
                    let rawH = Math.abs(currentY - state.newBoxStart.y);

                    if (state.lockedRatio) {
                        rawH = rawW / state.lockedRatio;
                    }

                    lastBox.w = rawW;
                    lastBox.h = rawH;

                    if (state.isUniformSize) {
                        state.selectionBoxes.forEach((box, index) => {
                            if (index < state.selectionBoxes.length - 1) {
                                box.w = rawW;
                                box.h = rawH;
                            }
                        });
                    }
                    drawLiveGrid();
                } else if (state.dragBoxTarget) {
                    const box = state.selectionBoxes[state.dragBoxTarget.boxIndex];
                    let deltaX = imgX - state.lastDragMouseX;
                    let deltaY = imgY - state.lastDragMouseY;
                    if (e.altKey) {
                        deltaX *= 0.15;
                        deltaY *= 0.15;
                    }
                    
                    if (state.dragBoxTarget.actionType === 'move') {
                        let deltaX_from_start = imgX - state.dragBoxTarget.startX;
                        let deltaY_from_start = imgY - state.dragBoxTarget.startY;
                        if (e.altKey) {
                            deltaX_from_start *= 0.15;
                            deltaY_from_start *= 0.15;
                        }

                        let newX = state.dragBoxTarget.originalBox.x + deltaX_from_start;
                        let newY = state.dragBoxTarget.originalBox.y + deltaY_from_start;

                        if (e.shiftKey) {
                            if (Math.abs(imgX - state.dragBoxTarget.startX) > Math.abs(imgY - state.dragBoxTarget.startY)) {
                                newY = state.dragBoxTarget.originalBox.y;
                            } else {
                                newX = state.dragBoxTarget.originalBox.x;
                            }
                        }

                        const snapped = e.altKey ? { x: newX, y: newY } : applyMoveSnapping(newX, newY, box.w, box.h, state.dragBoxTarget.boxIndex);
                        newX = snapped.x;
                        newY = snapped.y;

                        newX = Math.max(0, Math.min(state.currentImage.naturalWidth - box.w, newX));
                        newY = Math.max(0, Math.min(state.currentImage.naturalHeight - box.h, newY));

                        box.x = newX;
                        box.y = newY;
                    } else if (state.dragBoxTarget.actionType === 'resize-br') {
                        let newW = box.w + deltaX;
                        let newH = box.h + deltaY;

                        if (state.lockedRatio) {
                            newH = newW / state.lockedRatio;
                        }

                        const snapped = e.altKey ? { w: newW, h: newH } : applyResizeSnapping(box.x, box.y, newW, newH, state.dragBoxTarget.boxIndex);
                        newW = snapped.w;
                        newH = snapped.h;

                        newW = Math.max(20, Math.min(state.currentImage.naturalWidth - box.x, newW));
                        if (state.lockedRatio) {
                            newH = newW / state.lockedRatio;
                            if (box.y + newH > state.currentImage.naturalHeight) {
                                newH = state.currentImage.naturalHeight - box.y;
                                newW = newH * state.lockedRatio;
                            }
                        } else {
                            newH = Math.max(20, Math.min(state.currentImage.naturalHeight - box.y, newH));
                        }

                        box.w = newW;
                        box.h = newH;

                        if (state.isUniformSize) {
                            state.selectionBoxes.forEach(b => {
                                b.w = newW;
                                b.h = newH;
                                if (b.x + b.w > state.currentImage.naturalWidth) b.x = state.currentImage.naturalWidth - b.w;
                                if (b.y + b.h > state.currentImage.naturalHeight) b.y = state.currentImage.naturalHeight - b.h;
                            });
                        }
                    }
                    drawLiveGrid();
                } else {
                    const hover = getBoxInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
                    if (hover) {
                        if (hover.actionType === 'delete') previewCanvas.style.cursor = 'pointer';
                        else if (hover.actionType === 'resize-br') previewCanvas.style.cursor = 'nwse-resize';
                        else previewCanvas.style.cursor = 'move';
                    } else {
                        previewCanvas.style.cursor = 'crosshair';
                    }
                }
            }

            state.lastDragMouseX = imgX;
            state.lastDragMouseY = imgY;
        });

        previewCanvas.addEventListener('mouseleave', () => {
            if (state.isPanning) {
                state.isPanning = false;
                previewCanvas.style.cursor = state.spacePressed ? 'grab' : 'default';
            }
            hideCustomTooltip();
        });

        // Touch support mapping for main canvas
        previewCanvas.addEventListener('touchstart', (e) => {
            if (!state.currentImage) return;
            
            if (e.touches.length === 1) {
                isPinching = false;
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                previewCanvas.dispatchEvent(mouseEvent);
            } else if (e.touches.length === 2) {
                isPinching = true;
                e.preventDefault();
                
                // Dọn dẹp trạng thái kéo thả chuột giả của 1 ngón tay trước đó để tránh loạn
                state.isPanning = false;
                state.isDrawingNewBox = false;
                state.dragTarget = null;
                state.dragBoxTarget = null;
                state.dragRecutTarget = null;
                
                // Xóa box rác nếu vừa được tạo khi chạm ngón 1
                if (state.slicingMode === 'box' && state.selectionBoxes.length > 0) {
                    const lastBox = state.selectionBoxes[state.selectionBoxes.length - 1];
                    if (lastBox.w === 0 || lastBox.h === 0) {
                        state.selectionBoxes.pop();
                        state.nextBoxId = state.selectionBoxes.length + 1;
                        if (gridModeText) {
                            gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
                        }
                    }
                }
                
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                
                touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                startZoomScale = state.zoomScale;
                
                touchStartCenter = {
                    x: (t1.clientX + t2.clientX) / 2,
                    y: (t1.clientY + t2.clientY) / 2
                };
                
                const wrapper = document.querySelector('.canvas-wrapper');
                if (wrapper) {
                    startScrollLeft = wrapper.scrollLeft;
                    startScrollTop = wrapper.scrollTop;
                    cachedWrapperWidth = wrapper.clientWidth;
                    cachedWrapperHeight = wrapper.clientHeight;
                    const rect = wrapper.getBoundingClientRect();
                    cachedWrapperLeft = rect.left;
                    cachedWrapperTop = rect.top;
                }
                
                touchStartPanX = state.panX;
                touchStartPanY = state.panY;
            }
        }, { passive: false });

        previewCanvas.addEventListener('touchmove', (e) => {
            if (!state.currentImage) return;
            
            if (e.touches.length === 1 && !isPinching) {
                const touch = e.touches[0];
                e.preventDefault(); // Chặn cuộn trang ngoài ý muốn khi vẽ/kéo lưới trên canvas
                
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                previewCanvas.dispatchEvent(mouseEvent);
            } else if (e.touches.length === 2 && isPinching) {
                e.preventDefault();
                
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                
                const currentCenter = {
                    x: (t1.clientX + t2.clientX) / 2,
                    y: (t1.clientY + t2.clientY) / 2
                };
                
                const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                
                // Nếu khoảng cách chạm ban đầu quá nhỏ, gán lại để tránh chia cho số quá nhỏ gây giật zoom
                if (touchStartDist <= 10) {
                    touchStartDist = currentDist;
                    startZoomScale = state.zoomScale;
                }
                
                if (touchStartDist > 10 && currentDist > 0) {
                    const factor = currentDist / touchStartDist;
                    const newZoomScale = Math.max(0.05, Math.min(10.0, startZoomScale * factor));
                    
                    const wrapper = document.querySelector('.canvas-wrapper');
                    if (wrapper) {
                        const wrapperW = (cachedWrapperWidth !== null) ? cachedWrapperWidth : wrapper.clientWidth;
                        const wrapperH = (cachedWrapperHeight !== null) ? cachedWrapperHeight : wrapper.clientHeight;
                        const wrapperLeft = (cachedWrapperLeft !== null) ? cachedWrapperLeft : wrapper.getBoundingClientRect().left;
                        const wrapperTop = (cachedWrapperTop !== null) ? cachedWrapperTop : wrapper.getBoundingClientRect().top;
                        
                        const viewX_start = touchStartCenter.x - wrapperLeft;
                        const viewY_start = touchStartCenter.y - wrapperTop;
                        
                        const marginX = Math.round(wrapperW * 0.5);
                        const marginY = Math.round(wrapperH * 0.5);
                        
                        const zoomRatio = newZoomScale / startZoomScale;
                        
                        const dx = currentCenter.x - touchStartCenter.x;
                        const dy = currentCenter.y - touchStartCenter.y;
                        
                        const scrollLeft_new = startScrollLeft * zoomRatio + (viewX_start - marginX) * (zoomRatio - 1) - dx;
                        const scrollTop_new = startScrollTop * zoomRatio + (viewY_start - marginY) * (zoomRatio - 1) - dy;
                        
                        state.zoomScale = newZoomScale;
                        updateCanvasDisplaySize(wrapperW, wrapperH);
                        
                        wrapper.scrollLeft = Math.round(scrollLeft_new);
                        wrapper.scrollTop = Math.round(scrollTop_new);
                    }
                }
                
                drawLiveGrid();
            }
        }, { passive: false });

        previewCanvas.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                isPinching = false;
                cachedWrapperWidth = null;
                cachedWrapperHeight = null;
                cachedWrapperLeft = null;
                cachedWrapperTop = null;
                const mouseEvent = new MouseEvent('mouseup', {});
                window.dispatchEvent(mouseEvent);
            } else if (e.touches.length === 1) {
                isPinching = false;
                cachedWrapperWidth = null;
                cachedWrapperHeight = null;
                cachedWrapperLeft = null;
                cachedWrapperTop = null;
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                previewCanvas.dispatchEvent(mouseEvent);
            }
        }, { passive: true });
    }

    // --- Mouse Up Event Listener ---
    window.addEventListener('mouseup', (e) => {
        if (state.dragRecutTarget) {
            state.dragRecutTarget = null;
            drawLiveGrid();
        }

        if (state.snapGuides.length > 0) {
            state.snapGuides = [];
            drawLiveGrid();
        }

        if (state.isPanning) {
            state.isPanning = false;
            previewCanvas.style.cursor = state.spacePressed ? 'grab' : 'default';
            return;
        }

        if (state.slicingMode === 'grid') {
            if (state.dragTarget) {
                const idx = state.dragTarget.index;
                let deleted = false;
                if (state.dragTarget.type === 'col') {
                    const width = state.currentImage.naturalWidth;
                    const val = state.colsX[idx];
                    if (val < 0 || val > width) {
                        state.colsX.splice(idx, 1);
                        if (inputCols) {
                            inputCols.value = state.colsX.length + 1;
                        }
                        deleted = true;
                        showToast("Đã xóa đường lưới cột!", "success");
                    }
                } else if (state.dragTarget.type === 'row') {
                    const height = state.currentImage.naturalHeight;
                    const val = state.rowsY[idx];
                    if (val < 0 || val > height) {
                        state.rowsY.splice(idx, 1);
                        if (inputRows) {
                            inputRows.value = state.rowsY.length + 1;
                        }
                        deleted = true;
                        showToast("Đã xóa đường lưới hàng!", "success");
                    }
                }

                if (deleted) {
                    state.isCustomGrid = true;
                    if (gridModeText) {
                        gridModeText.textContent = "Tùy chỉnh";
                        gridModeText.style.color = "var(--accent)";
                    }
                }

                state.dragTarget = null;
                handleParamsChange();
                saveLocalProjectState(); // Lưu trạng thái local sau khi xóa đường lưới
            }
        } else {
            if (state.isDrawingNewBox) {
                state.isDrawingNewBox = false;
                const lastBox = state.selectionBoxes[state.selectionBoxes.length - 1];
                if (lastBox.w < 10 || lastBox.h < 10) {
                    state.selectionBoxes.pop();
                    state.nextBoxId--;
                    if (gridModeText) {
                        gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
                    }
                }
                handleParamsChange();
            }
            if (state.dragBoxTarget) {
                state.dragBoxTarget = null;
                handleParamsChange();
            }
        }
    });

    // Mouse Wheel Zoom Listener
    if (previewCanvas) {
        previewCanvas.addEventListener('wheel', (e) => {
            if (!state.currentImage) return;
            e.preventDefault();

            const wrapper = document.querySelector('.canvas-wrapper');
            if (!wrapper) return;

            const wrapperW = wrapper.clientWidth;
            const wrapperH = wrapper.clientHeight;
            const wrapperRect = wrapper.getBoundingClientRect();
            
            // Trừ border (clientLeft/clientTop) để có tọa độ chính xác bên trong viewport
            const borderLeft = wrapper.clientLeft || 0;
            const borderTop = wrapper.clientTop || 0;
            const viewX = e.clientX - wrapperRect.left - borderLeft;
            const viewY = e.clientY - wrapperRect.top - borderTop;

            const marginX = Math.round(wrapperW * 0.5);
            const marginY = Math.round(wrapperH * 0.5);

            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
            const newZoomScale = Math.max(0.05, Math.min(10.0, state.zoomScale * zoomFactor));

            if (newZoomScale !== state.zoomScale) {
                const zoomRatio = newZoomScale / state.zoomScale;
                
                const scrollLeft_new = wrapper.scrollLeft * zoomRatio + (viewX - marginX) * (zoomRatio - 1);
                const scrollTop_new = wrapper.scrollTop * zoomRatio + (viewY - marginY) * (zoomRatio - 1);

                state.zoomScale = newZoomScale;
                updateCanvasDisplaySize();

                // Ép reflow đồng bộ
                const _ = wrapper.scrollWidth;

                wrapper.scrollLeft = Math.round(scrollLeft_new);
                wrapper.scrollTop = Math.round(scrollTop_new);

                drawLiveGrid();
            }
        }, { passive: false });
    }

    // 12. Quality export parameters
    if (selectExportFormat) {
        selectExportFormat.addEventListener('change', () => {
            state.exportFormat = selectExportFormat.value;
            if (state.exportFormat === 'jpeg' || state.exportFormat === 'webp') {
                if (containerExportQuality) containerExportQuality.style.display = 'block';
            } else {
                if (containerExportQuality) containerExportQuality.style.display = 'none';
            }
            if (state.slicedImages.length > 0) {
                regenerateSlicedImagesMimeType();
            }
        });
    }

    if (inputExportQuality) {
        inputExportQuality.addEventListener('input', () => {
            const val = inputExportQuality.value;
            if (exportQualityVal) exportQualityVal.textContent = val + '%';
            state.exportQuality = parseInt(val) / 100;
        });
        
        inputExportQuality.addEventListener('change', () => {
            if (state.slicedImages.length > 0) {
                regenerateSlicedImagesMimeType();
            }
        });
    }

    const wrapperEl = document.querySelector('.canvas-wrapper');
    if (wrapperEl) {
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (state.currentImage) {
                    updateCanvasDisplaySize();
                    centerCanvas();
                    drawLiveGrid();
                }
            }
        });
        resizeObserver.observe(wrapperEl);
    }

    window.addEventListener('resize', () => {
        if (state.currentImage) {
            centerCanvas();
        }
    });

    // --- Init Features ---
    loadAppSettings();
    loadLocalProjectState();
    checkPasswordLock();
    setSlicingMode('grid');
    initCustomTooltips();
    initHistoryViewToggle();
    applyHistoryViewMode(state.historyViewMode);
    updateAuthUI();
    initShortcuts();
});

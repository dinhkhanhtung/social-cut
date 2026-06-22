// --- IndexedDB Local Storage Module ---
import { state, elements, constants } from './state.js';

// Import dynamic rendering & UI functions from other modules to avoid execution bottlenecks
// ES Modules dynamic live bindings resolve these correctly at runtime
import { restoreResultGrid, switchTab, switchMobileTab } from './ui-helpers.js';
import { drawLiveGrid, centerCanvas, resetGridToEven, updateCanvasDisplaySize } from './main.js';

const { DB_NAME, DB_VERSION, STORE_NAME } = constants;

export function initLocalDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

export async function saveLocalProjectState() {
    if (!state.currentImage && state.slicedImages.length === 0) {
        await clearLocalProjectState();
        return;
    }

    try {
        let imageBase64 = null;
        if (state.currentImage) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = state.currentImage.naturalWidth;
            tempCanvas.height = state.currentImage.naturalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(state.currentImage, 0, 0);
            imageBase64 = tempCanvas.toDataURL(state.currentOriginalFile ? state.currentOriginalFile.type : 'image/png');
        }

        const stateData = {
            imageBase64: imageBase64,
            name: state.currentOriginalFile ? state.currentOriginalFile.name : 'image.png',
            size: state.currentOriginalFile ? state.currentOriginalFile.size : 0,
            type: state.currentOriginalFile ? state.currentOriginalFile.type : 'image/png',
            slicingMode: state.slicingMode,
            gridType: state.gridType,
            rows: parseInt(elements.inputRows.value) || 4,
            cols: parseInt(elements.inputCols.value) || 3,
            ratio: elements.selectRatio.value,
            offset: parseInt(elements.inputOffset.value) || 0,
            selectionBoxes: state.selectionBoxes,
            switchUniform: elements.switchUniform.checked,
            switchSnap: elements.switchSnap ? elements.switchSnap.checked : true,
            colsX: state.colsX,
            rowsY: state.rowsY,
            slicedImages: state.slicedImages.map(item => ({
                id: item.id,
                name: item.name,
                dataUrl: item.dataUrl,
                meta: item.meta,
                sliceParams: item.sliceParams,
                keep: item.keep || false
            }))
        };

        const db = await initLocalDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(stateData, 'project_state');
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
        console.log("Đã lưu trạng thái dự án cục bộ!");
    } catch (err) {
        console.error("Lỗi khi lưu trạng thái local:", err);
    }
}

export async function loadLocalProjectState() {
    try {
        const db = await initLocalDB();
        const stateData = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get('project_state');
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });

        if (!stateData) return;

        console.log("Đang khôi phục dự án cục bộ gần nhất...");
        if (stateData.imageBase64) {
            const res = await fetch(stateData.imageBase64);
            const blob = await res.blob();
            state.currentOriginalFile = new File([blob], stateData.name, { type: stateData.type });
        }

        state.slicingMode = stateData.slicingMode;
        state.gridType = stateData.gridType;

        if (state.slicingMode === 'grid') {
            if (elements.modeGridBtn) elements.modeGridBtn.classList.add('active');
            if (elements.modeBoxBtn) elements.modeBoxBtn.classList.remove('active');
            if (elements.controlsGridMode) elements.controlsGridMode.classList.add('active');
            if (elements.controlsBoxMode) elements.controlsBoxMode.classList.remove('active');
        } else {
            if (elements.modeGridBtn) elements.modeGridBtn.classList.remove('active');
            if (elements.modeBoxBtn) elements.modeBoxBtn.classList.add('active');
            if (elements.controlsGridMode) elements.controlsGridMode.classList.remove('active');
            if (elements.controlsBoxMode) elements.controlsBoxMode.classList.add('active');
        }

        if (elements.selectGridType) elements.selectGridType.value = state.gridType;
        if (elements.inputRows) elements.inputRows.value = stateData.rows;
        if (elements.inputCols) elements.inputCols.value = stateData.cols;
        if (elements.selectRatio) elements.selectRatio.value = stateData.ratio;
        if (elements.inputOffset) {
            elements.inputOffset.value = stateData.offset || 0;
            if (elements.offsetNumberVal) elements.offsetNumberVal.value = stateData.offset || 0;
        }

        if (elements.switchUniform) {
            elements.switchUniform.checked = stateData.switchUniform;
            state.isUniformSize = stateData.switchUniform;
        }
        if (elements.switchSnap) {
            elements.switchSnap.checked = stateData.switchSnap;
            state.isSnapEnabled = stateData.switchSnap;
        }

        state.colsX = stateData.colsX || [];
        state.rowsY = stateData.rowsY || [];
        state.selectionBoxes = stateData.selectionBoxes || [];
        if (state.selectionBoxes.length > 0) {
            state.nextBoxId = Math.max(...state.selectionBoxes.map(b => b.id)) + 1;
        } else {
            state.nextBoxId = 1;
        }

        if (elements.gridEvenParameters) {
            elements.gridEvenParameters.style.display = (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34') ? 'flex' : 'none';
        }

        if (stateData.imageBase64) {
            if (elements.fileName) elements.fileName.textContent = stateData.name;
            if (elements.fileSize) elements.fileSize.textContent = `(${(stateData.size / 1024).toFixed(1)} KB)`;
            if (elements.dropzonePrompt) elements.dropzonePrompt.style.display = 'none';
            if (elements.btnUploadTrigger) elements.btnUploadTrigger.style.display = 'none';
            if (elements.fileInfo) elements.fileInfo.style.display = 'flex';
            if (elements.dropzone) elements.dropzone.classList.add('has-image');
            if (elements.appContent) elements.appContent.classList.add('has-image');

            const img = new Image();
            img.onload = () => {
                state.currentImage = img;
                state.zoomScale = 1.0;
                state.baseCanvasWidth = 0;
                state.baseCanvasHeight = 0;
                state.panX = 0;
                state.panY = 0;
                state.selectedBoxIdx = -1;

                elements.canvasPlaceholder.style.display = 'none';
                elements.previewCanvas.style.display = 'block';
                elements.imageMeta.style.display = 'flex';
                elements.interactiveTip.style.display = 'flex';
                elements.imgDimOriginal.textContent = `${img.naturalWidth}×${img.naturalHeight}`;

                elements.btnSlice.disabled = false;
                if (elements.btnAutoDetect) elements.btnAutoDetect.disabled = false;
                elements.btnGenBoxes.disabled = (state.slicingMode !== 'box');
                elements.btnClearBoxes.disabled = (state.slicingMode !== 'box');

                if (state.colsX.length === 0 && state.rowsY.length === 0 && state.slicingMode === 'grid' && (state.gridType === 'even' || state.gridType === 'insta-square' || state.gridType === 'insta-portrait' || state.gridType === 'tiktok-carousel-916' || state.gridType === 'tiktok-carousel-34')) {
                    resetGridToEven();
                }

                drawLiveGrid();
                if (elements.mobileNavEdit) elements.mobileNavEdit.classList.remove('disabled');

                if (stateData.slicedImages && stateData.slicedImages.length > 0) {
                    restoreResultGrid(stateData.slicedImages);
                } else {
                    if (elements.mobileNavResult) elements.mobileNavResult.classList.add('disabled');
                    switchTab('tab-live-grid');
                    switchMobileTab('edit');
                    setTimeout(centerCanvas, 150);
                }
            };
            img.src = stateData.imageBase64;
        }
    } catch (err) {
        console.error("Lỗi khi tải trạng thái local:", err);
    }
}

export async function clearLocalProjectState() {
    try {
        const db = await initLocalDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete('project_state');
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
        console.log("Đã xóa trạng thái dự án cục bộ.");
    } catch (err) {
        console.error("Lỗi khi xóa trạng thái local:", err);
    }
}

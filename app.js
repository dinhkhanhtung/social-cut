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
    const inputOffset = document.getElementById('input-offset-number');
    const offsetNumberVal = inputOffset;
    
    const selectRatio = document.getElementById('select-ratio');
    const ratioControlItem = document.getElementById('ratio-control-item');
    const selectGridType = document.getElementById('select-grid-type');
    const gridTypeControlItem = document.getElementById('grid-type-control-item');
    const gridEvenParameters = document.getElementById('grid-even-parameters');
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

    // History & Lock Elements
    const historyList = document.getElementById('history-list');
    const passwordGate = document.getElementById('password-gate');
    const btnUnlockApp = document.getElementById('btn-unlock-app');
    const appPasswordInput = document.getElementById('app-password-input');
    const passwordErrorMessage = document.getElementById('password-error-message');
    const btnTogglePasswordVisibility = document.getElementById('btn-toggle-password-visibility');

    // Watermark DOM Elements
    const panelWatermark = document.getElementById('panel-watermark');
    const headerWatermark = document.getElementById('header-watermark');
    const contentWatermark = document.getElementById('content-watermark');
    const switchWatermark = document.getElementById('switch-watermark');
    const watermarkOptionsContainer = document.getElementById('watermark-options-container');
    const inputWatermarkText = document.getElementById('input-watermark-text');
    const selectWatermarkPosition = document.getElementById('select-watermark-position');
    const inputWatermarkSize = document.getElementById('input-watermark-size');
    const watermarkSizeVal = document.getElementById('watermark-size-val');
    const inputWatermarkOpacity = document.getElementById('input-watermark-opacity');
    const watermarkOpacityVal = document.getElementById('watermark-opacity-val');

    // Watermark Image DOM Elements
    const selectWatermarkType = document.getElementById('select-watermark-type');
    const watermarkTextConfig = document.getElementById('watermark-text-config');
    const watermarkImageConfig = document.getElementById('watermark-image-config');
    const inputWatermarkImage = document.getElementById('input-watermark-image');
    const watermarkImagePreviewInfo = document.getElementById('watermark-image-preview-info');
    const inputWatermarkImageScale = document.getElementById('input-watermark-image-scale');
    const watermarkImageScaleVal = document.getElementById('watermark-image-scale-val');

    // Export Settings DOM Elements
    const panelExportSettings = document.getElementById('panel-export-settings');
    const headerExportSettings = document.getElementById('header-export-settings');
    const contentExportSettings = document.getElementById('content-export-settings');
    const selectExportResolution = document.getElementById('select-export-resolution');
    const selectExportSharpness = document.getElementById('select-export-sharpness');

    // Global Watermark Image Object
    let watermarkImageObj = null;

    const ctx = previewCanvas.getContext('2d');

    // Global State
    let currentImage = null;
    let currentOriginalFile = null;
    let slicedImages = []; // Array of { name, dataUrl }
    let slicedBlobs = [];  // Array of { name, blob }
    let recutSlideId = null; // ID of the slice being recut (single edit mode)
    let recutBoxId = null; // ID of the box being recut
    
    // --- Helper to toggle Sidebar Controls when Recutting ---
    const updateSidebarControlsState = () => {
        const isRecutting = (recutSlideId !== null);
        
        // 1. Chế độ cắt
        if (modeGridBtn) modeGridBtn.disabled = isRecutting;
        if (modeBoxBtn) modeBoxBtn.disabled = isRecutting;
        
        const modeSelector = document.querySelector('.mode-selector');
        if (modeSelector) {
            if (isRecutting) modeSelector.classList.add('disabled-controls');
            else modeSelector.classList.remove('disabled-controls');
        }

        // 2. Input lưới
        if (inputRows) inputRows.disabled = isRecutting;
        if (inputCols) inputCols.disabled = isRecutting;
        if (inputOffset) inputOffset.disabled = isRecutting;
        if (selectRatio) selectRatio.disabled = isRecutting;
        if (selectGridType) selectGridType.disabled = isRecutting;
        
        // Block thông số lưới
        const gridEvenParams = document.getElementById('grid-even-parameters');
        const gridTypeControl = document.getElementById('grid-type-control-item');
        const ratioControl = document.getElementById('ratio-control-item');
        
        [gridEvenParams, gridTypeControl, ratioControl].forEach(el => {
            if (el) {
                if (isRecutting) el.classList.add('disabled-controls');
                else el.classList.remove('disabled-controls');
            }
        });

        // 3. Nút auto detect, tự động tạo box, xóa box
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

        // 4. File input & remove button
        if (fileInput) fileInput.disabled = isRecutting;
        if (btnRemoveFile) btnRemoveFile.disabled = isRecutting;
        if (dropzone) {
            if (isRecutting) dropzone.classList.add('disabled-controls');
            else dropzone.classList.remove('disabled-controls');
        }

        // 5. Nhập dự án
        if (btnImportProject) btnImportProject.disabled = isRecutting;
        if (btnPcImportProject) btnPcImportProject.disabled = isRecutting;
        
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
    
    let slicingMode = 'grid'; // 'grid' or 'box'
    let gridType = 'even';    // 'even' | 'fb-1d3v' | 'fb-1n3v'
    let gridLineColor = '#06b6d4'; // Màu sắc hiển thị của lưới
    let exportResolution = 'auto'; // 'auto' | 'original' | '2k' | '4k'
    let exportSharpness = 'off';    // 'off' | 'light' | 'medium' | 'strong'
    let currentSlideIndex = 0; // Chỉ số slide hiện tại cho Mobile Preview

    // Hàm tính tỷ lệ scale xuất ảnh động dựa theo cấu hình độ phân giải (phạm vi file-scope)
    const getExportScale = (w) => {
        if (exportResolution === 'original') {
            return 1.0;
        }
        let targetMinW = 1080;
        if (exportResolution === '2k') {
            targetMinW = 2160;
        } else if (exportResolution === '4k') {
            targetMinW = 3840;
        }
        return w < targetMinW ? (targetMinW / w) : 1.0;
    };

    let recutTempCoords = null; // Tọa độ tạm thời của slide đơn đang cắt lại
    let dragRecutTarget = null; // Target kéo thả khi cắt lại slide đơn

    // --- Mode 1: Grid Mode Variables ---
    let colsX = [];        // X coordinates of vertical grid lines. Length: cols - 1
    let rowsY = [];        // Y coordinates of horizontal grid lines. Length: rows - 1
    let isCustomGrid = false; 
    let dragTarget = null;  // Current grid line being dragged 

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

    // --- Save & Load Application Settings (Export & Watermark) ---
    const saveAppSettings = () => {
        try {
            const settings = {
                exportResolution: exportResolution,
                exportSharpness: exportSharpness,
                watermarkEnabled: switchWatermark ? switchWatermark.checked : false,
                watermarkType: selectWatermarkType ? selectWatermarkType.value : 'text',
                watermarkText: inputWatermarkText ? inputWatermarkText.value : '',
                watermarkPosition: selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right',
                watermarkSize: inputWatermarkSize ? inputWatermarkSize.value : '24',
                watermarkOpacity: inputWatermarkOpacity ? inputWatermarkOpacity.value : '50',
                watermarkImageScale: inputWatermarkImageScale ? inputWatermarkImageScale.value : '20'
            };
            localStorage.setItem('carousel_cut_app_settings', JSON.stringify(settings));
        } catch (err) {
            console.error("Lỗi khi lưu cài đặt ứng dụng:", err);
        }
    };

    const loadAppSettings = () => {
        try {
            const settingsStr = localStorage.getItem('carousel_cut_app_settings');
            if (settingsStr) {
                const settings = JSON.parse(settingsStr);
                
                if (settings.exportResolution) {
                    exportResolution = settings.exportResolution;
                    if (selectExportResolution) selectExportResolution.value = exportResolution;
                }
                
                if (settings.exportSharpness) {
                    exportSharpness = settings.exportSharpness;
                    if (selectExportSharpness) selectExportSharpness.value = exportSharpness;
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
            }
            
            const imgData = localStorage.getItem('carousel_cut_watermark_image');
            if (imgData) {
                const img = new Image();
                img.onload = () => {
                    watermarkImageObj = img;
                    if (watermarkImagePreviewInfo) watermarkImagePreviewInfo.style.display = 'block';
                    drawLiveGrid();
                };
                img.src = imgData;
            }
        } catch (err) {
            console.error("Lỗi khi khôi phục cài đặt ứng dụng:", err);
        }
    };

    // Khởi tạo khôi phục cấu hình ứng dụng
    loadAppSettings();

    // --- Custom Toast System ---
    function showToast(message, type = 'info', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-box toast-${type}`;

        // Select icon based on type
        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        else if (type === 'error') iconClass = 'fa-circle-exclamation';
        else if (type === 'warning') iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close" title="Đóng">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        container.appendChild(toast);

        // Function to dismiss toast
        const dismissToast = () => {
            if (toast.classList.contains('toast-fade-out')) return;
            toast.classList.add('toast-fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            });
        };

        // Close button event
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', dismissToast);

        // Auto dismiss after duration
        if (duration > 0) {
            setTimeout(dismissToast, duration);
        }
    }

    // --- Custom Confirm Modal System ---
    function showConfirm(message, onConfirm, onCancel = null) {
        let container = document.querySelector('.custom-confirm-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'custom-confirm-container';
            container.innerHTML = `
                <div class="custom-confirm-backdrop"></div>
                <div class="custom-confirm-box">
                    <div class="custom-confirm-content">
                        <i class="fa-solid fa-circle-question custom-confirm-icon"></i>
                        <div class="custom-confirm-message"></div>
                    </div>
                    <div class="custom-confirm-actions">
                        <button class="custom-confirm-btn custom-confirm-cancel">Hủy</button>
                        <button class="custom-confirm-btn custom-confirm-ok">Đồng ý</button>
                    </div>
                </div>
            `;
            document.body.appendChild(container);
        }

        const msgEl = container.querySelector('.custom-confirm-message');
        msgEl.textContent = message;

        const btnCancel = container.querySelector('.custom-confirm-cancel');
        const btnOk = container.querySelector('.custom-confirm-ok');

        const hideConfirm = () => {
            container.classList.remove('active');
        };

        const handleCancel = () => {
            hideConfirm();
            if (onCancel) onCancel();
        };

        const handleOk = () => {
            hideConfirm();
            if (onConfirm) onConfirm();
        };

        // Remove old listeners to avoid stacking
        btnCancel.onclick = handleCancel;
        btnOk.onclick = handleOk;
        container.querySelector('.custom-confirm-backdrop').onclick = handleCancel;

        // Force reflow and show
        container.offsetHeight;
        container.classList.add('active');
    }

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

    // --- Watermark Collapsible & Controls Event Listeners ---
    if (headerWatermark && contentWatermark && panelWatermark) {
        headerWatermark.addEventListener('click', () => {
            const isExpanded = panelWatermark.classList.contains('expanded');
            if (isExpanded) {
                panelWatermark.classList.remove('expanded');
                contentWatermark.style.display = 'none';
            } else {
                panelWatermark.classList.add('expanded');
                contentWatermark.style.display = 'block';
                // Close export settings
                if (panelExportSettings && contentExportSettings) {
                    panelExportSettings.classList.remove('expanded');
                    contentExportSettings.style.display = 'none';
                }
            }
        });
    }

    // --- Export Settings Collapsible & Controls Event Listeners ---
    if (headerExportSettings && contentExportSettings && panelExportSettings) {
        headerExportSettings.addEventListener('click', () => {
            const isExpanded = panelExportSettings.classList.contains('expanded');
            if (isExpanded) {
                panelExportSettings.classList.remove('expanded');
                contentExportSettings.style.display = 'none';
            } else {
                panelExportSettings.classList.add('expanded');
                contentExportSettings.style.display = 'block';
                // Close watermark
                if (panelWatermark && contentWatermark) {
                    panelWatermark.classList.remove('expanded');
                    contentWatermark.style.display = 'none';
                }
            }
        });
    }

    if (selectExportResolution) {
        selectExportResolution.addEventListener('change', () => {
            exportResolution = selectExportResolution.value;
            saveAppSettings();
        });
    }

    if (selectExportSharpness) {
        selectExportSharpness.addEventListener('change', () => {
            exportSharpness = selectExportSharpness.value;
            saveAppSettings();
        });
    }

    if (switchWatermark) {
        switchWatermark.addEventListener('change', () => {
            const isEnabled = switchWatermark.checked;
            if (watermarkOptionsContainer) {
                watermarkOptionsContainer.style.display = isEnabled ? 'block' : 'none';
            }
            drawLiveGrid();
            saveAppSettings();
        });
    }

    if (inputWatermarkText) {
        inputWatermarkText.addEventListener('input', () => {
            drawLiveGrid();
            saveAppSettings();
        });
    }

    if (selectWatermarkPosition) {
        selectWatermarkPosition.addEventListener('change', () => {
            drawLiveGrid();
            saveAppSettings();
        });
    }

    if (inputWatermarkSize && watermarkSizeVal) {
        inputWatermarkSize.addEventListener('input', (e) => {
            watermarkSizeVal.textContent = e.target.value;
            drawLiveGrid();
            saveAppSettings();
        });
    }

    if (inputWatermarkOpacity && watermarkOpacityVal) {
        inputWatermarkOpacity.addEventListener('input', (e) => {
            watermarkOpacityVal.textContent = e.target.value;
            drawLiveGrid();
            saveAppSettings();
        });
    }

    if (selectWatermarkType) {
        selectWatermarkType.addEventListener('change', (e) => {
            const type = e.target.value;
            if (watermarkTextConfig) {
                watermarkTextConfig.style.display = (type === 'text') ? 'block' : 'none';
            }
            if (watermarkImageConfig) {
                watermarkImageConfig.style.display = (type === 'image') ? 'block' : 'none';
            }
            drawLiveGrid();
            saveAppSettings();
        });
    }

    if (inputWatermarkImage) {
        inputWatermarkImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                watermarkImageObj = null;
                localStorage.removeItem('carousel_cut_watermark_image');
                if (watermarkImagePreviewInfo) watermarkImagePreviewInfo.style.display = 'none';
                drawLiveGrid();
                saveAppSettings();
                return;
            }
            if (!file.type.startsWith('image/')) {
                showToast('Logo phải là file hình ảnh!', 'warning');
                watermarkImageObj = null;
                localStorage.removeItem('carousel_cut_watermark_image');
                if (watermarkImagePreviewInfo) watermarkImagePreviewInfo.style.display = 'none';
                inputWatermarkImage.value = '';
                saveAppSettings();
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    watermarkImageObj = img;
                    try {
                        localStorage.setItem('carousel_cut_watermark_image', ev.target.result);
                    } catch (err) {
                        console.warn("Không thể lưu ảnh logo vào localStorage (có thể vượt quá dung lượng 5MB):", err);
                    }
                    if (watermarkImagePreviewInfo) watermarkImagePreviewInfo.style.display = 'block';
                    drawLiveGrid();
                    saveAppSettings();
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (inputWatermarkImageScale && watermarkImageScaleVal) {
        inputWatermarkImageScale.addEventListener('input', (e) => {
            watermarkImageScaleVal.textContent = e.target.value;
            drawLiveGrid();
            saveAppSettings();
        });
    }

    // --- Slicing Mode Switches ---
    const setSlicingMode = (mode) => {
        slicingMode = mode;
        if (mode === 'grid') {
            modeGridBtn.classList.add('active');
            modeBoxBtn.classList.remove('active');
            controlsGridMode.classList.add('active');
            controlsBoxMode.classList.remove('active');
            
            if (selectRatio) selectRatio.disabled = true;
            if (ratioControlItem) ratioControlItem.classList.add('disabled');

            if (selectGridType) selectGridType.disabled = false;
            if (gridTypeControlItem) gridTypeControlItem.classList.remove('disabled');

            if (currentImage) {
                if (btnAutoDetect) btnAutoDetect.style.display = 'flex';
                tipText.innerHTML = "Mẹo: Bạn có thể kéo thả các đường lưới màu xanh để thay đổi kích thước các ô.";
                gridModeText.textContent = isCustomGrid ? "Tùy chỉnh" : "Chia đều";
                gridModeText.style.color = isCustomGrid ? "var(--accent)" : "var(--text-secondary)";
            }
        } else {
            modeGridBtn.classList.remove('active');
            modeBoxBtn.classList.add('active');
            controlsGridMode.classList.remove('active');
            controlsBoxMode.classList.add('active');
            
            if (selectRatio) selectRatio.disabled = false;
            if (ratioControlItem) ratioControlItem.classList.remove('disabled');

            if (selectGridType) selectGridType.disabled = true;
            if (gridTypeControlItem) gridTypeControlItem.classList.add('disabled');

            if (currentImage) {
                if (btnAutoDetect) btnAutoDetect.style.display = 'none';
                tipText.innerHTML = "Mẹo: Nhấp kéo chuột trên ảnh để vẽ khung tự do.";
                gridModeText.textContent = `Tự do (${selectionBoxes.length} khung)`;
                gridModeText.style.color = "var(--success)";
            }
        }
        if (currentImage) {
            handleParamsChange();
        }
    };

    modeGridBtn.addEventListener('click', () => {
        setSlicingMode('grid');
        if (window.innerWidth <= 768 && document.getElementById('sidebar')) {
            document.getElementById('sidebar').classList.add('active-params');
            const btnMobileToggleParams = document.getElementById('btn-mobile-toggle-params');
            if (btnMobileToggleParams) {
                btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                btnMobileToggleParams.classList.add('active');
            }
        }
    });
    
    modeBoxBtn.addEventListener('click', () => {
        setSlicingMode('box');
        if (window.innerWidth <= 768 && document.getElementById('sidebar')) {
            document.getElementById('sidebar').classList.add('active-params');
            const btnMobileToggleParams = document.getElementById('btn-mobile-toggle-params');
            if (btnMobileToggleParams) {
                btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                btnMobileToggleParams.classList.add('active');
            }
        }
    });

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

    // --- Mobile Bottom Navigation Logic ---
    const mobileNavUpload = document.getElementById('mobile-nav-upload');
    const mobileNavEdit = document.getElementById('mobile-nav-edit');
    const mobileNavResult = document.getElementById('mobile-nav-result');
    const appContainer = document.querySelector('.app-container');

    const switchMobileTab = (tabId) => {
        if (!appContainer) return;
        
        // Đóng bảng cấu hình di động khi đổi tab
        if (sidebar) sidebar.classList.remove('active-params');
        if (btnMobileToggleParams) {
            btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-sliders"></i> Tùy chỉnh thông số';
            btnMobileToggleParams.classList.remove('active');
        }
        
        appContainer.classList.remove('mobile-tab-upload', 'mobile-tab-edit', 'mobile-tab-result');
        appContainer.classList.add(`mobile-tab-${tabId}`);
        
        [mobileNavUpload, mobileNavEdit, mobileNavResult].forEach(btn => {
            if (btn) {
                if (btn.getAttribute('data-tab') === tabId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        if (tabId === 'edit') {
            switchTab('tab-live-grid');
        } else if (tabId === 'result') {
            switchTab('tab-result-grid');
        } else if (tabId === 'upload') {
            switchTab('tab-live-grid');
        }
    };

    [mobileNavUpload, mobileNavEdit, mobileNavResult].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                const tabId = btn.getAttribute('data-tab');
                switchMobileTab(tabId);
            });
        }
    });

    // Toggle Mobile Params Sheet
    const btnMobileToggleParams = document.getElementById('btn-mobile-toggle-params');
    const sidebar = document.getElementById('sidebar');
    if (btnMobileToggleParams && sidebar) {
        btnMobileToggleParams.addEventListener('click', () => {
            sidebar.classList.toggle('active-params');
            if (sidebar.classList.contains('active-params')) {
                btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                btnMobileToggleParams.classList.add('active');
            } else {
                btnMobileToggleParams.innerHTML = '<i class="fa-solid fa-sliders"></i> Tùy chỉnh thông số';
                btnMobileToggleParams.classList.remove('active');
            }
        });
    }

    // --- Auto Detect Optimal Grid Rows/Cols based on standard aspect ratios ---
    const autoDetectOptimalGrid = (width, height) => {
        const imgRatio = width / height;
        
        // Standard cell aspect ratios (width / height)
        const targetRatios = [1.0, 0.8, 0.75, 1.91, 0.5625];
        
        let bestCols = 3;
        let bestRows = 1;
        let minDiff = Infinity;
        
        if (width >= height) {
            // Horizontal panorama: rows = 1, cols = N
            bestRows = 1;
            for (const target of targetRatios) {
                const cols = Math.max(1, Math.min(10, Math.round(imgRatio / target)));
                const cellRatio = imgRatio / cols;
                const diff = Math.abs(cellRatio - target);
                
                if (diff < minDiff - 0.01) {
                    minDiff = diff;
                    bestCols = cols;
                }
            }
            
            // If the image is close to square, force 1x1
            if (Math.abs(imgRatio - 1.0) < 0.05) {
                bestCols = 1;
                bestRows = 1;
            }
        } else {
            // Vertical panorama: cols = 1, rows = N
            bestCols = 1;
            for (const target of targetRatios) {
                const rows = Math.max(1, Math.min(10, Math.round(target / imgRatio)));
                const cellRatio = imgRatio * rows;
                const diff = Math.abs(cellRatio - target);
                
                if (diff < minDiff - 0.01) {
                    minDiff = diff;
                    bestRows = rows;
                }
            }
            
            // If the image is close to square, force 1x1
            if (Math.abs(imgRatio - 1.0) < 0.05) {
                bestCols = 1;
                bestRows = 1;
            }
        }
        
        // Special case: standard single landscape (like 16:9) should not default to too many columns
        if (imgRatio > 1.2 && imgRatio < 2.0 && bestCols > 2) {
            if (Math.abs(imgRatio - 1.7778) < 0.1) {
                bestCols = 2; // Split into two 1.1:1 parts
            }
        }
        
        return { cols: bestCols, rows: bestRows };
    };

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

    // --- Update Grid Smartly (Keep custom spacing if custom grid) ---
    const updateGridParamsSmart = (type) => {
        if (!currentImage) return;
        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;

        if (type === 'cols') {
            const cols = parseInt(inputCols.value) || 1;
            const targetLen = cols - 1;

            // Đảm bảo colsX được sắp xếp tăng dần
            colsX.sort((a, b) => a - b);

            if (colsX.length > targetLen) {
                // Giảm cột: Cắt bỏ các cột dư ở cuối
                colsX.splice(targetLen);
            } else if (colsX.length < targetLen) {
                // Thêm cột: Chèn cột mới vào khoảng trống lớn nhất
                while (colsX.length < targetLen) {
                    const temp = [0, ...colsX, width];
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
                        colsX.push(insertVal);
                        colsX.sort((a, b) => a - b);
                    } else {
                        break;
                    }
                }
            }
        } else if (type === 'rows') {
            const rows = parseInt(inputRows.value) || 1;
            const targetLen = rows - 1;

            // Đảm bảo rowsY được sắp xếp tăng dần
            rowsY.sort((a, b) => a - b);

            if (rowsY.length > targetLen) {
                // Giảm hàng: Cắt bỏ hàng dư ở cuối
                rowsY.splice(targetLen);
            } else if (rowsY.length < targetLen) {
                // Thêm hàng: Chèn hàng mới vào khoảng trống lớn nhất
                while (rowsY.length < targetLen) {
                    const temp = [0, ...rowsY, height];
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
                        rowsY.push(insertVal);
                        rowsY.sort((a, b) => a - b);
                    } else {
                        break;
                    }
                }
            }
        }
    };

    // --- Parameter Control Events ---
    const handleParamsChange = (e) => {
        if (slicingMode === 'grid' && e && (e.target.id === 'input-rows' || e.target.id === 'input-cols')) {
            if (isCustomGrid) {
                updateGridParamsSmart(e.target.id === 'input-rows' ? 'rows' : 'cols');
            } else {
                resetGridToEven();
            }
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

    // --- Canvas Background Toggle (Caro / Trơn) ---
    const canvasBgModeText = document.getElementById('canvas-bg-mode-text');
    let canvasBgMode = localStorage.getItem('canvas_bg_mode') || 'checkerboard';

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

    // Khởi tạo hiển thị ban đầu
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
            gridType = selectGridType.value;
            
            if (gridType === 'even') {
                if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
                resetGridToEven();
            } else {
                if (gridEvenParameters) gridEvenParameters.style.display = 'none';
            }
            
            handleParamsChange();
        });
    }

    if (gridModeText) {
        gridModeText.style.cursor = 'pointer';
        gridModeText.title = "Click để đặt lại lưới chia đều";
        gridModeText.addEventListener('click', () => {
            if (slicingMode === 'grid' && (isCustomGrid || gridType !== 'even')) {
                if (selectGridType) {
                    selectGridType.value = 'even';
                    gridType = 'even';
                    if (gridEvenParameters) gridEvenParameters.style.display = 'grid';
                }
                resetGridToEven();
                handleParamsChange();
                showToast("Đã đặt lại lưới chia đều!", "success");
            }
        });
    }

    // --- Setup Grid Color Picker Event Listeners ---
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const chosenColor = dot.getAttribute('data-color');
            if (chosenColor) {
                gridLineColor = chosenColor;
                
                // Update active class UI on color dots
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                
                // Redraw grid
                if (currentImage) {
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

    function updateColorPickerUI(color) {
        document.querySelectorAll('.color-dot').forEach(dot => {
            if (dot.getAttribute('data-color') === color) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

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

        const imgX = relativeX * scaleX;
        const imgY = relativeY * scaleY;

        return { 
            x: imgX, 
            y: imgY, 
            scaleX: scaleX, 
            scaleY: scaleY 
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
            
            // Tăng vùng nhạy chạm (hitbox tolerance) trên touch screen/di động để dễ thao tác bằng ngón tay
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            const toleranceMultiplier = isTouch ? 2.5 : 1.5;

            const delToleranceX = (deleteBtnSize / 2) * scaleX * toleranceMultiplier;
            const delToleranceY = (deleteBtnSize / 2) * scaleY * toleranceMultiplier;
            if (Math.abs(imgX - delX) <= delToleranceX && Math.abs(imgY - delY) <= delToleranceY) {
                return { boxIndex: i, actionType: 'delete' };
            }

            // 2. Check Resize handle
            const handleX = box.x + box.w;
            const handleY = box.y + box.h;
            const resToleranceX = boxHandleSize * scaleX * toleranceMultiplier;
            const resToleranceY = boxHandleSize * scaleY * toleranceMultiplier;
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

            const canvasWrapper = document.querySelector('.canvas-wrapper');
            if (canvasWrapper) {
                canvasWrapper.scrollLeft -= dx;
                canvasWrapper.scrollTop -= dy;
            }
            return;
        }

        if (spacePressed) {
            previewCanvas.style.cursor = 'grab';
            return;
        }

        const coords = getNaturalCoords(e.clientX, e.clientY);
        const imgX = coords.x;
        const imgY = coords.y;

        // Xử lý kéo thả khung crop khi đang recut
        if (recutSlideId !== null && dragRecutTarget) {
            let deltaX = imgX - dragRecutTarget.startX;
            let deltaY = imgY - dragRecutTarget.startY;
            if (e.altKey) {
                deltaX *= 0.15;
                deltaY *= 0.15;
            }

            const orig = dragRecutTarget.originalCoords;
            const action = dragRecutTarget.action;

            let newSx = orig.sx;
            let newSy = orig.sy;
            let newW = orig.cropW;
            let newH = orig.cropH;

            const minSize = 20;

            if (action === 'move') {
                newSx = Math.max(0, Math.min(currentImage.naturalWidth - newW, orig.sx + deltaX));
                newSy = Math.max(0, Math.min(currentImage.naturalHeight - newH, orig.sy + deltaY));
            } else {
                if (action.includes('l')) {
                    const proposedSx = orig.sx + deltaX;
                    const limitX = orig.sx + orig.cropW - minSize;
                    newSx = Math.max(0, Math.min(limitX, proposedSx));
                    newW = orig.cropW + (orig.sx - newSx);
                }
                if (action.includes('r')) {
                    const proposedW = orig.cropW + deltaX;
                    const maxW = currentImage.naturalWidth - orig.sx;
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
                    const maxH = currentImage.naturalHeight - orig.sy;
                    newH = Math.max(minSize, Math.min(maxH, proposedH));
                }
            }

            recutTempCoords = {
                sx: Math.round(newSx),
                sy: Math.round(newSy),
                cropW: Math.round(newW),
                cropH: Math.round(newH)
            };

            // Đổi cursor trong lúc kéo
            if (action === 'tl' || action === 'br') previewCanvas.style.cursor = 'nwse-resize';
            else if (action === 'tr' || action === 'bl') previewCanvas.style.cursor = 'nesw-resize';
            else if (action === 'l' || action === 'r') previewCanvas.style.cursor = 'ew-resize';
            else if (action === 't' || action === 'b') previewCanvas.style.cursor = 'ns-resize';
            else if (action === 'move') previewCanvas.style.cursor = 'move';

            drawLiveGrid();
            return;
        }

        // Thay đổi con trỏ chuột khi hover qua các handle/cạnh/bên trong khi recut
        if (recutSlideId !== null && recutTempCoords && !dragRecutTarget) {
            const action = getRecutInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
            if (action) {
                if (action === 'tl' || action === 'br') {
                    previewCanvas.style.cursor = 'nwse-resize';
                } else if (action === 'tr' || action === 'bl') {
                    previewCanvas.style.cursor = 'nesw-resize';
                } else if (action === 'l' || action === 'r') {
                    previewCanvas.style.cursor = 'ew-resize';
                } else if (action === 't' || action === 'b') {
                    previewCanvas.style.cursor = 'ns-resize';
                } else if (action === 'move') {
                    previewCanvas.style.cursor = 'move';
                }

                // Kiểm tra xem hover nút Xác nhận / Hủy
                const recutAction = checkRecutButtonInteraction(imgX, imgY);
                if (recutAction) {
                    previewCanvas.style.cursor = 'pointer';
                }
                return;
            }
        }

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

        // Kiểm tra bấm nút điều khiển Recut nổi trên canvas
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

        // Lưu trữ tọa độ chuột bắt đầu kéo
        lastDragMouseX = imgX;
        lastDragMouseY = imgY;

        if (recutSlideId !== null && recutTempCoords) {
            const action = getRecutInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
            if (action) {
                dragRecutTarget = {
                    action: action,
                    startX: imgX,
                    startY: imgY,
                    originalCoords: { ...recutTempCoords }
                };
                drawLiveGrid();
                return;
            } else {
                // Click ra ngoài khung: Chuyển sang di chuyển (panning) màn hình
                isPanning = true;
                previewCanvas.style.cursor = 'grabbing';
                panStart = { x: e.clientX, y: e.clientY };
                return;
            }
        }

        if (slicingMode === 'grid') {
            const target = findNearestGridLine(e.clientX, e.clientY);
            if (target) {
                dragTarget = target;
            } else {
                isPanning = true;
                previewCanvas.style.cursor = 'grabbing';
                panStart = { x: e.clientX, y: e.clientY };
            }
        } else {
            // Box Mode
            const interaction = getBoxInteractionTarget(imgX, imgY, coords.scaleX, coords.scaleY);
            
            // Chế độ bình thường (không recut hoặc đã được chặn xử lý recut ở trên)
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
        if (dragRecutTarget) {
            dragRecutTarget = null;
            drawLiveGrid();
        }

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

    // Biến lưu trạng thái pinch zoom và pan cảm ứng
    let touchStartDist = 0;
    let startZoomScale = 1;
    let touchStartPanX = 0;
    let touchStartPanY = 0;
    let touchStartCenter = { x: 0, y: 0 };
    let isPinching = false;

    // Touch support mapping for main canvas
    previewCanvas.addEventListener('touchstart', (e) => {
        if (!currentImage) return;
        
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
            
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            
            touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            startZoomScale = zoomScale;
            
            touchStartCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2
            };
            
            touchStartPanX = panX;
            touchStartPanY = panY;
        }
    }, { passive: false });

    previewCanvas.addEventListener('touchmove', (e) => {
        if (!currentImage) return;
        
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
            
            const dx = currentCenter.x - touchStartCenter.x;
            const dy = currentCenter.y - touchStartCenter.y;
            
            const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            if (touchStartDist > 0 && currentDist > 0) {
                const factor = currentDist / touchStartDist;
                const newZoomScale = Math.max(0.05, Math.min(10.0, startZoomScale * factor));
                
                const wrapper = document.querySelector('.canvas-wrapper');
                if (wrapper) {
                    const wrapperRect = wrapper.getBoundingClientRect();
                    const centerX = currentCenter.x - wrapperRect.left;
                    const centerY = currentCenter.y - wrapperRect.top;
                    
                    const zoomRatio = newZoomScale / zoomScale;
                    
                    zoomScale = newZoomScale;
                    updateCanvasDisplaySize();
                    
                    wrapper.scrollLeft = (wrapper.scrollLeft + centerX) * zoomRatio - centerX;
                    wrapper.scrollTop = (wrapper.scrollTop + centerY) * zoomRatio - centerY;
                }
            }
            
            if (dx !== 0 || dy !== 0) {
                const wrapper = document.querySelector('.canvas-wrapper');
                if (wrapper) {
                    wrapper.scrollLeft -= dx;
                    wrapper.scrollTop -= dy;
                }
            }
            
            touchStartCenter = currentCenter;
            touchStartDist = currentDist;
            startZoomScale = zoomScale;
            
            drawLiveGrid();
        }
    }, { passive: false });

    previewCanvas.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            isPinching = false;
            const mouseEvent = new MouseEvent('mouseup', {});
            window.dispatchEvent(mouseEvent);
        } else if (e.touches.length === 1) {
            isPinching = false;
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            previewCanvas.dispatchEvent(mouseEvent);
        }
    }, { passive: true });

    // Mouse Wheel Zoom Listener
    previewCanvas.addEventListener('wheel', (e) => {
        if (!currentImage) return;
        e.preventDefault();

        const wrapper = document.querySelector('.canvas-wrapper');
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const cursorX = e.clientX - wrapperRect.left;
        const cursorY = e.clientY - wrapperRect.top;

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        const newZoomScale = Math.max(0.05, Math.min(10.0, zoomScale * zoomFactor));

        if (newZoomScale !== zoomScale) {
            const oldScrollLeft = wrapper.scrollLeft;
            const oldScrollTop = wrapper.scrollTop;

            const zoomRatio = newZoomScale / zoomScale;

            zoomScale = newZoomScale;
            updateCanvasDisplaySize();

            wrapper.scrollLeft = (oldScrollLeft + cursorX) * zoomRatio - cursorX;
            wrapper.scrollTop = (oldScrollTop + cursorY) * zoomRatio - cursorY;

            drawLiveGrid();
        }
    }, { passive: false });

    // Programmatic Zoom Helper (Zoom from Center)
    const triggerProgrammaticZoom = (factor) => {
        if (!currentImage) return;

        const wrapper = document.querySelector('.canvas-wrapper');
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const cursorX = wrapperRect.width / 2;
        const cursorY = wrapperRect.height / 2;

        const newZoomScale = Math.max(0.05, Math.min(10.0, zoomScale * factor));

        if (newZoomScale !== zoomScale) {
            const oldScrollLeft = wrapper.scrollLeft;
            const oldScrollTop = wrapper.scrollTop;

            const zoomRatio = newZoomScale / zoomScale;

            zoomScale = newZoomScale;
            updateCanvasDisplaySize();

            wrapper.scrollLeft = (oldScrollLeft + cursorX) * zoomRatio - cursorX;
            wrapper.scrollTop = (oldScrollTop + cursorY) * zoomRatio - cursorY;

            drawLiveGrid();
        }
    };

    // Helper to change input grid values (rows/cols/offset) via keyboard
    const changeGridValue = (inputId, delta) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        const min = (input.min !== undefined && input.min !== '') ? parseInt(input.min) : 1;
        const max = (input.max !== undefined && input.max !== '') ? parseInt(input.max) : 20;
        let val = parseInt(input.value);
        if (isNaN(val)) val = 0;
        val = Math.max(min, Math.min(max, val + delta));
        input.value = val;
        input.dispatchEvent(new Event('input'));
    };

    // Global Key Shortcuts Listener
    window.addEventListener('keydown', (e) => {
        // Chặn toàn bộ phím tắt nếu ứng dụng đang ở trạng thái khóa
        if (localStorage.getItem('app_unlocked') !== 'true') {
            return;
        }

        // Xử lý phím tắt cho Modal xem thử điện thoại (Mobile Preview)
        if (mobilePreviewModal && mobilePreviewModal.style.display === 'flex') {
            if (e.key === 'Escape') {
                e.preventDefault();
                mobilePreviewModal.style.display = 'none';
                return;
            }
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                e.preventDefault();
                navigateMobileSlide('prev');
                return;
            }
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                e.preventDefault();
                navigateMobileSlide('next');
                return;
            }
            // Khóa các phím tắt khác khi đang mở xem trước di động
            return;
        }

        if (!currentImage) return;

        // Ignore shortcuts if user is typing in text-entry inputs or select options
        const activeEl = document.activeElement;
        const isTyping = activeEl && (
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            (activeEl.tagName === 'INPUT' && ['text', 'password', 'number', 'email', 'search', 'tel', 'url'].includes(activeEl.type))
        );
        // Cho phép phím tắt [ và ] hoạt động kể cả khi đang focus vào ô nhập liệu
        const isOffsetKey = (e.key === '[' || e.key === ']');
        if (isTyping && !isOffsetKey) {
            return;
        }

        // Xử lý phím tắt đặc biệt khi đang trong chế độ Cắt lại slide đơn (Recut)
        if (recutSlideId !== null) {
            if (e.key === 'Enter') {
                e.preventDefault();
                showConfirm("Bạn có chắc chắn muốn lưu thay đổi cắt lại cho slide này?", () => {
                    handleConfirmRecut();
                });
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelRecut();
                return;
            }
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
        if (e.key === '1' || e.key === '2') {
            if (recutSlideId !== null) {
                e.preventDefault();
                showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
                return;
            }
            e.preventDefault();
            if (e.key === '1' && modeGridBtn) modeGridBtn.click();
            else if (modeBoxBtn) modeBoxBtn.click();
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
            const canvasWrapper = document.querySelector('.canvas-wrapper');
            if (canvasWrapper) {
                canvasWrapper.scrollLeft = 0;
                canvasWrapper.scrollTop = 0;
            }
            drawLiveGrid();
        }

        // [ & ] to change offset value (xén viền ô)
        if (e.key === '[' || e.key === ']') {
            e.preventDefault();
            const delta = (e.key === '[') ? -1 : 1;
            changeGridValue('input-offset-number', delta);
        }

        // Grid mode controls (W/S/A/D or Arrows)
        if (slicingMode === 'grid') {
            if (recutSlideId !== null && ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
                return;
            }
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
            if (recutSlideId !== null) {
                const recutItem = slicedImages.find(item => item.id === recutSlideId);
                const activeBoxId = recutItem?.meta?.boxId;
                const activeBoxIdx = selectionBoxes.findIndex(b => b.id === activeBoxId);
                if (selectedBoxIdx !== activeBoxIdx) {
                    // Chặn phím nudge trên các box khác
                    e.preventDefault();
                    return;
                }
            }
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
            showToast('File ảnh không hợp lệ!', 'warning');
            return;
        }

        // Blur any active element (like file input) to prevent keyboard shortcut conflicts
        if (document.activeElement) {
            document.activeElement.blur();
        }

        currentOriginalFile = file;

        // Xóa sạch kết quả cũ khi tải ảnh mới lên để tránh trộn lẫn và lệch kích thước
        slicedImages = [];
        slicedBlobs = [];
        resultGrid.innerHTML = '';
        resultGrid.className = 'result-grid';
        resultCount.textContent = '0';
        if (resultCountBadge) {
            resultCountBadge.textContent = '0';
        }
        globalTargetW = null;
        globalTargetH = null;
        if (btnDownloadZip) {
            btnDownloadZip.disabled = true;
            btnDownloadZip.style.display = 'none';
        }
        if (btnClearResults) btnClearResults.style.display = 'none';
        if (btnRenumberResults) btnRenumberResults.style.display = 'none';
        if (btnMobilePreview) btnMobilePreview.style.display = 'none';

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
                const canvasWrapper = document.querySelector('.canvas-wrapper');
                if (canvasWrapper) {
                    canvasWrapper.scrollLeft = 0;
                    canvasWrapper.scrollTop = 0;
                }
                selectedBoxIdx = -1;
                
                canvasPlaceholder.style.display = 'none';
                previewCanvas.style.display = 'block';
                imageMeta.style.display = 'flex';
                interactiveTip.style.display = 'flex';
                imgDimOriginal.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
                
                btnSlice.disabled = false;
                if (btnAutoDetect) btnAutoDetect.disabled = false;
                btnGenBoxes.disabled = false;
                btnClearBoxes.disabled = false;
                
                // Tự động tối ưu hóa số lượng hàng/cột của lưới dựa theo tỷ lệ ảnh chuẩn
                const optimalGrid = autoDetectOptimalGrid(img.naturalWidth, img.naturalHeight);
                inputCols.value = optimalGrid.cols;
                inputRows.value = optimalGrid.rows;
                
                resetGridToEven();
                
                selectionBoxes = [];
                nextBoxId = 1;
                
                setTimeout(() => {
                    handleParamsChange();
                    setSlicingMode(slicingMode);
                    // Hiển thị tab cắt ảnh và tự động chuyển sang tab cắt ảnh trên mobile
                    if (mobileNavEdit) mobileNavEdit.classList.remove('disabled');
                    if (mobileNavResult) mobileNavResult.classList.add('disabled');
                    switchMobileTab('edit');
                }, 50);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }


    // --- Draw Watermark Helper ---
    function drawWatermarkOnCtx(targetCtx, position, opacityVal, config = {}) {
        const type = config.type || 'text';
        
        targetCtx.save();
        targetCtx.globalAlpha = opacityVal / 100;
        
        if (type === 'text') {
            const text = config.text || '';
            if (!text) {
                targetCtx.restore();
                return;
            }
            const fontSize = config.fontSize || 24;
            targetCtx.font = `bold ${fontSize}px 'Inter', sans-serif`;
            
            const textMetrics = targetCtx.measureText(text);
            const textWidth = textMetrics.width;
            const padding = fontSize * 0.8;
            
            let x = config.cellX;
            let y = config.cellY;
            
            targetCtx.textAlign = 'left';
            targetCtx.textBaseline = 'middle';
            
            if (position === 'bottom-right') {
                x = config.cellX + config.cellW - textWidth - padding;
                y = config.cellY + config.cellH - padding;
            } else if (position === 'bottom-left') {
                x = config.cellX + padding;
                y = config.cellY + config.cellH - padding;
            } else if (position === 'top-right') {
                x = config.cellX + config.cellW - textWidth - padding;
                y = config.cellY + padding + fontSize / 2;
            } else if (position === 'top-left') {
                x = config.cellX + padding;
                y = config.cellY + padding + fontSize / 2;
            } else if (position === 'center') {
                x = config.cellX + (config.cellW - textWidth) / 2;
                y = config.cellY + config.cellH / 2;
            }
            
            targetCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            targetCtx.lineWidth = Math.max(2, fontSize / 8);
            targetCtx.lineJoin = 'round';
            targetCtx.strokeText(text, x, y);
            
            targetCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            targetCtx.fillText(text, x, y);
            
        } else if (type === 'image') {
            const img = config.imageObj;
            if (!img) {
                targetCtx.restore();
                return;
            }
            
            const scalePercent = config.scalePercent || 20;
            const maxW = config.cellW * (scalePercent / 100);
            const maxH = config.cellH * (scalePercent / 100);
            
            let logoW = img.width;
            let logoH = img.height;
            
            const ratio = Math.min(maxW / logoW, maxH / logoH);
            logoW = logoW * ratio;
            logoH = logoH * ratio;
            
            const padding = Math.max(8, logoW * 0.2);
            
            let x = config.cellX;
            let y = config.cellY;
            
            if (position === 'bottom-right') {
                x = config.cellX + config.cellW - logoW - padding;
                y = config.cellY + config.cellH - logoH - padding;
            } else if (position === 'bottom-left') {
                x = config.cellX + padding;
                y = config.cellY + config.cellH - logoH - padding;
            } else if (position === 'top-right') {
                x = config.cellX + config.cellW - logoW - padding;
                y = config.cellY + padding;
            } else if (position === 'top-left') {
                x = config.cellX + padding;
                y = config.cellY + padding;
            } else if (position === 'center') {
                x = config.cellX + (config.cellW - logoW) / 2;
                y = config.cellY + (config.cellH - logoH) / 2;
            }
            
            targetCtx.drawImage(img, x, y, logoW, logoH);
        }
        
        targetCtx.restore();
    }

    function updateCanvasDisplaySize() {
        if (!currentImage || !previewCanvas) return;
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        if (!canvasWrapper) return;

        const rect = canvasWrapper.getBoundingClientRect();
        const padding = 32; // 16px top & bottom
        const initialHeight = Math.max(200, rect.height - padding);
        const initialWidth = initialHeight * (currentImage.naturalWidth / currentImage.naturalHeight);

        previewCanvas.style.height = (initialHeight * zoomScale) + 'px';
        previewCanvas.style.width = (initialWidth * zoomScale) + 'px';
    }

    // --- Draw Live Preview Grid & Selection Boxes ---
    function drawLiveGrid() {
        if (!currentImage) return;

        updateCanvasDisplaySize();

        previewCanvas.width = currentImage.naturalWidth;
        previewCanvas.height = currentImage.naturalHeight;

        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        const zoomText = document.getElementById('zoom-level-text');
        if (zoomText) {
            zoomText.textContent = `${Math.round(zoomScale * 100)}%`;
        }

        ctx.save();
        ctx.drawImage(currentImage, 0, 0);

        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;
        const offset = parseInt(inputOffset.value) || 0;

        if (slicingMode === 'grid') {
            // Định nghĩa các ô cắt có chứa sẵn tọa độ xén sx, sy, sw, sh
            let cells = [];
            if (gridType === 'even') {
                const boundariesX = [0, ...colsX, width];
                const boundariesY = [0, ...rowsY, height];
                const totalCols = boundariesX.length - 1;
                const totalRows = boundariesY.length - 1;
                
                for (let r = 0; r < totalRows; r++) {
                    for (let c = 0; c < totalCols; c++) {
                        const x1 = boundariesX[c];
                        const x2 = boundariesX[c + 1];
                        const y1 = boundariesY[r];
                        const y2 = boundariesY[r + 1];
                        
                        const leftOffset = (c === 0) ? (2 * offset) : offset;
                        const rightOffset = (c === totalCols - 1) ? (2 * offset) : offset;
                        const topOffset = (r === 0) ? (2 * offset) : offset;
                        const bottomOffset = (r === totalRows - 1) ? (2 * offset) : offset;
                        
                        cells.push({
                            x1: x1, y1: y1, x2: x2, y2: y2,
                            sx: x1 + leftOffset,
                            sy: y1 + topOffset,
                            sw: (x2 - x1) - leftOffset - rightOffset,
                            sh: (y2 - y1) - topOffset - bottomOffset
                        });
                    }
                }
            } else if (gridType === 'fb-1d3v') {
                const midX = width * 0.5;
                const h1 = height * (1/3);
                const h2 = height * (2/3);
                
                const smallCropW = (width - midX) - 3 * offset;
                const smallCropH = h1 - 3 * offset;
                
                // Ô 1 (dọc trái)
                cells.push({
                    x1: 0, y1: 0, x2: midX, y2: height,
                    sx: 2 * offset,
                    sy: 2 * offset,
                    sw: midX - 3 * offset,
                    sh: height - 4 * offset
                });
                // Ô 2 (nhỏ trên phải)
                cells.push({
                    x1: midX, y1: 0, x2: width, y2: h1,
                    sx: midX + offset,
                    sy: 2 * offset,
                    sw: smallCropW,
                    sh: smallCropH
                });
                // Ô 3 (nhỏ giữa phải) - Dịch chuyển thông minh chống méo
                cells.push({
                    x1: midX, y1: h1, x2: width, y2: h2,
                    sx: midX + offset,
                    sy: h1 + offset + Math.floor(offset / 2),
                    sw: smallCropW,
                    sh: smallCropH
                });
                // Ô 4 (nhỏ dưới phải)
                cells.push({
                    x1: midX, y1: h2, x2: width, y2: height,
                    sx: midX + offset,
                    sy: h2 + offset,
                    sw: smallCropW,
                    sh: smallCropH
                });
            } else if (gridType === 'fb-1n3v') {
                const midY = height * 0.5;
                const w1 = width * (1/3);
                const w2 = width * (2/3);
                
                const smallCropW = w1 - 3 * offset;
                const smallCropH = (height - midY) - 3 * offset;
                
                // Ô 1 (ngang trên)
                cells.push({
                    x1: 0, y1: 0, x2: width, y2: midY,
                    sx: 2 * offset,
                    sy: 2 * offset,
                    sw: width - 4 * offset,
                    sh: midY - 3 * offset
                });
                // Ô 2 (nhỏ trái dưới)
                cells.push({
                    x1: 0, y1: midY, x2: w1, y2: height,
                    sx: 2 * offset,
                    sy: midY + offset,
                    sw: smallCropW,
                    sh: smallCropH
                });
                // Ô 3 (nhỏ giữa dưới) - Dịch chuyển thông minh chống méo
                cells.push({
                    x1: w1, y1: midY, x2: w2, y2: height,
                    sx: w1 + offset + Math.floor(offset / 2),
                    sy: midY + offset,
                    sw: smallCropW,
                    sh: smallCropH
                });
                // Ô 4 (nhỏ phải dưới)
                cells.push({
                    x1: w2, y1: midY, x2: width, y2: height,
                    sx: w2 + offset,
                    sy: midY + offset,
                    sw: smallCropW,
                    sh: smallCropH
                });
            }

            // Vẽ vùng màu đỏ mờ đại diện cho phần xén biên
            if (offset > 0) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
                cells.forEach(cell => {
                    const { x1, y1, x2, y2, sx, sy, sw, sh } = cell;
                    
                    if (sw > 0 && sh > 0) {
                        // Vùng xén phía trên
                        if (sy > y1) ctx.fillRect(x1, y1, x2 - x1, sy - y1);
                        // Vùng xén phía dưới
                        if (y2 > sy + sh) ctx.fillRect(x1, sy + sh, x2 - x1, y2 - (sy + sh));
                        // Vùng xén phía trái
                        if (sx > x1) ctx.fillRect(x1, sy, sx - x1, sh);
                        // Vùng xén phía phải
                        if (x2 > sx + sw) ctx.fillRect(sx + sw, sy, x2 - (sx + sw), sh);
                    }
                });
            }

            // Vẽ các nét đứt phân cách gốc (chỉ hiển thị trong phạm vi ảnh)
            ctx.strokeStyle = gridLineColor;
            ctx.lineWidth = Math.max(2, Math.floor(width / 600));
            ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
            
            if (gridType === 'even') {
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
            } else if (gridType === 'fb-1d3v') {
                const midX = width * 0.5;
                const h1 = height * (1/3);
                const h2 = height * (2/3);
                
                ctx.beginPath();
                ctx.moveTo(midX, 0);
                ctx.lineTo(midX, height);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(midX, h1);
                ctx.lineTo(width, h1);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(midX, h2);
                ctx.lineTo(width, h2);
                ctx.stroke();
            } else if (gridType === 'fb-1n3v') {
                const midY = height * 0.5;
                const w1 = width * (1/3);
                const w2 = width * (2/3);
                
                ctx.beginPath();
                ctx.moveTo(0, midY);
                ctx.lineTo(width, midY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(w1, midY);
                ctx.lineTo(w1, height);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(w2, midY);
                ctx.lineTo(w2, height);
                ctx.stroke();
            }

        } else {
            selectionBoxes.forEach((box, idx) => {
                const isRecutting = (recutSlideId !== null && recutBoxId === box.id);
                if (isRecutting) {
                    return; // Skip vẽ box đang recut vì sẽ vẽ recutTempCoords màu vàng/xanh
                }
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

        // Vẽ xem trước Watermark lên từng ô/khung
        const isWatermarkEnabled = switchWatermark && switchWatermark.checked;
        if (isWatermarkEnabled) {
            const type = selectWatermarkType ? selectWatermarkType.value : 'text';
            const position = selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right';
            const opacity = parseInt(inputWatermarkOpacity ? inputWatermarkOpacity.value : 50) || 50;
            const size = parseInt(inputWatermarkSize ? inputWatermarkSize.value : 24) || 24;
            const text = inputWatermarkText ? inputWatermarkText.value.trim() : '';
            const scalePercent = parseInt(inputWatermarkImageScale ? inputWatermarkImageScale.value : 20) || 20;

            if ((type === 'text' && text) || (type === 'image' && watermarkImageObj)) {
                const drawConf = {
                    type: type,
                    text: text,
                    fontSize: size,
                    imageObj: watermarkImageObj,
                    scalePercent: scalePercent
                };

                if (slicingMode === 'grid') {
                    let tempCells = [];
                    if (gridType === 'even') {
                        const boundariesX = [0, ...colsX, width];
                        const boundariesY = [0, ...rowsY, height];
                        const totalCols = boundariesX.length - 1;
                        const totalRows = boundariesY.length - 1;
                        for (let r = 0; r < totalRows; r++) {
                            for (let c = 0; c < totalCols; c++) {
                                const x1 = boundariesX[c];
                                const x2 = boundariesX[c + 1];
                                const y1 = boundariesY[r];
                                const y2 = boundariesY[r + 1];
                                const leftOffset = (c === 0) ? (2 * offset) : offset;
                                const rightOffset = (c === totalCols - 1) ? (2 * offset) : offset;
                                const topOffset = (r === 0) ? (2 * offset) : offset;
                                const bottomOffset = (r === totalRows - 1) ? (2 * offset) : offset;
                                tempCells.push({
                                    sx: x1 + leftOffset,
                                    sy: y1 + topOffset,
                                    sw: (x2 - x1) - leftOffset - rightOffset,
                                    sh: (y2 - y1) - topOffset - bottomOffset
                                });
                            }
                        }
                    } else if (gridType === 'fb-1d3v') {
                        const midX = width * 0.5;
                        const h1 = height * (1/3);
                        const h2 = height * (2/3);
                        const smallCropW = (width - midX) - 3 * offset;
                        const smallCropH = h1 - 3 * offset;
                        tempCells.push({ sx: 2 * offset, sy: 2 * offset, sw: midX - 3 * offset, sh: height - 4 * offset });
                        tempCells.push({ sx: midX + offset, sy: 2 * offset, sw: smallCropW, sh: smallCropH });
                        tempCells.push({ sx: midX + offset, sy: h1 + offset + Math.floor(offset / 2), sw: smallCropW, sh: smallCropH });
                        tempCells.push({ sx: midX + offset, sy: h2 + offset, sw: smallCropW, sh: smallCropH });
                    } else if (gridType === 'fb-1n3v') {
                        const midY = height * 0.5;
                        const w1 = width * (1/3);
                        const w2 = width * (2/3);
                        const smallCropW = w1 - 3 * offset;
                        const smallCropH = (height - midY) - 3 * offset;
                        tempCells.push({ sx: 2 * offset, sy: 2 * offset, sw: width - 4 * offset, sh: midY - 3 * offset });
                        tempCells.push({ sx: 2 * offset, sy: midY + offset, sw: smallCropW, sh: smallCropH });
                        tempCells.push({ sx: w1 + offset + Math.floor(offset / 2), sy: midY + offset, sw: smallCropW, sh: smallCropH });
                        tempCells.push({ sx: w2 + offset, sy: midY + offset, sw: smallCropW, sh: smallCropH });
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
                    selectionBoxes.forEach(box => {
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

        // Vẽ khung đứt nét màu vàng (Grid Mode) hoặc màu xanh lá (Box Mode), 8 handles và 2 nút Xác nhận / Hủy cho chế độ Cắt lại slide đơn
        if (recutSlideId !== null && recutTempCoords) {
            const { sx, sy, cropW, cropH } = recutTempCoords;

            const recutItem = slicedImages.find(item => item.id === recutSlideId);
            const isBoxModeRecut = (recutItem?.meta?.slicingMode === 'box');
            const recutColor = isBoxModeRecut ? '#10b981' : '#eab308'; // Màu xanh Emerald cho Box Mode, màu vàng cho Grid Mode
            const recutBgColor = isBoxModeRecut ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)';

            ctx.save();
            // 1. Vẽ khung viền đứt nét
            ctx.strokeStyle = recutColor;
            ctx.lineWidth = Math.max(3, Math.floor(width / 350));
            ctx.setLineDash([8, 4]);
            ctx.strokeRect(sx, sy, cropW, cropH);

            // Đổ màu nhạt bán trong suốt vào bên trong
            ctx.fillStyle = recutBgColor;
            ctx.fillRect(sx, sy, cropW, cropH);

            // 2. Vẽ 8 handles cho khung crop
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
                { x: x1, y: y1 }, // tl
                { x: xm, y: y1 }, // t
                { x: x2, y: y1 }, // tr
                { x: x1, y: ym }, // l
                { x: x2, y: ym }, // r
                { x: x1, y: y2 }, // bl
                { x: xm, y: y2 }, // b
                { x: x2, y: y2 }  // br
            ];

            handles.forEach(h => {
                ctx.beginPath();
                ctx.arc(h.x, h.y, handleSize / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            });

            // 3. Vẽ 2 nút điều khiển Xác nhận (Check xanh) và Hủy (X đỏ) nằm chính giữa cạnh dưới khung màu vàng/xanh
            const centerX = sx + cropW / 2;
            const btnRad = 18 / zoomScale; // Tăng kích thước nút từ 12 thành 18
            const btnY = sy + cropH - 25 / zoomScale; // Căn giữa cạnh dưới, thụt vào trong 25px
            const confirmX = centerX + 25 / zoomScale;
            const cancelX = centerX - 25 / zoomScale;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 6 / zoomScale;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3 / zoomScale;

            // Vẽ nút Hủy (Xóa màu đỏ)
            ctx.beginPath();
            ctx.arc(cancelX, btnY, btnRad, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.lineWidth = 2.0 / zoomScale;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Vẽ nút Xác nhận (Check màu xanh Emerald)
            ctx.beginPath();
            ctx.arc(confirmX, btnY, btnRad, 0, 2 * Math.PI);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.lineWidth = 2.0 / zoomScale;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Tắt shadow để vẽ dấu check và dấu x bằng canvas path sắc nét
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Vẽ dấu '✕' bằng canvas path sắc nét, bo tròn (đồng bộ bộ icon)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.0 / zoomScale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cancelX - 5 / zoomScale, btnY - 5 / zoomScale);
            ctx.lineTo(cancelX + 5 / zoomScale, btnY + 5 / zoomScale);
            ctx.moveTo(cancelX + 5 / zoomScale, btnY - 5 / zoomScale);
            ctx.lineTo(cancelX - 5 / zoomScale, btnY + 5 / zoomScale);
            ctx.stroke();

            // Vẽ dấu '✓' bằng canvas path sắc nét, bo tròn (đồng bộ bộ icon)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.0 / zoomScale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(confirmX - 6 / zoomScale, btnY);
            ctx.lineTo(confirmX - 2 / zoomScale, btnY + 5 / zoomScale);
            ctx.lineTo(confirmX + 6 / zoomScale, btnY - 5 / zoomScale);
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();
    }

    // --- Smart Self-Adaptive Auto-Detect Grid Borders Algorithm ---

    // --- Smart Self-Adaptive Auto-Detect Grid Borders Algorithm ---
    if (btnAutoDetect) {
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
            showToast("Không thể quét ảnh tự động!", "warning");
        }
    });
    }


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

        // Xóa sạch kết quả cũ của lần cắt trước để tránh trộn lẫn & lệch kích thước
        slicedImages = [];
        slicedBlobs = [];
        resultGrid.innerHTML = '';
        globalTargetW = null;
        globalTargetH = null;

        // Reset trạng thái sửa đổi ảnh đơn
        recutSlideId = null;
        recutBoxId = null;
        updateSidebarControlsState();
        const btnConfirmRecut = document.getElementById('btn-confirm-recut');
        if (btnConfirmRecut) {
            btnConfirmRecut.style.display = 'none';
        }

        const offset = parseInt(inputOffset.value) || 0;
        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;


        // Bắt đầu từ vị trí tiếp nối (số ảnh kết quả hiện tại)
        const startIndex = 0;
        
        if (btnClearResults) btnClearResults.style.display = 'inline-flex';
        if (btnRenumberResults) btnRenumberResults.style.display = 'inline-flex';
        if (btnMobilePreview) btnMobilePreview.style.display = 'inline-flex';
        if (btnDownloadZip) btnDownloadZip.style.display = 'inline-flex';

        let targetW, targetH;

        if (slicingMode === 'grid') {
            if (gridType === 'even') {
                if (!isCustomGrid) {
                    resetGridToEven(); // Đảm bảo colsX và rowsY luôn được chia đều chính xác theo giá trị mới nhất trong input
                }
                const rows = parseInt(inputRows.value) || 1;
                const cols = parseInt(inputCols.value) || 1;
                const boundariesX = [0, ...colsX, width];
                const boundariesY = [0, ...rowsY, height];

                // Xác định kích thước canvas đích chung từ ô đầu tiên
                const firstCellW = boundariesX[1] - boundariesX[0];
                const firstCellH = boundariesY[1] - boundariesY[0];
                
                // Xén rìa ngoài cùng gấp đôi (2 * offset) để loại bỏ sạch viền trắng mép ngoài
                const firstLeftOffset = (2 * offset);
                const firstRightOffset = (cols === 1) ? (2 * offset) : offset;
                const firstTopOffset = (2 * offset);
                const firstBottomOffset = (rows === 1) ? (2 * offset) : offset;

                const firstCropW = firstCellW - firstLeftOffset - firstRightOffset;
                const firstCropH = firstCellH - firstTopOffset - firstBottomOffset;

                if (firstCropW <= 0 || firstCropH <= 0) {
                    showToast("Kích thước ô quá nhỏ. Giảm Offset!", "error");
                    return;
                }

                if (!globalTargetW || !globalTargetH) {
                    const scale = getExportScale(firstCropW);
                    globalTargetW = Math.round(firstCropW * scale);
                    globalTargetH = Math.round(firstCropH * scale);
                }
                targetW = globalTargetW;
                targetH = globalTargetH;

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

                        // Xén rìa ngoài cùng gấp đôi (2 * offset) để loại bỏ sạch viền trắng mép ngoài
                        const leftOffset = (c === 0) ? (2 * offset) : offset;
                        const rightOffset = (c === cols - 1) ? (2 * offset) : offset;
                        const topOffset = (r === 0) ? (2 * offset) : offset;
                        const bottomOffset = (r === rows - 1) ? (2 * offset) : offset;

                        const sx = x1 + leftOffset;
                        const sy = y1 + topOffset;
                        const cropW = cellW - leftOffset - rightOffset;
                        const cropH = cellH - topOffset - bottomOffset;

                        if (cropW <= 0 || cropH <= 0) {
                            showToast(`Ô [H${r+1}, C${c+1}] quá nhỏ. Giảm Offset!`, "error");
                            return;
                        }

                        const resultId = resultIdCounter++;
                        const sliceName = `slide_${startIndex + count}.png`;
                        const meta = {
                            slicingMode: 'grid',
                            gridType: 'even',
                            cellIndex: count - 1,
                            row: r,
                            col: c,
                            targetW: targetW,
                            targetH: targetH
                        };
                        processSlice(sx, sy, cropW, cropH, sliceName, resultId, targetW, targetH, meta);
                        count++;
                    }
                }
            } else {
                // Facebook Asymmetric Grid Layouts
                let gridCells = [];
                if (gridType === 'fb-1d3v') {
                    const midX = width * 0.5;
                    const h1 = height * (1/3);
                    const h2 = height * (2/3);
                    
                    const smallCropW = (width - midX) - 3 * offset;
                    const smallCropH = h1 - 3 * offset;

                    // Ô 1 (to)
                    gridCells.push({ 
                        sx: 2*offset, 
                        sy: 2*offset, 
                        cropW: midX - 3*offset, 
                        cropH: height - 4*offset, 
                        isLarge: true 
                    });
                    // Ô 2 (nhỏ trên)
                    gridCells.push({ 
                        sx: midX + offset, 
                        sy: 2*offset, 
                        cropW: smallCropW, 
                        cropH: smallCropH, 
                        isLarge: false 
                    });
                    // Ô 3 (nhỏ giữa) - Dịch chuyển thông minh chống méo
                    gridCells.push({ 
                        sx: midX + offset, 
                        sy: h1 + offset + Math.floor(offset / 2), 
                        cropW: smallCropW, 
                        cropH: smallCropH, 
                        isLarge: false 
                    });
                    // Ô 4 (nhỏ dưới)
                    gridCells.push({ 
                        sx: midX + offset, 
                        sy: h2 + offset, 
                        cropW: smallCropW, 
                        cropH: smallCropH, 
                        isLarge: false 
                    });
                } else if (gridType === 'fb-1n3v') {
                    const midY = height * 0.5;
                    const w1 = width * (1/3);
                    const w2 = width * (2/3);
                    
                    const smallCropW = w1 - 3 * offset;
                    const smallCropH = (height - midY) - 3 * offset;

                    // Ô 1 (to)
                    gridCells.push({ 
                        sx: 2*offset, 
                        sy: 2*offset, 
                        cropW: width - 4*offset, 
                        cropH: midY - 3*offset, 
                        isLarge: true 
                    });
                    // Ô 2 (nhỏ trái)
                    gridCells.push({ 
                        sx: 2*offset, 
                        sy: midY + offset, 
                        cropW: smallCropW, 
                        cropH: smallCropH, 
                        isLarge: false 
                    });
                    // Ô 3 (nhỏ giữa) - Dịch chuyển thông minh chống méo
                    gridCells.push({ 
                        sx: w1 + offset + Math.floor(offset / 2), 
                        sy: midY + offset, 
                        cropW: smallCropW, 
                        cropH: smallCropH, 
                        isLarge: false 
                    });
                    // Ô 4 (nhỏ phải)
                    gridCells.push({ 
                        sx: w2 + offset, 
                        sy: midY + offset, 
                        cropW: smallCropW, 
                        cropH: smallCropH, 
                        isLarge: false 
                    });
                }

                // Tính toán kích thước canvas đích
                // 1. Nhóm 1: Ảnh to
                const largeCell = gridCells[0];
                if (largeCell.cropW <= 0 || largeCell.cropH <= 0) {
                    showToast("Ô to quá nhỏ. Giảm Offset!", "error");
                    return;
                }
                const largeScale = getExportScale(largeCell.cropW);
                const targetW_large = Math.round(largeCell.cropW * largeScale);
                const targetH_large = Math.round(largeCell.cropH * largeScale);

                // 2. Nhóm 2: 3 Ảnh nhỏ
                const smallCell = gridCells[1];
                if (smallCell.cropW <= 0 || smallCell.cropH <= 0) {
                    showToast("Ô nhỏ quá nhỏ. Giảm Offset!", "error");
                    return;
                }
                const smallScale = getExportScale(smallCell.cropW);
                const targetW_small = Math.round(smallCell.cropW * smallScale);
                const targetH_small = Math.round(smallCell.cropH * smallScale);

                // Cắt 4 slide
                gridCells.forEach((cell, idx) => {
                    const sx = cell.sx;
                    const sy = cell.sy;
                    const cropW = cell.cropW;
                    const cropH = cell.cropH;

                    const resultId = resultIdCounter++;
                    const sliceName = `slide_${startIndex + idx + 1}.png`;
                    
                    const tW = cell.isLarge ? targetW_large : targetW_small;
                    const tH = cell.isLarge ? targetH_large : targetH_small;

                    const meta = {
                        slicingMode: 'grid',
                        gridType: gridType,
                        cellIndex: idx,
                        isLarge: cell.isLarge,
                        targetW: tW,
                        targetH: tH
                    };
                    processSlice(sx, sy, cropW, cropH, sliceName, resultId, tW, tH, meta);
                });
            }
        } else {
            if (selectionBoxes.length === 0) {
                showToast('Hãy vẽ ít nhất 1 khung cắt!', 'warning');
                return;
            }

            // Xác định kích thước canvas đích chung từ khung đầu tiên
            const firstBox = selectionBoxes[0];
            const firstCropW = firstBox.w - (2 * offset);
            const firstCropH = firstBox.h - (2 * offset);

            if (firstCropW <= 0 || firstCropH <= 0) {
                showToast("Khung vẽ quá nhỏ. Giảm Offset!", "error");
                return;
            }

            if (!globalTargetW || !globalTargetH) {
                const scale = getExportScale(firstCropW);
                globalTargetW = Math.round(firstCropW * scale);
                globalTargetH = Math.round(firstCropH * scale);
            }
            targetW = globalTargetW;
            targetH = globalTargetH;

            selectionBoxes.forEach((box, idx) => {
                const sx = box.x + offset;
                const sy = box.y + offset;
                const cropW = box.w - (2 * offset);
                const cropH = box.h - (2 * offset);

                if (cropW <= 0 || cropH <= 0) {
                    showToast(`Khung ${box.id} quá nhỏ. Giảm Offset!`, "error");
                    return;
                }

                const resultId = resultIdCounter++;
                const sliceName = `slide_${startIndex + idx + 1}.png`;
                const meta = {
                    slicingMode: 'box',
                    boxId: box.id,
                    targetW: targetW,
                    targetH: targetH
                };
                processSlice(sx, sy, cropW, cropH, sliceName, resultId, targetW, targetH, meta);
            });
        }

        const totalImages = slicedImages.length;
        resultCount.textContent = totalImages;
        if (resultCountBadge) {
            resultCountBadge.textContent = totalImages;
        }

        // Cập nhật class layout cho Thư viện kết quả để CSS hiển thị dạng lưới bất đối xứng
        if (gridType === 'fb-1d3v' || gridType === 'fb-1n3v') {
            resultGrid.className = `result-grid layout-${gridType}`;
        } else {
            resultGrid.className = 'result-grid';
        }

        tabBtnResult.disabled = false;
        switchTab('tab-result-grid');
        
        // Hiển thị tab kết quả (Thư viện) trên mobile và tự động chuyển sang tab kết quả
        if (mobileNavResult) mobileNavResult.classList.remove('disabled');
        switchMobileTab('result');

        // Tự động lưu dự án vào lịch sử IndexedDB
        saveProjectToDB();
    });

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

        // Áp dụng bộ lọc làm sắc nét từ SVG nếu được kích hoạt
        if (exportSharpness !== 'off') {
            sliceCtx.filter = `url(#sharpen-${exportSharpness})`;
        } else {
            sliceCtx.filter = 'none';
        }

        // Vẽ toàn bộ vùng ảnh gốc trong ô lưới (cropW x cropH) lên Canvas con (targetW x targetH)
        // Trình duyệt sẽ tự động co giãn (nội suy phóng to/thu nhỏ) để lấp đầy vừa khít
        // mà hoàn toàn không cắt bớt bất kỳ pixel nào của ảnh gốc trong vùng lưới
        sliceCtx.drawImage(currentImage, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
        
        // Reset filter sau khi vẽ xong ảnh gốc để tránh ảnh hưởng đến Watermark
        sliceCtx.filter = 'none';

        // Vẽ watermark thật nếu được kích hoạt
        const isWatermarkEnabled = switchWatermark && switchWatermark.checked;
        if (isWatermarkEnabled) {
            const type = selectWatermarkType ? selectWatermarkType.value : 'text';
            const position = selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right';
            const opacity = parseInt(inputWatermarkOpacity ? inputWatermarkOpacity.value : 50) || 50;
            const size = parseInt(inputWatermarkSize ? inputWatermarkSize.value : 24) || 24;
            const text = inputWatermarkText ? inputWatermarkText.value.trim() : '';
            const scalePercent = parseInt(inputWatermarkImageScale ? inputWatermarkImageScale.value : 20) || 20;

            if ((type === 'text' && text) || (type === 'image' && watermarkImageObj)) {
                // Tính toán cỡ chữ thực tế của watermark dựa trên tỷ lệ scale ảnh
                const scaleFactor = targetW / cropW;
                const actualFontSize = Math.max(12, Math.round(size * scaleFactor));
                
                const cellConf = {
                    type: type,
                    text: text,
                    fontSize: actualFontSize,
                    imageObj: watermarkImageObj,
                    scalePercent: scalePercent,
                    cellX: 0,
                    cellY: 0,
                    cellW: targetW,
                    cellH: targetH
                };
                drawWatermarkOnCtx(sliceCtx, position, opacity, cellConf);
            }
        }

        const dataUrl = sliceCanvas.toDataURL('image/png');
        slicedImages.push({ id: resultId, name: sliceName, dataUrl: dataUrl, meta: meta });

        const isFacebookMode = (gridType === 'fb-1d3v' || gridType === 'fb-1n3v');

        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.dataset.id = resultId;
        resultItem.setAttribute('draggable', isFacebookMode ? 'false' : 'true');
        resultItem.style.aspectRatio = `${targetW} / ${targetH}`;

        const grip = document.createElement('div');
        grip.classList.add('result-item-grip');
        grip.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
        resultItem.appendChild(grip);

        const btnDel = document.createElement('button');
        btnDel.classList.add('result-item-btn-del');
        btnDel.innerHTML = '<i class="fa-solid fa-xmark"></i>';
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
                // CSS Grid sẽ tự động điều chỉnh số cột cho nhỏ gọn
            }
        });
        resultItem.appendChild(btnDel);

        const btnEdit = document.createElement('button');
        btnEdit.classList.add('result-item-btn-edit');
        btnEdit.innerHTML = '<i class="fa-solid fa-crop-simple"></i>';
        btnEdit.title = `Cắt lại ô này`;
        btnEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            recutSlideId = resultId;
            const recutItem = slicedImages.find(item => item.id === resultId);
            if (recutItem) {
                recutBoxId = (recutItem.meta && recutItem.meta.slicingMode === 'box') ? recutItem.meta.boxId : null;
                const coords = getRecutSlideCoords(recutItem);
                if (coords) {
                    recutTempCoords = {
                        sx: coords.sx,
                        sy: coords.sy,
                        cropW: coords.cropW,
                        cropH: coords.cropH
                    };
                }
            }
            if (btnSlice) {
                btnSlice.disabled = true; // Vô hiệu hóa nút cắt ảnh chính
            }
            updateSidebarControlsState();
            switchTab('tab-live-grid');
            switchMobileTab('edit');
            drawLiveGrid();
            showToast("Hãy điều chỉnh lưới/khung vẽ, sau đó bấm ✓ trên ảnh để lưu hoặc ✕ để hủy!", "info", 5000);
        });
        resultItem.appendChild(btnEdit);

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

        // Touch Drag & Drop for mobile (Immediate drag on Grip icon)
        grip.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isTouchDragging = true;
            touchSourceEl = resultItem;
            resultItem.classList.add('dragging');
            
            if (navigator.vibrate) {
                navigator.vibrate(40);
            }
            e.preventDefault(); // Ngăn chặn các sự kiện mặc định ngay lập tức
        }, { passive: false });

        grip.addEventListener('touchmove', (e) => {
            if (!isTouchDragging) return;
            
            if (e.cancelable) {
                e.preventDefault();
            }
            
            const touch = e.touches[0];
            const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
            const targetItem = elementUnder ? elementUnder.closest('.result-item') : null;
            
            document.querySelectorAll('.result-item').forEach(item => {
                if (item !== targetItem) {
                    item.classList.remove('drag-over');
                }
            });
            
            if (targetItem && targetItem !== touchSourceEl) {
                targetItem.classList.add('drag-over');
                
                const children = Array.from(resultGrid.children);
                const idxSource = children.indexOf(touchSourceEl);
                const idxTarget = children.indexOf(targetItem);
                
                if (idxSource < idxTarget) {
                    targetItem.parentNode.insertBefore(touchSourceEl, targetItem.nextSibling);
                } else {
                    targetItem.parentNode.insertBefore(touchSourceEl, targetItem);
                }
            }
        }, { passive: false });

        grip.addEventListener('touchend', (e) => {
            if (isTouchDragging && touchSourceEl) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                touchSourceEl.classList.remove('dragging');
                document.querySelectorAll('.result-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
                
                syncArraysOrder();
                
                isTouchDragging = false;
                touchSourceEl = null;
            }
        });
        
        grip.addEventListener('touchcancel', () => {
            if (isTouchDragging && touchSourceEl) {
                touchSourceEl.classList.remove('dragging');
                document.querySelectorAll('.result-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
                isTouchDragging = false;
                touchSourceEl = null;
            }
        });

        // Bổ sung sự kiện click xem ảnh full cho di động (Mobile Lightbox dùng chính modal Mobile Preview)
        resultItem.addEventListener('click', (e) => {
            // Tránh kích hoạt khi click vào các nút hành động con của card
            if (e.target.closest('.result-item-btn-del') || e.target.closest('.result-item-btn-dl') || e.target.closest('.result-item-name-container')) {
                return;
            }
            
            // Nếu có chức năng xem trước trên di động
            if (btnMobilePreview) {
                btnMobilePreview.click(); // Kích hoạt mở modal xem thử
                
                // Đợi modal render xong slide, scroll tới slide tương ứng với card được click
                setTimeout(() => {
                    if (mobileCarouselSlider) {
                        const targetSlideIndex = slicedImages.findIndex(item => item.id === resultId);
                        if (targetSlideIndex !== -1) {
                            const sliderWidth = mobileCarouselSlider.clientWidth;
                            mobileCarouselSlider.scrollLeft = targetSlideIndex * sliderWidth;
                            currentSlideIndex = targetSlideIndex;
                            updateActiveDot(targetSlideIndex);
                        }
                    }
                }, 100);
            }
        });

        resultGrid.appendChild(resultItem);

        sliceCanvas.toBlob((blob) => {
            slicedBlobs.push({ id: resultId, name: sliceName, blob: blob });
            
            if (slicedBlobs.length === slicedImages.length) {
                btnDownloadZip.disabled = false;
            }
        }, 'image/png');
    }

    // --- Drag & Drop for Result Items ---
    let dragSourceEl = null;      // PC drag source
    let touchSourceEl = null;     // Mobile touch source
    let touchTimer = null;        // Long press timer
    let touchStartX = 0;          // Touch start coords
    let touchStartY = 0;
    let isTouchDragging = false;  // Touch dragging state

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

        if (dragSourceEl && dragSourceEl !== this) {
            const children = Array.from(resultGrid.children);
            const idxSource = children.indexOf(dragSourceEl);
            const idxTarget = children.indexOf(this);
            
            if (idxSource < idxTarget) {
                this.parentNode.insertBefore(dragSourceEl, this.nextSibling);
            } else {
                this.parentNode.insertBefore(dragSourceEl, this);
            }
        }
        return false;
    }

    function handleDragEnter(e) {
        if (dragSourceEl !== this) {
            this.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        document.querySelectorAll('.result-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        syncArraysOrder();
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
            a.download = 'social_sliced_images.zip';
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            btnDownloadZip.innerHTML = originalBtnHtml;
            btnDownloadZip.disabled = false;
        }).catch(err => {
            console.error('Lỗi khi nén ZIP:', err);
            showToast('Lỗi tạo ZIP. Hãy tải thủ công!', 'error');
            btnDownloadZip.innerHTML = originalBtnHtml;
            btnDownloadZip.disabled = false;
        });
    });

    // --- Clear All Results ---
    if (btnClearResults) {
        btnClearResults.addEventListener('click', () => {
            showConfirm("Bạn có chắc chắn muốn xóa tất cả các slide ảnh kết quả hiện tại?", () => {
                slicedImages = [];
                slicedBlobs = [];
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
                globalTargetW = null;
                globalTargetH = null;
            });
        });
    }

    // --- Renumber Results ---
    if (btnRenumberResults) {
        btnRenumberResults.addEventListener('click', () => {
            if (slicedImages.length === 0) return;
            
            showConfirm("Bạn có chắc chắn muốn đổi tên và đánh số lại toàn bộ các slide kết quả hiện tại theo thứ tự từ 1 đến " + slicedImages.length + "?", () => {
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

            showToast("Đã đánh số lại các slide!", "success");
            });
        });
    }

    // --- Mobile Carousel Preview Logic ---
    if (btnMobilePreview && mobilePreviewModal) {
        btnMobilePreview.addEventListener('click', () => {
            if (slicedImages.length === 0) return;

            const isFacebookMode = (gridType === 'fb-1d3v' || gridType === 'fb-1n3v');

            // Lấy các element UI mô phỏng
            const fakeTiktokUi = mobilePreviewModal.querySelector('.fake-tiktok-ui');
            const fakeTiktokNav = mobilePreviewModal.querySelector('.fake-tiktok-nav');
            const fakeFacebookUi = mobilePreviewModal.querySelector('.fake-facebook-ui');
            const fakeFacebookNav = mobilePreviewModal.querySelector('.fake-facebook-nav');
            const previewHint = mobilePreviewModal.querySelector('.mobile-preview-hint');
            const fbPostGrid = mobilePreviewModal.querySelector('#fb-post-grid');

            // Lấy thứ tự thực tế trong DOM để hiển thị
            const orderedIds = Array.from(resultGrid.children).map(el => parseInt(el.dataset.id));

            if (isFacebookMode) {
                // 1. Ẩn TikTok UI, hiện Facebook UI
                if (fakeTiktokUi) fakeTiktokUi.style.display = 'none';
                if (fakeTiktokNav) fakeTiktokNav.style.display = 'none';
                if (mobileCarouselSlider) mobileCarouselSlider.style.display = 'none';
                if (mobileCarouselDots) mobileCarouselDots.style.display = 'none';
                if (previewHint) previewHint.style.display = 'none';

                if (fakeFacebookUi) fakeFacebookUi.style.display = 'block';
                if (fakeFacebookNav) fakeFacebookNav.style.display = 'flex';

                // 2. Dựng lưới ảnh Facebook
                if (fbPostGrid) {
                    fbPostGrid.innerHTML = '';
                    fbPostGrid.className = `fb-post-grid fb-grid-${gridType}`;
                    
                    orderedIds.forEach((id) => {
                        const imgData = slicedImages.find(item => item.id === id);
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
                // 1. Ẩn Facebook UI, hiện TikTok UI
                if (fakeFacebookUi) fakeFacebookUi.style.display = 'none';
                if (fakeFacebookNav) fakeFacebookNav.style.display = 'none';

                if (fakeTiktokUi) fakeTiktokUi.style.display = 'block';
                if (fakeTiktokNav) fakeTiktokNav.style.display = 'flex';
                if (mobileCarouselSlider) mobileCarouselSlider.style.display = 'flex';
                if (mobileCarouselDots) mobileCarouselDots.style.display = 'flex';
                if (previewHint) previewHint.style.display = 'block';

                // Xóa sạch nội dung slider và dots cũ
                mobileCarouselSlider.innerHTML = '';
                mobileCarouselDots.innerHTML = '';

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

                // Focus vào slide đầu tiên
                mobileCarouselSlider.scrollLeft = 0;
                currentSlideIndex = 0;
                updateActiveDot(0);
            }

            // Mở modal
            mobilePreviewModal.style.display = 'flex';
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

    // Theo dõi scroll của slider để cập nhật active dot và slide hiện tại
    if (mobileCarouselSlider) {
        mobileCarouselSlider.addEventListener('scroll', () => {
            const sliderWidth = mobileCarouselSlider.clientWidth;
            const scrollLeft = mobileCarouselSlider.scrollLeft;
            const activeIndex = Math.round(scrollLeft / sliderWidth);
            currentSlideIndex = activeIndex;
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

    const navigateMobileSlide = (direction) => {
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

    // Hỗ trợ vuốt chuyển slide nhạy bén (Touch & Mouse swipe)
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let dragStartTime = 0;

    const getClientX = (e) => {
        return e.touches ? e.touches[0].clientX : e.clientX;
    };

    const handleSwipeStart = (e) => {
        if (!mobileCarouselSlider) return;
        isDragging = true;
        dragStartX = getClientX(e);
        dragStartScrollLeft = mobileCarouselSlider.scrollLeft;
        dragStartTime = Date.now();
        
        mobileCarouselSlider.style.scrollSnapType = 'none';
        mobileCarouselSlider.style.scrollBehavior = 'auto';
    };

    const handleSwipeMove = (e) => {
        if (!isDragging || !mobileCarouselSlider) return;
        
        // Ngăn chặn cuộn dọc màn hình ngoài ý muốn khi đang vuốt slide
        if (e.cancelable) e.preventDefault();
        
        const currentX = getClientX(e);
        const dx = currentX - dragStartX;
        
        mobileCarouselSlider.scrollLeft = dragStartScrollLeft - dx;
    };

    const handleSwipeEnd = (e) => {
        if (!isDragging || !mobileCarouselSlider) return;
        isDragging = false;
        
        let endX = dragStartX;
        if (e.changedTouches && e.changedTouches.length > 0) {
            endX = e.changedTouches[0].clientX;
        } else if (e.clientX) {
            endX = e.clientX;
        }
        
        const dx = endX - dragStartX;
        const duration = Date.now() - dragStartTime;
        const slideWidth = mobileCarouselSlider.clientWidth || 1;
        const totalSlides = mobileCarouselSlider.children.length;
        
        mobileCarouselSlider.style.scrollBehavior = 'smooth';
        
        let targetIndex = currentSlideIndex;
        
        // Vuốt nhanh (Flick) < 250ms & cự ly tối thiểu 30px
        if (duration < 250 && Math.abs(dx) > 30) {
            if (dx < 0) {
                targetIndex = Math.min(totalSlides - 1, currentSlideIndex + 1);
            } else {
                targetIndex = Math.max(0, currentSlideIndex - 1);
            }
        } 
        // Kéo chậm nhưng vượt quá 20% slide
        else if (Math.abs(dx) > slideWidth * 0.20) {
            if (dx < 0) {
                targetIndex = Math.min(totalSlides - 1, currentSlideIndex + 1);
            } else {
                targetIndex = Math.max(0, currentSlideIndex - 1);
            }
        } 
        // Snap về slide gần nhất
        else {
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
        // Sự kiện chuột
        mobileCarouselSlider.addEventListener('mousedown', handleSwipeStart);
        window.addEventListener('mousemove', handleSwipeMove);
        window.addEventListener('mouseup', handleSwipeEnd);

        // Sự kiện cảm ứng touch
        mobileCarouselSlider.addEventListener('touchstart', handleSwipeStart, { passive: false });
        mobileCarouselSlider.addEventListener('touchmove', handleSwipeMove, { passive: false });
        mobileCarouselSlider.addEventListener('touchend', handleSwipeEnd, { passive: true });
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
        recutSlideId = null;
        recutBoxId = null;
        updateSidebarControlsState();
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
        
        switchTab('tab-live-grid');
        setSlicingMode('grid');
        
        // Reset tab trên di động về mặc định
        if (mobileNavEdit) mobileNavEdit.classList.add('disabled');
        if (mobileNavResult) mobileNavResult.classList.add('disabled');
        switchMobileTab('upload');
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

    // --- Supabase Cloud Storage & Database Management ---
    const SUPABASE_URL = 'https://awqqnvloeckdxtdcjako.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_aSHG8chYnIlz6R3PkhJqgw_YICNImU6';
    let supabase = null;

    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error("Supabase SDK is not loaded!");
    }

    // Hàm băm mật khẩu SHA-256 bảo mật trực tiếp ở client
    async function hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Biến toàn cục lưu username của tài khoản đăng nhập làm key đồng bộ
    let syncKey = localStorage.getItem('carousel_logged_user') || '';
    
    // Biến trạng thái chế độ Auth (login hoặc register)
    let pcAuthMode = 'login';
    let mobileAuthMode = 'login';

    // Cập nhật trạng thái giao diện tài khoản (Auth UI)
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

        if (syncKey) {
            // Đã đăng nhập
            if (pcLoggedOut) pcLoggedOut.style.display = 'none';
            if (pcLoggedIn) {
                pcLoggedIn.style.display = 'flex';
                if (pcUsername) pcUsername.textContent = syncKey;
            }

            if (mobileLoggedOut) mobileLoggedOut.style.display = 'none';
            if (mobileLoggedIn) {
                mobileLoggedIn.style.display = 'flex';
                if (mobileUsername) mobileUsername.textContent = syncKey;
            }

            if (sidebarAccountName) sidebarAccountName.textContent = syncKey;
            if (sidebarAccountStatus) {
                sidebarAccountStatus.innerHTML = '<i class="fa-solid fa-cloud" style="color: #06b6d4; font-size: 0.72rem;"></i> Đang đồng bộ';
            }
            if (pcAuthPopup) pcAuthPopup.classList.add('user-logged-in');
        } else {
            // Chưa đăng nhập, reset các mode về mặc định (login)
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
            
            // Xóa giá trị trong input
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

    // Xử lý logic Đăng ký tài khoản
    async function performRegister(usernameInputId, passwordInputId) {
        if (!supabase) return;
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
            // Kiểm tra xem username đã tồn tại chưa
            const { data: existingUser, error: checkError } = await supabase
                .from('carousel_users')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingUser) {
                showToast("Tên đăng nhập đã tồn tại!", "error");
                return;
            }

            // Băm mật khẩu và lưu
            const hashedPassword = await hashPassword(password);
            const { error: insertError } = await supabase
                .from('carousel_users')
                .insert([{ username, password: hashedPassword }]);

            if (insertError) throw insertError;

            showToast("Đăng ký tài khoản thành công!", "success");
            syncKey = username;
            localStorage.setItem('carousel_logged_user', syncKey);
            updateAuthUI();
            loadHistoryFromDB();
        } catch (err) {
            console.error("Lỗi đăng ký:", err);
            showToast("Đăng ký tài khoản thất bại!", "error");
        }
    }

    // Xử lý logic Đăng nhập tài khoản
    async function performLogin(usernameInputId, passwordInputId) {
        if (!supabase) return;
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
            
            const { data: user, error: loginError } = await supabase
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

            syncKey = username;
            localStorage.setItem('carousel_logged_user', syncKey);
            updateAuthUI();
            loadHistoryFromDB();
            showToast(`Xin chào, ${syncKey}!`, "success");
        } catch (err) {
            console.error("Lỗi đăng nhập:", err);
            showToast("Đăng nhập thất bại!", "error");
        }
    }

    // Xử lý Đăng xuất
    function performLogout() {
        showConfirm("Bạn có chắc chắn muốn đăng xuất tài khoản?", () => {
            syncKey = '';
            localStorage.removeItem('carousel_logged_user');
            updateAuthUI();
            loadHistoryFromDB();
        });
    }

    // Quản lý chế độ Auth PC (Đăng nhập / Đăng ký)
    const linkPcAuthSwitch = document.getElementById('link-pc-auth-switch');
    const pcAuthTitle = document.getElementById('pc-auth-title');
    const btnPcAuthSubmit = document.getElementById('btn-pc-auth-submit');
    const pcAuthSwitchText = document.getElementById('pc-auth-switch-text');

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
            if (pcAuthMode === 'login') {
                performLogin('pc-username-input', 'pc-password-input');
            } else {
                performRegister('pc-username-input', 'pc-password-input');
            }
        });
    }

    // Đăng xuất PC
    const btnPcLogout = document.getElementById('btn-pc-logout');
    if (btnPcLogout) btnPcLogout.addEventListener('click', performLogout);

    // Thêm sự kiện Enter trên input PC
    const pcUserIn = document.getElementById('pc-username-input');
    const pcPassIn = document.getElementById('pc-password-input');
    const triggerPcAuthOnEnter = (e) => {
        if (e.key === 'Enter') {
            if (pcAuthMode === 'login') {
                performLogin('pc-username-input', 'pc-password-input');
            } else {
                performRegister('pc-username-input', 'pc-password-input');
            }
        }
    };
    if (pcUserIn) pcUserIn.addEventListener('keydown', triggerPcAuthOnEnter);
    if (pcPassIn) pcPassIn.addEventListener('keydown', triggerPcAuthOnEnter);

    // Quản lý chế độ Auth Mobile
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
            if (mobileAuthMode === 'login') {
                performLogin('mobile-username-input', 'mobile-password-input');
            } else {
                performRegister('mobile-username-input', 'mobile-password-input');
            }
        });
    }

    // Đăng xuất Mobile
    const btnMobileLogout = document.getElementById('btn-mobile-logout');
    if (btnMobileLogout) btnMobileLogout.addEventListener('click', performLogout);

    // Thêm sự kiện Enter trên input Mobile
    const mobUserIn = document.getElementById('mobile-username-input');
    const mobPassIn = document.getElementById('mobile-password-input');
    const triggerMobileAuthOnEnter = (e) => {
        if (e.key === 'Enter') {
            if (mobileAuthMode === 'login') {
                performLogin('mobile-username-input', 'mobile-password-input');
            } else {
                performRegister('mobile-username-input', 'mobile-password-input');
            }
        }
    };
    if (mobUserIn) mobUserIn.addEventListener('keydown', triggerMobileAuthOnEnter);
    if (mobPassIn) mobPassIn.addEventListener('keydown', triggerMobileAuthOnEnter);

    // Khởi tạo Auth UI ban đầu
    updateAuthUI();

    // Sự kiện mở/đóng popup Lịch sử trên PC
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

    // Đóng popup lịch sử khi click ra ngoài hoặc click vào backdrop
    if (historyBackdrop) {
        historyBackdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            historyPopup.classList.remove('active');
            historyBackdrop.classList.remove('active');
        });
    }

    // Sự kiện làm mới đồng bộ lịch sử dự án đám mây
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
                    }, 800); // Xoay ít nhất 0.8 giây cho hiệu ứng mượt mà
                }
            }
        });
    };
    triggerSyncRefresh('btn-pc-sync-refresh');
    triggerSyncRefresh('btn-mobile-sync-refresh');

    async function saveProjectToDB() {
        if (!supabase || !currentOriginalFile) return;
        if (!syncKey) {
            console.log("Chưa đăng nhập tài khoản. Dự án sẽ không được lưu trực tuyến.");
            return;
        }

        console.log("Đang tải ảnh gốc lên Supabase Storage...");
        
        try {
            const fileExt = currentOriginalFile.name.split('.').pop() || 'png';
            const fileName = `${syncKey}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('project-images')
                .upload(fileName, currentOriginalFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project-images')
                .getPublicUrl(fileName);

            const newProject = {
                sync_key: syncKey,
                name: currentOriginalFile.name || 'du_an_khong_ten.png',
                date: new Date().toLocaleString('vi-VN'),
                slicing_mode: slicingMode,
                grid_type: gridType,
                rows: parseInt(inputRows.value) || 1,
                cols: parseInt(inputCols.value) || 1,
                ratio: selectRatio.value,
                scale: JSON.stringify({
                    scale: 'auto',
                    grid_line_color: gridLineColor,
                    export_resolution: exportResolution,
                    export_sharpness: exportSharpness
                }),
                offset_val: parseInt(inputOffset.value) || 0,
                selection_boxes: selectionBoxes,
                switch_uniform: switchUniform.checked,
                switch_snap: switchSnap ? switchSnap.checked : true,
                cols_x: colsX,
                rows_y: rowsY,
                image_url: publicUrl
            };

            const { data: dbData, error: dbError } = await supabase
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
        if (!supabase || !syncKey) return;
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, created_at')
                .eq('sync_key', syncKey)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 10) {
                const projectsToDelete = data.slice(0, data.length - 10);
                for (const proj of projectsToDelete) {
                    await deleteProjectStorageFile(proj.id);
                    await supabase.from('projects').delete().eq('id', proj.id);
                }
            }
        } catch (err) {
            console.error("Lỗi khi dọn dẹp dự án cũ:", err);
        }
    }

    async function deleteProjectStorageFile(projectId) {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('image_url')
                .eq('id', projectId)
                .single();
            
            if (error || !data) return;

            const bucketPart = 'project-images/';
            const index = data.image_url.indexOf(bucketPart);
            if (index !== -1) {
                const filePath = decodeURIComponent(data.image_url.substring(index + bucketPart.length));
                await supabase.storage.from('project-images').remove([filePath]);
            }
        } catch (e) {
            console.error("Lỗi khi xóa file storage:", e);
        }
    }

    async function loadHistoryFromDB() {
        if (!supabase) return;

        const pcList = document.getElementById('pc-history-list');
        const mobileList = document.getElementById('history-list');

        if (!syncKey) {
            const emptyMsg = '<div class="history-empty">Đăng nhập tài khoản để xem và đồng bộ lịch sử dự án.</div>';
            if (pcList) pcList.innerHTML = emptyMsg;
            if (mobileList) mobileList.innerHTML = emptyMsg;
            return;
        }

        try {
            const { data: projects, error } = await supabase
                .from('projects')
                .select('*')
                .eq('sync_key', syncKey)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const renderList = (container, isPc = true) => {
                if (!container) return;

                const btnSelectAll = document.getElementById(isPc ? 'btn-pc-select-all-toggle' : 'btn-mobile-select-all-toggle');
                const btnBulkDelete = document.getElementById(isPc ? 'btn-pc-bulk-delete' : 'btn-mobile-bulk-delete');
                const badge = document.getElementById(isPc ? 'pc-selected-count' : 'mobile-selected-count');

                // Ẩn các nút trong header trước khi load
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

                // Hiển thị các nút trong header nếu có dự án
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

                    // Stop propagation khi bấm checkbox để tránh click nhầm vào item
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

                // Cập nhật số lượng và trạng thái nút xóa hàng loạt
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

                // Xử lý chọn tất cả bằng nút icon toggle
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

                // Xử lý xóa hàng loạt
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

            renderList(pcList, true);
            renderList(mobileList, false);

        } catch (err) {
            console.error("Lỗi khi load danh sách lịch sử:", err);
            const errMsg = '<div class="history-empty" style="color: var(--danger);">Không thể kết nối đám mây!</div>';
            if (pcList) pcList.innerHTML = errMsg;
            if (mobileList) mobileList.innerHTML = errMsg;
        }
    }

    async function loadProject(id) {
        if (recutSlideId !== null) {
            showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
            return;
        }
        if (!supabase) return;

        try {
            const { data: proj, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!proj) return;

            console.log("Đang tải ảnh gốc từ Supabase...");
            
            const response = await fetch(proj.image_url);
            const blob = await response.blob();
            currentOriginalFile = new File([blob], proj.name, { type: blob.type });

            slicingMode = proj.slicing_mode;
            gridType = proj.grid_type;
            
            if (slicingMode === 'grid') {
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

            if (selectGridType) selectGridType.value = gridType;
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
            exportResolution = loadedExportResolution;
            exportSharpness = loadedExportSharpness;
            if (selectExportResolution) selectExportResolution.value = exportResolution;
            if (selectExportSharpness) selectExportSharpness.value = exportSharpness;
            if (switchUniform) {
                switchUniform.checked = proj.switch_uniform;
                isUniformSize = proj.switch_uniform;
            }
            if (switchSnap) {
                switchSnap.checked = proj.switch_snap;
                isSnapEnabled = proj.switch_snap;
            }

            colsX = proj.cols_x || [];
            rowsY = proj.rows_y || [];
            selectionBoxes = proj.selection_boxes || [];
            if (selectionBoxes.length > 0) {
                nextBoxId = Math.max(...selectionBoxes.map(b => b.id)) + 1;
            } else {
                nextBoxId = 1;
            }

            if (gridEvenParameters) {
                gridEvenParameters.style.display = (gridType === 'even') ? 'flex' : 'none';
            }

            fileName.textContent = proj.name;
            fileSize.textContent = `(${(blob.size / 1024).toFixed(1)} KB)`;
            dropzonePrompt.style.display = 'none';
            fileInfo.style.display = 'flex';
            dropzone.classList.add('has-image');
            appContent.classList.add('has-image');

            slicedImages = [];
            slicedBlobs = [];
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
                    currentImage = img;
                    zoomScale = 1.0;
                    panX = 0;
                    panY = 0;
                    selectedBoxIdx = -1;
                    
                    canvasPlaceholder.style.display = 'none';
                    previewCanvas.style.display = 'block';
                    imageMeta.style.display = 'flex';
                    interactiveTip.style.display = 'flex';
                    imgDimOriginal.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
                    
                    btnSlice.disabled = false;
                    if (btnAutoDetect) btnAutoDetect.disabled = false;
                    btnGenBoxes.disabled = (slicingMode !== 'box');
                    btnClearBoxes.disabled = (slicingMode !== 'box');

                    if (colsX.length === 0 && rowsY.length === 0 && slicingMode === 'grid' && gridType === 'even') {
                        resetGridToEven();
                    }

                    drawLiveGrid();
                    showToast(`Đã nạp dự án: ${proj.name}`, "success");

                    if (mobileNavEdit) mobileNavEdit.classList.remove('disabled');
                    if (mobileNavResult) mobileNavResult.classList.add('disabled');
                    switchTab('tab-live-grid');
                    switchMobileTab('edit');
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
        if (!supabase) return;
        try {
            await deleteProjectStorageFile(id);
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;

            console.log("Đã xóa dự án khỏi Supabase.");
            loadHistoryFromDB();
        } catch (err) {
            console.error("Lỗi khi xóa dự án:", err);
            showToast("Xóa dự án thất bại!", "error");
        }
    }

    async function deleteProjectsBulk(ids) {
        if (!supabase || !ids || ids.length === 0) return;
        try {
            // Lấy thông tin URL ảnh gốc của tất cả các dự án cần xóa để xóa tệp trên Storage
            const { data: projs, error: fetchErr } = await supabase
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
                    await supabase.storage.from('project-images').remove(filePaths);
                }
            }

            // Xóa các bản ghi dự án trong cơ sở dữ liệu
            const { error: delErr } = await supabase.from('projects').delete().in('id', ids);
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
        if (!supabase) return;
        try {
            const { data: proj, error } = await supabase
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
        if (recutSlideId !== null) {
            showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
            return;
        }
        if (!file || !supabase) return;
        if (!syncKey) {
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
                const fileName = `${syncKey}/${Date.now()}_import.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('project-images')
                    .upload(fileName, imageBlob);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('project-images')
                    .getPublicUrl(fileName);

                const newProject = {
                    sync_key: syncKey,
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

                const { data: insertedProj, error: dbError } = await supabase
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

    // --- Helper to get single slide coordinates for recutting ---
    function getRecutSlideCoords(recutItem) {
        if (!currentImage || !recutItem) return null;
        
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
        const width = currentImage.naturalWidth;
        const height = currentImage.naturalHeight;

        let x1, y1, x2, y2, sx, sy, cropW, cropH;

        if (recutItem.meta.slicingMode === 'grid') {
            if (recutItem.meta.gridType === 'even') {
                const r = recutItem.meta.row;
                const c = recutItem.meta.col;
                const rows = parseInt(inputRows.value) || 1;
                const cols = parseInt(inputCols.value) || 1;

                if (colsX.length === 0 && rowsY.length === 0) {
                    resetGridToEven();
                }

                const boundariesX = [0, ...colsX, width];
                const boundariesY = [0, ...rowsY, height];

                // Đảm bảo chỉ số nằm trong giới hạn để tránh crash
                const safeC = Math.min(c, boundariesX.length - 2);
                const safeR = Math.min(r, boundariesY.length - 2);

                x1 = boundariesX[safeC];
                x2 = boundariesX[safeC + 1];
                y1 = boundariesY[safeR];
                y2 = boundariesY[safeR + 1];

                const leftOffset = (safeC === 0) ? (2 * offset) : offset;
                const rightOffset = (safeC === cols - 1) ? (2 * offset) : offset;
                const topOffset = (safeR === 0) ? (2 * offset) : offset;
                const bottomOffset = (safeR === rows - 1) ? (2 * offset) : offset;

                sx = x1 + leftOffset;
                sy = y1 + topOffset;
                cropW = (x2 - x1) - leftOffset - rightOffset;
                cropH = (y2 - y1) - topOffset - bottomOffset;
            } else {
                const type = recutItem.meta.gridType;
                let gridCells = [];
                if (type === 'fb-1d3v') {
                    const midX = width * 0.5;
                    const h1 = height * (1/3);
                    const h2 = height * (2/3);
                    const smallCropW = (width - midX) - 3 * offset;
                    const smallCropH = h1 - 3 * offset;

                    gridCells.push({ x1: 0, y1: 0, x2: midX, y2: height, sx: 2*offset, sy: 2*offset, cropW: midX - 3*offset, cropH: height - 4*offset });
                    gridCells.push({ x1: midX, y1: 0, x2: width, y2: h1, sx: midX + offset, sy: 2*offset, cropW: smallCropW, cropH: smallCropH });
                    gridCells.push({ x1: midX, y1: h1, x2: width, y2: h2, sx: midX + offset, sy: h1 + offset + Math.floor(offset / 2), cropW: smallCropW, cropH: smallCropH });
                    gridCells.push({ x1: midX, y1: h2, x2: width, y2: height, sx: midX + offset, sy: h2 + offset, cropW: smallCropW, cropH: smallCropH });
                } else if (type === 'fb-1n3v') {
                    const midY = height * 0.5;
                    const w1 = width * (1/3);
                    const w2 = width * (2/3);
                    const smallCropW = w1 - 3 * offset;
                    const smallCropH = (height - midY) - 3 * offset;

                    gridCells.push({ x1: 0, y1: 0, x2: width, y2: midY, sx: 2*offset, sy: 2*offset, cropW: width - 4*offset, cropH: midY - 3*offset });
                    gridCells.push({ x1: 0, y1: midY, x2: w1, y2: height, sx: 2*offset, sy: midY + offset, cropW: smallCropW, cropH: smallCropH });
                    gridCells.push({ x1: w1, y1: midY, x2: w2, y2: height, sx: w1 + offset + Math.floor(offset / 2), sy: midY + offset, cropW: smallCropW, cropH: smallCropH });
                    gridCells.push({ x1: w2, y1: midY, x2: width, y2: height, sx: w2 + offset, sy: midY + offset, cropW: smallCropW, cropH: smallCropH });
                }

                const cell = gridCells[recutItem.meta.cellIndex];
                if (cell) {
                    x1 = cell.x1;
                    y1 = cell.y1;
                    x2 = cell.x2;
                    y2 = cell.y2;
                    sx = cell.sx;
                    sy = cell.sy;
                    cropW = cell.cropW;
                    cropH = cell.cropH;
                }
            }
        } else {
            const box = selectionBoxes.find(b => b.id === recutItem.meta.boxId);
            if (box) {
                x1 = box.x;
                y1 = box.y;
                x2 = box.x + box.w;
                y2 = box.y + box.h;
                sx = box.x + offset;
                sy = box.y + offset;
                cropW = box.w - (2 * offset);
                cropH = box.h - (2 * offset);
            }
        }

        if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return null;

        return { x1, y1, x2, y2, sx, sy, cropW, cropH };
    }

    // --- Box Mode: Check Cursor Hover Target for Recutting 8 Directions ---
    const getRecutInteractionTarget = (imgX, imgY, scaleX, scaleY) => {
        if (!recutTempCoords) return null;

        const { sx, sy, cropW, cropH } = recutTempCoords;
        const x1 = sx;
        const y1 = sy;
        const x2 = sx + cropW;
        const y2 = sy + cropH;

        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const toleranceMultiplier = isTouch ? 2.5 : 1.5;
        const handleSize = 10;
        const toleranceX = handleSize * scaleX * toleranceMultiplier;
        const toleranceY = handleSize * scaleY * toleranceMultiplier;

        // 1. Check 4 corners
        if (Math.abs(imgX - x1) <= toleranceX && Math.abs(imgY - y1) <= toleranceY) return 'tl';
        if (Math.abs(imgX - x2) <= toleranceX && Math.abs(imgY - y1) <= toleranceY) return 'tr';
        if (Math.abs(imgX - x1) <= toleranceX && Math.abs(imgY - y2) <= toleranceY) return 'bl';
        if (Math.abs(imgX - x2) <= toleranceX && Math.abs(imgY - y2) <= toleranceY) return 'br';

        // 2. Check 4 edges
        if (Math.abs(imgX - x1) <= toleranceX && imgY >= y1 && imgY <= y2) return 'l';
        if (Math.abs(imgX - x2) <= toleranceX && imgY >= y1 && imgY <= y2) return 'r';
        if (Math.abs(imgY - y1) <= toleranceY && imgX >= x1 && imgX <= x2) return 't';
        if (Math.abs(imgY - y2) <= toleranceY && imgX >= x1 && imgX <= x2) return 'b';

        // 3. Check inside
        if (imgX >= x1 && imgX <= x2 && imgY >= y1 && imgY <= y2) return 'move';

        return null;
    };

    // --- checkRecutButtonInteraction ---
    const checkRecutButtonInteraction = (imgX, imgY) => {
        if (recutSlideId === null || !recutTempCoords) return null;

        const { sx, sy, cropW, cropH } = recutTempCoords;
        const centerX = sx + cropW / 2;
        const btnRad = 18 / zoomScale; // Bán kính nút to 18px
        const btnY = sy + cropH - 25 / zoomScale; // Căn giữa cạnh dưới, thụt vào trong 25px
        const confirmX = centerX + 25 / zoomScale;
        const cancelX = centerX - 25 / zoomScale;

        const distConfirm = Math.hypot(imgX - confirmX, imgY - btnY);
        const distCancel = Math.hypot(imgX - cancelX, imgY - btnY);

        if (distConfirm <= btnRad) return 'confirm';
        if (distCancel <= btnRad) return 'cancel';

        return null;
    };

    // --- Confirm Recut Single Slide Implementation ---
    const handleConfirmRecut = () => {
        if (recutSlideId === null || !recutTempCoords) return;

        const recutItem = slicedImages.find(item => item.id === recutSlideId);
        if (!recutItem) {
            recutSlideId = null;
            recutBoxId = null;
            recutTempCoords = null;
            if (btnSlice) btnSlice.disabled = false;
            updateSidebarControlsState();
            return;
        }

        const { sx, sy, cropW, cropH } = recutTempCoords;

        if (cropW <= 0 || cropH <= 0) {
            showToast("Kích thước cắt quá nhỏ. Hãy kéo rộng lưới/khung hoặc giảm xén viền!", "error");
            return;
        }

        // Tính toán lại kích thước đích để chống méo hình
        const scale = getExportScale(cropW);
        const targetW = Math.round(cropW * scale);
        const targetH = Math.round(cropH * scale);

        // Cập nhật kích thước đích vào meta
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

        if (exportSharpness !== 'off') {
            sliceCtx.filter = `url(#sharpen-${exportSharpness})`;
        } else {
            sliceCtx.filter = 'none';
        }

        sliceCtx.drawImage(currentImage, sx, sy, cropW, cropH, 0, 0, targetW, targetH);
        sliceCtx.filter = 'none';

        const isWatermarkEnabled = switchWatermark && switchWatermark.checked;
        if (isWatermarkEnabled) {
            const type = selectWatermarkType ? selectWatermarkType.value : 'text';
            const position = selectWatermarkPosition ? selectWatermarkPosition.value : 'bottom-right';
            const opacity = parseInt(inputWatermarkOpacity ? inputWatermarkOpacity.value : 50) || 50;
            const size = parseInt(inputWatermarkSize ? inputWatermarkSize.value : 24) || 24;
            const text = inputWatermarkText ? inputWatermarkText.value.trim() : '';
            const scalePercent = parseInt(inputWatermarkImageScale ? inputWatermarkImageScale.value : 20) || 20;

            if ((type === 'text' && text) || (type === 'image' && watermarkImageObj)) {
                const scaleFactor = targetW / cropW;
                const actualFontSize = Math.max(12, Math.round(size * scaleFactor));
                
                const cellConf = {
                    type: type,
                    text: text,
                    fontSize: actualFontSize,
                    imageObj: watermarkImageObj,
                    scalePercent: scalePercent,
                    cellX: 0,
                    cellY: 0,
                    cellW: targetW,
                    cellH: targetH
                };
                drawWatermarkOnCtx(sliceCtx, position, opacity, cellConf);
            }
        }

        const dataUrl = sliceCanvas.toDataURL('image/png');
        recutItem.dataUrl = dataUrl;

        // Lưu tọa độ cắt mới tùy theo chế độ
        if (recutItem.meta.slicingMode === 'grid') {
            recutItem.meta.customCoords = { sx, sy, cropW, cropH };
        } else if (recutItem.meta.slicingMode === 'box') {
            const box = selectionBoxes.find(b => b.id === recutItem.meta.boxId);
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
            // Cập nhật lại tỷ lệ hiển thị của thẻ slide trên UI
            resultItem.style.aspectRatio = `${targetW} / ${targetH}`;
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
            const blobObj = slicedBlobs.find(item => item.id === recutItem.id);
            if (blobObj) {
                blobObj.blob = blob;
            } else {
                slicedBlobs.push({ id: recutItem.id, name: recutItem.name, blob: blob });
            }
        }, 'image/png');

        showToast("Đã cắt lại slide thành công!", "success");

        recutSlideId = null;
        recutBoxId = null;
        recutTempCoords = null;
        if (btnSlice) btnSlice.disabled = false;
        updateSidebarControlsState();
        drawLiveGrid();

        switchTab('tab-slice-results');
        switchMobileTab('result');
    };

    const handleCancelRecut = () => {
        recutSlideId = null;
        recutBoxId = null;
        recutTempCoords = null;
        if (btnSlice) btnSlice.disabled = false;
        updateSidebarControlsState();
        drawLiveGrid();
        showToast("Đã hủy cắt lại", "info");
        switchTab('tab-slice-results');
        switchMobileTab('result');
    };

    // --- Password Gate Security ---
    const CORRECT_PASSWORD = 'carousel2026';

    function checkPasswordLock() {
        if (!passwordGate) return;

        const securityChecking = document.getElementById('security-checking');
        const passwordBox = document.getElementById('password-box');
        const progressFill = document.getElementById('checking-progress-fill');
        const isUnlocked = localStorage.getItem('app_unlocked') === 'true';

        // Đảm bảo ban đầu hiển thị checking, ẩn form nhập mật khẩu
        if (securityChecking) {
            securityChecking.style.display = 'flex';
            securityChecking.style.opacity = '1';
        }
        if (passwordBox) passwordBox.style.display = 'none';
        passwordGate.style.display = 'flex';
        passwordGate.classList.remove('fade-out');

        let progress = 0;
        const duration = 800; // 0.8 giây
        const intervalTime = 20;
        const increment = (100 / (duration / intervalTime));

        const timer = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
                
                // Sau khi chạy xong progress bar
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

    if (btnUnlockApp && appPasswordInput) {
        const unlock = () => {
            const val = appPasswordInput.value;
            if (val === CORRECT_PASSWORD) {
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
            if (ev.key === 'Enter') {
                unlock();
            }
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

    // --- Mobile Drawer (Tài khoản di động) Toggle ---
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

    if (btnCloseDrawer) {
        btnCloseDrawer.addEventListener('click', closeMobileDrawer);
    }
    if (mobileDrawerBackdrop) {
        mobileDrawerBackdrop.addEventListener('click', closeMobileDrawer);
    }

    // --- PC Account Auth Popup Toggle ---
    const sidebarAccountPanel = document.getElementById('sidebar-account-panel');
    const pcAuthPopup = document.getElementById('pc-auth-popup');
    const btnCloseAuthPopup = document.getElementById('btn-close-auth-popup');

    if (sidebarAccountPanel && pcAuthPopup) {
        sidebarAccountPanel.addEventListener('click', (e) => {
            if (pcAuthPopup.contains(e.target)) return;
            e.stopPropagation();
            pcAuthPopup.classList.toggle('active');
        });

        pcAuthPopup.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // --- Cài đặt & Đóng dấu Popup/Drawer Navigation Logic ---
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
            pcSettingsTeleportZone.appendChild(globalSettingsWrapper);
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
            mobileSettingsTeleportZone.appendChild(globalSettingsWrapper);
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

    // Đăng ký sự kiện PC Settings Toggle
    const btnPcSettingsHeader = document.getElementById('btn-pc-settings-header');
    if (btnPcSettingsHeader) {
        btnPcSettingsHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            if (pcSettingsView && pcSettingsView.style.display === 'flex') {
                switchToPcAuth();
            } else {
                switchToPcSettings();
            }
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

    // Đăng ký sự kiện Mobile Settings Toggle
    const btnMobileSettingsHeader = document.getElementById('btn-mobile-settings-header');
    if (btnMobileSettingsHeader) {
        btnMobileSettingsHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileSettingsView && mobileSettingsView.style.display === 'flex') {
                switchToMobileAuth();
            } else {
                switchToMobileSettings();
            }
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

    // Gắn thêm logic reset view khi đóng popup/drawer
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

    // Đóng popup tài khoản PC khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (pcAuthPopup && pcAuthPopup.classList.contains('active')) {
            if (!pcAuthPopup.contains(e.target) && e.target !== sidebarAccountPanel && !sidebarAccountPanel.contains(e.target)) {
                pcAuthPopup.classList.remove('active');
                setTimeout(switchToPcAuth, 300);
            }
        }
    });

    window.addEventListener('resize', () => {
        if (currentImage) {
            updateCanvasDisplaySize();
        }
    });

    // --- Initialize Features ---
    loadHistoryFromDB();
    checkPasswordLock();
    setSlicingMode('grid');
});

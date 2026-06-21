// --- State & DOM Configuration Module ---

// DOM Elements
export const elements = {
    fileInput: document.getElementById('file-input'),
    dropzone: document.querySelector('.canvas-wrapper'),
    dropzonePrompt: document.getElementById('canvas-placeholder'),
    fileInfo: document.getElementById('file-info'),
    fileName: document.getElementById('file-name'),
    fileSize: document.getElementById('file-size'),
    btnRemoveFile: document.getElementById('btn-remove-file'),
    btnChangeFile: document.getElementById('btn-change-file'),
    btnUploadTrigger: document.getElementById('btn-upload-trigger'),
    
    modeGridBtn: document.getElementById('mode-grid'),
    modeBoxBtn: document.getElementById('mode-box'),
    controlsGridMode: document.getElementById('controls-grid-mode'),
    controlsBoxMode: document.getElementById('controls-box-mode'),
    
    inputRows: document.getElementById('input-rows'),
    inputCols: document.getElementById('input-cols'),
    inputOffset: document.getElementById('input-offset-number'),
    offsetNumberVal: document.getElementById('input-offset-number'), // Trỏ thẳng vào range input hoặc number input tương tự
    
    selectRatio: document.getElementById('select-ratio'),
    ratioControlItem: document.getElementById('ratio-control-item'),
    selectGridType: document.getElementById('select-grid-type'),
    gridTypeControlItem: document.getElementById('grid-type-control-item'),
    gridEvenParameters: document.getElementById('grid-even-parameters'),
    switchUniform: document.getElementById('switch-uniform'),
    switchSnap: document.getElementById('switch-snap'),

    btnSlice: document.getElementById('btn-slice'),
    btnAutoDetect: document.getElementById('btn-auto-detect'),
    btnGenBoxes: document.getElementById('btn-gen-boxes'),
    btnClearBoxes: document.getElementById('btn-clear-boxes'),
    btnDownloadZip: document.getElementById('btn-download-zip'),
    
    tabBtnLive: document.getElementById('tab-btn-live'),
    tabBtnResult: document.getElementById('tab-btn-result'),
    tabLiveGrid: document.getElementById('tab-live-grid'),
    tabResultGrid: document.getElementById('tab-result-grid'),
    
    canvasPlaceholder: document.getElementById('canvas-placeholder'),
    previewCanvas: document.getElementById('preview-canvas'),
    imageMeta: document.getElementById('image-meta'),
    imgDimOriginal: document.getElementById('img-dim-original'),
    imgDimCell: document.getElementById('img-dim-cell'),
    gridModeText: document.getElementById('grid-mode-text'),
    interactiveTip: document.getElementById('interactive-tip'),
    tipText: document.getElementById('tip-text'),
    
    resultCount: document.getElementById('result-count'),
    resultCountBadge: document.getElementById('result-count-badge'),
    resultGrid: document.getElementById('result-grid'),
    btnClearResults: document.getElementById('btn-clear-results'),
    btnRenumberResults: document.getElementById('btn-renumber-results'),
    btnMobilePreview: document.getElementById('btn-mobile-preview'),
    mobilePreviewModal: document.getElementById('mobile-preview-modal'),
    btnCloseMobilePreview: document.getElementById('btn-close-mobile-preview'),
    mobileCarouselSlider: document.getElementById('mobile-carousel-slider'),
    mobileCarouselDots: document.getElementById('mobile-carousel-dots'),
    btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
    appContent: document.getElementById('app-content'),

    // History & Lock Elements
    historyList: document.getElementById('history-list'),
    pcHistoryList: document.getElementById('pc-history-list'),
    btnMobileHistoryViewToggle: document.getElementById('btn-mobile-history-view-toggle'),
    btnPcHistoryViewToggle: document.getElementById('btn-pc-history-view-toggle'),

    passwordGate: document.getElementById('password-gate'),
    btnUnlockApp: document.getElementById('btn-unlock-app'),
    appPasswordInput: document.getElementById('app-password-input'),
    passwordErrorMessage: document.getElementById('password-error-message'),
    btnTogglePasswordVisibility: document.getElementById('btn-toggle-password-visibility'),

    // Watermark DOM Elements
    panelWatermark: document.getElementById('panel-watermark'),
    headerWatermark: document.getElementById('header-watermark'),
    contentWatermark: document.getElementById('content-watermark'),
    switchWatermark: document.getElementById('switch-watermark'),
    watermarkOptionsContainer: document.getElementById('watermark-options-container'),
    inputWatermarkText: document.getElementById('input-watermark-text'),
    selectWatermarkPosition: document.getElementById('select-watermark-position'),
    inputWatermarkSize: document.getElementById('input-watermark-size'),
    watermarkSizeVal: document.getElementById('watermark-size-val'),
    inputWatermarkOpacity: document.getElementById('input-watermark-opacity'),
    watermarkOpacityVal: document.getElementById('watermark-opacity-val'),

    // Watermark Image DOM Elements
    selectWatermarkType: document.getElementById('select-watermark-type'),
    watermarkTextConfig: document.getElementById('watermark-text-config'),
    watermarkImageConfig: document.getElementById('watermark-image-config'),
    inputWatermarkImage: document.getElementById('input-watermark-image'),
    watermarkImagePreviewInfo: document.getElementById('watermark-image-preview-info'),
    inputWatermarkImageScale: document.getElementById('input-watermark-image-scale'),
    watermarkImageScaleVal: document.getElementById('watermark-image-scale-val'),

    // Export Settings DOM Elements
    panelExportSettings: document.getElementById('panel-export-settings'),
    headerExportSettings: document.getElementById('header-export-settings'),
    contentExportSettings: document.getElementById('content-export-settings'),
    selectExportResolution: document.getElementById('select-export-resolution'),
    selectExportSharpness: document.getElementById('select-export-sharpness'),
    selectExportFormat: document.getElementById('select-export-format'),
    containerExportQuality: document.getElementById('container-export-quality'),
    inputExportQuality: document.getElementById('input-export-quality'),
    exportQualityVal: document.getElementById('export-quality-val'),

    // PC & Mobile Account / Auth Elements
    sidebarAccountPanel: document.getElementById('sidebar-account-panel'),
    pcAuthPopup: document.getElementById('pc-auth-popup'),
    btnCloseAuthPopup: document.getElementById('btn-close-auth-popup'),
    pcLoggedOut: document.getElementById('pc-auth-logged-out'),
    pcLoggedIn: document.getElementById('pc-auth-logged-in'),
    pcUsername: document.getElementById('pc-auth-username'),
    mobileLoggedOut: document.getElementById('mobile-auth-logged-out'),
    mobileLoggedIn: document.getElementById('mobile-auth-logged-in'),
    mobileUsername: document.getElementById('mobile-auth-username'),
    sidebarAccountName: document.getElementById('sidebar-account-name'),
    sidebarAccountStatus: document.getElementById('sidebar-account-status'),
    linkPcAuthSwitch: document.getElementById('link-pc-auth-switch'),
    pcAuthTitle: document.getElementById('pc-auth-title'),
    btnPcAuthSubmit: document.getElementById('btn-pc-auth-submit'),
    pcAuthSwitchText: document.getElementById('pc-auth-switch-text'),

    // Mobile Navigation Bottom Buttons
    mobileNavUpload: document.getElementById('mobile-nav-upload'),
    mobileNavEdit: document.getElementById('mobile-nav-edit'),
    mobileNavResult: document.getElementById('mobile-nav-result'),

    // Sidebar & Mobile Params toggler
    sidebar: document.getElementById('sidebar'),
    btnMobileToggleParams: document.getElementById('btn-mobile-toggle-params'),
};

// Global App State
export const state = {
    // Slicing and Images
    slicingMode: 'grid',       // 'grid' | 'box'
    gridType: 'even',          // 'even' | 'fb-1d3v' | 'fb-1n3v' | 'tiktok-carousel-916' | 'tiktok-carousel-34' | ...
    currentImage: null,
    currentOriginalFile: null,
    slicedImages: [],          // Mảng { id, name, dataUrl, meta, sliceParams, keep }
    slicedBlobs: [],           // Mảng { id, name, blob }
    recutSlideId: null,
    recutBoxId: null,
    recutTempCoords: null,
    dragRecutTarget: null,

    // Export & Quality
    exportFormat: 'png',       // 'png' | 'jpeg' | 'webp'
    exportQuality: 0.9,        // 0.1 - 1.0
    exportResolution: 'auto',   // 'auto' | 'original' | '2k' | '4k'
    exportSharpness: 'off',    // 'off' | 'light' | 'medium' | 'strong'
    watermarkImageObj: null,

    // Grid Mode State
    colsX: [],
    rowsY: [],
    isCustomGrid: false,
    dragTarget: null,

    // Box Mode State
    selectionBoxes: [],
    nextBoxId: 1,
    isDrawingNewBox: false,
    newBoxStart: { x: 0, y: 0 },
    dragBoxTarget: null,

    // Constraints & Snapping
    lockedRatio: null,         // null hoặc number
    isUniformSize: false,
    isSnapEnabled: true,
    snapGuides: [],

    // Result Configs
    resultIdCounter: 1,
    globalTargetW: null,
    globalTargetH: null,

    // Zoom & Pan State
    zoomScale: 1.0,
    baseCanvasWidth: 0,
    baseCanvasHeight: 0,
    panX: 0,
    panY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
    spacePressed: false,
    isPanning: false,
    selectedBoxIdx: -1,
    panStart: { x: 0, y: 0 },
    lastDragMouseX: 0,
    lastDragMouseY: 0,

    // Undo/Redo State
    historyStack: [],
    historyPointer: -1,
    isApplyingHistoryState: false,
    saveStateTimeout: null,

    // Sync & Auth Info
    historyViewMode: localStorage.getItem('history_view_mode') || 'list',
    syncKey: localStorage.getItem('carousel_logged_user') || '',
    supabase: null
};

// Global App Constants
export const constants = {
    dragTolerancePx: 14,
    boxHandleSize: 10,
    deleteBtnSize: 18,
    DB_NAME: 'CarouselCutLocalDB',
    DB_VERSION: 1,
    STORE_NAME: 'current_project',
    CORRECT_PASSWORD: 'carousel2026',
};

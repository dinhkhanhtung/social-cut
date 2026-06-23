// --- UI Helpers & Result Grid Rendering Module ---
import { state, elements } from './state.js';
import { saveLocalProjectState } from './db.js';
import { 
    getRecutSlideCoords, 
    focusOnRecutArea, 
    updateSidebarControlsState, 
    drawLiveGrid, 
    regenerateSlicedImagesMimeType,
    centerCanvas 
} from './main.js';

// Drag & Drop State Variables
let dragSourceEl = null;      // PC drag source
let touchSourceEl = null;     // Mobile touch source
let touchStartX = 0;          // Touch start coords
let touchStartY = 0;
let isTouchDragging = false;  // Touch dragging state

// --- Custom Toast System ---
export function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-box toast-${type}`;

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

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', dismissToast);

    if (duration > 0) {
        setTimeout(dismissToast, duration);
    }
}

// --- Custom Confirm Modal System ---
export function showConfirm(message, onConfirm, onCancel = null) {
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

    btnCancel.onclick = handleCancel;
    btnOk.onclick = handleOk;
    container.querySelector('.custom-confirm-backdrop').onclick = handleCancel;

    container.offsetHeight; // Force reflow
    container.classList.add('active');
}

// --- Tab Switching Logic ---
export const switchTab = (tabId) => {
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

export const switchMobileTab = (tabId) => {
    const appContainer = document.querySelector('.app-container');
    const sidebar = document.getElementById('sidebar');
    const btnMobileToggleParams = document.getElementById('btn-mobile-toggle-params');
    const mobileNavUpload = document.getElementById('mobile-nav-upload');
    const mobileNavEdit = document.getElementById('mobile-nav-edit');
    const mobileNavResult = document.getElementById('mobile-nav-result');

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
        if (state.currentImage) {
            setTimeout(centerCanvas, 150);
        }
    } else if (tabId === 'result') {
        switchTab('tab-result-grid');
    } else if (tabId === 'upload') {
        switchTab('tab-live-grid');
    }
};

// --- Dựng Lưới ảnh kết quả và gắn sự kiện tương tác ---
export function restoreResultGrid(loadedSlicedImages) {
    elements.resultGrid.innerHTML = '';
    state.slicedImages = loadedSlicedImages || [];
    state.slicedBlobs = [];
    
    if (state.slicedImages.length === 0) return;
    
    state.slicedImages.forEach(item => {
        const resultId = item.id;
        const dataUrl = item.dataUrl;
        const sliceName = item.name;
        const targetW = item.sliceParams ? item.sliceParams.targetW : 1080;
        const targetH = item.sliceParams ? item.sliceParams.targetH : 1080;
        
        const isFacebookMode = (state.gridType === 'fb-1d3v' || state.gridType === 'fb-1n3v');

        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.dataset.id = resultId;
        resultItem.setAttribute('draggable', isFacebookMode ? 'false' : 'true');
        
        let displayRatio = targetW / targetH;
        if (displayRatio > 2.0) {
            displayRatio = 2.0;
        } else if (displayRatio < 0.5) {
            displayRatio = 0.5;
        }
        resultItem.style.aspectRatio = String(displayRatio);

        const grip = document.createElement('div');
        grip.classList.add('result-item-grip');
        grip.innerHTML = '<i class="fa-solid fa-grip-vertical"></i>';
        resultItem.appendChild(grip);

        // Checkbox giữ lại slide kết quả (Chỉ hiển thị ô checkbox)
        const keepLabel = document.createElement('label');
        keepLabel.classList.add('keep-slide-label');
        keepLabel.title = "Khóa slide này để không bị cắt đè khi điều chỉnh lưới cắt";
        keepLabel.innerHTML = `<input type="checkbox" class="keep-slide-checkbox"${item.keep ? ' checked' : ''}>`;
        const keepCb = keepLabel.querySelector('.keep-slide-checkbox');
        keepCb.addEventListener('change', () => {
            item.keep = keepCb.checked;
            saveLocalProjectState();
        });
        resultItem.appendChild(keepLabel);

        const btnDel = document.createElement('button');
        btnDel.classList.add('result-item-btn-del');
        btnDel.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        btnDel.title = `Xóa slide này`;
        btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            resultItem.remove();
            
            state.slicedImages = state.slicedImages.filter(img => img.id !== resultId);
            state.slicedBlobs = state.slicedBlobs.filter(img => img.id !== resultId);
            
            const total = state.slicedImages.length;
            elements.resultCount.textContent = total;
            if (elements.resultCountBadge) elements.resultCountBadge.textContent = total;
            
            if (total === 0) {
                elements.btnDownloadZip.disabled = true;
                if (elements.btnDownloadZip) elements.btnDownloadZip.style.display = 'none';
                if (elements.btnClearResults) elements.btnClearResults.style.display = 'none';
                if (elements.btnRenumberResults) elements.btnRenumberResults.style.display = 'none';
                if (elements.btnMobilePreview) elements.btnMobilePreview.style.display = 'none';
                state.globalTargetW = null;
                state.globalTargetH = null;
            }
            saveLocalProjectState();
        });
        resultItem.appendChild(btnDel);

        // Nút Sao chép ảnh kết quả
        const btnCopy = document.createElement('button');
        btnCopy.classList.add('result-item-btn-copy');
        btnCopy.innerHTML = '<i class="fa-solid fa-copy"></i>';
        btnCopy.title = `Sao chép ảnh này vào clipboard`;
        btnCopy.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                showToast("Đã sao chép ảnh vào bộ nhớ tạm!", "success");
            } catch (err) {
                console.error("Lỗi khi sao chép ảnh:", err);
                showToast("Không thể sao chép ảnh!", "danger");
            }
        });
        resultItem.appendChild(btnCopy);



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
        const baseName = sliceName.replace(/\.[^/.]+$/, "");
        nameInput.value = baseName;
        nameInput.title = "Nhấp chuột hoặc nhấn Enter để đổi tên";
        
        nameInput.style.width = Math.max(12, Math.min(120, nameInput.value.length * 7.5)) + 'px';
        nameInput.addEventListener('input', () => {
            nameInput.style.width = Math.max(12, Math.min(120, nameInput.value.length * 7.5)) + 'px';
        });
        
        nameInput.addEventListener('focus', () => {
            resultItem.setAttribute('draggable', 'false');
        });
        nameInput.addEventListener('blur', () => {
            resultItem.setAttribute('draggable', 'true');
            const newBaseName = nameInput.value.trim().replace(/[\\/:*?"<>|]/g, '');
            const extVal = state.exportFormat === 'png' ? 'png' : (state.exportFormat === 'jpeg' ? 'jpg' : 'webp');
            const newFullName = newBaseName ? `${newBaseName}.${extVal}` : sliceName;
            nameInput.value = newBaseName || baseName;
            
            const imgObj = state.slicedImages.find(img => img.id === resultId);
            if (imgObj) imgObj.name = newFullName;
            saveLocalProjectState();
        });
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') nameInput.blur();
        });

        nameContainer.appendChild(nameInput);
        resultItem.appendChild(nameContainer);

        const btnDl = document.createElement('button');
        btnDl.classList.add('result-item-btn-dl');
        btnDl.innerHTML = '<i class="fa-solid fa-download"></i>';
        btnDl.title = `Tải xuống slide này`;
        btnDl.addEventListener('click', () => {
            const a = document.createElement('a');
            const currentImgObj = state.slicedImages.find(img => img.id === resultId);
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

        // Touch Drag & Drop cho mobile (Kéo thả thông qua biểu tượng Grip)
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
            e.preventDefault();
        }, { passive: false });

        grip.addEventListener('touchmove', (e) => {
            if (!isTouchDragging) return;
            if (e.cancelable) e.preventDefault();
            
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
                const children = Array.from(elements.resultGrid.children);
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
                if (e.cancelable) e.preventDefault();
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

        // Click xem ảnh lớn toàn màn hình trên di động (Mobile Lightbox)
        resultItem.addEventListener('click', (e) => {
            if (e.target.closest('.result-item-btn-del') || e.target.closest('.result-item-btn-dl') || e.target.closest('.result-item-name-container') || e.target.closest('.result-item-btn-copy') || e.target.closest('.result-item-btn-edit') || e.target.closest('.keep-slide-label')) {
                return;
            }
            if (elements.btnMobilePreview) {
                elements.btnMobilePreview.click();
                setTimeout(() => {
                    if (elements.mobileCarouselSlider) {
                        const targetSlideIndex = state.slicedImages.findIndex(img => img.id === resultId);
                        if (targetSlideIndex !== -1) {
                            const sliderWidth = elements.mobileCarouselSlider.clientWidth;
                            elements.mobileCarouselSlider.scrollLeft = targetSlideIndex * sliderWidth;
                            // main.js will manage currentSlideIndex and updateActiveDot
                        }
                    }
                }, 100);
            }
        });

        elements.resultGrid.appendChild(resultItem);
    });

    const total = state.slicedImages.length;
    elements.resultCount.textContent = total;
    if (elements.resultCountBadge) elements.resultCountBadge.textContent = total;
    
    if (state.gridType === 'fb-1d3v' || state.gridType === 'fb-1n3v') {
        elements.resultGrid.className = `result-grid layout-${state.gridType}`;
    } else {
        elements.resultGrid.className = 'result-grid';
    }

    elements.tabBtnResult.disabled = false;
    if (elements.btnClearResults) elements.btnClearResults.style.display = 'inline-flex';
    if (elements.btnRenumberResults) elements.btnRenumberResults.style.display = 'inline-flex';
    if (elements.btnMobilePreview) elements.btnMobilePreview.style.display = 'inline-flex';
    if (elements.btnDownloadZip) {
        elements.btnDownloadZip.style.display = 'inline-flex';
        elements.btnDownloadZip.disabled = false;
    }

    regenerateSlicedImagesMimeType();
}

// --- Drag & Drop Event Handlers ---
export function handleDragStart(e) {
    this.classList.add('dragging');
    dragSourceEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    if (dragSourceEl && dragSourceEl !== this) {
        const children = Array.from(elements.resultGrid.children);
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

export function handleDragEnter(e) {
    if (dragSourceEl !== this) {
        this.classList.add('drag-over');
    }
}

export function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

export function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    return false;
}

export function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.result-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    syncArraysOrder();
}

export function syncArraysOrder() {
    const orderedIds = Array.from(elements.resultGrid.children).map(el => parseInt(el.dataset.id));
    
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
}

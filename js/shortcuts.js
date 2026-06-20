// --- Keyboard Shortcuts Module ---
import { state, elements } from './state.js';
import { showToast, showConfirm } from './ui-helpers.js';
import { 
    undo, 
    redo, 
    navigateMobileSlide, 
    handleConfirmRecut, 
    handleCancelRecut, 
    triggerProgrammaticZoom, 
    centerCanvas, 
    drawLiveGrid, 
    resetToEvenGridType, 
    handleParamsChange 
} from './main.js';


export function initShortcuts() {
    // Helper to change input values safely
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

    window.addEventListener('keydown', (e) => {
        // Chặn toàn bộ phím tắt nếu ứng dụng đang ở trạng thái khóa
        if (localStorage.getItem('app_unlocked') !== 'true') {
            return;
        }

        // Ctrl + O hoặc Cmd + O để tải ảnh lên (Photoshop style)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            if (elements.fileInput) elements.fileInput.click();
            return;
        }

        // Ctrl + Z để Undo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
            return;
        }

        // Ctrl + Y để Redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
            return;
        }

        // Xử lý phím tắt cho Modal xem thử điện thoại (Mobile Preview)
        if (elements.mobilePreviewModal && elements.mobilePreviewModal.style.display === 'flex') {
            if (e.key === 'Escape') {
                e.preventDefault();
                elements.mobilePreviewModal.style.display = 'none';
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
            return; // Khóa các phím tắt khác khi đang mở xem trước di động
        }

        if (!state.currentImage) return;

        // Ignore shortcuts if user is typing in text-entry inputs or select options
        const activeEl = document.activeElement;
        const isTyping = activeEl && (
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            (activeEl.tagName === 'INPUT' && ['text', 'password', 'number', 'email', 'search', 'tel', 'url'].includes(activeEl.type))
        );
        
        // Cho phép phím tắt [ và ] hoạt động kể cả khi đang focus vào ô nhập liệu
        const isOffsetKey = (e.key === '[' || e.code === 'BracketLeft' || e.key === ']' || e.code === 'BracketRight');
        if (isTyping && !isOffsetKey) {
            return;
        }

        // Xử lý phím tắt đặc biệt khi đang trong chế độ Cắt lại slide đơn (Recut)
        if (state.recutSlideId !== null) {
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

        // Toggle Keyboard Shortcuts Panel với '?'
        if (e.key === '?') {
            e.preventDefault();
            const popup = document.getElementById('shortcuts-popup');
            if (popup) popup.classList.toggle('active');
            return;
        }

        // Spacebar to Pan
        if (e.code === 'Space') {
            e.preventDefault();
            if (!state.spacePressed) {
                state.spacePressed = true;
                elements.previewCanvas.style.cursor = 'grab';
            }
        }

        // 1 & 2 to Switch Mode
        if (e.key === '1' || e.key === '2') {
            if (state.recutSlideId !== null) {
                e.preventDefault();
                showToast("Vui lòng hoàn thành hoặc hủy cắt lại slide hiện tại trước!", "warning");
                return;
            }
            e.preventDefault();
            if (e.key === '1' && elements.modeGridBtn) elements.modeGridBtn.click();
            else if (elements.modeBoxBtn) elements.modeBoxBtn.click();
        }

        // Toggle Sidebar với 'q' hoặc 'b'
        if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'b') {
            e.preventDefault();
            if (elements.btnToggleSidebar) elements.btnToggleSidebar.click();
        }

        // C hoặc Enter để Cắt
        if ((e.key.toLowerCase() === 'c' || e.key === 'Enter') && !elements.btnSlice.disabled) {
            e.preventDefault();
            elements.btnSlice.click();
        }

        // Z để Tải ZIP
        if (e.key.toLowerCase() === 'z' && !elements.btnDownloadZip.disabled) {
            e.preventDefault();
            elements.btnDownloadZip.click();
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
            state.zoomScale = 1.0;
            centerCanvas();
            drawLiveGrid();
        }

        // [ & ] để thay đổi Offset (xén viền)
        const isBracketLeft = (e.key === '[' || e.code === 'BracketLeft');
        const isBracketRight = (e.key === ']' || e.code === 'BracketRight');
        if (isBracketLeft || isBracketRight) {
            e.preventDefault();
            const delta = isBracketLeft ? -1 : 1;
            changeGridValue('input-offset-number', delta);
        }

        // Grid mode: W/S/A/D hoặc mũi tên tăng giảm hàng cột
        if (state.slicingMode === 'grid') {
            if (state.recutSlideId !== null && ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
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

        // Box mode: Di chuyển ô cắt tự do
        if (state.slicingMode === 'box' && state.selectedBoxIdx !== -1) {
            if (state.recutSlideId !== null) {
                const recutItem = state.slicedImages.find(item => item.id === state.recutSlideId);
                const activeBoxId = recutItem?.meta?.boxId;
                const activeBoxIdx = state.selectionBoxes.findIndex(b => b.id === activeBoxId);
                if (state.selectedBoxIdx !== activeBoxIdx) {
                    e.preventDefault();
                    return;
                }
            }
            const box = state.selectionBoxes[state.selectedBoxIdx];
            const step = e.shiftKey ? 10 : 1;

            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
                e.preventDefault();
                resetToEvenGridType();
                box.y = Math.max(0, box.y - step);
                handleParamsChange();
            } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
                e.preventDefault();
                resetToEvenGridType();
                box.y = Math.min(state.currentImage.naturalHeight - box.h, box.y + step);
                handleParamsChange();
            } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                e.preventDefault();
                resetToEvenGridType();
                box.x = Math.max(0, box.x - step);
                handleParamsChange();
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                e.preventDefault();
                resetToEvenGridType();
                box.x = Math.min(state.currentImage.naturalWidth - box.w, box.x + step);
                handleParamsChange();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                state.selectionBoxes.splice(state.selectedBoxIdx, 1);
                state.selectionBoxes.forEach((b, idx) => {
                    b.id = idx + 1;
                });
                state.nextBoxId = state.selectionBoxes.length + 1;
                state.selectedBoxIdx = -1;
                elements.gridModeText.textContent = `Tự do (${state.selectionBoxes.length} khung)`;
                handleParamsChange();
                drawLiveGrid();
            }
        }

        if (e.key === 'Escape') {
            state.selectedBoxIdx = -1;
            drawLiveGrid();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            state.spacePressed = false;
            elements.previewCanvas.style.cursor = state.isPanning ? 'grabbing' : 'default';
        }
    });
}

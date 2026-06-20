// --- Download Helper Module ---
import { state, elements } from './state.js';
import { showToast } from './ui-helpers.js';

export async function downloadAllImages() {
    if (state.slicedBlobs.length === 0) {
        showToast('Không có ảnh kết quả để tải!', 'warning');
        return;
    }

    const btnDownloadZip = elements.btnDownloadZip; // Kept the variable name same for simplicity and safety
    if (!btnDownloadZip) return;

    const originalBtnHtml = btnDownloadZip.innerHTML;
    btnDownloadZip.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
    btnDownloadZip.disabled = true;

    try {
        // Sequential download with a small delay (100ms) to ensure browser doesn't block multiple files
        for (let i = 0; i < state.slicedBlobs.length; i++) {
            const item = state.slicedBlobs[i];
            const url = URL.createObjectURL(item.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Short delay between triggers
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        showToast('Đã tải xuống toàn bộ ảnh!', 'success');
    } catch (err) {
        console.error('Lỗi khi tải ảnh:', err);
        showToast('Lỗi khi tải xuống ảnh. Vui lòng tải thủ công!', 'error');
    } finally {
        btnDownloadZip.innerHTML = originalBtnHtml;
        btnDownloadZip.disabled = false;
    }
}

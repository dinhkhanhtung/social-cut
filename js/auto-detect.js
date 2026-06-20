// --- Auto-Detect Grid Borders Algorithm Module ---
import { state, elements } from './state.js';
import { showToast } from './ui-helpers.js';
import { handleParamsChange } from './main.js';

export function autoDetectOptimalGrid() {
    if (!state.currentImage) return;

    const rows = parseInt(elements.inputRows.value) || 1;
    const cols = parseInt(elements.inputCols.value) || 1;
    const width = state.currentImage.naturalWidth;
    const height = state.currentImage.naturalHeight;

    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = width;
    hiddenCanvas.height = height;
    const hiddenCtx = hiddenCanvas.getContext('2d');
    hiddenCtx.drawImage(state.currentImage, 0, 0);

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
        const filterSeparatorsDynamic = (seps, maxLen) => {
            if (seps.length === 0) return [];
            const sortedByWidth = [...seps].sort((a, b) => b.width - a.width);
            const result = [];
            const minDistance = maxLen * 0.10; 

            for (let i = 0; i < sortedByWidth.length; i++) {
                const candidate = sortedByWidth[i];
                const isTooClose = result.some(selected => Math.abs(selected.center - candidate.center) < minDistance);
                if (!isTooClose) {
                    result.push(candidate);
                }
            }
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
            finalCols = filteredCols.map(item => item.center);
            finalRows = filteredRows.map(item => item.center);
            finalColsCount = filteredCols.length + 1;
            finalRowsCount = filteredRows.length + 1;
        } else {
            const currentRows = parseInt(elements.inputRows.value) || 1;
            const currentCols = parseInt(elements.inputCols.value) || 1;
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
                recommendedOffset = Math.round(avgWidth / 2) + 1;
            }
        }

        // Cập nhật thông số lên ô nhập liệu trên giao diện
        elements.inputCols.value = finalColsCount;
        elements.inputRows.value = finalRowsCount;

        state.colsX = finalCols;
        state.rowsY = finalRows;
        
        state.isCustomGrid = true;
        elements.gridModeText.textContent = "Tự động căn (Auto-Detect)";
        elements.gridModeText.style.color = "var(--success)";

        // Gọi handleParamsChange lần đầu để vẽ lưới và tính toán maxAllowedOffset dựa trên minCellSize
        handleParamsChange();

        // Áp dụng offset tự động
        if (recommendedOffset > 0) {
            let minCellSize = Infinity;
            let prevX = 0;
            for (let i = 0; i <= state.colsX.length; i++) {
                const curX = (i === state.colsX.length) ? width : state.colsX[i];
                minCellSize = Math.min(minCellSize, curX - prevX);
                prevX = curX;
            }
            let prevY = 0;
            for (let j = 0; j <= state.rowsY.length; j++) {
                const curY = (j === state.rowsY.length) ? height : state.rowsY[j];
                minCellSize = Math.min(minCellSize, curY - prevY);
                prevY = curY;
            }
            const maxAllowedOffset = Math.max(0, Math.floor(minCellSize / 2) - 1);
            
            const finalOffset = Math.min(recommendedOffset, maxAllowedOffset);
            elements.inputOffset.value = finalOffset;
            if (elements.offsetNumberVal) {
                elements.offsetNumberVal.value = finalOffset;
            }
            
            handleParamsChange();
        } else {
            elements.inputOffset.value = 0;
            if (elements.offsetNumberVal) {
                elements.offsetNumberVal.value = 0;
            }
            handleParamsChange();
        }
        
        elements.previewCanvas.animate([
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
}

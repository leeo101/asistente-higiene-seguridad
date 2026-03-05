import ExcelJS from 'exceljs';
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Reporte");

const ASISTENTE_HYS_LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACH0lEQVR4nO3WMWrbQBgH8P+R2o1Qj9AruHQQOoTuwUN48BDWc4TQRUIP4MVD2A6hB3ClQyDqEBrcI1joECpdgr5D2+KqK510Z8l+H/iQEJKQ8/sO2ZLtAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKB1iQj3Gfcb9xQvGM96q9Q2iQhPGT9L2k14t0rdQ8ZdxiuF/I8Zb3qr3AR6Uci/xR/GfM6Vf0h4X8j/hLHEfM4Jjwr53zF+6a1yA2hHIf9Txl/GW0bTW+VqwS81v1PGa0bZW+WqwQs1v2P8YpS9Va4arNT8XhifGc/nXPntIqN/z1X2VrkqsNL9XhifFwzXq2wA/xnjE+Ntb5WrAj8y/ioY7A3jTW+VCwV7hj/B8GvGG8Yy1/w1hT9J2E1421vlQsH8uS/I06N1rOqT1mGf/u/a1Z+PzO11e+1bT6Xms1c2B8xnmZ/9+QkAcJ/Zz5vO95p922X2s7mJ/9QcMZ/T+fl2Pj7LPN+Y7zD7OdtxT822+Zy27/9g1rBv9/Z9t23M51R/PqfzmQv23/58p3H2VqnS4H739+0m/tPYrVKlz3B3v2UcxuHnU++VKinIfdntDq1hN1y/3120XqlSQdbzYtF6pUoFnfM9zS/M4bM2L6rVqxXyZq+98z2V95yL1T8o5H3M+/E91fdcStU/KP7R2uNzqtUvlX/9nWr1S1Vfv2davVLlX79nWr1S+EAAACwJf4Bntp6h83445oAAAAASUVORK5CYII=";

try {
    const logoId = workbook.addImage({
        base64: `data:image/png;base64,${ASISTENTE_HYS_LOGO_BASE64}`,
        extension: 'png',
    });
    console.log("Image Added", logoId);

    sheet.addImage(logoId, {
        tl: { col: 2, row: 0.2 },
        ext: { width: 50, height: 50 },
        editAs: 'absolute'
    });

    workbook.xlsx.writeBuffer().then((buf) => {
        console.log("Write buffer success, bytes:", buf.byteLength);
    }).catch(e => {
        console.log("Write buffer error", e);
    });

} catch (err) {
    console.log("Error:", err);
}

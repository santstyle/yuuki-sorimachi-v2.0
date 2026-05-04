const fs = require('fs');
const path = require('path');

const filesToDelete = [
    // Isi file disini 
];

filesToDelete.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${file}`);
        } catch (e) {
            console.error(`Failed to delete ${file}: ${e.message}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});

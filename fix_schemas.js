const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'models');
const files = fs.readdirSync(dir);

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to remove the owner field definition from schemas.
    // It looks like:
    // owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // or similar variants. We can use a regex to match the block.
    content = content.replace(/owner\s*:\s*\{[\s\S]*?\},?/g, '');
    
    fs.writeFileSync(filePath, content);
  }
});
console.log('Removed owner field from all schemas');

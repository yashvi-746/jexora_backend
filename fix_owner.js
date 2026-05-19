const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'controller');
const files = fs.readdirSync(dir);

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace { owner: req.user.id } -> {}
    content = content.replace(/\{\s*owner:\s*req\.user\.id\s*\}/g, '{}');
    content = content.replace(/\{\s*owner:\s*userId\s*\}/g, '{}');
    
    // Replace , owner: req.user.id inside query objects
    // Example: { _id: req.params.id, owner: req.user.id } -> { _id: req.params.id }
    content = content.replace(/,\s*owner:\s*req\.user\.id/g, '');
    content = content.replace(/owner:\s*req\.user\.id\s*,/g, '');
    
    // Do the same for userId
    content = content.replace(/,\s*owner:\s*userId/g, '');
    content = content.replace(/owner:\s*userId\s*,/g, '');
    
    fs.writeFileSync(filePath, content);
  }
});
console.log('Fixed owner filters in controllers');

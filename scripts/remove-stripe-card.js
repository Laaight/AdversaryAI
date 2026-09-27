const fs = require('fs');
const path = require('path');

const bundleFiles = [
  path.join(__dirname, '../frontend/dist/app/assets/index-V3_figures.js'),
  path.join(__dirname, '../frontend/dist/app/assets/index-DF9_arena.js'),
  path.join(__dirname, '../frontend/dist/app/assets/index-CIu_KwmT.js')
];

for (const filePath of bundleFiles) {
  if (!fs.existsSync(filePath)) continue;
  let code = fs.readFileSync(filePath, 'utf8');

  const startMarker = 'const _adminStripe=document.createElement("div");';
  const startIndex = code.indexOf(startMarker);
  if (startIndex === -1) {
    console.log(`Marker not found in ${path.basename(filePath)}`);
    continue;
  }

  // Find where this block ends: right after "}, 0);" before the enclosing function closing brace
  const endMarker = '}, 0);\n    }';
  const endMarkerCrLf = '}, 0);\r\n    }';
  let endIndex = code.indexOf(endMarker, startIndex);
  let len = endMarker.length - 6; // leave the closing \n    }
  if (endIndex === -1) {
    endIndex = code.indexOf(endMarkerCrLf, startIndex);
    len = endMarkerCrLf.length - 7;
  }

  if (endIndex !== -1) {
    code = code.slice(0, startIndex) + code.slice(endIndex + len);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Successfully removed Stripe admin card from ${path.basename(filePath)}`);
  } else {
    console.warn(`Could not find end marker in ${path.basename(filePath)}`);
  }
}

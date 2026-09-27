const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, '../frontend/dist/app/assets/index-DF9_arena.js'),
  path.join(__dirname, '../frontend/dist/app/assets/index-CIu_KwmT.js')
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping non-existent ${filePath}`);
    continue;
  }
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. uh map
  const oldUh = 'const uh={lincoln:"older-man",churchill:"older-man",socrates:"older-man",douglass:"man-pro",mlk:"man-pro",einstein:"older-man",aurelius:"older-man",voltaire:"man-pro",eleanor:"older-woman",smith:"older-man"};';
  const newUh = 'const uh={lincoln:"older-man",churchill:"older-man",socrates:"older-man",douglass:"man-pro",mlk:"man-pro",einstein:"older-man",aurelius:"older-man",voltaire:"man-pro",eleanor:"older-woman",smith:"older-man",god_reformed:"older-man",the_devil:"man-pro",cs_lewis:"older-man",aquinas:"older-man",nietzsche:"older-man",hitchens:"man-pro"};';
  if (code.includes(oldUh)) {
    code = code.replace(oldUh, newUh);
    console.log(`Patched uh in ${path.basename(filePath)}`);
  }

  // 2. gh map
  const oldGh = 'biblical_creationist:"older-man",moral_humanist:"woman-pro"};';
  const newGh = 'biblical_creationist:"older-man",moral_humanist:"woman-pro",jordan_peterson:"man-pro"};';
  if (code.includes(oldGh)) {
    code = code.replace(oldGh, newGh);
    console.log(`Patched gh in ${path.basename(filePath)}`);
  }

  // 3. Lc array
  const oldLc = '{id:"moral_humanist",name:"The Moral Humanist",tagline:"Secular ethics & well-being",description:"Grounds objective morality in conscious suffering and flourishing; critiques ancient dogma while defending human dignity.",icon:it.chat}';
  const newLc = '{id:"moral_humanist",name:"The Moral Humanist",tagline:"Secular ethics & well-being",description:"Grounds objective morality in conscious suffering and flourishing; critiques ancient dogma while defending human dignity.",icon:it.chat},\n  {id:"jordan_peterson",name:"The Archetypal Psychologist",tagline:"Meaning, responsibility & archetypes",description:"Analyzes reality through evolutionary psychology, biblical narratives as deep psychological truth, and voluntary confrontation with chaos.",icon:it.compass}';
  if (code.includes(oldLc)) {
    code = code.replace(oldLc, newLc);
    console.log(`Patched Lc in ${path.basename(filePath)}`);
  }

  // 4. lx map
  const oldLx = 'biblical_creationist:"The Biblical Creationist",moral_humanist:"The Moral Humanist"};';
  const newLx = 'biblical_creationist:"The Biblical Creationist",moral_humanist:"The Moral Humanist",jordan_peterson:"The Archetypal Psychologist"};';
  if (code.includes(oldLx)) {
    code = code.replace(oldLx, newLx);
    console.log(`Patched lx in ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, code, 'utf8');
}

console.log('Archetypes and Figures successfully patched into frontend bundles.');

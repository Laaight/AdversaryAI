const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'dist', 'app', 'assets', 'index-CIu_KwmT.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update gh avatar mapping
const oldGh = 'gh={prosecutor:"man-pro",professor:"older-man",contrarian:"woman-pro",coach:"woman-casual"}';
const newGh = 'gh={prosecutor:"man-pro",professor:"older-man",contrarian:"woman-pro",coach:"woman-casual",theist_mathematician:"older-man",secular_rationalist:"man-pro",evolutionary_biologist:"older-man",islamic_theologian:"man-pro",biblical_creationist:"older-man",moral_humanist:"woman-pro"}';
if (code.includes(oldGh)) {
  code = code.replace(oldGh, newGh);
}

// 2. Update Lc persona list
const oldLc = 'const Lc=[{id:"prosecutor",name:"The Prosecutor",tagline:"Relentless cross-examiner",description:"Treats every claim like testimony. Expect rapid-fire questions, demands for evidence, and zero mercy for hand-waving.",icon:it.scale},{id:"professor",name:"The Professor",tagline:"Socratic questioner",description:"Never tells you the answer — asks the question that unravels your argument. Patient, precise, and quietly devastating.",icon:it.cap},{id:"contrarian",name:"The Contrarian",tagline:"Steelmans the other side",description:"Takes the strongest version of the opposing view and defends it brilliantly, forcing you to earn every inch of ground.",icon:it.swap},{id:"coach",name:"The Coach",tagline:"Supportive sparring partner",description:"Pushes hard during the round, then breaks down exactly what worked and what didn’t — with detailed, actionable scores.",icon:it.clipboard}];';

const newLc = `const Lc=[
  {id:"prosecutor",name:"The Prosecutor",tagline:"Relentless cross-examiner",description:"Treats every claim like testimony. Expect rapid-fire questions, demands for evidence, and zero mercy for hand-waving.",icon:it.scale},
  {id:"professor",name:"The Professor",tagline:"Socratic questioner",description:"Never tells you the answer — asks the question that unravels your argument. Patient, precise, and quietly devastating.",icon:it.cap},
  {id:"contrarian",name:"The Contrarian",tagline:"Steelmans the other side",description:"Takes the strongest version of the opposing view and defends it brilliantly, forcing you to earn every inch of ground.",icon:it.swap},
  {id:"coach",name:"The Coach",tagline:"Supportive sparring partner",description:"Pushes hard during the round, then breaks down exactly what worked and what didn’t — with detailed, actionable scores.",icon:it.clipboard},
  {id:"theist_mathematician",name:"The Cambridge Theist",tagline:"Fine-tuning & teleology",description:"Defends classical theism via universal fine-tuning, the unreasonable effectiveness of math, and DNA digital code.",icon:it.landmark},
  {id:"secular_rationalist",name:"The Secular Rationalist",tagline:"Analytic skepticism & reason",description:"Attacks supernatural claims with Ockham's razor, the problem of animal suffering, divine hiddenness, and Euthyphro.",icon:it.compass},
  {id:"evolutionary_biologist",name:"The Evolutionary Biologist",tagline:"Common descent & deep time",description:"Defends neo-Darwinian evolution with endogenous retroviruses, comparative anatomy, transitional fossils, and deep time.",icon:it.trending},
  {id:"islamic_theologian",name:"The Islamic Theologian",tagline:"Kalam cosmology & Tawhid",description:"Argues cosmic contingency necessitates an uncaused Creator; defends strict Monotheism against naturalism and Trinity.",icon:it.target},
  {id:"biblical_creationist",name:"The Biblical Creationist",tagline:"Special creation & scripture",description:"Challenges naturalist epistemology, uniformitarian age dating, the impossibility of abiogenesis, and information loss.",icon:it.trophy},
  {id:"moral_humanist",name:"The Moral Humanist",tagline:"Secular ethics & well-being",description:"Grounds objective morality in conscious suffering and flourishing; critiques ancient dogma while defending human dignity.",icon:it.chat}
];`;

if (code.includes(oldLc)) {
  code = code.replace(oldLc, newLc);
}

// 3. Update lx dictionary
const oldLx = 'const lx={prosecutor:"The Prosecutor",professor:"The Professor",contrarian:"The Contrarian",coach:"The Coach"};';
const newLx = 'const lx={prosecutor:"The Prosecutor",professor:"The Professor",contrarian:"The Contrarian",coach:"The Coach",theist_mathematician:"The Cambridge Theist",secular_rationalist:"The Secular Rationalist",evolutionary_biologist:"The Evolutionary Biologist",islamic_theologian:"The Islamic Theologian",biblical_creationist:"The Biblical Creationist",moral_humanist:"The Moral Humanist"};';

if (code.includes(oldLx)) {
  code = code.replace(oldLx, newLx);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched index-CIu_KwmT.js with worldview archetypes!');

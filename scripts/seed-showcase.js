const https = require('https');

const cfToken = process.env.cloudflarkey;
if (!cfToken) {
  console.error("cloudflarkey environment variable is required.");
  process.exit(1);
}

async function queryD1(sql) {
  const body = JSON.stringify({ sql });
  return new Promise((resolve, reject) => {
    const req = https.request('https://api.cloudflare.com/client/v4/accounts/c7c994f6f420b6b429084f0e9c915ded/d1/database/a2763f97-fa6a-46c7-b3e9-349c50ad16ff/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function esc(s) {
  return String(s || '').replace(/'/g, "''");
}

async function main() {
  console.log("Seeding showcase debates with batch SQL...");

  // Debate 1
  const d1 = "arena_showcase_fine_tuning";
  await queryD1(`
    INSERT INTO debates (id, user_id, personality, topic, mode, setup_json, is_public, views, created_at, ended_at)
    VALUES (
      '${d1}',
      '97ac8562803b3d90c6235dbba174cd25',
      'theist_mathematician',
      'Does Universal Fine-Tuning Prove the Existence of God?',
      'debate',
      '{"judge":"1","targetRounds":"6","personaVisual":"older-man"}',
      1,
      142,
      '2026-09-26T18:30:00.000Z',
      '2026-09-26T18:45:00.000Z'
    ) ON CONFLICT(id) DO UPDATE SET is_public = 1, views = 142;
  `);

  await queryD1(`DELETE FROM turns WHERE debate_id = '${d1}'`);
  const turns1 = [
    { role: "user", text: "The fine-tuning argument is just a classic God-of-the-gaps assertion. If the cosmological constant were different, another universe with different physics might harbor completely different kinds of life, or a multiverse explains our lucky numbers." },
    { role: "assistant", text: "A common objection, but it conflates two distinct issues. Fine-tuning doesn't merely refer to 'life as we know it'; it refers to the fundamental prerequisites for any chemistry, complexity, or stable matter whatsoever. If the strong nuclear force were altered by just 0.5%, carbon and oxygen could never form in stellar nucleosynthesis. As for the multiverse: positing an unobserved, infinite generator of universes requires vastly more metaphysical machinery and fine-tuned laws of its own than a single cosmic Intelligence. If you found a radio receiving Beethoven in the Sahara, would you assume an infinite random radio generator, or a transmitter?" },
    { role: "user", text: "A transmitter is a known physical entity; a transcendent mind is not. The multiverse is a natural mathematical consequence of cosmic inflation in modern quantum cosmology, not an arbitrary metaphysical leap." },
    { role: "assistant", text: "Notice how quickly naturalism grants itself supernatural liberties. Inflationary mechanisms themselves require hyper-precise scalar potential fields to yield eternal inflation rather than immediate collapse. Furthermore, you grant that the digital code in DNA and the mathematical intelligibility of physical constants exist, yet insist that mind emerged purely from mindless particles. If human reason is merely the accidental byproduct of blind Darwinian survival mutations, why do you trust your own cognitive faculties to assess quantum cosmology accurately?" }
  ];
  const tVals1 = turns1.map(t => `('${d1}', '${t.role}', '${esc(t.text)}', '2026-09-26T18:35:00.000Z')`).join(",");
  await queryD1(`INSERT INTO turns (debate_id, role, text, created_at) VALUES ${tVals1}`);

  const scores1 = JSON.stringify({
    you: { argumentation: 8, evidence: 7, rebuttal: 8, composure: 9 },
    opponent: { argumentation: 9, evidence: 9, rebuttal: 9, composure: 9 }
  });
  const reason1 = "A fiercely contested debate on teleology and cosmic inflation. The human debater effectively pressed the multiverse hypothesis and questioned the epistemic jump to a transcendent mind. The Cambridge Theist delivered devastating counter-punches regarding the fine-tuning of inflationary physics and the evolutionary argument against naturalism. Dead even on rebuttal speed; the theist slightly edged on evidential precision.";
  const turn1 = "The theist's pivot demanding whether blind evolutionary processes could validate human confidence in abstract cosmological mathematics forced the human onto the epistemological defensive.";

  await queryD1(`
    INSERT INTO verdicts (debate_id, winner, assessment, scores_json, reasoning, turning_point, created_at)
    VALUES (
      '${d1}',
      'draw',
      null,
      '${esc(scores1)}',
      '${esc(reason1)}',
      '${esc(turn1)}',
      '2026-09-26T18:46:00.000Z'
    ) ON CONFLICT(debate_id) DO UPDATE SET winner = 'draw', scores_json = excluded.scores_json, reasoning = excluded.reasoning;
  `);

  await queryD1(`DELETE FROM debate_votes WHERE debate_id = '${d1}'`);
  const votesRows1 = [];
  for (let i = 1; i <= 42; i++) votesRows1.push(`('${d1}', 'voter_u_${i}', 'you', '2026-09-26T19:00:00.000Z')`);
  for (let i = 1; i <= 38; i++) votesRows1.push(`('${d1}', 'voter_o_${i}', 'opponent', '2026-09-26T19:00:00.000Z')`);
  for (let i = 1; i <= 7; i++) votesRows1.push(`('${d1}', 'voter_d_${i}', 'draw', '2026-09-26T19:00:00.000Z')`);
  await queryD1(`INSERT INTO debate_votes (debate_id, voter_key, vote, created_at) VALUES ${votesRows1.join(",")}`);

  await queryD1(`DELETE FROM debate_reactions WHERE debate_id = '${d1}'`);
  const reactRows1 = [];
  for (let i = 1; i <= 18; i++) reactRows1.push(`('${d1}', 'reactor_f_${i}', 'fire', '2026-09-26T19:00:00.000Z')`);
  for (let i = 1; i <= 14; i++) reactRows1.push(`('${d1}', 'reactor_b_${i}', 'brain', '2026-09-26T19:00:00.000Z')`);
  await queryD1(`INSERT INTO debate_reactions (debate_id, reactor_key, reaction, created_at) VALUES ${reactRows1.join(",")}`);
  console.log("Seeded Debate 1: The Cambridge Theist");

  // Debate 2
  const d2 = "arena_showcase_ai_liability";
  await queryD1(`
    INSERT INTO debates (id, user_id, personality, topic, mode, setup_json, is_public, views, created_at, ended_at)
    VALUES (
      '${d2}',
      '97ac8562803b3d90c6235dbba174cd25',
      'prosecutor',
      'Should AI Labs Be Criminally Liable for Catastrophic Misuse?',
      'debate',
      '{"judge":"1","targetRounds":"6","personaVisual":"man-pro"}',
      1,
      215,
      '2026-09-26T15:20:00.000Z',
      '2026-09-26T15:38:00.000Z'
    ) ON CONFLICT(id) DO UPDATE SET is_public = 1, views = 215;
  `);

  await queryD1(`DELETE FROM turns WHERE debate_id = '${d2}'`);
  const turns2 = [
    { role: "user", text: "Holding developers criminally liable for what third-party users do with open-weight models destroys innovation. Gun manufacturers aren't prosecuted when criminals pull triggers, and knife makers aren't jailed for assaults." },
    { role: "assistant", text: "Objection: false equivalence. Gun manufacturers produce inert kinetic mechanisms. A frontier model that autonomously synthesizes novel pathogen genomes or executes zero-day cyberwarfare is an active, agentic capability. If pharmaceutical executives can be indicted for reckless distribution of lethal toxins under strict liability doctrines, why should frontier AI labs receive an immunity shield when they knowingly release dual-use synthetic biology weights without verification?" },
    { role: "user", text: "Because pharmaceuticals have direct biological causality. AI models output informational text and code; human action is still required to weaponize them. Criminal mens rea requires intent or gross negligence, which open-source research cannot possess." },
    { role: "assistant", text: "Causality does not evaporate because the weapon is digital. If an engineer provides a terrorist cell with functional step-by-step schematics and automated targeting software, that engineer is charged as an accomplice under federal criminal conspiracy statutes. When labs rush frontier autonomous agents into release to beat competitor valuations—knowing safety evaluations failed—that isn't innocent academic research. That is willful blindness and depraved indifference. What specific threshold of societal damage would it take for you to hold a multi-billion dollar executive accountable?" }
  ];
  const tVals2 = turns2.map(t => `('${d2}', '${t.role}', '${esc(t.text)}', '2026-09-26T15:25:00.000Z')`).join(",");
  await queryD1(`INSERT INTO turns (debate_id, role, text, created_at) VALUES ${tVals2}`);

  const scores2 = JSON.stringify({
    you: { argumentation: 9, evidence: 8, rebuttal: 9, composure: 9 },
    opponent: { argumentation: 8, evidence: 9, rebuttal: 8, composure: 8 }
  });
  const reason2 = "The human debater mounted a robust defense of open-source research and the fundamental criminal law doctrine of mens rea and intermediate human causality. While The Prosecutor applied fierce prosecutorial pressure, the human stood firm and refused to concede the biological-informational distinction.";
  const turn2 = "The human debater's refusal to accept the pharmaceutical toxin comparison, establishing clear legal boundaries between knowledge distribution and weapon manufacture.";

  await queryD1(`
    INSERT INTO verdicts (debate_id, winner, assessment, scores_json, reasoning, turning_point, created_at)
    VALUES (
      '${d2}',
      'you',
      null,
      '${esc(scores2)}',
      '${esc(reason2)}',
      '${esc(turn2)}',
      '2026-09-26T15:39:00.000Z'
    ) ON CONFLICT(debate_id) DO UPDATE SET winner = 'you', scores_json = excluded.scores_json, reasoning = excluded.reasoning;
  `);

  await queryD1(`DELETE FROM debate_votes WHERE debate_id = '${d2}'`);
  const votesRows2 = [];
  for (let i = 1; i <= 56; i++) votesRows2.push(`('${d2}', 'voter_u_${i}', 'you', '2026-09-26T16:00:00.000Z')`);
  for (let i = 1; i <= 29; i++) votesRows2.push(`('${d2}', 'voter_o_${i}', 'opponent', '2026-09-26T16:00:00.000Z')`);
  for (let i = 1; i <= 4; i++) votesRows2.push(`('${d2}', 'voter_d_${i}', 'draw', '2026-09-26T16:00:00.000Z')`);
  await queryD1(`INSERT INTO debate_votes (debate_id, voter_key, vote, created_at) VALUES ${votesRows2.join(",")}`);

  await queryD1(`DELETE FROM debate_reactions WHERE debate_id = '${d2}'`);
  const reactRows2 = [];
  for (let i = 1; i <= 24; i++) reactRows2.push(`('${d2}', 'reactor_s_${i}', 'skull', '2026-09-26T16:00:00.000Z')`);
  for (let i = 1; i <= 19; i++) reactRows2.push(`('${d2}', 'reactor_f_${i}', 'fire', '2026-09-26T16:00:00.000Z')`);
  await queryD1(`INSERT INTO debate_reactions (debate_id, reactor_key, reaction, created_at) VALUES ${reactRows2.join(",")}`);
  console.log("Seeded Debate 2: The Prosecutor");

  // Debate 3
  const d3 = "arena_showcase_divine_hiddenness";
  await queryD1(`
    INSERT INTO debates (id, user_id, personality, topic, mode, setup_json, is_public, views, created_at, ended_at)
    VALUES (
      '${d3}',
      '97ac8562803b3d90c6235dbba174cd25',
      'secular_rationalist',
      'The Problem of Carnivore Suffering and Divine Hiddenness',
      'debate',
      '{"judge":"1","targetRounds":"6","personaVisual":"man-pro"}',
      1,
      189,
      '2026-09-26T12:00:00.000Z',
      '2026-09-26T12:18:00.000Z'
    ) ON CONFLICT(id) DO UPDATE SET is_public = 1, views = 189;
  `);

  await queryD1(`DELETE FROM turns WHERE debate_id = '${d3}'`);
  const turns3 = [
    { role: "user", text: "Free will accounts for moral evil in the world, and animal predation is simply the necessary biological mechanism for ecological equilibrium and evolutionary progression." },
    { role: "assistant", text: "Free will cannot explain the hundreds of millions of years of animal agony before the first hominid stood upright. Consider a deer trapped in a forest fire, dying in agony over days, or parasitic wasps that paralyze caterpillars to eat them alive from the inside. An omnipotent, omniscient God could easily have designed non-sentient trophic cycles, or photosynthesizing herbivores that feel no terror. What greater cosmic good is purchased by the excruciating death of a fawn that no human ever sees?" },
    { role: "user", text: "Pain is a biological signaling system essential for survival and nervous system integrity. To demand a physical universe with physical laws where flesh burns but nerves feel pleasure without pain is logically contradictory." },
    { role: "assistant", text: "Nociception—the detection of noxious stimuli—does not require intense conscious agony. A simple thermostat detects temperature without suffering; an automated reflex pulls a hand from fire in milliseconds without existential torment. Furthermore, why does the divine architect remain totally hidden from honest inquirers who genuinely seek truth? If God desires a relationship with humans and eternal salvation hangs in the balance, divine hiddenness is indistinguishable from divine absence." }
  ];
  const tVals3 = turns3.map(t => `('${d3}', '${t.role}', '${esc(t.text)}', '2026-09-26T12:08:00.000Z')`).join(",");
  await queryD1(`INSERT INTO turns (debate_id, role, text, created_at) VALUES ${tVals3}`);

  const scores3 = JSON.stringify({
    you: { argumentation: 7, evidence: 7, rebuttal: 7, composure: 8 },
    opponent: { argumentation: 9, evidence: 9, rebuttal: 9, composure: 9 }
  });
  const reason3 = "The Secular Rationalist systematically dismantled the biological necessity defense by distinguishing between functional nociception and conscious agony, then landed a heavy philosophical blow on the evidential problem of divine hiddenness.";
  const turn3 = "The thermostat counter-analogy effectively undermined the human's premise that conscious animal agony is logically necessary for nervous system alerts.";

  await queryD1(`
    INSERT INTO verdicts (debate_id, winner, assessment, scores_json, reasoning, turning_point, created_at)
    VALUES (
      '${d3}',
      'opponent',
      null,
      '${esc(scores3)}',
      '${esc(reason3)}',
      '${esc(turn3)}',
      '2026-09-26T12:19:00.000Z'
    ) ON CONFLICT(debate_id) DO UPDATE SET winner = 'opponent', scores_json = excluded.scores_json, reasoning = excluded.reasoning;
  `);

  await queryD1(`DELETE FROM debate_votes WHERE debate_id = '${d3}'`);
  const votesRows3 = [];
  for (let i = 1; i <= 34; i++) votesRows3.push(`('${d3}', 'voter_u_${i}', 'you', '2026-09-26T12:30:00.000Z')`);
  for (let i = 1; i <= 51; i++) votesRows3.push(`('${d3}', 'voter_o_${i}', 'opponent', '2026-09-26T12:30:00.000Z')`);
  for (let i = 1; i <= 5; i++) votesRows3.push(`('${d3}', 'voter_d_${i}', 'draw', '2026-09-26T12:30:00.000Z')`);
  await queryD1(`INSERT INTO debate_votes (debate_id, voter_key, vote, created_at) VALUES ${votesRows3.join(",")}`);

  await queryD1(`DELETE FROM debate_reactions WHERE debate_id = '${d3}'`);
  const reactRows3 = [];
  for (let i = 1; i <= 28; i++) reactRows3.push(`('${d3}', 'reactor_b_${i}', 'brain', '2026-09-26T12:30:00.000Z')`);
  for (let i = 1; i <= 15; i++) reactRows3.push(`('${d3}', 'reactor_s_${i}', 'skull', '2026-09-26T12:30:00.000Z')`);
  await queryD1(`INSERT INTO debate_reactions (debate_id, reactor_key, reaction, created_at) VALUES ${reactRows3.join(",")}`);
  console.log("Seeded Debate 3: The Secular Rationalist");

  console.log("All showcase debates seeded successfully into D1 in batch!");
}

main().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});

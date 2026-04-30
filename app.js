/* ===================== PARTICLES ===================== */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${p.alpha})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ===================== DIFFICULTY PILLS ===================== */
const pills = document.querySelectorAll('.pill');
const difficultyInput = document.getElementById('difficulty');

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pills.forEach(p => p.classList.remove('active', 'invalid-group'));
    pill.classList.add('active');
    difficultyInput.value = pill.dataset.value;
    hideError('difficulty');
  });
});

/* ===================== VALIDATION ===================== */
function showError(field) {
  document.getElementById(`error-${field}`).classList.add('show');
  const el = document.getElementById(field);
  if (el) el.classList.add('invalid');
}
function hideError(field) {
  document.getElementById(`error-${field}`).classList.remove('show');
  const el = document.getElementById(field);
  if (el) el.classList.remove('invalid');
}

function validateForm() {
  let valid = true;
  const subject = document.getElementById('subject').value.trim();
  const time = document.getElementById('time').value;
  const difficulty = difficultyInput.value;

  if (!subject) { showError('subject'); valid = false; } else hideError('subject');
  if (!time) { showError('time'); valid = false; } else hideError('time');
  if (!difficulty) {
    showError('difficulty');
    pills.forEach(p => p.classList.add('invalid-group'));
    valid = false;
  } else hideError('difficulty');

  return valid;
}

/* ===================== STUDY PLAN ENGINE ===================== */
function generatePlan(subject, totalMinutes, difficulty) {
  const blocks = [];
  let cursor = 0;

  function fmt(start, dur) {
    const toHHMM = m => {
      const h = Math.floor(m / 60), min = m % 60;
      return h > 0 ? `${h}h ${min > 0 ? min + 'm' : ''}`.trim() : `${min}m`;
    };
    return `${toHHMM(start)} – ${toHHMM(start + dur)}`;
  }

  function addBlock(type, emoji, title, desc, goal, dur) {
    blocks.push({ type, emoji, title, desc, goal, dur, stamp: fmt(cursor, dur) });
    cursor += dur;
  }

  const isBegin = difficulty === 'Beginner';
  const isAdv   = difficulty === 'Advanced';
  const breakDur = 5;

  /* ---- Orientation ---- */
  const orientDur = isBegin ? 15 : 10;
  if (totalMinutes >= 30) {
    addBlock('study', '🧭', 'Orientation & Goal Setting',
      `Review what you already know about "${subject}". Write down your learning objectives for this session.`,
      'Activate prior knowledge & set intent', orientDur);
    cursor = orientDur;
  }

  /* ---- Core blocks ---- */
  const remaining = totalMinutes - cursor;
  const breakEvery = isBegin ? 40 : isAdv ? 50 : 45;
  const blockSize  = isBegin ? 20 : isAdv ? 30 : 25;

  const studyBlocks = [
    {
      title: isBegin ? `Foundations of ${subject}` : isAdv ? `Deep Dive: Core Mechanisms` : `Core Concepts Overview`,
      desc:  isBegin
        ? `Study definitions, key terms, and basic principles. Use a textbook, video, or reliable notes.`
        : isAdv
        ? `Engage with advanced theory, edge cases, and underlying mechanisms of ${subject}.`
        : `Review central concepts and their relationships. Build a mind map if helpful.`,
      goal:  isBegin ? 'Build a solid foundation' : isAdv ? 'Develop depth of understanding' : 'Consolidate core knowledge'
    },
    {
      title: isBegin ? `Worked Examples` : isAdv ? `Problem-Solving Practice` : `Applied Practice`,
      desc:  isBegin
        ? `Walk through 2–3 solved examples step by step. Focus on the process, not just the answer.`
        : isAdv
        ? `Tackle challenging problems or case studies. Attempt independently before checking solutions.`
        : `Solve practice questions or apply concepts to real scenarios.`,
      goal:  isBegin ? 'Understand the process' : isAdv ? 'Sharpen analytical skills' : 'Reinforce with application'
    },
    {
      title: isBegin ? `Guided Practice` : isAdv ? `Critical Analysis & Synthesis` : `Deeper Exploration`,
      desc:  isBegin
        ? `Try simple exercises with your notes open. Check understanding after each one.`
        : isAdv
        ? `Compare approaches, evaluate trade-offs, and synthesize insights across sub-topics.`
        : `Go one level deeper — explore examples, counter-examples, and nuanced points.`,
      goal:  isBegin ? 'Apply with support' : isAdv ? 'Build expert perspective' : 'Extend comprehension'
    },
    {
      title: isBegin ? `Self-Check Quiz` : isAdv ? `Mock Assessment` : `Practice Test`,
      desc:  isBegin
        ? `Answer 5–10 basic questions from memory. Note any gaps without peeking at notes.`
        : isAdv
        ? `Complete a timed practice problem set or past exam questions under realistic conditions.`
        : `Work through a short quiz or problem set. Flag anything uncertain for review.`,
      goal:  isBegin ? 'Identify weak spots' : isAdv ? 'Simulate exam conditions' : 'Gauge retention'
    },
    {
      title: `Error Analysis & Gap Review`,
      desc:  `Go back over mistakes or areas of uncertainty from the previous block. Understand *why* errors occurred.`,
      goal:  'Convert weaknesses into strengths'
    }
  ];

  let blockIdx = 0;
  let timeSinceBreak = orientDur;

  while (cursor < totalMinutes - 5 && blockIdx < studyBlocks.length) {
    const dur = Math.min(blockSize, totalMinutes - cursor - (totalMinutes > 60 ? breakDur : 0));
    if (dur < 8) break;

    addBlock('study', ['📖','✏️','🔍','📝','🔄'][blockIdx % 5],
      studyBlocks[blockIdx].title,
      studyBlocks[blockIdx].desc,
      studyBlocks[blockIdx].goal,
      dur);

    timeSinceBreak += dur;
    blockIdx++;

    /* Insert break if needed */
    if (timeSinceBreak >= breakEvery && cursor < totalMinutes - 10) {
      addBlock('break', '☕', 'Active Break',
        'Step away from the screen. Hydrate, stretch, or take a short walk. Avoid social media.',
        'Reset focus & reduce fatigue', breakDur);
      timeSinceBreak = 0;
    }
  }

  /* ---- Wrap-up ---- */
  const wrapDur = Math.min(10, totalMinutes - cursor);
  if (wrapDur >= 5) {
    addBlock('wrap', '🏁', 'Wrap-Up & Review',
      `Summarise what you learned in 3–5 sentences. Update your notes and plan your next session.`,
      'Consolidate memory & close the loop', wrapDur);
  }

  return blocks;
}

/* ---- Key Focus Areas ---- */
function getFocusAreas(subject, difficulty) {
  const isBegin = difficulty === 'Beginner';
  const isAdv   = difficulty === 'Advanced';

  const generic = [
    isBegin ? `Core terminology and definitions in ${subject}` : isAdv ? `Advanced mechanisms and edge cases in ${subject}` : `Central principles of ${subject}`,
    isBegin ? `Understanding basic examples and their logic` : isAdv ? `Problem-solving strategies and frameworks` : `Applying concepts to varied examples`,
    isBegin ? `Identifying common beginner misconceptions` : isAdv ? `Synthesising knowledge across sub-topics` : `Spotting patterns and relationships`,
    isBegin ? `Building a foundation for further study` : isAdv ? `Performance under exam or real-world conditions` : `Reviewing and correcting misunderstandings`,
    isAdv ? `Evaluating trade-offs and alternative approaches` : `Self-testing and active recall practice`
  ];
  return generic.slice(0, 5);
}

/* ---- Study Tips ---- */
function getStudyTips(totalMinutes, difficulty) {
  const isBegin = difficulty === 'Beginner';
  const isAdv   = difficulty === 'Advanced';
  const isShort = totalMinutes <= 60;

  const tips = [
    {
      icon: '🧠',
      text: isBegin
        ? `<strong>Active recall over re-reading:</strong> After each block, close your notes and write down everything you remember.`
        : isAdv
        ? `<strong>Interleaved practice:</strong> Mix problem types within a block to simulate real exam unpredictability.`
        : `<strong>Spaced repetition:</strong> Don't cram — review key ideas at increasing intervals across sessions.`
    },
    {
      icon: '🎯',
      text: isShort
        ? `<strong>Single-topic focus:</strong> With limited time, resist the urge to cover multiple topics — depth beats breadth.`
        : `<strong>Pomodoro pacing:</strong> Work in focused 25–30 min bursts. The scheduled breaks in this plan are non-optional.`
    },
    {
      icon: '📵',
      text: `<strong>Eliminate distractions:</strong> Put your phone in another room. Use a website blocker (e.g., Cold Turkey) for this session.`
    },
    {
      icon: isAdv ? '📊' : '✍️',
      text: isAdv
        ? `<strong>Teach-back method:</strong> After each block, explain the concept aloud as if teaching a student. Gaps become obvious.`
        : `<strong>Handwrite summaries:</strong> Writing by hand boosts encoding. Summarise each block in ≤5 bullet points after completing it.`
    }
  ];
  return tips;
}

/* ===================== RENDER PLAN ===================== */
function renderPlan(subject, totalMinutes, difficulty) {
  const blocks  = generatePlan(subject, totalMinutes, difficulty);
  const focuses = getFocusAreas(subject, difficulty);
  const tips    = getStudyTips(totalMinutes, difficulty);

  /* Meta chips */
  document.getElementById('meta-subject-chip').textContent = `📚 ${subject}`;
  document.getElementById('meta-time-chip').textContent = `⏱ ${totalMinutes} min`;
  document.getElementById('meta-difficulty-chip').textContent =
    `${ {Beginner:'🌱',Intermediate:'🔥',Advanced:'🚀'}[difficulty] } ${difficulty}`;

  document.getElementById('plan-summary-text').textContent =
    `${blocks.length} blocks · ${totalMinutes} minutes · ${difficulty} level`;

  /* Timeline */
  const tl = document.getElementById('timeline-blocks');
  tl.innerHTML = '';
  blocks.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'timeline-block';
    div.style.animationDelay = `${i * 0.07}s`;
    div.innerHTML = `
      <div class="tl-dot type-${b.type}">${b.emoji}</div>
      <div class="tl-content">
        <div class="tl-stamp">${b.stamp}</div>
        <div class="tl-title">${b.title}</div>
        <div class="tl-desc">${b.desc}</div>
        <span class="tl-goal">🎯 ${b.goal}</span>
      </div>`;
    tl.appendChild(div);
  });

  /* Focus Areas */
  const fl = document.getElementById('focus-list');
  fl.innerHTML = '';
  focuses.forEach((f, i) => {
    const li = document.createElement('li');
    li.style.animationDelay = `${i * 0.08}s`;
    li.innerHTML = `<span class="focus-num">${i + 1}</span><span>${f}</span>`;
    fl.appendChild(li);
  });

  /* Tips */
  const tpList = document.getElementById('tips-list');
  tpList.innerHTML = '';
  tips.forEach((t, i) => {
    const li = document.createElement('li');
    li.style.animationDelay = `${i * 0.08}s`;
    li.innerHTML = `<span class="tip-icon">${t.icon}</span><span class="tip-text">${t.text}</span>`;
    tpList.appendChild(li);
  });

  /* Progress Tracker */
  const tracker = document.getElementById('progress-tracker');
  tracker.innerHTML = '';
  const studyOnly = blocks.filter(b => b.type !== 'break');
  studyOnly.forEach((b, i) => {
    const item = document.createElement('div');
    item.className = 'progress-item';
    item.id = `pitem-${i}`;
    item.innerHTML = `
      <div class="progress-check" id="pcheck-${i}"></div>
      <span class="progress-item-label">${b.emoji} ${b.title}</span>
      <span class="progress-item-time">${b.stamp}</span>`;
    item.addEventListener('click', () => toggleProgress(i, studyOnly.length));
    tracker.appendChild(item);
  });
  updateProgressBar(0, studyOnly.length);
}

let checkedItems = new Set();

function toggleProgress(idx, total) {
  const item = document.getElementById(`pitem-${idx}`);
  if (checkedItems.has(idx)) {
    checkedItems.delete(idx);
    item.classList.remove('checked');
    document.getElementById(`pcheck-${idx}`).textContent = '';
  } else {
    checkedItems.add(idx);
    item.classList.add('checked');
    document.getElementById(`pcheck-${idx}`).textContent = '✓';
  }
  updateProgressBar(checkedItems.size, total);
}

function updateProgressBar(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-bar-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${pct}% Complete`;
}

/* ===================== LOADING ANIMATION ===================== */
function runLoadingSequence(cb) {
  const steps = ['lstep-1','lstep-2','lstep-3','lstep-4'];
  let i = 0;
  steps.forEach(s => {
    document.getElementById(s).className = 'loading-step';
  });
  document.getElementById(steps[0]).classList.add('active');

  const iv = setInterval(() => {
    if (i < steps.length) {
      if (i > 0) document.getElementById(steps[i-1]).classList.replace('active','done');
      if (i < steps.length) document.getElementById(steps[i]).classList.add('active');
      i++;
    } else {
      clearInterval(iv);
      steps.forEach(s => document.getElementById(s).classList.replace('active','done'));
      setTimeout(cb, 300);
    }
  }, 400);
}

/* ===================== FORM SUBMIT ===================== */
document.getElementById('study-form').addEventListener('submit', function(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const subject    = document.getElementById('subject').value.trim();
  const totalMin   = parseInt(document.getElementById('time').value, 10);
  const difficulty = difficultyInput.value;

  /* Reset */
  checkedItems.clear();
  document.getElementById('result-content').classList.add('hidden');

  /* Show loader */
  const loader = document.getElementById('loading-card');
  const outSec = document.getElementById('output-section');
  loader.classList.add('show');
  outSec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* Disable button */
  const btn = document.getElementById('btn-generate');
  btn.disabled = true;

  runLoadingSequence(() => {
    renderPlan(subject, totalMin, difficulty);
    loader.classList.remove('show');
    document.getElementById('result-content').classList.remove('hidden');
    btn.disabled = false;
    document.getElementById('result-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ===================== RESET ===================== */
document.getElementById('btn-reset').addEventListener('click', () => {
  document.getElementById('result-content').classList.add('hidden');
  document.getElementById('loading-card').classList.remove('show');
  document.getElementById('study-form').reset();
  difficultyInput.value = '';
  pills.forEach(p => p.classList.remove('active'));
  checkedItems.clear();
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ===================== COPY TO CLIPBOARD ===================== */
document.getElementById('btn-copy').addEventListener('click', () => {
  const subject    = document.getElementById('meta-subject-chip').textContent;
  const time       = document.getElementById('meta-time-chip').textContent;
  const diff       = document.getElementById('meta-difficulty-chip').textContent;

  let text = `📘 STUDY PLAN\n${subject} | ${time} | ${diff}\n\n`;

  /* Timeline blocks */
  document.querySelectorAll('.timeline-block').forEach(block => {
    const stamp = block.querySelector('.tl-stamp')?.textContent || '';
    const title = block.querySelector('.tl-title')?.textContent || '';
    const desc  = block.querySelector('.tl-desc')?.textContent || '';
    const goal  = block.querySelector('.tl-goal')?.textContent || '';
    text += `[${stamp}] ${title}\n  ${desc}\n  ${goal}\n\n`;
  });

  /* Focus areas */
  text += '\n🎯 KEY FOCUS AREAS\n';
  document.querySelectorAll('.focus-list li').forEach(li => {
    text += `  • ${li.textContent.trim()}\n`;
  });

  /* Tips */
  text += '\n⚡ STUDY TIPS\n';
  document.querySelectorAll('.tips-list li').forEach(li => {
    text += `  • ${li.textContent.trim()}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
  });
});

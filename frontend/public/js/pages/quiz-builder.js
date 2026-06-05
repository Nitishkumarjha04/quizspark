let builderQuiz = {
  title: '', description: '', topic: 'general', difficulty: 'medium',
  isPublic: true, questions: []
};
let activeQIndex = -1;

async function renderQuizBuilder({ id } = {}) {
  if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }

  if (id) {
    try {
      const data = await API.quiz.get(id);
      builderQuiz = { ...data.quiz };
    } catch (err) { Toast.error(err.message); Router.navigate('/dashboard'); return; }
  } else {
    builderQuiz = { title:'', description:'', topic:'general', difficulty:'medium', isPublic:true, questions:[] };
  }

  const isEdit = !!id;
  document.getElementById('view').innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">${isEdit ? 'Edit quiz' : 'Create quiz'}</h1>
          <p class="page-sub">${isEdit ? 'Update your quiz details and questions' : 'Build your quiz — add questions below'}</p>
        </div>
        <div style="display:flex;gap:10px;">
          <a href="/dashboard" class="btn-outline" data-link>Cancel</a>
          <button class="btn-primary" id="save-quiz-btn">💾 Save quiz</button>
        </div>
      </div>

      <div class="builder-layout">
        <!-- LEFT: Settings + Question editor -->
        <div>
          <!-- Meta -->
          <div class="card" style="margin-bottom:20px;">
            <div class="section-title">Quiz settings</div>
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input id="b-title" class="form-input" placeholder="My awesome quiz" value="${escapeHtml(builderQuiz.title)}">
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea id="b-desc" class="form-textarea" placeholder="Optional description…">${escapeHtml(builderQuiz.description||'')}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Topic</label>
                <select id="b-topic" class="form-select">
                  ${Object.keys(TOPIC_ICONS).map(t => `<option value="${t}" ${builderQuiz.topic===t?'selected':''}>${TOPIC_ICONS[t]} ${t}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Difficulty</label>
                <select id="b-diff" class="form-select">
                  ${['easy','medium','hard'].map(d => `<option value="${d}" ${builderQuiz.difficulty===d?'selected':''}>${d}</option>`).join('')}
                </select>
              </div>
            </div>
            <div style="margin-top:14px;display:flex;align-items:center;gap:10px;">
              <input type="checkbox" id="b-public" ${builderQuiz.isPublic?'checked':''} style="width:16px;height:16px;accent-color:var(--accent);">
              <label for="b-public" style="font-size:14px;cursor:pointer;">Make quiz public</label>
            </div>
          </div>

          <!-- Question Editor -->
          <div class="card" id="question-editor">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
              <div class="section-title" style="margin-bottom:0;" id="editor-title">Select or add a question</div>
            </div>
            <div id="editor-content">
              <div class="empty-state" style="padding:30px 0;">
                <p>Add a question using the panel on the right →</p>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Question list -->
        <div>
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div class="section-title" style="margin-bottom:0;">Questions (<span id="q-count">${builderQuiz.questions.length}</span>)</div>
              <button class="btn-primary" style="padding:7px 14px;font-size:13px;" onclick="addQuestion()">+ Add</button>
            </div>
            <div id="q-list" class="question-list"></div>
          </div>
        </div>
      </div>
    </div>`;

  renderQList();

  document.getElementById('save-quiz-btn').addEventListener('click', () => saveQuiz(id));
  ['b-title','b-desc','b-topic','b-diff','b-public'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', syncMeta);
    el.addEventListener('input', syncMeta);
  });

  if (builderQuiz.questions.length) selectQuestion(0);
}

function syncMeta() {
  builderQuiz.title       = document.getElementById('b-title').value;
  builderQuiz.description = document.getElementById('b-desc').value;
  builderQuiz.topic       = document.getElementById('b-topic').value;
  builderQuiz.difficulty  = document.getElementById('b-diff').value;
  builderQuiz.isPublic    = document.getElementById('b-public').checked;
}

function renderQList() {
  const el = document.getElementById('q-list');
  document.getElementById('q-count').textContent = builderQuiz.questions.length;
  if (!builderQuiz.questions.length) {
    el.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:14px;padding:20px 0;">No questions yet</div>`;
    return;
  }
  el.innerHTML = builderQuiz.questions.map((q, i) => `
    <div class="question-item ${activeQIndex===i?'active':''}" onclick="selectQuestion(${i})">
      <div class="question-item-header">
        <div class="q-num">${i+1}</div>
        <div class="q-text">${q.text ? escapeHtml(q.text.substring(0,50))+(q.text.length>50?'…':'') : '<em style="color:var(--muted)">Untitled</em>'}</div>
        <div class="q-actions">
          <button onclick="event.stopPropagation();moveQuestion(${i},-1)" title="Move up" ${i===0?'disabled':''}>↑</button>
          <button onclick="event.stopPropagation();moveQuestion(${i},1)" title="Move down" ${i===builderQuiz.questions.length-1?'disabled':''}>↓</button>
          <button onclick="event.stopPropagation();removeQuestion(${i})" title="Delete">✕</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);">${q.options?.length||0} options · ${q.timeLimit||15}s · ${q.points||100}pts</div>
    </div>`).join('');
}

function selectQuestion(i) {
  activeQIndex = i;
  renderQList();
  renderQEditor(i);
}

function renderQEditor(i) {
  const q = builderQuiz.questions[i];
  document.getElementById('editor-title').textContent = `Question ${i+1}`;
  document.getElementById('editor-content').innerHTML = `
    <div class="form-group">
      <label class="form-label">Question text *</label>
      <textarea id="q-text" class="form-textarea" rows="3" placeholder="Enter your question…">${escapeHtml(q.text||'')}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Time limit (seconds)</label>
        <input id="q-time" class="form-input" type="number" min="5" max="120" value="${q.timeLimit||15}">
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Points</label>
        <input id="q-pts" class="form-input" type="number" min="10" max="1000" step="10" value="${q.points||100}">
      </div>
    </div>
    <div class="section-title">Answer options <span style="font-weight:400;color:var(--muted)">(click circle to mark correct)</span></div>
    <div id="options-editor"></div>
    <button class="btn-ghost" style="font-size:13px;margin-top:8px;" onclick="addOption(${i})">+ Add option</button>
    <div class="divider"></div>
    <div class="form-group" style="margin-bottom:0;">
      <label class="form-label">Explanation (shown after answer)</label>
      <input id="q-expl" class="form-input" placeholder="Optional…" value="${escapeHtml(q.explanation||'')}">
    </div>`;

  renderOptionsEditor(i);

  ['q-text','q-time','q-pts','q-expl'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => syncQuestion(i));
  });
}

function renderOptionsEditor(i) {
  const q = builderQuiz.questions[i];
  const el = document.getElementById('options-editor');
  if (!el) return;
  const letters = ['A','B','C','D','E','F'];
  el.innerHTML = (q.options||[]).map((opt, j) => `
    <div class="option-input-row">
      <div class="option-radio ${q.correctIndex===j?'correct':''}" onclick="setCorrect(${i},${j})" title="Set as correct"></div>
      <input class="form-input opt-input" placeholder="Option ${letters[j]}" value="${escapeHtml(opt)}"
        data-opt="${j}" oninput="syncOptionText(${i},${j},this.value)">
      ${q.options.length > 2 ? `<button onclick="removeOption(${i},${j})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:4px;">✕</button>` : ''}
    </div>`).join('');
}

function syncQuestion(i) {
  const q = builderQuiz.questions[i];
  q.text        = document.getElementById('q-text')?.value || '';
  q.timeLimit   = parseInt(document.getElementById('q-time')?.value) || 15;
  q.points      = parseInt(document.getElementById('q-pts')?.value)  || 100;
  q.explanation = document.getElementById('q-expl')?.value || '';
  renderQList();
}

function syncOptionText(qi, oi, val) {
  builderQuiz.questions[qi].options[oi] = val;
}

function setCorrect(qi, oi) {
  builderQuiz.questions[qi].correctIndex = oi;
  renderOptionsEditor(qi);
}

function addOption(qi) {
  const q = builderQuiz.questions[qi];
  if (q.options.length >= 6) { Toast.info('Max 6 options'); return; }
  q.options.push('');
  renderOptionsEditor(qi);
}

function removeOption(qi, oi) {
  const q = builderQuiz.questions[qi];
  if (q.options.length <= 2) { Toast.info('Need at least 2 options'); return; }
  q.options.splice(oi, 1);
  if (q.correctIndex >= q.options.length) q.correctIndex = 0;
  renderOptionsEditor(qi);
}

function addQuestion() {
  builderQuiz.questions.push({ text:'', options:['','','',''], correctIndex:0, timeLimit:15, points:100, explanation:'' });
  const idx = builderQuiz.questions.length - 1;
  selectQuestion(idx);
  renderQList();
}

function removeQuestion(i) {
  builderQuiz.questions.splice(i, 1);
  activeQIndex = Math.min(activeQIndex, builderQuiz.questions.length - 1);
  renderQList();
  if (builderQuiz.questions.length) selectQuestion(activeQIndex < 0 ? 0 : activeQIndex);
  else document.getElementById('editor-content').innerHTML = `<div class="empty-state" style="padding:30px 0;"><p>Add a question →</p></div>`;
}

function moveQuestion(i, dir) {
  const arr = builderQuiz.questions;
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  activeQIndex = j;
  renderQList();
  renderQEditor(j);
}

async function saveQuiz(existingId) {
  syncMeta();
  if (!builderQuiz.title.trim()) { Toast.error('Quiz needs a title'); return; }
  if (!builderQuiz.questions.length) { Toast.error('Add at least one question'); return; }

  for (let i = 0; i < builderQuiz.questions.length; i++) {
    const q = builderQuiz.questions[i];
    if (!q.text.trim()) { Toast.error(`Question ${i+1} has no text`); selectQuestion(i); return; }
    if (q.options.some(o => !o.trim())) { Toast.error(`Question ${i+1} has an empty option`); selectQuestion(i); return; }
  }

  const btn = document.getElementById('save-quiz-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    if (existingId) {
      await API.quiz.update(existingId, builderQuiz);
    } else {
      await API.quiz.create(builderQuiz);
    }
    Toast.success('Quiz saved!');
    Router.navigate('/dashboard');
  } catch (err) {
    Toast.error(err.message);
    btn.disabled = false; btn.textContent = '💾 Save quiz';
  }
}

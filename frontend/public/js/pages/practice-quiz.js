async function renderPracticeQuiz({ id }) {

  document.getElementById('view').innerHTML =
    '<div class="spinner"></div>';

  try {

    const data = await API.quiz.get(id);

    const quiz = data.quiz;

    document.getElementById('view').innerHTML = `
      <div class="page-sm">

        <div class="card" style="text-align:center;">

          <h1>${escapeHtml(quiz.title)}</h1>

          <p>
            ${quiz.questions.length} Questions
          </p>

          <input
            id="practice-name"
            class="form-input"
            placeholder="Enter your name"
            style="margin-top:20px;"
          >

          <button
            id="start-practice-btn"
            class="btn-primary"
            style="margin-top:16px;"
          >
            Start Quiz
          </button>

        </div>

      </div>
    `;
       
    document.getElementById('start-practice-btn')
    .addEventListener('click', () => {

    const playerName =
      document.getElementById('practice-name')
      .value
      .trim();

    if (!playerName) {
      Toast.error('Please enter your name');
      return;
    }

    let currentQuestion = 0;
      let score = 0;
      let answers = [];
     showQuestion();
     function showQuestion() {

  const q = quiz.questions[currentQuestion];

  document.getElementById('view').innerHTML = `
    <div class="page-sm">

      <div class="card">

        <h2>
          Question ${currentQuestion + 1}
          of
          ${quiz.questions.length}
        </h2>

        <h3 style="margin:20px 0;">
          ${escapeHtml(q.text)}
        </h3>

        <div style="
          display:flex;
          flex-direction:column;
          gap:10px;
        ">

          ${q.options.map((option, index) => `
            <button
              class="btn-outline answer-btn"
              data-index="${index}"
            >
              ${escapeHtml(option)}
            </button>
          `).join('')}

        </div>

      </div>

    </div>
  `;

  document.querySelectorAll('.answer-btn')
    .forEach(btn => {

      btn.addEventListener('click', () => {

        const selected =
          Number(btn.dataset.index);

        answers.push({
          questionIndex: currentQuestion,
          selectedIndex: selected,
          correct: selected === q.correctIndex
        });

        if (selected === q.correctIndex) {
          score += q.points;
        }

       document.querySelectorAll('.answer-btn')
  .forEach(b => b.disabled = true);

if (selected === q.correctIndex) {

  btn.style.borderColor = '#00e5a0';
  btn.style.background = 'rgba(0,229,160,0.15)';

} else {

  btn.style.borderColor = '#ff4d4f';
  btn.style.background = 'rgba(255,77,79,0.15)';

  const correctBtn =
    document.querySelector(
      `[data-index="${q.correctIndex}"]`
    );

  if (correctBtn) {
    correctBtn.style.borderColor = '#00e5a0';
    correctBtn.style.background = 'rgba(0,229,160,0.15)';
  }

}

const nextBtn = document.createElement('button');

nextBtn.className = 'btn-primary';
nextBtn.style.marginTop = '20px';

nextBtn.textContent =
  currentQuestion === quiz.questions.length - 1
    ? 'Finish Quiz'
    : 'Next Question';

nextBtn.onclick = () => {

  currentQuestion++;

  if (currentQuestion < quiz.questions.length) {

    showQuestion();

  } else {
     const correctAnswers =
  answers.filter(a => a.correct).length;

   API.quiz.submitAttempt(id, {
  playerName,
  score,
  correctAnswers,
  totalQuestions: quiz.questions.length,
  answers
   })
  .then(() => {
  console.log('Attempt saved');
})
.catch(err => {
  console.error('Save failed', err);
});

document.getElementById('view').innerHTML = `
      <div class="page-sm">

        <div class="card" style="text-align:center;">

          <h1>🎉 Quiz Complete</h1>

          <h2>Score: ${score}</h2>

          <p>
            ${answers.filter(a => a.correct).length}
            /
            ${quiz.questions.length}
            correct
          </p>

        </div>

      </div>
    `;

  }

};

document.querySelector('.card')
  .appendChild(nextBtn);

      });

    });

}
    document.getElementById('view').innerHTML = `
      <div class="page-sm">

        <div class="card">

          <h2>
            Question 1 of ${quiz.questions.length}
          </h2>

          <h3 style="margin:20px 0;">
            ${escapeHtml(firstQuestion.text)}
          </h3>

          <div style="
            display:flex;
            flex-direction:column;
            gap:10px;
          ">

            ${firstQuestion.options.map((option, index) => `
              <button
                class="btn-outline"
                onclick="alert('You selected: ${escapeHtml(option)}')"
              >
                ${escapeHtml(option)}
              </button>
            `).join('')}

          </div>

        </div>

      </div>
    `;

  });
  } catch (err) {

    document.getElementById('view').innerHTML =
      `<div class="empty-state">${err.message}</div>`;

  }
}
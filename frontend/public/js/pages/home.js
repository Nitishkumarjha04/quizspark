function renderHome() {
  const user = Auth.getUser();
  document.getElementById('view').innerHTML = `
    <div style="min-height:calc(100vh - 60px); display:flex; flex-direction:column;">
      <!-- Hero -->
      <section style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 24px 60px; text-align:center;">
        <div style="font-size:12px; letter-spacing:0.15em; text-transform:uppercase; color:var(--accent); font-weight:600; margin-bottom:20px;">⚡ QuizSpark — Live Quiz Platform</div>
        <h1 style="font-family:'Syne',sans-serif; font-size:clamp(42px,8vw,72px); font-weight:800; line-height:1.05; margin-bottom:18px; max-width:800px;">
          Build, host &amp; play<br>
          <span style="background:linear-gradient(90deg,var(--accent),var(--accent2)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">live quizzes</span>
        </h1>
        <p style="color:var(--muted); font-size:18px; max-width:520px; line-height:1.7; margin-bottom:36px;">
          Create quizzes in minutes, share a room code, and compete in real-time with friends, students, or colleagues.
        </p>
        <div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center; margin-bottom:60px;">
          ${user
            ? `<a href="/quiz/new" class="btn-primary" data-link style="font-size:16px; padding:14px 28px;">+ Create a quiz</a>
               <a href="/join" class="btn-outline" data-link style="font-size:16px; padding:14px 28px;">Join a room →</a>`
            : `<a href="/register" class="btn-primary" data-link style="font-size:16px; padding:14px 28px;">Get started free</a>
               <a href="/join" class="btn-outline" data-link style="font-size:16px; padding:14px 28px;">Join a room →</a>`
          }
        </div>

        <!-- Feature pills -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          ${['⚡ Real-time rooms','🏆 Live leaderboard','📝 Custom questions','🎯 Multiple topics','⏱ Timed questions','📊 Stats & results'].map(f =>
            `<span class="chip">${f}</span>`).join('')}
        </div>
      </section>

      <!-- How it works -->
      <section style="padding:60px 24px; max-width:1000px; margin:0 auto; width:100%;">
        <div class="section-title text-center" style="margin-bottom:32px;">How it works</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px;">
          ${[
            ['1','Create','Build your quiz with custom questions, options, timers and point values.'],
            ['2','Share','Get a 6-digit room code. Share it with players instantly.'],
            ['3','Play','Everyone joins from any device — no app needed.'],
            ['4','Win','Watch the live leaderboard update after every question.'],
          ].map(([n,t,d]) => `
            <div class="card" style="text-align:center;">
              <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-family:'Syne',sans-serif;font-weight:800;color:#fff;">${n}</div>
              <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:6px;">${t}</div>
              <div style="font-size:14px;color:var(--muted);">${d}</div>
            </div>`).join('')}
        </div>
      </section>
    </div>`;
}

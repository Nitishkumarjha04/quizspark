(async () => {
  await Auth.restore();

  Router.define('/',                renderHome);
  Router.define('/login',           renderLogin);
  Router.define('/register',        renderRegister);
  Router.define('/explore',         renderExplore);
  Router.define('/dashboard',       renderDashboard);
  Router.define('/join',            renderRoomJoin);
  Router.define('/quiz/new',        () => renderQuizBuilder());
  Router.define('/quiz/:id',        ({ id }) => renderQuizPreview({ id }));
  Router.define('/quiz/:id/edit',   ({ id }) => renderQuizBuilder({ id }));
  Router.define('/room/:code/host', ({ code }) => renderRoomHost({ code }));
  Router.define('/room/:code/play', ({ code }) => renderRoomPlayer({ code }));
  Router.define('/room/:code/results', ({ code }) => renderResults({ code }));

  Router.init();

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Auth.clearSession();
    Toast.info('Logged out');
    Router.navigate('/');
  });

  // Fix player socket answer ack — attach once after socket created
  const origRenderPlayer = renderRoomPlayer;
  window.renderRoomPlayer = function(params) {
    origRenderPlayer(params);
    setTimeout(setupPlayerAnswerAck, 500);
  };
})();

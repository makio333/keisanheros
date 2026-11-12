import { TITLE_RELEASE_INFO, formatPublishedAtJst, validateTitleReleaseInfo } from './title_release_info.js';

function appendReleaseNotes(container, info) {
  const currentDate = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(info.publishedAtUtc));

  for (const [index, release] of info.history.entries()) {
    const section = document.createElement('section');
    section.className = 'title-patch-notes-release';
    const heading = document.createElement('h3');
    heading.textContent = index === 0 ? `${currentDate}・${release.label}` : release.label;
    section.append(heading);

    const list = document.createElement('ul');
    for (const item of release.items) {
      const note = document.createElement('li');
      note.textContent = item;
      list.append(note);
    }
    section.append(list);
    container.append(section);
  }
}

export function initTitleReleaseNotes(documentRef = document) {
  validateTitleReleaseInfo();
  const version = documentRef.getElementById('title-version');
  const openButton = documentRef.getElementById('btn-title-patch-notes');
  const dialog = documentRef.getElementById('title-patch-notes-dialog');
  const closeButton = documentRef.getElementById('btn-title-patch-notes-close');
  const content = documentRef.getElementById('title-patch-notes-content');
  const build = documentRef.getElementById('title-patch-notes-build');
  const published = documentRef.getElementById('title-patch-notes-published');
  const hosting = documentRef.getElementById('title-patch-notes-hosting');
  if (![version, openButton, dialog, closeButton, content, build, published, hosting].every(Boolean)) {
    throw new Error('Title release notes UI is incomplete.');
  }

  version.textContent = `Ver. ${TITLE_RELEASE_INFO.version}`;
  version.setAttribute('aria-label', `バージョン ${TITLE_RELEASE_INFO.version}`);
  openButton.setAttribute('aria-expanded', 'false');
  content.replaceChildren();
  appendReleaseNotes(content, TITLE_RELEASE_INFO);
  build.textContent = `ビルド: ${TITLE_RELEASE_INFO.buildId}`;
  published.textContent = `公開日時: ${formatPublishedAtJst()}`;
  hosting.textContent = `Hosting ID: ${TITLE_RELEASE_INFO.hostingReleaseId}`;

  let returnFocus = null;
  const closeDialog = () => {
    if (dialog.open) dialog.close();
  };
  openButton.addEventListener('click', () => {
    if (dialog.open) return;
    returnFocus = documentRef.activeElement;
    content.scrollTop = 0;
    dialog.showModal();
    openButton.setAttribute('aria-expanded', 'true');
    closeButton.focus({ preventScroll: true });
  });
  closeButton.addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    openButton.setAttribute('aria-expanded', 'false');
    const target = returnFocus?.isConnected ? returnFocus : openButton;
    returnFocus = null;
    target.focus({ preventScroll: true });
  });
}

initTitleReleaseNotes();

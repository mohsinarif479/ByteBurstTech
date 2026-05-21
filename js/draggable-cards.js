const draggableCards = document.querySelectorAll('.draggable-card');

draggableCards.forEach((card) => {
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  function updateTransform() {
    card.style.setProperty('--drag-x', `${offsetX}px`);
    card.style.setProperty('--drag-y', `${offsetY}px`);
  }

  card.addEventListener('pointerdown', (event) => {
    dragging = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
    card.setPointerCapture(event.pointerId);
    card.classList.add('is-dragging');
  });

  card.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;
    updateTransform();
  });

  function stopDragging(event) {
    if (!dragging) return;
    dragging = false;
    card.releasePointerCapture(event.pointerId);
    card.classList.remove('is-dragging');
  }

  card.addEventListener('pointerup', stopDragging);
  card.addEventListener('pointercancel', stopDragging);

  card.addEventListener('dblclick', () => {
    offsetX = 0;
    offsetY = 0;
    updateTransform();
  });
});

export const dieRollSound = new Audio(
  import.meta.env.BASE_URL + "die-roll.mp3",
);
export const messageReceivedSound = new Audio(
  import.meta.env.BASE_URL + "message.mp3",
);

function loadAudio() {
  dieRollSound.load();
  messageReceivedSound.load();

  document.removeEventListener("click", loadAudio);
}

document.addEventListener("click", loadAudio);


var images = document.querySelectorAll("#slideshow img");
var currentIndex = 0;

function showImage() {
  // Ascunde toate imaginile
  for (var i = 0; i < images.length; i++) {
    images[i].classList.remove("active");
  }

  // Afișează imaginea curentă
  images[currentIndex].classList.add("active");

  // Incrementați indexul imaginii curente
  currentIndex++;

  // Verificați dacă ați ajuns la ultima imagine și resetați indexul la 0
  if (currentIndex === images.length) {
    currentIndex = 0;
  }
}

// Apelează funcția showImage pentru a afișa prima imagine
showImage();

// Apelează funcția showImage la fiecare 10 secunde
setInterval(showImage, 3000);


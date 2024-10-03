import './style.css';

document.addEventListener("DOMContentLoaded", () => {
  let quizData = []; // Cambiamos esto a una variable global para usar después
  let currentQuestionIndex = 0;
  let score = 0;
  let timerInterval;
  const userAnswers = [];

  const questionNumberElement = document.getElementById("question-number");
  const questionTextElement = document.getElementById("question-text");
  const optionsContainer = document.querySelector(".options");
  const nextButton = document.getElementById("next-button");
  const timerElement = document.getElementById("timer");
  const scoreElement = document.getElementById("score");
  const progressBar = document.getElementById("progress-bar");
  const scoreboardContainer = document.getElementById("scoreboard-container");
  const scoreboardBody = document.querySelector("#scoreboard tbody");
  const restartButton = document.getElementById("restart-button");
  const popupModal = document.getElementById("popup-modal");
  const popupContent = document.getElementById("popup-content");
  const popupButton = document.getElementById("popup-button");
  const questionText = document.querySelector(".question-text2");


  // Función para cargar los datos del quiz desde un archivo JSON
  async function loadQuizData() {
    try {
      const response = await fetch('/data.json'); // Ajusta la ruta según sea necesario
      if (!response.ok) {
        throw new Error('Error al cargar los datos del quiz');
      }
      quizData = await response.json();
      initializeQuiz(); // Inicia el quiz después de cargar los datos
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Función para guardar el progreso en localStorage
  function saveProgress() {
    localStorage.setItem(
      "quizProgress",
      JSON.stringify({
        currentQuestionIndex,
        score,
        userAnswers
      })
    );
  }

  // Función para recuperar el progreso de localStorage
  function retrieveProgress() {
    const savedProgress = localStorage.getItem("quizProgress");
    if (savedProgress) {
      const {
        currentQuestionIndex: savedIndex,
        score: savedScore,
        userAnswers: savedAnswers
      } = JSON.parse(savedProgress);
      if (savedIndex < quizData.length) {
        currentQuestionIndex = savedIndex;
        score = savedScore;
        userAnswers.push(...savedAnswers);
        loadQuestion();
      } else {
        displayResults();
      }
    } else {
      initializeQuiz();
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function initializeQuiz() {
    shuffleArray(quizData);
    loadQuestion();
  }

  function loadQuestion() {
    const currentQuestion = quizData[currentQuestionIndex];
    questionNumberElement.textContent = `${currentQuestionIndex + 1}/${
      quizData.length
    }`;
    questionTextElement.textContent = currentQuestion.question;

    optionsContainer.innerHTML = "";
    const shuffledOptions = shuffleArray([...currentQuestion.options]);
    shuffledOptions.forEach((option) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = option;

      const span = document.createElement("span");
      span.textContent = option;

      label.appendChild(input);
      label.appendChild(span);
      optionsContainer.appendChild(label);

      // Agregar evento change para seleccionar una respuesta
      input.addEventListener("change", () => {
        showPopupModal(input.value);
        //handleNextButtonClick(); // Llama a la función que maneja la continuación
      });

    });

    updateProgressBar();
    //timer iniciar y resetear
    //resetTimer();
  }

  function updateProgressBar() {
    const progress = (currentQuestionIndex + 1) / quizData.length * 100;
    //const progress = (currentQuestionIndex / quizData.length) * 100;
    progressBar.style.width = `${progress}%`;
  }

  function showPopupModal(selectedAnswer) {
    const currentQuestion = quizData[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct;


    if (isCorrect) {
      score++;
      scoreElement.textContent = `Score: ${score}`;
      currentQuestionIndex++;
      if (currentQuestionIndex < quizData.length) {
        loadQuestion();
      } else {
        displayResults();
      } 
    } else{
      popupContent.innerHTML = isCorrect
      ? `<p>¡Correcto! La respuesta es: ${currentQuestion.correct}</p>`
      : `<p>Incorrecto. La respuesta correcta es: ${currentQuestion.correct}</p>`;
      popupModal.style.display = "block";
      console.log(questionText);
      questionText.innerHTML = `${currentQuestion.question}`;
      console.log(currentQuestion)
      


    }

    userAnswers.push({
      question: currentQuestion.question,
      yourAnswer: selectedAnswer,
      correctAnswer: currentQuestion.correct
    });

  }

  popupButton.addEventListener("click", () => {
    popupModal.style.display = "none";
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
      loadQuestion();
    } else {
      displayResults();
    }
  });

  function resetTimer() {
    clearInterval(timerInterval);
    let timeLeft = 30;
    timerElement.textContent = timeLeft;

    timerInterval = setInterval(() => {
      timeLeft--;
      timerElement.textContent = timeLeft;

      // Color change when timer is running low
      if (timeLeft <= 10) {
        timerElement.style.color = "#e74c3c"; // Change to red
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleNextButtonClick(); // Automatically move to next question or end quiz
      }
    }, 1000);
  }

  function handleNextButtonClick() {
    const selectedOption = document.querySelector(
      'input[name="answer"]:checked'
    );
    if (selectedOption) {
      userAnswers.push({
        question: quizData[currentQuestionIndex].question,
        yourAnswer: selectedOption.value,
        correctAnswer: quizData[currentQuestionIndex].correct
      });

      if (selectedOption.value === quizData[currentQuestionIndex].correct) {
        score++;
        scoreElement.textContent = `Score: ${score}`;
      }
    } else {
      userAnswers.push({
        question: quizData[currentQuestionIndex].question,
        yourAnswer: "No answer selected",
        correctAnswer: quizData[currentQuestionIndex].correct
      });
    }

    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
      saveProgress(); // Save progress before loading next question
      loadQuestion();
    } else {
      saveProgress(); // Save progress before displaying results
      displayResults();
    }

    document
      .querySelectorAll('input[name="answer"]')
      .forEach((input) => (input.checked = false));
  }

  function displayResults() {
    clearInterval(timerInterval);
    questionNumberElement.textContent = "Quiz Completed";
    questionTextElement.textContent = `Your score is ${score}/${quizData.length}`;

    optionsContainer.innerHTML = "";
    nextButton.style.display = "none";
    scoreboardContainer.style.display = "block";
    renderScoreboard();
    localStorage.removeItem("quizProgress"); // Clear saved progress after displaying results
  }

  function renderScoreboard() {
    scoreboardBody.innerHTML = "";
    userAnswers.forEach((answer, index) => {
      const row = document.createElement("tr");
      const questionCell = document.createElement("td");
      const yourAnswerCell = document.createElement("td");
      const correctAnswerCell = document.createElement("td");

      questionCell.textContent = `Q${index + 1}: ${answer.question}`;
      yourAnswerCell.textContent = answer.yourAnswer;
      correctAnswerCell.textContent = answer.correctAnswer;

      row.appendChild(questionCell);
      row.appendChild(yourAnswerCell);
      row.appendChild(correctAnswerCell);
      scoreboardBody.appendChild(row);
    });
  }

  function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers.length = 0;
    scoreElement.textContent = `Score: ${score}`;
    nextButton.textContent = "Continue";
    nextButton.style.display = "block";
    scoreboardContainer.style.display = "none";
    nextButton.removeEventListener("click", restartQuiz);
    nextButton.addEventListener("click", handleNextButtonClick);
    localStorage.removeItem("quizProgress"); // Clear saved progress on restart
    loadQuizData(); // Reiniciar la carga de datos del cuestionario
  }

  nextButton.addEventListener("click", handleNextButtonClick);
  restartButton.addEventListener("click", restartQuiz);

  // Cargar datos del quiz cuando el DOM esté listo
  loadQuizData();
});
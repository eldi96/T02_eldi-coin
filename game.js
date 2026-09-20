// =========================================================
// STOCK RUSH
// 기본 게임 로직
// =========================================================

let coins = 10;
let day = 1;
let peak = 10;

let currentLeverage = "x1";
let gameEnded = false;

const startCoins = 10;
// =========================================================
// 그래프 상태
// =========================================================

let chartValues = [10];

let chartAnimationId = null;

let chartAnimationStart = 0;

let chartAnimationFrom = 10;

let chartAnimationTo = 10;

let chartAnimationResult = "start";

let chartAnimationPercent = 0;

let chartAnimationProgress = 1;

// =========================================================
// BEST SCORE
// =========================================================

let bestScore = Number(localStorage.getItem("stockRushBest")) || 10;

// =========================================================
// 레버리지 규칙
// =========================================================

const LEVERAGE_RULES = {
  x1: {
    up: 50,
    defense: 15,
    down: 35,

    upRate: 0.1,
    downRate: -0.1,
  },

  x2: {
    up: 50,
    defense: 15,
    down: 35,

    upRate: 0.2,
    downRate: -0.2,
  },

  x5: {
    up: 40,
    defense: 15,
    down: 45,

    upRate: 0.5,
    downRate: -0.5,
  },

  x10: {
    up: 10,
    defense: 10,
    down: 80,

    upRate: 1.0,
    downRate: -0.9,
  },
};

// =========================================================
// DOM
// =========================================================

const coinsElement = document.getElementById("coins");

const peakElement = document.getElementById("peak");

const currentPeakElement = document.getElementById("currentPeak");

const growthRateElement = document.getElementById("growthRate");

const bestScoreElement = document.getElementById("bestScore");

const dayTimerElement = document.getElementById("dayTimer");

const marketStateElement = document.getElementById("marketState");

const marketMessageElement = document.getElementById("marketMessage");

const riskPercentElement = document.getElementById("riskPercent");

const riskBarElement = document.getElementById("riskBar");

const currentLeverageElement = document.getElementById("currentLeverage");

const spaceButton = document.getElementById("spaceButton");

const stopButton = document.getElementById("stopButton");

const restartButton = document.getElementById("restartButton");

const resultPanel = document.getElementById("resultPanel");

const resultTitle = document.getElementById("resultTitle");

const resultCoins = document.getElementById("resultCoins");

const resultPeak = document.getElementById("resultPeak");

const resultDay = document.getElementById("resultDay");

const leverageButtons = document.querySelectorAll(".leverage-button");

const soundButton = document.getElementById("soundButton");

const fullscreenButton = document.getElementById("fullscreenButton");

const coinPanel = document.querySelector(".coin-panel");

const catSweat = document.querySelector(".cat-sweat");

const dayBadge = document.querySelector(".day-badge");

const gameCanvas = document.getElementById("gameCanvas");

const chartContainer = document.querySelector(".chart-container");

const chartContext = gameCanvas.getContext("2d");


// =========================================================
// 게임 그래프
// =========================================================

function resizeGameCanvas() {

    const rect =
        gameCanvas.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;

    gameCanvas.width =
        Math.round(rect.width * dpr);

    gameCanvas.height =
        Math.round(rect.height * dpr);

    chartContext.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    drawGameChart();
}


// =========================================================
// 그래프 초기화
// =========================================================

function resetGameChart() {

    if (chartAnimationId) {
        cancelAnimationFrame(
            chartAnimationId
        );
    }

    chartAnimationId = null;

    chartValues = [10];

    chartAnimationProgress = 1;

    chartAnimationResult = "start";

    chartAnimationPercent = 0;

    chartAnimationFrom = 10;
    chartAnimationTo = 10;

    resizeGameCanvas();
}


// =========================================================
// 그래프 진행
// =========================================================

function updateGameChart(
    result,
    previousCoins,
    currentCoins,
    percent
) {

    chartValues.push(currentCoins);

    /*
     * 그래프가 너무 길어지지 않도록
     * 최근 30개만 유지
     */
    if (chartValues.length > 30) {
        chartValues.shift();
    }

    chartAnimationFrom =
        previousCoins;

    chartAnimationTo =
        currentCoins;

    chartAnimationResult =
        result;

    chartAnimationPercent =
        percent;

    chartAnimationProgress =
        0;

    chartAnimationStart =
        performance.now();

    if (chartAnimationId) {
        cancelAnimationFrame(
            chartAnimationId
        );
    }

    chartAnimationId =
        requestAnimationFrame(
            animateGameChart
        );

    chartContainer.classList.remove(
        "chart-pulse"
    );

    void chartContainer.offsetWidth;

    chartContainer.classList.add(
        "chart-pulse"
    );
}


// =========================================================
// 그래프 애니메이션
// =========================================================

function animateGameChart(timestamp) {

    const duration = 720;

    const elapsed =
        timestamp -
        chartAnimationStart;

    chartAnimationProgress =
        Math.min(
            elapsed / duration,
            1
        );

    /*
     * 부드럽게 가속 → 감속
     */
    const eased =
        1 -
        Math.pow(
            1 - chartAnimationProgress,
            3
        );

    drawGameChart(eased);

    if (
        chartAnimationProgress < 1
    ) {

        chartAnimationId =
            requestAnimationFrame(
                animateGameChart
            );

    } else {

        chartAnimationId = null;
    }
}


// =========================================================
// 그래프 그리기
// =========================================================

function drawGameChart(animationProgress = 1) {

    const rect =
        gameCanvas.getBoundingClientRect();

    const width =
        rect.width;

    const height =
        rect.height;

    if (
        width <= 0 ||
        height <= 0
    ) {
        return;
    }


    chartContext.clearRect(
        0,
        0,
        width,
        height
    );


    // -----------------------------------------------------
    // 그래프 영역
    // -----------------------------------------------------

    const paddingLeft = 24;
    const paddingRight = 42;
    const paddingTop = 48;
    const paddingBottom = 34;

    const graphWidth =
        width -
        paddingLeft -
        paddingRight;

    const graphHeight =
        height -
        paddingTop -
        paddingBottom;


    // -----------------------------------------------------
    // 실제 데이터
    // -----------------------------------------------------

    const values =
        chartValues.length
            ? chartValues
            : [10];


    let minValue =
        Math.min(...values);

    let maxValue =
        Math.max(...values);


    /*
     * 너무 평평해지는 것을 방지
     */
    if (
        maxValue -
        minValue <
        0.5
    ) {

        maxValue += 0.5;
        minValue -= 0.5;
    }


    const range =
        maxValue -
        minValue;


    minValue -=
        range * .18;

    maxValue +=
        range * .18;


    // -----------------------------------------------------
    // 배경 그리드
    // -----------------------------------------------------

    chartContext.save();

    chartContext.strokeStyle =
        "rgba(86,116,135,.12)";

    chartContext.lineWidth = 1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            paddingTop +
            (
                graphHeight *
                i /
                4
            );

        chartContext.beginPath();

        chartContext.moveTo(
            paddingLeft,
            y
        );

        chartContext.lineTo(
            width -
            paddingRight,
            y
        );

        chartContext.stroke();
    }


    for (
        let i = 0;
        i <= 5;
        i++
    ) {

        const x =
            paddingLeft +
            (
                graphWidth *
                i /
                5
            );

        chartContext.beginPath();

        chartContext.moveTo(
            x,
            paddingTop
        );

        chartContext.lineTo(
            x,
            height -
            paddingBottom
        );

        chartContext.stroke();
    }


    chartContext.restore();


    // -----------------------------------------------------
    // 기준선
    // -----------------------------------------------------

    const baselineValue =
        10;

    if (
        baselineValue >= minValue &&
        baselineValue <= maxValue
    ) {

        const baselineY =
            height -
            paddingBottom -
            (
                (
                    baselineValue -
                    minValue
                ) /
                (
                    maxValue -
                    minValue
                )
            ) *
            graphHeight;

        chartContext.save();

        chartContext.setLineDash([
            5,
            6
        ]);

        chartContext.strokeStyle =
            "rgba(77,111,130,.28)";

        chartContext.beginPath();

        chartContext.moveTo(
            paddingLeft,
            baselineY
        );

        chartContext.lineTo(
            width -
            paddingRight,
            baselineY
        );

        chartContext.stroke();

        chartContext.restore();
    }


    // -----------------------------------------------------
    // 포인트 좌표
    // -----------------------------------------------------

    const points = [];

    values.forEach(
        (value, index) => {

            const x =
                paddingLeft +
                (
                    values.length === 1
                        ? graphWidth / 2
                        : graphWidth *
                          index /
                          (values.length - 1)
                );

            const y =
                height -
                paddingBottom -
                (
                    (
                        value -
                        minValue
                    ) /
                    (
                        maxValue -
                        minValue
                    )
                ) *
                graphHeight;

            points.push({
                x,
                y,
                value
            });
        }
    );


    // -----------------------------------------------------
    // 현재 마지막 포인트 애니메이션
    // -----------------------------------------------------

    if (
        points.length >= 2 &&
        animationProgress < 1
    ) {

        const last =
            points[points.length - 1];

        const previous =
            points[points.length - 2];

        last.x =
            previous.x +
            (
                last.x -
                previous.x
            ) *
            animationProgress;

        last.y =
            previous.y +
            (
                last.y -
                previous.y
            ) *
            animationProgress;
    }


    // -----------------------------------------------------
    // 영역 채우기
    // -----------------------------------------------------

    if (points.length >= 2) {

        const gradient =
            chartContext.createLinearGradient(
                0,
                paddingTop,
                0,
                height -
                paddingBottom
            );

        gradient.addColorStop(
            0,
            "rgba(57,205,166,.22)"
        );

        gradient.addColorStop(
            1,
            "rgba(57,205,166,0)"
        );

        chartContext.save();

        chartContext.beginPath();

        chartContext.moveTo(
            points[0].x,
            height -
            paddingBottom
        );

        points.forEach(point => {
            chartContext.lineTo(
                point.x,
                point.y
            );
        });

        chartContext.lineTo(
            points[points.length - 1].x,
            height -
            paddingBottom
        );

        chartContext.closePath();

        chartContext.fillStyle =
            gradient;

        chartContext.fill();

        chartContext.restore();
    }


    // -----------------------------------------------------
    // 그래프 선
    // -----------------------------------------------------

    if (points.length >= 2) {

        const lastIndex =
            points.length - 1;

        const lastPoint =
            points[lastIndex];

        let lineColor =
            "#39cda6";

        if (
            chartAnimationResult ===
            "down"
        ) {
            lineColor =
                "#df666d";
        }

        if (
            chartAnimationResult ===
            "defense"
        ) {
            lineColor =
                "#c49345";
        }


        // 외곽 glow
        chartContext.save();

        chartContext.beginPath();

        chartContext.moveTo(
            points[0].x,
            points[0].y
        );

        for (
            let i = 1;
            i < points.length;
            i++
        ) {

            chartContext.lineTo(
                points[i].x,
                points[i].y
            );
        }

        chartContext.strokeStyle =
            lineColor;

        chartContext.lineWidth = 8;

        chartContext.globalAlpha =
            .14;

        chartContext.shadowColor =
            lineColor;

        chartContext.shadowBlur = 14;

        chartContext.stroke();

        chartContext.restore();


        // 실제 선
        chartContext.save();

        chartContext.beginPath();

        chartContext.moveTo(
            points[0].x,
            points[0].y
        );

        for (
            let i = 1;
            i < points.length;
            i++
        ) {

            chartContext.lineTo(
                points[i].x,
                points[i].y
            );
        }

        chartContext.strokeStyle =
            lineColor;

        chartContext.lineWidth = 3;

        chartContext.lineJoin =
            "round";

        chartContext.lineCap =
            "round";

        chartContext.stroke();

        chartContext.restore();


        // -------------------------------------------------
        // 마지막 포인트
        // -------------------------------------------------

        chartContext.save();

        chartContext.beginPath();

        chartContext.arc(
            lastPoint.x,
            lastPoint.y,
            12,
            0,
            Math.PI * 2
        );

        chartContext.fillStyle =
            lineColor + "22";

        chartContext.fill();


        chartContext.beginPath();

        chartContext.arc(
            lastPoint.x,
            lastPoint.y,
            5,
            0,
            Math.PI * 2
        );

        chartContext.fillStyle =
            "#ffffff";

        chartContext.shadowColor =
            lineColor;

        chartContext.shadowBlur = 12;

        chartContext.fill();

        chartContext.restore();


        // -------------------------------------------------
        // 결과 말풍선
        // -------------------------------------------------

        if (
            animationProgress > .25
        ) {

            drawChartResultBubble(
                lastPoint,
                lineColor,
                animationProgress
            );
        }
    }


  // -----------------------------------------------------
// 하단 DAY 표시
// -----------------------------------------------------

if (points.length) {

    chartContext.save();

    chartContext.font =
        "600 18px Arial, Noto Sans KR, sans-serif";

    chartContext.fillStyle =
        "rgba(247, 250, 252, 0.75)";

    chartContext.textAlign =
        "center";

    chartContext.textBaseline =
        "top";

    /*
     * 그래프가 길어져도
     * DAY 표시는 3개만 보여준다.
     */
    const labelIndexes = [
        0,
        Math.floor(
            (points.length - 1) / 2
        ),
        points.length - 1
    ];

    labelIndexes.forEach(index => {

        const point =
            points[index];

        if (!point) return;

        const dayNumber =
            Math.max(
                1,
                day -
                (
                    values.length -
                    1 -
                    index
                )
            );

       let labelX = point.x;

      if (index === 0) {
        labelX += 35;
      } 
      else if (index === points.length - 1) {
        labelX -= 35;
      }

chartContext.fillText(
    `DAY ${dayNumber}`,
    labelX,
    height -
    paddingBottom +
    10
);
    });

    chartContext.restore();
}
    // -----------------------------------------------------
    // 오른쪽 현재 값
    // -----------------------------------------------------

    if (points.length) {

        const current =
            points[points.length - 1];

        chartContext.save();

        chartContext.font =
            "800 10px Arial, sans-serif";

        chartContext.textAlign =
            "left";

        chartContext.textBaseline =
            "middle";

        chartContext.fillStyle =
            "#36526a";

        chartContext.fillText(
            Math.round(current.value),
            width -
            paddingRight +
            7,
            current.y
        );

        chartContext.restore();
    }
}


// =========================================================
// 그래프 결과 말풍선
// =========================================================

function drawChartResultBubble(
    point,
    color,
    progress
) {

    const rect =
        gameCanvas.getBoundingClientRect();

    const width =
        rect.width;

    const bubbleWidth = 118;
    const bubbleHeight = 42;

    let bubbleX =
        point.x -
        bubbleWidth / 2;

    let bubbleY =
        point.y -
        62;

    bubbleX =
        Math.max(
            10,
            Math.min(
                width -
                bubbleWidth -
                10,
                bubbleX
            )
        );

    bubbleY =
        Math.max(
            12,
            bubbleY
        );


    const alpha =
        Math.min(
            progress * 2,
            1
        );


    chartContext.save();

    chartContext.globalAlpha =
        alpha;


    // 그림자
    chartContext.shadowColor =
        color;

    chartContext.shadowBlur =
        16;

    chartContext.shadowOffsetY =
        5;


    // 카드
    chartContext.fillStyle =
        "rgba(255,255,255,.94)";

    chartContext.strokeStyle =
        color;

    chartContext.lineWidth = 1.5;


    chartContext.beginPath();

    drawRoundedRect(
        chartContext,
        bubbleX,
        bubbleY,
        bubbleWidth,
        bubbleHeight,
        13
    );

    chartContext.fill();
    chartContext.stroke();


    // 아래 말풍선 꼬리
    chartContext.beginPath();

    chartContext.moveTo(
        point.x - 7,
        bubbleY +
        bubbleHeight
    );

    chartContext.lineTo(
        point.x,
        bubbleY +
        bubbleHeight +
        8
    );

    chartContext.lineTo(
        point.x + 7,
        bubbleY +
        bubbleHeight
    );

    chartContext.closePath();

    chartContext.fillStyle =
        "rgba(255,255,255,.94)";

    chartContext.fill();

    chartContext.strokeStyle =
        color;

    chartContext.stroke();


    // 텍스트
    let text = "0%";

    if (
        chartAnimationResult ===
        "up"
    ) {
        text =
            `+${chartAnimationPercent}%`;
    }

    if (
        chartAnimationResult ===
        "down"
    ) {
        text =
            `${chartAnimationPercent}%`;
    }

    if (
        chartAnimationResult ===
        "defense"
    ) {
        text =
            "0%  •  방어";
    }


// -----------------------------------------------------
// 결과 수치
// -----------------------------------------------------

chartContext.shadowColor =
    "transparent";

chartContext.shadowBlur = 0;

chartContext.globalAlpha = 1;

chartContext.fillStyle =
    color;

chartContext.font =
    "900 18px Arial, Noto Sans KR, sans-serif";

chartContext.textAlign =
    "center";

chartContext.textBaseline =
    "middle";

chartContext.fillText(
    text,
    Math.round(
        bubbleX +
        bubbleWidth / 2
    ),
    Math.round(
        bubbleY +
        bubbleHeight / 2
    )
);

    chartContext.restore();
}


// =========================================================
// 둥근 사각형
// =========================================================

function drawRoundedRect(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    context.moveTo(
        x + radius,
        y
    );

    context.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        radius
    );

    context.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        radius
    );

    context.arcTo(
        x,
        y + height,
        x,
        y,
        radius
    );

    context.arcTo(
        x,
        y,
        x + width,
        y,
        radius
    );
}


// =========================================================
// 브라우저 크기 변경
// =========================================================

window.addEventListener(
    "resize",
    resizeGameCanvas
);

// =========================================================
// 초기화
// =========================================================

updateScreen();

resizeGameCanvas();

// =========================================================
// 레버리지 선택
// =========================================================

leverageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (gameEnded) return;

    leverageButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    currentLeverage = button.dataset.leverage;

    currentLeverageElement.textContent = currentLeverage;

    updateRisk();
  });
});

// =========================================================
// 하루 진행
// =========================================================

function playDay() {
  if (gameEnded) return;

  const previousCoins = coins;

  const rule = LEVERAGE_RULES[currentLeverage];

  const random = Math.random() * 100;

  let result;

  // -----------------------------------------------------
  // 상승
  // -----------------------------------------------------

  if (random < rule.up) {
    result = "up";

    coins = coins * (1 + rule.upRate);

    setMarketState("▲", "상승세", "#079b79");

    marketMessageElement.innerHTML = "시장이 좋아요!<br>조금 더 기다려볼까요?";
  }

  // -----------------------------------------------------
  // 방어
  // -----------------------------------------------------
  else if (random < rule.up + rule.defense) {
    result = "defense";

    setMarketState("●", "보합", "#c49345");

    marketMessageElement.innerHTML = "큰 변화는 없어요.<br>조금 더 지켜봅니다.";
  }

  // -----------------------------------------------------
  // 하락
  // -----------------------------------------------------
  else {
    result = "down";

    coins = coins * (1 + rule.downRate);

    setMarketState("▼", "하락세", "#df666d");

    marketMessageElement.innerHTML =
      "시장이 흔들리고 있어요.<br>신중하게 판단하세요.";
  }
    updateCatReaction(result);
  // 하루 증가
  day++;
  animateDayBadge();

  // 최고 기록
  if (coins > peak) {
    peak = coins;
  }

  // BEST 기록
  if (coins > bestScore) {
    bestScore = coins;

    localStorage.setItem("stockRushBest", bestScore.toString());
  }

  // =====================================================
  // GAME OVER
  // =====================================================

  if (coins < 1) {
    coins = 0;

    gameEnded = true;

    updateGameChart(
      result,
      previousCoins,
      coins,
      rule.downRate * 100
    ); 

    showResult(true);

    updateScreen();

    return;
  }
    let graphPercent = 0;

    if (result === "up") {
        graphPercent =
            rule.upRate * 100;
    }

    else if (result === "down") {
        graphPercent =
            rule.downRate * 100;
    }

    updateGameChart(
        result,
        previousCoins,
        coins,
        graphPercent
    );

  updateScreen();

  console.log({
    day,
    leverage: currentLeverage,
    result,
    coins,
  });
}

// =========================================================
// 시장 상태 변경
// =========================================================

function setMarketState(icon, text, color) {
  marketStateElement.textContent = `${icon} ${text}`;

  marketStateElement.style.color = color;
}
// =========================================================
// ELDI 고양이 반응
// =========================================================

function updateCatReaction(result) {

    if (!catSweat) return;

    // 일단 땀 제거
    catSweat.classList.remove("sweating");

    // 하락일 때만 땀
    if (result === "down") {
        catSweat.classList.add("sweating");
    }
}
function animateDayBadge() {
    if (!dayBadge) return;

    dayBadge.classList.remove("day-pop");

    void dayBadge.offsetWidth;

    dayBadge.classList.add("day-pop");
}
// =========================================================
// CASH OUT
// =========================================================

function stopGame() {
  if (gameEnded) return;

  gameEnded = true;

  showResult(false);
}

// =========================================================
// 결과창
// =========================================================

function showResult(isGameOver) {
  resultPanel.classList.remove("hidden");

  if (isGameOver) {
    resultTitle.textContent = "GAME OVER";

    resultCoins.textContent = "0 COIN";
  } else {
    resultTitle.textContent = "TODAY'S RESULT";

    resultCoins.textContent = `${Math.round(coins)} COIN`;
  }

  resultPeak.textContent = `${Math.round(peak)} COIN`;

  resultDay.textContent = `${day - 1} DAY`;

  saveBestScore();
}

// =========================================================
// RESTART
// =========================================================

function restartGame() {
  coins = 10;
  day = 1;
  peak = 10;

  currentLeverage = "x1";

  gameEnded = false;

  if (catSweat) {
    catSweat.classList.remove("sweating");
}

  // 레버리지 초기화
  leverageButtons.forEach((button) => {
    button.classList.remove("active");

    if (button.dataset.leverage === "x1") {
      button.classList.add("active");
    }
  });

  // 결과창 제거
  resultPanel.classList.add("hidden");

  // 시장 상태 초기화
  setMarketState("▲", "상승세", "#079b79");

  marketMessageElement.innerHTML = "지금은 괜찮아...<br>아직 기회가 있어!";

  currentLeverageElement.textContent = "x1";

  if (catSweat) {

    catSweat.classList.remove(
        "sweating"
    );
}

  resetGameChart();


  updateScreen();
}

// =========================================================
// 화면 갱신
// =========================================================

function updateScreen() {
    coinsElement.textContent = Math.round(coins);

    peakElement.textContent = Math.round(peak);

    currentPeakElement.textContent = Math.round(peak);

    bestScoreElement.textContent = Math.round(bestScore);

  dayTimerElement.textContent = `DAY ${day}`;

  currentLeverageElement.textContent = currentLeverage;

  // -----------------------------------------------------
  // 성장률
  // -----------------------------------------------------

  const growth = ((coins - startCoins) / startCoins) * 100;

  const roundedGrowth = growth.toFixed(0);

  if (growth >= 0) {
    growthRateElement.textContent = `+${roundedGrowth}%`;

    growthRateElement.style.background = "rgba(191,246,226,.72)";

    growthRateElement.style.color = "#079875";
  } else {
    growthRateElement.textContent = `${roundedGrowth}%`;

    growthRateElement.style.background = "rgba(253,225,226,.78)";

    growthRateElement.style.color = "#d75e67";
  }

  updateRisk();
}

// =========================================================
// 위험도
// =========================================================

function updateRisk() {
  const rule = LEVERAGE_RULES[currentLeverage];

  const risk =
    Math.abs(rule.downRate) * 100;

  riskPercentElement.textContent = `${risk}%`;

  // 위험도 색상 초기화
  riskBarElement.classList.remove("risk-green", "risk-orange", "risk-red");

  riskPercentElement.classList.remove("risk-green", "risk-orange", "risk-red");

  // 레버리지별 위험도 색상
  let riskColor = "risk-green";

  if (currentLeverage === "x5") {
    riskColor = "risk-orange";
  } else if (currentLeverage === "x10") {
    riskColor = "risk-red";
  }

  riskBarElement.classList.add(riskColor);
  riskPercentElement.classList.add(riskColor);

  // 게이지 채우기
  const bars = riskBarElement.querySelectorAll("span");

  const activeCount = Math.ceil(risk / 10);

  bars.forEach((bar, index) => {
    if (index < activeCount) {
      bar.classList.add("active");
    } else {
      bar.classList.remove("active");
    }
  });
}

// =========================================================
// BEST SCORE 저장
// =========================================================

function saveBestScore() {
  if (coins > bestScore) {
    bestScore = coins;

    localStorage.setItem("stockRushBest", bestScore.toString());
  }

  bestScoreElement.textContent = bestScore.toFixed(2);
}

// =========================================================
// HOLD 버튼
// =========================================================

spaceButton.addEventListener("click", playDay);

// =========================================================
// CASH OUT 버튼
// =========================================================

stopButton.addEventListener("click", stopGame);

// =========================================================
// 다시하기
// =========================================================

restartButton.addEventListener("click", restartGame);

// =========================================================
// SPACE 키
// =========================================================

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;

  event.preventDefault();

  playDay();
});

// =========================================================
// 사운드
// =========================================================

let soundOn = true;

soundButton.addEventListener("click", () => {
  soundOn = !soundOn;

  soundButton.textContent = soundOn ? "🔊" : "🔇";
});

// =========================================================
// 전체화면
// =========================================================

fullscreenButton.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.log("전체화면을 사용할 수 없습니다.", error);
  }
});

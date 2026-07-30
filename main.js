const resultElm = document.getElementById("result");
function createRipple(element) {
  element.addEventListener("pointerdown", e => {
    let ripple = document.createElement("div");
    let size = 10;
    ripple.classList.add("riple");
    let pos = element.getBoundingClientRect();
    ripple.setAttribute("style", `
      width: ${size}px;
      height: ${size}px;
      position: absolute;
      left: ${e.clientX - pos.x - size/2}px;
      top: ${e.clientY - pos.y - size/2}px;

      `);

    element.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 1000)
  })
}

function formatCommas(str) {
  let [i,
    f = ""] = str.split(".");
  let prefix = "";
  if (i[0] === "-") {
    prefix = "-";
    i = i.slice(1);
  }

  let counter = 1;
  for (let idx = i.length - 1; idx >= 0; idx--) {

    if (counter == 3 && idx != 0) {
      i = i.slice(0, idx) + "," + i.slice(idx);
      counter = 0;
    }

    counter++;

  }

  let hasDot = str.includes(".");
  let end;
  hasDot ? end = ".": end = "";
  if (f) {
    end += f;
  }
  return prefix + i + end;

}



let isLocalStorageAvl = false;
function checkLocalStorageSupport() {
  try {
    localStorage.setItem("ls_test", "{}");
    localStorage.removeItem("ls_test");
    isLocalStorageAvl = true;
  } catch (e) {
    isLocalStorageAvl = false;
  }
}
checkLocalStorageSupport();



let myCal = new Calculator(100);
if (isLocalStorageAvl) {
  const stored = parseInt(localStorage.getItem("CALCULATOR_PRECISION"));
  if (!isNaN(stored)) myCal.PRECISION = Math.max(0, Math.min(stored, 1000));
}
myCal.init();

let db_ver = 1;
let HISTORY = [];
let database, db_req;
let databasePresent = false;

if ("indexedDB" in window) {

  databasePresent = true;
  try {
    db_req = window.indexedDB.open("calculator", db_ver);
  } catch(e) {
    databasePresent = false;
  }

  if (databasePresent) {
    db_req.addEventListener("error", e => {
      //console.log("Encountered error while trying to open the database!" + e.errorCode);
    })

    db_req.addEventListener("upgradeneeded", e => {
      store = e.target.result.createObjectStore("calchistory", {
        autoIncrement: true
      });
      //console.log("Creating new database")
    })

    db_req.addEventListener("success", e => {
      //console.log("Database successfully opened!");
      database = e.target.result;
      readDataDB(database);
      //handleHistory();
    })
  }
}


function saveDataDB() {
  const transaction = database.transaction("calchistory", "readwrite");
  const storage = transaction.objectStore("calchistory");

  storage.put(HISTORY, "history");

  transaction.addEventListener("complete", () => {
    //console.log("Data updated successfully");
  })
}

function readDataDB() {
  const transaction = database.transaction("calchistory", "readonly");
  const storage = transaction.objectStore("calchistory");
  const req = storage.get("history");
  req.onsuccess = () => {
    HISTORY = req.result;
    if (!HISTORY) HISTORY = [];
    handleHistory();
  }
}


function calculateTimeDifference(timestamp) {
  let seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return "Just now";
  let minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + (minutes == 1 ? " minute ago": " minutes ago");
  let hour = Math.floor(minutes / 60);
  if (hour < 24) return hour + (hour == 1 ? " hour ago": " hours ago");
  let days = Math.floor(hour / 24);
  if (days < 1) return "Yesterday";


  let date = new Date(timestamp*1000);
  if (days < 8) return date.toLocaleString("default", {
    weekday: 'long'
  });

  let year = date.getFullYear();
  let currentYear = new Date().getFullYear();
  let month = date.toLocaleString("default", {
    month: 'short'
  });
  let dateNum = date.getDate();

  if (year == currentYear) return dateNum + " " + month;

  return dateNum + " " + month + " " + year;
}
const FONT_SIZE_DATA = {
  10: 50,
  11: 46,
  12: 42,
  13: 39,
  14: 36,
  15: 34,
  16: 32,
  17: 30,
  18: 28
}
function adjustFontSizeInputElm() {
  let fontSize,
  len = inputElm.value.length;
  if (len < 10) {
    fontSize = 56;
  } else if (len >= 10 && len <= 18) {
    fontSize = FONT_SIZE_DATA[len];
  } else {
    fontSize = 28;
  }
  inputElm.style.fontSize = fontSize+"px";
}
function handleHistory() {
  let html = "";
  for (let i = HISTORY.length - 1; i >= 0; i--) {
    let data = HISTORY[i];
    let time = calculateTimeDifference(data.timestamp);
    html += `
    <div class="history-calc">

    <div>
    <div class="history-calc-date">${time}</div>
    </div>

    <div>
    <div class="history-calc-exp">${data.exp}</div>
    <div class="history-calc-value">${data.val}</div>
    </div>

    </div>
    `;
  }

  document.getElementById("historyElm").innerHTML = html;

}

let historyElm = document.querySelector("#historyElm");
historyElm.addEventListener("click", e => {
  if (!e.target) return;
  if (e.target.classList.contains("history-calc-exp")) {
    let cursor = inputElm.selectionStart;
    let val = inputElm.value;
    let dat = HandleCommas(val.slice(0, cursor) + e.target.textContent + val.slice(cursor), cursor);
    inputElm.value = dat[0];
    adjustFontSizeInputElm();
    move(inputElm, cursor + dat[1] + e.target.textContent.length);

    document.getElementById("pseudoBtn").click();
  } else if (e.target.classList.contains("history-calc-value")) {
    let cursor = inputElm.selectionStart;
    let val = inputElm.value;
    let dat = HandleCommas(val.slice(0, cursor) + e.target.textContent + val.slice(cursor), cursor);
    inputElm.value = dat[0];
    adjustFontSizeInputElm();
    move(inputElm, cursor + dat[1] + e.target.textContent.length);
    document.getElementById("pseudoBtn").click();
  }
})

function addNewEntryToHistory(entry) {
  historyElm.innerHTML = `
  <div class="history-calc">
  <div>
  <div class="history-calc-date">${calculateTimeDifference(entry.timestamp)}</div>
  </div>

  <div>
  <div class="history-calc-exp">${entry.exp}</div>
  <div class="history-calc-value">${entry.val}</div>
  </div>

  </div>
  ` + historyElm.innerHTML;
}


// WORK ON OPTIMIZATION

function AddCommas(text) {
  let newText = "";
  let num = "";
  for (const idx in text) {
    const char = text[idx];
    if ("0123456789".includes(char)) {
      num += char;
    } else {

      if (num != "") {
        newText += Number(num).toLocaleString();
        num = "";
      }

      newText += char;

    }
  }

  if (num != "") newText += Number(num).toLocaleString();
  //there is problem im this func. for eg type 2.330582828458382848584828284854883
  return text;
}

function countChar(char, str) {
  let count = 0;
  for (let strChar of str) {
    if (strChar === char) count++;
  }
  return count;
}

function removeTrailingZeros(str) {
  return str.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
}
function testPercent(str) {
  const regex = /^(-?\d+(?:\.\d+)?(?:\s*[+-]\s*\d+(?:\.\d+)?)*)\s*((?:[+-]\s*\d+(?:\.\d+)?%\s*)+)$/;
  const match = str.match(regex);

  if (match) {
    const termRegex = /([+-])\s*(\d+(?:\.\d+)?)%/g;

    let r = `(${match[1]})`;
    [...match[2].matchAll(termRegex)].forEach(p => {
      r += `*(1${p[1]}${p[2]}/100)`;
    });

    return r;
  }
}

function handleInv() {
  document.getElementById("sin-btn").classList.toggle("hide");
  document.getElementById("asin-btn").classList.toggle("hide");
  document.getElementById("cos-btn").classList.toggle("hide");
  document.getElementById("acos-btn").classList.toggle("hide");
  document.getElementById("tan-btn").classList.toggle("hide");
  document.getElementById("atan-btn").classList.toggle("hide");
  document.getElementById("phi-btn").classList.toggle("hide");
  document.getElementById("rad-deg-btn").classList.toggle("hide");
  document.getElementById("log-btn").classList.toggle("hide");
  document.getElementById("sqrt-btn").classList.toggle("hide");
  document.getElementById("factorial-btn").classList.toggle("hide");
  document.getElementById("sinh-btn").classList.toggle("hide");
  document.getElementById("pi-btn").classList.toggle("hide");
  document.getElementById("cosh-btn").classList.toggle("hide");
  document.getElementById("e-btn").classList.toggle("hide");
  document.getElementById("tanh-btn").classList.toggle("hide");
  document.getElementById("exp-btn").classList.toggle("hide");
  document.getElementById("asinh-btn").classList.toggle("hide");
  document.getElementById("ln-btn").classList.toggle("hide");
  document.getElementById("acosh-btn").classList.toggle("hide");
  document.getElementById("pow-btn").classList.toggle("hide");
  document.getElementById("atanh-btn").classList.toggle("hide");
}
//let theme = "dark";
function handleRadDeg(elm) {
  //theme == "dark" ? theme = "light" : theme = "dark";
  //document.documentElement.setAttribute("data-theme", theme);

  if (elm.textContent == "Deg") {
    elm.textContent = "Rad";
    myCal.RADIANS = false;
  } else {
    elm.textContent = "Deg";
    myCal.RADIANS = true;
  }

}



function displayResult() {
  let exp = inputElm.value;
  let t = testPercent(exp);
  if (t) exp = t;

  let diff = countChar("(", exp) - countChar(")", exp);
  if ("0123456789πeφ!)".includes(exp[exp.length - 1])) exp += ")".repeat(diff);

  try {
    val = removeTrailingZeros(myCal.evaluate(exp));
    //val = myCal.fix(val);
    //worker.postMessage(exp);
    formatResult();
  } catch (e) {
    val = ""; // >_<
    formatResult();
    //console.log("Error\n" + e);
  }

}

const btns = document.querySelectorAll("#button-container button");
const inputElm = document.querySelector("#calculator-input");
for (const btn of btns) {
  createRipple(btn);
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
  })
  btn.addEventListener("pointerup", e => {
    //e.preventDefault();
    let [cursorStart, end] = [inputElm.selectionStart, inputElm.selectionEnd];


    if (btn.name == "Inv") {
      handleInv();
      return;
    } else if (btn.id == "rad-deg-btn") {
      handleRadDeg(btn);
      displayResult();
      // formatResult();
      return;
    }

    let txt = btn.textContent;
    let value = inputElm.value;
    //let lastChar = value.at(-1);
    if (txt == "AC") {
      inputElm.value = "";
      val = "";
      pos = 0;
      formatResult();
      return;
    } else if (btn.classList.contains("num-btn")) {
      //cursorStart
      value = value.slice(0, cursorStart) + txt + value.slice(cursorStart);
    } else if (btn.classList.contains("opt-btn")) {
      let prev = value[cursorStart - 1];

      if (txt == "( )") {
        let parenthesisToAdd = ")";
        if (!(countChar("(", value) - countChar(")", value))) {
          parenthesisToAdd = "(";
        }

        if (["+", "-", "÷", "×", "("].includes(prev)) parenthesisToAdd = "(";

        value = value.slice(0, cursorStart) + parenthesisToAdd + value.slice(cursorStart);
      }

      if (!prev && txt != "( )" && txt != "-") return;

      if ((prev == txt) && (txt != "%")) return;


      if (prev != "%" && ["+", "-", "÷", "×"].includes(prev) && txt != "( )") {
        value = value.slice(0, cursorStart - 1) + txt + value.slice(cursorStart);
        cursorStart -= 1;
      } else if (txt != "( )") {
        value = value.slice(0, cursorStart) + txt + value.slice(cursorStart);
      }



    } else if (btn.classList.contains("func-btn")) {
      value = value.slice(0, cursorStart) + btn.name + value.slice(cursorStart);
      cursorStart += btn.name.length - 1;
    } else if (btn.id == "back-btn") {
      if (cursorStart == 0) {
        cursorStart -= 1;
      } else {
        value = value.slice(0, cursorStart - 1) + value.slice(cursorStart);
        let dat = HandleCommas(value, cursorStart);
        value = dat[0];
        cursorStart -= 2
      }

    } else if (btn.classList.contains("const-btn")) {
      value = value.slice(0, cursorStart) + txt + value.slice(cursorStart);
    } else if (btn.textContent == "=") {
      if (resultElm.textContent != "") {

        const entry = {
          exp: inputElm.value,
          val: formatCommas(Calculator.NormalToScientific(val)),
          timestamp: Math.floor(Date.now() / 1000)
        };
        HISTORY.push(entry);
        if (databasePresent) {
          addNewEntryToHistory(entry);
          saveDataDB(database);
        }
        inputElm.value = formatCommas(val);
        adjustFontSizeInputElm();
        displayResult();
        return;




      }
    }


    let dat = HandleCommas(value, cursorStart);
    inputElm.value = dat[0];
    displayResult();
    let p = cursorStart + 1 + dat[1];
    adjustFontSizeInputElm();
    move(inputElm, p);


  })
}
function move(inp, p) {
  inp.setSelectionRange(p,
    p);
  inp.scrollLeft = getCaretPixelOffset(inp,
    p) - inp.clientWidth / 2;
}

function getCaretPixelOffset(inp, pos) {
  const mirror = document.createElement("span");
  const cs = getComputedStyle(inp);
  ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "textTransform"]
  .forEach(prop => mirror.style[prop] = cs[prop]);
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre";
  mirror.textContent = inp.value.slice(0,
    pos);
  document.body.appendChild(mirror);
  const width = mirror.getBoundingClientRect().width;
  mirror.remove();
  return width;
}

let pos = 0, chunkSize = 16, val = resultElm.textContent, DIGITS_ON_SCREEN = chunkSize + 5;
let startX, startY, endX, endY, maxPos;
function formatResult() {
  let [i, f = ""] = val.split(".");
  let str;
  f ? str = i + "." + f: str = i;
  maxPos = str.length - chunkSize;

  if (str.length > chunkSize) {

    let chunk = str.slice(pos, pos + chunkSize);
    let exp = str.length - f.length - 1 - pos;



    if (pos === 0) {
      resultElm.textContent = formatCommas(Calculator.NormalToScientific(val));
      return;

    }

    exp -= chunk.length - 1;
    exp != 0 ? resultElm.textContent = "..." + chunk + "E" + exp: resultElm.textContent = "..." + chunk;

  } else {
    resultElm.textContent = formatCommas(val);
  }

}

function HandleCommas(str, cursor) {
  let exp = "";
  let beforeCommas = 0;
  for (let idx in str) {
    let char = str[idx];
    if (idx < cursor && char == ",") {
      beforeCommas++;
      continue;
    }
    if (char != ",") exp += char;

  }

  let newExp = "";
  let number = "";
  for (let char of exp) {

    if (char == "_") {
      continue;
    } else if (!isNaN(char) || char == ".") {
      number += char;
    } else {
      newExp += formatCommas(number) + char;
      number = "";
    }

  }

  if (number) newExp += formatCommas(number);

  let commasBeforeCursor = 0;
  for (let idx in newExp) {
    if (idx > cursor) break;
    if (newExp[idx] == ",") commasBeforeCursor++;
  }
  return [newExp,
    commasBeforeCursor - beforeCommas];

}


formatResult();

const copyBtn = document.querySelector("#copy-btn");

resultElm.style.touchAction = "none";
let dStart = 0, dEnd = 0;
let copyBtnShow = false;
resultElm.addEventListener("pointerdown", e => {
  [startX, startY] = [e.clientX, e.clientY];
  endX = startX;
  dStart = performance.now();
  copyBtnShow = true;
  setTimeout(() => {
    if (copyBtnShow) {
      copyBtn.classList.toggle("show");
      setTimeout(() => {
        copyBtn.classList.remove("show");
      }, 2500)
    }
  },
    1000)
})
resultElm.addEventListener("pointermove", e => {
  [endX, endY] = [e.clientX, e.clientY];
  let dx = endX - startX;
  copyBtnShow = false;
  if (dx > 30) {
    if (pos > 0) pos -= 1;
    startX = endX;
  } else if (dx < -30) {
    if (pos < maxPos) pos += 1;
    startX = endX;
  }

  formatResult()
})
resultElm.addEventListener("pointerup", e => {
  copyBtnShow = false;
  const vel = (e.clientX - endX) / (performance.now() - dStart);
  pos += Math.ceil(vel * 1000);
  pos = Math.max(0, Math.min(pos, maxPos))

  formatResult();
  //console.log(vel)
})

let historyTouchStartY, historyTouchMoveY, historyTouchStartTime, historyTouchMoveTime, Y = 0;

let calcInputDiv = document.getElementById("calculator-input-div"),
calculatorElm = document.getElementById("calculator"),
opened = false,
fullOpened = false,
currentExpTxt = document.getElementById("currentExpTxt"),
sliderElm = document.getElementById("slider");

calcInputDiv.addEventListener("touchstart", e => {
  historyTouchStartY = e.touches[0].clientY;
  historyTouchStartTime = performance.now();
})

calcInputDiv.addEventListener("touchmove", e => {
  historyTouchMoveY = e.touches[0].clientY;
  historyTouchMoveTime = performance.now();
  let dy = historyTouchMoveY - historyTouchStartY;
  let dt = historyTouchMoveTime - historyTouchStartTime;
  let vel = dy / dt;
  let box = document.querySelector(".main-container").getBoundingClientRect();
  let maxH = box.height;
  let factor = 1 - 150 / maxH;


  if (vel > 0.5) {
    if (opened && historyTouchStartY > 200) {
      calculatorElm.style.transform = `translateY(${maxH - 200}px)`;
      //historyElm.style.transform = `translateY(px)`;
      historyElm.style.minHeight = (maxH - 200)+"px";
      currentExpTxt.style.transform = `scaleY(1)`;
      document.documentElement.style.setProperty("--text-scale-factor2", 0.9);

      //currentExpTxt.style.transform = "scaleY(1)";
      fullOpened = true;
    } else {
      historyElm.style.transform = "translateY(0)";
      calculatorElm.style.transform = `translateY(150px) scaleY(${factor})`;
      document.documentElement.style.setProperty("--text-scale-factor", factor);
      currentExpTxt.style.opacity = 1;
      currentExpTxt.style.transform = `scaleY(1.2)`;
      sliderElm.style.opacity = 1;
      opened = true;
    }
  } else if (vel < -0.5) {

    if (fullOpened) {
      calculatorElm.style.transform = `translateY(150px) scaleY(${factor})`;
      //historyElm.style.transform = "translateY(0)";
      historyElm.style.minHeight = "150px";
      historyElm.style.height = "150px";
      currentExpTxt.style.transform = `scaleY(1.2)`;
      document.documentElement.style.setProperty("--text-scale-factor2", 1.1);
      //opened2 = false;
      //close = true;
      fullOpened = false;

    } else {
      if (historyTouchStartY - box.y < 150 + 200) {
        historyElm.style.transform = "translateY(-50px)";
        calculatorElm.style.transform = "translateY(0) scaleY(1)";
        currentExpTxt.style.transform = `scale(1)`;
        document.documentElement.style.setProperty("--text-scale-factor", 1);
        currentExpTxt.style.opacity = 0;
        sliderElm.style.opacity = 0;
        opened = false;
      }
    }

  }

})




inputElm.addEventListener('paste', e => {
  let pastedText = e.clipboardData.getData('text/plain');
  if (pastedText.slice(0, 10).toLowerCase() === "precision=") {
    let n = Number(pastedText.split("=")[1]);
    if (isNaN(n)) n = 100;
    myCal.PRECISION = n;
    setTimeout(() => {
      inputElm.value = "";
    }, 500)
    if (isLocalStorageAvl) localStorage.setItem("CALCULATOR_PRECISION", n);
  } else if (pastedText.slice(0, 6).toLowerCase() === "impexp") {
    handleExportImport();
  }
});



function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text)
  .then(() => {
    //console.log("Text successfully copied!");
  })
  .catch(err => {
    console.error("Failed to copy text: ", err);
  });
}


copyBtn.addEventListener("click", () => {
  const e = Number(resultElm.textContent.split("E")[1]);
  //const v = forval.slice(0, pos + chunkSize));
  let txt;
  if (!e) {
    txt = val.slice(0, chunkSize);
  } else {
    if (e < 0) {
      txt = val.slice(0, pos + chunkSize);
    } else {
      txt = val.slice(0, pos + chunkSize) + "E" + e;
      if (pos === 0) txt = resultElm.textContent;
    }

  }

  if (val.slice(0, pos).length + 2 > chunkSize && !e) {
    txt = val;
  }

  copyBtn.textContent = "Copied!";
  setTimeout(() => {
    copyBtn.classList.toggle("show");
    copyBtn.textContent = "Copy";
  }, 600)

  //console.log(txt);

  copyTextToClipboard(txt);

})



function handleExportImport() {
  document.body.innerHTML = `
  <div>
  <label for="import">Import</label>
  <input type="file" id="import" name="import" accept=".json">
  <button id="export-btn" class="my-btn">Export</button>
  <div id="json-div" style="width:80vw;max-width:600px;overflow:scroll;padding:10px;border:1px solid rgb(125,148,184);display:none;max-height:350px;"></div>
  <div style="width:300px;display:flex;justify-content:space-between;margin-top:20px;">
  <button id="merge-btn" style="display:none;" class="my-btn">Merge</button>
  <button id="replace-btn" style="display:none;" class="my-btn">Replace</button>
  </div>
  <button id="delete-history-btn" style="background:rgb(247,50,97);color:rgb(255,234,239);margin-top:100px;border:none;padding:5px;border-radius:5px;">Delete</button>
  </div>
  `;
  document.body.style.color = "rgb(199,233,255)";
  document.body.style.padding = "20px";

  document.getElementById("export-btn").addEventListener("click",
    () => {
      let a = document.createElement("a");
      let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent('{"History":' + JSON.stringify(HISTORY) + "}");
      a.setAttribute("href", dataStr);
      let d = new Date();
      a.setAttribute("download", `CALC${d.getFullYear()}${d.getMonth().toString().padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}.json`);
      a.click();

    })

  const importInp = document.querySelector("#import");
  const jsonDiv = document.querySelector("#json-div");
  const mergeBtn = document.querySelector("#merge-btn");
  const replaceBtn = document.querySelector("#replace-btn");

  let data;
  importInp.addEventListener("change",
    e => {
      importInp.files[0].text().then(t => {
        jsonDiv.textContent += t;
        data = JSON.parse(t).History;
        jsonDiv.style.display = "block";
        replaceBtn.style.display = "block";
        mergeBtn.style.display = "block";


      })
    })

  mergeBtn.addEventListener("click",
    () => {
      HISTORY.push(...data)
      HISTORY.sort((a, b) => a.timestamp - b.timestamp);
      saveDataDB(database);
    })

  replaceBtn.addEventListener("click",
    () => {
      HISTORY = data;
      saveDataDB(database);
    })

  document.querySelector("#delete-history-btn").addEventListener("dblclick",
    () => {
      HISTORY = [];
      saveDataDB(database);
    })

}



document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    inputElm.readOnly = true;
  } else {
    setTimeout(() => {
      inputElm.readOnly = false;
    }, 200)
  }
})

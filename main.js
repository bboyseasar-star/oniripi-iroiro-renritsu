/**
 * 色々な連立方程式
 * アプリ制御ロジック (main.js)
 */

class App {
    constructor() {
        // ゲーム状態
        this.currentCourse = "";
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.incorrectQuestions = [];
        this.isReviewMode = false;
        
        // UI・入力状態
        this.activeInput = "x"; // 現在フォーカスしている入力欄 ("x" または "y")
        this.currentHintsShown = 0;
        
        // localStorage フォールバック用メモリ変数
        this.memHighScores = {
            parentheses: 0,
            fraction_decimal: 0,
            abc: 0
        };
        this.memHistory = [];

        // 音声効果用のAudioContext
        this.audioCtx = null;
    }

    // アプリ初期化
    init() {
        // localStorage からデータを読み込む（try-catch で保護）
        this.loadHistoryAndScores();

        // スタート画面のUI更新
        this.updateStartScreenUI();

        // MathLive の全角・半角強制設定の適用
        this.setupMathLiveFields();

        // 手書き計算スペースの初期化
        this.initScratchpad();

        // 音声コンテキストの初期化準備（ユーザーの最初のタップで有効化）
        document.body.addEventListener('click', () => this.initAudio(), { once: true });
    }

    // AudioContext の初期化
    initAudio() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        } catch (e) {
            console.warn("AudioContext を初期化できませんでした:", e);
        }
    }

    // ----------------------------------------------------
    // データ保存・読み込み (localStorage / メモリ保護)
    // ----------------------------------------------------
    loadHistoryAndScores() {
        try {
            const rawScores = localStorage.getItem("oniripi_renritsu_scores");
            if (rawScores) {
                this.memHighScores = JSON.parse(rawScores);
            }
        } catch (e) {
            console.warn("localStorage の読み込みに失敗したため、メモリ変数を使用します:", e);
        }

        try {
            const rawHistory = localStorage.getItem("oniripi_renritsu_history");
            if (rawHistory) {
                this.memHistory = JSON.parse(rawHistory);
            }
        } catch (e) {
            console.warn("localStorage の履歴読み込みに失敗したため、メモリ変数を使用します:", e);
        }
    }

    saveScores() {
        try {
            localStorage.setItem("oniripi_renritsu_scores", JSON.stringify(this.memHighScores));
        } catch (e) {
            console.warn("localStorage のスコア保存に失敗しました:", e);
        }
    }

    saveHistory() {
        try {
            localStorage.setItem("oniripi_renritsu_history", JSON.stringify(this.memHistory));
        } catch (e) {
            console.warn("localStorage の履歴保存に失敗しました:", e);
        }
    }

    // ----------------------------------------------------
    // UI更新 (スタート画面)
    // ----------------------------------------------------
    updateStartScreenUI() {
        // ベストスコアの更新
        const courses = ["parentheses", "fraction_decimal", "abc"];
        courses.forEach(course => {
            const scoreSpan = document.getElementById(`score-${course}`);
            if (scoreSpan) {
                const score = this.memHighScores[course] || 0;
                scoreSpan.innerText = score > 0 ? score : "-";
            }

            // クリアの王冠マーク (全問正解＝5問で王冠を表示)
            const crown = document.getElementById(`crown-${course}`);
            if (crown) {
                if (this.memHighScores[course] === 5) {
                    crown.classList.add("active");
                } else {
                    crown.classList.remove("active");
                }
            }
        });

        // 履歴リストの描画
        const historyList = document.getElementById("history-list");
        const emptyDiv = document.getElementById("history-empty");
        
        if (historyList) {
            historyList.innerHTML = "";
            if (this.memHistory.length === 0) {
                if (emptyDiv) emptyDiv.style.display = "block";
            } else {
                if (emptyDiv) emptyDiv.style.display = "none";
                
                // 最新順に最大20件表示
                const displayHistory = this.memHistory.slice(-20).reverse();
                displayHistory.forEach(item => {
                    const li = document.createElement("li");
                    li.className = "history-item";

                    let courseName = "";
                    if (item.course === "parentheses") courseName = "コース1: カッコ";
                    else if (item.course === "fraction_decimal") courseName = "コース2: 分数・小数";
                    else if (item.course === "abc") courseName = "コース3: A = B = C";

                    const passBadge = item.isPassed ? "💮" : "❌";
                    const formattedDate = this.formatDateStr(item.date);

                    li.innerHTML = `
                        <div class="history-item-left">
                            <span class="history-course">${courseName}</span>
                            <span class="history-date">${formattedDate}</span>
                        </div>
                        <div class="history-item-right">
                            <span class="history-score-val">${item.score} / ${item.total}問</span>
                            <span class="history-pass-badge">${passBadge}</span>
                        </div>
                    `;
                    historyList.appendChild(li);
                });
            }
        }
    }

    resetHistory() {
        if (confirm("これまでの学習履歴とベストスコアをすべて消去しますか？")) {
            this.memHighScores = { parentheses: 0, fraction_decimal: 0, abc: 0 };
            this.memHistory = [];
            this.saveScores();
            this.saveHistory();
            this.updateStartScreenUI();
        }
    }

    formatDateStr(dateStr) {
        try {
            const d = new Date(dateStr);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const date = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${y}/${m}/${date} ${h}:${min}`;
        } catch (e) {
            return dateStr;
        }
    }

    // ----------------------------------------------------
    // MathLive 設定と Chromebook 半角入力の強制
    // ----------------------------------------------------
    setupMathLiveFields() {
        const fields = ["mf-x", "mf-y"];
        fields.forEach(id => {
            const mf = document.getElementById(id);
            if (!mf) return;

            // 半角モード属性
            mf.setAttribute('inputmode', 'latin');

            // 日本語変換 (IME) 終了時の半角自動変換
            mf.addEventListener('compositionend', (ev) => {
                const data = ev.data;
                if (data) {
                    const converted = data
                        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                        .replace(/[ａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                        .replace(/[Ａ-Ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                        .replace(/[＋]/g, '+').replace(/[－ー−]/g, '-')
                        .replace(/[×]/g, '\\times ').replace(/[÷]/g, '\\div ')
                        .replace(/[＝]/g, '=').replace(/[（]/g, '(').replace(/[）]/g, ')')
                        .replace(/[＜]/g, '<').replace(/[＞]/g, '>');
                    mf.value = '';
                    mf.insert(converted);
                }
            });

            // フォーカス時にも hidden textarea へアクセスして半角化
            mf.addEventListener('focus', () => {
                this.activeInput = id === "mf-x" ? "x" : "y";
                
                // 親のコンテナフォーカススタイル用
                document.getElementById(`container-mf-x`).classList.remove("focus");
                document.getElementById(`container-mf-y`).classList.remove("focus");
                document.getElementById(`container-mf-${this.activeInput}`).classList.add("focus");

                mf.setAttribute('inputmode', 'latin');
                const shadow = mf.shadowRoot;
                if (shadow) {
                    const textarea = shadow.querySelector('textarea');
                    if (textarea) {
                        textarea.setAttribute('inputmode', 'latin');
                        textarea.setAttribute('autocorrect', 'off');
                        textarea.setAttribute('lang', 'en');
                    }
                }
            });
        });
    }

    // ----------------------------------------------------
    // ゲームフローの制御 (ドリル開始・終了・ホーム)
    // ----------------------------------------------------
    selectCourse(course) {
        this.currentCourse = course;
        this.isReviewMode = false;
        
        // 5問セットを生成
        this.questions = window.QuestionGenerator.generateSet(course, 5);
        this.currentIndex = 0;
        this.score = 0;
        this.incorrectQuestions = [];

        this.startDrill();
    }

    startDrill() {
        // 画面切り替え
        this.switchScreen("screen-drill");
        
        // UIリセット
        document.getElementById("drill-score").innerText = "0";
        
        // 手書きスペースのサイズを実物サイズに調整 (画面がアクティブになった後)
        setTimeout(() => this.resizeCanvas(), 50);

        // 問題読み込み
        this.loadQuestion();
    }

    loadQuestion() {
        const q = this.questions[this.currentIndex];
        
        // 手書き計算スペースを消去
        this.clearScratchpad();
        
        // 進捗の更新
        const progressPercent = (this.currentIndex / this.questions.length) * 100;
        document.getElementById("drill-progress-bar").style.width = `${progressPercent}%`;
        document.getElementById("drill-progress-text").innerText = `${this.currentIndex + 1} / ${this.questions.length} 問`;

        // 問題の描画
        const eqDisplay = document.getElementById("equation-display");
        eqDisplay.innerHTML = `\\(${q.equationLatex}\\)`;

        // 入力欄の初期化とフォーカス
        const mfx = document.getElementById("mf-x");
        const mfy = document.getElementById("mf-y");
        mfx.value = "";
        mfy.value = "";
        mfx.removeAttribute("disabled");
        mfy.removeAttribute("disabled");

        // ヒントの初期化
        this.currentHintsShown = 0;
        this.updateHintUI();

        // 判定オーバーレイを閉じる
        document.getElementById("judge-overlay").classList.remove("active");

        // MathJaxの再描画
        MathJax.typesetPromise().then(() => {
            // 描画完了後にxの入力欄にフォーカスをあてる
            setTimeout(() => {
                mfx.focus();
                this.activeInput = "x";
                document.getElementById(`container-mf-x`).classList.add("focus");
                document.getElementById(`container-mf-y`).classList.remove("focus");
            }, 100);
        });
    }

    // ----------------------------------------------------
    // 入力補助キーボード
    // ----------------------------------------------------
    pressKey(key) {
        const mfId = this.activeInput === "x" ? "mf-x" : "mf-y";
        const mf = document.getElementById(mfId);
        if (!mf || mf.hasAttribute("disabled")) return;

        if (key === "backspace") {
            mf.executeCommand(['deleteBackward']);
        } else if (key === "clear") {
            mf.value = "";
        } else if (key === "fraction") {
            // 分数記号の挿入
            try {
                mf.insert("\\frac{#0}{#?}");
            } catch (e) {
                mf.executeCommand(['insert', '\\frac{#0}{#?}']);
            }
        } else {
            // 通常の文字入力
            try {
                mf.insert(key);
            } catch (e) {
                mf.executeCommand(['insert', key]);
            }
        }
    }

    // ----------------------------------------------------
    // 正誤判定 & 途中式解説
    // ----------------------------------------------------
    submitAnswer() {
        const q = this.questions[this.currentIndex];
        const rawAnsX = document.getElementById("mf-x").value;
        const rawAnsY = document.getElementById("mf-y").value;

        // ギブアップ判定
        const isGaveUp = !!q.isGaveUp;

        // 正規化
        const normAnsX = this.normalizeLatex(rawAnsX);
        const normAnsY = this.normalizeLatex(rawAnsY);
        const normCorrectX = this.normalizeLatex(q.answers.x);
        const normCorrectY = this.normalizeLatex(q.answers.y);

        // ギブアップ時は無条件で不正解
        const isCorrect = !isGaveUp && (normAnsX === normCorrectX) && (normAnsY === normCorrectY);

        // 振り返り用に記録
        if (isGaveUp) {
            q.userAnswer = { x: "未回答", y: "未回答" };
        } else {
            q.userAnswer = { x: rawAnsX, y: rawAnsY };
        }
        q.isUserCorrect = isCorrect;

        // 判定オーバーレイの要素取得
        const overlay = document.getElementById("judge-overlay");
        const mark = document.getElementById("judge-mark");
        const msg = document.getElementById("judge-message");
        const expArea = document.getElementById("incorrect-explanation");

        // 表示の初期化
        mark.className = "judge-mark";
        expArea.style.display = "none";

        if (isCorrect) {
            // 正解
            mark.classList.add("correct");
            msg.innerText = "正解！ 素晴らしい！";
            msg.style.color = "var(--accent-emerald)";
            
            this.score++;
            document.getElementById("drill-score").innerText = this.score;
            this.playCorrectSound();
            
            // 次へボタンにフォーカス
            document.getElementById("btn-next-question").focus();
        } else {
            // 不正解
            mark.classList.add("incorrect");
            if (isGaveUp) {
                msg.innerText = "ギブアップ（不正解）";
                msg.style.color = "var(--warning)";
            } else {
                msg.innerText = "おしい！ 計算を見直そう";
                msg.style.color = "var(--error)";
            }

            // 履歴用に間違えた問題をストック (通常モード時のみ)
            if (!this.isReviewMode) {
                this.incorrectQuestions.push(q);
            }

            // 誤答解説の描画
            if (isGaveUp) {
                document.getElementById("exp-your-ans").innerHTML = `未回答（ギブアップ）`;
            } else {
                document.getElementById("exp-your-ans").innerHTML = `\\(x = ${rawAnsX !== "" ? rawAnsX : "?"}\\), \\(y = ${rawAnsY !== "" ? rawAnsY : "?"}\\)`;
            }
            document.getElementById("exp-correct-ans").innerHTML = `\\(x = ${q.displayAnswers.x}\\), \\(y = ${q.displayAnswers.y}\\)`;
            document.getElementById("exp-details").innerHTML = q.explanation;
            expArea.style.display = "flex";

            this.playIncorrectSound();

            // 解説の中に含まれる LaTeX 数式の再描画
            MathJax.typesetPromise().then(() => {
                document.getElementById("btn-next-question").focus();
            });
        }

        // オーバーレイの表示
        overlay.classList.add("active");
    }

    nextQuestion() {
        this.currentIndex++;
        if (this.currentIndex < this.questions.length) {
            this.loadQuestion();
        } else {
            // 全問終了 -> 結果画面へ
            this.showResult();
        }
    }

    // ----------------------------------------------------
    // ヒントシステム (段階的ヒントと警告)
    // ----------------------------------------------------
    showHint() {
        const q = this.questions[this.currentIndex];
        
        // すでに最後のヒント（答え）が表示されている、または入力無効時は何もしない
        if (this.currentHintsShown >= 3) return;

        if (this.currentHintsShown === 2) {
            // 次を表示すると「答え」になる場合の警告
            if (confirm("⚠️ 注意：次のヒントを表示すると「答え」が表示されて、この問題は不正解（ギブアップ）になるよ。本当に表示する？")) {
                this.currentHintsShown = 3;
                this.applyGiveUp(q);
            }
        } else {
            this.currentHintsShown++;
        }

        this.updateHintUI();
    }

    applyGiveUp(q) {
        // ギブアップフラグを問題オブジェクトに設定
        q.isGaveUp = true;

        // 入力欄を無効にして答えを代入
        const mfx = document.getElementById("mf-x");
        const mfy = document.getElementById("mf-y");
        
        mfx.value = q.displayAnswers.x;
        mfy.value = q.displayAnswers.y;
        
        mfx.setAttribute("disabled", "true");
        mfy.setAttribute("disabled", "true");

        // 自動的に決定処理へ
        setTimeout(() => {
            this.submitAnswer();
        }, 1200);
    }

    updateHintUI() {
        const q = this.questions[this.currentIndex];
        const hintBadge = document.getElementById("hint-counter");
        const hintDisplay = document.getElementById("hint-display");
        const btnHint = document.getElementById("btn-show-hint");

        const remaining = 3 - this.currentHintsShown;
        hintBadge.innerText = `のこり ${remaining}`;

        if (this.currentHintsShown === 0) {
            hintDisplay.innerHTML = `<div class="hint-step-msg">わからないときはヒントを使ってみよう！</div>`;
            btnHint.innerText = "ヒントをみる";
            btnHint.style.display = "block";
        } else {
            let html = "";
            if (this.currentHintsShown >= 1) {
                html += `<div class="hint-step"><b>【ヒント 1】</b><br>${q.hints[0]}</div>`;
            }
            if (this.currentHintsShown >= 2) {
                html += `<div class="hint-step"><b>【ヒント 2】</b><br>${q.hints[1]}</div>`;
            }
            if (this.currentHintsShown === 2) {
                html += `<div class="hint-step-warning">⚠️ 次のヒントは「答え」になるよ！</div>`;
            }
            if (this.currentHintsShown >= 3) {
                html += `<div class="hint-step hint-step-giveup"><b>【ギブアップ：答え】</b><br>\\(x = ${q.displayAnswers.x}\\)<br>\\(y = ${q.displayAnswers.y}\\)</div>`;
            }

            hintDisplay.innerHTML = `<div class="hint-scroll-container">${html}</div>`;

            // ボタンの表示テキスト切り替え
            if (this.currentHintsShown === 1) {
                btnHint.innerText = "次のヒントをみる";
                btnHint.style.display = "block";
            } else if (this.currentHintsShown === 2) {
                btnHint.innerText = "最後のヒント（答え）をみる";
                btnHint.style.display = "block";
            } else if (this.currentHintsShown === 3) {
                btnHint.style.display = "none";
            }

            // 新しく表示されたヒントへスムーズにスクロールする
            setTimeout(() => {
                hintDisplay.scrollTop = hintDisplay.scrollHeight;
            }, 50);
        }

        // 数式再描画
        MathJax.typesetPromise();
    }

    // ----------------------------------------------------
    // 結果画面 (screen-result)
    // ----------------------------------------------------
    showResult() {
        this.switchScreen("screen-result");

        const total = this.questions.length;
        const accuracy = Math.round((this.score / total) * 100);
        const isPassed = accuracy >= 80; // 8割以上で合格

        // スコア表示の更新
        let badgeName = "";
        if (this.currentCourse === "parentheses") badgeName = "コース1: カッコ";
        else if (this.currentCourse === "fraction_decimal") badgeName = "コース2: 分数・小数";
        else if (this.currentCourse === "abc") badgeName = "コース3: A = B = C";

        if (this.isReviewMode) badgeName += " (復習モード)";

        document.getElementById("result-course-badge").innerText = badgeName;
        document.getElementById("result-total-cnt").innerText = `${total}問`;
        document.getElementById("result-correct-cnt").innerText = `${this.score}問`;
        document.getElementById("result-accuracy").innerText = `${accuracy}%`;

        // 合格判定メッセージ
        const titleEl = document.getElementById("result-title");
        if (isPassed) {
            titleEl.innerText = "素晴らしい！合格です！💮";
            titleEl.style.color = "var(--accent-emerald)";
            
            // 紙吹雪エフェクト (多彩なカラーとバリエーション)
            this.triggerConfetti();
            this.playClearSound();
        } else {
            titleEl.innerText = "おしい！もう一度やってみよう！✊";
            titleEl.style.color = "var(--warning)";
        }

        // 通常モードのときのみ、記録と履歴を保存
        if (!this.isReviewMode) {
            // 最高記録の更新
            const prevBest = this.memHighScores[this.currentCourse] || 0;
            if (this.score > prevBest) {
                this.memHighScores[this.currentCourse] = this.score;
                this.saveScores();
            }

            // 履歴に保存
            const newHistoryItem = {
                course: this.currentCourse,
                score: this.score,
                total: total,
                isPassed: isPassed,
                date: new Date().toISOString()
            };
            this.memHistory.push(newHistoryItem);
            this.saveHistory();
            this.updateStartScreenUI();
        }

        // 「間違えた問題を復習」ボタンの活性化制御
        const btnReview = document.getElementById("btn-review-incorrect");
        if (this.incorrectQuestions.length > 0 && !this.isReviewMode) {
            btnReview.removeAttribute("disabled");
            btnReview.innerText = `間違えた問題を復習 (${this.incorrectQuestions.length}問)`;
        } else {
            btnReview.setAttribute("disabled", "true");
            btnReview.innerText = "間違えた問題を復習";
        }

        // 振り返りリストの生成
        this.renderReviewTable();
    }

    renderReviewTable() {
        const tbody = document.getElementById("review-list-body");
        tbody.innerHTML = "";

        this.questions.forEach((q, idx) => {
            const tr = document.createElement("tr");

            let ansStr = "";
            if (q.isGaveUp) {
                ansStr = "未回答 (ギブアップ)";
            } else {
                const ansX = q.userAnswer ? q.userAnswer.x : "";
                const ansY = q.userAnswer ? q.userAnswer.y : "";
                ansStr = ansX !== "" || ansY !== "" ? `x = ${ansX}, y = ${ansY}` : "未回答";
            }

            const correctStr = `x = ${q.displayAnswers.x}, y = ${q.displayAnswers.y}`;
            const resMark = q.isUserCorrect ? `<span style="color:var(--success);">💮</span>` : `<span style="color:var(--error);">❌</span>`;

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>\\(${q.equationLatex}\\)</td>
                <td>\\(${ansStr}\\)</td>
                <td>\\(${correctStr}\\)</td>
                <td class="rev-res">${resMark}</td>
            `;
            tbody.appendChild(tr);
        });

        // 数式再描画
        MathJax.typesetPromise();
    }

    // ----------------------------------------------------
    // 復習モード (間違えた問題のみ)
    // ----------------------------------------------------
    startReviewMode() {
        if (this.incorrectQuestions.length === 0) return;

        this.isReviewMode = true;
        
        // 間違えた問題をディープコピーして復習用に再セット
        this.questions = this.incorrectQuestions.map(q => {
            return {
                id: q.id,
                type: q.type,
                equationLatex: q.equationLatex,
                answers: { x: q.answers.x, y: q.answers.y },
                displayAnswers: { x: q.displayAnswers.x, y: q.displayAnswers.y },
                hints: [...q.hints],
                explanation: q.explanation
            };
        });

        this.currentIndex = 0;
        this.score = 0;
        this.incorrectQuestions = []; // 復習モードの中でさらに間違えた場合は再ストックしない（クリア前提）

        this.startDrill();
    }

    retrySameCourse() {
        this.selectCourse(this.currentCourse);
    }

    quitDrill() {
        if (confirm("途中でホームに戻りますか？\n（これまでの解答記録は保存されません）")) {
            this.goHome();
        }
    }

    goHome() {
        this.switchScreen("screen-start");
    }

    // ----------------------------------------------------
    // ユーティリティ & 演出
    // ----------------------------------------------------
    switchScreen(screenId) {
        const screens = document.querySelectorAll(".screen");
        screens.forEach(s => s.classList.remove("active"));
        
        const target = document.getElementById(screenId);
        if (target) target.classList.add("active");
    }

    // 多様な紙吹雪演出
    triggerConfetti() {
        try {
            const duration = 2.5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // 両端から紙吹雪を打ち上げる
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        } catch (e) {
            console.warn("紙吹雪ライブラリの呼び出しに失敗しました:", e);
        }
    }

    // MathLive 出力の正規化 (表記揺れ吸収)
    normalizeLatex(latex) {
        if (!latex) return '';
        let s = latex.replace(/\s+/g, ''); // 空白を削除
        
        // 不要なコマンドの削除
        s = s.replace(/\\left|\\right|\\mleft|\\mright|\\,|\\cdot|\\operatorname/g, '');
        
        // 記号の統一
        s = s.replace(/\\pm/g, '±')
             .replace(/\\lt/g, '<').replace(/\\gt/g, '>')
             .replace(/\\le/g, '≤').replace(/\\ge/g, '≥');
        
        // ブレースの省略を補完
        s = s.replace(/\\frac([^{])([^{])/g, '\\frac{$1}{$2}');
        s = s.replace(/\\frac{([^{])}([^{])/g, '\\frac{$1}{$2}');
        s = s.replace(/\\frac([^{]){([^{]+)}/g, '\\frac{$1}{$2}');
        
        // 負の分数の表記揺れ ( -\frac{a}{b} と \frac{-a}{b} の統一 )
        s = s.replace(/-\\frac{([^}]+)}{([^}]+)}/g, '\\frac{-$1}{$2}');
        
        s = s.replace(/\^([^{])/g, '^{$1}');
        return s;
    }

    // ----------------------------------------------------
    // シンセサイザーによる音声効果 (Web Audio API)
    // ----------------------------------------------------
    playTone(frequency, type, duration, startTimeOffset = 0) {
        if (!this.audioCtx) return;
        
        try {
            // AudioContext が停止状態なら再開
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime + startTimeOffset);

            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime + startTimeOffset);
            // 音がフェードアウトするように制御
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + startTimeOffset + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(this.audioCtx.currentTime + startTimeOffset);
            osc.stop(this.audioCtx.currentTime + startTimeOffset + duration);
        } catch (e) {
            console.warn("効果音再生エラー:", e);
        }
    }

    playCorrectSound() {
        // ピコーン！のような2音階の澄んだ音
        this.playTone(523.25, "sine", 0.1, 0); // ド (C5)
        setTimeout(() => {
            this.playTone(659.25, "sine", 0.25, 0); // ミ (E5)
        }, 80);
    }

    playIncorrectSound() {
        // ブー！のような濁った低い音
        this.playTone(180, "sawtooth", 0.35);
    }

    playClearSound() {
        // パララパー！のような華やかなアルペジオ音
        const notes = [261.63, 329.63, 392.00, 523.25]; // ドミソド (C4, E4, G4, C5)
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, "triangle", 0.4);
            }, idx * 100);
        });
    }

    // ----------------------------------------------------
    // ✏️ 手書き計算スペース (キャンバス制御)
    // ----------------------------------------------------
    initScratchpad() {
        const canvas = document.getElementById("scratchpad-canvas");
        if (!canvas) return;

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        // リサイズ時のリサイズ処理登録
        window.addEventListener("resize", () => this.resizeCanvas());

        // マウス描画イベント
        canvas.addEventListener("mousedown", (e) => this.startDrawing(e));
        canvas.addEventListener("mousemove", (e) => this.draw(e));
        canvas.addEventListener("mouseup", () => this.stopDrawing());
        canvas.addEventListener("mouseout", () => this.stopDrawing());

        // タッチ描画イベント (スマートフォン・タブレット / Chromebookのタッチスクリーン対応)
        canvas.addEventListener("touchstart", (e) => this.startDrawingTouch(e), { passive: false });
        canvas.addEventListener("touchmove", (e) => this.drawTouch(e), { passive: false });
        canvas.addEventListener("touchend", () => this.stopDrawing());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        
        // デバイスのピクセル解像度比率（Retina等高精細対応）
        const dpr = window.devicePixelRatio || 1;
        
        // 内部の解像度を決定
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // 描画座標をスケーリング
        this.ctx.scale(dpr, dpr);
        
        // ペン先のスタイルを設定（見やすいシアン色、適度な太さ）
        this.ctx.strokeStyle = "#38bdf8"; // 明るいスカイブルー
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    startDrawingTouch(e) {
        e.preventDefault(); // タッチ操作によるブラウザのスクロールを防ぐ
        this.isDrawing = true;
        const pos = this.getTouchPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    drawTouch(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const pos = this.getTouchPos(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearScratchpad() {
        if (!this.canvas || !this.ctx) return;
        // Canvasを透明にクリア
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    }
}

// アプリのグローバルインスタンス
window.app = new App();

// 読み込み完了時に初期化を実行
window.addEventListener("DOMContentLoaded", () => {
    window.app.init();
});

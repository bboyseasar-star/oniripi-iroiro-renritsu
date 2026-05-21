/**
 * 鬼リピ〜色々な連立方程式〜 問題生成エンジン
 * 
 * すべての問題は、まず「答え (x, y) が綺麗な整数」になるように設計し、
 * そこから逆算して方程式の係数や定数を決定します。
 */

// ユーティリティ関数
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 0以外のランダムな整数を取得
function getRandomNonZeroInt(min, max) {
    let val = 0;
    while (val === 0) {
        val = getRandomInt(min, max);
    }
    return val;
}

// 最大公約数
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// 最小公倍数
function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

// 分数をきれいにフォーマットする
function formatFraction(num, den) {
    if (den < 0) {
        num = -num;
        den = -den;
    }
    const g = gcd(num, den);
    num = num / g;
    den = den / g;

    if (den === 1) {
        return `${num}`;
    }
    if (num < 0) {
        return `-\\frac{${Math.abs(num)}}{${den}}`;
    }
    return `\\frac{${num}}{${den}}`;
}

// 係数の表示用LaTeXフォーマット (1x -> x, -1x -> -x, 0x -> "")
function formatTerm(coef, variable, isFirst = false) {
    if (coef === 0) return "";
    let term = "";
    if (coef === 1) {
        term = variable;
    } else if (coef === -1) {
        term = "-" + variable;
    } else {
        term = coef + variable;
    }

    if (coef > 0 && !isFirst) {
        return "+" + term;
    }
    return term;
}

// 数式の符号表示
function formatSign(val) {
    return val >= 0 ? `+ ${val}` : `- ${Math.abs(val)}`;
}

// 連立方程式の LaTeX を生成する
function makeSystemLatex(eq1, eq2) {
    return `\\begin{cases} ${eq1} \\\\ ${eq2} \\end{cases}`;
}

// 問題生成オブジェクト
const QuestionGenerator = {
    // ----------------------------------------------------
    // コース1: カッコあり (Parentheses)
    // ----------------------------------------------------
    generateParentheses: function(id) {
        // x, y を -5〜5 の整数で決定 (両方0は避ける)
        let x = getRandomNonZeroInt(-5, 5);
        let y = getRandomNonZeroInt(-5, 5);
        
        // 2つのパターンを用意
        const pattern = getRandomInt(1, 2);
        let eq1 = "", eq2 = "";
        let hints = [];
        let explanation = "";

        if (pattern === 1) {
            // パターン1: 
            // ① ax + by = c
            // ② dx + e(fx + gy) = h
            
            // 式①の生成
            const a = getRandomNonZeroInt(-4, 4);
            const b = getRandomNonZeroInt(-4, 4);
            const c = a * x + b * y;
            const eq1Str = `${formatTerm(a, "x", true)} ${formatTerm(b, "y")} = ${c}`;

            // 式②の生成
            const d = getRandomInt(-3, 3); // 0もあり
            const e = getRandomNonZeroInt(-3, 3);
            const f = getRandomNonZeroInt(-2, 2);
            const g = getRandomNonZeroInt(-2, 2);
            const h = d * x + e * (f * x + g * y);
            
            // ②の表示: dx + e(fx + gy) = h (d=0の場合は xの項なし)
            const dTerm = d !== 0 ? formatTerm(d, "x", true) : "";
            
            // e === 1 または -1 の場合の省略ルールを適用
            let eSign = "";
            if (e === 1) {
                eSign = d !== 0 ? "+" : "";
            } else if (e === -1) {
                eSign = "-";
            } else if (e > 0) {
                eSign = (d !== 0 ? "+" : "") + e;
            } else {
                eSign = String(e);
            }

            const inner = `${formatTerm(f, "x", true)} ${formatTerm(g, "y")}`;
            const eq2Str = `${dTerm}${eSign}(${inner}) = ${h}`;

            eq1 = eq1Str;
            eq2 = eq2Str;

            // 解説の作成
            const step2ExpandedCoefX = d + e * f;
            const step2ExpandedCoefY = e * g;
            const eq2ExpandedStr = `${formatTerm(step2ExpandedCoefX, "x", true)} ${formatTerm(step2ExpandedCoefY, "y")} = ${h}`;

            hints = [
                `まずはカッコがあるほうの式を整理しよう！<br>下の式のかっこを外すと：<br>\\(${dTerm} ${formatSign(e * f)}x ${formatSign(e * g)}y = ${h}\\)<br>同類項をまとめると、\\(${eq2ExpandedStr}\\) になるよ。`,
                `整理した2つの式で連立方程式を解こう！<br>\\(\\begin{cases} ${eq1Str} \\\\ ${eq2ExpandedStr} \\end{cases}\\)<br>加減法（または代入法）で \\(x\\) か \\(y\\) のどちらかを消去して解いてみてね。`,
                `⚠️ 次のヒントは「答え」になるよ！<br>もう一度計算を確認してみよう。`
            ];

            explanation = `<b>【解き方の手順】</b><br>` +
                `1. カッコのある式を外して同類項を整理します。<br>` +
                `　　\\(${eq2Str}\\)<br>` +
                `　　\\(${dTerm} ${formatSign(e * f)}x ${formatSign(e * g)}y = ${h}\\)<br>` +
                `　　\\(${eq2ExpandedStr}\\) ── ②'<br><br>` +
                `2. 整理した連立方程式を解きます。<br>` +
                `　　\\(\\begin{cases} ${eq1Str} ── ① \\\\ ${eq2ExpandedStr} ── ②' \\end{cases}\\)<br>` +
                `　　これを解くと、<b>\\(x = ${x}\\), \\(y = ${y}\\)</b> となります。`;

        } else {
            // パターン2: 
            // ① ax + by = c
            // ② x = d(ey - f) + g (代入法に適した形)
            
            // 式①の生成
            const a = getRandomNonZeroInt(-3, 3);
            const b = getRandomNonZeroInt(-3, 3);
            const c = a * x + b * y;
            const eq1Str = `${formatTerm(a, "x", true)} ${formatTerm(b, "y")} = ${c}`;

            // 式②の生成
            const d = getRandomNonZeroInt(-3, 3);
            const e = getRandomNonZeroInt(-2, 2);
            const f = getRandomInt(-5, 5); // 0もあり
            const g = x - d * (e * y - f); // gを逆算してxに合わせる
            
            // ②の表示: x = d(ey - f) + g
            const inner = `${formatTerm(e, "y", true)} ${f >= 0 ? `- ${f}` : `+ ${Math.abs(f)}`}`;
            const gTerm = g !== 0 ? (g > 0 ? `+ ${g}` : `- ${Math.abs(g)}`) : "";
            
            // d === 1 または -1 の省略ルールを適用
            let dPrefix = "";
            if (d === 1) {
                dPrefix = "";
            } else if (d === -1) {
                dPrefix = "-";
            } else {
                dPrefix = String(d);
            }
            const eq2Str = `x = ${dPrefix}(${inner}) ${gTerm}`;

            eq1 = eq1Str;
            eq2 = eq2Str;

            // カッコを展開した式
            const step2ExpandedCoefY = d * e;
            const step2Const = -d * f + g;
            const eq2ExpandedStr = `x = ${formatTerm(step2ExpandedCoefY, "y", true)} ${step2Const >= 0 ? `+ ${step2Const}` : `- ${Math.abs(step2Const)}`}`;

            hints = [
                `下の式のかっこを外して、\\(x = \\dots\\) の形を整理しよう！<br>かっこを外すと：<br>\\(x = ${d * e}y ${step2Const >= 0 ? `+ ${d * -f}` : `- ${Math.abs(d * -f)}`} ${gTerm !== "" ? gTerm : ""}\\)<br>整理すると \\(${eq2ExpandedStr}\\) になるよ。`,
                `整理した \\(x = ${eq2ExpandedStr.split("=")[1]}\\) を上の式の \\(x\\) に代入（代入法）して解こう！<br>\\(${a !== 1 ? a : ""}(${eq2ExpandedStr.split("=")[1]}) ${formatTerm(b, "y")} = ${c}\\)<br>これで \\(y\\) だけの方程式になるね。`,
                `⚠️ 次のヒントは「答え」になるよ！<br>代入したあとの計算をゆっくり解き直してみよう。`
            ];

            explanation = `<b>【解き方の手順】</b><br>` +
                `1. 下の式のかっこを外して整理します。<br>` +
                `　　\\(${eq2Str}\\)<br>` +
                `　　\\(${eq2ExpandedStr}\\) ── ②'<br><br>` +
                `2. ②' を ① \\(${eq1Str}\\) の \\(x\\) に代入します。<br>` +
                `　　\\(${a}(${eq2ExpandedStr.split("=")[1]}) ${formatTerm(b, "y")} = ${c}\\)<br>` +
                `　　これを解くと \\(y = ${y}\\) となります。<br><br>` +
                `3. \\(y = ${y}\\) を ②' に代入して \\(x\\) を求めます。<br>` +
                `　　\\(x = ${d * e} \\times (${y}) ${step2Const >= 0 ? `+ ${step2Const}` : `- ${Math.abs(step2Const)}`} = ${x}\\)<br>` +
                `　　よって、<b>\\(x = ${x}\\), \\(y = ${y}\\)</b> となります。`;
        }

        return {
            id: `parentheses_${id}_${Date.now()}`,
            type: "parentheses",
            equationLatex: makeSystemLatex(eq1, eq2),
            answers: {
                x: String(x),
                y: String(y)
            },
            displayAnswers: {
                x: String(x),
                y: String(y)
            },
            hints: hints,
            explanation: explanation
        };
    },

    // ----------------------------------------------------
    // コース2: 分数＆小数 (Fractions and Decimals)
    // ----------------------------------------------------
    generateFractionDecimal: function(id) {
        let x = getRandomNonZeroInt(-5, 5);
        let y = getRandomNonZeroInt(-5, 5);
        
        // 分数問題か小数問題かを 50% ずつ生成
        const isFraction = Math.random() < 0.5;
        let eq1 = "", eq2 = "";
        let hints = [];
        let explanation = "";

        if (isFraction) {
            // パターン1: 分数問題
            // ① ax + by = c (普通の式)
            // ② (d/p)x + (e/q)y = f (分数を含む式)
            
            const a = getRandomNonZeroInt(-3, 3);
            const b = getRandomNonZeroInt(-3, 3);
            const c = a * x + b * y;
            const eq1Str = `${formatTerm(a, "x", true)} ${formatTerm(b, "y")} = ${c}`;

            // 分母 p, q を 2, 3, 4, 6 などから選ぶ
            const denominators = [2, 3, 4, 5, 6];
            const p = denominators[getRandomInt(0, denominators.length - 1)];
            let q = denominators[getRandomInt(0, denominators.length - 1)];
            // 分母が同じだと少し単調なので、違う分母にする確率を上げる
            if (p === q && Math.random() < 0.7) {
                q = denominators[(denominators.indexOf(p) + 1) % denominators.length];
            }

            const d = getRandomNonZeroInt(-3, 3);
            const e = getRandomNonZeroInt(-3, 3);
            
            // f = (d*x)/p + (e*y)/q を分数計算
            const numF = d * x * q + e * y * p;
            const denF = p * q;
            const fLatex = formatFraction(numF, denF);

            // 表示用の分数式
            const xFrac = formatFraction(d, p);
            const yFrac = formatFraction(e, q);
            
            // xFrac や yFrac にマイナスがある場合のフォーマット
            let xTerm = "";
            if (xFrac.startsWith("-")) {
                xTerm = `-\\frac{${Math.abs(d)}}{${p}}x`;
            } else {
                xTerm = `\\frac{${d}}{${p}}x`;
            }

            let yTerm = "";
            if (yFrac.startsWith("-")) {
                yTerm = `-\\frac{${Math.abs(e)}}{${q}}y`;
            } else {
                yTerm = `+\\frac{${e}}{${q}}y`;
            }

            const eq2Str = `${xTerm} ${yTerm} = ${fLatex}`;

            eq1 = eq1Str;
            eq2 = eq2Str;

            // 最小公倍数
            const commonMult = lcm(p, q);
            // 両辺を commonMult 倍したときの整数係数
            const step2CoefX = (d * commonMult) / p;
            const step2CoefY = (e * commonMult) / q;
            // 右辺の計算
            const step2Const = (numF * commonMult) / denF; // 分数同士を掛けるので確実に整数になる

            const eq2IntegerStr = `${formatTerm(step2CoefX, "x", true)} ${formatTerm(step2CoefY, "y")} = ${step2Const}`;

            hints = [
                `分数がある式（下の式）の分母を払って、整数だけの式に直そう！<br>分母の ${p} と ${q} の最小公倍数である <b>${commonMult}</b> を、式の両辺に掛け算してみてね。`,
                `下の式の両辺に <b>${commonMult}</b> を掛けて整理すると：<br>\\(${eq2IntegerStr}\\)<br>これで普通の連立方程式 \\(\\begin{cases} ${eq1Str} \\\\ ${eq2IntegerStr} \\end{cases}\\) になるよ！`,
                `⚠️ 次のヒントは「答え」になるよ！<br>分数を整数に直したあとの加減法の計算を見直してみよう。`
            ];

            explanation = `<b>【解き方の手順】</b><br>` +
                `1. 分数を含む下の式の両辺に、分母 ${p} と ${q} の最小公倍数である <b>${commonMult}</b> を掛けて分母を払います。<br>` +
                `　　\\(\\left(${xTerm} ${yTerm}\\right) \\times ${commonMult} = ${fLatex} \\times ${commonMult}\\)<br>` +
                `　　\\(${eq2IntegerStr}\\) ── ②'<br><br>` +
                `2. 整数になった連立方程式を解きます。<br>` +
                `　　\\(\\begin{cases} ${eq1Str} ── ① \\\\ ${eq2IntegerStr} ── ②' \\end{cases}\\)<br>` +
                `　　これを解くと、<b>\\(x = ${x}\\), \\(y = ${y}\\)</b> となります。`;

        } else {
            // パターン2: 小数問題
            // ① 0.ax + 0.by = c
            // ② dx + ey = f
            
            const a = getRandomNonZeroInt(-8, 8);
            let b = getRandomNonZeroInt(-8, 8);
            if (a === b) b = -a; // 係数をバラす
            
            // c = 0.a * x + 0.b * y (小数第1位まで)
            const cVal = (a * x + b * y) / 10;
            const eq1Str = `${(a/10).toFixed(1)}x ${(b/10) >= 0 ? `+ ${(b/10).toFixed(1)}` : `- ${Math.abs(b/10).toFixed(1)}`}y = ${cVal.toFixed(1)}`;

            const d = getRandomNonZeroInt(-4, 4);
            const e = getRandomNonZeroInt(-4, 4);
            const f = d * x + e * y;
            const eq2Str = `${formatTerm(d, "x", true)} ${formatTerm(e, "y")} = ${f}`;

            eq1 = eq1Str;
            eq2 = eq2Str;

            const eq1IntegerStr = `${formatTerm(a, "x", true)} ${formatTerm(b, "y")} = ${a * x + b * y}`;

            hints = [
                `小数がある式（上の式）の両辺を <b>10倍</b> して、整数だけの式に直そう！<br>\\(${eq1Str}\\) のすべての項を10倍するとどうなるかな？`,
                `上の式を10倍して整理すると：<br>\\(${eq1IntegerStr}\\)<br>これで普通の連立方程式 \\(\\begin{cases} ${eq1IntegerStr} \\\\ ${eq2Str} \\end{cases}\\) になるよ！`,
                `⚠️ 次のヒントは「答え」になるよ！<br>小数を整数に直したあとの加減法の計算を見直してみよう。`
            ];

            explanation = `<b>【解き方の手順】</b><br>` +
                `1. 小数を含む上の式の両辺に <b>10</b> を掛けて整数にします。<br>` +
                `　　\\((${eq1Str}) \\times 10 = ${cVal.toFixed(1)} \\times 10\\)<br>` +
                `　　\\(${eq1IntegerStr}\\) ── ①'<br><br>` +
                `2. 整数になった連立方程式を解きます。<br>` +
                `　　\\(\\begin{cases} ${eq1IntegerStr} ── ①' \\\\ ${eq2Str} ── ② \\end{cases}\\)<br>` +
                `　　これを解くと、<b>\\(x = ${x}\\), \\(y = ${y}\\)</b> となります。`;
        }

        return {
            id: `frac_dec_${id}_${Date.now()}`,
            type: "fraction_decimal",
            equationLatex: makeSystemLatex(eq1, eq2),
            answers: {
                x: String(x),
                y: String(y)
            },
            displayAnswers: {
                x: String(x),
                y: String(y)
            },
            hints: hints,
            explanation: explanation
        };
    },

    // ----------------------------------------------------
    // コース3: A＝B＝C (A=B=C type)
    // ----------------------------------------------------
    generateAbc: function(id) {
        let x = getRandomNonZeroInt(-5, 5);
        let y = getRandomNonZeroInt(-5, 5);
        
        // 2つのパターン (定数あり / 3つとも式)
        const pattern = getRandomInt(1, 2);
        let equationLatex = "";
        let hints = [];
        let explanation = "";

        if (pattern === 1) {
            // パターン1: Ax + By = Cx + Dy = E
            // 例: 2x + y = x + 3y = 5
            
            const a = getRandomNonZeroInt(-3, 3);
            const b = getRandomNonZeroInt(-3, 3);
            const eVal = a * x + b * y; // 定数項 E
            
            // C を選び、D = (E - C*x)/y が整数になるように決定
            let c = 0;
            let d = 0;
            let found = false;
            
            // 無限ループ防止用のカウンター
            let attempts = 0;
            while (!found && attempts < 50) {
                c = getRandomNonZeroInt(-3, 3);
                if (c === a) continue; // 同じ係数は避ける
                
                const numerator = eVal - c * x;
                if (numerator % y === 0) {
                    d = numerator / y;
                    if (d !== b && d !== 0) {
                        found = true;
                    }
                }
                attempts++;
            }
            
            // もし見つからなかった場合のデフォルト（手動フォールバック）
            if (!found) {
                c = a + 1;
                d = (eVal - c * x) / y; // 確実に割り切れるとは限らないが、最後の手段として再決定
                x = 2; y = 1; // 綺麗な値に固定
                // eVal = a*2 + b*1, c*2 + d*1 = eVal => d = eVal - 2c
                const fixedE = a * 2 + b * 1;
                c = a - 1;
                d = fixedE - 2 * c;
            }

            const termAStr = `${formatTerm(a, "x", true)} ${formatTerm(b, "y")}`;
            const termBStr = `${formatTerm(c, "x", true)} ${formatTerm(d, "y")}`;
            equationLatex = `${termAStr} = ${termBStr} = ${eVal}`;

            hints = [
                `\\(A = B = C\\) の形は、\\(A = C\\) と \\(B = C\\) という2つの式に分けるのが一番簡単だよ！<br>この問題なら、<b>「(左の式) = ${eVal}」</b> と <b>「(真ん中の式) = ${eVal}」</b> に分けてみよう。`,
                `分けた2つの式を連立方程式の形に並べると：<br>\\(\\begin{cases} ${termAStr} = ${eVal} \\\\ ${termBStr} = ${eVal} \\end{cases}\\)<br>これなら普通の連立方程式として解けるね！`,
                `⚠️ 次のヒントは「答え」になるよ！<br>分けた連立方程式の計算をゆっくり確かめてみよう。`
            ];

            explanation = `<b>【解き方の手順】</b><br>` +
                `1. \\(A = B = C\\) の式を、解きやすいように \\(A = C\\), \\(B = C\\) の2つの方程式に分けます。<br>` +
                `　　\\(${termAStr} = ${eVal}\\) ── ①<br>` +
                `　　\\(${termBStr} = ${eVal}\\) ── ②<br><br>` +
                `2. 作成した連立方程式を解きます。<br>` +
                `　　\\(\\begin{cases} ${termAStr} = ${eVal} \\\\ ${termBStr} = ${eVal} \\end{cases}\\)<br>` +
                `　　これを解くと、<b>\\(x = ${x}\\), \\(y = ${y}\\)</b> となります。`;

        } else {
            // パターン2: Ax + By + C = Dx + Ey + F = Gx + Hy + I
            // 例: x + y + 8 = 5x + y = 3x - y (すべてが 0 に等しくなるように逆算)
            // 共通の値 V を決めてから 3辺を構築する
            
            const vVal = getRandomInt(-5, 5); // 共通の値
            
            // 式1: Ax + By + C = V => C = V - (Ax + By)
            const a = getRandomNonZeroInt(-2, 2);
            const b = getRandomNonZeroInt(-2, 2);
            const c = vVal - (a * x + b * y);
            
            // 式2: Dx + Ey + F = V => F = V - (Dx + Ey)
            let d = getRandomNonZeroInt(-2, 2);
            let e = getRandomNonZeroInt(-2, 2);
            if (d === a && e === b) d = -a; // 重複を避ける
            const f = vVal - (d * x + e * y);

            // 式3: Gx + Hy + I = V => I = V - (Gx + Hy)
            let g = getRandomNonZeroInt(-2, 2);
            let h = getRandomNonZeroInt(-2, 2);
            while ((g === a && h === b) || (g === d && h === e)) {
                g = getRandomNonZeroInt(-2, 2);
                h = getRandomNonZeroInt(-2, 2);
            }
            const i = vVal - (g * x + h * y);

            const termAStr = `${formatTerm(a, "x", true)} ${formatTerm(b, "y")} ${c !== 0 ? (c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`) : ""}`;
            const termBStr = `${formatTerm(d, "x", true)} ${formatTerm(e, "y")} ${f !== 0 ? (f > 0 ? `+ ${f}` : `- ${Math.abs(f)}`) : ""}`;
            const termCStr = `${formatTerm(g, "x", true)} ${formatTerm(h, "y")} ${i !== 0 ? (i > 0 ? `+ ${i}` : `- ${Math.abs(i)}`) : ""}`;

            equationLatex = `${termAStr} = ${termBStr} = ${termCStr}`;

            // 連立方程式の組み合わせ例 (A = B と B = C に分ける)
            const eq1Str = `${formatTerm(a - d, "x", true)} ${formatTerm(b - e, "y")} = ${f - c}`;
            const eq2Str = `${formatTerm(d - g, "x", true)} ${formatTerm(e - h, "y")} = ${i - f}`;

            hints = [
                `3つとも式になっている \\(A = B = C\\) は、好きな組み合わせで2つの等式を作ろう！<br>例えば、<b>「(左) = (真ん中)」</b> と <b>「(真ん中) = (右)」</b> の2つにするのが王道だよ。`,
                `作った2つの式を整理して連立方程式にしよう！<br>` +
                `・\\(${termAStr} = ${termBStr}\\) を整理すると \\(${eq1Str}\\)<br>` +
                `・\\(${termBStr} = ${termCStr}\\) を整理すると \\(${eq2Str}\\)<br>` +
                `この2つを連立方程式 \\(\\begin{cases} ${eq1Str} \\\\ ${eq2Str} \\end{cases}\\) として解いてみよう！`,
                `⚠️ 次のヒントは「答え」になるよ！<br>文字を左辺に、数字を右辺に集める整理の計算が合っているか確認しよう。`
            ];

            explanation = `<b>【解き方の手順】</b><br>` +
                `1. \\(A = B = C\\) から2つの等式 \\(A = B\\), \\(B = C\\) を作ります。<br>` +
                `　　・\\(${termAStr} = ${termBStr}\\)<br>` +
                `　　・\\(${termBStr} = ${termCStr}\\)<br><br>` +
                `2. それぞれ文字の項を左辺に、定数項を右辺に移項して整理します。<br>` +
                `　　\\(${eq1Str}\\) ── ①<br>` +
                `　　\\(${eq2Str}\\) ── ②<br><br>` +
                `3. 作成した連立方程式を解きます。<br>` +
                `　　\\(\\begin{cases} ${eq1Str} \\\\ ${eq2Str} \\end{cases}\\)<br>` +
                `　　これを解くと、<b>\\(x = ${x}\\), \\(y = ${y}\\)</b> となります。`;
        }

        return {
            id: `abc_${id}_${Date.now()}`,
            type: "abc",
            equationLatex: equationLatex,
            answers: {
                x: String(x),
                y: String(y)
            },
            displayAnswers: {
                x: String(x),
                y: String(y)
            },
            hints: hints,
            explanation: explanation
        };
    },

    // 指定されたコースの問題を生成する
    generateSet: function(course, count = 5) {
        const questions = [];
        for (let i = 0; i < count; i++) {
            if (course === "parentheses") {
                questions.push(this.generateParentheses(i + 1));
            } else if (course === "fraction_decimal") {
                questions.push(this.generateFractionDecimal(i + 1));
            } else if (course === "abc") {
                questions.push(this.generateAbc(i + 1));
            }
        }
        return questions;
    }
};

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestionGenerator };
} else {
    window.QuestionGenerator = QuestionGenerator;
}

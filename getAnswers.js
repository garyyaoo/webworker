doPage();

async function doPage() {
    var school = 'UBC';

    var processed = document.createElement('html');
    processed.innerHTML = document.documentElement.innerHTML;

    var tempOptions = [];
    var options = [];
    processed.querySelectorAll('label').forEach((label) => {
        var answerId = label.children[0].getAttribute("aria-label");
        var value = label.innerText.toString().replace(/\[math\]/g, '');
        
        if (tempOptions.length == 0) {
            tempOptions.push({
                answerId: answerId,
                value: value
            });
        } else if (tempOptions[0].answerId.includes(answerId.substr(0, 8))) {
            tempOptions.push({
                answerId: answerId,
                value: value
            });
        } else {
            options.push(tempOptions);
            tempOptions = [];
            tempOptions.push({
                answerId: answerId,

                value: value
            });
        }
    });
    options.push(tempOptions);

    var query = getQueryFromQuestions(
        findQuestion(processed.getElementsByClassName('problem-content')[0].innerHTML),
        school);

    var responseJSON = await (await fetch(query)).json();

    var fileName = responseJSON.items[0].path;
    var fileReturn = await (await fetch('https://api.github.com/repos/openwebwork/webwork-open-problem-library/contents/' + fileName)).json();
    var contentJSON = atob(fileReturn.content);

    const {mcNames, answers} = getObjectsFromFile(contentJSON);

    var correctAnswers = [];

    answers.forEach((ansArr, currentIndex) => {
        ansArr.forEach((ans) => {
            options[currentIndex].forEach((option) => {
                if (noWSSlash(option.value).includes(noWSSlash(ans))) {
                    correctAnswers.push(option.answerId);
                }
            });
        });
    });

    if (correctAnswers.length > 0) {
        document.querySelectorAll('INPUT').forEach((input) => {
            if (input.type.includes('checkbox') || input.type.includes('radio')) {
                input.checked = false;
            }
        })

        document.querySelectorAll('INPUT').forEach((input) => {
            if (input.type.includes('checkbox') || input.type.includes('radio')) {
                correctAnswers.forEach((correctAnswer) => {
                    if (noWS(correctAnswer).includes(noWS(input.getAttribute('aria-label')))) {
                        input.checked = true;
                    }
                })
            }
        })

        chrome.runtime.sendMessage({
            action: "success"
        });
    } else {
        chrome.runtime.sendMessage({
            action: "failure"
        });
    }
};

function findQuestion(content) {
    var cleaned = replaceAll(content.toString(), '(<script[\\s\\S]*?script>)\|(<span[\\s\\S]*?span>)', ' ');
    cleaned = replaceAll(cleaned, '<\/[\\s\\S]*?>', '');
    cleaned = /(?<=div>)[\s\S]*?(?=<br>)/.exec(cleaned)[0];
    cleaned = replaceAll(cleaned, '\\n', '  ');
    cleaned = replaceAll(cleaned, '\\.', ' ');
    return cleaned.split(/\s\s+/).filter((v) => v === "" ? false : true);
    
}

function getQueryFromQuestions(questions, school) {
    var maxChar = 127;
    var maxQuery = 5;
    questions.sort((a, b) => b.length - a.length);
    return  'https://api.github.com/search/code?q='
         + questions.reduce((query, string) => {
            if (maxChar < 4 || maxQuery == 0) {maxChar = 0; maxQuery = 5; return query;}
            if (maxQuery >0 && string.length+3 < maxChar) {
                maxChar -= string.length+3; maxQuery--;
                return query +'"' + string +'"+';
            } 
            if (maxQuery >0 && string.length +3 > maxChar) {
                maxQuery =0;
                var ret = string.substring(0, maxChar-3);
                if (ret.lastIndexOf(' ') === -1) {
                    return query + '+';
                }
                ret = ret.substring(0, ret.lastIndexOf(' '));
                maxChar = 0;
                return query + '"'+ret+'"+';
            }
        }, '')
        + 'in:file+extension:pg+repo:openwebwork/webwork-open-problem-library+path:OpenProblemLibrary/'+ school;
}

function getObjectsFromFile(page) {

    var validQuestionsRegex = /\$.*?(new_multiple_choice|new_checkbox_multiple_choice).*?;/g;
    var mcs = page.match(validQuestionsRegex);
    var mcNames = mcs.map((mc) => mc.match(/(?<=\$).*(?=\=)/)[0].trim());

    var references = mcNames.map((mc) => {
        var reg = '(\\$'+ escapeRegExp(mc) + ').*?(\\;)'
        return page.match(new RegExp(reg, 'gs'));
    })

    var ans = mcNames.map((mc) => {
        var reg = '(\\$'+ escapeRegExp(mc) + ').*?(\\;)';
        var answers = page.match(new RegExp(reg, 'gs'))
            .filter((ref) => ref.includes("qa"))[0];
        answers = answers.substr(answers.indexOf('"', answers.indexOf('"')+1) + 2).split(",")
            .filter((a) => !(a.includes(';') && a.length <3))
            .map((a) => a.replace(/\$BR/, '').trim());
        answers[answers.length-1] = answers[answers.length-1].substr(0, answers[answers.length-1].lastIndexOf(')'));

        return answers.map((a) => {
            if (a.includes('$') && a.includes('[')) {
                var id = a.match(/(?<=\$).*?(?=\[)/)[0];
                var answersList = page.match(new RegExp('\\@' + id + '.*?;', 's'))[0];
                answersList = noWSNewline(answersList.substr(answersList.indexOf('(')+1)).split(',').filter((a) => !(a.includes(';') && a.length <3));
                answersList[answersList.length-1] = answersList[answersList.length-1].substr(0, answersList[answersList.length-1].lastIndexOf(')'));
                answersList = answersList.map((an) => an.replace(/\"/g, ''));

                var index = parseInt(a.match(/(?<=\[).*?(?=\])/)[0]);
                
                var correct = answersList[index];
                return correct;
            } else if (a.includes('$')) {
                var def = page.match(new RegExp('\\' + a + '.*?;', 's'))[0];
                return def.match(/(?<=\=).*?(?=\;)/);
            } else {
                return a;
            }
        });
    });

    return {
        mcNames: mcNames,
        answers: ans
    }
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(find, 'g'), replace);
}

function noWSNewline(input) {
    return input.replace(new RegExp('\\n|\\s', 'g'), '');
}

function noWSSlash(input) {
    return input.replace(/\s/g, '').replace(/\\[()]/g, '');
}

function noWS(input) {
    return input.replace(/\s/g, '');
}


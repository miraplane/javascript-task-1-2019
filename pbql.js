'use strict';

function findCommand(command, word, prev) {
    let find = false;
    for (let i = 0; i < command.word.length; i++) {
        if (command.word[i].test(word) && command.prev[i].includes(prev.index)) {
            find = true;
            prev.index = i;
            break;
        }
    }

    return find;
}

function isThisCommand(command, words) {
    let index = 0;
    let prev = { index: -1 };
    for (let j = 0; j < words.length; j++) {
        if (! findCommand(command, words[j], prev)) {
            return index + 1;
        }
        index += words[j].length + 1;
    }

    return 0;
}

const phoneBook = new Map();
const commands = [
    { word: [/^Создай$/,
        /^контакт$/,
        /^[^;]*$/],
    prev: [[-1], [0], [1]],
    run: createContact,
    insertInformation: function (word) {
        return { name: extractData(word, 'контакт').join('') };
    } },

    { word: [/^Удали$/,
        /^контакт$/,
        /^[^;]*$/],
    prev: [[-1], [0], [1]],
    run: deleteContact,
    insertInformation: function (word) {
        return { name: extractData(word, 'контакт').join('') };
    } },

    { word: [/^Добавь$/,
        /^телефон$/,
        /^\d{10}$/,
        /^и$/,
        /^почту$/,
        /^для$/,
        /^контакта$/,
        /^[^;]*$/],
    prev: [[-1], [0, 3], [1], [2, 7], [0, 3], [0, 2, 7], [5], [4, 6]],
    run: addInformationToContact,
    insertInformation: function (word) {
        return { name: extractData(word, 'контакта').join(''),
            phone: extractData(word, 'телефон'),
            email: extractData(word, 'почту') };
    } },

    { word: [/^Удали$/,
        /^телефон$/,
        /^\d{10}$/,
        /^и$/,
        /^почту$/,
        /^для$/,
        /^контакта$/,
        /^[^;]*$/],
    prev: [[-1], [0, 3], [1], [2, 7], [0, 3], [0, 2, 7], [5], [4, 6]],
    run: deleteInformationFromContact,
    insertInformation: function (word) {
        return { name: extractData(word, 'контакта').join(''),
            phone: extractData(word, 'телефон'),
            email: extractData(word, 'почту') };
    } },

    { word: [/^Покажи$/,
        /^почты$/,
        /^телефоны$/,
        /^имя$/,
        /^и$/,
        /^для$/,
        /^контактов,$/,
        /^где$/,
        /^есть$/,
        /^[^;]*$/],
    prev: [[-1], [0, 4], [0, 4], [0, 4], [1, 2, 3], [0, 1, 2, 3], [5], [6], [7], [8]],
    run: queryProcessing,
    insertInformation: function (word) {
        return { query: extractData(word, 'есть').join('') };
    } },

    { word: [/^Удали$/,
        /^контакты,$/,
        /^где$/,
        /^есть$/,
        /^[^;]*$/],
    prev: [[-1], [0], [1], [2], [3]],
    run: deleteContactWithQuery,
    insertInformation: function (word) {
        return { query: extractData(word, 'есть').join('') };
    } }];

function syntaxError(lineNumber, charNumber) {
    throw new Error(`SyntaxError: Unexpected token at ${lineNumber}:${charNumber}`);
}

function createContact(query, inf) {
    let name = inf.name;
    if (phoneBook.has(name) || inf.name === '') {
        return;
    }

    let contact = {
        name: name,
        phoneNumber: [],
        email: [],

        includes: function (myQuery) {
            let isSuit = false;
            isSuit = isSuit || contact.name.includes(myQuery);
            for (let phone of contact.phoneNumber) {
                isSuit = isSuit || phone.includes(myQuery);
            }
            for (let email of contact.email) {
                isSuit = isSuit || email.includes(myQuery);
            }

            return isSuit;
        },

        toString: function (fields) {
            let contactInf = [];
            for (let field of fields) {
                if (field === 'имя') {
                    contactInf.push(contact.name);
                }
                if (field === 'телефоны') {
                    let formatPhone = contact.phoneNumber.map((phone) => {
                        return `+7 (${
                            phone.slice(0, 3)}) ${
                            phone.slice(3, 6)}-${
                            phone.slice(6, 8)}-${
                            phone.slice(8)}`;
                    });
                    contactInf.push(formatPhone.join(','));
                }
                if (field === 'почты') {
                    contactInf.push(contact.email.join(','));
                }
            }

            return contactInf.join(';');
        }
    };
    phoneBook.set(name, contact);
}

function deleteContact(query, inf) {
    let name = inf.name;
    if (phoneBook.has(name)) {
        phoneBook.delete(name);
    }
}

function addUnique(array, elements) {
    for (let i = 0; i < elements.length; i++) {
        if (array.includes(elements[i])) {
            continue;
        }
        array.push(elements[i]);
    }
}

function addInformationToContact(query, inf) {
    if (!phoneBook.has(inf.name) || inf.name === '') {
        return;
    }

    let contact = phoneBook.get(inf.name);
    addUnique(contact.phoneNumber, inf.phone);
    addUnique(contact.email, inf.email);
}

function deleteElements(array, elements) {
    for (let i = 0; i < elements.length; i++) {
        if (array.includes(elements[i])) {
            let index = array.indexOf(elements[i]);
            array.splice(index, 1);
        }
    }
}

function deleteInformationFromContact(query, inf) {
    if (!phoneBook.has(inf.name) || inf.name === '') {
        return;
    }
    let contact = phoneBook.get(inf.name);
    deleteElements(contact.phoneNumber, inf.phone);
    deleteElements(contact.email, inf.email);

}

function findContact(query) {
    if (query === '') {
        return [];
    }

    let result = [];
    for (let contact of phoneBook.values()) {
        if (contact.includes(query)) {
            result.push(contact);
        }
    }

    return result;
}

function deleteContactWithQuery(query, inf) {
    let contacts = findContact(inf.query);
    for (let contact of contacts) {
        phoneBook.delete(contact.name);
    }
}

function indexesOfArray(array, element) {
    let indexes = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i] === element) {
            indexes.push(i);
        }
    }

    return indexes;
}

function checkEndCommands(queries) {
    if (queries[queries.length - 1] !== '') {
        return { line: queries.length, column: queries[queries.length - 1].length + 1 };
    }
}

function extractData(words, keyWord) {
    let data = [];
    let indexesData = indexesOfArray(words, keyWord);
    for (let index of indexesData) {
        data.push(words[index + 1]);
    }

    return data;
}

function queryProcessing(query, inf) {
    let contacts = findContact(inf.query);
    let fields = (query.slice(7, query.indexOf(' для'))).split(' и ');
    let answer = [];

    for (let contact of contacts) {
        let ans = contact.toString(fields);
        if (ans !== '') {
            answer.push(ans);
        }
    }

    return answer;
}

function runCommand(command, words, answer) {
    let inf = command.insertInformation(words);

    let ans = command.run(words.join(' '), inf);
    if (ans) {
        answer.push(...ans);
    }
}

function defineCommand(word) {
    let exception = 0;
    for (let command of commands) {
        let ex = isThisCommand(command, word);
        if (ex !== 0) {
            exception = Math.max(exception, ex);
            continue;
        }
        exception = 0;

        return { command, exception };
    }

    return { command: null, exception };
}

function findKeyWord(command, keyWord) {
    let indexQuery = command.indexOf(keyWord);
    if (indexQuery !== -1) {
        indexQuery += keyWord.length;

        return indexQuery;
    }

    return Number.MAX_VALUE;
}

function splitCommand(command) {
    let index = Math.min(findKeyWord(command, ' есть '),
        findKeyWord(command, ' контакт '),
        findKeyWord(command, ' контакта '));


    let query = (command.slice(index));
    command = command.slice(0, index - 1);

    return command.split(' ')
        .concat(query);
}

function run(query) {
    let answers = [];
    let queries = query.split(';');
    let exception = checkEndCommands(queries);
    let length = exception ? queries.length : queries.length - 1;
    for (let i = 0; i < length; i++) {
        let word = splitCommand(queries[i]);

        let define = defineCommand(word);
        if (define.command) {
            runCommand(define.command, word, answers);
        }
        if (define.exception !== 0) {
            syntaxError(i + 1, define.exception);
        }
    }
    if (exception) {
        syntaxError(exception.line, exception.column);
    }

    return answers;
}

module.exports = { phoneBook, run };
